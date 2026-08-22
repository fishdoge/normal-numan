"use client";

import { useEffect, useRef, useState } from "react";
import {
  useGame,
  statsOf,
  learnYears,
  techLevelOf,
  techPowerMult,
  MAX_TECH_LEVEL,
  ENERGY_COST,
  Tab,
} from "@/game/store";
import { LOCATIONS, MONSTERS, RECIPES, REGIONS } from "@/game/data/world";
import { ITEMS, itemById, isXuantianArtifact } from "@/game/data/items";
import { REALMS } from "@/game/data/realms";
import { SECTS } from "@/game/data/sects";
import { techById } from "@/game/data/techniques";
import { BLACK_MARKET_CATALOG } from "@/game/data/blackMarket";
import { ITEM_SECTIONS } from "@/game/data/itemSections";
import { ELEMENT_COLOR, ItemKind, ItemDef, formatStones, isXianItem, XIAN_ITEM_COLOR } from "@/game/types";
import Tooltip from "./Tooltip";
import { useT } from "@/i18n/useT";
import type { DictKey } from "@/i18n/dict";
import { itemDisplayName, itemDisplayDesc } from "@/i18n/itemText";
import { monsterDisplayName, monsterDisplayDesc } from "@/i18n/monsterText";
import { techDisplayName, techDisplayDesc } from "@/i18n/techText";
import { regionDisplayName, regionDisplayDesc, locationDisplayName, locationDisplayDesc, recipeDisplayDesc } from "@/i18n/worldText";
import { realmDisplayName } from "@/i18n/realmText";
import { sectDisplayName } from "@/i18n/sectText";
import { kindLabel, elementLabel } from "@/i18n/labelText";
import StoneAmount from "./StoneAmount";

// 道具名稱標色:玄天仙器維持原本的流動漸層特效(優先),其餘達真仙品級需求的道具一律標紫,兩者皆非則不特別上色
const itemNameColor = (item: Pick<ItemDef, "reqStage">, xuantian: boolean) =>
  xuantian ? "text-xuantian" : isXianItem(item) ? XIAN_ITEM_COLOR : "";

