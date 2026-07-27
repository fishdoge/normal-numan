"use client";

import { useState } from "react";
import { useGame } from "@/game/store";
import { SECTS } from "@/game/data/sects";
import { techById } from "@/game/data/techniques";
import { ELEMENT_COLOR } from "@/game/types";

export default function CharCreate({ name }: { name?: string }) {
  const act = useGame((s) => s.act);
  const busy = useGame((s) => s.busy);
  const [sectId, setSectId] = useState<string | null>(null);

  return (
    <main className="max-w-3xl mx-auto px-4 py-12">
      <header className="text-center mb-10">
        <div className="flex justify-center mb-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/ldz/adou.png"
            alt="阿兜"
            className="h-28 w-28 rounded-full object-cover border-2 border-jade/40 shadow-[0_0_30px_rgba(14,203,129,0.25)]"
          />
        </div>
        <p className="font-mono text-xs tracking-[0.5em] text-jade/70 mb-3">
          A TRADER&apos;S ROAD TO GODHOOD
        </p>
        <h1 className="text-5xl font-black tracking-widest text-parchment">LDZ 交易風雲傳</h1>
        <p className="mt-4 text-faded">
          一個一無所有的韭菜,唯有一顆不服輸的鑽石心臟。
          <br />
          美金為本,策略為刃,盤性相生相剋 —— 韭菜亦可扛過歸零,成神封王。
        </p>
      </header>

      <section className="panel deco-frame mb-6 text-center">
        <p className="panel-title">交易員代號</p>
        <p className="text-2xl font-bold text-gold">{name || "無名散戶"}</p>
        <p className="text-xs text-faded mt-2">
          此代號於註冊時已定,將伴你一生交易之路(與爆倉紀錄)。
        </p>
      </section>

      <section className="panel deco-frame mb-8">
        <p className="panel-title">選擇交易團隊</p>
        <div className="grid gap-3 sm:grid-cols-2">
          {SECTS.map((sect) => {
            const tech = techById(sect.startTech);
            const active = sectId === sect.id;
            return (
              <button
                key={sect.id}
                onClick={() => setSectId(sect.id)}
                className={`text-left border rounded p-3 transition-colors ${
                  active ? "border-jade bg-jade/10" : "border-smoke hover:border-faded/60"
                }`}
              >
                <div className="flex items-baseline justify-between">
                  <span className="text-lg font-bold">{sect.name}</span>
                  <span className={`chip ${ELEMENT_COLOR[sect.element]}`}>{sect.element}盤</span>
                </div>
                <p className="text-sm text-faded mt-1 leading-relaxed">{sect.desc}</p>
                <p className="text-xs mt-2 text-cream/80">
                  入門策略:{tech.name} · {sect.bonus.exp ? `進修效率 +${sect.bonus.exp}%` : ""}
                  {sect.bonus.atk ? `交易火力 +${sect.bonus.atk}` : ""}
                  {sect.bonus.hp ? `倉位 +${sect.bonus.hp} ` : ""}
                  {sect.bonus.mp ? `精力 +${sect.bonus.mp}` : ""}
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
          onClick={() => sectId && act("start", { sectId })}
        >
          入 場 開 單
        </button>
      </div>

      {/* LDZ 社群資訊 */}
      <section className="mt-10 panel deco-frame text-center">
        <div className="flex items-center justify-center gap-4 mb-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/ldz/ldz-logo.jpg" alt="LDZ" className="h-9 rounded" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/ldz/luka-logo.png" alt="LUKA" className="h-9 rounded" />
        </div>
        <p className="text-sm text-faded leading-relaxed">
          本作由 <span className="text-jade font-bold">LDZ 交易團隊</span>{" "}
          出品。加入阿兜社群,領取專屬福利、參與定期活動,與屋頂龜趨勢指標、RM 盤整指標一起實戰報單。
        </p>
        <p className="mt-3 font-mono text-gold">
          BingX 交易所推薦碼:<span className="text-lg font-bold">PK6WLT</span>
        </p>
      </section>
    </main>
  );
}
