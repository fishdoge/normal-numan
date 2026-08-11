"use client";

import { useEffect, useRef, useCallback } from "react";
import { useGame, statsOf, maxLifeOf, XIANLI_MULT } from "@/game/store";
import { REALMS } from "@/game/data/realms";
import { SECTS } from "@/game/data/sects";
import { MONSTERS } from "@/game/data/world";
import { itemById } from "@/game/data/items";
import { techById } from "@/game/data/techniques";
import { ELEMENT_COLOR, XIANLI_COLOR, EQUIP_SLOTS, formatStones } from "@/game/types";

export function StatusPanel() {
  const s = useGame((x) => x.save)!;
  const { realm, atk, def, hpMax, mpMax, speed } = statsOf(s);
  const sect = SECTS.find((x) => x.id === s.sectId);
  const expNeed = REALMS[s.realmIdx].expNeed;
  const isXian = realm.stage >= 10;
  const act = useGame((x) => x.act);

  // 各裝備槽當前裝備
  const equipMap: Record<string, string | null> = {
    weapon: s.equippedWeapon,
    robe: s.equippedRobe ?? s.equippedArmor,
    amulet: s.equippedAmulet,
    talisman: s.equippedTalisman,
    pet: s.equippedPet,
    ming: s.equippedMing,
  };

  // 聚靈回力:按住即持續回力,鬆手停止
  const holdingRef = useRef(false);
  const loopingRef = useRef(false);
  const runHold = useCallback(async () => {
    if (loopingRef.current) return;
    loopingRef.current = true;
    try {
      while (holdingRef.current) {
        const st = useGame.getState().save;
        const cur = st ? statsOf(st) : null;
        if (!st || st.combat || st.dead || st.mp >= (cur?.mpMax ?? 0)) break;
        await act("restoreMp");
        await new Promise((r) => setTimeout(r, 90));
      }
    } finally {
      loopingRef.current = false;
    }
  }, [act]);
  const startHold = useCallback(() => {
    if (holdingRef.current) return;
    holdingRef.current = true;
    runHold();
  }, [runHold]);
  const stopHold = useCallback(() => {
    holdingRef.current = false;
  }, []);
  useEffect(
    () => () => {
      holdingRef.current = false;
    },
    [],
  );

  const Bar = ({ v, max, cls }: { v: number; max: number; cls: string }) => (
    <div className="stat-bar">
      <div
        className={cls}
        style={{ width: `${Math.max(0, Math.min(100, (v / max) * 100))}%`, height: "100%" }}
      />
    </div>
  );

  return (
    <div className="panel deco-frame">
      <p className="panel-title">道 籍</p>
      <div className="flex items-baseline justify-between mb-1">
        <span
          className={`text-xl font-bold ${isXian ? "text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-300 via-amber-200 to-fuchsia-300" : ""}`}
        >
          {s.name}
        </span>
        <span className="text-sm text-faded">{sect?.name}</span>
      </div>
      <p className={`mb-3 ${isXian ? "text-fuchsia-300 font-bold" : "text-gold"}`}>{realm.name}</p>

      <div className="space-y-2 text-sm">
        <div>
          <div className="flex justify-between text-xs text-faded mb-0.5">
            <span>氣血</span>
            <span>
              {s.hp}/{hpMax}
            </span>
          </div>
          <Bar v={s.hp} max={hpMax} cls="bg-vermillion" />
        </div>
        <div>
          <div className="flex justify-between text-xs text-faded mb-0.5">
            <span>法力</span>
            <span>
              {s.mp}/{mpMax}
            </span>
          </div>
          <Bar v={s.mp} max={mpMax} cls="bg-azure" />
        </div>
        <div>
          <div className="flex justify-between text-xs text-faded mb-0.5">
            <span>修為</span>
            <span>
              {s.exp}/{expNeed}
            </span>
          </div>
          <Bar v={s.exp} max={expNeed} cls="bg-jade" />
        </div>
      </div>

      <div className="divider">◆</div>

      <div className="grid grid-cols-2 gap-y-1 text-sm">
        <span className="text-faded">壽元</span>
        <span
          className={`text-right ${maxLifeOf(s) - s.age <= REALMS[s.realmIdx].lifespan * 0.2 ? "text-vermillion" : ""}`}
        >
          {s.age}/{maxLifeOf(s)} 年
        </span>
        <span className="text-faded">修行</span>
        <span className="text-right">第 {s.day} 年</span>
        {s.xianli > 0 && (
          <>
            <span className="text-faded">仙靈力</span>
            <span className={`text-right font-bold ${XIANLI_COLOR}`}>
              {s.xianli} 點 (攻擊 ×{(1 + s.xianli * XIANLI_MULT).toFixed(1)})
            </span>
          </>
        )}
        <span className="text-faded">攻擊</span>
        <span className={`text-right ${s.xianli > 0 ? XIANLI_COLOR : ""}`}>{atk}</span>
        <span className="text-faded">防禦</span>
        <span className="text-right">{def}</span>
        <span className="text-faded">速度</span>
        <span className="text-right">{speed}</span>
        {s.boonHp + s.boonAtk + s.boonDef + s.boonSpeed > 0 && (
          <>
            <span className="text-fuchsia-300">雲遊所得</span>
            <span className="text-right text-fuchsia-300 text-xs">
              {[
                s.boonHp && `血+${s.boonHp}`,
                s.boonAtk && `攻+${s.boonAtk}`,
                s.boonDef && `防+${s.boonDef}`,
                s.boonSpeed && `速+${s.boonSpeed}`,
              ]
                .filter(Boolean)
                .join(" ")}
            </span>
          </>
        )}
        <span className="text-faded">靈石</span>
        <span className="text-right text-gold">{formatStones(s.stones)}</span>
      </div>

      <div className="divider">裝 備</div>
      <div className="grid grid-cols-2 gap-y-1 text-sm">
        {EQUIP_SLOTS.map(({ slot, label }) => {
          const id = equipMap[slot];
          const it = id ? itemById(id) : null;
          return (
            <div key={slot} className="contents">
              <span className="text-faded">{label}</span>
              <span
                className={`text-right ${it ? (slot === "pet" ? "text-fuchsia-300" : "text-cream") : "text-faded/50"}`}
              >
                {it ? it.name : "—"}
              </span>
            </div>
          );
        })}
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
        <button
          className="btn w-full select-none touch-none"
          onPointerDown={(e) => {
            e.preventDefault();
            startHold();
          }}
          onPointerUp={stopHold}
          onPointerLeave={stopHold}
          onPointerCancel={stopHold}
          disabled={!!s.combat || s.mp >= mpMax}
        >
          聚靈回力(按住持續耗靈石回法力)
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
  const isLord = combat.isLord || mon.isLord;
  const hpMaxMon = combat.bossHpMax ?? mon.hp; // 浮屠塔動態 BOSS 用其實際上限
  const displayName = combat.futuFloor ? `${mon.name} · 第 ${combat.futuFloor} 層` : mon.name;

  return (
    <div
      className={`panel deco-frame ${isLord ? "border-fuchsia-400/70 shadow-[0_0_18px_rgba(232,121,249,0.25)]" : "border-vermillion/40"}`}
    >
      <p className={`panel-title ${isLord ? "text-fuchsia-300" : "text-cinnabar"}`}>
        {combat.futuFloor ? "⚠ 浮 屠 塔" : isLord ? "⚠ 王 者 降 臨" : "激 戰"}
      </p>
      <div className="flex items-baseline justify-between">
        <span className={`text-lg font-bold ${isLord ? "text-fuchsia-300" : ""}`}>
          {isLord && (
            <span className="chip mr-2 text-fuchsia-400 border-fuchsia-400/60">
              {combat.futuFloor ? "幻象" : "地域王"}
            </span>
          )}
          {displayName}
        </span>
        <span className={`chip ${ELEMENT_COLOR[mon.element]}`}>{mon.element}屬性</span>
      </div>
      <p className="text-sm text-faded mt-1">{mon.desc}</p>
      <div className="mt-3">
        <div className="flex justify-between text-xs text-faded mb-0.5">
          <span>妖獸氣血</span>
          <span>
            {combat.monsterHp}/{hpMaxMon}
          </span>
        </div>
        <div className="stat-bar">
          <div
            className="bg-vermillion h-full"
            style={{ width: `${(combat.monsterHp / hpMaxMon) * 100}%` }}
          />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button className="btn" disabled={busy} onClick={() => act("attack")}>
          法器攻擊
        </button>
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
        <button className="btn btn-danger" disabled={busy} onClick={() => act("flee")}>
          遁走
        </button>
      </div>
      <p className="text-xs text-faded/60 mt-3">
        五行相剋:金克木 · 木克土 · 土克水 · 水克火 · 火克金 —— 相剋傷害 ×1.5
      </p>
    </div>
  );
}
