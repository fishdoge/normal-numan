"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { useGame, statsOf, maxLifeOf, XIANLI_MULT, sectDamageMultOfStages } from "@/game/store";
import { REALMS } from "@/game/data/realms";
import { SECTS } from "@/game/data/sects";
import { MONSTERS } from "@/game/data/world";
import { itemById, isXuantianArtifact } from "@/game/data/items";
import { techById } from "@/game/data/techniques";
import { ELEMENT_COLOR, ELEMENTS, XIANLI_COLOR, EQUIP_SLOTS } from "@/game/types";
import StoneAmount from "./StoneAmount";

// 五色異星盤(集滿解鎖蠻荒異界),五行 → 道具 id 對照
const XINGPAN_ID_OF: Record<string, string> = {
  金: "xingpan_jin",
  木: "xingpan_mu",
  水: "xingpan_shui",
  火: "xingpan_huo",
  土: "xingpan_tu",
};

// 太乙精魂(蠻荒異界四大地域王掉落,集滿於太乙殿突破太乙境)
const TAIYI_SOULS: { id: string; label: string }[] = [
  { id: "taiyi_jinghun_tianhu", label: "天狐" },
  { id: "taiyi_jinghun_zhenlong", label: "真龍" },
  { id: "taiyi_jinghun_baxia", label: "霸下" },
  { id: "taiyi_jinghun_pixiu", label: "黑眼貔貅" },
];

// 特殊突破進度(異星盤集滿解鎖蠻荒異界 / 太乙精魂集滿突破太乙境),移至人物資訊欄位下方,不再擠在遊歷探索頁籤裡
export function RealmProgressPanel() {
  const s = useGame((x) => x.save)!;
  const act = useGame((x) => x.act);
  const busy = useGame((x) => x.busy);
  const { realm } = statsOf(s);
  const inCombat = !!s.combat;

  const showManhuang = !s.manhuangUnlocked && realm.stage >= 10;
  const showTaiyi = s.futuFloor >= 20 && realm.stage < 12;

  if (!showManhuang && !showTaiyi) return null;

  return (
    <>
      {showManhuang && (
        <div className="panel deco-frame border-fuchsia-400/40">
          <div className="flex items-baseline justify-between">
            <span className="font-bold text-fuchsia-300">蠻 荒 異 界 · 五 色 異 星 盤</span>
            <span className="text-xs font-mono text-fuchsia-300/80">
              {ELEMENTS.filter((el) => (s.inventory[XINGPAN_ID_OF[el]] ?? 0) >= 1).length}/5
            </span>
          </div>
          <p className="text-sm text-faded mt-1">
            集滿金木水火土五色異星盤(金源仙域怪物稀有掉落),即可開啟蠻荒異界之門,內有天狐、真龍、霸下、貔貅四大領地。
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {ELEMENTS.map((el) => {
              const has = (s.inventory[XINGPAN_ID_OF[el]] ?? 0) >= 1;
              return (
                <span
                  key={el}
                  className={`chip ${has ? ELEMENT_COLOR[el] : "text-faded/40 border-faded/20"}`}
                >
                  {el}
                </span>
              );
            })}
          </div>
          <button
            className="btn mt-2 w-full border-fuchsia-400/60 text-fuchsia-300 hover:bg-fuchsia-400/15"
            disabled={
              inCombat || busy || ELEMENTS.some((el) => (s.inventory[XINGPAN_ID_OF[el]] ?? 0) < 1)
            }
            onClick={() => act("unlockManhuang")}
          >
            開 啟 蠻 荒 異 界 之 門
          </button>
        </div>
      )}
      {showTaiyi && (
        <div className="panel deco-frame border-fuchsia-400/40">
          <div className="flex items-baseline justify-between">
            <span className="font-bold text-fuchsia-300">太 乙 殿</span>
            <span className="text-xs font-mono text-fuchsia-300/80">
              {TAIYI_SOULS.filter((t) => (s.inventory[t.id] ?? 0) >= 1).length}/4 太乙精魂
            </span>
          </div>
          <p className="text-sm text-faded mt-1">
            浮屠塔登臨第 20 層後開啟。集滿蠻荒異界四大地域王(天狐/真龍/霸下/黑眼貔貅)身隕所遺的太乙精魂,
            金仙可於此突破【太乙境】,並為宗門帶來 +120% 額外戰鬥傷害。
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {TAIYI_SOULS.map((t) => {
              const has = (s.inventory[t.id] ?? 0) >= 1;
              return (
                <span
                  key={t.id}
                  className={`chip ${has ? ELEMENT_COLOR[itemById(t.id).element!] : "text-faded/40 border-faded/20"}`}
                >
                  {t.label}
                </span>
              );
            })}
          </div>
          <button
            className="btn mt-2 w-full border-fuchsia-400/60 text-fuchsia-300 hover:bg-fuchsia-400/15"
            disabled={
              inCombat ||
              busy ||
              REALMS[s.realmIdx]?.id !== "jinxian_realm" ||
              TAIYI_SOULS.some((t) => (s.inventory[t.id] ?? 0) < 1)
            }
            title={REALMS[s.realmIdx]?.id !== "jinxian_realm" ? "唯金仙可於太乙殿突破" : ""}
            onClick={() => act("ascendTaiyi")}
          >
            飛 升 太 乙
          </button>
        </div>
      )}
    </>
  );
}

