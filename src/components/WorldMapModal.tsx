"use client";

// 輿圖(5.4 版重新設計):平常收起,點「開啟輿圖」才顯示。左側為所選界的大地圖(節點 + 航路),
// 右側資訊欄顯示所選地域的派系、介紹、區域與關卡、移動時間與費用,按「前往」即開始計時並關閉視窗。
// 下界也在這裡:身在降靈臺時切到下界分頁、點選目的地,資訊欄會出現以破界珠/逆星盤前往的選項。
// 版面參考常見遊戲地圖:平常不佔畫面、打開才是全幅地圖,點地點後側欄給資訊與確認按鈕。
// 地圖可拖曳、滾輪/雙指縮放(react-zoom-pan-pinch);手機版資訊欄改為底部抽屜(vaul),地圖佔滿全螢幕。
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import {
  TransformWrapper,
  TransformComponent,
  type ReactZoomPanPinchRef,
} from "react-zoom-pan-pinch";
import { Drawer } from "vaul";
import { useGame, statsOf, currentZoneOf, travelOptionsOf, tollOf } from "@/game/store";
import { LOCATIONS, REGIONS } from "@/game/data/world";
import { formatStones } from "@/game/types";
import { itemById, isXuantianArtifact } from "@/game/data/items";
import {
  ZONES,
  WORLD_TIERS,
  ROUTES,
  ZONE_MAP_POS,
  zoneById,
  zoneUnlocked,
  zoneVisible,
  zoneReqStage,
  locationsOfZone,
  flyPlan,
  portalPlan,
  descendTargets,
  tierIndex,
  DESCENT_ZONE,
  needsDescentPlatform,
  POJIE_ZHU,
  NIXING_PAN,
  CROSS_REALM_MINUTES,
  VISIT_HOURS,
  type WorldTier,
  type Zone,
} from "@/game/data/geography";
import {
  factionById,
  ownerOfZone,
  relationOf,
  RELATION_LABEL,
  RIFT_COOLDOWN_HOURS,
  RIFT_CROSS_COOLDOWN_HOURS,
  RIFT_CROSS_WEAPON,
  LUNHUI_PEARLS_FOR_DISC,
} from "@/game/data/factions";
import { areasOfZone } from "@/game/data/xianExpansion";
import { regionArt } from "@/game/data/sceneArt";
import { REALMS } from "@/game/data/realms";
import { useT } from "@/i18n/useT";
import type { SaveData, Travel } from "@/game/engine";
import type { Language } from "@/i18n/dict";
import { itemDisplayName } from "@/i18n/itemText";
import {
  regionDisplayDesc,
  locationDisplayName,
  zoneDisplayName,
  tierDisplayName,
  ZONE_NOTE,
} from "@/i18n/worldText";

