"use client";

import { useState } from "react";
import { useGame } from "@/game/store";
import { SECTS } from "@/game/data/sects";
import { techById } from "@/game/data/techniques";
import { ELEMENT_COLOR } from "@/game/types";

export default function CharCreate() {
  const act = useGame((s) => s.act);
  const busy = useGame((s) => s.busy);
  const [name, setName] = useState("");
  const [sectId, setSectId] = useState<string | null>(null);

  return (
    <main className="max-w-3xl mx-auto px-4 py-12">
      <header className="text-center mb-10">
        <p className="font-mono text-xs tracking-[0.5em] text-gold/70 mb-3">A MORTAL&apos;S JOURNEY</p>
        <h1 className="text-5xl font-black tracking-widest text-parchment">凡人修仙傳</h1>
        <p className="mt-4 text-faded">
          山村窮小子,資質平庸,唯有一縷不屈道心。<br />
          靈石為財,仙靈力為刃,五行相生相剋 —— 凡人亦可問鼎仙途。
        </p>
      </header>

      <section className="panel deco-frame mb-6">
        <p className="panel-title">取一個道號</p>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="韓立"
          maxLength={12}
          className="w-full bg-smoke border border-faded/30 rounded-sm px-3 py-2 text-parchment placeholder-faded/40 focus:outline-none focus:border-gold/60"
        />
      </section>

      <section className="panel deco-frame mb-8">
        <p className="panel-title">拜入門派</p>
        <div className="grid gap-3 sm:grid-cols-2">
          {SECTS.map((sect) => {
            const tech = techById(sect.startTech);
            const active = sectId === sect.id;
            return (
              <button
                key={sect.id}
                onClick={() => setSectId(sect.id)}
                className={`text-left border rounded-sm p-3 transition-colors ${
                  active ? "border-gold bg-gold/10" : "border-faded/25 hover:border-faded/60"
                }`}
              >
                <div className="flex items-baseline justify-between">
                  <span className="text-lg font-bold">{sect.name}</span>
                  <span className={`chip ${ELEMENT_COLOR[sect.element]}`}>{sect.element}行</span>
                </div>
                <p className="text-sm text-faded mt-1 leading-relaxed">{sect.desc}</p>
                <p className="text-xs mt-2 text-cream/80">
                  入門仙法:{tech.name} ·{" "}
                  {sect.bonus.exp ? `修煉效率 +${sect.bonus.exp}%` : ""}
                  {sect.bonus.atk ? `攻擊 +${sect.bonus.atk}` : ""}
                  {sect.bonus.hp ? `氣血 +${sect.bonus.hp} ` : ""}
                  {sect.bonus.mp ? `仙靈力 +${sect.bonus.mp}` : ""}
                </p>
              </button>
            );
          })}
        </div>
      </section>

      <div className="text-center">
        <button
          className="btn text-lg px-10 py-3"
          disabled={!sectId || busy}
          onClick={() => sectId && act("start", { name: name.trim(), sectId })}
        >
          踏 上 仙 途
        </button>
      </div>
    </main>
  );
}
