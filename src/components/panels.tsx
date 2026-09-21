"use client";

import Image from "next/image";
import { useEffect, useRef, useCallback, useState, type CSSProperties } from "react";
import {
  useGame,
  statsOf,
  maxLifeOf,
  energyMaxOf,
  XIANLI_MULT,
  sectDamageMultOfStages,
} from "@/game/store";
import { REALMS } from "@/game/data/realms";
import { SECTS } from "@/game/data/sects";
import { LOCATIONS, MONSTERS } from "@/game/data/world";
import { itemById, isXuantianArtifact } from "@/game/data/items";
import { currentEraYears, eraLabelText } from "@/game/data/eraTime";
import { techById } from "@/game/data/techniques";
import {
  type Element,
  ELEMENT_COLOR,
  spellCardBorderClass,
  ELEMENTS,
  XIANLI_COLOR,
  EQUIP_SLOTS,
  nameColorOf,
  isXianItem,
  XIAN_ITEM_COLOR,
  formatDamage,
} from "@/game/types";
import { useT } from "@/i18n/useT";
import type { DictKey } from "@/i18n/dict";
import { itemDisplayName, itemDisplayDesc, itemStatLine } from "@/i18n/itemText";
import Tooltip from "./Tooltip";
import { monsterDisplayName, monsterDisplayDesc } from "@/i18n/monsterText";
import { techDisplayName, techDisplayDesc } from "@/i18n/techText";
import { realmDisplayName } from "@/i18n/realmText";
import { sectDisplayName } from "@/i18n/sectText";
import { locationDisplayName } from "@/i18n/worldText";
import { elementLabel, equipSlotLabel } from "@/i18n/labelText";
import { MONSTER_TEXT_EN } from "@/i18n/monsterText";
import StoneAmount from "./StoneAmount";

const CARD_ART: Record<Element, string> = {
  金: "metal",
  木: "wood",
  水: "water",
  火: "fire",
  土: "earth",
  無: "neutral",
};

