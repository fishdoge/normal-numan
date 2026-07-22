import { NextResponse } from "next/server";
import { sql, ensureSchema } from "@/lib/db";

export const runtime = "nodejs";

// 全服修仙榜:所有玩家按境界(realmIdx)→ 修為(exp)排序
export async function GET() {
  await ensureSchema();
  const rows = await sql`
    SELECT u.name,
      COALESCE((s.data->>'realmIdx')::int, 0) AS realm_idx,
      COALESCE((s.data->>'exp')::bigint, 0) AS exp,
      COALESCE((s.data->>'dead')::boolean, false) AS dead
    FROM saves s JOIN users u ON u.id = s.user_id
    WHERE COALESCE((s.data->>'started')::boolean, false) = true
    ORDER BY realm_idx DESC, exp DESC
    LIMIT 100`;
  return NextResponse.json({ ok: true, players: rows });
}
