import { NextRequest, NextResponse } from "next/server";
import { sql, userFromToken, ensureSchema } from "@/lib/db";
import { polar } from "@/lib/payments";

export const runtime = "nodejs";

const ORACLE_PRODUCT_ID = "27a281cf-dd56-4c6a-8dbc-077f9eaa96a7"; // 黑市 · 天算術(USD 50)

// POST:玩家於「天算術」機緣卡片點擊「支付」,向 Polar 建立結帳工作階段。
// 實際發放道具(隨機抽出)一律等 /api/webhooks/polar 收到已驗證的付款成功通知後才會執行,此處僅登記請求。
export async function POST(req: NextRequest) {
  await ensureSchema();
  const user = await userFromToken(req.cookies.get("session")?.value);
  if (!user) return NextResponse.json({ error: "未登入" }, { status: 401 });

  const saveRows = await sql`SELECT data FROM saves WHERE user_id = ${user.id}`;
  const save = (saveRows[0] as { data: { oracleOffered?: boolean } } | undefined)?.data;
  if (!save?.oracleOffered) {
    return NextResponse.json({ error: "此刻並無天算機緣,無法購買。" }, { status: 400 });
  }

  let checkout;
  try {
    checkout = await polar.checkouts.create({
      products: [ORACLE_PRODUCT_ID],
      successUrl: `${req.nextUrl.origin}/?purchased=1&checkout_id={CHECKOUT_ID}`,
      externalCustomerId: String(user.id),
      metadata: { purchase_user_id: String(user.id), kind: "oracle" },
    });
  } catch (err) {
    console.error("[oracle] 建立 Polar 結帳工作階段失敗", err);
    return NextResponse.json({ error: "付款服務暫時無法使用,請稍後再試。" }, { status: 502 });
  }

  await sql`INSERT INTO oracle_requests (token, user_id) VALUES (${checkout.id}, ${user.id})`;

  return NextResponse.json({ ok: true, token: checkout.id, url: checkout.url });
}

// GET ?token=... :供黑市天算術卡片輪詢付款/發放進度
export async function GET(req: NextRequest) {
  await ensureSchema();
  const user = await userFromToken(req.cookies.get("session")?.value);
  if (!user) return NextResponse.json({ error: "未登入" }, { status: 401 });

  const token = req.nextUrl.searchParams.get("token");
  if (!token) return NextResponse.json({ error: "缺少 token" }, { status: 400 });

  const rows = await sql`
    SELECT status FROM oracle_requests WHERE token = ${token} AND user_id = ${user.id}`;
  const row = rows[0] as { status: string } | undefined;
  return NextResponse.json({ ok: true, status: row?.status ?? "not_found" });
}
