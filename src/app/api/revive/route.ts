import { NextRequest, NextResponse } from "next/server";
import { sql, userFromToken, ensureSchema } from "@/lib/db";
import { SaveData } from "@/game/engine";
import { polar, POLAR_PRODUCT_ID } from "@/lib/payments";

export const runtime = "nodejs";

// POST:玩家於死亡畫面點擊「向仙班祈禱」,向 Polar 建立一筆結帳工作階段(checkout session),
// 回傳付款連結。以 Polar 回傳的 checkout.id 作為本次請求的 token,復活的實際套用一律等
// /api/webhooks/polar 收到已驗證的付款成功通知後才會執行,此處僅登記請求、不涉及信任前端。
export async function POST(req: NextRequest) {
  await ensureSchema();
  const user = await userFromToken(req.cookies.get("session")?.value);
  if (!user) return NextResponse.json({ error: "未登入" }, { status: 401 });

  if (!POLAR_PRODUCT_ID) {
    return NextResponse.json(
      { error: "伺服器尚未設定付款商品(POLAR_PRODUCT_ID),請聯繫管理員。" },
      { status: 500 },
    );
  }

  const userRows = await sql`SELECT revival_used FROM users WHERE id = ${user.id}`;
  if ((userRows[0] as { revival_used: boolean } | undefined)?.revival_used) {
    return NextResponse.json(
      { error: "六道輪迴盤終身僅可使用一次,你已用過,此後只能轉世重修。" },
      { status: 400 },
    );
  }

  const saveRows = await sql`SELECT data FROM saves WHERE user_id = ${user.id}`;
  const save = (saveRows[0] as { data: SaveData } | undefined)?.data;
  if (!save || !save.dead) {
    return NextResponse.json({ error: "此刻並非道隕之時,無需向仙班祈禱。" }, { status: 400 });
  }

  let checkout;
  try {
    checkout = await polar.checkouts.create({
      products: [POLAR_PRODUCT_ID],
      successUrl: `${req.nextUrl.origin}/?revived=1&checkout_id={CHECKOUT_ID}`,
      externalCustomerId: String(user.id),
      metadata: { revival_user_id: String(user.id) },
    });
  } catch (err) {
    console.error("[revive] 建立 Polar 結帳工作階段失敗", err);
    return NextResponse.json({ error: "付款服務暫時無法使用,請稍後再試。" }, { status: 502 });
  }

  await sql`INSERT INTO revival_requests (token, user_id) VALUES (${checkout.id}, ${user.id})`;

  return NextResponse.json({ ok: true, token: checkout.id, url: checkout.url });
}

// GET ?token=... :供死亡畫面輪詢付款/復活進度
export async function GET(req: NextRequest) {
  await ensureSchema();
  const user = await userFromToken(req.cookies.get("session")?.value);
  if (!user) return NextResponse.json({ error: "未登入" }, { status: 401 });

  const token = req.nextUrl.searchParams.get("token");
  if (!token) return NextResponse.json({ error: "缺少 token" }, { status: 400 });

  const rows = await sql`
    SELECT status FROM revival_requests WHERE token = ${token} AND user_id = ${user.id}`;
  const status = (rows[0] as { status: string } | undefined)?.status ?? "not_found";
  return NextResponse.json({ ok: true, status });
}
