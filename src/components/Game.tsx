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
      <p className="font-mono text-xs tracking-[0.5em] text-faded mb-4">HERE LIES A CULTIVATOR</p>
      <h1 className="text-5xl font-black tracking-widest text-vermillion mb-6">壽 元 已 盡</h1>
      <div className="panel deco-frame text-left mx-auto max-w-md mb-8">
        <p className="panel-title">墓 誌 銘</p>
        <p className="leading-loose text-cream">
          {s.name},享年 {maxLifeOf(s)} 年,道隕於【{REALMS[s.realmIdx].name}】。
          <br />修行 {s.day} 年,終究未能問鼎大道。
          <br />仙路盡頭誰為峰?一見無始道成空。
        </p>
      </div>
      <button className="btn text-lg px-10 py-3" onClick={() => act("reset")}>
        轉 世 重 修
      </button>
    </main>
  );
}

// 通用彈窗(突破結果 / 戰利品 / 採集所得)
function ResultModal({ modal, onClose }: { modal: Modal; onClose: () => void }) {
  const ok = modal.success !== false;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/80 backdrop-blur-sm" onClick={onClose}>
      <div
        className={`panel deco-frame max-w-md w-full mx-4 text-center animate-floatUp ${
          ok ? "border-gold/60" : "border-vermillion/60"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className={`text-3xl font-black tracking-[0.3em] my-4 ${ok ? "text-gold" : "text-vermillion"}`}>
          {modal.title}
        </h2>
        <div className="space-y-2 text-cream leading-relaxed mb-6 text-left px-2">
          {modal.lines.map((l, i) => <p key={i}>{l}</p>)}
        </div>
        <button className="btn px-8 mb-2" onClick={onClose}>知 曉</button>
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
        <p className="panel-title mb-0 mr-2">修 煉</p>
        <button className="btn text-base px-5 py-2" disabled={busy || inCombat} onClick={() => act("cultivate")}>
          打坐修煉 <span className="ml-1 font-mono text-xs">-{cost} 年壽元</span>
        </button>
        <button className="btn text-base px-5 py-2" disabled={busy || inCombat || s.hp >= hpMax} onClick={() => act("rest")}>
          調息(回復氣血)
        </button>
        <button
          className="btn text-base px-5 py-2 border-fuchsia-400/50 text-fuchsia-300 hover:bg-fuchsia-400/15 hover:border-fuchsia-400"
          disabled={busy || inCombat || s.stones < 100000000}
          onClick={() => act("wander")}
          title="消耗 5000 年壽元 + 100 極品靈石。約 30% 得永久屬性,約 2.5% 直接得天仙丹,1% 遇金仙大 BOSS,餘則一無所獲。"
        >
          雲遊四海
        </button>
        <button
          className={`btn text-base px-5 py-2 ${canBreak ? "border-gold text-gold animate-pulse" : ""}`}
          disabled={busy || inCombat || !canBreak}
          onClick={() => act("breakthrough")}
          title={canBreak ? "" : `需修為 ${expNeed}`}
        >
          嘗試突破{canBreak ? "!" : ""}
        </button>
        <span className="text-xs text-faded ml-auto font-mono">
          修為 {s.exp}/{expNeed} · 突破失敗折損最大壽元 15%
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
        useGame.getState().pushLog(`雲遊歸來,仙體自然溫養,增壽 ${j.lifeGained} 年。`);
      }
      if (j.save && j.credited) {
        useGame.getState().pushLog("交易行貨款已入帳。");
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
        <p className="font-mono text-faded tracking-[0.4em] animate-pulse">道 藏 開 啟 中 …</p>
      </main>
    );
  }

  if (auth === "anon") return <AuthGate onAuthed={() => loadSave()} />;

  if (!save || !save.started) return <CharCreate name={userName} />;

  if (save.dead) return <DeathScreen />;

  return (
    <main className="max-w-6xl mx-auto px-4 py-6">
      {breakResult && <ResultModal modal={breakResult} onClose={closeBreak} />}
      {!breakResult && loot && <ResultModal modal={loot} onClose={closeLoot} />}
      <header className="flex items-baseline justify-between mb-5">
        <div>
          <h1 className="text-2xl font-black tracking-[0.35em]">凡人修仙傳</h1>
          <p className="font-mono text-[10px] tracking-[0.4em] text-faded">A MORTAL&apos;S JOURNEY TO IMMORTALITY</p>
        </div>
        <div className="flex gap-4 items-baseline">
          <button
            className="text-xs text-faded/60 hover:text-vermillion transition-colors"
            onClick={() => {
              if (confirm("兵解重修將抹去一切進度,確定?")) act("reset");
            }}
          >
            兵解重修
          </button>
          <button
            className="text-xs text-faded/60 hover:text-gold transition-colors"
            onClick={async () => {
              await fetch("/api/auth/logout", { method: "POST" });
              location.reload();
            }}
          >
            登出
          </button>
        </div>
      </header>

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
