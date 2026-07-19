"use client";

import { useGame } from "@/game/store";
import CharCreate from "./CharCreate";
import ActionTabs from "./ActionTabs";
import { StatusPanel, LogPanel, CombatPanel } from "./panels";

export default function Game() {
  const started = useGame((s) => s.started);
  const combat = useGame((s) => s.combat);
  const resetGame = useGame((s) => s.resetGame);

  if (!started) return <CharCreate />;

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
