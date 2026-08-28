import { NextRequest, NextResponse } from "next/server";
import { sql, userFromToken } from "@/lib/db";

export const runtime = "nodejs";

// GET:市場列表
export async function GET() {
  const rows = await sql`
    SELECT l.id, l.item_id, l.qty, l.price, l.seller_id, u.name AS seller_name
    FROM listings l JOIN users u ON u.id = l.seller_id
    ORDER BY l.created_at DESC LIMIT 200`;
  // price 為 BIGINT,驅動程式回傳字串以避免精度誤差,這裡轉回一般 number 給前端使用
  // (遊戲內靈石數量遠低於 Number.MAX_SAFE_INTEGER,轉換不會失真)
  const listings = rows.map((r) => ({ ...r, price: Number(r.price) }));
  return NextResponse.json({ ok: true, listings });
}

// POST:掛賣 { itemId, qty, price }
// 原子:單一語句內「驗庫存 → 扣物品 → 建掛單」,任何一步不成立整體不生效
export async function POST(req: NextRequest) {
  const user = await userFromToken(req.cookies.get("session")?.value);
  if (!user) return NextResponse.json({ error: "未登入" }, { status: 401 });
  const { itemId, qty, price } = await req.json();
  if (
    typeof itemId !== "string" ||
    !Number.isInteger(qty) ||
    qty < 1 ||
    !Number.isSafeInteger(price) ||
    price < 1
  ) {
    return NextResponse.json({ error: "參數有誤" }, { status: 400 });
  }

  const rows = await sql`
    WITH upd AS (
      UPDATE saves SET data = CASE
        WHEN COALESCE((data->'inventory'->>${itemId})::int, 0) - ${qty} <= 0
          THEN jsonb_set(data, '{inventory}', (data->'inventory') - ${itemId})
        ELSE jsonb_set(data, ARRAY['inventory', ${itemId}],
          to_jsonb(COALESCE((data->'inventory'->>${itemId})::int, 0) - ${qty}))
      END
      WHERE user_id = ${user.id}
        AND COALESCE((data->'inventory'->>${itemId})::int, 0) >= ${qty}
      RETURNING data
    ),
    ins AS (
      INSERT INTO listings (seller_id, item_id, qty, price)
      SELECT ${user.id}, ${itemId}, ${qty}, ${price}::bigint
      WHERE EXISTS (SELECT 1 FROM upd)
      RETURNING id
    )
    SELECT (SELECT id FROM ins) AS id, (SELECT data FROM upd) AS data`;

  const r = rows[0] as { id: number | null; data: { inventory: Record<string, number> } | null };
  if (!r?.id) return NextResponse.json({ error: "儲物袋中數量不足" }, { status: 400 });
  return NextResponse.json({ ok: true, id: r.id, inventory: r.data!.inventory });
}

// DELETE:{ id, action: "buy" | "cancel" }
export async function DELETE(req: NextRequest) {
  const user = await userFromToken(req.cookies.get("session")?.value);
  if (!user) return NextResponse.json({ error: "未登入" }, { status: 401 });
  const { id, action } = await req.json();
  if (!Number.isInteger(id)) return NextResponse.json({ error: "參數有誤" }, { status: 400 });

  if (action === "cancel") {
    // 原子:刪掛單 → 物品退回存檔
    const rows = await sql`
      WITH d AS (
        DELETE FROM listings WHERE id = ${id} AND seller_id = ${user.id} RETURNING item_id, qty
      ),
      upd AS (
        UPDATE saves SET data = jsonb_set(data, ARRAY['inventory', (SELECT item_id FROM d)],
          to_jsonb(COALESCE((data->'inventory'->>(SELECT item_id FROM d))::int, 0) + (SELECT qty FROM d)))
        WHERE user_id = ${user.id} AND EXISTS (SELECT 1 FROM d)
        RETURNING data
      )
      SELECT (SELECT count(*) FROM d) AS n, (SELECT data FROM upd) AS data`;
    const r = rows[0] as { n: string; data: { inventory: Record<string, number> } | null };
    if (!r || Number(r.n) === 0)
      return NextResponse.json({ error: "掛單不存在或非你所有" }, { status: 404 });
    return NextResponse.json({ ok: true, inventory: r.data!.inventory });
  }

  // buy — 原子:驗買家餘額 → 刪掛單(搶購時只有一人成功)→ 扣款+入袋 → 賣家 pending_stones 入帳
  const rows = await sql`
    WITH l AS (
      SELECT id, seller_id, item_id, qty, price FROM listings
      WHERE id = ${id} AND seller_id <> ${user.id}
    ),
    d AS (
      DELETE FROM listings WHERE id IN (
        SELECT l.id FROM l JOIN saves s ON s.user_id = ${user.id}
        WHERE COALESCE((s.data->>'stones')::bigint, 0) >= l.qty * l.price
      ) RETURNING seller_id, item_id, qty, price
    ),
    pay AS (
      UPDATE saves SET data = jsonb_set(
        jsonb_set(data, '{stones}',
          to_jsonb(COALESCE((data->>'stones')::bigint, 0) - (SELECT qty * price FROM d))),
        ARRAY['inventory', (SELECT item_id FROM d)],
        to_jsonb(COALESCE((data->'inventory'->>(SELECT item_id FROM d))::int, 0) + (SELECT qty FROM d)))
      WHERE user_id = ${user.id} AND EXISTS (SELECT 1 FROM d)
      RETURNING data
    ),
    cr AS (
      UPDATE saves SET pending_stones = pending_stones + (SELECT qty * price FROM d)
      WHERE user_id = (SELECT seller_id FROM d) AND EXISTS (SELECT 1 FROM d)
    )
    SELECT (SELECT count(*) FROM d) AS n,
           (SELECT data FROM pay) AS data,
           (SELECT item_id FROM d) AS item_id,
           (SELECT qty FROM d) AS qty,
           (SELECT qty * price FROM d) AS total`;

  const r = rows[0] as {
    n: string;
    data: { stones: number; inventory: Record<string, number> } | null;
    item_id: string | null;
    qty: number | null;
    total: string | null;
  };
  if (!r || Number(r.n) === 0) {
    return NextResponse.json({ error: "靈石不足,或此單已被買走/不可購買" }, { status: 400 });
  }
  return NextResponse.json({
    ok: true,
    stones: r.data!.stones,
    inventory: r.data!.inventory,
    itemId: r.item_id,
    qty: r.qty,
    total: Number(r.total),
  });
}