const HOUR = 3_600_000;
const MAX_SCALE = 2.5;
// 手機抽屜的停點:先露出名稱與前往按鈕,往上拉看完整資訊
const DRAWER_PEEK = 210;
const SNAPS: (number | string)[] = [`${DRAWER_PEEK}px`, 0.82];
// 各界地圖底圖
const TIER_ART: Record<WorldTier, string> = {
  renjian: regionArt("tiannan"),
  lingjie: regionArt("lingjie", "fengyuan"),
  xianjie: regionArt("zhongtu"),
};
const fmtLeft = (ms: number) => {
  const sec = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const ss = String(sec % 60).padStart(2, "0");
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${ss}` : `${m}:${ss}`;
};
const stageName = (stage: number) =>
  REALMS.find((r) => r.stage === stage)?.name.split(" ")[0] ?? `${stage} 階`;

type Pt = { x: number; y: number };
// 節點排版(像素):只畫看得到的地域,依地圖框的實際尺寸把它們等比放大、置中在可用範圍內,
// 一打開就全部看得到。左右留名稱寬度,上方留「你在此」,下方留名稱與標籤;手機下方再扣掉抽屜露出的高度。
// 放大倍率設上限,只有一兩個地域時不會被拉得太開。
function layoutOf(zones: Zone[], w: number, h: number, bottomInset: number): Record<string, Pt> {
  const ps = zones.map((z) => ZONE_MAP_POS[z.id] ?? { x: 50, y: 36 });
  if (!ps.length || !w) return {};
  const xs = ps.map((p) => p.x);
  const ys = ps.map((p) => p.y);
  const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  const side = Math.min(80, w * 0.16);
  const box = { l: side, r: w - side, t: 56, b: h - bottomInset - 64 };
  const unit = Math.min(w, (h * 100) / 72) / 100; // 原座標 1 單位 = 幾像素(整張 100×72 塞進框)
  const k = Math.min(
    (box.r - box.l) / Math.max(1, x1 - x0),
    Math.max(40, box.b - box.t) / Math.max(1, y1 - y0),
    unit * 2,
  );
  const cx = (x0 + x1) / 2;
  const cy = (y0 + y1) / 2;
  const mx = (box.l + box.r) / 2;
  const my = (box.t + Math.max(box.t + 40, box.b)) / 2;
  return Object.fromEntries(
    zones.map((z, i) => [z.id, { x: mx + (ps[i].x - cx) * k, y: my + (ps[i].y - cy) * k }]),
  );
}
// 險路畫成往一側鼓起的弧線(弧度依兩點距離),不再固定往右偏
function routeD(a: Pt, b: Pt, curved: boolean) {
  if (!curved) return `M ${a.x} ${a.y} L ${b.x} ${b.y}`;
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const c = { x: (a.x + b.x) / 2 - dy * 0.35, y: (a.y + b.y) / 2 + dx * 0.35 };
  return `M ${a.x} ${a.y} Q ${c.x} ${c.y} ${b.x} ${b.y}`;
}
function useMedia(query: string) {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const f = () => setOn(mq.matches);
    f();
    mq.addEventListener("change", f);
    return () => mq.removeEventListener("change", f);
  }, [query]);
  return on;
}
// 地圖框尺寸:畫布與地圖框一樣大(底圖以 cover 鋪滿),節點依此排版;放大後才需要拖曳
function useBoxSize() {
  const ref = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState({ w: 0, h: 0 });
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) =>
      setBox({ w: Math.round(e.contentRect.width), h: Math.round(e.contentRect.height) }),
    );
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return { ref, ...box };
}

export default function WorldMapModal({ onClose }: { onClose: () => void }) {
  const s = useGame((x) => x.save)!;
  const act = useGame((x) => x.act);
  const busy = useGame((x) => x.busy);
  const lang = useGame((x) => x.language);
  const t = useT();
  const { realm } = statsOf(s);
  const travel = s.location?.travel;
  const visit = s.location?.visit;
  const hereId = currentZoneOf(s);
  const here = zoneById(hereId)!;
  const inCombat = !!s.combat;
  const inDwelling = s.dwellingSlot != null;
  const fac = factionById(s.faction);
  const opts = travelOptionsOf(s);
  const mobile = useMedia("(max-width: 767px)");

  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  // 開著輿圖時鎖住背景頁面,手機拖曳地圖或抽屜時底下不會跟著捲動
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  // 看得到的界:所在界以及以下(飛昇前看不到上界)
  const tiers = WORLD_TIERS.filter((w) => tierIndex(w.id) <= tierIndex(here.tier));
  const [tier, setTier] = useState<WorldTier>(here.tier);
  const [selectedId, setSelectedId] = useState<string | null>(travel?.to ?? hereId);
  const [snap, setSnap] = useState<number | string | null>(SNAPS[0]);

  const visible = (z: Zone) =>
    z.id === hereId ||
    z.id === travel?.to ||
    (z.tier !== here.tier ? true : zoneVisible(s, z, realm.stage));
  const zones = ZONES.filter((z) => z.tier === tier && visible(z));
  const ids = new Set(zones.map((z) => z.id));
  const routes = ROUTES.filter((r) => ids.has(r.a) && ids.has(r.b));
  // 桌機永遠有資訊欄(未選時顯示所在地);手機關掉抽屜就是未選
  const sel =
    zones.find((z) => z.id === selectedId) ??
    (mobile ? undefined : (zones.find((z) => z.id === hereId) ?? zones[0]));

  // 地圖框與節點位置(手機下方扣掉抽屜露出的高度,節點不會被擋住)
  const box = useBoxSize();
  const P = layoutOf(zones, box.w, box.h, mobile ? DRAWER_PEEK : 0);

  // 趕路中的光點
  let mover: Pt | null = null;
  if (travel && P[travel.from] && P[travel.to]) {
    const k = Math.min(
      1,
      Math.max(0, (now - travel.departAt) / Math.max(1, travel.arriveAt - travel.departAt)),
    );
    const a = P[travel.from];
    const b = P[travel.to];
    mover = { x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k };
  }

  // 鏡頭:平時整張(縮放 1);◎ 放大對準所在地
  const zoomRef = useRef<ReactZoomPanPinchRef>(null);
  const anchorId = ids.has(hereId) ? hereId : (selectedId ?? undefined);
  const zoomToHere = () => {
    const api = zoomRef.current;
    const p = anchorId ? P[anchorId] : undefined;
    if (!api || !p) return;
    const scale = 1.8;
    const clamp = (v: number, view: number) => Math.min(0, Math.max(view - view * scale, v));
    const viewH = box.h - (mobile ? DRAWER_PEEK : 0);
    api.setTransform(
      clamp(box.w / 2 - p.x * scale, box.w),
      clamp(viewH / 2 - p.y * scale, box.h),
      scale,
      300,
    );
  };
  // 切換分頁或視窗尺寸改變時回到整張
  useEffect(() => {
    zoomRef.current?.resetTransform(0);
  }, [tier, box.w, box.h]);

  const pick = (id: string) => {
    setSelectedId(id);
    if (mobile) setSnap(SNAPS[0]);
  };
  const zName = (z: Zone) => zoneDisplayName(z, lang);
  const tName = (id: WorldTier) =>
    tierDisplayName(
      WORLD_TIERS.find((w) => w.id === id)!,
      lang,
    );
  const ctx: Ctx = {
    s,
    act,
    busy,
    lang,
    t,
    realmStage: realm.stage,
    hereId,
    here,
    travel,
    visit,
    now,
    inCombat,
    inDwelling,
    fac,
    opts,
    onClose,
  };

  const map = (
    <div className="wmap-map" ref={box.ref}>
      {box.w > 0 && (
        <TransformWrapper
          ref={zoomRef}
          minScale={1}
          maxScale={MAX_SCALE}
          limitToBounds
          centerZoomedOut
          doubleClick={{ disabled: true }}
          wheel={{ step: 0.12 }}
          panning={{ velocityDisabled: true }}
        >
          <TransformComponent wrapperClass="wmap-viewport" contentClass="wmap-content">
            <div
              className="wmap-stage"
              style={
                {
                  width: box.w,
                  height: box.h,
                  "--wmap-art": `url(${TIER_ART[tier]})`,
                } as CSSProperties
              }
            >
              <svg className="wmap-lines" viewBox={`0 0 ${box.w} ${box.h}`} aria-hidden="true">
                {routes.map((r) => {
                  const onPath = sel && (r.a === sel.id || r.b === sel.id);
                  return (
                    <path
                      key={`${r.a}-${r.b}`}
                      d={routeD(P[r.a], P[r.b], !!r.perilous)}
                      className={`${r.perilous ? "is-perilous" : r.portalFee ? "is-portal" : ""} ${onPath ? "is-hot" : ""}`}
                    />
                  );
                })}
                {travel && ids.has(travel.from) && ids.has(travel.to) && (
                  <path d={routeD(P[travel.from], P[travel.to], false)} className="is-travel" />
                )}
              </svg>
              {zones.map((z) => {
                const { x, y } = P[z.id];
                const isHere = z.id === hereId && !travel;
                const owner = ownerOfZone(z.id);
                return (
                  <button
                    key={z.id}
                    type="button"
                    className={`wmap-node ${isHere ? "is-here" : ""} ${sel?.id === z.id ? "is-on" : ""} ${
                      !zoneUnlocked(s, z) ? "is-locked" : ""
                    }`}
                    style={{ left: x, top: y }}
                    onClick={() => pick(z.id)}
                    aria-pressed={sel?.id === z.id}
                  >
                    {isHere && <span className="wmap-node-here">{t("locYouAreHere")}</span>}
                    {travel?.to === z.id && (
                      <span className="wmap-node-here is-dest">{t("wmapDestination")}</span>
                    )}
                    <span className="wmap-node-seal">{z.name.slice(0, 1)}</span>
                    <span className="wmap-node-name">{zName(z)}</span>
                    <span className="wmap-node-tags">
                      {owner && (
                        <span className={`wmap-node-tag ${owner.color}`}>{owner.name}</span>
                      )}
                      {z.id === DESCENT_ZONE[z.tier] && (
                        <span className="wmap-node-tag text-sky-300">
                          {t("locDescentPlatform")}
                        </span>
                      )}
                    </span>
                  </button>
                );
              })}
              {mover && <span className="wmap-mover" style={{ left: mover.x, top: mover.y }} />}
            </div>
          </TransformComponent>
        </TransformWrapper>
      )}
      <div className="wmap-legend">
        <span>
          <i className="lg-route" />
          {t("wmapLegendRoute")}
        </span>
        <span>
          <i className="lg-portal" />
          {t("wmapLegendPortal")}
        </span>
        <span>
          <i className="lg-perilous" />
          {t("wmapLegendPerilous")}
        </span>
      </div>
      <div className="wmap-zoom">
        <button type="button" onClick={() => zoomRef.current?.zoomIn(0.4)} aria-label="zoom in">
          ＋
        </button>
        <button type="button" onClick={() => zoomRef.current?.zoomOut(0.4)} aria-label="zoom out">
          －
        </button>
        <button
          type="button"
          onClick={zoomToHere}
          title={t("wmapRecenter")}
          aria-label={t("wmapRecenter")}
        >
          ◎
        </button>
      </div>
    </div>
  );

  // 以 portal 掛到 body:遊歷探索面板本身會形成堆疊層(半透明玻璃效果),放在裡面 z-index 蓋不過其他面板
  return createPortal(
    <div className="wmap-overlay" onClick={onClose}>
      <div className="wmap deco-frame animate-floatUp" onClick={(e) => e.stopPropagation()}>
        <div className="wmap-head">
          <p className="wmap-title">{t("wmapTitle")}</p>
          <div className="wmap-tabs" role="tablist">
            {tiers.map((w) => (
              <button
                key={w.id}
                role="tab"
                aria-selected={tier === w.id}
                onClick={() => {
                  setTier(w.id);
                  setSelectedId(
                    w.id === here.tier
                      ? hereId
                      : (DESCENT_ZONE[w.id] ?? ZONES.find((z) => z.tier === w.id)!.id),
                  );
                  if (mobile) setSnap(SNAPS[0]);
                }}
                className={`wmap-tab ${tier === w.id ? "is-on" : ""}`}
              >
                {tName(w.id)}
                {w.id === here.tier && <span className="wmap-tab-here">◉</span>}
              </button>
            ))}
          </div>
          <button className="wmap-close" onClick={onClose} aria-label={t("btnClose")}>
            ✕
          </button>
        </div>

        <div className="wmap-body">
          {map}
          {!mobile && sel && (
            <aside className="wmap-info">
              <ZoneInfo key={sel.id} zone={sel} ctx={ctx} />
            </aside>
          )}
        </div>
      </div>

      {/* 手機:底部抽屜,先露出名稱與前往按鈕,往上拉看完整資訊 */}
      {mobile && (
        <Drawer.Root
          open={!!sel}
          onOpenChange={(o) => !o && setSelectedId(null)}
          modal={false}
          snapPoints={SNAPS}
          activeSnapPoint={snap}
          setActiveSnapPoint={setSnap}
        >
          <Drawer.Portal>
            <Drawer.Content
              className="wmap-drawer"
              onClick={(e) => e.stopPropagation()}
              aria-describedby={undefined}
            >
              <div className="wmap-drawer-handle" />
              {sel && (
                <>
                  <Drawer.Title className="sr-only">{zName(sel)}</Drawer.Title>
                  <ZoneInfo key={sel.id} zone={sel} ctx={ctx} />
                </>
              )}
            </Drawer.Content>
          </Drawer.Portal>
        </Drawer.Root>
      )}
    </div>,
    document.body,
  );
}
type Ctx = {
  s: SaveData;
  act: (type: string, payload?: Record<string, unknown>) => Promise<void>;
  busy: boolean;
  lang: Language;
  t: ReturnType<typeof useT>;
  realmStage: number;
  hereId: string;
  here: Zone;
  travel: Travel | undefined;
  visit: { returnZone: string; until: number } | undefined;
  now: number;
  inCombat: boolean;
  inDwelling: boolean;
  fac: ReturnType<typeof factionById>;
  opts: ReturnType<typeof travelOptionsOf>;
  onClose: () => void;
};

function ZoneInfo({ zone, ctx }: { zone: Zone; ctx: Ctx }) {
  const {
    s,
    act,
    busy,
    lang,
    t,
    hereId,
    here,
    travel,
    visit,
    now,
    inCombat,
    inDwelling,
    fac,
    opts,
    onClose,
  } = ctx;
  const region = REGIONS.find((r) => r.id === zone.region)!;
  const owner = ownerOfZone(zone.id);
  const unlocked = zoneUnlocked(s, zone);
  const isHere = zone.id === hereId && !travel;
  const sameTier = zone.tier === here.tier;
  const blocked = busy || inCombat || inDwelling || !!travel;
  const go = async (type: string, payload: Record<string, unknown>) => {
    await act(type, payload);
    onClose();
  };

  // 區域與關卡(只列進得去的)
  const enterable = (id: string) => {
    const l = LOCATIONS.find((x) => x.id === id);
    return !!l && (zone.tier !== here.tier || l.reqStage <= ctx.realmStage + 1);
  };
  const areas = areasOfZone(zone.id)
    .map((a) => ({ ...a, locations: a.locations.filter(enterable) }))
    .filter((a) => a.locations.length > 0);
  const plainLocs = areas.length ? [] : locationsOfZone(zone.id).filter((l) => enterable(l.id));

  const fly = sameTier && unlocked && !isHere ? flyPlan(opts, hereId, zone.id) : null;
  const portal = sameTier && unlocked && !isHere ? portalPlan(opts, hereId, zone.id) : null;
  const toll = sameTier && unlocked && !isHere ? tollOf(s, zone.id) : 0;
  const hasXuantian = !!s.equippedWeapon && isXuantianArtifact(s.equippedWeapon);
  const riftLeft = hasXuantian ? (s.riftAt ?? 0) + RIFT_COOLDOWN_HOURS * HOUR - now : 0;

  // 下界:目的地在下界,且身在本界降靈臺(仙界往靈界不必經過降靈臺)
  const atDescent =
    !travel &&
    !visit &&
    (!needsDescentPlatform(here.tier, zone.tier) || DESCENT_ZONE[here.tier] === hereId);
  const pearls = s.inventory[POJIE_ZHU] ?? 0;
  const crossOptions = !sameTier
    ? [
        {
          itemId: POJIE_ZHU,
          have: pearls,
          ok:
            descendTargets(POJIE_ZHU, here.tier).includes(zone.tier) ||
            (s.faction === "lunhui" &&
              pearls >= LUNHUI_PEARLS_FOR_DISC &&
              descendTargets(NIXING_PAN, here.tier).includes(zone.tier)),
        },
        {
          itemId: NIXING_PAN,
          have: s.inventory[NIXING_PAN] ?? 0,
          ok: descendTargets(NIXING_PAN, here.tier).includes(zone.tier),
        },
        {
          itemId: RIFT_CROSS_WEAPON,
          have:
            s.equippedWeapon?.split("@")[0] === RIFT_CROSS_WEAPON &&
            now - (s.riftCrossAt ?? 0) >= RIFT_CROSS_COOLDOWN_HOURS * HOUR
              ? 1
              : 0,
          ok: descendTargets(POJIE_ZHU, here.tier).includes(zone.tier),
        },
      ].filter((c) => c.ok && c.have > 0)
    : [];

  return (
    <div className="wmap-zone">
      <div
        className="wmap-info-art"
        style={{ "--wmap-art": `url(${regionArt(zone.region, zone.continent)})` } as CSSProperties}
      />
      <div className="wmap-info-body">
        <div className="wmap-info-head">
          <p className="text-[11px] text-faded tracking-widest">
            {tierDisplayName(
              WORLD_TIERS.find((w) => w.id === zone.tier)!,
              lang,
            )}
          </p>
          <h3 className="wmap-info-title">{zoneDisplayName(zone, lang)}</h3>
          <div className="flex flex-wrap gap-1.5 mt-1">
            {isHere && <span className="chip text-gold border-gold/60">{t("locYouAreHere")}</span>}
            {owner && (
              <span className={`chip border-faded/40 ${owner.color}`}>
                {t("facTerritory").replace("{name}", owner.name)}
                {fac ? `・${RELATION_LABEL[relationOf(fac.id, owner.id)]}` : ""}
              </span>
            )}
            {zone.id === DESCENT_ZONE[zone.tier] && (
              <span className="chip text-sky-300 border-sky-300/50">{t("locDescentPlatform")}</span>
            )}
            <span className="chip text-faded border-faded/30">
              {t("wmapReq").replace("{realm}", stageName(zoneReqStage(zone.id)))}
            </span>
          </div>
        </div>
        <p className="text-xs text-faded mt-2 leading-relaxed">
          {ZONE_NOTE[zone.id] ? t(ZONE_NOTE[zone.id]) : regionDisplayDesc(region, lang)}
        </p>

        {(areas.length > 0 || plainLocs.length > 0) && (
          <div className="mt-3">
            <p className="wmap-info-sub">{t("wmapStages")}</p>
            {areas.length > 0 ? (
              <ul className="space-y-1">
                {areas.map((a) => (
                  <li key={a.id} className="text-xs">
                    <span className="text-cream font-bold">{a.name}</span>
                    <span className="text-faded"> · {a.locations.length} 關:</span>
                    <span className="text-faded">
                      {a.locations
                        .map((id) => LOCATIONS.find((l) => l.id === id)!)
                        .map((l) => locationDisplayName(l, lang))
                        .join("、")}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-faded">
                {plainLocs.map((l) => locationDisplayName(l, lang)).join("、")}
              </p>
            )}
          </div>
        )}

        {/* 行動 */}
        <div className="wmap-info-actions">
          {travel && (
            <div className="text-xs text-azure">
              {t("locTraveling")}:{fmtLeft(travel.arriveAt - now)}
              {travel.kind !== "return" && (
                <button
                  className="btn !py-0.5 !px-2 text-xs ml-2"
                  disabled={busy}
                  onClick={() => act("cancelTravel")}
                >
                  {t("locCancel")}
                </button>
              )}
            </div>
          )}
          {isHere && <p className="text-xs text-gold">{t("wmapAlreadyHere")}</p>}
          {sameTier && !isHere && !unlocked && (
            <p className="text-xs text-faded">
              {t("locLockedHint").replace("{hint}", zone.unlockHint ?? "")}
            </p>
          )}
          {sameTier && !isHere && unlocked && (
            <>
              {fly ? (
                <button
                  className="btn w-full"
                  disabled={blocked}
                  onClick={() => go("travel", { to: zone.id, mode: "fly" })}
                >
                  {t("locGo").replace("{m}", String(fly.minutes))}
                </button>
              ) : (
                <p className="text-xs text-faded">{t("locUnreachable")}</p>
              )}
              {portal && (
                <button
                  className="btn w-full"
                  disabled={blocked || s.stones < portal.fee + toll}
                  title={t("locPortalTip")}
                  onClick={() => go("travel", { to: zone.id, mode: "portal" })}
                >
                  {t("locPortal").replace("{fee}", formatStones(portal.fee))}
                </button>
              )}
              {hasXuantian && (
                <button
                  className="btn w-full border-fuchsia-400/60 text-fuchsia-300"
                  disabled={blocked || riftLeft > 0}
                  title={t("facRiftTip")}
                  onClick={() => go("rift", { to: zone.id })}
                >
                  {riftLeft > 0 ? t("facRiftCd").replace("{t}", fmtLeft(riftLeft)) : t("facRift")}
                </button>
              )}
              {fly && fly.path.length > 2 && (
                <p className="text-[11px] text-faded">
                  {t("wmapVia")}:
                  {fly.path.map((id) => zoneDisplayName(zoneById(id)!, lang)).join(" → ")}
                </p>
              )}
              {toll > 0 && (
                <p className="text-[11px] text-amber-300">
                  {t("facToll").replace("{name}", owner!.name).replace("{fee}", formatStones(toll))}
                </p>
              )}
            </>
          )}
          {!sameTier &&
            (visit ? (
              <p className="text-xs text-faded">{t("wmapInLowerRealm")}</p>
            ) : !atDescent ? (
              <p className="text-xs text-faded">
                {t("wmapNeedDescent").replace(
                  "{zone}",
                  zoneDisplayName(zoneById(DESCENT_ZONE[here.tier]!)!, lang),
                )}
              </p>
            ) : crossOptions.length === 0 ? (
              <p className="text-xs text-faded">{t("locDescentNeedItem")}</p>
            ) : (
              <>
                {crossOptions.map((c) => (
                  <button
                    key={c.itemId}
                    className="btn w-full border-fuchsia-400/60 text-fuchsia-300"
                    disabled={busy || inCombat || inDwelling}
                    onClick={() => go("descend", { itemId: c.itemId, to: zone.id })}
                  >
                    {t("wmapDescendWith")
                      .replace("{item}", itemDisplayName(itemById(c.itemId), lang))
                      .replace("{n}", c.itemId === RIFT_CROSS_WEAPON ? "" : `×${c.have}`)}
                  </button>
                ))}
                <p className="text-[11px] text-faded">
                  {t("wmapDescendNote")
                    .replace("{m}", String(CROSS_REALM_MINUTES))
                    .replace("{h}", String(VISIT_HOURS * (s.faction === "lunhui" ? 2 : 1)))}
                </p>
              </>
            ))}
        </div>
      </div>
    </div>
  );
}