// 太乙精魂對應的地域王 id(供英文翻譯查詢用,中文沿用既有 label)
const TAIYI_SOUL_LORD_ID: Record<string, string> = {
  taiyi_jinghun_tianhu: "lord_tianhu",
  taiyi_jinghun_zhenlong: "lord_zhenlong",
  taiyi_jinghun_baxia: "lord_baxia",
  taiyi_jinghun_pixiu: "lord_pixiu",
};

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
  const t = useT();
  const lang = useGame((x) => x.language);
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
            <span className="font-bold text-fuchsia-300">{t("manhuangTitle")}</span>
            <span className="text-xs font-mono text-fuchsia-300/80">
              {ELEMENTS.filter((el) => (s.inventory[XINGPAN_ID_OF[el]] ?? 0) >= 1).length}/5
            </span>
          </div>
          <p className="text-sm text-faded mt-1">{t("manhuangDesc")}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {ELEMENTS.map((el) => {
              const has = (s.inventory[XINGPAN_ID_OF[el]] ?? 0) >= 1;
              return (
                <span
                  key={el}
                  className={`chip ${has ? ELEMENT_COLOR[el] : "text-faded/40 border-faded/20"}`}
                >
                  {elementLabel(el, lang)}
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
            {t("manhuangBtn")}
          </button>
        </div>
      )}
      {showTaiyi && (
        <div className="panel deco-frame border-fuchsia-400/40">
          <div className="flex items-baseline justify-between">
            <span className="font-bold text-fuchsia-300">{t("taiyiHallTitle")}</span>
            <span className="text-xs font-mono text-fuchsia-300/80">
              {TAIYI_SOULS.filter((ts) => (s.inventory[ts.id] ?? 0) >= 1).length}/4{" "}
              {t("taiyiSoulSuffix")}
            </span>
          </div>
          <p className="text-sm text-faded mt-1">{t("taiyiDesc")}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {TAIYI_SOULS.map((ts) => {
              const has = (s.inventory[ts.id] ?? 0) >= 1;
              const label =
                lang === "en"
                  ? (MONSTER_TEXT_EN[TAIYI_SOUL_LORD_ID[ts.id]]?.name ?? ts.label)
                  : ts.label;
              return (
                <span
                  key={ts.id}
                  className={`chip ${has ? ELEMENT_COLOR[itemById(ts.id).element!] : "text-faded/40 border-faded/20"}`}
                >
                  {label}
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
              TAIYI_SOULS.some((ts) => (s.inventory[ts.id] ?? 0) < 1)
            }
            title={REALMS[s.realmIdx]?.id !== "jinxian_realm" ? t("taiyiBtnLocked") : ""}
            onClick={() => act("ascendTaiyi")}
          >
            {t("taiyiBtn")}
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
  const t = useT();
  const lang = useGame((x) => x.language);

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
      <p className="panel-title">{t("statusTitle")}</p>
      <div className="flex items-baseline justify-between mb-1 gap-2">
        <span className={`text-xl font-bold ${nameColorOf(realm.stage)}`}>{s.name}</span>
        <span className="text-xs text-fuchsia-300/90 truncate">
          {sect ? sectDisplayName(sect, lang) : t("statLoose")}
        </span>
      </div>
      <p className={`mb-1 ${isXian ? "text-fuchsia-300 font-bold" : "text-gold"}`}>
        {realmDisplayName(realm, lang)}
      </p>
      <p className="mb-3 text-[11px] font-mono text-faded/80">
        {t("bornEraLine").replace("{era}", eraLabelText(s.bornEra ?? currentEraYears()))}
      </p>

      <div className="space-y-2 text-sm">
        <div>
          <div className="flex justify-between text-xs text-faded mb-0.5">
            <span>{t("statHp")}</span>
            <span>
              {s.hp}/{hpMax}
            </span>
          </div>
          <Bar v={s.hp} max={hpMax} cls="bg-vermillion" />
        </div>
        <div>
          <div className="flex justify-between text-xs text-faded mb-0.5">
            <span>{t("statMp")}</span>
            <span>
              {s.mp}/{mpMax}
            </span>
          </div>
          <Bar v={s.mp} max={mpMax} cls="bg-azure" />
        </div>
        <div>
          <div className="flex justify-between text-xs text-faded mb-0.5">
            <span>{t("statEnergy")}</span>
            <span>
              {Math.floor(s.energy ?? 0)}/{energyMaxOf(s)}
            </span>
          </div>
          <Bar v={s.energy ?? 0} max={energyMaxOf(s)} cls="bg-gold" />
        </div>
        <div>
          <div className="flex justify-between text-xs text-faded mb-0.5">
            <span>{t("statExp")}</span>
            <span>
              {s.exp}/{expNeed}
            </span>
          </div>
          <Bar v={s.exp} max={expNeed} cls="bg-jade" />
        </div>
      </div>

      <button
        onClick={() => setMainView("sect")}
        title={t("sectHallTooltip")}
        className="w-full mt-3 mb-1 flex items-center justify-between gap-2 rounded-sm border-2 border-fuchsia-400/50 bg-gradient-to-r from-fuchsia-400/15 via-gold/10 to-fuchsia-400/15 px-3 py-2.5 transition-colors hover:border-fuchsia-400 hover:from-fuchsia-400/25 hover:to-fuchsia-400/25"
      >
        <span className="min-w-0 text-left">
          <span className="block text-base font-bold text-fuchsia-300">
            {sect ? sectDisplayName(sect, lang) : t("statLoose")} {t("sectHall")}
          </span>
          {sect && (
            <span className="block text-xs text-cream/80 mt-0.5">
              {t("combatDamage")} ×{sectMult.toFixed(2)} · {t("sectHallDetail")}
            </span>
          )}
        </span>
        <span className="shrink-0 text-lg text-fuchsia-300">▸</span>
      </button>

      <div className="divider">◆</div>

      <div className="grid grid-cols-2 gap-y-1 text-sm">
        <span className="text-faded">{t("statLife")}</span>
        <span
          className={`text-right ${maxLifeOf(s) - s.age <= maxLifeOf(s) * 0.2 ? "text-vermillion" : ""}`}
        >
          {s.age}/{maxLifeOf(s)}
          {t("yearsSuffix")}
        </span>
        <span className="text-faded">{t("statDay")}</span>
        <span className="text-right">{t("statDayValue").replace("{n}", String(s.day))}</span>
        {s.xianli > 0 && (
          <>
            <span className="text-faded">{t("statXianli")}</span>
            <span className={`text-right font-bold ${XIANLI_COLOR}`}>
              {t("xianliValue")
                .replace("{n}", String(s.xianli))
                .replace("{mult}", (1 + s.xianli * XIANLI_MULT).toFixed(1))}
            </span>
          </>
        )}
        {baseAtk !== atk ? (
          <>
            <span className="text-faded">{t("statBaseAtk")}</span>
            <span className="text-right text-faded">{baseAtk}</span>
            <span className="text-faded">{t("statAtkBoosted")}</span>
            <span className={`text-right font-bold ${XIANLI_COLOR}`}>{atk}</span>
          </>
        ) : (
          <>
            <span className="text-faded">{t("statAtk")}</span>
            <span className="text-right">{atk}</span>
          </>
        )}
        <span className="text-faded">{t("statDef")}</span>
        <span className="text-right">{def}</span>
        <span className="text-faded">{t("statSpeed")}</span>
        <span className="text-right">{speed}</span>
        {s.boonHp + s.boonAtk + s.boonDef + s.boonSpeed > 0 && (
          <>
            <span className="text-fuchsia-300">{t("statBoon")}</span>
            <span className="text-right text-fuchsia-300 text-xs">
              {[
                s.boonHp && (lang === "en" ? `HP+${s.boonHp}` : `血+${s.boonHp}`),
                s.boonAtk && (lang === "en" ? `ATK+${s.boonAtk}` : `攻+${s.boonAtk}`),
                s.boonDef && (lang === "en" ? `DEF+${s.boonDef}` : `防+${s.boonDef}`),
                s.boonSpeed && (lang === "en" ? `SPD+${s.boonSpeed}` : `速+${s.boonSpeed}`),
              ]
                .filter(Boolean)
                .join(" ")}
            </span>
          </>
        )}
        <span className="text-faded">{t("statStones")}</span>
        <span className="text-right text-gold">
          <StoneAmount n={s.stones} />
        </span>
        {(s.pouchStones ?? 0) > 0 && (
          <>
            <span className="text-fuchsia-300/80">{t("pouchTitle")}</span>
            <span className="text-right text-fuchsia-300">
              <StoneAmount n={s.pouchStones ?? 0} />
            </span>
          </>
        )}
      </div>

      <div className="divider">{t("statEquip")}</div>
      <div className="grid grid-cols-2 gap-y-1 text-sm">
        {EQUIP_SLOTS.map(({ slot, label }) => {
          const id = equipMap[slot];
          const it = id ? itemById(id) : null;
          const xuantian = id ? isXuantianArtifact(id) : false;
          const valueCls = `text-right ${xuantian ? "text-xuantian" : it ? (slot === "pet" ? "text-fuchsia-300" : "text-cream") : "text-faded/50"}`;
          const nameCls = xuantian
            ? "text-xuantian"
            : slot === "pet"
              ? "text-fuchsia-300"
              : it && isXianItem(it)
                ? XIAN_ITEM_COLOR
                : "text-cream";
          return (
            <div key={slot} className="contents">
              <span className="text-faded">{equipSlotLabel(slot, label, lang)}</span>
              {it ? (
                <span className="text-right">
                  <Tooltip
                    content={[itemStatLine(it, t), itemDisplayDesc(it, lang)]
                      .filter(Boolean)
                      .join(" · ")}
                  >
                    <span
                      className={`${nameCls} cursor-help underline decoration-dotted decoration-faded/40 underline-offset-2`}
                    >
                      {itemDisplayName(it, lang)}
                    </span>
                  </Tooltip>
                </span>
              ) : (
                <span className={valueCls}>—</span>
              )}
            </div>
          );
        })}
      </div>

      {s.learning && (
        <>
          <div className="divider">◆</div>
          <div className="text-sm">
            <div className="flex items-baseline justify-between">
              <span className="text-azure font-bold">{t("learningLabel")}</span>
              <span className="text-xs font-mono text-faded">
                {t("learningRemain").replace("{n}", String(s.learning.remain))}
              </span>
            </div>
            <p className="text-cream mt-0.5">
              {techDisplayName(techById(s.learning.techId), lang)}
            </p>
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
          {t("btnGatherMp")}
        </button>
      </div>
    </div>
  );
}

// 五行屬性 → 十六進位色碼(供打擊特效動態上色,對應 tailwind.config.ts 的 metal/wood/water/fire/earth)
const ELEMENT_HEX: Record<Element, string> = {
  金: "#d4af37",
  木: "#5aa860",
  水: "#5a8fd0",
  火: "#e0603a",
  土: "#b08040",
  無: "#eeac43",
};
function hexToRgba(hex: string, alpha: number): string {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return `rgba(${r},${g},${b},${alpha})`;
}
// tone(target 預設色,見 DamageFloats)對應的色碼,供無屬性傷害(法器/法術攻擊等)的發光效果使用
const TONE_HEX: Record<string, string> = { "text-gold": "#c9a227", "text-vermillion": "#c03a2b" };

// 戰鬥浮動傷害數字(3.5 版新增,3.15 版擴充屬性配色/加成標示,3.16 版加大加華麗):讀取
// store.damageEvents,依 target 分別浮在怪物氣血條上方(對怪物造成傷害)或玩家面板上方(玩家受到
// 傷害),動畫結束後自行從 store 移除,不需要外部計時器。element 決定數字顏色(未帶則沿用預設
// tone,例如法器/法術攻擊等無屬性傷害);advantage 額外標示「克制!/抵抗」,僅玩家出牌造成的傷害
// 才會帶,同時決定字級與發光強度——克制的這一下明顯放大 + 多一圈爆閃襯底,被剋則縮小示弱,一般
// 傷害維持中等字級,拉開三者的視覺份量差異。
function DamageFloats({ target, tone }: { target: "monster" | "player"; tone: string }) {
  const t = useT();
  const events = useGame((x) => x.damageEvents);
  const consume = useGame((x) => x.consumeDamageEvent);
  const mine = events.filter((e) => e.target === target);
  if (mine.length === 0) return null;
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 flex justify-center overflow-visible z-10">
      {mine.map((e) => {
        const hex = e.element && e.element !== "無" ? ELEMENT_HEX[e.element] : (TONE_HEX[tone] ?? "#eeac43");
        const sizeClass =
          e.advantage === "super" ? "text-4xl" : e.advantage === "resist" ? "text-xl" : "text-3xl";
        return (
          <span
            key={e.id}
            className={`absolute flex flex-col items-center font-mono font-black ${sizeClass} animate-dmgFloat ${
              e.element && e.element !== "無" ? ELEMENT_COLOR[e.element] : tone
            }`}
            style={{
              textShadow: `0 1px 3px rgba(0,0,0,0.75), 0 0 14px ${hexToRgba(hex, 0.85)}, 0 0 30px ${hexToRgba(hex, 0.4)}`,
            }}
            onAnimationEnd={() => consume(e.id)}
          >
            {e.advantage === "super" && (
              <span
                aria-hidden="true"
                className="dmg-float-burst"
                style={{ "--burst-color": hex } as CSSProperties}
              />
            )}
            <span>-{formatDamage(e.amount)}</span>
            {e.advantage && (
              <span
                className={`text-[11px] font-bold tracking-wide ${
                  e.advantage === "super" ? "text-gold" : "text-faded"
                }`}
              >
                {e.advantage === "super" ? t("dmgAdvantageSuper") : t("dmgAdvantageResist")}
              </span>
            )}
          </span>
        );
      })}
    </div>
  );
}

// 打擊特效(3.15 版新增):跟浮動數字共用同一份 damageEvents,但只取「最新一筆」驅動一次性的擊中
// 爆閃/紅光,依屬性動態上色(monster 側;player 側統一用受擊紅)。跟 castEffect(出牌當下的樂觀特效,
// 命中與否都會播)不同,這是伺服器確認真的造成傷害後才觸發,分開渲染避免擠在同一個容器裡搶位置。
function HitImpact({ side }: { side: "monster" | "player" }) {
  const events = useGame((x) => x.damageEvents);
  const mine = events.filter((e) => e.target === side);
  const latest = mine[mine.length - 1];
  if (!latest) return null;
  const hitHex = ELEMENT_HEX[latest.element ?? "無"];
  return (
    <span
      key={latest.id}
      aria-hidden="true"
      className={side === "monster" ? "battle-hit-flash" : "battle-player-hit-flash"}
      style={
        side === "monster"
          ? ({
              "--hit-color": hitHex,
              "--hit-color-soft": hexToRgba(hitHex, 0.5),
              "--hit-color-glow": hexToRgba(hitHex, 0.32),
            } as CSSProperties)
          : undefined
      }
    />
  );
}

export function CombatPanel() {
  const s = useGame((x) => x.save)!;
  const act = useGame((x) => x.act);
  const busy = useGame((x) => x.busy);
  const t = useT();
  const lang = useGame((x) => x.language);
  const combat = s.combat;
  // 出牌改為「先選取、按出牌才打出」(3.5 版新增):以手牌位置(slot)記錄選取,允許同名重複符寶
  // 各自獨立選取。手牌內容一變(打出/回合結束重抽)就代表舊的選取位置全部失效,一併清空。
  const [selectedSlots, setSelectedSlots] = useState<number[]>([]);
  const [castEffect, setCastEffect] = useState<{
    id: number;
    slots: number[];
    handKey: string;
  } | null>(null);
  const handKey = (combat?.hand ?? []).join(",");
  useEffect(() => {
    setSelectedSlots([]);
  }, [handKey]);
  useEffect(() => {
    if (!castEffect) return;
    const timeout = window.setTimeout(() => setCastEffect(null), 450);
    return () => window.clearTimeout(timeout);
  }, [castEffect]);
  // 怪物受擊震動(3.16 版新增):取最新一筆對怪物造成傷害的事件 id 當作圖騰的 key,每次真的造成
  // 傷害就強制重新掛載該 span,讓 .battle-sigil-glyph-shake 的震動動畫跟著重播一次(CSS 動畫套用
  // 同一個 class 不會自動重播,靠 key 換掉整個節點才會)。
  const monsterHitEvents = useGame((x) => x.damageEvents).filter((e) => e.target === "monster");
  const lastMonsterHitId = monsterHitEvents[monsterHitEvents.length - 1]?.id;

  if (!combat) {
    return (
      <div className="panel deco-frame">
        <p className="panel-title">{t("combatTitle")}</p>
        <p className="text-sm text-faded">{t("combatIdle")}</p>
      </div>
    );
  }

  const mon = MONSTERS.find((m) => m.id === combat.monsterId)!;
  // 符寶袋(3.4 版):可施展的仙法是伺服器維護的「手牌」(combat.hand)——開戰從符寶袋洗牌抽 5 張,
  // 打出的牌進棄牌堆,回合結束手中剩牌一併棄置、重新抽 5 張。手牌可能有同名重複符寶(符寶袋本來就
  // 允許放入多張同一門仙法),渲染時需要用陣列索引而非 tech.id 當 key。舊戰鬥(部署前就已開打、
  // combat 缺少 hand 欄位)以「已學會的全部」作為後備顯示。
  const usable = (combat.hand ?? s.learned).map((id, i) => ({ tech: techById(id), slot: i }));
  const isLord = combat.isLord || mon.isLord;
  const isTianjieTrial = !!combat.tianjieTrial;
  const hpMaxMon = combat.bossHpMax ?? mon.hp; // 浮屠塔動態 BOSS 用其實際上限
  const monName = monsterDisplayName(mon, lang);
  const displayName = combat.futuFloor ? `${monName} · 第 ${combat.futuFloor} 層` : monName;
  const battleLocation = LOCATIONS.find((loc) => loc.id === combat.locationId);
  const { hpMax, mpMax } = statsOf(s);
  const elementGlyph: Record<string, string> = { 金: "金", 木: "木", 水: "水", 火: "火", 土: "土" };
  const STATUS_ICON: Record<string, string> = {
    burn: "🔥",
    poison: "☠️",
    freeze: "❄️",
    weaken: "🔻",
    evade: "🌫️",
  };
  const STATUS_KEY: Record<string, DictKey> = {
    burn: "statusBurn",
    poison: "statusPoison",
    freeze: "statusFreeze",
    weaken: "statusWeaken",
    evade: "statusEvade",
  };
  const statusChip = (kind: string, turns: number, tone: string) => (
    <span key={kind} className={`chip ${tone}`}>
      {STATUS_ICON[kind]} {t(STATUS_KEY[kind])} ·{" "}
      {t("statusTurnsSuffix").replace("{n}", String(turns))}
    </span>
  );
  const monsterStatusChips = (combat.monsterStatus ?? []).map((e) =>
    statusChip(e.kind, e.turns, "text-vermillion border-vermillion/50"),
  );
  const playerStatusChips = (combat.playerStatus ?? []).map((e) =>
    statusChip(e.kind, e.turns, "text-azure border-azure/50"),
  );
  if ((combat.playerShield ?? 0) > 0) {
    playerStatusChips.push(
      <span key="shield" className="chip text-jade border-jade/50">
        🛡 {t("combatShieldChip").replace("{n}", String(combat.playerShield))}
      </span>,
    );
  }
  // 戰術卡(3.1 版新增):儲物袋中 kind === "tactic" 且持有數量 > 0 者,戰鬥中可直接打出
  const tacticEntries = Object.entries(s.inventory)
    .map(([id, n]) => ({ id, n, item: itemById(id) }))
    .filter((e) => e.item.kind === "tactic" && e.n > 0);

  // 出牌改為「先選取、按出牌才打出」(3.5 版新增)。手牌一變(打出/回合結束重抽)時,舊的選取位置
  // 會由下面的 useEffect 清空,但那是非同步的——本次 render 仍可能先跑到、selectedSlots 裡还留著
  // 已經不存在於新 usable 裡的 slot,這裡一律先過濾掉不存在的 slot 再使用,避免 .tech 噴 undefined。
  const validSelectedSlots = selectedSlots.filter((slot) => usable.some((u) => u.slot === slot));
  const selectedTechIds = validSelectedSlots.map(
    (slot) => usable.find((u) => u.slot === slot)!.tech.id,
  );
  const selectedCost = selectedTechIds.reduce((sum, id) => sum + techById(id).mpCost, 0);
  // 法器攻擊只能單獨出牌(3.8 版新增):選取它就清空其他選取,選取其他符寶時若手上已選著法器攻擊也會先清空
  const toggleSlot = (slot: number) => {
    const found = usable.find((u) => u.slot === slot);
    if (!found) return;
    const tech = found.tech;
    setSelectedSlots(() => {
      const prev = validSelectedSlots;
      if (prev.includes(slot)) return prev.filter((x) => x !== slot);
      if (tech.soloOnly) return [slot];
      const hasSolo = prev.some((s2) => usable.find((u) => u.slot === s2)?.tech.soloOnly);
      return hasSolo ? [slot] : [...prev, slot];
    });
  };
  const playSelected = () => {
    if (selectedTechIds.length === 0) return;
    setCastEffect((current) => ({
      id: (current?.id ?? 0) + 1,
      slots: validSelectedSlots,
      handKey,
    }));
    act("castBatch", { techIds: selectedTechIds });
  };

  return (
    <section
      className={`battle-view ${isTianjieTrial ? "battle-trial" : isLord ? "battle-lord" : ""}`}
      aria-label={t("combatTitle")}
    >
      <header className="battle-header">
        <div className="battle-brand">
          <span className="battle-brand-mark">✦</span>
          <div>
            <p className="battle-eyebrow">{t("appTitle")}</p>
            <h1>
              {isTianjieTrial
                ? t("combatTianjieArrives")
                : combat.futuFloor
                  ? t("combatFutu")
                  : isLord
                    ? t("combatLordArrives")
                    : t("combatFierce")}
            </h1>
          </div>
        </div>
        <div className="battle-header-meta">
          {battleLocation && <span>{locationDisplayName(battleLocation, lang)}</span>}
          <span className="battle-header-player">{s.name}</span>
          <span className="battle-header-rule" />
          <span>
            {t("statDay")} {s.day}
          </span>
        </div>
      </header>

      <div className="battle-content">
        <div className="battle-arena deco-frame">
          <div className="battle-arena-copy">
            <span className={`chip ${ELEMENT_COLOR[mon.element]}`}>
              {lang === "en" ? elementLabel(mon.element, lang) : `${mon.element}屬性`}
            </span>
            {isTianjieTrial ? (
              <span className="chip text-red-400 border-red-500/60">{t("combatTianjieChip")}</span>
            ) : isLord ? (
              <span className="chip text-fuchsia-400 border-fuchsia-400/60">
                {combat.futuFloor ? t("combatIllusionChip") : t("combatLordChip")}
              </span>
            ) : null}
            <h2>{displayName}</h2>
            <p>{monsterDisplayDesc(mon, lang)}</p>
          </div>
          <div className="battle-sigil" aria-hidden="true">
            <span className="battle-sigil-ring" />
            <span
              key={lastMonsterHitId ?? "idle"}
              className={`battle-sigil-glyph${lastMonsterHitId ? " battle-sigil-glyph-shake" : ""}`}
            >
              {elementGlyph[mon.element] ?? "妖"}
            </span>
            {castEffect && <span key={castEffect.id} className="battle-cast-flash" />}
            <HitImpact side="monster" />
          </div>
          <div className="battle-enemy-footer">
            <div className="battle-enemy-health relative">
              <DamageFloats target="monster" tone="text-gold" />
              <div className="battle-bar-label">
                <span>{t("combatMonHp")}</span>
                <strong>
                  {combat.monsterHp} / {hpMaxMon}
                </strong>
              </div>
              <div className="battle-meter">
                <span
                  className="battle-meter-enemy"
                  style={{
                    width: `${Math.max(0, Math.min(100, (combat.monsterHp / hpMaxMon) * 100))}%`,
                  }}
                />
              </div>
            </div>
            <div className="battle-status-line">
              <span>{t("statusSideMonster")}</span>
              {monsterStatusChips.length > 0 ? (
                monsterStatusChips
              ) : (
                <span className="battle-no-status">—</span>
              )}
            </div>
          </div>
        </div>

        <div className="battle-player deco-frame">
          <HitImpact side="player" />
          <DamageFloats target="player" tone="text-vermillion" />
          <div className="battle-player-name">
            <span className="battle-player-symbol">◆</span>
            <div>
              <span>{t("statusSidePlayer")}</span>
              <strong>{s.name}</strong>
            </div>
          </div>
          <div className="battle-player-vitals">
            <div className="battle-vital">
              <div className="battle-bar-label">
                <span>{t("statHp")}</span>
                <strong>
                  {s.hp} / {hpMax}
                </strong>
              </div>
              <div className="battle-meter">
                <span
                  className="battle-meter-hp"
                  style={{ width: `${Math.max(0, Math.min(100, (s.hp / hpMax) * 100))}%` }}
                />
              </div>
            </div>
            <div className="battle-vital">
              <div className="battle-bar-label">
                <span>{t("statMp")}</span>
                <strong>
                  {s.mp} / {mpMax}
                </strong>
              </div>
              <div className="battle-meter">
                <span
                  className="battle-meter-mp"
                  style={{ width: `${Math.max(0, Math.min(100, (s.mp / mpMax) * 100))}%` }}
                />
              </div>
            </div>
          </div>
          <div className="battle-player-status">
            <span>{t("statusSidePlayer")}</span>
            {playerStatusChips.length > 0 ? (
              playerStatusChips
            ) : (
              <span className="battle-no-status">—</span>
            )}
          </div>
        </div>

        <div className="battle-hand-heading">
          <div>
            <span className="battle-section-number">01 /</span>
            <h2>{t("combatHandTitle")}</h2>
            <span className="battle-hand-count">{usable.length}</span>
          </div>
          <p>{t("combatSelectHint")}</p>
        </div>
        <div className="battle-hand" aria-label={t("combatHandTitle")}>
          {usable.length === 0 && <p className="battle-empty-hand">{t("combatEmptyHand")}</p>}
          {usable.map(({ tech, slot }) => {
            const selected = validSelectedSlots.includes(slot);
            const elLabel = elementLabel(tech.element, lang);
            const fullElLabel = tech.extraElements?.length
              ? [tech.element, ...tech.extraElements]
                  .map((el) => elementLabel(el, lang))
                  .join(lang === "en" ? "/" : "・")
              : elLabel;
            const buffNote = tech.synergyPct
              ? t("synergyNoteTemplate")
                  .replace("{el}", elLabel)
                  .replace("{pct}", String(Math.round(tech.synergyPct * 100)))
              : tech.nextPlayBuffPct
                ? t("nextBuffNoteTemplate")
                    .replace("{el}", elLabel)
                    .replace("{pct}", String(Math.round(tech.nextPlayBuffPct * 100)))
                : tech.comboSizePct
                  ? t("comboSizeNoteTemplate").replace(
                      "{pct}",
                      String(Math.round(tech.comboSizePct * 100)),
                    )
                  : tech.crossElementPct
                    ? t("crossElementNoteTemplate").replace(
                        "{pct}",
                        String(Math.round(tech.crossElementPct * 100)),
                      )
                    : tech.manaGain
                      ? t("manaGainNoteTemplate").replace("{n}", String(tech.manaGain))
                      : tech.shieldPct
                        ? t("shieldNoteTemplate").replace(
                            "{pct}",
                            String(Math.round(tech.shieldPct * 100)),
                          )
                        : tech.hits && tech.hits > 1
                          ? t("hitsNoteTemplate").replace("{n}", String(tech.hits))
                          : tech.chargeNextTurnPct
                            ? t("chargeNoteTemplate").replace(
                                "{pct}",
                                String(Math.round(tech.chargeNextTurnPct * 100)),
                              )
                            : tech.selfStatus === "evade"
                              ? t("evadeNoteTemplate")
                              : tech.selfCleanse
                                ? t("cleanseNoteTemplate")
                                : tech.lifeStealPct
                                  ? t("lifeStealNoteTemplate").replace(
                                      "{pct}",
                                      String(Math.round(tech.lifeStealPct * 100)),
                                    )
                                  : tech.forceStatus
                                    ? t("forceStatusNoteTemplate").replace(
                                        "{status}",
                                        t(
                                          (
                                            {
                                              burn: "statusBurn",
                                              poison: "statusPoison",
                                              freeze: "statusFreeze",
                                            } as const
                                          )[tech.forceStatus],
                                        ),
                                      )
                                    : tech.endsTurn
                                      ? t("endsTurnNoteTemplate")
                                      : tech.soloOnly
                                        ? t("talismanCardSoloNote")
                                        : null;
            return (
              <button
                key={`${tech.id}-${slot}`}
                type="button"
                className={`battle-card ${spellCardBorderClass(tech)} ${selected ? "battle-card-selected" : ""} ${castEffect?.handKey === handKey && castEffect.slots.includes(slot) ? "battle-card-casting" : ""}`}
                disabled={busy || (!selected && s.mp < tech.mpCost)}
                onClick={() => toggleSlot(slot)}
                aria-pressed={selected}
                title={techDisplayDesc(tech, lang)}
              >
                <span className="battle-card-top">
                  <span className={ELEMENT_COLOR[tech.element]}>
                    {tech.id === "artifact_attack" ? t("perEquippedWeapon") : fullElLabel}
                  </span>
                  <span>{String(slot + 1).padStart(2, "0")}</span>
                </span>
                <Image
                  className="battle-card-art"
                  src={`/images/cards/${tech.id === "artifact_attack" ? "artifact" : CARD_ART[tech.element]}.webp`}
                  alt=""
                  width={96}
                  height={96}
                />
                <span className="battle-card-body">
                  <strong>{techDisplayName(tech, lang)}</strong>
                  <span>{buffNote || techDisplayDesc(tech, lang)}</span>
                </span>
                <span className="battle-card-bottom">
                  <span>
                    {t("statMp")} {tech.mpCost}
                  </span>
                  {tech.id !== "artifact_attack" && <span>{tech.power.toFixed(1)}</span>}
                </span>
              </button>
            );
          })}
        </div>

        {tacticEntries.length > 0 && (
          <details className="battle-tactics">
            <summary>
              {t("combatTacticTitle")} <span>{tacticEntries.length}</span>
            </summary>
            <div className="battle-tactic-list">
              {tacticEntries.map(({ id, n, item }) => (
                <button
                  key={id}
                  className="btn border-jade/40"
                  disabled={busy}
                  onClick={() => act("useTacticCard", { itemId: id })}
                  title={itemDisplayDesc(item, lang)}
                >
                  <span>
                    {itemDisplayName(item, lang)} ×{n}
                  </span>
                  <span className="text-jade">{t("btnPlayTactic")}</span>
                </button>
              ))}
            </div>
          </details>
        )}
        <details className="battle-tactics battle-rules" open={isTianjieTrial}>
          <summary>{t("combatGuideTitle")}</summary>
          <p>{t("combatTurnNote")}</p>
          <p>{t("counterNote")}</p>
          <p>{isTianjieTrial ? t("combatTianjieNote") : t("combatHandNote")}</p>
        </details>
        <details className="battle-log">
          <summary>
            <span>{t("logTitle")}</span>
            <p aria-live="polite">{s.log.at(-1) ?? t("logEmptyMsg")}</p>
          </summary>
          <ol>
            {s.log.map((line, index) => (
              <li key={index}>{line}</li>
            ))}
          </ol>
        </details>
      </div>

      <footer className="battle-actions">
        <div className="battle-selection">
          <span>
            {t("combatSelectedLabel")} <strong>{selectedTechIds.length}</strong>
          </span>
          <span>
            {t("combatCostLabel")} <strong>{selectedCost}</strong>
          </span>
          <span>
            {t("combatRemainingLabel")}{" "}
            <strong className={s.mp < selectedCost ? "text-vermillion" : ""}>
              {s.mp - selectedCost}
            </strong>
          </span>
        </div>
        <div className="battle-action-buttons">
          {!isTianjieTrial && (
            <button
              className="btn btn-danger battle-flee"
              disabled={busy}
              onClick={() => act("flee")}
            >
              {t("btnFlee")}
            </button>
          )}
          <button className="btn battle-end" disabled={busy} onClick={() => act("endTurn")}>
            {t("btnEndTurn")}
          </button>
          <button
            className="btn battle-play"
            disabled={busy || selectedTechIds.length === 0 || s.mp < selectedCost}
            onClick={playSelected}
          >
            {t("btnPlayCards")}
            {selectedTechIds.length > 0 ? ` ×${selectedTechIds.length}` : ""}
            <span aria-hidden="true">↗</span>
          </button>
        </div>
      </footer>
    </section>
  );
}
