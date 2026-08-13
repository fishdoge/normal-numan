import { NextRequest, NextResponse } from "next/server";
import { validateEvent, WebhookVerificationError } from "@polar-sh/sdk/webhooks";
import { sql, ensureSchema } from "@/lib/db";
import { reviveSave, SaveData } from "@/game/engine";

export const runtime = "nodejs";

// POST:Polar 付款結果回呼(向仙班祈禱 · 六道輪迴盤付費復活的唯一權威觸發點)。
// 請至 Polar 後台 Settings > Webhooks 新增此網址,訂閱 order.paid 事件,並把顯示出來的
// Webhook Secret 填入環境變數 POLAR_WEBHOOK_SECRET。Polar 對送達失敗的請求會自動重送,
// 故整段邏輯務必冪等(見下方以 revival_requests.status 欄位做的原子搶佔)。
export async function POST(req: NextRequest) {
  await ensureSchema();

  const secret = process.env.POLAR_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[webhooks/polar] 缺少 POLAR_WEBHOOK_SECRET 環境變數,拒絕處理");
    return NextResponse.json({ error: "伺服器未設定" }, { status: 500 });
  }

  const rawBody = await req.text();
  const headers: Record<string, string> = {};
  req.headers.forEach((value, key) => {
    headers[key] = value;
  });

  let event;
  try {
    event = validateEvent(rawBody, headers, secret);
  } catch (err) {
    if (err instanceof WebhookVerificationError) {
      return NextResponse.json({ error: "簽章驗證失敗" }, { status: 400 });
    }
    return NextResponse.json({ error: "payload 格式錯誤" }, { status: 400 });
  }

  // 目前只用得到「訂單付款完成」事件,其餘事件類型一律直接確認收到、不處理
  if (event.type !== "order.paid") {
    return NextResponse.json({ ok: true, skipped: "wrong event type" });
  }

  const order = event.data;
  const token = order.checkoutId;
  if (!order.paid || !token) {
    return NextResponse.json({ ok: true, skipped: "not a paid order" });
  }

  // 原子搶佔本次請求(冪等關鍵:webhook 可能重送,僅第一次成功搶到 pending 狀態的呼叫會真正執行)
  const claim = await sql`
    UPDATE revival_requests SET status = 'processing', updated_at = now()
    WHERE token = ${token} AND status = 'pending'
    RETURNING user_id`;
  if (!claim.length) {
    return NextResponse.json({ ok: true, skipped: "already processed or unknown token" });
  }
  const userId = (claim[0] as { user_id: number }).user_id;

  const saveRows = await sql`SELECT data FROM saves WHERE user_id = ${userId}`;
  const save = (saveRows[0] as { data: SaveData } | undefined)?.data;
  if (!save || !save.dead) {
    // 存檔已不在道隕狀態(例如玩家已自行轉世重修)——不消耗終身一次的復活資格,標記待人工處理/退款
    await sql`UPDATE revival_requests SET status = 'failed', updated_at = now() WHERE token = ${token}`;
    return NextResponse.json({ ok: true, note: "no dead save to revive; needs manual follow-up" });
  }

  // 終身僅一次:確認有可復活的存檔後,才正式搶佔 revival_used 旗標
  const lock = await sql`
    UPDATE users SET revival_used = true WHERE id = ${userId} AND revival_used = false
    RETURNING id`;
  if (!lock.length) {
    await sql`UPDATE revival_requests SET status = 'failed', updated_at = now() WHERE token = ${token}`;
    return NextResponse.json({ ok: true, note: "revival already used; needs manual follow-up" });
  }

  reviveSave(save);
  await sql`UPDATE saves SET data = ${JSON.stringify(save)}::jsonb, updated_at = now() WHERE user_id = ${userId}`;
  await sql`UPDATE revival_requests SET status = 'done', updated_at = now() WHERE token = ${token}`;

  return NextResponse.json({ ok: true, revived: true });
}
