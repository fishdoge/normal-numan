import { NextRequest, NextResponse } from "next/server";
import { sql, userFromToken } from "@/lib/db";

export const runtime = "nodejs";

// GET:讀取存檔並結算離線壽元(每小時 +1 年)+ 交易行入帳
// 注意:沒有 PUT——存檔只能透過 /api/action 由伺服器引擎變更
export async function GET(req: NextRequest) {
  const user = await userFromToken(req.cookies.get("session")?.value);
  if (!user) return NextResponse.json({ error: "未登入" }, { status: 401 });

  // 原子:把 pending_stones(交易行貨款)入帳並歸零
  const credited = await sql`
    UPDATE saves SET
      data = jsonb_set(data, '{stones}',
        to_jsonb(COALESCE((data->>'stones')::bigint, 0) + pending_stones)),
      pending_stones = 0
    WHERE user_id = ${user.id} AND pending_stones > 0
    RETURNING pending_stones`;

  const rows = await sql`SELECT data, last_life_at FROM saves WHERE user_id = ${user.id}`;
  if (!rows.length) return NextResponse.json({ ok: true, save: null, name: user.name });

  const row = rows[0] as { data: Record<string, unknown>; last_life_at: string };
  const hours = Math.floor((Date.now() - new Date(row.last_life_at).getTime()) / 3600000);
  let lifeGained = 0;
  const save = row.data;

  if (hours > 0 && save && !save.dead) {
    lifeGained = hours;
    save.lifeBonus = ((save.lifeBonus as number) ?? 0) + lifeGained;
    await sql`
      UPDATE saves SET data = ${JSON.stringify(save)}::jsonb,
        last_life_at = last_life_at + make_interval(hours => ${hours})
      WHERE user_id = ${user.id}`;
  }

  return NextResponse.json({ ok: true, save, name: user.name, lifeGained, credited: credited.length > 0 });
}
