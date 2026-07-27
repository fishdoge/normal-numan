"use client";

import { useCallback, useEffect, useState } from "react";
import { useGame, statsOf, maxLifeOf, cultCostOf, Modal } from "@/game/store";
import { REALMS } from "@/game/data/realms";
import AuthGate from "./AuthGate";
import CharCreate from "./CharCreate";
import ActionTabs from "./ActionTabs";
import { StatusPanel, LogPanel, CombatPanel } from "./panels";

function DeathScreen() {
  const s = useGame((x) => x.save)!;
  const act = useGame((x) => x.act);
  return (
    <main className="max-w-2xl mx-auto px-4 py-24 text-center">
      <p className="font-mono text-xs tracking-[0.5em] text-faded mb-4">HERE LIES A TRADER</p>
      <h1 className="text-5xl font-black tracking-widest text-vermillion mb-6">資 產 歸 零</h1>
      <div className="panel deco-frame text-left mx-auto max-w-md mb-8">
        <p className="panel-title">交 易 遺 言</p>
        <p className="leading-loose text-cream">
          {s.name},操盤 {maxLifeOf(s)} 載,爆倉出局於【{REALMS[s.realmIdx].name}】。
          <br />
          交易生涯 {s.day} 年,終究未能登頂封神。
          <br />
          盤海無涯誰為峰?一朝爆倉萬事空。
        </p>
      </div>
      <button className="btn text-lg px-10 py-3" onClick={() => act("reset")}>
        重 新 入 場
      </button>
    </main>
  );
}