export default function ActionTabs() {
  // 分頁狀態提到 store,讓道籍面板的「宗門」按鈕也能切換過來
  const tab = useGame((x) => x.activeTab);
  const setTab = useGame((x) => x.setActiveTab);
  const tt = useT(); // 命名為 tt,避免與下方 tabs.map(([t, label]) => ...) 的頁籤代號變數 t 衝突
  const tabs: [Tab, string][] = [
    ["explore", tt("tabExplore")],
    ["bag", tt("tabBag")],
    ["tech", tt("tabTech")],
    ["craft", tt("tabCraft")],
    ["market", tt("tabMarket")],
    ["trade", tt("tabTrade")],
    ["dex", tt("tabDex")],
    ["wanling", tt("tabWanling")],
    ["rank", tt("tabRank")],
  ];
  return (
    <div className="panel">
      <div className="flex flex-wrap gap-1 mb-4 border-b border-faded/20 pb-2">
        {tabs.map(([t, label]) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-1 text-sm rounded-sm transition-colors ${
              tab === t
                ? "bg-gold/15 text-gold border border-gold/40"
                : "text-faded hover:text-cream"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      {tab === "explore" && <ExploreTab />}
      {tab === "bag" && <BagTab />}
      {tab === "tech" && <TechTab />}
      {tab === "craft" && <CraftTab />}
      {tab === "market" && <MarketTab />}
      {tab === "trade" && <TradeTab />}
      {tab === "dex" && <DexTab />}
      {tab === "wanling" && <WanlingTab />}
      {tab === "rank" && <RankTab />}
    </div>
  );
}

function ExploreTab() {
  const s = useGame((x) => x.save)!;
  const act = useGame((x) => x.act);
  const busy = useGame((x) => x.busy);
  const lang = useGame((x) => x.language);
  const t = useT();
  const { realm } = statsOf(s);
  const inCombat = !!s.combat;
  const inDwelling = s.dwellingSlot != null;
  const [regionId, setRegionId] = useState("tiannan");
  const region = REGIONS.find((r) => r.id === regionId)!;
  const locs = LOCATIONS.filter((l) => l.region === regionId);
  const energy = s.energy ?? 0;
  const energyLackGather = energy < ENERGY_COST.gather;
  const energyLackHunt = energy < ENERGY_COST.hunt;

  return (
    <div className="space-y-3">
      <div className="divider">{t("exploreTitle")}</div>
      <div className="flex flex-wrap gap-1.5">
        {REGIONS.filter(
          (r) =>
            !r.hidden ||
            (r.id === "jinyuan" && s.jinyuanUnlocked) ||
            (r.id === "manhuang" && s.manhuangUnlocked),
        ).map((r) => {
          const rLocked = realm.stage < r.reqStage;
          const isPurple = r.color === "fuchsia";
          return (
            <button
              key={r.id}
              onClick={() => !rLocked && setRegionId(r.id)}
              title={rLocked ? t("exploreStageLocked").replace("{n}", String(r.reqStage)) : regionDisplayDesc(r, lang)}
              className={`px-2.5 py-1 text-xs rounded-sm border transition-colors ${
                regionId === r.id
                  ? isPurple
                    ? "border-fuchsia-400 bg-fuchsia-400/15 text-fuchsia-300"
                    : "border-gold bg-gold/15 text-gold"
                  : rLocked
                    ? "border-faded/15 text-faded/40 cursor-not-allowed"
                    : isPurple
                      ? "border-fuchsia-400/40 text-fuchsia-300/90 hover:border-fuchsia-400"
                      : "border-faded/30 text-cream hover:border-gold/60"
              }`}
            >
              {regionDisplayName(r, lang)}
              {rLocked && " 🔒"}
            </button>
          );
        })}
      </div>
      <p className="text-xs text-faded">{regionDisplayDesc(region, lang)}</p>
      {regionId === "jinyuan" && s.jinyuanUnlocked && realm.stage >= 10 && (
        <div className="border border-amber-300/50 bg-amber-300/5 rounded-sm p-3">
          <div className="flex items-baseline justify-between">
            <span className="font-bold text-amber-300">{t("futuTitle")}</span>
            <span className="text-xs font-mono text-amber-300/80">
              {t("futuCleared").replace("{n}", String(s.futuFloor))}
            </span>
          </div>
          <p className="text-sm text-faded mt-1">
            {t("futuDesc").replace(/\{n\}/g, String(s.futuFloor + 1))}
          </p>
          <button
            className="btn mt-2 border-amber-300/60 text-amber-300 hover:bg-amber-300/15"
            disabled={inCombat || busy}
            onClick={() => act("challengeFutu")}
          >
            {t("futuBtn").replace("{n}", String(s.futuFloor + 1))}
          </button>
        </div>
      )}
      {locs.map((loc) => {
        const locked = realm.stage < loc.reqStage;
        return (
          <div
            key={loc.id}
            className={`border border-faded/20 rounded-sm p-3 ${locked ? "opacity-45" : ""}`}
          >
            <div className="flex items-baseline justify-between">
              <span className="font-bold">{locationDisplayName(loc, lang)}</span>
              {locked && <span className="chip">{t("stageInsufficient")}</span>}
            </div>
            <p className="text-sm text-faded mt-1">{locationDisplayDesc(loc, lang)}</p>
            <div className="mt-2 flex gap-2">
              <button
                className="btn"
                disabled={locked || inCombat || busy || inDwelling || energyLackGather}
                onClick={() => act("gather", { locationId: loc.id })}
                title={
                  inDwelling
                    ? t("inDwellingTip")
                    : energyLackGather
                      ? `${t("energyInsufficientTip")} (${ENERGY_COST.gather})`
                      : undefined
                }
              >
                {t("btnGather")}{" "}
                <span className="font-mono text-xs">
                  -{ENERGY_COST.gather} {t("energyCostSuffix")}
                </span>
              </button>
              <button
                className="btn btn-danger"
                disabled={locked || inCombat || busy || inDwelling || energyLackHunt}
                onClick={() => act("hunt", { locationId: loc.id })}
                title={
                  inDwelling
                    ? t("inDwellingTip")
                    : energyLackHunt
                      ? `${t("energyInsufficientTip")} (${ENERGY_COST.hunt})`
                      : undefined
                }
              >
                {t("btnHunt")}{" "}
                <span className="font-mono text-xs">
                  -{ENERGY_COST.hunt} {t("energyCostSuffix")}
                </span>
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// 儲物袋分類(全站共用,見 src/game/data/itemSections.ts):坊市/黑市/交易行/混沌萬靈榜/宗門倉庫皆採同一份分類
const BAG_SECTIONS = ITEM_SECTIONS;

const EQUIPPABLE: ItemKind[] = [
  "artifact",
  "robe",
  "treasure",
  "amulet",
  "talisman",
  "pet",
  "mingqi",
];

function BagTab() {
  const s = useGame((x) => x.save)!;
  const act = useGame((x) => x.act);
  const busy = useGame((x) => x.busy);
  const lang = useGame((x) => x.language);
  const t = useT();
  const entries = Object.entries(s.inventory);
  const [filter, setFilter] = useState<DictKey | "filterAll">("filterAll");
  if (entries.length === 0) return <p className="text-faded text-sm">{t("bagEmpty")}</p>;

  const equippedIds = [
    s.equippedWeapon,
    s.equippedRobe ?? s.equippedArmor,
    s.equippedAmulet,
    s.equippedTalisman,
    s.equippedPet,
    s.equippedMing,
  ];

  const row = ([id, n]: [string, number]) => {
    const item = itemById(id);
    const equipped = equippedIds.includes(id);
    const xuantian = isXuantianArtifact(id);
    return (
      <div
        key={id}
        className={`flex items-center justify-between border rounded-sm p-2.5 ${xuantian ? "border-fuchsia-400/50" : "border-faded/20"}`}
      >
        <Tooltip block content={itemDisplayDesc(item, lang)}>
        <div className="min-w-0">
          <span className="font-bold">
            <span className={itemNameColor(item, xuantian)}>{itemDisplayName(item, lang)}</span>{" "}
            <span className="text-faded font-normal">×{n}</span>
            <span className="chip ml-2 text-faded/80 border-faded/30">{kindLabel(item.kind, lang)}</span>
            {item.element && (
              <span className={`chip ml-2 ${ELEMENT_COLOR[item.element]}`}>{item.element}</span>
            )}
            {xuantian && <span className="chip ml-2 text-xuantian border-fuchsia-400/50">{t("xuantianTag")}</span>}
            {equipped && <span className="chip ml-2 text-gold border-gold/50">{t("equippedTag")}</span>}
            {item.kind === "manual" && item.teaches && (
              <span className="chip ml-2 text-azure border-azure/50">
                {t("learnYearsTag").replace("{n}", String(learnYears(item.teaches)))}
              </span>
            )}
          </span>
          <p className="text-xs text-faded truncate">{itemDisplayDesc(item, lang)}</p>
        </div>
        </Tooltip>
        <div className="flex gap-1.5 shrink-0 ml-3">
          {(item.kind === "pill" || item.kind === "herb") && (
            <button className="btn" disabled={busy} onClick={() => act("useItem", { itemId: id })}>
              {t("btnUse")}
            </button>
          )}
          {item.kind === "special" && item.xianli && (
            <button className="btn" disabled={busy} onClick={() => act("useItem", { itemId: id })}>
              {t("btnRefine")}
            </button>
          )}
          {item.kind === "special" && id === "jinhundan" && (
            <button
              className="btn border-gold/60 text-gold"
              disabled={busy}
              onClick={() => act("useItem", { itemId: id })}
            >
              {t("btnUseAscendGold")}
            </button>
          )}
          {item.kind === "special" && id === "xiantian_zaohuadan" && (
            <button
              className="btn border-gold/60 text-gold"
              disabled={busy}
              onClick={() => act("useItem", { itemId: id })}
            >
              {t("btnUseAscendVoid")}
            </button>
          )}
          {item.kind === "special" && id === "zenglingzhu" && (
            <span className="chip text-fuchsia-400 border-fuchsia-400/50 self-center">
              {t("useInTechTab")}
            </span>
          )}
          {item.kind === "special" &&
            !item.xianli &&
            !["jinhundan", "xiantian_zaohuadan", "zenglingzhu"].includes(id) && (
              <span className="chip text-fuchsia-400 border-fuchsia-400/50 self-center">
                {t("autoOnCondition")}
              </span>
            )}
          {item.kind === "recipe" && (
            <button
              className="btn border-azure/60 text-azure"
              disabled={busy}
              onClick={() => act("useItem", { itemId: id })}
            >
              {t("btnStudyBlueprint")}
            </button>
          )}
          {item.kind === "manual" && (
            <button
              className="btn"
              disabled={busy || !!s.learning}
              title={s.learning ? t("learningOther") : ""}
              onClick={() => act("useItem", { itemId: id })}
            >
              {s.learning ? t("btnStudying") : t("btnStartStudy")}
            </button>
          )}
          {EQUIPPABLE.includes(item.kind) && !equipped && (
            <button className="btn" disabled={busy} onClick={() => act("equip", { itemId: id })}>
              {item.kind === "pet" ? t("btnAdoptPet") : t("btnEquip")}
            </button>
          )}
          {item.kind !== "special" && item.kind !== "recipe" && (
            <button
              className="btn btn-danger"
              disabled={busy}
              onClick={() => act("sell", { itemId: id })}
            >
              {t("btnSell").replace("{n}", String(Math.max(1, Math.floor(item.price * 0.6))))}
            </button>
          )}
        </div>
      </div>
    );
  };

  // 只列出儲物袋內實際有東西的分類,避免出現空分類按鈕
  const availableSections = BAG_SECTIONS.filter(([, kinds]) =>
    entries.some(([id]) => kinds.includes(itemById(id).kind)),
  );
  const sectionsToShow =
    filter === "filterAll" ? availableSections : availableSections.filter(([key]) => key === filter);

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5 pb-1">
        <button
          onClick={() => setFilter("filterAll")}
          className={`px-2.5 py-1 text-xs rounded-sm border transition-colors ${
            filter === "filterAll"
              ? "border-gold bg-gold/15 text-gold"
              : "border-faded/30 text-faded hover:text-cream"
          }`}
        >
          {t("filterAll")}
        </button>
        {availableSections.map(([key]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-2.5 py-1 text-xs rounded-sm border transition-colors ${
              filter === key
                ? "border-gold bg-gold/15 text-gold"
                : "border-faded/30 text-faded hover:text-cream"
            }`}
          >
            {t(key).replace(/\s/g, "")}
          </button>
        ))}
      </div>
      {sectionsToShow.map(([key, kinds]) => {
        const group = entries.filter(([id]) => kinds.includes(itemById(id).kind));
        if (!group.length) return null;
        return (
          <div key={key}>
            <div className="divider">{t(key)}</div>
            <div className="space-y-2">{group.map(row)}</div>
          </div>
        );
      })}
    </div>
  );
}

function TechTab() {
  const s = useGame((x) => x.save)!;
  const act = useGame((x) => x.act);
  const busy = useGame((x) => x.busy);
  const lang = useGame((x) => x.language);
  const t = useT();
  const zenglingzhu = s.inventory["zenglingzhu"] ?? 0;
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs text-faded">{t("techCapNote")}</p>
        <span className="chip text-fuchsia-400 border-fuchsia-400/50">
          {itemDisplayName(itemById("zenglingzhu"), lang)} ×{zenglingzhu}
        </span>
      </div>
      {s.learning && (
        <div className="border border-azure/40 bg-azure/5 rounded-sm p-3">
          <div className="flex items-baseline justify-between">
            <span className="font-bold text-azure">
              {t("techLearningLabel").replace("{name}", techDisplayName(techById(s.learning.techId), lang))}
            </span>
            <span className="text-xs font-mono text-faded">
              {t("techLearningRemain").replace("{n}", String(s.learning.remain))}
            </span>
          </div>
        </div>
      )}
      {s.learned.length === 0 && <p className="text-faded text-sm">{t("techNoneLearned")}</p>}
      {s.learned.map((id) => {
        const tech = techById(id);
        const level = techLevelOf(s, id);
        const maxed = level >= MAX_TECH_LEVEL;
        return (
          <div key={id} className="border border-faded/20 rounded-sm p-3">
            <div className="flex items-baseline justify-between">
              <span className="font-bold">
                <span className={`mr-2 ${ELEMENT_COLOR[tech.element]}`}>【{elementLabel(tech.element, lang)}】</span>
                {techDisplayName(tech, lang)}
                <span className="chip ml-2 text-fuchsia-400 border-fuchsia-400/50">
                  {t("techLevelTag").replace("{lv}", String(level)).replace("{max}", String(MAX_TECH_LEVEL))}
                </span>
              </span>
              <span className="text-xs text-faded font-mono">
                {t("techPowerLine")
                  .replace("{power}", (tech.power * techPowerMult(level)).toFixed(1))
                  .replace("{mp}", String(tech.mpCost))}
              </span>
            </div>
            <p className="text-sm text-faded mt-1">{techDisplayDesc(tech, lang)}</p>
            <button
              className="btn mt-2"
              disabled={busy || maxed || zenglingzhu <= 0}
              title={maxed ? t("techMaxed") : zenglingzhu <= 0 ? t("techNeedBead") : ""}
              onClick={() => act("upgradeTech", { techId: id })}
            >
              {maxed ? t("techMaxedBtn") : t("techUpgradeBtn").replace("{lv}", String(level + 1))}
            </button>
          </div>
        );
      })}
      <p className="text-xs text-faded/60 mt-2">{t("techFooterNote")}</p>
    </div>
  );
}

function CraftTab() {
  const s = useGame((x) => x.save)!;
  const act = useGame((x) => x.act);
  const busy = useGame((x) => x.busy);
  const lang = useGame((x) => x.language);
  const t = useT();
  const { realm } = statsOf(s);
  const SOUL_IDS = [
    "taiyi_jinghun_tianhu",
    "taiyi_jinghun_zhenlong",
    "taiyi_jinghun_baxia",
    "taiyi_jinghun_pixiu",
  ];
  const soulCount = SOUL_IDS.reduce((a, id) => a + (s.inventory[id] ?? 0), 0);
  const fragmentCount = s.inventory["xuantian_canpian"] ?? 0;
  const fragmentMintCount = s.inventory["poshou_jinhow"] ?? 0;
  const energy = s.energy ?? 0;
  const energyLackCraft = energy < ENERGY_COST.craft;
  const energyLackXuantian = energy < ENERGY_COST.craftXuantian;

  return (
    <div className="space-y-2">
      <p className="text-xs text-faded">{t("craftHeaderNote")}</p>
      {realm.stage >= 12 && (
        <div className="border border-fuchsia-400/50 bg-fuchsia-400/5 rounded-sm p-3">
          <span className="font-bold text-xuantian">{t("xuantianCraftTitle")}</span>
          <p className="text-sm text-faded mt-1">{t("xuantianCraftDesc")}</p>
          <p className="text-xs font-mono mt-1 text-faded">
            {itemDisplayName(itemById("xuantian_canpian"), lang)} {fragmentCount}/10 ·{" "}
            {itemDisplayName(itemById("poshou_jinhow"), lang)} {fragmentMintCount}/20 ·{" "}
            {t("taiyiSoulSuffix")} {soulCount}/1
          </p>
          <button
            className="btn mt-2 border-fuchsia-400/60 text-fuchsia-300 hover:bg-fuchsia-400/15"
            disabled={busy || fragmentCount < 10 || soulCount < 1 || energyLackXuantian}
            title={energyLackXuantian ? `${t("energyInsufficientTip")} (${ENERGY_COST.craftXuantian})` : undefined}
            onClick={() => act("craftXuantian")}
          >
            {t("xuantianCraftBtn")}{" "}
            <span className="font-mono text-xs">
              -{ENERGY_COST.craftXuantian} {t("energyCostSuffix")}
            </span>
          </button>
        </div>
      )}
      {RECIPES.map((rec) => {
        const result = itemById(rec.result);
        const locked = rec.dropOnly && !s.unlockedRecipes.includes(rec.id);
        const stageLocked = (rec.reqStage ?? 1) > realm.stage;
        const canStones = s.stones >= rec.stones;
        const canMats = rec.materials.every((m) => (s.inventory[m.id] ?? 0) >= m.n);
        return (
          <div
            key={rec.id}
            className={`border rounded-sm p-3 ${rec.dropOnly ? "border-azure/50 bg-azure/5" : "border-faded/20"} ${locked || stageLocked ? "opacity-55" : ""}`}
          >
            <div className="flex items-baseline justify-between">
              <span className="font-bold">
                {itemDisplayName(result, lang)}
                <span className="chip ml-2 text-faded/80 border-faded/30">
                  {kindLabel(result.kind, lang)}
                </span>
                {result.element && (
                  <span className={`chip ml-2 ${ELEMENT_COLOR[result.element]}`}>
                    {elementLabel(result.element, lang)}
                  </span>
                )}
                {rec.dropOnly && (
                  <span className="chip ml-2 text-azure border-azure/60">{t("blueprintTag")}</span>
                )}
              </span>
              <span className={`text-xs font-mono ${canStones ? "text-gold" : "text-vermillion"}`}>
                {formatStones(rec.stones)}
              </span>
            </div>
            <p className="text-xs text-faded mt-1">{recipeDisplayDesc(rec, lang)}</p>
            <p className="text-xs mt-1.5">
              {rec.materials.map((m) => {
                const have = s.inventory[m.id] ?? 0;
                return (
                  <span
                    key={m.id}
                    className={`mr-3 ${have >= m.n ? "text-jade" : "text-vermillion"}`}
                  >
                    {itemDisplayName(itemById(m.id), lang)} {have}/{m.n}
                  </span>
                );
              })}
              <span className="text-faded">
                → {result.atkBonus ? (lang === "en" ? `ATK+${result.atkBonus} ` : `攻+${result.atkBonus} `) : ""}
                {result.defBonus ? (lang === "en" ? `DEF+${result.defBonus} ` : `防+${result.defBonus} `) : ""}
                {result.speedBonus ? (lang === "en" ? `SPD+${result.speedBonus}` : `速+${result.speedBonus}`) : ""}
              </span>
            </p>
            <button
              className="btn mt-2"
              disabled={busy || !canStones || !canMats || locked || stageLocked || energyLackCraft}
              title={
                locked
                  ? t("blueprintLocked")
                  : stageLocked
                    ? t("exploreStageLocked").replace("{n}", String(rec.reqStage))
                    : energyLackCraft
                      ? `${t("energyInsufficientTip")} (${ENERGY_COST.craft})`
                      : ""
              }
              onClick={() => act("craft", { recipeId: rec.id })}
            >
              {locked ? t("craftBtnLocked") : stageLocked ? t("stageInsufficient") : t("craftBtn")}{" "}
              <span className="font-mono text-xs">
                -{ENERGY_COST.craft} {t("energyCostSuffix")}
              </span>
            </button>
          </div>
        );
      })}
    </div>
  );
}

// 黑市:消耗型命器(地命符/天運符/天極符)+ 玄命果,皆以 USD 透過 Polar 購買,買到即直接加入儲物袋
function BlackMarketSection() {
  const setSave = useGame((x) => x.setSave);
  const setPurchaseResult = useGame((x) => x.setPurchaseResult);
  const lang = useGame((x) => x.language);
  const t = useT();
  const [buyingId, setBuyingId] = useState<string | null>(null);
  const [err, setErr] = useState("");
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => {
    if (pollRef.current) clearInterval(pollRef.current);
  }, []);

  const buy = async (itemId: string) => {
    setErr("");
    try {
      const res = await fetch("/api/blackmarket", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId }),
      });
      const j = await res.json();
      if (!res.ok) {
        setErr(j.error ?? t("buyFailGeneric"));
        return;
      }
      window.open(j.url, "_blank", "noopener");
      setBuyingId(itemId);
      pollRef.current = setInterval(async () => {
        try {
          const r = await (await fetch(`/api/blackmarket?token=${j.token}`)).json();
          if (r.status === "done") {
            if (pollRef.current) clearInterval(pollRef.current);
            const saveRes = await (await fetch("/api/save")).json();
            if (saveRes.save) setSave(saveRes.save);
            setBuyingId(null);
            setPurchaseResult({
              success: true,
              title: t("purchaseSuccessTitle"),
              lines: [t("blackMarketDelivered").replace("{item}", itemDisplayName(itemById(itemId), lang))],
            });
          } else if (r.status === "failed") {
            if (pollRef.current) clearInterval(pollRef.current);
            setErr(t("purchaseFailErr"));
            setBuyingId(null);
            setPurchaseResult({
              success: false,
              title: t("purchaseFailTitle"),
              lines: [t("purchaseFailLine")],
            });
          }
        } catch {
          /* 靜默重試 */
        }
      }, 3000);
    } catch {
      setErr(t("netErr"));
    }
  };

  return (
    <div className="space-y-2">
      <p className="text-xs text-faded">{t("blackMarketNote")}</p>
      {BLACK_MARKET_CATALOG.map(({ itemId, priceUsd }) => {
        const item = itemById(itemId);
        if (!item) return null;
        return (
          <div
            key={itemId}
            className="flex items-center justify-between border border-fuchsia-400/30 bg-fuchsia-400/5 rounded-sm p-2.5"
          >
            <Tooltip block content={itemDisplayDesc(item, lang)}>
            <div className="min-w-0">
              <span className="font-bold">
                <span className={itemNameColor(item, isXuantianArtifact(itemId))}>
                  {itemDisplayName(item, lang)}
                </span>
                <span className="chip ml-2 text-faded/80 border-faded/30">
                  {kindLabel(item.kind, lang)}
                </span>
                {item.breakBonus && (
                  <span className="chip ml-2 text-fuchsia-300 border-fuchsia-400/50">
                    {t("breakBonusTag").replace("{n}", String(Math.round(item.breakBonus * 100)))}
                  </span>
                )}
              </span>
              <p className="text-xs text-faded truncate">{itemDisplayDesc(item, lang)}</p>
            </div>
            </Tooltip>
            <button
              className="btn shrink-0 ml-3 border-fuchsia-400/60 text-fuchsia-300 hover:bg-fuchsia-400/15"
              disabled={buyingId === itemId}
              onClick={() => buy(itemId)}
              title={`USD ${priceUsd}`}
            >
              {buyingId === itemId ? t("payingBtn") : `${priceUsd} ${t("usSpiritStones")}`}
            </button>
          </div>
        );
      })}
      {err && <p className="text-xs text-vermillion">{err}</p>}
    </div>
  );
}

function MarketTab() {
  const s = useGame((x) => x.save)!;
  const act = useGame((x) => x.act);
  const busy = useGame((x) => x.busy);
  const lang = useGame((x) => x.language);
  const t = useT();
  const [marketView, setMarketView] = useState<"shop" | "blackmarket">("shop");
  const wares = ITEMS.filter(
    (i) =>
      (["pill", "herb", "robe", "amulet", "talisman"].includes(i.kind) ||
        (i.kind === "manual" && i.shopSellable)) &&
      !i.life &&
      !i.lifePct &&
      !i.dropOnly &&
      (i.reqStage ?? 1) <= 8,
  );
  return (
    <div className="space-y-3">
      <div className="flex gap-1.5">
        {(
          [
            ["shop", t("marketViewShop")],
            ["blackmarket", t("marketViewBlackmarket")],
          ] as [typeof marketView, string][]
        ).map(([v, label]) => (
          <button
            key={v}
            onClick={() => setMarketView(v)}
            className={`px-3 py-1 text-sm rounded-sm border transition-colors ${
              marketView === v
                ? "border-fuchsia-400 bg-fuchsia-400/15 text-fuchsia-300"
                : "border-faded/30 text-faded hover:text-cream"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {marketView === "shop" && (
        <div className="space-y-2">
          <p className="text-xs text-faded">
            {t("shopNote")}
            <span className="text-gold">
              {" "}
              <StoneAmount n={s.stones} />
            </span>
          </p>

          {ITEM_SECTIONS.map(([key, kinds]) => {
            const group = wares.filter((i) => kinds.includes(i.kind));
            if (!group.length) return null;
            return (
              <div key={key}>
                <div className="divider">{t(key)}</div>
                <div className="space-y-2">
                  {group.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between border border-faded/20 rounded-sm p-2.5"
                    >
                      <Tooltip block content={itemDisplayDesc(item, lang)}>
                      <div className="min-w-0">
                        <span className="font-bold">
                          {itemDisplayName(item, lang)}
                          <span className="chip ml-2 text-faded/80 border-faded/30">
                            {kindLabel(item.kind, lang)}
                          </span>
                          {item.element && (
                            <span className={`chip ml-2 ${ELEMENT_COLOR[item.element]}`}>
                              {elementLabel(item.element, lang)}
                            </span>
                          )}
                        </span>
                        <p className="text-xs text-faded truncate">{itemDisplayDesc(item, lang)}</p>
                      </div>
                      </Tooltip>
                      <button
                        className="btn shrink-0 ml-3"
                        disabled={busy || s.stones < item.price}
                        onClick={() => act("buy", { itemId: item.id })}
                      >
                        {formatStones(item.price)}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {marketView === "blackmarket" && <BlackMarketSection />}
    </div>
  );
}

interface Listing {
  id: number;
  item_id: string;
  qty: number;
  price: number;
  seller_id: number;
  seller_name: string;
}

function TradeTab() {
  const s = useGame((x) => x.save)!;
  const setSave = useGame((x) => x.setSave);
  const pushLog = useGame((x) => x.pushLog);
  const lang = useGame((x) => x.language);
  const t = useT();
  const [listings, setListings] = useState<Listing[]>([]);
  const [busy, setBusy] = useState(false);
  const [sellItem, setSellItem] = useState<string>("");
  const [sellQty, setSellQty] = useState(1);
  const [sellPrice, setSellPrice] = useState(10);

  const refresh = async () => {
    try {
      const j = await (await fetch("/api/market")).json();
      setListings(j.listings ?? []);
    } catch {
      /* ignore */
    }
  };
  useEffect(() => {
    refresh();
  }, []);

  // 交易行操作後,重新從伺服器拉整份存檔(伺服器為唯一權威)
  const reloadSave = async () => {
    try {
      const j = await (await fetch("/api/save")).json();
      if (j.save) setSave(j.save);
    } catch {
      /* ignore */
    }
  };

  const myItems = Object.entries(s.inventory);

  const list = async () => {
    if (!sellItem || sellQty < 1 || sellPrice < 1) return;
    setBusy(true);
    try {
      const res = await fetch("/api/market", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId: sellItem, qty: sellQty, price: sellPrice }),
      });
      const j = await res.json();
      if (res.ok) {
        pushLog(
          t("listSuccessLog")
            .replace("{item}", itemDisplayName(itemById(sellItem), lang))
            .replace("{qty}", String(sellQty))
            .replace("{price}", formatStones(sellPrice)),
        );
        setSellItem("");
      } else {
        pushLog(t("listFailLog").replace("{err}", j.error ?? t("listFailGeneric")));
      }
      await Promise.all([refresh(), reloadSave()]);
    } finally {
      setBusy(false);
    }
  };

  const buy = async (l: Listing) => {
    setBusy(true);
    try {
      const res = await fetch("/api/market", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: l.id, action: "buy" }),
      });
      const j = await res.json();
      if (res.ok) {
        pushLog(
          t("buySuccessLog")
            .replace("{total}", formatStones(j.total))
            .replace("{item}", itemDisplayName(itemById(j.itemId), lang))
            .replace("{qty}", String(j.qty))
            .replace("{seller}", l.seller_name),
        );
      } else {
        pushLog(t("buyFailLog").replace("{err}", j.error ?? t("alreadyBoughtErr")));
      }
      await Promise.all([refresh(), reloadSave()]);
    } finally {
      setBusy(false);
    }
  };

  const cancel = async (l: Listing) => {
    setBusy(true);
    try {
      const res = await fetch("/api/market", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: l.id, action: "cancel" }),
      });
      const j = await res.json();
      if (res.ok) {
        pushLog(
          t("cancelSuccessLog")
            .replace("{item}", itemDisplayName(itemById(l.item_id), lang))
            .replace("{qty}", String(l.qty)),
        );
      } else {
        pushLog(t("cancelFailLog").replace("{err}", j.error ?? t("listFailGeneric")));
      }
      await Promise.all([refresh(), reloadSave()]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-3">
      <p className="text-xs text-faded">
        {t("tradeNote")}
        <span className="text-gold">
          <StoneAmount n={s.stones} />
        </span>
        <button className="chip ml-3 hover:text-gold py-1.5 px-2.5" onClick={refresh}>
          {t("btnRefresh")}
        </button>
      </p>

      <div className="border border-faded/25 rounded-sm p-3">
        <p className="text-xs text-gold/80 font-mono tracking-widest mb-2">{t("tradeListTitle")}</p>
        <div className="flex flex-wrap gap-2 items-center">
          <select
            value={sellItem}
            onChange={(e) => setSellItem(e.target.value)}
            className="bg-smoke border border-faded/30 rounded-sm px-2 py-1.5 text-sm text-parchment"
          >
            <option value="">{t("selectItemPlaceholder")}</option>
            {ITEM_SECTIONS.map(([key, kinds]) => {
              const group = myItems.filter(([id]) => kinds.includes(itemById(id).kind));
              if (!group.length) return null;
              return (
                <optgroup key={key} label={t(key)}>
                  {group.map(([id, n]) => (
                    <option key={id} value={id}>
                      {itemDisplayName(itemById(id), lang)} ×{n}
                    </option>
                  ))}
                </optgroup>
              );
            })}
          </select>
          <label className="text-xs text-faded">
            {t("tradeQty")}
            <input
              type="number"
              min={1}
              value={sellQty}
              onChange={(e) => setSellQty(+e.target.value)}
              className="w-16 ml-1 bg-smoke border border-faded/30 rounded-sm px-2 py-1 text-sm text-parchment"
            />
          </label>
          <label className="text-xs text-faded">
            {t("tradeUnitPrice")}
            <input
              type="number"
              min={1}
              value={sellPrice}
              onChange={(e) => setSellPrice(+e.target.value)}
              className="w-24 ml-1 bg-smoke border border-faded/30 rounded-sm px-2 py-1 text-sm text-parchment"
            />
          </label>
          <button className="btn" disabled={busy || !sellItem} onClick={list}>
            {t("btnList")}
          </button>
        </div>
      </div>

      <div className="divider">{t("onSaleTitle")}</div>
      {listings.length === 0 && (
        <p className="text-sm text-faded">{t("noListings")}</p>
      )}
      {listings.map((l) => {
        const item = itemById(l.item_id);
        if (!item) return null;
        const mine = l.seller_name === s.name;
        const xuantian = isXuantianArtifact(l.item_id);
        return (
          <div
            key={l.id}
            className={`flex items-center justify-between border rounded-sm p-2.5 ${xuantian ? "border-fuchsia-400/50" : "border-faded/20"}`}
          >
            <Tooltip block content={itemDisplayDesc(item, lang)}>
            <div className="min-w-0">
              <span className="font-bold">
                <span className={itemNameColor(item, xuantian)}>{itemDisplayName(item, lang)}</span>{" "}
                <span className="text-faded font-normal">×{l.qty}</span>
                {mine && <span className="chip ml-2 text-gold border-gold/50">{t("myListingTag")}</span>}
              </span>
              <p className="text-xs text-faded">
                {t("listingSellerLine")
                  .replace("{seller}", l.seller_name)
                  .replace("{price}", formatStones(l.price))}{" "}
                <span className="text-gold">{formatStones(l.qty * l.price)}</span>
              </p>
            </div>
            </Tooltip>
            <div className="shrink-0 ml-3">
              {mine ? (
                <button className="btn btn-danger" disabled={busy} onClick={() => cancel(l)}>
                  {t("btnDelist")}
                </button>
              ) : (
                <button
                  className="btn"
                  disabled={busy || s.stones < l.qty * l.price}
                  onClick={() => buy(l)}
                >
                  {t("btnBuy")}
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function DexTab() {
  const s = useGame((x) => x.save)!;
  const lang = useGame((x) => x.language);
  const t = useT();
  const normals = MONSTERS.filter((m) => !m.isLord);
  const lords = MONSTERS.filter((m) => m.isLord);

  const monsterRow = (mon: (typeof MONSTERS)[number]) => {
    const seen = s.seen.includes(mon.id);
    const kills = s.kills[mon.id] ?? 0;
    if (!seen)
      return (
        <div
          key={mon.id}
          className={`border rounded-sm p-3 opacity-40 ${mon.isLord ? "border-fuchsia-400/20" : "border-faded/15"}`}
        >
          <span className="font-bold text-faded">???</span>
          <p className="text-xs text-faded/60 mt-1">
            {mon.isLord ? t("dexUnknownLord") : t("dexUnknownMonster")}
          </p>
        </div>
      );
    return (
      <div
        key={mon.id}
        className={`border rounded-sm p-3 ${mon.isLord ? "border-fuchsia-400/40 bg-fuchsia-400/5" : "border-faded/20"}`}
      >
        <div className="flex items-baseline justify-between">
          <span className="font-bold">
            {mon.isLord && (
              <span className="chip mr-2 text-fuchsia-400 border-fuchsia-400/50">{t("lordTag")}</span>
            )}
            {monsterDisplayName(mon, lang)}
            <span className={`chip ml-2 ${ELEMENT_COLOR[mon.element]}`}>
              {lang === "en" ? elementLabel(mon.element, lang) : `${mon.element}屬性`}
            </span>
          </span>
          <span className="text-xs font-mono text-faded">
            {t("monsterStatLine")
              .replace("{hp}", String(mon.hp))
              .replace("{atk}", String(mon.atk))
              .replace("{kills}", String(kills))}
          </span>
        </div>
        <p className="text-xs text-faded mt-1">{monsterDisplayDesc(mon, lang)}</p>
      </div>
    );
  };

  return (
    <div className="space-y-2">
      <p className="text-xs text-faded">
        {t("dexSeenNote")
          .replace("{seen}", String(s.seen.length))
          .replace("{total}", String(MONSTERS.length))}
      </p>
      <div className="divider">{t("dexMonsterDivider")}</div>
      {normals.map(monsterRow)}
      <div className="divider text-fuchsia-400/70">{t("dexLordDivider")}</div>
      <p className="text-xs text-faded">
        {t("dexLordNote")
          .replace("{seen}", String(s.lordsSeen?.length ?? 0))
          .replace("{total}", String(lords.length))}
      </p>
      {lords.map(monsterRow)}
    </div>
  );
}

// 混沌萬靈榜:全物品一覽,唯真仙以上境界(stage >= 10)可查閱
function itemStatLine(item: (typeof ITEMS)[number], t: (k: DictKey) => string): string {
  const parts: string[] = [];
  if (item.price) parts.push(t("statLinePrice").replace("{n}", formatStones(item.price)));
  if (item.heal) parts.push(t("statLineHeal").replace("{n}", String(item.heal)));
  if (item.mp) parts.push(t("statLineMp").replace("{n}", String(item.mp)));
  if (item.exp) parts.push(t("statLineExp").replace("{n}", String(item.exp)));
  if (item.life) parts.push(t("statLineLife").replace("{n}", String(item.life)));
  if (item.lifePct) parts.push(t("statLineLifePct").replace("{n}", String(Math.round(item.lifePct * 100))));
  if (item.xianli) parts.push(t("statLineXianli").replace("{n}", String(item.xianli)));
  if (item.atkBonus) parts.push(t("statLineAtk").replace("{n}", String(item.atkBonus)));
  if (item.defBonus) parts.push(t("statLineDef").replace("{n}", String(item.defBonus)));
  if (item.speedBonus) parts.push(t("statLineSpeed").replace("{n}", String(item.speedBonus)));
  if (item.stoneMult) parts.push(t("statLineStoneMult").replace("{n}", String(item.stoneMult)));
  if (item.breakBonus) parts.push(t("statLineBreakBonus").replace("{n}", String(Math.round(item.breakBonus * 100))));
  if (item.reqStage) parts.push(t("statLineReqStage").replace("{n}", String(item.reqStage)));
  if (item.dropOnly) parts.push(t("statLineDropOnly"));
  return parts.join(" · ");
}

function WanlingTab() {
  const s = useGame((x) => x.save)!;
  const lang = useGame((x) => x.language);
  const t = useT();
  const { realm } = statsOf(s);
  const [filter, setFilter] = useState<DictKey | "filterAll">("filterAll");

  if (realm.stage < 10) {
    return <p className="text-sm text-faded">{t("wanlingLocked")}</p>;
  }

  const sectionsToShow =
    filter === "filterAll" ? BAG_SECTIONS : BAG_SECTIONS.filter(([key]) => key === filter);

  return (
    <div className="space-y-2">
      <p className="text-xs text-faded">{t("wanlingNote").replace("{n}", String(ITEMS.length))}</p>

      <div className="flex flex-wrap gap-1.5 pt-1">
        <button
          onClick={() => setFilter("filterAll")}
          className={`px-2.5 py-1 text-xs rounded-sm border transition-colors ${
            filter === "filterAll"
              ? "border-gold bg-gold/15 text-gold"
              : "border-faded/30 text-faded hover:text-cream"
          }`}
        >
          {t("filterAll")}
        </button>
        {BAG_SECTIONS.map(([key]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-2.5 py-1 text-xs rounded-sm border transition-colors ${
              filter === key
                ? "border-gold bg-gold/15 text-gold"
                : "border-faded/30 text-faded hover:text-cream"
            }`}
          >
            {t(key).replace(/\s/g, "")}
          </button>
        ))}
      </div>

      {sectionsToShow.map(([key, kinds]) => {
        const group = ITEMS.filter((i) => kinds.includes(i.kind));
        if (!group.length) return null;
        return (
          <div key={key}>
            <div className="divider">{t(key)}</div>
            <div className="space-y-2">
              {group.map((item) => {
                const stat = itemStatLine(item, t);
                const xuantian = isXuantianArtifact(item.id);
                return (
                  <div
                    key={item.id}
                    className={`border rounded-sm p-2.5 ${xuantian ? "border-fuchsia-400/40" : "border-faded/20"}`}
                  >
                    <span className="font-bold">
                      <span className={itemNameColor(item, xuantian)}>{itemDisplayName(item, lang)}</span>
                      <span className="chip ml-2 text-faded/80 border-faded/30">
                        {kindLabel(item.kind, lang)}
                      </span>
                      {item.element && (
                        <span className={`chip ml-2 ${ELEMENT_COLOR[item.element]}`}>
                          {elementLabel(item.element, lang)}
                        </span>
                      )}
                      {xuantian && (
                        <span className="chip ml-2 text-xuantian border-fuchsia-400/50">
                          {t("xuantianTag")}
                        </span>
                      )}
                    </span>
                    <p className="text-xs text-faded mt-0.5">{itemDisplayDesc(item, lang)}</p>
                    {stat && <p className="text-xs text-cream/80 mt-0.5 font-mono">{stat}</p>}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

interface RankPlayer {
  name: string;
  realm_idx: number;
  exp: number;
  xianli: number;
  futu_floor: number;
  dead: boolean;
}

interface PlayerProfile {
  name: string;
  realmIdx: number;
  exp: number;
  xianli: number;
  futuFloor: number;
  sectId: string | null;
  age: number;
  day: number;
  dead: boolean;
  seenCount: number;
  lordsSeenCount: number;
  learnedCount: number;
  equippedWeapon: string | null;
  equippedRobe: string | null;
  equippedAmulet: string | null;
  equippedTalisman: string | null;
  equippedPet: string | null;
  equippedMing: string | null;
}

function PlayerDetailCard({ profile, onClose }: { profile: PlayerProfile; onClose: () => void }) {
  const lang = useGame((x) => x.language);
  const t = useT();
  const isXian = REALMS[profile.realmIdx]?.stage >= 10;
  const gear: [DictKey, string | null][] = [
    ["slotWeapon", profile.equippedWeapon],
    ["slotRobe", profile.equippedRobe],
    ["slotAmulet", profile.equippedAmulet],
    ["slotTalisman", profile.equippedTalisman],
    ["slotPet", profile.equippedPet],
    ["slotMing", profile.equippedMing],
  ];
  return (
    <div
      className={`border rounded-sm p-4 mb-3 ${isXian ? "border-fuchsia-400/60 bg-fuchsia-400/5" : "border-gold/50 bg-gold/5"}`}
    >
      <div className="flex items-baseline justify-between mb-2">
        <span
          className={`text-lg font-bold ${isXian ? "text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-300 via-amber-200 to-fuchsia-300" : "text-gold"}`}
        >
          {profile.name}
          {profile.dead && (
            <span className="chip ml-2 text-vermillion border-vermillion/50">{t("deadTag")}</span>
          )}
        </span>
        <button className="chip hover:text-cream py-1.5 px-2.5" onClick={onClose}>
          {t("profileClose")}
        </button>
      </div>
      <div className="grid grid-cols-2 gap-y-1 text-sm">
        <span className="text-faded">{t("profileRealm")}</span>
        <span className={`text-right ${isXian ? "text-fuchsia-300" : ""}`}>
          {realmDisplayName(REALMS[profile.realmIdx], lang)}
        </span>
        <span className="text-faded">{t("profileSect")}</span>
        <span className="text-right">
          {(() => {
            const sect = SECTS.find((x) => x.id === profile.sectId);
            return sect ? sectDisplayName(sect, lang) : t("statLoose");
          })()}
        </span>
        <span className="text-faded">{t("profileExp")}</span>
        <span className="text-right font-mono">{profile.exp}</span>
        {profile.xianli > 0 && (
          <>
            <span className="text-faded">{t("profileXianli")}</span>
            <span className="text-right font-bold text-fuchsia-400">
              {t("profileXianliUnit").replace("{n}", String(profile.xianli))}
            </span>
          </>
        )}
        {profile.futuFloor > 0 && (
          <>
            <span className="text-faded">{t("profileFutu")}</span>
            <span className="text-right font-bold text-amber-300">
              {t("profileFutuValue").replace("{n}", String(profile.futuFloor))}
            </span>
          </>
        )}
        <span className="text-faded">{t("profileLifeCult")}</span>
        <span className="text-right">
          {t("profileLifeCultValue")
            .replace("{age}", String(profile.age))
            .replace("{day}", String(profile.day))}
        </span>
        <span className="text-faded">{t("profileDexRank")}</span>
        <span className="text-right text-xs">
          {t("profileDexRankValue")
            .replace("{seen}", String(profile.seenCount))
            .replace("{lords}", String(profile.lordsSeenCount))
            .replace("{learned}", String(profile.learnedCount))}
        </span>
      </div>
      <div className="divider">{t("profileEquip")}</div>
      <div className="grid grid-cols-2 gap-y-1 text-sm">
        {gear.map(([labelKey, id]) => (
          <div key={labelKey} className="contents">
            <span className="text-faded">{t(labelKey)}</span>
            <span
              className={`text-right ${id ? (labelKey === "slotPet" ? "text-fuchsia-300" : "text-cream") : "text-faded/50"}`}
            >
              {id ? itemDisplayName(itemById(id), lang) : "—"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function usePlayerLookup() {
  const t = useT();
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [err, setErr] = useState("");
  const lookup = async (name: string) => {
    if (!name.trim()) return;
    setErr("");
    try {
      const j = await (
        await fetch(`/api/ranking?player=${encodeURIComponent(name.trim())}`)
      ).json();
      if (j.ok) setProfile(j.profile);
      else {
        setProfile(null);
        setErr(j.error ?? t("playerNotFound"));
      }
    } catch {
      setErr(t("lookupFailed"));
    }
  };
  return { profile, setProfile, err, lookup };
}

type Board = "xiu" | "exp" | "futu";

function RankTab() {
  const s = useGame((x) => x.save)!;
  const lang = useGame((x) => x.language);
  const t = useT();
  const [board, setBoard] = useState<Board>("xiu");
  const [players, setPlayers] = useState<RankPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const { profile, setProfile, err, lookup } = usePlayerLookup();

  const boards: [Board, string, string][] = [
    ["xiu", t("boardXiu"), t("boardXiuDesc")],
    ["exp", t("boardExp"), t("boardExpDesc")],
    ["futu", t("boardFutu"), t("boardFutuDesc")],
  ];
  const boardMeta = boards.find((b) => b[0] === board)!;

  const refresh = async (b: Board = board) => {
    setLoading(true);
    try {
      const j = await (await fetch(`/api/ranking?type=${b}`)).json();
      setPlayers(j.players ?? []);
    } catch {
      /* ignore */
    }
    setLoading(false);
  };
  useEffect(() => {
    refresh(board);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [board]);

  const myRank = players.findIndex((p) => p.name === s.name) + 1;
  const isFutuBoard = board === "futu";

  // 各榜右側顯示的主數值
  const rightValue = (p: RankPlayer) => {
    if (board === "futu")
      return (
        <span className="text-amber-300 font-bold">
          {t("futuFloorValue").replace("{n}", String(p.futu_floor))}
        </span>
      );
    if (board === "exp")
      return (
        <>
          <span className="text-jade font-mono">{t("expValue").replace("{n}", String(p.exp))}</span>
          <span className="text-xs text-faded ml-2">{realmDisplayName(REALMS[p.realm_idx], lang)}</span>
        </>
      );
    // 修仙榜
    return (
      <>
        <span>{realmDisplayName(REALMS[p.realm_idx], lang)}</span>
        {p.xianli > 0 && (
          <span className="text-xs text-fuchsia-400 ml-2">
            {t("xianliValueShort").replace("{n}", String(p.xianli))}
          </span>
        )}
      </>
    );
  };

  const accent = isFutuBoard ? "amber-300" : "gold";

  return (
    <div className="space-y-2">
      {/* 三榜切換 */}
      <div className="flex gap-1.5">
        {boards.map(([b, label]) => (
          <button
            key={b}
            onClick={() => setBoard(b)}
            className={`px-3 py-1 text-sm rounded-sm border transition-colors ${
              board === b
                ? b === "futu"
                  ? "border-amber-300 bg-amber-300/15 text-amber-300"
                  : "border-gold bg-gold/15 text-gold"
                : "border-faded/30 text-faded hover:text-cream"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      <p className="text-xs text-faded">
        {boardMeta[2]}。
        {myRank > 0 && (
          <>
            {t("yourRankLine")}
            <span className={`text-${accent}`}> {myRank} </span>
            {t("yourRankSuffix")}
          </>
        )}
        <button className="chip ml-3 hover:text-gold py-1.5 px-2.5" onClick={() => refresh()}>
          {t("btnRefresh")}
        </button>
      </p>
      <div className="flex gap-2 items-center">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && lookup(query)}
          placeholder={t("searchPlaceholder")}
          className="flex-1 bg-smoke border border-faded/30 rounded-sm px-2 py-1.5 text-sm text-parchment"
        />
        <button className="btn" onClick={() => lookup(query)}>
          {t("btnSearch")}
        </button>
      </div>
      {err && <p className="text-sm text-vermillion">{err}</p>}
      {profile && <PlayerDetailCard profile={profile} onClose={() => setProfile(null)} />}
      {loading && <p className="text-sm text-faded">{t("boardUpdating")}</p>}
      {!loading && players.length === 0 && (
        <p className="text-sm text-faded">
          {isFutuBoard ? t("futuBoardEmpty") : t("boardEmpty")}
        </p>
      )}
      {players.map((p, i) => {
        const me = p.name === s.name;
        const topColor = isFutuBoard ? "text-amber-300" : "text-gold";
        return (
          <button
            key={p.name + i}
            onClick={() => lookup(p.name)}
            className={`w-full text-left flex items-center justify-between border rounded-sm p-2.5 transition-colors hover:border-gold/60 ${
              me
                ? isFutuBoard
                  ? "border-amber-300/60 bg-amber-300/10"
                  : "border-gold/60 bg-gold/10"
                : "border-faded/20"
            }`}
          >
            <div className="flex items-baseline gap-3 min-w-0">
              <span
                className={`font-mono text-sm w-6 text-right shrink-0 ${i < 3 ? topColor : "text-faded"}`}
              >
                {i + 1}
              </span>
              <div className="min-w-0">
                <span className={`font-bold ${me ? topColor : ""}`}>{p.name}</span>
                {me && <span className={`text-xs ${topColor}/70 ml-2`}>{t("youTag")}</span>}
                {p.dead && (
                  <span className="chip ml-2 text-vermillion border-vermillion/50">{t("deadTag")}</span>
                )}
              </div>
            </div>
            <span className="text-sm text-cream shrink-0 ml-3">{rightValue(p)}</span>
          </button>
        );
      })}
    </div>
  );
}
