import { NextRequest, NextResponse } from "next/server";
import { sql, userFromToken, ensureSchema } from "@/lib/db";
import { itemById } from "@/game/data/items";
import { polar, blackMarketItemOf } from "@/lib/payments";

export const runtime = "nodejs";

// POST:{ itemId }——玩家於黑市點擊「購買」,向 Polar 建立結帳工作階段。
// 實際發放道具一律等 /api/webhooks/polar 收到已驗證的付款成功通知後才會執行,此處僅登記請求。
export async function POST(req: NextRequest) {
  await ensureSchema();
  const user = await userFromToken(req.cookies.get("session")?.value);
  if (!user) return NextResponse.json({ error: "未登入" }, { status: 401 });

  const itemId = String((await req.json())?.itemId ?? "");
  const bm = blackMarketItemOf(itemId);
  if (!bm) return NextResponse.json({ error: "無此黑市商品" }, { status: 400 });

  let checkout;
  try {
    checkout = await polar.checkouts.create({
      products: [bm.productId],
      successUrl: `${req.nextUrl.origin}/?purchased=1&checkout_id={CHECKOUT_ID}`,
      externalCustomerId: String(user.id),
      metadata: { purchase_user_id: String(user.id), item_id: itemId },
    });
  } catch (err) {
    console.error("[blackmarket] 建立 Polar 結帳工作階段失敗", err);
    return NextResponse.json({ error: "付款服務暫時無法使用,請稍後再試。" }, { status: 502 });
  }

  await sql`INSERT INTO item_purchase_requests (token, user_id, item_id) VALUES (${checkout.id}, ${user.id}, ${itemId})`;

  return NextResponse.json({
    ok: true,
    token: checkout.id,
    url: checkout.url,
    itemName: itemById(itemId)?.name ?? itemId,
  });
}

// GET ?token=... :供黑市頁面輪詢付款/發放進度
export async function GET(req: NextRequest) {
  await ensureSchema();
  const user = await userFromToken(req.cookies.get("session")?.value);
  if (!user) return NextResponse.json({ error: "未登入" }, { status: 401 });

  const token = req.nextUrl.searchParams.get("token");
  if (!token) return NextResponse.json({ error: "缺少 token" }, { status: 400 });

  const rows = await sql`
    SELECT status, item_id FROM item_purchase_requests WHERE token = ${token} AND user_id = ${user.id}`;
  const row = rows[0] as { status: string; item_id: string } | undefined;
  return NextResponse.json({
    ok: true,
    status: row?.status ?? "not_found",
    itemId: row?.item_id ?? null,
    itemName: row ? (itemById(row.item_id)?.name ?? row.item_id) : null,
  });
}
