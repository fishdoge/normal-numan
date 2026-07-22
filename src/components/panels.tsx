"use client";

import { useEffect, useRef } from "react";
import { useGame, statsOf, maxLifeOf } from "@/game/store";
import { REALMS } from "@/game/data/realms";
import { SECTS } from "@/game/data/sects";
import { MONSTERS } from "@/game/data/world";
import { itemById } from "@/game/data/items";
import { techById } from "@/game/data/techniques";
import { ELEMENT_COLOR, formatStones } from "@/game/types";

export function StatusPanel() {
  const s = useGame((x) => x.save)!;
  const { realm, atk, def, hpMax, mpMax, speed } = statsOf(s);
  const sect = SECTS.find((x) => x.id === s.sectId);
  const expNeed = REALMS[s.realmIdx].expNeed;
  const weapon = s.equippedWeapon ? itemById(s.equippedWeapon) : null;
  const armor = s.equippedArmor ? itemById(s.equippedArmor) : null;
  const act = useGame((x) => x.act);
  const busy = useGame((x) => x.busy);

  const Bar = ({ v, max, cls }: { v: number; max: number; cls: string }) => (
    <div className="stat-bar">
      <div className={cls} style={{ width: `${Math.max(0, Math.min(100, (v / max) * 100))}%`, height: "100%" }} />
    </div>
  );

  return (
    <div className="panel deco-frame">
      <p className="panel-title">道 籍</p>
      <div className="flex items-baseline justify-between mb-1">
        <span className="text-xl font-bold">{s.name}</span>
        <span className="text-sm text-faded">{sect?.name}</span>
      </div>
      <p className="text-gold mb-3">{realm.name}</p>

      <div className="space-y-2 text-sm">
        <div>
          <div className="flex justify-between text-xs text-faded mb-0.5">
            <span>氣血</span><span>{s.hp}/{hpMax}</span>
          </div>
          <Bar v={s.hp} max={hpMax} cls="bg-vermillion" />
        </div>
        <div>
          <div className="flex justify-between text-xs text-faded mb-0.5">
            <span>仙靈力</span><span>{s.mp}/{mpMax}</span>
          </div>
          <Bar v={s.mp} max={mpMax} cls="bg-azure" />
        </div>
        <div>
          <div className="flex justify-between text-xs text-faded mb-0.5">
            <span>修為</span><span>{s.exp}/{expNeed}</span>
          </div>
          <Bar v={s.exp} max={expNeed} cls="bg-jade" />
        </div>
      </div>

      <div className="divider">◆</div>

      <div className="grid grid-cols-2 gap-y-1 text-sm">
        <span className="text-faded">壽元</span>
        <span className={`text-right ${maxLifeOf(s) - s.age <= REALMS[s.realmIdx].lifespan * 0.2 ? "text-vermillion" : ""}`}>
          {s.age}/{maxLifeOf(s)} 年
        </span>
        <span className="text-faded">修行</span>
        <span className="text-right">第 {s.day} 年(修煉 {s.cultToday}/3)</span>
        <span className="text-faded">攻擊</span><span className="text-right">{atk}</span>
        <span className="text-faded">防禦</span><span className="text-right">{def}</span>
        <span className="text-faded">速度</span><span className="text-right">{speed}</span>
        <span className="text-faded">靈石</span><span className="text-right text-gold">{formatStones(s.stones)}</span>
        <span className="text-faded">法器</span>
        <span className="text-right">{weapon ? weapon.name : "赤手空拳"}</span>
        <span className="text-faded">護身</span>
        <span className="text-right">{armor ? armor.name : "無"}</span>
      </div>

      {s.learning && (
        <>
          <div className="divider">◆</div>
          <div className="text-sm">
            <div className="flex items-baseline justify-between">
              <span className="text-azure font-bold">修習中</span>
              <span className="text-xs font-mono text-faded">尚需 {s.learning.remain} 年</span>
            </div>
            <p className="text-cream mt-0.5">{techById(s.learning.techId).name}</p>
          </div>
        </>
      )}

      <div className="mt-3">
        <button className="btn w-full" onClick={() => act("restoreMp")} disabled={busy || !!s.combat}>
          聚靈回力(耗靈石回滿仙靈力)
        </button>
      </div>
    </div>
  );
}

export function LogPanel() {
  const log = useGame((x) => x.save?.log ?? []);
  const boxRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = boxRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [log]);
  return (
    <div className="panel h-64 lg:h-full flex flex-col">
      <p className="panel-title">見 聞 錄</p>
      <div ref={boxRef} className="flex-1 overflow-y-auto space-y-1.5 pr-1 text-sm leading-relaxed">
        {log.length === 0 && <p className="text-faded/50">仙路漫漫,一切由此開始……</p>}
        {log.map((l, i) => (
          <p key={i} className="animate-floatUp">
            <span className="text-faded/50 font-mono text-xs mr-1">▸</span>
            {l}
          </p>
        ))}
      </div>
    </div>
  );
}

export function CombatPanel() {
  const s = useGame((x) => x.save)!;
  const act = useGame((x) => x.act);
  const busy = useGame((x) => x.busy);
  const combat = s.combat;

  if (!combat) {
    return (
      <div className="panel deco-frame">
        <p className="panel-title">戰 況</p>
        <p className="text-sm text-faded">
          四下無事,靈風拂面。前往秘境「獵殺妖獸」,或採集時遭遇襲擊,戰況將顯示於此。
        </p>
      </div>
    );
  }

  const mon = MONSTERS.find((m) => m.id === combat.monsterId)!;
  const usable = s.learned.map(techById);

  return (
    <div className="panel deco-frame border-vermillion/40">
      <p className="panel-title text-cinnabar">激 戰</p>
      <div className="flex items-baseline justify-between">
        <span className="text-lg font-bold">{mon.name}</span>
        <span className={`chip ${ELEMENT_COLOR[mon.element]}`}>{mon.element}屬性</span>
      </div>
      <p className="text-sm text-faded mt-1">{mon.desc}</p>
      <div className="mt-3">
        <div className="flex justify-between text-xs text-faded mb-0.5">
          <span>妖獸氣血</span><span>{combat.monsterHp}/{mon.hp}</span>
        </div>
        <div className="stat-bar">
          <div className="bg-vermillion h-full" style={{ width: `${(combat.monsterHp / mon.hp) * 100}%` }} />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button className="btn" disabled={busy} onClick={() => act("attack")}>法器攻擊</button>
        {usable.map((t) => (
          <button
            key={t.id}
            className="btn"
            disabled={busy || s.mp < t.mpCost}
            onClick={() => act("cast", { techId: t.id })}
            title={t.desc}
          >
            <span className={`mr-1 ${ELEMENT_COLOR[t.element]}`}>{t.element}</span>
            {t.name}
            <span className="ml-1 text-xs text-faded">({t.mpCost})</span>
          </button>
        ))}
        <button className="btn btn-danger" disabled={busy} onClick={() => act("flee")}>遁走</button>
      </div>
      <p className="text-xs text-faded/60 mt-3">
        五行相剋:金克木 · 木克土 · 土克水 · 水克火 · 火克金 —— 相剋傷害 ×1.5
      </p>
    </div>
  );
}
