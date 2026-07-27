"use client";

import { useEffect, useState } from "react";
import {
  useGame,
  statsOf,
  learnYears,
  techLevelOf,
  techPowerMult,
  MAX_TECH_LEVEL,
} from "@/game/store";
import { LOCATIONS, MONSTERS, RECIPES, REGIONS } from "@/game/data/world";
import { ITEMS, itemById } from "@/game/data/items";
import { MISSIONS } from "@/game/data/missions";
import { REALMS } from "@/game/data/realms";
import { SECTS } from "@/game/data/sects";
import { techById } from "@/game/data/techniques";
import { ELEMENT_COLOR, ItemKind, KIND_LABEL, formatStones } from "@/game/types";

type Tab = "explore" | "bag" | "tech" | "craft" | "market" | "trade" | "mission" | "dex" | "rank";

export default function ActionTabs() {
  const [tab, setTab] = useState<Tab>("explore");
  const tabs: [Tab, string][] = [
    ["explore", "盤面探索"],
    ["bag", "資產庫"],
    ["tech", "交易策略"],
    ["craft", "硬體組裝"],
    ["market", "商城"],
    ["trade", "場外交易"],
    ["mission", "團隊任務"],
    ["dex", "對手情報"],
    ["rank", "排行榜"],
  ];
  return (
    <div className="panel">
      <div className="flex flex-wrap gap-1 mb-4 border-b border-smoke pb-2">
        {tabs.map(([t, label]) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-1 text-sm rounded transition-colors ${
              tab === t
                ? "bg-jade/15 text-jade border border-jade/40"
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
      {tab === "mission" && <MissionTab />}
      {tab === "dex" && <DexTab />}
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
  const [regionId, setRegionId] = useState("tiannan");
  const region = REGIONS.find((r) => r.id === regionId)!;
  const locs = LOCATIONS.filter((l) => l.region === regionId);

  return (
    <div className="space-y-3">
      <div className="divider">市 場 版 圖</div>
      <div className="flex flex-wrap gap-1.5">
        {REGIONS.filter((r) => !r.hidden || s.jinyuanUnlocked).map((r) => {
          const rLocked = realm.stage < r.reqStage;
          const isPurple = r.color === "fuchsia";
          return (
            <button
              key={r.id}
              onClick={() => !rLocked && setRegionId(r.id)}
              title={rLocked ? `需 ${r.reqStage} 級交易員` : r.desc}
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
            <span className="font-bold text-amber-300">爆 倉 擂 台</span>
            <span className="text-xs font-mono text-amber-300/80">已通關第 {s.futuFloor} 關</span>
          </div>
          <p className="text-sm text-faded mt-1">
            擂台上是一尊幻象莊家天尊,每打過一關便更強(目標交易額 ×1.5、火力
            ×1.2),永無止境。挑戰下一關(第 {s.futuFloor + 1} 關)——每 5 關得操盤私鑰、每 10
            關得家族資本密令,高關更藏頂尖策略。
          </p>
          <button
            className="btn mt-2 border-amber-300/60 text-amber-300 hover:bg-amber-300/15"
            disabled={inCombat || busy}
            onClick={() => act("challengeFutu")}
          >
            登 台 · 挑戰第 {s.futuFloor + 1} 關
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
              {locked && <span className="chip">級別不足</span>}
            </div>
            <p className="text-sm text-faded mt-1">{loc.desc}</p>
            <div className="mt-2 flex gap-2">
              <button
                className="btn"
                disabled={locked || inCombat || busy}
                onClick={() => act("gather", { locationId: loc.id })}
              >
                搜刮零件
              </button>
              <button
                className="btn btn-danger"
                disabled={locked || inCombat || busy}
                onClick={() => act("hunt", { locationId: loc.id })}
              >
                挑戰對手
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

const BAG_SECTIONS: [string, ItemKind[]][] = [
  ["零 件", ["material"]],
  ["能 量 飲 · 補 給", ["herb", "pill"]],
  ["顯 卡 · 散 熱 · UPS · CPU", ["artifact", "robe", "treasure", "amulet", "talisman"]],
  ["交 易 機 器 人", ["pet"]],
  ["策 略 手 冊 · 藍 圖", ["manual", "recipe"]],
  ["稀 有 道 具", ["special"]],
];

const EQUIPPABLE: ItemKind[] = ["artifact", "robe", "treasure", "amulet", "talisman", "pet"];

function BagTab() {
  const s = useGame((x) => x.save)!;
  const act = useGame((x) => x.act);
  const busy = useGame((x) => x.busy);
  const entries = Object.entries(s.inventory);
  if (entries.length === 0) return <p className="text-faded text-sm">儲物袋空空如也。</p>;

  const equippedIds = [
    s.equippedWeapon,
    s.equippedRobe ?? s.equippedArmor,
    s.equippedAmulet,
    s.equippedTalisman,
    s.equippedPet,
  ];

  const row = ([id, n]: [string, number]) => {
    const item = itemById(id);
    const equipped = equippedIds.includes(id);
    return (
      <div
        key={id}
        className="flex items-center justify-between border border-faded/20 rounded-sm p-2.5"
      >
        <div className="min-w-0">
          <span className="font-bold">
            {item.name} <span className="text-faded font-normal">×{n}</span>
            <span className="chip ml-2 text-faded/80 border-faded/30">{KIND_LABEL[item.kind]}</span>
            {item.element && (
              <span className={`chip ml-2 ${ELEMENT_COLOR[item.element]}`}>{item.element}</span>
            )}
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
              服用晉加密教父
            </button>
          )}
          {item.kind === "special" && !item.xianli && id !== "jinhundan" && (
            <span className="chip text-emerald-400 border-emerald-400/50 self-center">
              於交易策略欄使用
            </span>
          )}
          {item.kind === "recipe" && (
            <button
              className="btn border-azure/60 text-azure"
              disabled={busy}
              onClick={() => act("useItem", { itemId: id })}
            >
              參悟藍圖
            </button>
          )}
          {item.kind === "manual" && (
            <button
              className="btn"
              disabled={busy || !!s.learning}
              title={s.learning ? "已在進修其他策略" : ""}
              onClick={() => act("useItem", { itemId: id })}
            >
              {s.learning ? "進修中…" : "開始進修"}
            </button>
          )}
          {EQUIPPABLE.includes(item.kind) && !equipped && (
            <button className="btn" disabled={busy} onClick={() => act("equip", { itemId: id })}>
              {item.kind === "pet" ? "掛載" : "裝配"}
            </button>
          )}
          {item.kind !== "special" && item.kind !== "recipe" && (
            <button
              className="btn btn-danger"
              disabled={busy}
              onClick={() => act("sell", { itemId: id })}
            >
              賣 {Math.max(1, Math.floor(item.price * 0.6))}
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-2">
      {BAG_SECTIONS.map(([title, kinds]) => {
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
            <span className="font-bold text-azure">進修中:{techById(s.learning.techId).name}</span>
            <span className="text-xs font-mono text-faded">
              尚需 {s.learning.remain} 年(進修苦研推進)
            </span>
          </div>
        </div>
      )}
      {s.learned.length === 0 && <p className="text-faded text-sm">尚未習得任何策略。</p>}
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
                威力 ×{(t.power * techPowerMult(level)).toFixed(1)} · 精力 {t.mpCost}
              </span>
            </div>
            <p className="text-sm text-faded mt-1">{t.desc}</p>
            <button
              className="btn mt-2"
              disabled={busy || maxed || zenglingzhu <= 0}
              title={maxed ? "已達最高等級" : zenglingzhu <= 0 ? "需要策略強化核" : ""}
              onClick={() => act("upgradeTech", { techId: id })}
            >
              {maxed ? "已達七級大圓滿" : `以策略強化核強化 → ${level + 1} 級`}
            </button>
          </div>
        );
      })}
      <p className="text-xs text-faded/60 mt-2">
        策略手冊需「開始進修」後,以進修苦研推進年月,期滿方成。一次僅能進修一套。策略強化核由巨鯨掉落。
      </p>
    </div>
  );
}

function CraftTab() {
  const s = useGame((x) => x.save)!;
  const act = useGame((x) => x.act);
  const busy = useGame((x) => x.busy);
  const { realm } = statsOf(s);
  return (
    <div className="space-y-2">
      <p className="text-xs text-faded">
        硬體組裝廠——藍框配方需先由對手掉落藍圖參悟後方能組裝。硬體分類已於名稱旁標示。
      </p>
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
                locked ? "需先取得對應藍圖研讀" : stageLocked ? `需 ${rec.reqStage} 級交易員` : ""
              }
              onClick={() => act("craft", { recipeId: rec.id })}
            >
              {locked ? "🔒 未參透藍圖" : stageLocked ? "級別不足" : "組裝"}
            </button>
          </div>
        );
      })}
    </div>
  );
}

function MarketTab() {
  const s = useGame((x) => x.save)!;
  const act = useGame((x) => x.act);
  const busy = useGame((x) => x.busy);
  const wares = ITEMS.filter(
    (i) =>
      ["pill", "herb", "robe", "amulet", "talisman"].includes(i.kind) &&
      !i.life &&
      !i.lifePct &&
      !i.dropOnly &&
      (i.reqStage ?? 1) <= 8,
  );
  return (
    <div className="space-y-2">
      <p className="text-xs text-faded">
        商城為團隊官營,明碼標價。大乘以上的頂級硬體商城不售,唯有清算對手方能得之。現有美金:
        <span className="text-gold"> {formatStones(s.stones)}</span>
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
                <span className={`chip ml-2 ${ELEMENT_COLOR[item.element]}`}>{item.element}</span>
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
        場外交易大廳——交易員自由掛賣,美金結算,全服互通。 現有美金:
        <span className="text-gold">{formatStones(s.stones)}</span>
        <button className="chip ml-3 hover:text-gold" onClick={refresh}>
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
        return (
          <div
            key={l.id}
            className="flex items-center justify-between border border-faded/20 rounded-sm p-2.5"
          >
            <div className="min-w-0">
              <span className="font-bold">
                {item.name} <span className="text-faded font-normal">×{l.qty}</span>
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

function MissionTab() {
  const s = useGame((x) => x.save)!;
  const act = useGame((x) => x.act);
  const busy = useGame((x) => x.busy);
  const { realm } = statsOf(s);
  const active = s.missionId ? MISSIONS.find((m) => m.id === s.missionId)! : null;

  const progress = (m: (typeof MISSIONS)[number]) =>
    m.kind === "kill" ? (s.kills[m.targetId] ?? 0) - s.missionBase : (s.inventory[m.targetId] ?? 0);

  return (
    <div className="space-y-3">
      {active ? (
        <div className="border border-gold/40 bg-gold/5 rounded-sm p-3">
          <div className="flex items-baseline justify-between">
            <span className="font-bold text-gold">{active.name}</span>
            <span className="text-xs font-mono text-faded">
              進度 {Math.min(progress(active), active.n)}/{active.n}
            </span>
          </div>
          <p className="text-sm text-faded mt-1">{active.desc}</p>
          <div className="mt-2 flex gap-2">
            <button className="btn" disabled={busy} onClick={() => act("completeMission")}>
              繳令覆命
            </button>
            <button
              className="btn btn-danger"
              disabled={busy}
              onClick={() => act("abandonMission")}
            >
              放棄任務
            </button>
          </div>
        </div>
      ) : (
        <p className="text-xs text-faded">執事堂告示欄上貼著數張任務令,同一時間僅可領取一件。</p>
      )}
      <div className="divider">告 示 欄</div>
      {MISSIONS.map((m) => {
        const locked = realm.stage < m.reqStage;
        const target =
          m.kind === "kill"
            ? MONSTERS.find((x) => x.id === m.targetId)!.name
            : itemById(m.targetId).name;
        return (
          <div
            key={m.id}
            className={`border border-faded/20 rounded-sm p-3 ${locked ? "opacity-45" : ""}`}
          >
            <div className="flex items-baseline justify-between">
              <span className="font-bold">
                {m.name}
                <span className="chip ml-2">
                  {m.kind === "kill" ? "清算" : "繳納"} {target} ×{m.n}
                </span>
              </span>
              <span className="text-xs font-mono text-gold">
                {m.stones} 美金 · 交易量 {m.exp}
              </span>
            </div>
            <p className="text-xs text-faded mt-1">
              {m.desc}
              {m.item && <span className="text-cream"> 另賜:{itemById(m.item).name}</span>}
            </p>
            <button
              className="btn mt-2"
              disabled={busy || locked || !!s.missionId}
              onClick={() => act("acceptMission", { missionId: m.id })}
            >
              {locked ? "級別不足" : "領取"}
            </button>
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
            {mon.isLord ? "傳說中的巨鯨,尚未現身。" : "尚未遭遇的對手,蹤跡成謎。"}
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
              <span className="chip mr-2 text-fuchsia-400 border-fuchsia-400/50">巨鯨</span>
            )}
            {mon.name}
            <span className={`chip ml-2 ${ELEMENT_COLOR[mon.element]}`}>{mon.element}盤</span>
          </span>
          <span className="text-xs font-mono text-faded">
            目標交易額 {mon.hp} · 火力 {mon.atk} · 已清算 {kills}
          </span>
        </div>
        <p className="text-xs text-faded mt-1">{mon.desc}</p>
      </div>
    );
  };

  return (
    <div className="space-y-2">
      <p className="text-xs text-faded">
        已目擊 {s.seen.length}/{MONSTERS.length} 種對手。遭遇即錄入情報。
      </p>
      <div className="divider">對 手</div>
      {normals.map(monsterRow)}
      <div className="divider text-fuchsia-400/70">巨 鯨</div>
      <p className="text-xs text-faded">
        巨鯨極為稀有,挑戰對手時約 2%~3% 機率遭遇。已遇 {s.lordsSeen?.length ?? 0}/{lords.length}{" "}
        位,清算之掉落豐厚——本金擴充丹、策略強化核、高階處理器與藍圖。頂級操盤宗師更有機率傳下無上策略;主力莊家、傳奇資本則掉落家族資本密令等機緣。
      </p>
      {lords.map(monsterRow)}
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
}

function PlayerDetailCard({ profile, onClose }: { profile: PlayerProfile; onClose: () => void }) {
  const isXian = REALMS[profile.realmIdx]?.stage >= 10;
  const gear: [string, string | null][] = [
    ["顯示卡", profile.equippedWeapon],
    ["散熱", profile.equippedRobe],
    ["不斷電", profile.equippedAmulet],
    ["處理器", profile.equippedTalisman],
    ["交易機器人", profile.equippedPet],
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
        <button className="chip hover:text-cream" onClick={onClose}>
          關閉 ✕
        </button>
      </div>
      <div className="grid grid-cols-2 gap-y-1 text-sm">
        <span className="text-faded">級別</span>
        <span className={`text-right ${isXian ? "text-fuchsia-300" : ""}`}>
          {REALMS[profile.realmIdx]?.name ?? "??"}
        </span>
        <span className="text-faded">團隊</span>
        <span className="text-right">
          {SECTS.find((x) => x.id === profile.sectId)?.name ?? "散戶"}
        </span>
        <span className="text-faded">交易量</span>
        <span className="text-right font-mono">{profile.exp}</span>
        {profile.xianli > 0 && (
          <>
            <span className="text-faded">影響力</span>
            <span className="text-right font-bold text-fuchsia-400">{profile.xianli} 點</span>
          </>
        )}
        {profile.futuFloor > 0 && (
          <>
            <span className="text-faded">爆倉擂台</span>
            <span className="text-right font-bold text-amber-300">第 {profile.futuFloor} 關</span>
          </>
        )}
        <span className="text-faded">資產 / 資歷</span>
        <span className="text-right">
          {profile.age} 載 · 資歷 {profile.day} 年
        </span>
        <span className="text-faded">情報 · 巨鯨 · 策略</span>
        <span className="text-right text-xs">
          對手 {profile.seenCount} · 巨鯨 {profile.lordsSeenCount} · 策略 {profile.learnedCount}
        </span>
      </div>
      <div className="divider">硬 體 配 置</div>
      <div className="grid grid-cols-2 gap-y-1 text-sm">
        {gear.map(([label, id]) => (
          <div key={label} className="contents">
            <span className="text-faded">{label}</span>
            <span
              className={`text-right ${id ? (label === "交易機器人" ? "text-emerald-300" : "text-cream") : "text-faded/50"}`}
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
    ["xiu", "成神榜", "按級別高低、影響力、交易量綜合排序"],
    ["exp", "交易量榜", "純以交易量深淺論高下"],
    ["futu", "爆倉擂台榜", "以爆倉擂台通關關數論英雄"],
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
      return <span className="text-amber-300 font-bold">第 {p.futu_floor} 關</span>;
    if (board === "exp")
      return (
        <>
          <span className="text-jade font-mono">交易量 {p.exp}</span>
          <span className="text-xs text-faded ml-2">{REALMS[p.realm_idx]?.name ?? "??"}</span>
        </>
      );
    // 修仙榜
    return (
      <>
        <span>{REALMS[p.realm_idx]?.name ?? "??"}</span>
        {p.xianli > 0 && <span className="text-xs text-fuchsia-400 ml-2">影響力 {p.xianli}</span>}
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
        <button className="chip ml-3 hover:text-gold" onClick={() => refresh()}>
          刷新
        </button>
      </p>
      <div className="flex gap-2 items-center">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && lookup(query)}
          placeholder="搜尋交易員代號…"
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
          {isFutuBoard
            ? "爆倉擂台尚無人登臨,你將是第一位挑戰者。"
            : "榜上無人,你將是第一位留名者。"}
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