// 通用彈窗(突破結果 / 戰利品 / 採集所得)
function ResultModal({ modal, onClose }: { modal: Modal; onClose: () => void }) {
  const ok = modal.success !== false;
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className={`panel deco-frame max-w-md w-full mx-4 text-center animate-floatUp ${
          ok ? "border-gold/60" : "border-vermillion/60"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          className={`text-3xl font-black tracking-[0.3em] my-4 ${ok ? "text-gold" : "text-vermillion"}`}
        >
          {modal.title}
        </h2>
        <div className="space-y-2 text-cream leading-relaxed mb-6 text-left px-2">
          {modal.lines.map((l, i) => (
            <p key={i}>{l}</p>
          ))}
        </div>
        <button className="btn px-8 mb-2" onClick={onClose}>
          知 曉
        </button>
      </div>
    </div>
  );
}

// 頂部跑馬燈:假行情 + web3 幽默(純裝飾)
function TickerBar() {
  const ticks = [
    ["$BTC", "+4.20%", true],
    ["$ETH", "+6.90%", true],
    ["$LDZ", "+42069%", true],
    ["$DOGE", "-3.14%", false],
    ["$歸零幣", "-99.9%", false],
    ["$貔貅盤", "只進不出", false],
    ["$SOL", "+12.3%", true],
    ["$小丑倉", "-100%", false],
    ["$阿兜幣", "+8.88%", true],
    ["$天台券", "sold out", false],
    ["$PEPE", "+21.0%", true],
    ["$FOMO", "+3.33%", true],
  ] as const;
  const row = (
    <div className="flex shrink-0 gap-6 pr-6">
      {ticks.map(([sym, chg, up], i) => (
        <span key={i} className="flex items-center gap-1.5 font-mono text-xs">
          <span className="text-cream">{sym}</span>
          <span className={up ? "text-jade" : "text-vermillion"}>{chg}</span>
        </span>
      ))}
    </div>
  );
  return (
    <div className="border-y border-smoke bg-coal/60 overflow-hidden py-1.5 mb-4">
      <div className="flex w-max animate-ticker">
        {row}
        {row}
      </div>
    </div>
  );
}

// 修煉欄:置頂、醒目
function CultivationBar() {
  const s = useGame((x) => x.save)!;
  const act = useGame((x) => x.act);
  const busy = useGame((x) => x.busy);
  const { realm, hpMax } = statsOf(s);
  const inCombat = !!s.combat;
  const expNeed = realm.expNeed;
  const canBreak = s.exp >= expNeed;
  const cost = cultCostOf(s);
  return (
    <div className={`panel deco-frame ${canBreak ? "border-gold/70" : ""}`}>
      <div className="flex flex-wrap items-center gap-3">
        <p className="panel-title mb-0 mr-2">操盤台</p>
        <button
          className="btn btn-buy text-base px-5 py-2"
          disabled={busy || inCombat}
          onClick={() => act("cultivate")}
        >
          進修苦研 <span className="ml-1 font-mono text-xs">-{cost} 載資產</span>
        </button>
        <button
          className="btn text-base px-5 py-2"
          disabled={busy || inCombat || s.hp >= hpMax}
          onClick={() => act("rest")}
        >
          休息(回復倉位)
        </button>
        <button
          className="btn text-base px-5 py-2 border-gold/50 text-gold hover:bg-gold/15 hover:border-gold"
          disabled={busy || inCombat || s.stones < 100000000}
          onClick={() => act("wander")}
          title="消耗 5000 載資產 + 1 億美金。約 5% 觸發鏈上探索(綠色機緣),約 2.5% 直接得操盤私鑰,30% 得永久盤感,1% 遇巨鯨,餘則一無所獲。"
        >
          鏈上遊獵
        </button>
        <button
          className={`btn text-base px-5 py-2 ${canBreak ? "border-gold text-gold animate-pulse" : ""}`}
          disabled={busy || inCombat || !canBreak}
          onClick={() => act("breakthrough")}
          title={canBreak ? "" : `需交易量 ${expNeed}`}
        >
          升等考核{canBreak ? "!" : ""}
        </button>
        <span className="text-xs text-faded ml-auto font-mono tnum">
          交易量 {s.exp}/{expNeed} · 考核失敗折損最大資產 15%
        </span>
      </div>
    </div>
  );
}

export default function Game() {
  const save = useGame((x) => x.save);
  const setSave = useGame((x) => x.setSave);
  const loot = useGame((x) => x.loot);
  const breakResult = useGame((x) => x.breakResult);
  const closeLoot = useGame((x) => x.closeLoot);
  const closeBreak = useGame((x) => x.closeBreak);
  const act = useGame((x) => x.act);
  const [auth, setAuth] = useState<"checking" | "anon" | "authed">("checking");
  const [userName, setUserName] = useState("");

  const loadSave = useCallback(async () => {
    try {
      const res = await fetch("/api/save");
      if (!res.ok) {
        setAuth("anon");
        return;
      }
      const j = await res.json();
      setSave(j.save ?? null);
      if (j.name) setUserName(j.name);
      if (j.save && j.lifeGained > 0) {
        useGame.getState().pushLog(`鏈上遊獵歸來,身心調養,增資產 ${j.lifeGained} 載。`);
      }
      if (j.save && j.credited) {
        useGame.getState().pushLog("場外交易貨款已入帳。");
      }
      setAuth("authed");
    } catch {
      setAuth("anon");
    }
  }, [setSave]);

  useEffect(() => {
    loadSave();
  }, [loadSave]);

  if (auth === "checking") {
    return (
      <main className="flex items-center justify-center min-h-screen">
        <p className="font-mono text-faded tracking-[0.4em] animate-pulse">終 端 連 線 中 …</p>
      </main>
    );
  }

  if (auth === "anon") return <AuthGate onAuthed={() => loadSave()} />;

  if (!save || !save.started) return <CharCreate name={userName} />;

  if (save.dead) return <DeathScreen />;

  const isXian = REALMS[save.realmIdx]?.stage >= 10;

  return (
    <main className={`max-w-6xl mx-auto px-4 py-6 relative ${isXian ? "xian-aura" : ""}`}>
      {breakResult && <ResultModal modal={breakResult} onClose={closeBreak} />}
      {!breakResult && loot && <ResultModal modal={loot} onClose={closeLoot} />}
      <header className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/ldz/ldz-logo.jpg"
            alt="LDZ"
            className="h-10 w-10 rounded object-cover border border-jade/30"
          />
          <div>
            <h1
              className={`text-2xl font-black tracking-[0.25em] ${isXian ? "text-transparent bg-clip-text bg-gradient-to-r from-gold via-jade to-azure" : ""}`}
            >
              LDZ 交易風雲傳
            </h1>
            <p className="font-mono text-[10px] tracking-[0.35em] text-faded">
              {isXian ? "FUND MANAGER · 得道封神" : "A TRADER\u2019S ROAD TO GODHOOD"}
            </p>
          </div>
        </div>
        <div className="flex gap-4 items-baseline">
          <button
            className="text-xs text-faded/60 hover:text-vermillion transition-colors font-mono"
            onClick={() => {
              if (confirm("重開帳戶將抹去一切進度,確定?")) act("reset");
            }}
          >
            [重開帳戶]
          </button>
          <button
            className="text-xs text-faded/60 hover:text-gold transition-colors font-mono"
            onClick={async () => {
              await fetch("/api/auth/logout", { method: "POST" });
              location.reload();
            }}
          >
            [登出]
          </button>
        </div>
      </header>

      <TickerBar />

      <div className="mb-4">
        <CultivationBar />
      </div>

      <div className="grid gap-4 lg:grid-cols-[300px_1fr_340px]">
        <div className="space-y-4">
          <StatusPanel />
        </div>
        <div className="space-y-4">
          <CombatPanel />
          <ActionTabs />
        </div>
        <LogPanel />
      </div>
    </main>
  );
}
