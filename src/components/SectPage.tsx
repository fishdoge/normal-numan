"use client";

import { useEffect, useMemo, useState } from "react";
import { useGame, statsOf, SECT_STAGE_BONUS, sectDamageMultOfStages } from "@/game/store";
import { REALMS } from "@/game/data/realms";
import { SECTS } from "@/game/data/sects";
import { MONSTERS } from "@/game/data/world";
import { MISSIONS } from "@/game/data/missions";
import { itemById } from "@/game/data/items";
import { sectTierOf, SECT_TIER_REQ_LABEL, DWELLING_MAX_LEVEL } from "@/game/data/sectTiers";
import { ELEMENT_COLOR } from "@/game/types";
import StoneAmount from "./StoneAmount";

const SECT_STAGE_LABEL: Record<number, string> = {
  4: "元嬰期",
  5: "化神期",
  6: "煉虛期",
  7: "合體期",
  8: "大乘期",
  10: "真仙",
  11: "金仙",
  12: "太乙境",
};

interface SectMember {
  name: string;
  realm_idx: number;
  exp: number;
  dead: boolean;
  updated_at: string;
}

interface NextTierInfo {
  tier: number;
  name: string;
  memberCap: number;
  dwellingSlots: number;
  contribution: number;
  requireStage?: number;
  requireCount?: number;
  ready: boolean;
  blockedBy: string[];
  missingMaterials: { id: string; name: string; need: number; have: number }[];
}

interface DwellingRow {
  slotIdx: number;
  level: number;
  occupantName: string | null;
  nextLevel: { level: number; expPerHour: number; materials: { id: string; n: number }[] } | null;
}

interface OtherSect {
  id: string;
  name: string;
  element: string;
  tier: number;
  tierName: string;
  memberCap: number;
  memberCount: number;
  mult: number;
  members: { name: string; realm_idx: number }[];
}

