import { NextRequest, NextResponse } from "next/server";
import { sql, userFromToken, ensureSchema } from "@/lib/db";

export const runtime = "nodejs";

// GET:自己所屬宗門的成員清單 + 共享靈石庫存
export async function GET(req: NextRequest) {
  await ensureSchema();
  const user = await userFromToken(req.cookies.get("session")?.value);
  if (!user) return NextResponse.json({ error: "未登入" }, { status: 401 });

  const meRows = await sql`SELECT data->>'sectId' AS sect_id FROM saves WHERE user_id = ${user.id}`;
  const sectId = (meRows[0] as { sect_id: string | null } | undefined)?.sect_id;
  if (!sectId) return NextResponse.json({ ok: false, error: "尚未拜入宗門" }, { status: 400 });

  const members = await sql`
    SELECT u.name,
      COALESCE((s.data->>'realmIdx')::int, 0) AS realm_idx,
      COALESCE((s.data->>'exp')::bigint, 0) AS exp,
      COALESCE((s.data->>'dead')::boolean, false) AS dead,
      s.updated_at
    FROM saves s JOIN users u ON u.id = s.user_id
    WHERE s.data->>'sectId' = ${sectId}
      AND COALESCE((s.data->>'started')::boolean, false) = true
    ORDER BY realm_idx DESC, exp DESC
    LIMIT 200`;

  const bankRows = await sql`SELECT stones FROM sect_bank WHERE sect_id = ${sectId}`;
  const bank = Number((bankRows[0] as { stones: string | number } | undefined)?.stones ?? 0);

  return NextResponse.json({ ok: true, sectId, members, bank });
}

// POST:{ action: "deposit" | "withdraw", amount } —— 與宗門共享靈石庫存存取
export async function POST(req: NextRequest) {
  await ensureSchema();
  const user = await userFromToken(req.cookies.get("session")?.value);
  if (!user) return NextResponse.json({ error: "未登入" }, { status: 401 });

  const { action, amount } = await req.json();
  if (!Number.isInteger(amount) || amount < 1) {
    return NextResponse.json({ error: "數量須為正整數" }, { status: 400 });
  }
  if (action !== "deposit" && action !== "withdraw") {
    return NextResponse.json({ error: "未知操作" }, { status: 400 });
  }

  const meRows = await sql`SELECT data->>'sectId' AS sect_id FROM saves WHERE user_id = ${user.id}`;
  const sectId = (meRows[0] as { sect_id: string | null } | undefined)?.sect_id;
  if (!sectId) return NextResponse.json({ error: "尚未拜入宗門" }, { status: 400 });

  if (action === "deposit") {
    // 原子:扣自己靈石 → 存入宗門共享庫存(帳戶靈石不足則整體不生效)
    const rows = await sql`
      WITH upd AS (
        UPDATE saves SET data = jsonb_set(data, '{stones}',
          to_jsonb(COALESCE((data->>'stones')::bigint, 0) - ${amount}))
        WHERE user_id = ${user.id} AND COALESCE((data->>'stones')::bigint, 0) >= ${amount}
        RETURNING (data->>'stones')::bigint AS remaining
      ),
      bank AS (
        INSERT INTO sect_bank (sect_id, stones)
        SELECT ${sectId}, ${amount} WHERE EXISTS (SELECT 1 FROM upd)
        ON CONFLICT (sect_id) DO UPDATE SET stones = sect_bank.stones + EXCLUDED.stones, updated_at = now()
        RETURNING stones
      )
      SELECT (SELECT count(*) FROM upd) AS n,
             (SELECT stones FROM bank) AS bank_stones,
             (SELECT remaining FROM upd) AS remaining`;
    const r = rows[0] as { n: string; bank_stones: string | null; remaining: string | null };
    if (Number(r.n) === 0) return NextResponse.json({ error: "靈石不足" }, { status: 400 });
    return NextResponse.json({
      ok: true,
      stones: Number(r.remaining),
      bank: Number(r.bank_stones),
    });
  }

  // withdraw:原子:扣宗門共享庫存 → 存入自己靈石(庫存不足則整體不生效)
  const rows = await sql`
    WITH bank AS (
      UPDATE sect_bank SET stones = stones - ${amount}, updated_at = now()
      WHERE sect_id = ${sectId} AND stones >= ${amount}
      RETURNING stones
    ),
    upd AS (
      UPDATE saves SET data = jsonb_set(data, '{stones}',
        to_jsonb(COALESCE((data->>'stones')::bigint, 0) + ${amount}))
      WHERE user_id = ${user.id} AND EXISTS (SELECT 1 FROM bank)
      RETURNING (data->>'stones')::bigint AS newstones
    )
    SELECT (SELECT count(*) FROM bank) AS n,
           (SELECT stones FROM bank) AS bank_stones,
           (SELECT newstones FROM upd) AS newstones`;
  const r = rows[0] as { n: string; bank_stones: string | null; newstones: string | null };
  if (Number(r.n) === 0) return NextResponse.json({ error: "宗門庫存不足" }, { status: 400 });
  return NextResponse.json({ ok: true, stones: Number(r.newstones), bank: Number(r.bank_stones) });
}
