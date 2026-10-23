"use client";

// 遊歷探索(4.2 版):修煉欄正下方的一整張區域地圖,秘境以印記由左至右標在山路上;
// 點選印記後,下方才展開該秘境的場景圖、可掉落的滕符與採集/獵殺按鈕。
import { CSSProperties, useEffect, useState } from "react";
import { useGame, statsOf, ENERGY_COST, canEnterStage } from "@/game/store";
import { LOCATIONS, REGIONS } from "@/game/data/world";
import { CONTINENTS } from "@/game/types";
import { regionArt, sceneOfLocation } from "@/game/data/sceneArt";
import { TENGFU_DROPS, tengfuById } from "@/game/data/tengfu";
import { useT } from "@/i18n/useT";
import {
  regionDisplayName,
  regionDisplayDesc,
  locationDisplayName,
  locationDisplayDesc,
} from "@/i18n/worldText";

const FUTU = "__futu__";
const NUMERALS = "一二三四五六七八九十";

// 地圖上第 i 個(共 n 個)印記的位置:由左至右均分,上下沿山路起伏。
// 窄螢幕每列最多 perRow 個,超過就換到下一列(每列仍由左至右),避免印記擠在一起。
function markerPos(i: number, n: number, perRow: number) {
  const rows = Math.ceil(n / perRow);
  const row = Math.floor(i / perRow);
  const inRow = Math.min(perRow, n - row * perRow);
  const col = i - row * perRow;
  const x = inRow === 1 ? 50 : 10 + (80 * col) / (inRow - 1);
  if (rows === 1) return { x, y: 54 + Math.sin(i * 1.35 + 0.6) * 17 };
  // 多列:扣掉上方標題,每列在 22%~90% 之間均分,列內小幅起伏
  const band = 68 / rows;
  return { x, y: 22 + band * (row + 0.5) + Math.sin(col * 1.6 + row) * band * 0.12 };
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
  // 選擇存在 store:打完一場回到主畫面,地圖仍停在剛才的秘境,可直接再按「獵殺妖獸」
  const explore = useGame((x) => x.explore);
  const setExplore = useGame((x) => x.setExplore);
  const regionId = explore.region;
  const continentId = explore.continent;
  const selected = explore.selected;
  const setRegionId = (region: string) => setExplore({ region });
  const setContinentId = (continent: string) => setExplore({ continent });
  const setSelected = (sel: string | null) => setExplore({ selected: sel });
  const visibleRegions = REGIONS.filter(
    (r) =>
      !r.hidden ||
      (r.id === "jinyuan" && s.jinyuanUnlocked) ||
      (r.id === "manhuang" && s.manhuangUnlocked),
  );
  // 第一次打開地圖時,直接停在目前能進入的最高區域(而不是永遠從天南開始)
  useEffect(() => {
    if (explore.autoPicked) return;
    const reachable = visibleRegions.filter((r) => canEnterStage(realm.stage, r.reqStage));
    const best = reachable[reachable.length - 1];
    setExplore({ autoPicked: true, ...(best ? { region: best.id, continent: "all", selected: null } : {}) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const region = REGIONS.find((r) => r.id === regionId)!;
  // 排序(4.2 版修正):同一區域內先依大陸(風元 → 雷鳴 → 血天),再依需求境界由低到高,地圖由左至右即是由易到難
  const continentOrder = (id?: string) => {
    const i = CONTINENTS.findIndex((c) => c.id === id);
    return i === -1 ? 0 : i;
  };
  const locs = LOCATIONS.filter((l) => l.region === regionId)
    .map((l, i) => ({ l, i }))
    .sort(
      (a, b) =>
        continentOrder(a.l.continent) - continentOrder(b.l.continent) ||
        a.l.reqStage - b.l.reqStage ||
        a.i - b.i,
    )
    .map(({ l }) => l);
  const regionContinents = CONTINENTS.filter((c) => locs.some((l) => l.continent === c.id));
  const visibleLocs = continentId === "all" ? locs : locs.filter((l) => l.continent === continentId);
  const showFutu = regionId === "jinyuan" && s.jinyuanUnlocked && realm.stage >= 10;
  const energy = s.energy ?? 0;
  const energyLackGather = energy < ENERGY_COST.gather;
  const energyLackHunt = energy < ENERGY_COST.hunt;
  const loc = selected && selected !== FUTU ? LOCATIONS.find((l) => l.id === selected) : undefined;
  const locked = loc ? !canEnterStage(realm.stage, loc.reqStage) : false;
  const challenge = loc ? !locked && loc.reqStage > realm.stage : false;

  const markers = [
    ...visibleLocs.map((l) => ({
      id: l.id,
      name: locationDisplayName(l, lang),
      locked: !canEnterStage(realm.stage, l.reqStage),
      challenge: canEnterStage(realm.stage, l.reqStage) && l.reqStage > realm.stage,
    })),
    ...(showFutu ? [{ id: FUTU, name: t("futuTitle"), locked: false, challenge: false }] : []),
  ];
  const narrow = useNarrow();
  const perRow = narrow ? 4 : markers.length;
  const rows = Math.ceil(markers.length / Math.max(1, perRow));
  const points = markers.map((_, i) => markerPos(i, markers.length, perRow));
  const mapSrc = regionArt(regionId, continentId === "all" ? undefined : continentId);
  const scene = selected ? sceneOfLocation(selected) : null;

  const chip = (active: boolean, purple = false, disabled = false) =>
    `px-2.5 py-1 text-xs rounded-sm border transition-colors ${
      active
        ? purple
          ? "border-fuchsia-400 bg-fuchsia-400/15 text-fuchsia-300"
          : "border-gold bg-gold/15 text-gold"
        : disabled
          ? "border-faded/15 text-faded/40 cursor-not-allowed"
          : purple
            ? "border-fuchsia-400/40 text-fuchsia-300/90 hover:border-fuchsia-400"
            : "border-faded/30 text-cream hover:border-gold/60"
    }`;

  return (
    <section className="panel !py-3">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-2">
        <p className="panel-title mb-0">{t("exploreTitle")}</p>
        <div className="flex flex-wrap gap-1.5">
          {visibleRegions.map((r) => {
            const rLocked = !canEnterStage(realm.stage, r.reqStage);
            return (
              <button
                key={r.id}
                onClick={() => {
                  if (rLocked) return;
                  setRegionId(r.id);
                  setContinentId("all");
                  setSelected(null);
                }}
                title={
                  rLocked
                    ? t("exploreStageLocked").replace("{n}", String(r.reqStage))
                    : regionDisplayDesc(r, lang)
                }
                className={chip(regionId === r.id, r.color === "fuchsia", rLocked)}
              >
                {regionDisplayName(r, lang)}
                {rLocked && "・未啟"}
              </button>
            );
          })}
        </div>
        {regionContinents.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => {
                setContinentId("all");
                setSelected(null);
              }}
              className={chip(continentId === "all")}
            >
              {t("filterAll")}
            </button>
            {regionContinents.map((c) => (
              <button
                key={c.id}
                onClick={() => {
                  setContinentId(c.id);
                  setSelected(null);
                }}
                className={chip(continentId === c.id)}
              >
                {c.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 區域地圖:一整張圖,秘境印記由左至右沿山路排列 */}
      <div
        key={`${regionId}-${continentId}`}
        className="region-map"
        style={{ "--scene": `url(${mapSrc})`, "--map-rows": rows } as CSSProperties}
      >
        <div className="region-map-title">
          <span>{regionDisplayName(region, lang)}</span>
          <small>{regionDisplayDesc(region, lang)}</small>
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
        {!selected && <p className="region-map-hint">{t("explorePickHint")}</p>}
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
                    disabled={locked || inCombat || busy || inDwelling || energyLackGather}
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
                    disabled={locked || inCombat || busy || inDwelling || energyLackHunt}
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
                  disabled={inCombat || busy}
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
