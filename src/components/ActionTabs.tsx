"use client";

import { useEffect, useRef, useState } from "react";
import {
  useGame,
  statsOf,
  learnYears,
  techLevelOf,
  techPowerMult,
  MAX_TECH_LEVEL,
  Tab,
} from "@/game/store";
import { LOCATIONS, MONSTERS, RECIPES, REGIONS } from "@/game/data/world";
import { ITEMS, itemById, isXuantianArtifact } from "@/game/data/items";
import { REALMS } from "@/game/data/realms";
import { SECTS } from "@/game/data/sects";
import { techById } from "@/game/data/techniques";
import { BLACK_MARKET_CATALOG } from "@/game/data/blackMarket";
import { ELEMENT_COLOR, ItemKind, KIND_LABEL, formatStones } from "@/game/types";
import StoneAmount from "./StoneAmount";

export default function ActionTabs() {
  // 分頁狀態提到 store,讓道籍面板的「宗門」按鈕也能切換過來
  const tab = useGame((x) => x.activeTab);
  const setTab = useGame((x) => x.setActiveTab);
  const tabs: [Tab, string][] = [
    ["explore", "遊歷探索"],
    ["bag", "儲物袋"],
    ["tech", "仙法"],
    ["craft", "煉器"],
    ["market", "坊市"],
    ["trade", "交易行"],
    ["dex", "妖獸圖鑑"],
    ["wanling", "混沌萬靈榜"],
    ["rank", "排行榜"],
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
  const { realm } = statsOf(s);
  const inCombat = !!s.combat;
  const inDwelling = s.dwellingSlot != null;
  const [regionId, setRegionId] = useState("tiannan");
  const region = REGIONS.find((r) => r.id === regionId)!;
  const locs = LOCATIONS.filter((l) => l.region === regionId);

  return (
    <div className="space-y-3">
      <div className="divider">大 陸 遊 歷</div>
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
              title={rLocked ? `需 ${r.reqStage} 階境界` : r.desc}
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
              {r.name}
              {rLocked && " 🔒"}
            </button>
          );
        })}
      </div>
      <p className="text-xs text-faded">{region.desc}</p>
      {regionId === "jinyuan" && s.jinyuanUnlocked && realm.stage >= 10 && (
        <div className="border border-amber-300/50 bg-amber-300/5 rounded-sm p-3">
          <div className="flex items-baseline justify-between">
            <span className="font-bold text-amber-300">浮 屠 塔</span>
            <span className="text-xs font-mono text-amber-300/80">已通關第 {s.futuFloor} 層</span>
          </div>
          <p className="text-sm text-faded mt-1">
            塔中是一尊幻象太歲天尊,每打過一層便更強(氣血 ×1.5、攻擊 ×1.2),永無止境。挑戰下一層(第{" "}
            {s.futuFloor + 1} 層)——每 5 層得天仙丹、每 10 層得金魂丹,高層更藏頂尖仙法。
          </p>
          <button
            className="btn mt-2 border-amber-300/60 text-amber-300 hover:bg-amber-300/15"
            disabled={inCombat || busy}
            onClick={() => act("challengeFutu")}
          >
            登 塔 · 挑戰第 {s.futuFloor + 1} 層
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
              <span className="font-bold">{loc.name}</span>
              {locked && <span className="chip">境界不足</span>}
            </div>
            <p className="text-sm text-faded mt-1">{loc.desc}</p>
            <div className="mt-2 flex gap-2">
              <button
                className="btn"
                disabled={locked || inCombat || busy || inDwelling}
                onClick={() => act("gather", { locationId: loc.id })}
                title={inDwelling ? "正於宗門仙境閉關潛修,須先離開仙境方可行動" : undefined}
              >
                採集靈材
              </button>
              <button
                className="btn btn-danger"
                disabled={locked || inCombat || busy || inDwelling}
                onClick={() => act("hunt", { locationId: loc.id })}
                title={inDwelling ? "正於宗門仙境閉關潛修,須先離開仙境方可行動" : undefined}
              >
                獵殺妖獸
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

const BAG_SECTIONS: [string, ItemKind[]][] = [
  ["材 料", ["material"]],
  ["仙 草 · 丹 藥", ["herb", "pill"]],
  ["法 器 · 法 衣 · 護 身 符 · 符 籙", ["artifact", "robe", "treasure", "amulet", "talisman"]],
  ["靈 寵", ["pet"]],
  ["命 器", ["mingqi"]],
  ["功 法 秘 笈 · 圖 譜", ["manual", "recipe"]],
  ["奇 珍 · 仙 物", ["special"]],
];

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
  const entries = Object.entries(s.inventory);
  const [filter, setFilter] = useState("全部");
  if (entries.length === 0) return <p className="text-faded text-sm">儲物袋空空如也。</p>;

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
        <div className="min-w-0">
          <span className="font-bold">
            <span className={xuantian ? "text-xuantian" : ""}>{item.name}</span>{" "}
            <span className="text-faded font-normal">×{n}</span>
            <span className="chip ml-2 text-faded/80 border-faded/30">{KIND_LABEL[item.kind]}</span>
            {item.element && (
              <span className={`chip ml-2 ${ELEMENT_COLOR[item.element]}`}>{item.element}</span>
            )}
            {xuantian && <span className="chip ml-2 text-xuantian border-fuchsia-400/50">玄天仙器</span>}
            {equipped && <span className="chip ml-2 text-gold border-gold/50">已裝備</span>}
            {item.kind === "manual" && item.teaches && (
              <span className="chip ml-2 text-azure border-azure/50">
                修習 {learnYears(item.teaches)} 年
              </span>
            )}
          </span>
          <p className="text-xs text-faded truncate">{item.desc}</p>
        </div>
        <div className="flex gap-1.5 shrink-0 ml-3">
          {(item.kind === "pill" || item.kind === "herb") && (
            <button className="btn" disabled={busy} onClick={() => act("useItem", { itemId: id })}>
              服用
            </button>
          )}
          {item.kind === "special" && item.xianli && (
            <button className="btn" disabled={busy} onClick={() => act("useItem", { itemId: id })}>
              煉化
            </button>
          )}
          {item.kind === "special" && id === "jinhundan" && (
            <button
              className="btn border-gold/60 text-gold"
              disabled={busy}
              onClick={() => act("useItem", { itemId: id })}
            >
              服用晉金仙
            </button>
          )}
          {item.kind === "special" && id === "xiantian_zaohuadan" && (
            <button
              className="btn border-gold/60 text-gold"
              disabled={busy}
              onClick={() => act("useItem", { itemId: id })}
            >
              服用直升煉虛
            </button>
          )}
          {item.kind === "special" && id === "zenglingzhu" && (
            <span className="chip text-fuchsia-400 border-fuchsia-400/50 self-center">
              於仙法欄使用
            </span>
          )}
          {item.kind === "special" &&
            !item.xianli &&
            !["jinhundan", "xiantian_zaohuadan", "zenglingzhu"].includes(id) && (
              <span className="chip text-fuchsia-400 border-fuchsia-400/50 self-center">
                集滿/達成條件後自動生效
              </span>
            )}
          {item.kind === "recipe" && (
            <button
              className="btn border-azure/60 text-azure"
              disabled={busy}
              onClick={() => act("useItem", { itemId: id })}
            >
              參悟圖譜
            </button>
          )}
          {item.kind === "manual" && (
            <button
              className="btn"
              disabled={busy || !!s.learning}
              title={s.learning ? "已在修習其他仙法" : ""}
              onClick={() => act("useItem", { itemId: id })}
            >
              {s.learning ? "修習中…" : "開始修習"}
            </button>
          )}
          {EQUIPPABLE.includes(item.kind) && !equipped && (
            <button className="btn" disabled={busy} onClick={() => act("equip", { itemId: id })}>
              {item.kind === "pet" ? "收為靈寵" : "裝備"}
            </button>
          )}
          {item.kind !== "special" && item.kind !== "recipe" && (
            <button
              className="btn btn-danger"
              disabled={busy}
              onClick={() => act("sell", { itemId: id })}
            >
              售 {Math.max(1, Math.floor(item.price * 0.6))}
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
    filter === "全部" ? availableSections : availableSections.filter(([title]) => title === filter);

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5 pb-1">
        <button
          onClick={() => setFilter("全部")}
          className={`px-2.5 py-1 text-xs rounded-sm border transition-colors ${
            filter === "全部"
              ? "border-gold bg-gold/15 text-gold"
              : "border-faded/30 text-faded hover:text-cream"
          }`}
        >
          全部
        </button>
        {availableSections.map(([title]) => (
          <button
            key={title}
            onClick={() => setFilter(title)}
            className={`px-2.5 py-1 text-xs rounded-sm border transition-colors ${
              filter === title
                ? "border-gold bg-gold/15 text-gold"
                : "border-faded/30 text-faded hover:text-cream"
            }`}
          >
            {title.replace(/\s/g, "")}
          </button>
        ))}
      </div>
      {sectionsToShow.map(([title, kinds]) => {
        const group = entries.filter(([id]) => kinds.includes(itemById(id).kind));
        if (!group.length) return null;
        return (
          <div key={title}>
            <div className="divider">{title}</div>
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
  const zenglingzhu = s.inventory["zenglingzhu"] ?? 0;
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs text-faded">法術最高 7 級,以增靈珠強化,每級威力大增。</p>
        <span className="chip text-fuchsia-400 border-fuchsia-400/50">增靈珠 ×{zenglingzhu}</span>
      </div>
      {s.learning && (
        <div className="border border-azure/40 bg-azure/5 rounded-sm p-3">
          <div className="flex items-baseline justify-between">
            <span className="font-bold text-azure">修習中:{techById(s.learning.techId).name}</span>
            <span className="text-xs font-mono text-faded">
              尚需 {s.learning.remain} 年(打坐推進)
            </span>
          </div>
        </div>
      )}
      {s.learned.length === 0 && <p className="text-faded text-sm">尚未習得任何仙法。</p>}
      {s.learned.map((id) => {
        const t = techById(id);
        const level = techLevelOf(s, id);
        const maxed = level >= MAX_TECH_LEVEL;
        return (
          <div key={id} className="border border-faded/20 rounded-sm p-3">
            <div className="flex items-baseline justify-between">
              <span className="font-bold">
                <span className={`mr-2 ${ELEMENT_COLOR[t.element]}`}>【{t.element}】</span>
                {t.name}
                <span className="chip ml-2 text-fuchsia-400 border-fuchsia-400/50">
                  {level} / {MAX_TECH_LEVEL} 級
                </span>
              </span>
              <span className="text-xs text-faded font-mono">
                威力 ×{(t.power * techPowerMult(level)).toFixed(1)} · 法力 {t.mpCost}
              </span>
            </div>
            <p className="text-sm text-faded mt-1">{t.desc}</p>
            <button
              className="btn mt-2"
              disabled={busy || maxed || zenglingzhu <= 0}
              title={maxed ? "已達最高等級" : zenglingzhu <= 0 ? "需要增靈珠" : ""}
              onClick={() => act("upgradeTech", { techId: id })}
            >
              {maxed ? "已達七級大圓滿" : `以增靈珠強化 → ${level + 1} 級`}
            </button>
          </div>
        );
      })}
      <p className="text-xs text-faded/60 mt-2">
        秘笈需「開始修習」後,以打坐推進年月,期滿方成。一次僅能修習一部。增靈珠由地域王掉落。
      </p>
    </div>
  );
}

function CraftTab() {
  const s = useGame((x) => x.save)!;
  const act = useGame((x) => x.act);
  const busy = useGame((x) => x.busy);
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

  return (
    <div className="space-y-2">
      <p className="text-xs text-faded">
        煉器堂——藍框配方需先由妖獸掉落圖譜參悟後方能煉製。裝備分類已於名稱旁標示,煉製屬性隨機浮動 ±30%。
      </p>
      {realm.stage >= 12 && (
        <div className="border border-fuchsia-400/50 bg-fuchsia-400/5 rounded-sm p-3">
          <span className="font-bold text-xuantian">玄天仙器煉化</span>
          <p className="text-sm text-faded mt-1">
            以玄天殘片(蠻荒異界怪物掉落,需 10 枚)+ 太乙精魂(天狐/真龍/霸下/黑眼貔貅任一 1
            枚)同淬爐火,隨機煉成【玄天斬靈劍】【玄天葫蘆】【破天槌】【天狐化血刃】【玄天斬魔劍】【幻天鏡】其中一種,屬性隨機浮動
            100%~300%,唯太乙境可用。
          </p>
          <p className="text-xs font-mono mt-1 text-faded">
            玄天殘片 {fragmentCount}/10 · 破曉精華 {fragmentMintCount}/20 · 太乙精魂 {soulCount}/1
          </p>
          <button
            className="btn mt-2 border-fuchsia-400/60 text-fuchsia-300 hover:bg-fuchsia-400/15"
            disabled={busy || fragmentCount < 10 || soulCount < 1}
            onClick={() => act("craftXuantian")}
          >
            煉 化 玄 天 仙 器
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
                {rec.name}
                <span className="chip ml-2 text-faded/80 border-faded/30">
                  {KIND_LABEL[result.kind]}
                </span>
                {result.element && (
                  <span className={`chip ml-2 ${ELEMENT_COLOR[result.element]}`}>
                    {result.element}
                  </span>
                )}
                {rec.dropOnly && (
                  <span className="chip ml-2 text-azure border-azure/60">圖譜配方</span>
                )}
              </span>
              <span className={`text-xs font-mono ${canStones ? "text-gold" : "text-vermillion"}`}>
                {formatStones(rec.stones)}
              </span>
            </div>
            <p className="text-xs text-faded mt-1">{rec.desc}</p>
            <p className="text-xs mt-1.5">
              {rec.materials.map((m) => {
                const have = s.inventory[m.id] ?? 0;
                return (
                  <span
                    key={m.id}
                    className={`mr-3 ${have >= m.n ? "text-jade" : "text-vermillion"}`}
                  >
                    {itemById(m.id).name} {have}/{m.n}
                  </span>
                );
              })}
              <span className="text-faded">
                → {result.atkBonus ? `攻+${result.atkBonus} ` : ""}
                {result.defBonus ? `防+${result.defBonus} ` : ""}
                {result.speedBonus ? `速+${result.speedBonus}` : ""}
              </span>
            </p>
            <button
              className="btn mt-2"
              disabled={busy || !canStones || !canMats || locked || stageLocked}
              title={
                locked ? "需先取得對應圖譜研讀" : stageLocked ? `需 ${rec.reqStage} 階境界` : ""
              }
              onClick={() => act("craft", { recipeId: rec.id })}
            >
              {locked ? "🔒 未參透圖譜" : stageLocked ? "境界不足" : "煉製"}
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
        setErr(j.error ?? "購買失敗,請稍後再試");
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
              title: "購 買 成 功",
              lines: [`黑市老板將【${r.itemName ?? itemId}】遞來,已收入儲物袋。`],
            });
          } else if (r.status === "failed") {
            if (pollRef.current) clearInterval(pollRef.current);
            setErr("付款已收到,但道具未能順利發放,請聯繫客服處理。");
            setBuyingId(null);
            setPurchaseResult({
              success: false,
              title: "購 買 未 能 發 放",
              lines: ["付款已確認收到,但道具未能順利發放,請聯繫客服處理,勿重複付款。"],
            });
          }
        } catch {
          /* 靜默重試 */
        }
      }, 3000);
    } catch {
      setErr("無法連線至伺服器,請稍後再試");
    }
  };

  return (
    <div className="space-y-2">
      <p className="text-xs text-faded">
        黑市不收靈石,只認真金白銀(Polar 金流,美金計價)。消耗型命器裝備後,下一次嘗試突破無論成敗皆會自動消耗。
      </p>
      {BLACK_MARKET_CATALOG.map(({ itemId, priceUsd }) => {
        const item = itemById(itemId);
        if (!item) return null;
        return (
          <div
            key={itemId}
            className="flex items-center justify-between border border-fuchsia-400/30 bg-fuchsia-400/5 rounded-sm p-2.5"
          >
            <div className="min-w-0">
              <span className="font-bold">
                {item.name}
                <span className="chip ml-2 text-faded/80 border-faded/30">
                  {KIND_LABEL[item.kind]}
                </span>
                {item.breakBonus && (
                  <span className="chip ml-2 text-fuchsia-300 border-fuchsia-400/50">
                    突破 +{Math.round(item.breakBonus * 100)}%
                  </span>
                )}
              </span>
              <p className="text-xs text-faded truncate">{item.desc}</p>
            </div>
            <button
              className="btn shrink-0 ml-3 border-fuchsia-400/60 text-fuchsia-300 hover:bg-fuchsia-400/15"
              disabled={buyingId === itemId}
              onClick={() => buy(itemId)}
              title={`USD ${priceUsd}`}
            >
              {buyingId === itemId ? "付款中…" : `${priceUsd} 美利堅靈石`}
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
            ["shop", "商鋪"],
            ["blackmarket", "黑市"],
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
            坊市為宗門官營,明碼標價。大乘以上的仙家至寶坊市不售,唯有斬妖奪寶方能得之。現有靈石:
            <span className="text-gold">
              {" "}
              <StoneAmount n={s.stones} />
            </span>
          </p>

          {wares.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between border border-faded/20 rounded-sm p-2.5"
            >
              <div className="min-w-0">
                <span className="font-bold">
                  {item.name}
                  <span className="chip ml-2 text-faded/80 border-faded/30">
                    {KIND_LABEL[item.kind]}
                  </span>
                  {item.element && (
                    <span className={`chip ml-2 ${ELEMENT_COLOR[item.element]}`}>
                      {item.element}
                    </span>
                  )}
                </span>
                <p className="text-xs text-faded truncate">{item.desc}</p>
              </div>
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
          `你將 ${itemById(sellItem).name} ×${sellQty} 掛上交易行,單價 ${formatStones(sellPrice)}。`,
        );
        setSellItem("");
      } else {
        pushLog("掛賣失敗:" + (j.error ?? "未知錯誤"));
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
          `你以 ${formatStones(j.total)} 購得 ${itemById(j.itemId).name} ×${j.qty}(售自 ${l.seller_name})。`,
        );
      } else {
        pushLog("購買失敗:" + (j.error ?? "已被他人買走"));
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
        pushLog(`你將 ${itemById(l.item_id).name} ×${l.qty} 自交易行取回。`);
      } else {
        pushLog("下架失敗:" + (j.error ?? "未知錯誤"));
      }
      await Promise.all([refresh(), reloadSave()]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-3">
      <p className="text-xs text-faded">
        萬寶樓交易行——修士自由掛賣,靈石結算,全服互通。 現有靈石:
        <span className="text-gold">
          <StoneAmount n={s.stones} />
        </span>
        <button className="chip ml-3 hover:text-gold py-1.5 px-2.5" onClick={refresh}>
          刷新
        </button>
      </p>

      <div className="border border-faded/25 rounded-sm p-3">
        <p className="text-xs text-gold/80 font-mono tracking-widest mb-2">掛 賣</p>
        <div className="flex flex-wrap gap-2 items-center">
          <select
            value={sellItem}
            onChange={(e) => setSellItem(e.target.value)}
            className="bg-smoke border border-faded/30 rounded-sm px-2 py-1.5 text-sm text-parchment"
          >
            <option value="">選擇物品…</option>
            {myItems.map(([id, n]) => (
              <option key={id} value={id}>
                {itemById(id).name} ×{n}
              </option>
            ))}
          </select>
          <label className="text-xs text-faded">
            數量
            <input
              type="number"
              min={1}
              value={sellQty}
              onChange={(e) => setSellQty(+e.target.value)}
              className="w-16 ml-1 bg-smoke border border-faded/30 rounded-sm px-2 py-1 text-sm text-parchment"
            />
          </label>
          <label className="text-xs text-faded">
            單價(下品)
            <input
              type="number"
              min={1}
              value={sellPrice}
              onChange={(e) => setSellPrice(+e.target.value)}
              className="w-24 ml-1 bg-smoke border border-faded/30 rounded-sm px-2 py-1 text-sm text-parchment"
            />
          </label>
          <button className="btn" disabled={busy || !sellItem} onClick={list}>
            掛賣
          </button>
        </div>
      </div>

      <div className="divider">在 售</div>
      {listings.length === 0 && (
        <p className="text-sm text-faded">交易行暫無掛單,或許正是你囤貨居奇之時。</p>
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
            <div className="min-w-0">
              <span className="font-bold">
                <span className={xuantian ? "text-xuantian" : ""}>{item.name}</span>{" "}
                <span className="text-faded font-normal">×{l.qty}</span>
                {mine && <span className="chip ml-2 text-gold border-gold/50">我的掛單</span>}
              </span>
              <p className="text-xs text-faded">
                賣家:{l.seller_name} · 單價 {formatStones(l.price)} · 總價{" "}
                <span className="text-gold">{formatStones(l.qty * l.price)}</span>
              </p>
            </div>
            <div className="shrink-0 ml-3">
              {mine ? (
                <button className="btn btn-danger" disabled={busy} onClick={() => cancel(l)}>
                  下架
                </button>
              ) : (
                <button
                  className="btn"
                  disabled={busy || s.stones < l.qty * l.price}
                  onClick={() => buy(l)}
                >
                  購買
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
            {mon.isLord ? "傳說中的地域之王,尚未現身。" : "尚未遭遇的妖獸,蹤跡成謎。"}
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
              <span className="chip mr-2 text-fuchsia-400 border-fuchsia-400/50">地域王</span>
            )}
            {mon.name}
            <span className={`chip ml-2 ${ELEMENT_COLOR[mon.element]}`}>{mon.element}屬性</span>
          </span>
          <span className="text-xs font-mono text-faded">
            氣血 {mon.hp} · 攻擊 {mon.atk} · 已獵殺 {kills}
          </span>
        </div>
        <p className="text-xs text-faded mt-1">{mon.desc}</p>
      </div>
    );
  };

  return (
    <div className="space-y-2">
      <p className="text-xs text-faded">
        已目擊 {s.seen.length}/{MONSTERS.length} 種妖獸。遭遇即錄入圖鑑。
      </p>
      <div className="divider">妖 獸</div>
      {normals.map(monsterRow)}
      <div className="divider text-fuchsia-400/70">領 主</div>
      <p className="text-xs text-faded">
        地域王極為稀有,獵殺妖獸時約 2%~3% 機率遭遇。已遇 {s.lordsSeen?.length ?? 0}/{lords.length}{" "}
        位,斬之掉落豐厚——增元丹、增靈珠、高階符籙與圖譜。北寒仙尊更有機率傳下無上仙法;金源仙帝、太上金仙則掉落金魂丹等仙緣。
      </p>
      {lords.map(monsterRow)}
    </div>
  );
}

// 混沌萬靈榜:全物品一覽,唯真仙以上境界(stage >= 10)可查閱
function itemStatLine(item: (typeof ITEMS)[number]): string {
  const parts: string[] = [];
  if (item.price) parts.push(`售價 ${formatStones(item.price)}`);
  if (item.heal) parts.push(`回氣血 ${item.heal}`);
  if (item.mp) parts.push(`回法力 ${item.mp}`);
  if (item.exp) parts.push(`修為 +${item.exp}`);
  if (item.life) parts.push(`延壽 +${item.life} 年`);
  if (item.lifePct) parts.push(`延壽 +${Math.round(item.lifePct * 100)}%`);
  if (item.xianli) parts.push(`仙靈力 +${item.xianli}`);
  if (item.atkBonus) parts.push(`攻 +${item.atkBonus}`);
  if (item.defBonus) parts.push(`防 +${item.defBonus}`);
  if (item.speedBonus) parts.push(`速 +${item.speedBonus}`);
  if (item.stoneMult) parts.push(`靈石 ×${item.stoneMult}`);
  if (item.breakBonus) parts.push(`突破 +${Math.round(item.breakBonus * 100)}%`);
  if (item.reqStage) parts.push(`需 ${item.reqStage} 階境界`);
  if (item.dropOnly) parts.push("僅妖獸掉落");
  return parts.join(" · ");
}

function WanlingTab() {
  const s = useGame((x) => x.save)!;
  const { realm } = statsOf(s);
  const [filter, setFilter] = useState("全部");

  if (realm.stage < 10) {
    return (
      <p className="text-sm text-faded">
        【混沌萬靈榜】乃仙界至寶,窺盡天地萬物,唯真仙以上境界方能查閱——你尚未飛昇,無緣得見其貌。
      </p>
    );
  }

  const sectionsToShow =
    filter === "全部" ? BAG_SECTIONS : BAG_SECTIONS.filter(([title]) => title === filter);

  return (
    <div className="space-y-2">
      <p className="text-xs text-faded">
        混沌萬靈榜,錄盡天地萬物,共 {ITEMS.length} 種,真仙以上方能查閱全貌。
      </p>

      <div className="flex flex-wrap gap-1.5 pt-1">
        <button
          onClick={() => setFilter("全部")}
          className={`px-2.5 py-1 text-xs rounded-sm border transition-colors ${
            filter === "全部"
              ? "border-gold bg-gold/15 text-gold"
              : "border-faded/30 text-faded hover:text-cream"
          }`}
        >
          全部
        </button>
        {BAG_SECTIONS.map(([title]) => (
          <button
            key={title}
            onClick={() => setFilter(title)}
            className={`px-2.5 py-1 text-xs rounded-sm border transition-colors ${
              filter === title
                ? "border-gold bg-gold/15 text-gold"
                : "border-faded/30 text-faded hover:text-cream"
            }`}
          >
            {title.replace(/\s/g, "")}
          </button>
        ))}
      </div>

      {sectionsToShow.map(([title, kinds]) => {
        const group = ITEMS.filter((i) => kinds.includes(i.kind));
        if (!group.length) return null;
        return (
          <div key={title}>
            <div className="divider">{title}</div>
            <div className="space-y-2">
              {group.map((item) => {
                const stat = itemStatLine(item);
                const xuantian = isXuantianArtifact(item.id);
                return (
                  <div
                    key={item.id}
                    className={`border rounded-sm p-2.5 ${xuantian ? "border-fuchsia-400/40" : "border-faded/20"}`}
                  >
                    <span className="font-bold">
                      <span className={xuantian ? "text-xuantian" : ""}>{item.name}</span>
                      <span className="chip ml-2 text-faded/80 border-faded/30">
                        {KIND_LABEL[item.kind]}
                      </span>
                      {item.element && (
                        <span className={`chip ml-2 ${ELEMENT_COLOR[item.element]}`}>
                          {item.element}
                        </span>
                      )}
                      {xuantian && (
                        <span className="chip ml-2 text-xuantian border-fuchsia-400/50">
                          玄天仙器
                        </span>
                      )}
                    </span>
                    <p className="text-xs text-faded mt-0.5">{item.desc}</p>
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
  const isXian = REALMS[profile.realmIdx]?.stage >= 10;
  const gear: [string, string | null][] = [
    ["法器", profile.equippedWeapon],
    ["法衣", profile.equippedRobe],
    ["護身符", profile.equippedAmulet],
    ["符籙", profile.equippedTalisman],
    ["靈寵", profile.equippedPet],
    ["命器", profile.equippedMing],
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
            <span className="chip ml-2 text-vermillion border-vermillion/50">已隕落</span>
          )}
        </span>
        <button className="chip hover:text-cream py-1.5 px-2.5" onClick={onClose}>
          關閉 ✕
        </button>
      </div>
      <div className="grid grid-cols-2 gap-y-1 text-sm">
        <span className="text-faded">境界</span>
        <span className={`text-right ${isXian ? "text-fuchsia-300" : ""}`}>
          {REALMS[profile.realmIdx]?.name ?? "??"}
        </span>
        <span className="text-faded">門派</span>
        <span className="text-right">
          {SECTS.find((x) => x.id === profile.sectId)?.name ?? "散修"}
        </span>
        <span className="text-faded">修為</span>
        <span className="text-right font-mono">{profile.exp}</span>
        {profile.xianli > 0 && (
          <>
            <span className="text-faded">仙靈力</span>
            <span className="text-right font-bold text-fuchsia-400">{profile.xianli} 點</span>
          </>
        )}
        {profile.futuFloor > 0 && (
          <>
            <span className="text-faded">浮屠塔</span>
            <span className="text-right font-bold text-amber-300">第 {profile.futuFloor} 層</span>
          </>
        )}
        <span className="text-faded">壽元 / 修行</span>
        <span className="text-right">
          {profile.age} 年 · 修行 {profile.day} 載
        </span>
        <span className="text-faded">圖鑑 · 領主 · 仙法</span>
        <span className="text-right text-xs">
          妖獸 {profile.seenCount} · 領主 {profile.lordsSeenCount} · 仙法 {profile.learnedCount}
        </span>
      </div>
      <div className="divider">裝 備</div>
      <div className="grid grid-cols-2 gap-y-1 text-sm">
        {gear.map(([label, id]) => (
          <div key={label} className="contents">
            <span className="text-faded">{label}</span>
            <span
              className={`text-right ${id ? (label === "靈寵" ? "text-fuchsia-300" : "text-cream") : "text-faded/50"}`}
            >
              {id ? itemById(id).name : "—"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function usePlayerLookup() {
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
        setErr(j.error ?? "查無此修士");
      }
    } catch {
      setErr("查詢失敗");
    }
  };
  return { profile, setProfile, err, lookup };
}

type Board = "xiu" | "exp" | "futu";

function RankTab() {
  const s = useGame((x) => x.save)!;
  const [board, setBoard] = useState<Board>("xiu");
  const [players, setPlayers] = useState<RankPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const { profile, setProfile, err, lookup } = usePlayerLookup();

  const boards: [Board, string, string][] = [
    ["xiu", "修仙榜", "按境界高低、仙靈力、修為綜合排序"],
    ["exp", "修為榜", "純以修為深淺論高下"],
    ["futu", "浮屠塔榜", "以浮屠塔通關層數論英雄"],
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
      return <span className="text-amber-300 font-bold">第 {p.futu_floor} 層</span>;
    if (board === "exp")
      return (
        <>
          <span className="text-jade font-mono">修為 {p.exp}</span>
          <span className="text-xs text-faded ml-2">{REALMS[p.realm_idx]?.name ?? "??"}</span>
        </>
      );
    // 修仙榜
    return (
      <>
        <span>{REALMS[p.realm_idx]?.name ?? "??"}</span>
        {p.xianli > 0 && <span className="text-xs text-fuchsia-400 ml-2">仙靈力 {p.xianli}</span>}
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
            你當前名列第<span className={`text-${accent}`}> {myRank} </span>位。
          </>
        )}
        <button className="chip ml-3 hover:text-gold py-1.5 px-2.5" onClick={() => refresh()}>
          刷新
        </button>
      </p>
      <div className="flex gap-2 items-center">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && lookup(query)}
          placeholder="搜尋修士道號…"
          className="flex-1 bg-smoke border border-faded/30 rounded-sm px-2 py-1.5 text-sm text-parchment"
        />
        <button className="btn" onClick={() => lookup(query)}>
          查詢
        </button>
      </div>
      {err && <p className="text-sm text-vermillion">{err}</p>}
      {profile && <PlayerDetailCard profile={profile} onClose={() => setProfile(null)} />}
      {loading && <p className="text-sm text-faded">榜文更新中…</p>}
      {!loading && players.length === 0 && (
        <p className="text-sm text-faded">
          {isFutuBoard ? "浮屠塔尚無人登臨,你將是第一位挑戰者。" : "榜上無人,你將是第一位留名者。"}
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
                {me && <span className={`text-xs ${topColor}/70 ml-2`}>(你)</span>}
                {p.dead && (
                  <span className="chip ml-2 text-vermillion border-vermillion/50">已隕落</span>
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
