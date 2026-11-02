"use client";

// 遊歷探索(4.2 版):修煉欄正下方的一整張區域地圖,秘境以印記由左至右標在山路上;
// 點選印記後,下方才展開該秘境的場景圖、可掉落的滕符與採集/獵殺按鈕。
// 5.2 版:改以「地域」為單位並加上現在位置——只能在所在地域採集/狩獵。
// 5.4 版:頂部改為精簡的現在位置卡(趕路倒數、下界時限、派系),其他地域與下界一律在輿圖視窗
// (WorldMapModal)查看與前往;這裡只列所在地域看得見的區域與秘境。
import { CSSProperties, useEffect, useRef, useState } from "react";
import { useGame, statsOf, ENERGY_COST, canEnterStage, currentZoneOf } from "@/game/store";
import { LOCATIONS, REGIONS } from "@/game/data/world";
import { itemById, isXuantianArtifact } from "@/game/data/items";
import {
  factionById,
  ownerOfZone,
  relationOf,
  RELATION_LABEL,
  shopOf,
  RECALL_COOLDOWN_HOURS,
  RIFT_COOLDOWN_HOURS,
} from "@/game/data/factions";
import FactionPicker from "./FactionPicker";
import WorldMapModal from "./WorldMapModal";
import { areasOfZone } from "@/game/data/xianExpansion";
import { WORLD_TIERS, zoneById, locationsOfZone } from "@/game/data/geography";
import { regionArt, sceneOfLocation } from "@/game/data/sceneArt";
import { TENGFU_DROPS, tengfuById } from "@/game/data/tengfu";
import { useT } from "@/i18n/useT";
import { itemDisplayName } from "@/i18n/itemText";
import {
  regionDisplayDesc,
  ZONE_NOTE,
  locationDisplayName,
  locationDisplayDesc,
  zoneDisplayName,
  tierDisplayName,
} from "@/i18n/worldText";

const FUTU = "__futu__";
const NUMERALS = "一二三四五六七八九十";