export function StatusPanel() {
  const s = useGame((x) => x.save)!;
  const { realm, atk, baseAtk, def, hpMax, mpMax, speed } = statsOf(s);
  const sect = SECTS.find((x) => x.id === s.sectId);
  const expNeed = REALMS[s.realmIdx].expNeed;
  const isXian = realm.stage >= 10;
  const act = useGame((x) => x.act);
  const setMainView = useGame((x) => x.setMainView);

  // 宗門集體戰力:輪詢同門境界分佈,算出目前的宗門傷害加成供顯示(實際套用仍以伺服器戰鬥當下重算為準)
  const [sectMult, setSectMult] = useState(1);
  useEffect(() => {
    if (!s.sectId) return;
    let cancelled = false;
    (async () => {
      try {
        const j = await (await fetch("/api/sect")).json();
        if (!cancelled && j.ok) {
          // 已隕落的同門不參與傷害加成(與伺服器戰鬥當下的實際套用邏輯一致)
          const stages = (j.members ?? [])
            .filter((m: { dead: boolean }) => !m.dead)
            .map((m: { realm_idx: number }) => REALMS[m.realm_idx]?.stage);
          setSectMult(sectDamageMultOfStages(stages));
        }
      } catch {
        /* ignore,顯示欄位保持上次數值 */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [s.sectId, s.realmIdx]);

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
      <div className="flex items-baseline justify-between mb-1 gap-2">
        <span
          className={`text-xl font-bold ${isXian ? "text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-300 via-amber-200 to-fuchsia-300" : ""}`}
        >
          {s.name}
        </span>
        <span className="text-xs text-fuchsia-300/90 truncate">{sect?.name ?? "散修"}</span>
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

      <button
        onClick={() => setMainView("sect")}
        title="開啟宗門獨立頁面"
        className="w-full mt-3 mb-1 flex items-center justify-between gap-2 rounded-sm border-2 border-fuchsia-400/50 bg-gradient-to-r from-fuchsia-400/15 via-gold/10 to-fuchsia-400/15 px-3 py-2.5 transition-colors hover:border-fuchsia-400 hover:from-fuchsia-400/25 hover:to-fuchsia-400/25"
      >
        <span className="min-w-0 text-left">
          <span className="block text-base font-bold text-fuchsia-300">
            {sect?.name ?? "散修"} 宗門殿堂
          </span>
          {sect && (
            <span className="block text-xs text-cream/80 mt-0.5">
              戰鬥傷害 ×{sectMult.toFixed(2)} · 進入查看名錄/仙境/任務
            </span>
          )}
        </span>
        <span className="shrink-0 text-lg text-fuchsia-300">▸</span>
      </button>

      <div className="divider">◆</div>

      <div className="grid grid-cols-2 gap-y-1 text-sm">
        <span className="text-faded">壽元</span>
        <span
          className={`text-right ${maxLifeOf(s) - s.age <= maxLifeOf(s) * 0.2 ? "text-vermillion" : ""}`}
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
        {baseAtk !== atk ? (
          <>
            <span className="text-faded">基礎攻擊</span>
            <span className="text-right text-faded">{baseAtk}</span>
            <span className="text-faded">攻擊(加乘後)</span>
            <span className={`text-right font-bold ${XIANLI_COLOR}`}>{atk}</span>
          </>
        ) : (
          <>
            <span className="text-faded">攻擊</span>
            <span className="text-right">{atk}</span>
          </>
        )}
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
        <span className="text-right text-gold">
          <StoneAmount n={s.stones} />
        </span>
      </div>

      <div className="divider">裝 備</div>
      <div className="grid grid-cols-2 gap-y-1 text-sm">
        {EQUIP_SLOTS.map(({ slot, label }) => {
          const id = equipMap[slot];
          const it = id ? itemById(id) : null;
          const xuantian = id ? isXuantianArtifact(id) : false;
          return (
            <div key={slot} className="contents">
              <span className="text-faded">{label}</span>
              <span
                className={`text-right ${xuantian ? "text-xuantian" : it ? (slot === "pet" ? "text-fuchsia-300" : "text-cream") : "text-faded/50"}`}
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
