import { NextRequest, NextResponse } from "next/server";
import { sql, ensureSchema } from "@/lib/db";

export const runtime = "nodejs";

// 排行榜:
//   預設(修仙榜)—— 所有玩家按境界(realmIdx)→ 修為(exp)排序
//   ?type=xian(真仙榜)—— 僅已飛昇真仙,按仙靈力(xianli)排序
export async function GET(req: NextRequest) {
  await ensureSchema();
  const type = req.nextUrl.searchParams.get("type");

  if (type === "xian") {
    const rows = await sql`
      SELECT u.name,
        COALESCE((s.data->>'realmIdx')::int, 0) AS realm_idx,
        COALESCE((s.data->>'xianli')::bigint, 0) AS xianli,
        COALESCE((s.data->>'dead')::boolean, false) AS dead
      FROM saves s JOIN users u ON u.id = s.user_id
      WHERE COALESCE((s.data->>'started')::boolean, false) = true
        AND COALESCE((s.data->>'xianli')::bigint, 0) > 0
      ORDER BY xianli DESC
      LIMIT 100`;
    return NextResponse.json({ ok: true, players: rows });
  }

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
