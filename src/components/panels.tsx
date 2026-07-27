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
      <p className="panel-title">交易員檔案</p>
      <div className="flex items-baseline justify-between mb-1">
        <span
          className={`text-xl font-bold ${isXian ? "text-transparent bg-clip-text bg-gradient-to-r from-gold via-jade to-azure" : ""}`}
        >
          {s.name}
        </span>
        <span className="text-xs text-faded font-mono">{sect?.name}</span>
      </div>
      <div className="flex items-baseline justify-between mb-3">
        <span className={`text-sm ${isXian ? "text-jade font-bold" : "text-gold"}`}>
          {realm.name}
        </span>
        <span className="text-right">
          <span className="text-lg font-bold text-jade tnum">{formatStones(s.stones)}</span>
          <span className="text-[10px] text-faded ml-1">USD</span>
        </span>
      </div>

      <div className="space-y-2 text-sm">
        <div>
          <div className="flex justify-between text-xs text-faded mb-0.5">
            <span>倉位 EQUITY</span>
            <span className="tnum">
              {s.hp}/{hpMax}
            </span>
          </div>
          <Bar v={s.hp} max={hpMax} cls="bg-jade" />
        </div>
        <div>
          <div className="flex justify-between text-xs text-faded mb-0.5">
            <span>精力 MARGIN</span>
            <span className="tnum">
              {s.mp}/{mpMax}
            </span>
          </div>
          <Bar v={s.mp} max={mpMax} cls="bg-azure" />
        </div>
        <div>
          <div className="flex justify-between text-xs text-faded mb-0.5">
            <span>交易量 VOLUME</span>
            <span className="tnum">
              {s.exp}/{expNeed}
            </span>
          </div>
          <Bar v={s.exp} max={expNeed} cls="bg-gold" />
        </div>
      </div>

      <div className="divider" />

      <div className="grid grid-cols-2 gap-y-1 text-sm tnum">
        <span className="text-faded">資產</span>
        <span
          className={`text-right ${maxLifeOf(s) - s.age <= REALMS[s.realmIdx].lifespan * 0.2 ? "text-vermillion" : ""}`}
        >
          {s.age}/{maxLifeOf(s)} 載
        </span>
        <span className="text-faded">資歷</span>
        <span className="text-right">第 {s.day} 年</span>
        {s.xianli > 0 && (
          <>
            <span className="text-faded">影響力</span>
            <span className={`text-right font-bold ${XIANLI_COLOR}`}>
              {s.xianli} 點 (火力 ×{(1 + s.xianli * XIANLI_MULT).toFixed(1)})
            </span>
          </>
        )}
        <span className="text-faded">交易火力</span>
        <span className={`text-right ${s.xianli > 0 ? XIANLI_COLOR : ""}`}>{atk}</span>
        <span className="text-faded">風控</span>
        <span className="text-right">{def}</span>
        <span className="text-faded">手速</span>
        <span className="text-right">{speed}</span>
        {s.boonHp + s.boonAtk + s.boonDef + s.boonSpeed > 0 && (
          <>
            <span className="text-jade">盤感積累</span>
            <span className="text-right text-jade text-xs">
              {[
                s.boonHp && `倉+${s.boonHp}`,
                s.boonAtk && `火+${s.boonAtk}`,
                s.boonDef && `控+${s.boonDef}`,
                s.boonSpeed && `速+${s.boonSpeed}`,
              ]
                .filter(Boolean)
                .join(" ")}
            </span>
          </>
        )}
      </div>

      <div className="divider">硬體配置</div>
      <div className="grid grid-cols-2 gap-y-1 text-sm">
        {EQUIP_SLOTS.map(({ slot, label }) => {
          const id = equipMap[slot];
          const it = id ? itemById(id) : null;
          return (
            <div key={slot} className="contents">
              <span className="text-faded">{label}</span>
              <span
                className={`text-right ${it ? (slot === "pet" ? "text-jade" : "text-cream") : "text-faded/50"}`}
              >
                {it ? it.name : "—"}
              </span>
            </div>
          );
        })}
      </div>

      {s.learning && (
        <>
          <div className="divider" />
          <div className="text-sm">
            <div className="flex items-baseline justify-between">
              <span className="text-azure font-bold">進修中</span>
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
          充能回氣(按住持續耗美金回精力)
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
      <p className="panel-title">盤面日誌</p>
      <div ref={boxRef} className="flex-1 overflow-y-auto space-y-1.5 pr-1 text-sm leading-relaxed">
        {log.length === 0 && <p className="text-faded/50">交易之路漫漫,一切由此開始……</p>}
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
        <p className="panel-title">交易對局</p>
        <p className="text-sm text-faded">
          盤面平靜,無單在身。前往市場「挑戰交易對手」,或盯盤時遭遇突襲,對局將顯示於此。
        </p>
      </div>
    );
  }

  const mon = MONSTERS.find((m) => m.id === combat.monsterId)!;
  const usable = s.learned.map(techById);
  const isLord = combat.isLord || mon.isLord;
  const hpMaxMon = combat.bossHpMax ?? mon.hp; // 塔式對手動態上限
  const displayName = combat.futuFloor ? `${mon.name} · 第 ${combat.futuFloor} 關` : mon.name;

  return (
    <div
      className={`panel deco-frame ${isLord ? "border-gold/70 shadow-[0_0_18px_rgba(240,185,11,0.2)]" : "border-vermillion/40"}`}
    >
      <p className={`panel-title ${isLord ? "text-gold" : "text-cinnabar"}`}>
        {combat.futuFloor ? "⚠ 爆倉擂台" : isLord ? "⚠ 巨鯨現身" : "交易對決 LIVE"}
      </p>
      <div className="flex items-baseline justify-between">
        <span className={`text-lg font-bold ${isLord ? "text-gold" : ""}`}>
          {isLord && (
            <span className="chip mr-2 text-gold border-gold/60">
              {combat.futuFloor ? "幻象莊家" : "巨鯨"}
            </span>
          )}
          {displayName}
        </span>
        <span className={`chip ${ELEMENT_COLOR[mon.element]}`}>{mon.element}盤</span>
      </div>
      <p className="text-sm text-faded mt-1">{mon.desc}</p>
      <div className="mt-3">
        <div className="flex justify-between text-xs text-faded mb-0.5">
          <span>對手目標交易額 TARGET</span>
          <span className="tnum">
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
        <button className="btn btn-buy" disabled={busy} onClick={() => act("attack")}>
          手動下單
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
        <button className="btn btn-sell" disabled={busy} onClick={() => act("flee")}>
          砍單離場
        </button>
      </div>
      <p className="text-xs text-faded/60 mt-3">
        盤性相剋:金克木 · 木克土 · 土克水 · 水克火 · 火克金 —— 對症下單清算 ×1.5
      </p>
    </div>
  );
}
