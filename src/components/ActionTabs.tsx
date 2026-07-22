"use client";

import { useEffect, useState } from "react";
import { useGame, statsOf, learnYears, techLevelOf, techPowerMult, MAX_TECH_LEVEL } from "@/game/store";
import { LOCATIONS, MONSTERS, RECIPES, REGIONS } from "@/game/data/world";
import { ITEMS, itemById } from "@/game/data/items";
import { MISSIONS } from "@/game/data/missions";
import { REALMS } from "@/game/data/realms";
import { techById } from "@/game/data/techniques";
import { ELEMENT_COLOR, ItemKind, formatStones } from "@/game/types";

type Tab = "explore" | "bag" | "tech" | "craft" | "market" | "trade" | "mission" | "dex" | "rank" | "xianrank";

export default function ActionTabs() {
  const [tab, setTab] = useState<Tab>("explore");
  const tabs: [Tab, string][] = [
    ["explore", "遊歷探索"],
    ["bag", "儲物袋"],
    ["tech", "仙法"],
    ["craft", "煉器"],
    ["market", "坊市"],
    ["trade", "交易行"],
    ["mission", "宗門任務"],
    ["dex", "妖獸圖鑑"],
    ["rank", "修仙榜"],
    ["xianrank", "真仙榜"],
  ];
  return (
    <div className="panel">
      <div className="flex flex-wrap gap-1 mb-4 border-b border-faded/20 pb-2">
        {tabs.map(([t, label]) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-1 text-sm rounded-sm transition-colors ${
              tab === t ? "bg-gold/15 text-gold border border-gold/40" : "text-faded hover:text-cream"
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
      {tab === "xianrank" && <XianRankTab />}
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
      <div className="divider">大 陸 遊 歷</div>
      <div className="flex flex-wrap gap-1.5">
        {REGIONS.map((r) => {
          const rLocked = realm.stage < r.reqStage;
          const isBeihan = r.id === "beihan";
          return (
            <button
              key={r.id}
              onClick={() => !rLocked && setRegionId(r.id)}
              title={rLocked ? `需 ${r.reqStage} 階境界` : r.desc}
              className={`px-2.5 py-1 text-xs rounded-sm border transition-colors ${
                regionId === r.id
                  ? isBeihan
                    ? "border-fuchsia-400 bg-fuchsia-400/15 text-fuchsia-300"
                    : "border-gold bg-gold/15 text-gold"
                  : rLocked
                  ? "border-faded/15 text-faded/40 cursor-not-allowed"
                  : isBeihan
                  ? "border-fuchsia-400/40 text-fuchsia-300/90 hover:border-fuchsia-400"
                  : "border-faded/30 text-cream hover:border-gold/60"
              }`}
            >
              {r.name}{rLocked && " 🔒"}
            </button>
          );
        })}
      </div>
      <p className="text-xs text-faded">{region.desc}</p>
      {locs.map((loc) => {
        const locked = realm.stage < loc.reqStage;
        return (
          <div key={loc.id} className={`border border-faded/20 rounded-sm p-3 ${locked ? "opacity-45" : ""}`}>
            <div className="flex items-baseline justify-between">
              <span className="font-bold">{loc.name}</span>
              {locked && <span className="chip">境界不足</span>}
            </div>
            <p className="text-sm text-faded mt-1">{loc.desc}</p>
            <div className="mt-2 flex gap-2">
              <button className="btn" disabled={locked || inCombat || busy} onClick={() => act("gather", { locationId: loc.id })}>
                採集靈材
              </button>
              <button className="btn btn-danger" disabled={locked || inCombat || busy} onClick={() => act("hunt", { locationId: loc.id })}>
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
  ["法 器 · 護 身", ["artifact", "treasure"]],
  ["功 法 秘 笈", ["manual"]],
  ["奇 珍 · 仙 物", ["special"]],
];

function BagTab() {
  const s = useGame((x) => x.save)!;
  const act = useGame((x) => x.act);
  const busy = useGame((x) => x.busy);
  const entries = Object.entries(s.inventory);
  if (entries.length === 0) return <p className="text-faded text-sm">儲物袋空空如也。</p>;

  const row = ([id, n]: [string, number]) => {
    const item = itemById(id);
    const equipped = s.equippedWeapon === id || s.equippedArmor === id;
    return (
      <div key={id} className="flex items-center justify-between border border-faded/20 rounded-sm p-2.5">
        <div className="min-w-0">
          <span className="font-bold">
            {item.name} <span className="text-faded font-normal">×{n}</span>
            {item.element && <span className={`chip ml-2 ${ELEMENT_COLOR[item.element]}`}>{item.element}</span>}
            {equipped && <span className="chip ml-2 text-gold border-gold/50">已裝備</span>}
            {item.kind === "manual" && item.teaches && (
              <span className="chip ml-2 text-azure border-azure/50">修習 {learnYears(item.teaches)} 年</span>
            )}
          </span>
          <p className="text-xs text-faded truncate">{item.desc}</p>
        </div>
        <div className="flex gap-1.5 shrink-0 ml-3">
          {(item.kind === "pill" || item.kind === "herb") && (
            <button className="btn" disabled={busy} onClick={() => act("useItem", { itemId: id })}>服用</button>
          )}
          {item.kind === "special" && item.xianli && (
            <button className="btn" disabled={busy} onClick={() => act("useItem", { itemId: id })}>煉化</button>
          )}
          {item.kind === "special" && id === "jinhundan" && (
            <button className="btn border-gold/60 text-gold" disabled={busy} onClick={() => act("useItem", { itemId: id })}>服用晉金仙</button>
          )}
          {item.kind === "special" && !item.xianli && id !== "jinhundan" && (
            <span className="chip text-fuchsia-400 border-fuchsia-400/50 self-center">於仙法欄使用</span>
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
          {(item.kind === "artifact" || item.kind === "treasure") && !equipped && (
            <button className="btn" disabled={busy} onClick={() => act("equip", { itemId: id })}>裝備</button>
          )}
          {item.kind !== "special" && (
            <button className="btn btn-danger" disabled={busy} onClick={() => act("sell", { itemId: id })}>
              售 {Math.max(1, Math.floor(item.price * 0.6))}
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
            <span className="font-bold text-azure">修習中:{techById(s.learning.techId).name}</span>
            <span className="text-xs font-mono text-faded">尚需 {s.learning.remain} 年(打坐推進)</span>
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
                <span className="chip ml-2 text-fuchsia-400 border-fuchsia-400/50">{level} / {MAX_TECH_LEVEL} 級</span>
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
  return (
    <div className="space-y-2">
      {RECIPES.map((rec) => {
        const result = itemById(rec.result);
        const canStones = s.stones >= rec.stones;
        const canMats = rec.materials.every((m) => (s.inventory[m.id] ?? 0) >= m.n);
        return (
          <div key={rec.id} className="border border-faded/20 rounded-sm p-3">
            <div className="flex items-baseline justify-between">
              <span className="font-bold">
                {rec.name}
                {result.element && <span className={`chip ml-2 ${ELEMENT_COLOR[result.element]}`}>{result.element}</span>}
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
                  <span key={m.id} className={`mr-3 ${have >= m.n ? "text-jade" : "text-vermillion"}`}>
                    {itemById(m.id).name} {have}/{m.n}
                  </span>
                );
              })}
              <span className="text-faded">
                → {result.atkBonus ? `攻+${result.atkBonus} ` : ""}{result.defBonus ? `防+${result.defBonus}` : ""}
              </span>
            </p>
            <button className="btn mt-2" disabled={busy || !canStones || !canMats} onClick={() => act("craft", { recipeId: rec.id })}>
              煉製
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
  const wares = ITEMS.filter((i) => ["pill", "herb", "treasure"].includes(i.kind) && !i.life && !i.lifePct);
  return (
    <div className="space-y-2">
      <p className="text-xs text-faded">
        坊市為宗門官營,明碼標價。現有靈石:
        <span className="text-gold"> {formatStones(s.stones)}</span>
      </p>
      {wares.map((item) => (
        <div key={item.id} className="flex items-center justify-between border border-faded/20 rounded-sm p-2.5">
          <div className="min-w-0">
            <span className="font-bold">
              {item.name}
              {item.kind === "manual" && item.teaches && (
                <span className="chip ml-2 text-azure border-azure/50">修習 {learnYears(item.teaches)} 年</span>
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
    } catch { /* ignore */ }
  };
  useEffect(() => { refresh(); }, []);

  // 交易行操作後,重新從伺服器拉整份存檔(伺服器為唯一權威)
  const reloadSave = async () => {
    try {
      const j = await (await fetch("/api/save")).json();
      if (j.save) setSave(j.save);
    } catch { /* ignore */ }
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
        pushLog(`你將 ${itemById(sellItem).name} ×${sellQty} 掛上交易行,單價 ${formatStones(sellPrice)}。`);
        setSellItem("");
      } else {
        pushLog("掛賣失敗:" + (j.error ?? "未知錯誤"));
      }
      await Promise.all([refresh(), reloadSave()]);
    } finally { setBusy(false); }
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
        pushLog(`你以 ${formatStones(j.total)} 購得 ${itemById(j.itemId).name} ×${j.qty}(售自 ${l.seller_name})。`);
      } else {
        pushLog("購買失敗:" + (j.error ?? "已被他人買走"));
      }
      await Promise.all([refresh(), reloadSave()]);
    } finally { setBusy(false); }
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
    } finally { setBusy(false); }
  };

  return (
    <div className="space-y-3">
      <p className="text-xs text-faded">
        萬寶樓交易行——修士自由掛賣,靈石結算,全服互通。
        現有靈石:<span className="text-gold">{formatStones(s.stones)}</span>
        <button className="chip ml-3 hover:text-gold" onClick={refresh}>刷新</button>
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
              <option key={id} value={id}>{itemById(id).name} ×{n}</option>
            ))}
          </select>
          <label className="text-xs text-faded">數量
            <input type="number" min={1} value={sellQty} onChange={(e) => setSellQty(+e.target.value)}
              className="w-16 ml-1 bg-smoke border border-faded/30 rounded-sm px-2 py-1 text-sm text-parchment" />
          </label>
          <label className="text-xs text-faded">單價(下品)
            <input type="number" min={1} value={sellPrice} onChange={(e) => setSellPrice(+e.target.value)}
              className="w-24 ml-1 bg-smoke border border-faded/30 rounded-sm px-2 py-1 text-sm text-parchment" />
          </label>
          <button className="btn" disabled={busy || !sellItem} onClick={list}>掛賣</button>
        </div>
      </div>

      <div className="divider">在 售</div>
      {listings.length === 0 && <p className="text-sm text-faded">交易行暫無掛單,或許正是你囤貨居奇之時。</p>}
      {listings.map((l) => {
        const item = itemById(l.item_id);
        if (!item) return null;
        const mine = l.seller_name === s.name;
        return (
          <div key={l.id} className="flex items-center justify-between border border-faded/20 rounded-sm p-2.5">
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
                <button className="btn btn-danger" disabled={busy} onClick={() => cancel(l)}>下架</button>
              ) : (
                <button className="btn" disabled={busy || s.stones < l.qty * l.price} onClick={() => buy(l)}>購買</button>
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
    m.kind === "kill" ? (s.kills[m.targetId] ?? 0) - s.missionBase : s.inventory[m.targetId] ?? 0;

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
            <button className="btn" disabled={busy} onClick={() => act("completeMission")}>繳令覆命</button>
            <button className="btn btn-danger" disabled={busy} onClick={() => act("abandonMission")}>放棄任務</button>
          </div>
        </div>
      ) : (
        <p className="text-xs text-faded">執事堂告示欄上貼著數張任務令,同一時間僅可領取一件。</p>
      )}
      <div className="divider">告 示 欄</div>
      {MISSIONS.map((m) => {
        const locked = realm.stage < m.reqStage;
        const target = m.kind === "kill" ? MONSTERS.find((x) => x.id === m.targetId)!.name : itemById(m.targetId).name;
        return (
          <div key={m.id} className={`border border-faded/20 rounded-sm p-3 ${locked ? "opacity-45" : ""}`}>
            <div className="flex items-baseline justify-between">
              <span className="font-bold">
                {m.name}
                <span className="chip ml-2">{m.kind === "kill" ? "獵殺" : "繳納"} {target} ×{m.n}</span>
              </span>
              <span className="text-xs font-mono text-gold">{m.stones} 靈石 · 修為 {m.exp}</span>
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
              {locked ? "境界不足" : "領取"}
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
        <div key={mon.id} className={`border rounded-sm p-3 opacity-40 ${mon.isLord ? "border-fuchsia-400/20" : "border-faded/15"}`}>
          <span className="font-bold text-faded">???</span>
          <p className="text-xs text-faded/60 mt-1">{mon.isLord ? "傳說中的地域之王,尚未現身。" : "尚未遭遇的妖獸,蹤跡成謎。"}</p>
        </div>
      );
    return (
      <div key={mon.id} className={`border rounded-sm p-3 ${mon.isLord ? "border-fuchsia-400/40 bg-fuchsia-400/5" : "border-faded/20"}`}>
        <div className="flex items-baseline justify-between">
          <span className="font-bold">
            {mon.isLord && <span className="chip mr-2 text-fuchsia-400 border-fuchsia-400/50">地域王</span>}
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
        地域王極為稀有,獵殺妖獸時約 2%~3% 機率遭遇。已遇 {s.lordsSeen?.length ?? 0}/{lords.length} 位,斬之或得增元丹、增靈珠等奇珍。其中太上金仙唯有「雲遊四海」時萬中之一得見。
      </p>
      {lords.map(monsterRow)}
    </div>
  );
}

interface RankPlayer {
  name: string;
  realm_idx: number;
  exp: number;
  dead: boolean;
}

function RankTab() {
  const s = useGame((x) => x.save)!;
  const [players, setPlayers] = useState<RankPlayer[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    setLoading(true);
    try {
      const j = await (await fetch("/api/ranking")).json();
      setPlayers(j.players ?? []);
    } catch { /* ignore */ }
    setLoading(false);
  };
  useEffect(() => { refresh(); }, []);

  const myRank = players.findIndex((p) => p.name === s.name) + 1;

  return (
    <div className="space-y-2">
      <p className="text-xs text-faded">
        天下修仙榜——全服修士同榜競逐,按境界高低、修為深淺排序。
        {myRank > 0 && <>你當前名列第<span className="text-gold"> {myRank} </span>位。</>}
        <button className="chip ml-3 hover:text-gold" onClick={refresh}>刷新</button>
      </p>
      {loading && <p className="text-sm text-faded">榜文更新中…</p>}
      {!loading && players.length === 0 && <p className="text-sm text-faded">榜上無人,你將是第一位留名者。</p>}
      {players.map((p, i) => {
        const me = p.name === s.name;
        return (
          <div
            key={p.name + i}
            className={`flex items-center justify-between border rounded-sm p-2.5 ${
              me ? "border-gold/60 bg-gold/10" : "border-faded/20"
            }`}
          >
            <div className="flex items-baseline gap-3 min-w-0">
              <span className={`font-mono text-sm w-6 text-right shrink-0 ${i < 3 ? "text-gold" : "text-faded"}`}>
                {i + 1}
              </span>
              <div className="min-w-0">
                <span className={`font-bold ${me ? "text-gold" : ""}`}>{p.name}</span>
                {me && <span className="text-xs text-gold/70 ml-2">(你)</span>}
                {p.dead && <span className="chip ml-2 text-vermillion border-vermillion/50">已隕落</span>}
              </div>
            </div>
            <span className="text-sm text-cream shrink-0 ml-3">
              {REALMS[p.realm_idx]?.name ?? "??"}
              <span className="text-xs text-faded ml-2 font-mono">修為 {p.exp}</span>
            </span>
          </div>
        );
      })}
    </div>
  );
}

interface XianPlayer {
  name: string;
  realm_idx: number;
  xianli: number;
  dead: boolean;
}

function XianRankTab() {
  const s = useGame((x) => x.save)!;
  const [players, setPlayers] = useState<XianPlayer[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    setLoading(true);
    try {
      const j = await (await fetch("/api/ranking?type=xian")).json();
      setPlayers(j.players ?? []);
    } catch { /* ignore */ }
    setLoading(false);
  };
  useEffect(() => { refresh(); }, []);

  const myRank = players.findIndex((p) => p.name === s.name) + 1;

  return (
    <div className="space-y-2">
      <p className="text-xs text-faded">
        <span className="text-fuchsia-400 font-bold">真仙榜</span>——唯有白日飛昇的真仙方能登榜,按仙靈力高低排序。仙靈力一點即一倍攻擊,極難獲得。
        {myRank > 0 && <>你當前名列第<span className="text-fuchsia-400"> {myRank} </span>位。</>}
        <button className="chip ml-3 hover:text-fuchsia-400" onClick={refresh}>刷新</button>
      </p>
      {loading && <p className="text-sm text-faded">仙榜更新中…</p>}
      {!loading && players.length === 0 && <p className="text-sm text-faded">仙界寂寥,尚無真仙留名。飛昇之後,煉化天仙丹與先天仙器,你將是第一位。</p>}
      {players.map((p, i) => {
        const me = p.name === s.name;
        return (
          <div
            key={p.name + i}
            className={`flex items-center justify-between border rounded-sm p-2.5 ${
              me ? "border-fuchsia-400/60 bg-fuchsia-400/10" : "border-faded/20"
            }`}
          >
            <div className="flex items-baseline gap-3 min-w-0">
              <span className={`font-mono text-sm w-6 text-right shrink-0 ${i < 3 ? "text-fuchsia-400" : "text-faded"}`}>
                {i + 1}
              </span>
              <div className="min-w-0">
                <span className={`font-bold ${me ? "text-fuchsia-400" : ""}`}>{p.name}</span>
                {me && <span className="text-xs text-fuchsia-400/70 ml-2">(你)</span>}
                {p.dead && <span className="chip ml-2 text-vermillion border-vermillion/50">已隕落</span>}
              </div>
            </div>
            <span className="text-sm shrink-0 ml-3">
              <span className="text-fuchsia-400 font-bold">仙靈力 {p.xianli}</span>
              <span className="text-xs text-faded ml-2 font-mono">{REALMS[p.realm_idx]?.name ?? "??"}</span>
            </span>
          </div>
        );
      })}
    </div>
  );
}
