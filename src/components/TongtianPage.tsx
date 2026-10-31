"use client";

// 通天閣(3.19 版新增,3.19.1 改為先後手回合制):真仙以上、持有通天令者可進場的即時 PvP 大廳。
// 沒有常駐連線,靠短間隔輪詢做出「體感即時」——上線名單心跳每 6 秒送一次,對戰狀態每 1.5 秒輪詢
// 一次,每回合 20 秒思考時間由伺服器權威計時。/api/pvp/match/[id] 永遠把發出請求的玩家排在
// fighters[0],這裡不需要另外處理「哪個是我方」。
import { useCallback, useEffect, useRef, useState } from "react";
import { useGame } from "@/game/store";
import { techById } from "@/game/data/techniques";
import { techDisplayName } from "@/i18n/techText";
import type { DictKey } from "@/i18n/dict";
import { useT } from "@/i18n/useT";
import { formatHpPair } from "@/game/types";

interface OnlinePlayer {
  id: number;
  name: string;
  realm_idx: number;
}

interface StatusEffectView {
  kind: "burn" | "poison" | "freeze" | "weaken" | "evade";
  turns: number;
}

interface PvpFighterView {
  userId: number;
  name: string;
  hp: number;
  hpMax: number;
  mp: number;
  mpMax: number;
  atk: number;
  weaponEl?: string;
  hand: string[];
  deck: string[];
  discard: string[];
  status: StatusEffectView[];
  shield: number;
}

interface MatchView {
  matchId: number;
  status: string;
  roundDeadline: string;
  roundSeconds: number;
  state: {
    turn: number;
    turnUserId: number;
    firstUserId: number;
    fighters: [PvpFighterView, PvpFighterView];
    log: string[];
    winnerId?: number | null;
  };
}

const STATUS_KEY: Record<StatusEffectView["kind"], DictKey> = {
  burn: "statusBurn",
  poison: "statusPoison",
  freeze: "statusFreeze",
  weaken: "statusWeaken",
  evade: "statusEvade",
};

