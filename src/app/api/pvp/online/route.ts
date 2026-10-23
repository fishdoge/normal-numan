import { NextRequest, NextResponse } from "next/server";
import { sql, userFromToken, ensureSchema } from "@/lib/db";

export const runtime = "nodejs";

// 通天閣在線真仙名單(3.19 版新增):心跳在 20 秒內都算「在線」,只列出真仙以上(realm_idx 換算
// stage>=10,直接用資料庫存的 realmIdx 概略篩選,精確 stage 判定交給前端/挑戰當下再核實一次)。
export async function GET(req: NextRequest) {
  await ensureSchema();
  const user = await userFromToken(req.cookies.get("session")?.value);
  if (!user) return NextResponse.json({ error: "未登入" }, { status: 401 });

  const rows = await sql`
    SELECT u.id, u.name, (s.data->>'realmIdx')::int AS realm_idx
    FROM pvp_presence p
    JOIN users u ON u.id = p.user_id
    JOIN saves s ON s.user_id = p.user_id
    WHERE p.last_heartbeat_at > now() - interval '20 seconds'
      AND p.user_id != ${user.id}
      AND COALESCE((s.data->>'tongtianUnlocked')::boolean, false) = true
      AND COALESCE((s.data->>'dead')::boolean, false) = false
    ORDER BY u.name`;

  // 有沒有人剛好挑戰了我(3.19.2 版修正):發起挑戰是「發起即開打」,被挑戰的一方原本沒有任何管道
  // 得知自己被拉進了一場對戰——這裡讓在線名單頁順便查一次「我目前是不是某場 active 對戰的一方」,
  // 前端每次輪詢在線名單時就能自動偵測到、跳轉進對戰畫面,等同於「收到挑戰通知」。
  const myMatch = await sql`
    SELECT id FROM pvp_matches
    WHERE status = 'active' AND (challenger_id = ${user.id} OR opponent_id = ${user.id})
    LIMIT 1`;

  return NextResponse.json({
    ok: true,
    players: rows,
    activeMatchId: myMatch.length ? (myMatch[0] as { id: number }).id : null,
  });
}
