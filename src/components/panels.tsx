"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import {
  useGame,
  statsOf,
  maxLifeOf,
  energyMaxOf,
  XIANLI_MULT,
  sectDamageMultOfStages,
  HAND_SIZE,
  rerollHandCost,
} from "@/game/store";
import { REALMS } from "@/game/data/realms";
import { SECTS } from "@/game/data/sects";
import { MONSTERS } from "@/game/data/world";
import { itemById, isXuantianArtifact } from "@/game/data/items";
import { currentEraYears, eraLabelText } from "@/game/data/eraTime";
import { techById } from "@/game/data/techniques";
import { ELEMENT_COLOR, ELEMENTS, XIANLI_COLOR, EQUIP_SLOTS, nameColorOf, isXianItem, XIAN_ITEM_COLOR } from "@/game/types";
import { useT } from "@/i18n/useT";
import type { DictKey } from "@/i18n/dict";
import { itemDisplayName, itemDisplayDesc, itemStatLine } from "@/i18n/itemText";
import Tooltip from "./Tooltip";
import { monsterDisplayName, monsterDisplayDesc } from "@/i18n/monsterText";
import { techDisplayName, techDisplayDesc } from "@/i18n/techText";
import { realmDisplayName } from "@/i18n/realmText";
import { sectDisplayName } from "@/i18n/sectText";
import { elementLabel, equipSlotLabel } from "@/i18n/labelText";
import { MONSTER_TEXT_EN } from "@/i18n/monsterText";
import StoneAmount from "./StoneAmount";

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
              {TAIYI_SOULS.filter((ts) => (s.inventory[ts.id] ?? 0) >= 1).length}/4 {t("taiyiSoulSuffix")}
            </span>
          </div>
          <p className="text-sm text-faded mt-1">{t("taiyiDesc")}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {TAIYI_SOULS.map((ts) => {
              const has = (s.inventory[ts.id] ?? 0) >= 1;
              const label =
                lang === "en" ? (MONSTER_TEXT_EN[TAIYI_SOUL_LORD_ID[ts.id]]?.name ?? ts.label) : ts.label;
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
      <p className={`mb-1 ${isXian ? "text-fuchsia-300 font-bold" : "text-gold"}`}>{realmDisplayName(realm, lang)}</p>
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
                    content={[itemStatLine(it, t), itemDisplayDesc(it, lang)].filter(Boolean).join(" · ")}
                  >
                    <span className={`${nameCls} cursor-help underline decoration-dotted decoration-faded/40 underline-offset-2`}>
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
            <p className="text-cream mt-0.5">{techDisplayName(techById(s.learning.techId), lang)}</p>
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

export function CombatPanel() {
  const s = useGame((x) => x.save)!;
  const act = useGame((x) => x.act);
  const busy = useGame((x) => x.busy);
  const t = useT();
  const lang = useGame((x) => x.language);
  const combat = s.combat;

  // 手機版單欄排版時,遭遇戰鬥當下自動把畫面捲到戰況欄(桌面版通常已在可視範圍內,scrollIntoView 不會有明顯動作)
  const panelRef = useRef<HTMLDivElement>(null);
  const hadCombatRef = useRef(false);
  useEffect(() => {
    const hasCombat = !!combat;
    if (hasCombat && !hadCombatRef.current) {
      panelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    hadCombatRef.current = hasCombat;
  }, [combat]);

  if (!combat) {
    return (
      <div className="panel deco-frame">
        <p className="panel-title">{t("combatTitle")}</p>
        <p className="text-sm text-faded">{t("combatIdle")}</p>
      </div>
    );
  }

  const mon = MONSTERS.find((m) => m.id === combat.monsterId)!;
  // 仙法卡牌化(2.21 版新增,3.1 版改為持有制):可施展的仙法不再是「已學會的全部」,而是伺服器維護的
  // 「手牌」(combat.hand)——戰鬥開始抽一次,之後打出一張只換那一張,其餘留在手中。法器攻擊不受手牌
  // 限制,恆常可用。舊戰鬥(部署前就已開打、combat 缺少 hand 欄位)以「已學會的全部」作為後備顯示。
  const usable = (combat.hand ?? s.learned).map(techById);
  const isLord = combat.isLord || mon.isLord;
  const isTianjieTrial = !!combat.tianjieTrial;
  const hpMaxMon = combat.bossHpMax ?? mon.hp; // 浮屠塔動態 BOSS 用其實際上限
  const monName = monsterDisplayName(mon, lang);
  const displayName = combat.futuFloor ? `${monName} · 第 ${combat.futuFloor} 層` : monName;
  const STATUS_ICON: Record<string, string> = { burn: "🔥", poison: "☠️", freeze: "❄️", weaken: "🔻" };
  const STATUS_KEY: Record<string, DictKey> = {
    burn: "statusBurn",
    poison: "statusPoison",
    freeze: "statusFreeze",
    weaken: "statusWeaken",
  };
  const statusChip = (kind: string, turns: number, tone: string) => (
    <span key={kind} className={`chip ${tone}`}>
      {STATUS_ICON[kind]} {t(STATUS_KEY[kind])} · {t("statusTurnsSuffix").replace("{n}", String(turns))}
    </span>
  );
  const monsterStatusChips = (combat.monsterStatus ?? []).map((e) =>
    statusChip(e.kind, e.turns, "text-vermillion border-vermillion/50"),
  );
  const playerStatusChips = (combat.playerStatus ?? []).map((e) =>
    statusChip(e.kind, e.turns, "text-azure border-azure/50"),
  );
  const { mpMax } = statsOf(s);
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
  const rerollCost = rerollHandCost(mpMax);

  return (
    <div
      ref={panelRef}
      className={`panel deco-frame ${
        isTianjieTrial
          ? "border-red-500/80 shadow-[0_0_18px_rgba(239,68,68,0.4)]"
          : isLord
            ? "border-fuchsia-400/70 shadow-[0_0_18px_rgba(232,121,249,0.25)]"
            : "border-vermillion/40"
      }`}
    >
      <p className={`panel-title ${isTianjieTrial ? "text-red-400" : isLord ? "text-fuchsia-300" : "text-cinnabar"}`}>
        {isTianjieTrial
          ? t("combatTianjieArrives")
          : combat.futuFloor
            ? t("combatFutu")
            : isLord
              ? t("combatLordArrives")
              : t("combatFierce")}
      </p>
      <div className="flex items-baseline justify-between">
        <span className={`text-lg font-bold ${isTianjieTrial ? "text-red-400" : isLord ? "text-fuchsia-300" : ""}`}>
          {isTianjieTrial ? (
            <span className="chip mr-2 text-red-400 border-red-500/60">{t("combatTianjieChip")}</span>
          ) : (
            isLord && (
              <span className="chip mr-2 text-fuchsia-400 border-fuchsia-400/60">
                {combat.futuFloor ? t("combatIllusionChip") : t("combatLordChip")}
              </span>
            )
          )}
          {displayName}
        </span>
        <span className={`chip ${ELEMENT_COLOR[mon.element]}`}>
          {lang === "en" ? elementLabel(mon.element, lang) : `${mon.element}屬性`}
        </span>
      </div>
      <p className="text-sm text-faded mt-1">{monsterDisplayDesc(mon, lang)}</p>
      <div className="mt-3">
        <div className="flex justify-between text-xs text-faded mb-0.5">
          <span>{t("combatMonHp")}</span>
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

      {(monsterStatusChips.length > 0 || playerStatusChips.length > 0) && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {monsterStatusChips}
          {playerStatusChips}
        </div>
      )}

      <p className="text-[10px] tracking-[0.2em] text-faded/60 uppercase mt-4 mb-1.5">{t("combatHandTitle")}</p>
      <div className="flex flex-wrap gap-2.5">
        <button
          className="spell-card border-gold/50"
          disabled={busy}
          onClick={() => act("attack")}
          title={t("btnWeaponAttack")}
        >
          <span className="spell-card-badge border-gold/60 text-gold">{t("permanentCardTag")}</span>
          <span className="spell-card-name">{t("btnWeaponAttack")}</span>
          <span className="spell-card-foot">
            <span>⚔️</span>
          </span>
        </button>
        {usable.map((tech) => (
          <button
            key={tech.id}
            className={`spell-card ${ELEMENT_COLOR[tech.element]}`}
            disabled={busy || s.mp < tech.mpCost}
            onClick={() => act("cast", { techId: tech.id })}
            title={techDisplayDesc(tech, lang)}
          >
            <span className="spell-card-badge border-azure/60 text-azure">{tech.mpCost}</span>
            <span className="spell-card-name text-cream">{techDisplayName(tech, lang)}</span>
            <span className="spell-card-foot">
              <span className={ELEMENT_COLOR[tech.element]}>{elementLabel(tech.element, lang)}</span>
              <span>{tech.power.toFixed(1)}</span>
            </span>
          </button>
        ))}
        {!isTianjieTrial && (
          <button
            className="spell-card border-faded/30"
            disabled={busy || s.mp < rerollCost}
            onClick={() => act("rerollHand")}
            title={t("rerollHandTitle").replace("{n}", String(rerollCost))}
          >
            <span className="spell-card-badge border-faded/50 text-faded">{rerollCost}</span>
            <span className="spell-card-name">{t("btnRerollHand")}</span>
            <span className="spell-card-foot">
              <span>🔄</span>
            </span>
          </button>
        )}
      </div>

      {tacticEntries.length > 0 && (
        <>
          <p className="text-[10px] tracking-[0.2em] text-faded/60 uppercase mt-4 mb-1.5">
            {t("combatTacticTitle")}
          </p>
          <div className="flex flex-wrap gap-2.5">
            {tacticEntries.map(({ id, n, item }) => (
              <button
                key={id}
                className="spell-card border-jade/40"
                disabled={busy}
                onClick={() => act("useTacticCard", { itemId: id })}
                title={itemDisplayDesc(item, lang)}
              >
                <span className="spell-card-badge border-jade/60 text-jade">×{n}</span>
                <span className="spell-card-name">{itemDisplayName(item, lang)}</span>
                <span className="spell-card-foot">
                  <span>{t("btnPlayTactic")}</span>
                </span>
              </button>
            ))}
          </div>
        </>
      )}

      <div className="mt-4">
        {!isTianjieTrial && (
          <button className="btn btn-danger" disabled={busy} onClick={() => act("flee")}>
            {t("btnFlee")}
          </button>
        )}
      </div>
      <p className="text-xs text-faded/60 mt-3">
        {isTianjieTrial ? t("combatTianjieNote") : t("counterNote")}
      </p>
      {s.learned.length > HAND_SIZE && !isTianjieTrial && (
        <p className="text-xs text-faded/60">{t("combatHandNote")}</p>
      )}
    </div>
  );
}