export default function SectPage() {
  const s = useGame((x) => x.save)!;
  const setSave = useGame((x) => x.setSave);
  const setMainView = useGame((x) => x.setMainView);
  const act = useGame((x) => x.act);
  const busyAct = useGame((x) => x.busy);

  const [members, setMembers] = useState<SectMember[]>([]);
  const [items, setItems] = useState<Record<string, number>>({});
  const [tier, setTier] = useState(1);
  const [contribution, setContribution] = useState(0);
  const [dwellingSlots, setDwellingSlots] = useState(0);
  const [dwellings, setDwellings] = useState<DwellingRow[]>([]);
  const [myDwellingSlot, setMyDwellingSlot] = useState<number | null>(null);
  const [nextTier, setNextTier] = useState<NextTierInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [amount, setAmount] = useState(1000);
  const [itemId, setItemId] = useState("");
  const [itemQty, setItemQty] = useState(1);
  const [view, setView] = useState<"damage" | "members" | "warehouse" | "dwelling" | "mission" | "list">(
    "dwelling",
  );

  const [otherSects, setOtherSects] = useState<OtherSect[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  const sect = SECTS.find((x) => x.id === s.sectId);

  const stageCounts = useMemo(() => {
    const counts: Record<number, number> = {};
    for (const m of members) {
      const stage = REALMS[m.realm_idx]?.stage;
      if (stage != null) counts[stage] = (counts[stage] ?? 0) + 1;
    }
    return counts;
  }, [members]);
  const sectMult = useMemo(
    () => sectDamageMultOfStages(members.map((m) => REALMS[m.realm_idx]?.stage)),
    [members],
  );
  const curTier = sectTierOf(tier);

  const refresh = async () => {
    setLoading(true);
    try {
      const j = await (await fetch("/api/sect")).json();
      if (j.ok) {
        setMembers(j.members ?? []);
        setItems(j.items ?? {});
        setTier(j.tier ?? 1);
        setContribution(j.contribution ?? 0);
        setDwellingSlots(j.dwellingSlots ?? 0);
        setDwellings(j.dwellings ?? []);
        setMyDwellingSlot(j.myDwellingSlot ?? null);
        setNextTier(j.nextTier ?? null);
        setErr("");
      } else {
        setErr(j.error ?? "查詢失敗");
      }
    } catch {
      setErr("查詢失敗");
    }
    setLoading(false);
  };
  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refreshList = async () => {
    setListLoading(true);
    try {
      const j = await (await fetch("/api/sect?all=1")).json();
      if (j.ok) setOtherSects(j.sects ?? []);
    } catch {
      /* ignore */
    }
    setListLoading(false);
  };
  useEffect(() => {
    if (view === "list" && otherSects.length === 0) refreshList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view]);

  const reloadSave = async () => {
    try {
      const j = await (await fetch("/api/save")).json();
      if (j.save) setSave(j.save);
    } catch {
      /* ignore */
    }
  };

  const post = async (body: Record<string, unknown>) => {
    setBusy(true);
    try {
      const res = await fetch("/api/sect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const j = await res.json();
      setErr(res.ok ? "" : (j.error ?? "操作失敗"));
      await Promise.all([refresh(), reloadSave()]);
      return res.ok;
    } finally {
      setBusy(false);
    }
  };

  const myInventoryItems = Object.entries(s.inventory ?? {}).filter(([, n]) => n > 0);

  // 宗門任務
  const { realm } = statsOf(s);
  const activeMission = s.missionId ? MISSIONS.find((m) => m.id === s.missionId)! : null;
  const missionProgress = (m: (typeof MISSIONS)[number]) =>
    m.kind === "kill" ? (s.kills[m.targetId] ?? 0) - s.missionBase : (s.inventory[m.targetId] ?? 0);

  return (
    <main className="max-w-5xl mx-auto px-4 py-6">
      <div className="flex items-baseline justify-between mb-5">
        <div>
          <h1 className="text-2xl font-black tracking-[0.35em]">宗 門</h1>
          <p className="font-mono text-[10px] tracking-[0.4em] text-faded">SECT HALL</p>
        </div>
        <button className="btn" onClick={() => setMainView("game")}>
          ◂ 返回主頁
        </button>
      </div>

      <div className="panel deco-frame space-y-3">
        <div className="flex items-baseline justify-between flex-wrap gap-2">
          <p className="text-lg font-bold">
            <span className={ELEMENT_COLOR[(sect?.element ?? "金") as keyof typeof ELEMENT_COLOR]}>
              {sect?.name ?? "散修"}
            </span>
            <span className="chip ml-3 text-gold border-gold/40">{curTier.name}</span>
            <span className="chip ml-2 text-faded/80 border-faded/30">
              {members.length}/{curTier.memberCap} 人
            </span>
          </p>
          <button className="chip hover:text-gold" onClick={refresh}>
            刷新
          </button>
        </div>
        <p className="text-xs text-faded">
          宗門聲勢隨在世高階同門人數增長,越多元嬰以上同門在世,全宗門戰鬥傷害越高。
          目前宗門加成:<span className="text-fuchsia-300 font-bold">戰鬥傷害 ×{sectMult.toFixed(2)}</span>
        </p>

        {/* 貢獻靈石 + 宗門等級晉升 */}
        <div className="border border-gold/40 bg-gold/5 rounded-sm p-3">
          <div className="flex items-baseline justify-between flex-wrap gap-2">
            <span className="font-bold text-gold">貢獻靈石(不可取回)</span>
            <span className="text-sm font-mono text-gold">
              <StoneAmount n={contribution} /> {nextTier && <>/ <StoneAmount n={nextTier.contribution} /></>}
            </span>
          </div>
          <p className="text-xs text-faded mt-1">
            貢獻的靈石歸宗門所有、不可提領,唯一用途是累積晉升下一等級所需的門檻。現有靈石:
            <span className="text-gold">
              <StoneAmount n={s.stones} />
            </span>
          </p>
          <div className="mt-2 flex flex-wrap gap-2 items-center">
            <input
              type="number"
              min={1}
              value={amount}
              onChange={(e) => setAmount(Math.max(1, +e.target.value || 1))}
              className="w-32 bg-smoke border border-faded/30 rounded-sm px-2 py-1.5 text-sm text-parchment"
            />
            <button className="btn" disabled={busy} onClick={() => post({ action: "contribute", amount })}>
              貢獻
            </button>
          </div>

          {nextTier ? (
            <>
              <div className="stat-bar mt-3">
                <div
                  className="h-full bg-gold/70"
                  style={{
                    width: `${Math.max(0, Math.min(100, (contribution / nextTier.contribution) * 100))}%`,
                  }}
                />
              </div>
              <p className="text-xs text-faded mt-2">
                下一階:<span className="text-cream">{nextTier.name}</span>(名額上限 {nextTier.memberCap}
                人,仙境 {nextTier.dwellingSlots} 位)
                {nextTier.requireStage && nextTier.requireCount && (
                  <>
                    ,需同門中至少 {nextTier.requireCount} 人達到
                    <span className="text-fuchsia-300">
                      {SECT_TIER_REQ_LABEL[nextTier.requireStage] ?? `境界${nextTier.requireStage}`}
                    </span>
                  </>
                )}
              </p>
              {nextTier.missingMaterials.length > 0 && (
                <p className="text-xs text-vermillion mt-1">
                  倉庫尚缺:
                  {nextTier.missingMaterials
                    .map((m) => `${m.name} ${m.have}/${m.need}`)
                    .join("、")}
                  (存入宗門倉庫,見下方「宗門倉庫」分頁)
                </p>
              )}
              <button
                className="btn mt-2"
                disabled={busy || !nextTier.ready}
                onClick={() => post({ action: "upgradeTier" })}
                title={nextTier.blockedBy.join("、") || "晉升宗門等級"}
              >
                晉升【{nextTier.name}】{nextTier.blockedBy.length > 0 ? `(${nextTier.blockedBy.join("、")})` : ""}
              </button>
            </>
          ) : (
            <p className="text-xs text-faded mt-2">已臻宗門最高等級【{curTier.name}】。</p>
          )}
        </div>

        {err && <p className="text-sm text-vermillion">{err}</p>}

        {/* 分頁 */}
        <div className="flex gap-1.5 flex-wrap">
          {(
            [
              ["dwelling", "宗門仙境"],
              ["mission", "宗門任務"],
              ["damage", "傷害加成來源"],
              ["members", "同門名錄"],
              ["warehouse", "宗門倉庫"],
              ["list", "宗門列表"],
            ] as [typeof view, string][]
          ).map(([v, label]) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-2.5 py-1 text-xs rounded-sm border transition-colors ${
                view === v
                  ? "border-fuchsia-400 bg-fuchsia-400/15 text-fuchsia-300"
                  : "border-faded/30 text-faded hover:text-cream"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {loading && <p className="text-sm text-faded">查詢中…</p>}

        {!loading && view === "dwelling" && (
          <div className="space-y-2">
            <p className="text-xs text-faded">
              宗門仙境:可將角色停泊於此靜心潛修,每小時真實時間緩慢增長修為,離線亦持續累積。位置數僅與宗門等級有關(目前
              {dwellingSlots} 位),各位置等級則需消耗宗門倉庫素材個別升級,任何同門皆可出資。
            </p>
            {myDwellingSlot != null && (
              <button
                className="btn btn-danger"
                disabled={busy}
                onClick={() => post({ action: "leaveDwelling" })}
              >
                離開仙境(第 {myDwellingSlot + 1} 位)
              </button>
            )}
            <div className="grid gap-2 sm:grid-cols-2">
              {dwellings.map((d) => {
                const mine = myDwellingSlot === d.slotIdx;
                const occupied = !!d.occupantName;
                return (
                  <div
                    key={d.slotIdx}
                    className={`border rounded-sm p-2.5 ${
                      mine
                        ? "border-gold/60 bg-gold/10"
                        : occupied
                          ? "border-faded/25"
                          : "border-fuchsia-400/30 bg-fuchsia-400/5"
                    }`}
                  >
                    <div className="flex items-baseline justify-between">
                      <span className="font-bold">
                        第 {d.slotIdx + 1} 位
                        <span className="chip ml-2 text-gold border-gold/40">Lv.{d.level}</span>
                      </span>
                      {mine && <span className="chip text-gold border-gold/50">你</span>}
                    </div>
                    <p className="text-xs text-faded mt-1">
                      {occupied ? `停泊中:${d.occupantName}` : "空位"}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {!occupied && myDwellingSlot == null && (
                        <button
                          className="chip hover:text-gold"
                          disabled={busy}
                          onClick={() => post({ action: "assignDwelling", slotIdx: d.slotIdx })}
                        >
                          停泊於此
                        </button>
                      )}
                      {d.nextLevel && (
                        <button
                          className="chip hover:text-gold"
                          disabled={busy}
                          onClick={() => post({ action: "upgradeDwelling", slotIdx: d.slotIdx })}
                          title={d.nextLevel.materials
                            .map((m) => `${itemById(m.id)?.name ?? m.id} ${items[m.id] ?? 0}/${m.n}`)
                            .join("、")}
                        >
                          升級至 Lv.{d.nextLevel.level}(修為+{d.nextLevel.expPerHour}/時)
                        </button>
                      )}
                      {!d.nextLevel && (
                        <span className="text-xs text-faded">已臻最高等級(Lv.{DWELLING_MAX_LEVEL})</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {!loading && view === "mission" && (
          <div className="space-y-3">
            {activeMission ? (
              <div className="border border-gold/40 bg-gold/5 rounded-sm p-3">
                <div className="flex items-baseline justify-between">
                  <span className="font-bold text-gold">{activeMission.name}</span>
                  <span className="text-xs font-mono text-faded">
                    進度 {Math.min(missionProgress(activeMission), activeMission.n)}/{activeMission.n}
                  </span>
                </div>
                <p className="text-sm text-faded mt-1">{activeMission.desc}</p>
                <div className="mt-2 flex gap-2">
                  <button className="btn" disabled={busyAct} onClick={() => act("completeMission")}>
                    繳令覆命
                  </button>
                  <button
                    className="btn btn-danger"
                    disabled={busyAct}
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
                        {m.kind === "kill" ? "獵殺" : "繳納"} {target} ×{m.n}
                      </span>
                    </span>
                    <span className="text-xs font-mono text-gold">
                      {m.stones} 靈石 · 修為 {m.exp}
                    </span>
                  </div>
                  <p className="text-xs text-faded mt-1">
                    {m.desc}
                    {m.item && <span className="text-cream"> 另賜:{itemById(m.item).name}</span>}
                  </p>
                  <button
                    className="btn mt-2"
                    disabled={busyAct || locked || !!s.missionId}
                    onClick={() => act("acceptMission", { missionId: m.id })}
                  >
                    {locked ? "境界不足" : "領取"}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {!loading && view === "damage" && (
          <div className="space-y-2">
            <div className="border border-fuchsia-400/30 bg-fuchsia-400/5 rounded-sm p-3">
              <div className="flex items-baseline justify-between">
                <span className="font-bold text-fuchsia-300">宗門總加成</span>
                <span className="text-sm font-mono text-fuchsia-300">
                  戰鬥傷害 ×{sectMult.toFixed(2)}
                </span>
              </div>
              <p className="text-xs text-faded mt-1">
                基準倍率 ×1.00,依下列各境界在世同門人數逐一疊加。
              </p>
            </div>
            {Object.entries(SECT_STAGE_BONUS)
              .map(([stage, bonus]) => [Number(stage), bonus] as [number, number])
              .sort((a, b) => a[0] - b[0])
              .map(([stage, bonus]) => {
                const n = stageCounts[stage] ?? 0;
                const subtotal = n * bonus;
                return (
                  <div
                    key={stage}
                    className={`flex items-center justify-between border rounded-sm p-2.5 ${
                      n > 0 ? "border-fuchsia-400/30" : "border-faded/15 opacity-60"
                    }`}
                  >
                    <span className="font-bold">
                      {SECT_STAGE_LABEL[stage] ?? `境界${stage}`}
                      <span className="chip ml-2 text-faded/80 border-faded/30">
                        每人 +{Math.round(bonus * 100)}%
                      </span>
                    </span>
                    <span className="text-sm font-mono text-cream shrink-0 ml-3">
                      {n} 人 <span className="text-fuchsia-300 ml-2">+{Math.round(subtotal * 100)}%</span>
                    </span>
                  </div>
                );
              })}
          </div>
        )}

        {!loading && view === "members" && (
          <div className="space-y-2">
            {members.length === 0 && !err && (
              <p className="text-sm text-faded">宗門暫無其他在冊同門。</p>
            )}
            {members.map((m, i) => {
              const me = m.name === s.name;
              const isXian = REALMS[m.realm_idx]?.stage >= 10;
              return (
                <div
                  key={m.name + i}
                  className={`flex items-center justify-between border rounded-sm p-2.5 ${
                    me ? "border-gold/60 bg-gold/10" : "border-faded/20"
                  }`}
                >
                  <div className="min-w-0">
                    <span className={`font-bold ${isXian ? "text-fuchsia-300" : ""}`}>{m.name}</span>
                    {me && <span className="chip ml-2 text-gold border-gold/50">你</span>}
                    {m.dead && (
                      <span className="chip ml-2 text-vermillion border-vermillion/50">已隕落</span>
                    )}
                  </div>
                  <span className="text-sm text-cream shrink-0 ml-3">
                    {REALMS[m.realm_idx]?.name ?? "??"}
                    <span className="text-xs text-faded ml-2">修為 {m.exp}</span>
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {!loading && view === "warehouse" && (
          <div className="space-y-3">
            <div className="border border-faded/25 rounded-sm p-3">
              <p className="font-bold mb-2">宗門物品倉庫</p>
              <p className="text-xs text-faded mb-2">
                存入的道具歸全宗門共用,任何同門都能直接提領使用;素材類存於此處亦是宗門晉升等級與仙境升級的消耗來源。
              </p>
              <div className="flex flex-wrap gap-2 items-center mb-2">
                <select
                  value={itemId}
                  onChange={(e) => setItemId(e.target.value)}
                  className="bg-smoke border border-faded/30 rounded-sm px-2 py-1.5 text-sm text-parchment"
                >
                  <option value="">選擇物品…</option>
                  {myInventoryItems.map(([id, n]) => (
                    <option key={id} value={id}>
                      {itemById(id)?.name ?? id} × {n}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  min={1}
                  value={itemQty}
                  onChange={(e) => setItemQty(Math.max(1, +e.target.value || 1))}
                  className="w-24 bg-smoke border border-faded/30 rounded-sm px-2 py-1.5 text-sm text-parchment"
                />
                <button
                  className="btn"
                  disabled={busy || !itemId}
                  onClick={() => post({ action: "depositItem", itemId, qty: itemQty })}
                >
                  存入倉庫
                </button>
              </div>

              {Object.entries(items).filter(([, n]) => n > 0).length === 0 ? (
                <p className="text-sm text-faded">倉庫暫無物品。</p>
              ) : (
                <div className="space-y-1.5">
                  {Object.entries(items)
                    .filter(([, n]) => n > 0)
                    .map(([id, n]) => (
                      <div
                        key={id}
                        className="flex items-center justify-between border border-faded/20 rounded-sm p-2"
                      >
                        <span>
                          {itemById(id)?.name ?? id}
                          <span className="chip ml-2 text-faded/80 border-faded/30">× {n}</span>
                        </span>
                        <button
                          className="chip hover:text-gold"
                          disabled={busy}
                          onClick={() => post({ action: "withdrawItem", itemId: id, qty: 1 })}
                        >
                          提領一件
                        </button>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        )}

        {view === "list" && (
          <div className="space-y-2">
            {listLoading && <p className="text-sm text-faded">查詢中…</p>}
            {!listLoading &&
              otherSects.map((os) => (
                <div key={os.id} className="border border-faded/20 rounded-sm p-2.5">
                  <button
                    className="w-full flex items-center justify-between"
                    onClick={() => setExpanded(expanded === os.id ? null : os.id)}
                  >
                    <span className="font-bold">
                      <span className={ELEMENT_COLOR[os.element as keyof typeof ELEMENT_COLOR]}>
                        {os.name}
                      </span>
                      {os.id === s.sectId && (
                        <span className="chip ml-2 text-gold border-gold/50">本門</span>
                      )}
                      <span className="chip ml-2 text-gold border-gold/40">{os.tierName}</span>
                    </span>
                    <span className="text-sm font-mono text-cream shrink-0 ml-3">
                      {os.memberCount}/{os.memberCap} 人
                      <span className="text-fuchsia-300 ml-2">×{os.mult.toFixed(2)}</span>
                    </span>
                  </button>
                  {expanded === os.id && (
                    <div className="mt-2 space-y-1 border-t border-faded/15 pt-2">
                      {os.members.length === 0 && (
                        <p className="text-xs text-faded">暫無在冊同門。</p>
                      )}
                      {os.members.map((m, i) => (
                        <div key={m.name + i} className="flex items-center justify-between text-sm">
                          <span>{m.name}</span>
                          <span className="text-faded text-xs">{REALMS[m.realm_idx]?.name ?? "??"}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
          </div>
        )}
      </div>
    </main>
  );
}
