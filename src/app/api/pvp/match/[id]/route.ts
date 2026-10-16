import { NextRequest, NextResponse } from "next/server";
import { sql, userFromToken, ensureSchema } from "@/lib/db";
import { PvpMatchState, playMove, endTurn, isMatchOver, PVP_TURN_SECONDS } from "@/game/pvpEngine";

export const runtime = "nodejs";

interface MatchRow {
  id: number;
  challenger_id: number;
  opponent_id: number;
  status: string;
  round_deadline: string;
  state: PvpMatchState;
}

// 回傳給前端時,永遠把「發出這次請求的玩家」排在 fighters[0],前端不需要知道自己的 userId
// 也能正確分辨「我方/對方」——儲存在 DB 裡的原始順序(challenger/opponent)維持不變,只在回應時重排。
// turnUserId/firstUserId/winnerId 本來就是存 userId,不受陣列順序影響,不用另外處理。
function viewFor(state: PvpMatchState, userId: number): PvpMatchState {
  if (state.fighters[0].userId === userId) return state;
  return { ...state, fighters: [state.fighters[1], state.fighters[0]] };
}

async function loadMatch(id: number, userId: number): Promise<MatchRow | null> {
  const rows = await sql`
    SELECT id, challenger_id, opponent_id, status, round_deadline, state FROM pvp_matches WHERE id = ${id}`;
  const row = rows[0] as MatchRow | undefined;
  if (!row) return null;
  if (row.challenger_id !== userId && row.opponent_id !== userId) return null;
  return row;
}

// 逾時自動結算(3.19 版新增):GET/POST 進來時都先檢查回合是否已過期,過期就把目前輪到的那一方
// 當「主動結束回合」處理(等同按兵不動略過),讓「20 秒沒出手就自動換手」不需要額外的排程系統,
// 靠玩家自己或對手下一次輪詢/出牌時順便觸發。
async function settleIfExpired(row: MatchRow): Promise<MatchRow> {
  if (row.status !== "active") return row;
  if (new Date(row.round_deadline).getTime() > Date.now()) return row;
  const nextState = endTurn(row.state);
  const finished = isMatchOver(nextState);
  const updated = await sql`
    UPDATE pvp_matches
    SET state = ${JSON.stringify(nextState)}::jsonb,
        status = ${finished ? "finished" : "active"},
        round_deadline = now() + interval '20 seconds',
        updated_at = now()
    WHERE id = ${row.id}
    RETURNING id, challenger_id, opponent_id, status, round_deadline, state`;
  return updated[0] as MatchRow;
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await ensureSchema();
  const user = await userFromToken(req.cookies.get("session")?.value);
  if (!user) return NextResponse.json({ error: "未登入" }, { status: 401 });
  const { id } = await params;
  let row = await loadMatch(Number(id), user.id);
  if (!row) return NextResponse.json({ error: "無此對戰" }, { status: 404 });
  row = await settleIfExpired(row);
  return NextResponse.json({
    ok: true,
    matchId: row.id,
    status: row.status,
    roundDeadline: row.round_deadline,
    roundSeconds: PVP_TURN_SECONDS,
    state: viewFor(row.state, user.id),
  });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await ensureSchema();
  const user = await userFromToken(req.cookies.get("session")?.value);
  if (!user) return NextResponse.json({ error: "未登入" }, { status: 401 });
  const { id } = await params;
  let row = await loadMatch(Number(id), user.id);
  if (!row) return NextResponse.json({ error: "無此對戰" }, { status: 404 });
  row = await settleIfExpired(row);
  if (row.status !== "active") {
    return NextResponse.json({
      ok: true,
      matchId: row.id,
      status: row.status,
      roundDeadline: row.round_deadline,
      roundSeconds: PVP_TURN_SECONDS,
      state: viewFor(row.state, user.id),
    });
  }

  if (row.state.turnUserId !== user.id) {
    return NextResponse.json({ error: "現在不是你的回合" }, { status: 400 });
  }

  const body = await req.json();
  const wantsEndTurn = !!body?.endTurn;
  const techIds = Array.isArray(body?.techIds) ? body.techIds.map(String) : [];

  const startingTurnUserId = row.state.turnUserId;
  let nextState = row.state;
  if (techIds.length > 0) {
    nextState = playMove(nextState, user.id, techIds);
  }
  // 玩家出完想出的牌後仍是自己的回合(法力還夠、沒打終結技)才需要再手動結束回合;
  // playMove 本身在法力耗盡/打出終結技時已經會自動結束回合。
  if (wantsEndTurn && nextState.turnUserId === user.id && !isMatchOver(nextState)) {
    nextState = endTurn(nextState);
  }
  const finished = isMatchOver(nextState);
  // 20 秒是「整個回合」的思考時間,不是每次出牌都重算——只有真的換手(或對戰結束)才重設倒數,
  // 同一回合內連續出好幾批牌不會偷跑到新的 20 秒。
  const turnChanged = nextState.turnUserId !== startingTurnUserId;

  const updated = await sql`
    UPDATE pvp_matches
    SET state = ${JSON.stringify(nextState)}::jsonb,
        status = ${finished ? "finished" : "active"},
        round_deadline = CASE WHEN ${turnChanged || finished} THEN now() + interval '20 seconds' ELSE round_deadline END,
        updated_at = now()
    WHERE id = ${row.id}
    RETURNING id, status, round_deadline, state`;
  const updatedRow = updated[0] as { id: number; status: string; round_deadline: string; state: PvpMatchState };
  return NextResponse.json({
    ok: true,
    matchId: updatedRow.id,
    status: updatedRow.status,
    roundDeadline: updatedRow.round_deadline,
    roundSeconds: PVP_TURN_SECONDS,
    state: viewFor(updatedRow.state, user.id),
  });
}
