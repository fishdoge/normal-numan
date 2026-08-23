"use client";

import { useEffect, useMemo, useState } from "react";
import { useGame, statsOf, SECT_STAGE_BONUS, sectDamageMultOfStages } from "@/game/store";
import { REALMS } from "@/game/data/realms";
import { SECTS } from "@/game/data/sects";
import { MONSTERS } from "@/game/data/world";
import { MISSIONS } from "@/game/data/missions";
import { itemById } from "@/game/data/items";
import { sectTierOf, SECT_TIER_REQ_LABEL, DWELLING_MAX_LEVEL } from "@/game/data/sectTiers";
import { ITEM_SECTIONS } from "@/game/data/itemSections";
import { ELEMENT_COLOR, isXianItem, XIAN_ITEM_COLOR, nameColorOf } from "@/game/types";
import { useT } from "@/i18n/useT";
import { itemDisplayName } from "@/i18n/itemText";
import { monsterDisplayName } from "@/i18n/monsterText";
import { realmDisplayName } from "@/i18n/realmText";
import {
  sectDisplayName,
  sectTierDisplayName,
  sectTierReqLabel,
  missionDisplayName,
  missionDisplayDesc,
} from "@/i18n/sectText";
import { stageLabel } from "@/i18n/realmText";
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
  const t = useT();
  const lang = useGame((x) => x.language);

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

  // 已隕落的同門不參與傷害加成(與伺服器戰鬥當下的實際套用邏輯一致),兩處計算皆須排除
  const livingMembers = useMemo(() => members.filter((m) => !m.dead), [members]);
  const stageCounts = useMemo(() => {
    const counts: Record<number, number> = {};
    for (const m of livingMembers) {
      const stage = REALMS[m.realm_idx]?.stage;
      if (stage != null) counts[stage] = (counts[stage] ?? 0) + 1;
    }
    return counts;
  }, [livingMembers]);
  const sectMult = useMemo(
    () => sectDamageMultOfStages(livingMembers.map((m) => REALMS[m.realm_idx]?.stage)),
    [livingMembers],
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
        setErr(j.error ?? t("sectLookupFailed"));
      }
    } catch {
      setErr(t("sectLookupFailed"));
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
      setErr(res.ok ? "" : (j.error ?? t("sectActionFailed")));
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

  // 貢獻靈石 + 宗門等級晉升(併入「宗門任務」分頁內)
  const contributeSection = (
    <div className="border border-gold/40 bg-gold/5 rounded-sm p-3">
      <div className="flex items-baseline justify-between flex-wrap gap-2">
        <span className="font-bold text-gold">{t("contributeTitle")}</span>
        <span className="text-sm font-mono text-gold">
          <StoneAmount n={contribution} /> {nextTier && <>/ <StoneAmount n={nextTier.contribution} /></>}
        </span>
      </div>
      <p className="text-sm text-faded mt-1">
        {t("contributeDesc")}
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
          {t("btnContribute")}
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
          <p className="text-sm text-faded mt-2">
            {t("nextTierLine")
              .replace("{name}", sectTierDisplayName(nextTier, lang))
              .replace("{cap}", String(nextTier.memberCap))
              .replace("{slots}", String(nextTier.dwellingSlots))}
            {nextTier.requireStage && nextTier.requireCount && (
              <>
                {t("nextTierReqLine").replace("{n}", String(nextTier.requireCount))}
                <span className="text-fuchsia-300">
                  {sectTierReqLabel(
                    nextTier.requireStage,
                    SECT_TIER_REQ_LABEL[nextTier.requireStage] ?? `境界${nextTier.requireStage}`,
                    lang,
                  )}
                </span>
              </>
            )}
          </p>
          {nextTier.missingMaterials.length > 0 && (
            <p className="text-sm text-vermillion mt-1">
              {t("warehouseMissing")}
              {nextTier.missingMaterials
                .map((m) => `${itemDisplayName({ id: m.id, name: m.name }, lang)} ${m.have}/${m.need}`)
                .join("、")}
              {t("warehouseMissingNote")}
            </p>
          )}
          <button
            className="btn mt-2"
            disabled={busy || !nextTier.ready}
            onClick={() => post({ action: "upgradeTier" })}
            title={nextTier.blockedBy.join("、") || t("upgradeTierTooltip")}
          >
            {t("btnUpgradeTier").replace("{name}", sectTierDisplayName(nextTier, lang))}
            {nextTier.blockedBy.length > 0 ? `(${nextTier.blockedBy.join("、")})` : ""}
          </button>
        </>
      ) : (
        <p className="text-sm text-faded mt-2">
          {t("maxTierReached").replace("{name}", sectTierDisplayName(curTier, lang))}
        </p>
      )}
    </div>
  );

  return (
    <main className="max-w-5xl mx-auto px-4 py-6">
      <div className="flex items-baseline justify-between mb-5">
        <div>
          <h1 className="text-2xl font-black tracking-[0.35em]">{t("sectTitle")}</h1>
          <p className="font-mono text-[10px] tracking-[0.4em] text-faded">SECT HALL</p>
        </div>
        <button className="btn" onClick={() => setMainView("game")}>
          {t("sectBack")}
        </button>
      </div>

      <div className="panel deco-frame space-y-3">
        <div className="flex items-baseline justify-between flex-wrap gap-2">
          <p className="text-lg font-bold">
            <span className={ELEMENT_COLOR[(sect?.element ?? "金") as keyof typeof ELEMENT_COLOR]}>
              {sect ? sectDisplayName(sect, lang) : t("statLoose")}
            </span>
            <span className="chip ml-3 text-gold border-gold/40">{sectTierDisplayName(curTier, lang)}</span>
            <span className="chip ml-2 text-faded/80 border-faded/30">
              {t("sectPeopleCount")
                .replace("{count}", String(members.length))
                .replace("{cap}", String(curTier.memberCap))}
            </span>
          </p>
          <button className="chip hover:text-gold py-1.5 px-2.5" onClick={refresh}>
            {t("btnRefresh")}
          </button>
        </div>
        <p className="text-sm text-faded">
          {t("sectDamageNote")}
          <span className="text-fuchsia-300 font-bold">{t("combatDamage")} ×{sectMult.toFixed(2)}</span>
        </p>

        {err && <p className="text-sm text-vermillion">{err}</p>}

        {/* 分頁 */}
        <div className="flex gap-1.5 flex-wrap">
          {(
            [
              ["dwelling", t("sectTabDwelling")],
              ["mission", t("sectTabMission")],
              ["damage", t("sectTabDamage")],
              ["members", t("sectTabMembers")],
              ["warehouse", t("sectTabWarehouse")],
              ["list", t("sectTabList")],
            ] as [typeof view, string][]
          ).map(([v, label]) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-2.5 py-1 text-sm rounded-sm border transition-colors ${
                view === v
                  ? "border-fuchsia-400 bg-fuchsia-400/15 text-fuchsia-300"
                  : "border-faded/30 text-faded hover:text-cream"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {loading && <p className="text-sm text-faded">{t("querying")}</p>}

        {!loading && view === "dwelling" && (
          <div className="space-y-2">
            <p className="text-sm text-faded">{t("dwellingIntro").replace("{n}", String(dwellingSlots))}</p>
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
                        {t("dwellingSlotLabel").replace("{n}", String(d.slotIdx + 1))}
                        <span className="chip ml-2 text-gold border-gold/40">Lv.{d.level}</span>
                      </span>
                      {mine && <span className="chip text-gold border-gold/50">{t("youTag2")}</span>}
                    </div>
                    <p className="text-sm text-faded mt-1">
                      {occupied ? t("dwellingOccupied").replace("{name}", d.occupantName!) : t("dwellingVacant")}
                    </p>
                    {/* 進駐/離開:僅與「我自己是否停泊於這個位置」有關 */}
                    <div className="mt-2 flex flex-wrap gap-2">
                      {!occupied && myDwellingSlot == null && (
                        <button
                          className="chip hover:text-gold py-1.5 px-2.5"
                          disabled={busy}
                          onClick={() => post({ action: "assignDwelling", slotIdx: d.slotIdx })}
                        >
                          {t("btnDwellHere")}
                        </button>
                      )}
                      {mine && (
                        <button
                          className="chip hover:text-vermillion border-vermillion/40 text-vermillion py-1.5 px-2.5"
                          disabled={busy}
                          onClick={() => post({ action: "leaveDwelling" })}
                        >
                          {t("btnLeaveDwelling").replace("{n}", String(d.slotIdx + 1))}
                        </button>
                      )}
                    </div>
                    {/* 升級:與是否停泊無關,任何同門皆可出資,故獨立一區並清楚註明,避免看起來像是「進駐者」專屬操作 */}
                    {d.nextLevel ? (
                      <div className="mt-2 pt-2 border-t border-faded/15 flex flex-wrap items-center justify-between gap-2">
                        <span className="text-xs text-faded/80">{t("dwellingUpgradeFundNote")}</span>
                        <button
                          className="chip hover:text-azure border-azure/40 text-azure py-1.5 px-2.5"
                          disabled={busy}
                          onClick={() => post({ action: "upgradeDwelling", slotIdx: d.slotIdx })}
                          title={d.nextLevel.materials
                            .map((m) => {
                              const it = itemById(m.id);
                              return `${it ? itemDisplayName(it, lang) : m.id} ${items[m.id] ?? 0}/${m.n}`;
                            })
                            .join("、")}
                        >
                          {t("btnUpgradeDwelling")
                            .replace("{lv}", String(d.nextLevel.level))
                            .replace("{exp}", String(d.nextLevel.expPerHour))}
                        </button>
                      </div>
                    ) : (
                      <p className="mt-2 pt-2 border-t border-faded/15 text-sm text-faded">
                        {t("dwellingMaxed").replace("{n}", String(DWELLING_MAX_LEVEL))}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {!loading && view === "mission" && (
          <div className="space-y-3">
            {contributeSection}

            <div className="divider">{t("stewardMissionsDivider")}</div>

            {activeMission ? (
              <div className="border border-gold/40 bg-gold/5 rounded-sm p-3">
                <div className="flex items-baseline justify-between">
                  <span className="font-bold text-gold">{missionDisplayName(activeMission, lang)}</span>
                  <span className="text-sm font-mono text-faded">
                    {t("missionProgress")
                      .replace("{cur}", String(Math.min(missionProgress(activeMission), activeMission.n)))
                      .replace("{max}", String(activeMission.n))}
                  </span>
                </div>
                <p className="text-sm text-faded mt-1">{missionDisplayDesc(activeMission, lang)}</p>
                <div className="mt-2 flex gap-2">
                  <button className="btn" disabled={busyAct} onClick={() => act("completeMission")}>
                    {t("btnCompleteMission")}
                  </button>
                  <button
                    className="btn btn-danger"
                    disabled={busyAct}
                    onClick={() => act("abandonMission")}
                  >
                    {t("btnAbandonMission")}
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-faded">{t("noActiveMission")}</p>
            )}
            <div className="divider">{t("noticeBoardDivider")}</div>
            {MISSIONS.map((m) => {
              const locked = realm.stage < m.reqStage;
              const target =
                m.kind === "kill"
                  ? monsterDisplayName(MONSTERS.find((x) => x.id === m.targetId)!, lang)
                  : itemDisplayName(itemById(m.targetId), lang);
              return (
                <div
                  key={m.id}
                  className={`border border-faded/20 rounded-sm p-3 ${locked ? "opacity-45" : ""}`}
                >
                  <div className="flex items-baseline justify-between">
                    <span className="font-bold">
                      {missionDisplayName(m, lang)}
                      <span className="chip ml-2">
                        {m.kind === "kill" ? t("missionKindKill") : t("missionKindGather")} {target} ×{m.n}
                      </span>
                    </span>
                    <span className="text-sm font-mono text-gold">
                      {t("missionRewardLine").replace("{stones}", String(m.stones)).replace("{exp}", String(m.exp))}
                    </span>
                  </div>
                  <p className="text-sm text-faded mt-1">
                    {missionDisplayDesc(m, lang)}
                    {m.item && (
                      <span className="text-cream">
                        {t("missionExtraReward").replace("{item}", itemDisplayName(itemById(m.item), lang))}
                      </span>
                    )}
                  </p>
                  <button
                    className="btn mt-2"
                    disabled={busyAct || locked || !!s.missionId}
                    onClick={() => act("acceptMission", { missionId: m.id })}
                  >
                    {locked ? t("stageInsufficient") : t("btnAcceptMission")}
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
                <span className="font-bold text-fuchsia-300">{t("sectTotalBonusTitle")}</span>
                <span className="text-sm font-mono text-fuchsia-300">
                  {t("combatDamage")} ×{sectMult.toFixed(2)}
                </span>
              </div>
              <p className="text-sm text-faded mt-1">{t("baseMultNote")}</p>
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
                      {stageLabel(stage, SECT_STAGE_LABEL[stage] ?? `境界${stage}`, lang)}
                      <span className="chip ml-2 text-faded/80 border-faded/30">
                        {t("perPersonBonus").replace("{n}", String(Math.round(bonus * 100)))}
                      </span>
                    </span>
                    <span className="text-sm font-mono text-cream shrink-0 ml-3">
                      {t("peopleWithBonus").replace("{n}", String(n))}{" "}
                      <span className="text-fuchsia-300 ml-2">+{Math.round(subtotal * 100)}%</span>
                    </span>
                  </div>
                );
              })}
          </div>
        )}

        {!loading && view === "members" && (
          <div className="space-y-2">
            {members.length === 0 && !err && (
              <p className="text-sm text-faded">{t("noOtherMembers")}</p>
            )}
            {members.map((m, i) => {
              const me = m.name === s.name;
              return (
                <div
                  key={m.name + i}
                  className={`flex items-center justify-between border rounded-sm p-2.5 ${
                    me ? "border-gold/60 bg-gold/10" : "border-faded/20"
                  }`}
                >
                  <div className="min-w-0">
                    <span className={`font-bold ${nameColorOf(REALMS[m.realm_idx]?.stage ?? 1)}`}>
                      {m.name}
                    </span>
                    {me && <span className="chip ml-2 text-gold border-gold/50">{t("youTag2")}</span>}
                    {m.dead && (
                      <span className="chip ml-2 text-vermillion border-vermillion/50">{t("deadTag")}</span>
                    )}
                  </div>
                  <span className="text-sm text-cream shrink-0 ml-3">
                    {realmDisplayName(REALMS[m.realm_idx], lang)}
                    <span className="text-sm text-faded ml-2">{t("memberExpLine").replace("{n}", String(m.exp))}</span>
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {!loading && view === "warehouse" && (
          <div className="space-y-3">
            <div className="border border-faded/25 rounded-sm p-3">
              <p className="font-bold mb-2">{t("warehouseTitle")}</p>
              <p className="text-sm text-faded mb-2">{t("warehouseDesc")}</p>
              <div className="flex flex-wrap gap-2 items-center mb-2">
                <select
                  value={itemId}
                  onChange={(e) => setItemId(e.target.value)}
                  className="bg-smoke border border-faded/30 rounded-sm px-2 py-1.5 text-sm text-parchment"
                >
                  <option value="">{t("selectItemPlaceholder")}</option>
                  {ITEM_SECTIONS.map(([key, kinds]) => {
                    const group = myInventoryItems.filter(([id]) => kinds.includes(itemById(id).kind));
                    if (!group.length) return null;
                    return (
                      <optgroup key={key} label={t(key)}>
                        {group.map(([id, n]) => {
                          const it = itemById(id);
                          return (
                            <option key={id} value={id}>
                              {it ? itemDisplayName(it, lang) : id} × {n}
                            </option>
                          );
                        })}
                      </optgroup>
                    );
                  })}
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
                  {t("btnDeposit")}
                </button>
              </div>

              {Object.entries(items).filter(([, n]) => n > 0).length === 0 ? (
                <p className="text-sm text-faded">{t("warehouseEmpty")}</p>
              ) : (
                <div className="space-y-2">
                  {ITEM_SECTIONS.map(([key, kinds]) => {
                    const group = Object.entries(items).filter(
                      ([id, n]) => n > 0 && kinds.includes(itemById(id).kind),
                    );
                    if (!group.length) return null;
                    return (
                      <div key={key}>
                        <div className="divider">{t(key)}</div>
                        <div className="space-y-1.5">
                          {group.map(([id, n]) => {
                            const it = itemById(id);
                            return (
                              <div
                                key={id}
                                className="flex items-center justify-between border border-faded/20 rounded-sm p-2"
                              >
                                <span>
                                  <span className={it && isXianItem(it) ? XIAN_ITEM_COLOR : ""}>
                                    {it ? itemDisplayName(it, lang) : id}
                                  </span>
                                  <span className="chip ml-2 text-faded/80 border-faded/30">× {n}</span>
                                </span>
                                <button
                                  className="chip hover:text-gold py-1.5 px-2.5"
                                  disabled={busy}
                                  onClick={() => post({ action: "withdrawItem", itemId: id, qty: 1 })}
                                >
                                  {t("btnWithdrawOne")}
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {view === "list" && (
          <div className="space-y-2">
            {listLoading && <p className="text-sm text-faded">{t("querying")}</p>}
            {!listLoading &&
              otherSects.map((os) => (
                <div key={os.id} className="border border-faded/20 rounded-sm p-2.5">
                  <button
                    className="w-full flex items-center justify-between"
                    onClick={() => setExpanded(expanded === os.id ? null : os.id)}
                  >
                    <span className="font-bold">
                      <span className={ELEMENT_COLOR[os.element as keyof typeof ELEMENT_COLOR]}>
                        {sectDisplayName(os, lang)}
                      </span>
                      {os.id === s.sectId && (
                        <span className="chip ml-2 text-gold border-gold/50">{t("homeSectTag")}</span>
                      )}
                      <span className="chip ml-2 text-gold border-gold/40">
                        {sectTierDisplayName({ tier: os.tier, name: os.tierName }, lang)}
                      </span>
                    </span>
                    <span className="text-sm font-mono text-cream shrink-0 ml-3">
                      {t("sectPeopleCount")
                        .replace("{count}", String(os.memberCount))
                        .replace("{cap}", String(os.memberCap))}
                      <span className="text-fuchsia-300 ml-2">×{os.mult.toFixed(2)}</span>
                    </span>
                  </button>
                  {expanded === os.id && (
                    <div className="mt-2 space-y-1 border-t border-faded/15 pt-2">
                      {os.members.length === 0 && (
                        <p className="text-sm text-faded">{t("noMembersRegistered")}</p>
                      )}
                      {os.members.map((m, i) => (
                        <div key={m.name + i} className="flex items-center justify-between text-sm">
                          <span className={nameColorOf(REALMS[m.realm_idx]?.stage ?? 1)}>{m.name}</span>
                          <span className="text-faded text-sm">{realmDisplayName(REALMS[m.realm_idx], lang)}</span>
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
