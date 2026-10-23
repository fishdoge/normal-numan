import { NextRequest, NextResponse } from "next/server";
import { sql, userFromToken, ensureSchema } from "@/lib/db";
import { SaveData } from "@/game/engine";
import { REALMS } from "@/game/data/realms";

export const runtime = "nodejs";

// 通天閣心跳(3.19 版新增):前端在通天閣頁面開著時每 5~8 秒打一次,更新「最後上線時間」,
// 供 /api/pvp/online 判斷誰目前在線——沒有常駐連線,單純用時間戳模擬「上線中」。
export async function POST(req: NextRequest) {
  await ensureSchema();
  const user = await userFromToken(req.cookies.get("session")?.value);
  if (!user) return NextResponse.json({ error: "未登入" }, { status: 401 });

  const rows = await sql`SELECT data FROM saves WHERE user_id = ${user.id}`;
  const save = (rows[0] as { data: SaveData } | undefined)?.data;
  if (!save || !save.started || save.dead) {
    return NextResponse.json({ error: "尚未開始遊戲" }, { status: 400 });
  }
  const stage = REALMS[save.realmIdx]?.stage ?? 1;
  if (stage < 10 || !save.tongtianUnlocked) {
    return NextResponse.json({ error: "尚無通天閣進場資格" }, { status: 403 });
  }

  await sql`
    INSERT INTO pvp_presence (user_id, last_heartbeat_at) VALUES (${user.id}, now())
    ON CONFLICT (user_id) DO UPDATE SET last_heartbeat_at = now()`;

  return NextResponse.json({ ok: true });
}