export default function TongtianPage() {
  const setMainView = useGame((x) => x.setMainView);
  const lang = useGame((x) => x.language);
  const t = useT();

  const [players, setPlayers] = useState<OnlinePlayer[]>([]);
  const [match, setMatch] = useState<MatchView | null>(null);
  const [selected, setSelected] = useState<number[]>([]);
  const [now, setNow] = useState(Date.now());
  const [err, setErr] = useState("");
  const matchIdRef = useRef<number | null>(null);

  const heartbeat = useCallback(async () => {
    try {
      await fetch("/api/pvp/heartbeat", { method: "POST" });
    } catch {
      /* 心跳失敗不影響其他功能,下次輪詢再試 */
    }
  }, []);

  const refreshMatch = useCallback(async (id: number) => {
    try {
      const j = await (await fetch(`/api/pvp/match/${id}`)).json();
      if (j.ok) {
        setMatch(j);
        setSelected([]);
      }
    } catch {
      /* ignore */
    }
  }, []);

  // 在線名單順便回報「我目前是不是被拉進了一場對戰」(見 /api/pvp/online):被挑戰的一方原本
  // 沒有其他管道能發現自己被挑戰,靠這裡的輪詢自動偵測、跳轉進對戰畫面,等同「收到挑戰通知」。
  const refreshOnline = useCallback(async () => {
    try {
      const j = await (await fetch("/api/pvp/online")).json();
      if (!j.ok) return;
      setPlayers(j.players ?? []);
      if (j.activeMatchId) {
        await refreshMatch(j.activeMatchId);
      }
    } catch {
      /* ignore */
    }
  }, [refreshMatch]);

  useEffect(() => {
    heartbeat();
    refreshOnline();
    const hb = window.setInterval(heartbeat, 6000);
    const tick = window.setInterval(() => setNow(Date.now()), 1000);
    return () => {
      window.clearInterval(hb);
      window.clearInterval(tick);
    };
  }, [heartbeat, refreshOnline]);

  useEffect(() => {
    matchIdRef.current = match?.matchId ?? null;
  }, [match?.matchId]);

  useEffect(() => {
    if (!match) {
      const poll = window.setInterval(refreshOnline, 4000);
      return () => window.clearInterval(poll);
    }
    if (match.status !== "active") return;
    const poll = window.setInterval(() => {
      if (matchIdRef.current) refreshMatch(matchIdRef.current);
    }, 1500);
    return () => window.clearInterval(poll);
  }, [match, refreshOnline, refreshMatch]);

  const challenge = async (opponentId: number) => {
    setErr("");
    try {
      const res = await fetch("/api/pvp/challenge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ opponentId }),
      });
      const j = await res.json();
      if (!j.ok) {
        setErr(j.error ?? t("actionNetErr"));
        return;
      }
      await refreshMatch(j.matchId);
    } catch {
      setErr(t("actionNetErr"));
    }
  };

  const toggleCard = (slot: number) => {
    setSelected((prev) => (prev.includes(slot) ? prev.filter((x) => x !== slot) : [...prev, slot]));
  };

  const playSelected = async () => {
    if (!match || selected.length === 0) return;
    const myHand = match.state.fighters[0].hand;
    const techIds = selected.map((i) => myHand[i]).filter(Boolean);
    try {
      const res = await fetch(`/api/pvp/match/${match.matchId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ techIds }),
      });
      const j = await res.json();
      if (j.ok) setMatch(j);
    } catch {
      /* ignore,下一次輪詢會同步狀態 */
    }
  };

  const endMyTurn = async () => {
    if (!match) return;
    try {
      const res = await fetch(`/api/pvp/match/${match.matchId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endTurn: true }),
      });
      const j = await res.json();
      if (j.ok) setMatch(j);
    } catch {
      /* ignore */
    }
  };

  if (!match) {
    return (
      <main className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex items-baseline justify-between mb-5">
          <div>
            <h1 className="text-2xl font-black tracking-[0.35em] text-red-400">{t("tongtianHall")}</h1>
            <p className="font-mono text-[10px] tracking-[0.4em] text-faded">TONGTIAN PAVILION</p>
          </div>
          <button className="btn" onClick={() => setMainView("game")}>
            {t("sectBack")}
          </button>
        </div>
        {err && <p className="text-sm text-vermillion mb-3">{err}</p>}
        <div className="panel deco-frame space-y-2">
          <p className="text-sm text-faded">{t("tongtianOnlineDesc")}</p>
          {players.length === 0 && <p className="text-sm text-faded/70">{t("tongtianNoOne")}</p>}
          {players.map((p) => (
            <div key={p.id} className="flex items-center justify-between border border-faded/20 rounded-sm p-2.5">
              <span className="font-bold text-fuchsia-300">{p.name}</span>
              <button className="btn border-red-600/60 text-red-400" onClick={() => challenge(p.id)}>
                {t("tongtianChallengeBtn")}
              </button>
            </div>
          ))}
        </div>
      </main>
    );
  }

  const meView = match.state.fighters[0];
  const oppView = match.state.fighters[1];
  const myHand = meView.hand;
  const deadlineMs = new Date(match.roundDeadline).getTime();
  const secondsLeft = Math.max(0, Math.ceil((deadlineMs - now) / 1000));
  const myTurn = match.state.turnUserId === meView.userId;
  const isFirst = match.state.firstUserId === meView.userId;
  const finished = match.status === "finished";
  const won = finished && match.state.winnerId === meView.userId;
  const tied = finished && match.state.winnerId === null;

  const statusChips = (list: StatusEffectView[]) =>
    list.length === 0 ? (
      <span className="chip text-faded/50 border-faded/20">{t("statusNone")}</span>
    ) : (
      list.map((e) => (
        <span key={e.kind} className="chip text-vermillion border-vermillion/50">
          {t(STATUS_KEY[e.kind])} · {e.turns}
        </span>
      ))
    );

  return (
    <main className="max-w-5xl mx-auto px-4 py-6">
      <div className="flex items-baseline justify-between mb-5">
        <div>
          <h1 className="text-2xl font-black tracking-[0.35em] text-red-400">{t("tongtianHall")}</h1>
          <p className="font-mono text-[10px] tracking-[0.4em] text-faded">
            {t("tongtianTurnLabel").replace("{n}", String(match.state.turn))}
          </p>
        </div>
        <button className="btn" onClick={() => setMainView("game")}>
          {t("sectBack")}
        </button>
      </div>

      {finished && (
        <div className={`panel deco-frame mb-3 ${won ? "border-gold/60" : "border-vermillion/60"}`}>
          <p className="text-lg font-bold">
            {tied ? t("tongtianTied") : won ? t("tongtianWon") : t("tongtianLost")}
          </p>
          <button className="btn mt-2" onClick={() => setMatch(null)}>
            {t("sectBack")}
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className={`panel deco-frame ${myTurn && !finished ? "border-gold/60" : ""}`}>
          <div className="flex items-baseline justify-between">
            <p className="font-bold text-fuchsia-300">{meView.name}</p>
            <span className="chip text-fuchsia-300 border-fuchsia-400/50">
              {isFirst ? t("tongtianFirstMove") : t("tongtianSecondMove")}
            </span>
          </div>
          <p className="text-sm mt-1">
            {t("statHp")}: {formatHpPair(meView.hp, meView.hpMax)}
          </p>
          <p className="text-sm">
            {t("statMp")}: {meView.mp} / {meView.mpMax}
          </p>
          {meView.shield > 0 && <p className="text-sm text-jade">{t("combatShieldChip").replace("{n}", String(meView.shield))}</p>}
          <div className="flex flex-wrap gap-1.5 mt-1">{statusChips(meView.status)}</div>
        </div>
        <div className={`panel deco-frame ${!myTurn && !finished ? "border-vermillion/60" : ""}`}>
          <div className="flex items-baseline justify-between">
            <p className="font-bold text-vermillion">{oppView.name}</p>
            <span className="chip text-vermillion border-vermillion/50">
              {isFirst ? t("tongtianSecondMove") : t("tongtianFirstMove")}
            </span>
          </div>
          <p className="text-sm mt-1">
            {t("statHp")}: {formatHpPair(oppView.hp, oppView.hpMax)}
          </p>
          <p className="text-sm">
            {t("statMp")}: {oppView.mp} / {oppView.mpMax}
          </p>
          {oppView.shield > 0 && <p className="text-sm text-jade">{t("combatShieldChip").replace("{n}", String(oppView.shield))}</p>}
          <div className="flex flex-wrap gap-1.5 mt-1">{statusChips(oppView.status)}</div>
          <p className="text-xs text-faded mt-2">
            {t("tongtianOppDeckInfo")
              .replace("{hand}", String(oppView.hand.length))
              .replace("{deck}", String(oppView.deck.length))
              .replace("{discard}", String(oppView.discard.length))}
          </p>
          {oppView.weaponEl && (
            <p className="text-xs text-faded">{t("tongtianOppWeaponEl").replace("{el}", oppView.weaponEl)}</p>
          )}
        </div>
      </div>

      {!finished && (
        <div className="panel deco-frame mb-3">
          {myTurn ? (
            <>
              <p className="text-sm text-faded mb-2">{t("tongtianTimeLeft").replace("{n}", String(secondsLeft))}</p>
              <div className="grid grid-cols-3 gap-2 mb-2">
                {myHand.map((id, i) => {
                  const tech = techById(id);
                  const chosen = selected.includes(i);
                  return (
                    <button
                      key={`${id}-${i}`}
                      onClick={() => toggleCard(i)}
                      className={`border rounded-sm p-2 text-left text-xs ${chosen ? "border-gold bg-gold/10" : "border-faded/20"}`}
                    >
                      <div className="font-bold">{techDisplayName(tech, lang)}</div>
                      <div className="text-faded">
                        {t("statMp")} {tech.mpCost} · {tech.power.toFixed(1)}
                      </div>
                    </button>
                  );
                })}
              </div>
              <div className="flex gap-2">
                <button className="btn border-red-600/60 text-red-400" disabled={selected.length === 0} onClick={playSelected}>
                  {t("tongtianSubmitBtn")}
                </button>
                <button className="btn" onClick={endMyTurn}>
                  {t("tongtianEndTurnBtn")}
                </button>
              </div>
            </>
          ) : (
            <p className="text-sm text-faded">{t("tongtianWaitingOpponent").replace("{n}", String(secondsLeft))}</p>
          )}
        </div>
      )}

      <details className="battle-tactics battle-log">
        <summary>{t("logTitle")}</summary>
        <ol>
          {match.state.log.map((line, i) => (
            <li key={i}>{line}</li>
          ))}
        </ol>
      </details>
    </main>
  );
}
