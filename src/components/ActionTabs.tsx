"use client";

import { useState } from "react";
import { useGame, playerStats } from "@/game/store";
import { LOCATIONS, MONSTERS, RECIPES, REGIONS } from "@/game/data/world";
import { ITEMS, itemById } from "@/game/data/items";
import { MISSIONS } from "@/game/data/missions";
import { RANK_NPCS } from "@/game/data/ranking";
import { REALMS } from "@/game/data/realms";
import { techById } from "@/game/data/techniques";
import { ELEMENT_COLOR } from "@/game/types";

type Tab = "explore" | "bag" | "tech" | "craft" | "market" | "mission" | "dex" | "rank";

export default function ActionTabs() {
  const [tab, setTab] = useState<Tab>("explore");
  const tabs: [Tab, string][] = [
    ["explore", "遊歷探索"],
    ["bag", "儲物袋"],
    ["tech", "仙法"],
    ["craft", "煉器"],
    ["market", "坊市"],
    ["mission", "宗門任務"],
    ["dex", "妖獸圖鑑"],
    ["rank", "修仙榜"],
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
      {tab === "mission" && <MissionTab />}
      {tab === "dex" && <DexTab />}
      {tab === "rank" && <RankTab />}
    </div>
  );
}

function ExploreTab() {
  const s = useGame();
  const { realm } = playerStats(s as never);
  const inCombat = !!s.combat;
  const [regionId, setRegionId] = useState("tiannan");
  const region = REGIONS.find((r) => r.id === regionId)!;
  const locs = LOCATIONS.filter((l) => l.region === regionId);

  return (
    <div className="space-y-3">
      <div className="flex gap-2 mb-2">
        <button className="btn" disabled={inCombat || s.cultToday >= 3} onClick={s.cultivate}>
          打坐修煉 {s.cultToday}/3
        </button>
        <button className="btn" disabled={inCombat} onClick={s.restDay}>調息一日(-10載)</button>
        <button className="btn" disabled={inCombat} onClick={s.breakthrough}>嘗試突破</button>
      </div>
      <div className="divider">大 陸 遊 歷</div>
      <div className="flex flex-wrap gap-1.5">
        {REGIONS.map((r) => {
          const rLocked = realm.stage < r.reqStage;
          return (
            <button
              key={r.id}
              onClick={() => !rLocked && setRegionId(r.id)}
              title={rLocked ? `需 ${r.reqStage} 階境界` : r.desc}
              className={`px-2.5 py-1 text-xs rounded-sm border transition-colors ${
                regionId === r.id
                  ? "border-gold bg-gold/15 text-gold"
                  : rLocked
                  ? "border-faded/15 text-faded/40 cursor-not-allowed"
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
              <button className="btn" disabled={locked || inCombat} onClick={() => s.gather(loc.id)}>
                採集靈材
              </button>
              <button className="btn btn-danger" disabled={locked || inCombat} onClick={() => s.startHunt(loc.id)}>
                獵殺妖獸
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function BagTab() {
  const s = useGame();
  const entries = Object.entries(s.inventory);
  if (entries.length === 0) return <p className="text-faded text-sm">儲物袋空空如也。</p>;
  return (
    <div className="space-y-2">
      {entries.map(([id, n]) => {
        const item = itemById(id);
        const equipped = s.equippedWeapon === id || s.equippedArmor === id;
        return (
          <div key={id} className="flex items-center justify-between border border-faded/20 rounded-sm p-2.5">
            <div className="min-w-0">
              <span className="font-bold">
                {item.name} <span className="text-faded font-normal">×{n}</span>
                {item.element && <span className={`chip ml-2 ${ELEMENT_COLOR[item.element]}`}>{item.element}</span>}
                {equipped && <span className="chip ml-2 text-gold border-gold/50">已裝備</span>}
              </span>
              <p className="text-xs text-faded truncate">{item.desc}</p>
            </div>
            <div className="flex gap-1.5 shrink-0 ml-3">
              {(item.kind === "pill" || item.kind === "herb") && (
                <button className="btn" onClick={() => s.useItem(id)}>服用</button>
              )}
              {item.kind === "manual" && (
                <button className="btn" onClick={() => s.useItem(id)}>參悟</button>
              )}
              {(item.kind === "artifact" || item.kind === "treasure") && !equipped && (
                <button className="btn" onClick={() => s.equip(id)}>裝備</button>
              )}
              <button className="btn btn-danger" onClick={() => s.sellItem(id)}>
                售 {Math.max(1, Math.floor(item.price * 0.6))}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function TechTab() {
  const s = useGame();
  if (s.learned.length === 0) return <p className="text-faded text-sm">尚未習得任何仙法。</p>;
  return (
    <div className="space-y-2">
      {s.learned.map((id) => {
        const t = techById(id);
        return (
          <div key={id} className="border border-faded/20 rounded-sm p-3">
            <div className="flex items-baseline justify-between">
              <span className="font-bold">
                <span className={`mr-2 ${ELEMENT_COLOR[t.element]}`}>【{t.element}】</span>
                {t.name}
              </span>
              <span className="text-xs text-faded font-mono">
                威力 ×{t.power} · 仙靈力 {t.mpCost}
              </span>
            </div>
            <p className="text-sm text-faded mt-1">{t.desc}</p>
          </div>
        );
      })}
      <p className="text-xs text-faded/60 mt-2">仙法秘笈可於探索中尋獲,或在坊市購買後於儲物袋參悟。</p>
    </div>
  );
}

function CraftTab() {
  const s = useGame();
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
                {rec.stones} 靈石
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
            <button className="btn mt-2" disabled={!canStones || !canMats} onClick={() => s.craft(rec.id)}>
              煉製
            </button>
          </div>
        );
      })}
    </div>
  );
}

function MarketTab() {
  const s = useGame();
  const wares = ITEMS.filter((i) => ["pill", "herb", "manual", "treasure"].includes(i.kind) && !i.life);
  return (
    <div className="space-y-2">
      <p className="text-xs text-faded">
        坊市魚龍混雜,丹藥、仙草、秘笈、護身之寶皆有販售。現有靈石:
        <span className="text-gold"> {s.stones}</span>
      </p>
      {wares.map((item) => (
        <div key={item.id} className="flex items-center justify-between border border-faded/20 rounded-sm p-2.5">
          <div className="min-w-0">
            <span className="font-bold">{item.name}</span>
            <p className="text-xs text-faded truncate">{item.desc}</p>
          </div>
          <button
            className="btn shrink-0 ml-3"
            disabled={s.stones < item.price}
            onClick={() => s.buyItem(item.id)}
          >
            {item.price} 靈石
          </button>
        </div>
      ))}
    </div>
  );
}

function MissionTab() {
  const s = useGame();
  const { realm } = playerStats(s as never);
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
            <button className="btn" onClick={s.completeMission}>繳令覆命</button>
            <button className="btn btn-danger" onClick={s.abandonMission}>放棄任務</button>
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
              disabled={locked || !!s.missionId}
              onClick={() => s.acceptMission(m.id)}
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
  const s = useGame();
  return (
    <div className="space-y-2">
      <p className="text-xs text-faded">
        已目擊 {s.seen.length}/{MONSTERS.length} 種妖獸。遭遇即錄入圖鑑。
      </p>
      {MONSTERS.map((mon) => {
        const seen = s.seen.includes(mon.id);
        const kills = s.kills[mon.id] ?? 0;
        if (!seen)
          return (
            <div key={mon.id} className="border border-faded/15 rounded-sm p-3 opacity-40">
              <span className="font-bold text-faded">???</span>
              <p className="text-xs text-faded/60 mt-1">尚未遭遇的妖獸,蹤跡成謎。</p>
            </div>
          );
        return (
          <div key={mon.id} className="border border-faded/20 rounded-sm p-3">
            <div className="flex items-baseline justify-between">
              <span className="font-bold">
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
      })}
    </div>
  );
}

function RankTab() {
  const s = useGame();
  // 同小境界時,修為(exp)高者居前;NPC 視為該境界修為 50%
  const entries = [
    ...RANK_NPCS.map((n) => ({
      name: n.name, title: n.title, realmIdx: n.realmIdx,
      exp: Math.floor(REALMS[n.realmIdx].expNeed * 0.5), me: false,
    })),
    {
      name: s.name, title: "(你)", realmIdx: s.realmIdx, exp: s.exp, me: true,
    },
  ].sort((a, b) => b.realmIdx - a.realmIdx || b.exp - a.exp);

  const myRank = entries.findIndex((e) => e.me) + 1;

  return (
    <div className="space-y-2">
      <p className="text-xs text-faded">
        天南修仙界風傳的《修仙榜》,錄天下強者。你當前名列第
        <span className="text-gold"> {myRank} </span>位。
      </p>
      {entries.map((e, i) => (
        <div
          key={e.name + i}
          className={`flex items-center justify-between border rounded-sm p-2.5 ${
            e.me ? "border-gold/60 bg-gold/10" : "border-faded/20"
          }`}
        >
          <div className="flex items-baseline gap-3 min-w-0">
            <span className={`font-mono text-sm w-6 text-right shrink-0 ${i < 3 ? "text-gold" : "text-faded"}`}>
              {i + 1}
            </span>
            <div className="min-w-0">
              <span className={`font-bold ${e.me ? "text-gold" : ""}`}>{e.name}</span>
              <span className="text-xs text-faded ml-2">{e.title}</span>
            </div>
          </div>
          <span className="text-sm text-cream shrink-0 ml-3">{REALMS[e.realmIdx].name}</span>
        </div>
      ))}
      <p className="text-xs text-faded/60">榜上人物境界為定數,唯有你仍在攀登——超越韓立,便是天下第一。</p>
    </div>
  );
}
