"use client";

import { useGame, maxLife } from "@/game/store";
import { REALMS } from "@/game/data/realms";
import CharCreate from "./CharCreate";
import ActionTabs from "./ActionTabs";
import { StatusPanel, LogPanel, CombatPanel } from "./panels";

function DeathScreen() {
  const s = useGame();
  return (
    <main className="max-w-2xl mx-auto px-4 py-24 text-center">
      <p className="font-mono text-xs tracking-[0.5em] text-faded mb-4">HERE LIES A CULTIVATOR</p>
      <h1 className="text-5xl font-black tracking-widest text-vermillion mb-6">壽 元 已 盡</h1>
      <div className="panel deco-frame text-left mx-auto max-w-md mb-8">
        <p className="panel-title">墓 誌 銘</p>
        <p className="leading-loose text-cream">
          {s.name},享年 {maxLife(s)} 載,道隕於【{REALMS[s.realmIdx].name}】。
          <br />修行 {s.day} 日,終究未能問鼎大道。
          <br />仙路盡頭誰為峰?一見無始道成空。
        </p>
      </div>
      <button className="btn text-lg px-10 py-3" onClick={s.resetGame}>
        轉 世 重 修
      </button>
    </main>
  );
}

export default function Game() {
  const started = useGame((s) => s.started);
  const dead = useGame((s) => s.dead);
  const combat = useGame((s) => s.combat);
  const resetGame = useGame((s) => s.resetGame);

  if (!started) return <CharCreate />;

  if (dead) {
    return <DeathScreen />;
  }

  return (
    <main className="max-w-6xl mx-auto px-4 py-6">
      <header className="flex items-baseline justify-between mb-5">
        <div>
          <h1 className="text-2xl font-black tracking-[0.35em]">凡人修仙傳</h1>
          <p className="font-mono text-[10px] tracking-[0.4em] text-faded">A MORTAL&apos;S JOURNEY TO IMMORTALITY</p>
        </div>
        <button
          className="text-xs text-faded/60 hover:text-vermillion transition-colors"
          onClick={() => {
            if (confirm("兵解重修將抹去一切進度,確定?")) resetGame();
          }}
        >
          兵解重修
        </button>
      </header>

      <div className="grid gap-4 lg:grid-cols-[300px_1fr_340px]">
        <div className="space-y-4">
          <StatusPanel />
        </div>
        <div className="space-y-4">
          {combat && <CombatPanel />}
          <ActionTabs />
        </div>
        <LogPanel />
      </div>
    </main>
  );
}
