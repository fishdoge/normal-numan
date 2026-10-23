import { NextRequest, NextResponse } from "next/server";
import { sql, userFromToken, ensureSchema } from "@/lib/db";
import { SaveData } from "@/game/engine";
import { REALMS } from "@/game/data/realms";
import { buildPvpFighter, newMatch } from "@/game/pvpEngine";

export const runtime = "nodejs";

// 發起挑戰(3.19 版新增):簡化為「發起即開打」,不做接受/拒絕流程——雙方都需持有通天令、
// 真仙以上,且目前皆不在其他對戰中,才能建立新的一場 pvp_matches。
export async function POST(req: NextRequest) {
  await ensureSchema();
  const user = await userFromToken(req.cookies.get("session")?.value);
  if (!user) return NextResponse.json({ error: "未登入" }, { status: 401 });

  const { opponentId } = await req.json();
  const oppId = Number(opponentId);
  if (!oppId || oppId === user.id) {
    return NextResponse.json({ error: "對象無效" }, { status: 400 });
  }

  const existing = await sql`
    SELECT id FROM pvp_matches
    WHERE status = 'active' AND (challenger_id = ${user.id} OR opponent_id = ${user.id})`;
  if (existing.length) {
    return NextResponse.json({ ok: true, matchId: (existing[0] as { id: number }).id });
  }

  const rows = await sql`
    SELECT user_id, data FROM saves WHERE user_id IN (${user.id}, ${oppId})`;
  const byId = new Map((rows as { user_id: number; data: SaveData }[]).map((r) => [r.user_id, r.data]));
  const meSave = byId.get(user.id);
  const oppSave = byId.get(oppId);
  if (!meSave || !oppSave) return NextResponse.json({ error: "找不到對方的道友存檔" }, { status: 400 });

  for (const [uid, s] of [[user.id, meSave] as const, [oppId, oppSave] as const]) {
    const stage = REALMS[s.realmIdx]?.stage ?? 1;
    if (stage < 10 || !s.tongtianUnlocked) {
      return NextResponse.json(
        { error: uid === user.id ? "你尚無通天閣進場資格" : "對方尚無通天閣進場資格" },
        { status: 403 },
      );
    }
  }

  const oppOngoing = await sql`
    SELECT id FROM pvp_matches WHERE status = 'active' AND (challenger_id = ${oppId} OR opponent_id = ${oppId})`;
  if (oppOngoing.length) {
    return NextResponse.json({ error: "對方目前正在對戰中,請稍後再挑戰" }, { status: 409 });
  }

  // 用角色名(存檔裡的 name)而非帳號登入名,跟遊戲內其他地方顯示的名字一致
  const fighterA = buildPvpFighter(user.id, meSave.name, meSave);
  const fighterB = buildPvpFighter(oppId, oppSave.name, oppSave);
  const state = newMatch(fighterA, fighterB); // 挑戰發起方(user)固定為先手

  // 回合秒數是固定常數,直接寫死在 SQL 文字裡的 interval 字面量——不能用 ${} 帶入引號內的 interval
  // 字串(Postgres 的參數化查詢不會對字串字面量內部做參數替換)。
  const inserted = await sql`
    INSERT INTO pvp_matches (challenger_id, opponent_id, status, round_deadline, state)
    VALUES (${user.id}, ${oppId}, 'active', now() + interval '20 seconds', ${JSON.stringify(state)}::jsonb)
    RETURNING id`;

  return NextResponse.json({ ok: true, matchId: (inserted[0] as { id: number }).id });
}