// 地圖上第 i 個(共 n 個)印記的位置:由左至右均分,高低規律交錯(不再用正弦亂數般的起伏,看起來才不歪)。
// 窄螢幕每列最多 perRow 個,超過就換到下一列(每列仍由左至右),避免印記擠在一起。
function markerPos(i: number, n: number, perRow: number) {
  const rows = Math.ceil(n / perRow);
  const row = Math.floor(i / perRow);
  const inRow = Math.min(perRow, n - row * perRow);
  const col = i - row * perRow;
  const x = inRow === 1 ? 50 : 10 + (80 * col) / (inRow - 1);
  const zig = col % 2 === 0 ? 1 : -1;
  if (rows === 1) return { x, y: n === 1 ? 56 : 56 + zig * 8 };
  // 多列(手機):扣掉上方標題與兩行介紹,每列在 30%~92% 之間均分,列內小幅交錯
  const band = 62 / rows;
  return { x, y: 30 + band * (row + 0.5) + zig * band * 0.1 };
}
// 倒數顯示:h:mm:ss 或 m:ss
function fmtLeft(ms: number) {
  const sec = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const ss = String(sec % 60).padStart(2, "0");
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${ss}` : `${m}:${ss}`;
}
function useNow(active: boolean) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [active]);
  return now;
}
function useNarrow() {
  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 640px)");
    const on = () => setNarrow(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return narrow;
}
// 依印記位置畫出平滑山路(SVG 座標 0~100)
function routePath(points: { x: number; y: number }[]) {
  if (points.length === 0) return "";
  const multiRow = points.some((p) => Math.abs(p.y - points[0].y) > 30);
  const pts = multiRow
    ? points
    : [{ x: 0, y: points[0].y }, ...points, { x: 100, y: points[points.length - 1].y }];
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1];
    const b = pts[i];
    const mx = (a.x + b.x) / 2;
    d += ` C ${mx} ${a.y}, ${mx} ${b.y}, ${b.x} ${b.y}`;
  }
  return d;
}

export default function ExploreStrip() {
  const s = useGame((x) => x.save)!;
  const act = useGame((x) => x.act);
  const busy = useGame((x) => x.busy);
  const lang = useGame((x) => x.language);
  const t = useT();
  const { realm } = statsOf(s);
  const inCombat = !!s.combat;
  const inDwelling = s.dwellingSlot != null;
  // 選擇存在 store:打完一場回到主畫面,地圖仍停在剛才的地域與秘境,可直接再按「獵殺妖獸」
  const explore = useGame((x) => x.explore);
  const setExplore = useGame((x) => x.setExplore);
  const selected = explore.selected;
  const setSelected = (sel: string | null) => setExplore({ selected: sel });

  // ── 現在位置 ──
  const travel = s.location?.travel;
  const visit = s.location?.visit;
  const hereId = currentZoneOf(s);
  const here = zoneById(hereId)!;
  const fac = factionById(s.faction);
  const HOUR = 3_600_000;
  const recallLeft = fac ? (s.recallAt ?? 0) + RECALL_COOLDOWN_HOURS * HOUR - Date.now() : 0;
  const hasXuantian = !!s.equippedWeapon && isXuantianArtifact(s.equippedWeapon);
  const riftLeftRaw = hasXuantian ? (s.riftAt ?? 0) + RIFT_COOLDOWN_HOURS * HOUR - Date.now() : 0;
  const now = useNow(!!travel || !!visit || recallLeft > 0 || riftLeftRaw > 0);
  // 抵達 / 下界時限到了:請伺服器結算一次(同一個時間點只送一次,避免時鐘誤差造成連發)
  const syncedFor = useRef(0);
  useEffect(() => {
    const due = travel && now >= travel.arriveAt ? travel.arriveAt : visit && !travel && now >= visit.until ? visit.until : 0;
    if (due && syncedFor.current !== due && !busy && !inCombat) {
      syncedFor.current = due;
      act("syncLocation");
    }
  }, [now, travel, visit, busy, inCombat, act]);

  // 5.4 版:遊歷探索只顯示所在地域的秘境;其他地域改在輿圖視窗查看與前往
  const zoneId = hereId;
  const [mapOpen, setMapOpen] = useState(false);
  const zone = zoneById(zoneId)!;
  const isHere = zoneId === hereId && !travel;
  // 5.4 版:仙域底下的區域(每區 3~6 關);沒有區域的地域(人間、靈界)沿用整個地域
  // 進不去的秘境不顯示;整區都進不去的區域也不顯示
  const enterable = (locId: string) => {
    const l = LOCATIONS.find((x) => x.id === locId);
    return !!l && canEnterStage(realm.stage, l.reqStage);
  };
  const areas = areasOfZone(zoneId)
    .map((a) => ({ ...a, locations: a.locations.filter(enterable) }))
    .filter((a) => a.locations.length > 0);
  const area = areas.find((a) => a.id === explore.area) ?? areas[0];
  const zName = (id: string) => {
    const z = zoneById(id);
    return z ? zoneDisplayName(z, lang) : id;
  };
  const tName = (id: string) => tierDisplayName(WORLD_TIERS.find((w) => w.id === id)!, lang);
  const region = REGIONS.find((r) => r.id === zone.region)!;

  const locs = area
    ? area.locations.map((id) => LOCATIONS.find((l) => l.id === id)!).filter(Boolean)
    : locationsOfZone(zoneId)
        .filter((l) => canEnterStage(realm.stage, l.reqStage))
        .map((l, i) => ({ l, i }))
        .sort((a, b) => a.l.reqStage - b.l.reqStage || a.i - b.i)
        .map(({ l }) => l);
  const showFutu = zoneId === "jinyuan" && (!area || area.id === areas[0]?.id) && s.jinyuanUnlocked && realm.stage >= 10;
  const energy = s.energy ?? 0;
  const energyLackGather = energy < ENERGY_COST.gather;
  const energyLackHunt = energy < ENERGY_COST.hunt;
  const loc = selected && selected !== FUTU ? LOCATIONS.find((l) => l.id === selected) : undefined;
  const locked = loc ? !canEnterStage(realm.stage, loc.reqStage) : false;
  const challenge = loc ? !locked && loc.reqStage > realm.stage : false;
  const cantAct = !isHere;

  const markers = [
    ...locs.map((l) => ({
      id: l.id,
      name: locationDisplayName(l, lang),
      locked: !canEnterStage(realm.stage, l.reqStage),
      challenge: canEnterStage(realm.stage, l.reqStage) && l.reqStage > realm.stage,
    })),
    ...(showFutu ? [{ id: FUTU, name: t("futuTitle"), locked: false, challenge: false }] : []),
  ];
  const narrow = useNarrow();
  const perRow = narrow ? 4 : Math.max(1, markers.length);
  const rows = Math.ceil(markers.length / Math.max(1, perRow));
  const points = markers.map((_, i) => markerPos(i, markers.length, perRow));
  const mapSrc = regionArt(zone.region, zone.continent);
  const scene = selected ? sceneOfLocation(selected) : null;


  const [shopOpen, setShopOpen] = useState(false);
  const [switchOpen, setSwitchOpen] = useState(false);
  const zoneOwner = ownerOfZone(zoneId);

  const chip = (active: boolean, purple = false, disabled = false) =>
    `px-2.5 py-1 text-xs rounded-sm border transition-colors ${
      active
        ? purple
          ? "border-fuchsia-400 bg-fuchsia-400/15 text-fuchsia-300"
          : "border-gold bg-gold/15 text-gold"
        : disabled
          ? "border-faded/15 text-faded/40"
          : purple
            ? "border-fuchsia-400/40 text-fuchsia-300/90 hover:border-fuchsia-400"
            : "border-faded/30 text-cream hover:border-gold/60"
    }`;

  return (
    <section className="panel !py-3">
      {/* 現在位置卡(5.4 版):平常只顯示所在地與趕路進度,其他地域打開輿圖查看 */}
      <div className="loc-card">
        <div className="loc-card-main">
          <p className="panel-title mb-0">{t("exploreTitle")}</p>
          <div className="loc-card-where">
            <span className="loc-card-pin" aria-hidden="true">◉</span>
            <span className="text-faded text-xs">{tName(here.tier)}</span>
            <span className="loc-card-zone">{zName(hereId)}</span>
            {zoneOwner && (
              <span className={`text-xs ${zoneOwner.color}`}>
                {t("facTerritory").replace("{name}", zoneOwner.name)}
                {fac ? `・${RELATION_LABEL[relationOf(fac.id, zoneOwner.id)]}` : ""}
              </span>
            )}
          </div>
        </div>
        <button className="btn loc-card-btn" onClick={() => setMapOpen(true)}>
          🗺 {t("wmapOpen")}
        </button>
      </div>
      {mapOpen && <WorldMapModal onClose={() => setMapOpen(false)} />}

      {/* 仙域的區域(5.4 版):同一仙域內切換區域不花時間 */}
      {areas.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 mb-2">
          {areas.map((a, i) => (
            <button
              key={a.id}
              onClick={() => setExplore({ area: a.id, selected: null })}
              className={chip(area?.id === a.id)}
            >
              {i + 1}. {a.name}
              <span className="text-faded ml-1">· {a.locations.length} 關</span>
            </button>
          ))}
        </div>
      )}

      {/* 現在位置 / 趕路倒數 / 下界遠征 */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mb-2 text-xs">
        {travel && (
          <span className="flex items-center gap-2 min-w-0">
            <span className="text-azure">
              {travel.kind === "return" ? t("locReturning") : t("locTraveling")}:{zName(travel.from)} → {zName(travel.to)}
            </span>
            <span className="font-mono text-cream">
              {t("locRemaining").replace("{t}", fmtLeft(travel.arriveAt - now))}
            </span>
            <span className="stat-bar w-24 shrink-0">
              <span
                className="block h-full bg-azure/70"
                style={{
                  width: `${Math.min(100, Math.max(0, ((now - travel.departAt) / Math.max(1, travel.arriveAt - travel.departAt)) * 100))}%`,
                }}
              />
            </span>
            {travel.kind !== "return" && (
              <button className="btn !py-0.5 !px-2 text-xs" disabled={busy} onClick={() => act("cancelTravel")}>
                {t("locCancel")}
              </button>
            )}
          </span>
        )}
        {visit && (
          <span className="flex items-center gap-2">
            <span className="text-cinnabar">
              {t("locVisit")} · {t("locVisitLeft").replace("{t}", fmtLeft(visit.until - now))}
            </span>
            {!travel && (
              <button
                className="btn !py-0.5 !px-2 text-xs"
                disabled={busy || inCombat}
                onClick={() => act("returnUp")}
              >
                {t("locReturnUp")}
              </button>
            )}
          </span>
        )}
      </div>

      {/* 派系(5.4 版):功勳、歸宗令、派系商店、改投 */}
      {fac && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mb-2 text-xs">
          <span className={`chip border-faded/40 ${fac.color}`}>
            {t("facLabel")}:{fac.name} · {t("facMerit")} {s.merit ?? 0}
          </span>
          <button
            className="btn !py-0.5 !px-2 text-xs"
            disabled={busy || inCombat || !!visit || recallLeft > 0}
            title={t("facRecallTip").replace("{city}", fac.city)}
            onClick={() => act("recall")}
          >
            {recallLeft > 0
              ? t("facRecallCd").replace("{t}", fmtLeft((s.recallAt ?? 0) + RECALL_COOLDOWN_HOURS * HOUR - now))
              : t("facRecall")}
          </button>
          <button className={chip(shopOpen)} onClick={() => setShopOpen((v) => !v)}>
            {t("facShop")}
          </button>
          <button className="text-faded hover:text-cream underline-offset-2 hover:underline" onClick={() => setSwitchOpen(true)}>
            {t("facSwitch")}
          </button>
        </div>
      )}
      {fac && shopOpen && (
        <div className="border border-faded/25 rounded-sm p-2.5 mb-2 space-y-1.5">
          {shopOf(fac.id).map((e) => {
            const item = itemById(e.itemId);
            return (
              <div key={e.itemId} className="flex items-center justify-between gap-2 text-xs">
                <span>
                  <span className="font-bold text-cream">{itemDisplayName(item, lang)}</span>
                  <span className="text-faded ml-2">{item.effect ?? ""}</span>
                </span>
                <button
                  className="btn !py-0.5 !px-2 text-xs shrink-0"
                  disabled={busy || (s.merit ?? 0) < e.merit}
                  onClick={() => act("buyFaction", { itemId: e.itemId })}
                >
                  {t("facBuy").replace("{n}", String(e.merit))}
                </button>
              </div>
            );
          })}
        </div>
      )}
      {switchOpen && <FactionPicker onClose={() => setSwitchOpen(false)} />}

      {/* 地域地圖:一整張圖,秘境印記由左至右沿山路排列 */}
      <div
        key={`${zoneId}-${area?.id ?? ""}`}
        className="region-map"
        style={{ "--scene": `url(${mapSrc})`, "--map-rows": Math.max(1, rows) } as CSSProperties}
      >
        <div className="region-map-title">
          <span>
            {zoneDisplayName(zone, lang)}
            {area ? ` · ${area.name}` : ""}
          </span>
          <small>
            {zoneOwner && (
              <b className={zoneOwner.color}>
                {t("facTerritory").replace("{name}", zoneOwner.name)}
                {fac ? `(${RELATION_LABEL[relationOf(fac.id, zoneOwner.id)]})` : ""}{" "}
              </b>
            )}
            {ZONE_NOTE[zoneId] ? t(ZONE_NOTE[zoneId]) : regionDisplayDesc(region, lang)}
          </small>
        </div>
        <svg className="region-map-route" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          <path d={routePath(points)} />
        </svg>
        {markers.map((m, i) => (
          <button
            key={m.id}
            type="button"
            className={`region-marker ${selected === m.id ? "is-on" : ""} ${m.locked ? "is-locked" : ""} ${m.challenge ? "is-challenge" : ""} ${m.id === FUTU ? "is-futu" : ""}`}
            title={m.challenge ? t("exploreChallengeTip") : undefined}
            style={{ left: `${points[i].x}%`, top: `${points[i].y}%` }}
            onClick={() => setSelected(selected === m.id ? null : m.id)}
            aria-pressed={selected === m.id}
          >
            <span className="region-marker-seal">{m.id === FUTU ? "塔" : NUMERALS[i] ?? i + 1}</span>
            <span className="region-marker-name">
              {m.name}
              {m.locked && "・未啟"}
            </span>
          </button>
        ))}
        {markers.length === 0 ? (
          <p className="region-map-hint">{t("locNoSpots")}</p>
        ) : (
          !selected && <p className="region-map-hint">{t("explorePickHint")}</p>
        )}
      </div>

      {/* 選定秘境:場景圖 + 說明 + 行動 */}
      {selected && scene && (
        <div key={selected} className="region-detail">
          <div
            className="region-detail-art"
            style={
              {
                "--scene": `url(${scene.src})`,
                "--scene-focus": scene.focus,
                "--scene-tint": scene.tint,
              } as CSSProperties
            }
          />
          <div className="region-detail-copy">
            {loc ? (
              <>
                <div className="flex flex-wrap items-baseline gap-2">
                  <span className="text-lg font-black tracking-[0.2em] text-parchment">
                    {locationDisplayName(loc, lang)}
                  </span>
                  {locked && (
                    <span className="chip">{t("exploreStageLocked").replace("{n}", String(loc.reqStage))}</span>
                  )}
                  {challenge && (
                    <span className="chip text-cinnabar border-cinnabar/50">{t("exploreChallengeChip")}</span>
                  )}
                </div>
                <p className="text-sm text-faded mt-1">{locationDisplayDesc(loc, lang)}</p>
                {challenge && <p className="text-xs text-cinnabar mt-1">{t("exploreChallengeTip")}</p>}
                {cantAct && (
                  <p className="text-xs text-cinnabar mt-1">{t("locNotHere").replace("{zone}", zName(zoneId))}</p>
                )}
                <div className="flex flex-wrap items-center gap-1 mt-2">
                  <span className="text-[11px] text-faded mr-1">{t("tengfuDropHint")}</span>
                  {(TENGFU_DROPS[loc.id] ?? []).map((id) => (
                    <span key={id} className="explore-drop">
                      {tengfuById(id)?.name}
                    </span>
                  ))}
                </div>
                <div className="mt-2 flex gap-2">
                  <button
                    className="btn"
                    disabled={cantAct || locked || inCombat || busy || inDwelling || energyLackGather}
                    onClick={() => act("gather", { locationId: loc.id })}
                    title={
                      inDwelling
                        ? t("inDwellingTip")
                        : energyLackGather
                          ? `${t("energyInsufficientTip")} (${ENERGY_COST.gather})`
                          : `-${ENERGY_COST.gather} ${t("energyCostSuffix")}`
                    }
                  >
                    {t("btnGather")}
                  </button>
                  <button
                    className="btn btn-danger"
                    disabled={cantAct || locked || inCombat || busy || inDwelling || energyLackHunt}
                    onClick={() => act("hunt", { locationId: loc.id })}
                    title={
                      inDwelling
                        ? t("inDwellingTip")
                        : energyLackHunt
                          ? `${t("energyInsufficientTip")} (${ENERGY_COST.hunt})`
                          : `-${ENERGY_COST.hunt} ${t("energyCostSuffix")}`
                    }
                  >
                    {t("btnHunt")}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="text-lg font-black tracking-[0.2em] text-amber-200">{t("futuTitle")}</span>
                  <span className="text-xs font-mono text-amber-300/80">
                    {t("futuCleared").replace("{n}", String(s.futuFloor))}
                  </span>
                </div>
                <p className="text-sm text-faded mt-1">{t("futuDesc").replace(/\{n\}/g, String(s.futuFloor + 1))}</p>
                <button
                  className="btn mt-3 border-amber-300/60 text-amber-300 hover:bg-amber-300/15"
                  disabled={cantAct || inCombat || busy}
                  onClick={() => act("challengeFutu")}
                >
                  {t("futuBtn").replace("{n}", String(s.futuFloor + 1))}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
