"use client";

// 滕符陣(4.2 版):6 寬 × 5 高(30 格)的格子,仿 POE / 暗黑破壞神背包。
// 操作:點選下方未安裝的滕符(或拖曳)→ 移到格子上預覽(綠 = 可放、紅 = 放不下)→ 點擊放入。
// 點選已安裝的滕符可整張搬移或卸下。
import { CSSProperties, DragEvent, useState } from "react";
import { useGame } from "@/game/store";
import {
  TENGFU,
  TENGFU_COLS,
  TENGFU_ROWS,
  TengfuDef,
  TengfuStat,
  canPlaceTengfu,
  tengfuBonusOf,
  tengfuById,
  tengfuLocationsOf,
  tengfuStatValues,
} from "@/game/data/tengfu";
import { LOCATIONS } from "@/game/data/world";
import { useT } from "@/i18n/useT";
import type { DictKey } from "@/i18n/dict";
import { locationDisplayName } from "@/i18n/worldText";
import { tengfuSvg } from "./tengfuArt";
import { tengfuImageSrc } from "./tengfuImages";

const STAT_KEY: Record<TengfuStat, DictKey> = {
  atk: "tfStatAtk",
  def: "tfStatDef",
  hp: "tfStatHp",
  mp: "tfStatMp",
  energy: "tfStatEnergy",
  allEl: "tfStatAllEl",
  金: "tfStatMetal",
  木: "tfStatWood",
  水: "tfStatWater",
  火: "tfStatFire",
  土: "tfStatEarth",
  無: "tfStatAllEl",
};
const TIER_LABEL = ["", "一品", "二品", "三品", "四品", "五品", "六品"];

function useStatText() {
  const t = useT();
  return (k: TengfuStat, v: number) =>
    t(STAT_KEY[k]).replace("{v}", k === "energy" ? String(v) : `${+(v * 100).toFixed(1)}%`);
}

type Grab = { from: "bag"; id: string } | { from: "grid"; index: number };

export default function TengfuPanel() {
  const s = useGame((x) => x.save)!;
  const act = useGame((x) => x.act);
  const busy = useGame((x) => x.busy);
  const lang = useGame((x) => x.language);
  const t = useT();
  const statText = useStatText();
  const [pick, setPick] = useState<Grab | null>(null);
  const [hover, setHover] = useState<{ r: number; c: number } | null>(null);
  const [showCodex, setShowCodex] = useState(false);
  const grid = s.tengfuGrid ?? [];
  const bag = Object.entries(s.tengfuBag ?? {}).filter(([, n]) => n > 0);
  const inCombat = !!s.combat;
  const bonus = tengfuBonusOf(grid);

  const pickedDef = pick ? (pick.from === "bag" ? tengfuById(pick.id) : tengfuById(grid[pick.index]?.id ?? "")) : undefined;
  const ignore = pick?.from === "grid" ? pick.index : -1;
  const preview =
    pickedDef && hover
      ? { ...hover, ok: canPlaceTengfu(grid, pickedDef, hover.r, hover.c, ignore) }
      : null;

  const place = async (r: number, c: number, p: Grab | null = pick) => {
    if (!p || busy || inCombat) return;
    const def = p.from === "bag" ? tengfuById(p.id) : tengfuById(grid[p.index]?.id ?? "");
    if (!def || !canPlaceTengfu(grid, def, r, c, p.from === "grid" ? p.index : -1)) return;
    setPick(null);
    setHover(null);
    await act("tengfuPlace", p.from === "bag" ? { id: p.id, r, c } : { index: p.index, r, c });
  };

  const dragStart = (e: DragEvent, p: Grab) => {
    e.dataTransfer.setData("text/plain", JSON.stringify(p));
    e.dataTransfer.effectAllowed = "move";
    setPick(p);
  };
  const dropOn = (e: DragEvent, r: number, c: number) => {
    e.preventDefault();
    try {
      place(r, c, JSON.parse(e.dataTransfer.getData("text/plain")) as Grab);
    } catch {
      /* 非滕符拖曳 */
    }
  };

  const summary: [TengfuStat, number][] = [
    ["atk", bonus.atk],
    ["def", bonus.def],
    ["hp", bonus.hp],
    ["mp", bonus.mp],
    ["energy", bonus.energy],
    ["allEl", bonus.allEl],
    ...(["金", "木", "水", "火", "土"] as const).map((el) => [el, bonus.el[el]] as [TengfuStat, number]),
  ];
  const active = summary.filter(([, v]) => v > 0);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-xs text-faded">{t("tengfuIntro")}</p>
        <button className="text-xs text-faded hover:text-gold underline-offset-2 hover:underline" onClick={() => setShowCodex((v) => !v)}>
          {showCodex ? t("tengfuBack") : t("tengfuCodex").replace("{n}", String(TENGFU.length))}
        </button>
      </div>

      {showCodex ? (
        <TengfuCodex lang={lang} owned={(id) => (s.tengfuBag?.[id] ?? 0) + grid.filter((g) => g.id === id).length} />
      ) : (
        <>
          <div className="tf-board" onMouseLeave={() => setHover(null)}>
            <div
              className="tf-grid"
              style={{ "--cols": TENGFU_COLS, "--rows": TENGFU_ROWS } as CSSProperties}
            >
              {Array.from({ length: TENGFU_ROWS * TENGFU_COLS }, (_, i) => {
                const r = Math.floor(i / TENGFU_COLS);
                const c = i % TENGFU_COLS;
                return (
                  <button
                    key={`cell-${i}`}
                    type="button"
                    aria-label={`${r + 1}-${c + 1}`}
                    className="tf-cell"
                    style={{ gridRow: r + 1, gridColumn: c + 1 }}
                    onMouseEnter={() => setHover({ r, c })}
                    onDragOver={(e) => {
                      e.preventDefault();
                      if (!hover || hover.r !== r || hover.c !== c) setHover({ r, c });
                    }}
                    onDrop={(e) => dropOn(e, r, c)}
                    onClick={() => place(r, c)}
                  />
                );
              })}
              {grid.map((p, index) => {
                const def = tengfuById(p.id);
                if (!def) return null;
                const picked = pick?.from === "grid" && pick.index === index;
                return (
                  <button
                    key={`tf-${index}-${p.id}`}
                    type="button"
                    draggable={!inCombat}
                    onDragStart={(e) => dragStart(e, { from: "grid", index })}
                    onDragEnd={() => setPick(null)}
                    onClick={() => setPick(picked ? null : { from: "grid", index })}
                    className={`tf-piece ${picked ? "tf-piece-picked" : ""}`}
                    style={{ gridRow: `${p.r + 1} / span ${def.h}`, gridColumn: `${p.c + 1} / span ${def.w}` }}
                    title={`${def.name}\n${Object.entries(tengfuStatValues(def))
                      .map(([k, v]) => statText(k as TengfuStat, v as number))
                      .join("\n")}`}
                  >
                    <TengfuFace def={def} />
                  </button>
                );
              })}
              {preview && pickedDef && (
                <span
                  className={`tf-preview ${preview.ok ? "tf-preview-ok" : "tf-preview-bad"}`}
                  style={{
                    gridRow: `${preview.r + 1} / span ${Math.min(pickedDef.h, TENGFU_ROWS - preview.r)}`,
                    gridColumn: `${preview.c + 1} / span ${Math.min(pickedDef.w, TENGFU_COLS - preview.c)}`,
                  }}
                />
              )}
            </div>
          </div>

          {pick?.from === "grid" && pickedDef && (
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="text-gold">{pickedDef.name}</span>
              <span className="text-faded">{t("tengfuMoveHint")}</span>
              <button
                className="btn py-0.5 px-2 text-xs"
                disabled={busy || inCombat}
                onClick={async () => {
                  const index = pick.index;
                  setPick(null);
                  await act("tengfuRemove", { index });
                }}
              >
                {t("tengfuRemove")}
              </button>
            </div>
          )}

          <div className="flex flex-wrap gap-1.5">
            {active.length === 0 ? (
              <span className="text-xs text-faded/70">{t("tengfuNoBonus")}</span>
            ) : (
              active.map(([k, v]) => (
                <span key={k} className="chip text-jade border-jade/40">
                  {statText(k, v)}
                </span>
              ))
            )}
          </div>

          <div>
            <div className="divider">{t("tengfuBagTitle")}</div>
            {bag.length === 0 ? (
              <p className="text-xs text-faded/70">{t("tengfuBagEmpty")}</p>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2">
                {bag.map(([id, n]) => {
                  const def = tengfuById(id);
                  if (!def) return null;
                  const picked = pick?.from === "bag" && pick.id === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      draggable={!inCombat}
                      onDragStart={(e) => dragStart(e, { from: "bag", id })}
                      onDragEnd={() => setPick(null)}
                      onClick={() => setPick(picked ? null : { from: "bag", id })}
                      disabled={inCombat}
                      className={`tf-bag-item ${picked ? "tf-bag-item-on" : ""}`}
                    >
                      <ShapeIcon def={def} />
                      <span className="min-w-0 text-left">
                        <span className="block text-sm font-bold text-cream">
                          {def.name} <span className="text-faded font-normal">×{n}</span>
                        </span>
                        <span className="block text-[11px] text-faded">
                          {TIER_LABEL[def.tier]} · {def.h}×{def.w}
                        </span>
                        <span className="block text-[11px] text-jade">
                          {Object.entries(tengfuStatValues(def))
                            .map(([k, v]) => statText(k as TengfuStat, v as number))
                            .join(" · ")}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
            {pick?.from === "bag" && <p className="text-xs text-gold mt-2">{t("tengfuPlaceHint")}</p>}
            {inCombat && <p className="text-xs text-vermillion mt-2">{t("tengfuCombatLocked")}</p>}
          </div>
        </>
      )}
    </div>
  );
}

// 符面(5.1 版):有寫實圖(tengfuImages.ts)的用圖片,其餘用 tengfuArt.ts 產生的 SVG(內容皆為程式內常數)
export function TengfuFace({ def }: { def: TengfuDef }) {
  const src = tengfuImageSrc(def.id);
  if (src)
    return (
      <span className="tf-art">
        {/* eslint-disable-next-line @next/next/no-img-element -- 小圖示、已是最終尺寸的 WebP,不需 next/image 轉檔 */}
        <img src={src} alt="" draggable={false} loading="lazy" decoding="async" />
      </span>
    );
  return <span className="tf-art" dangerouslySetInnerHTML={{ __html: tengfuSvg(def) }} />;
}

// 獨立的滕符卡(掉落動畫、預覽用),外觀與符陣上的完全相同,大小依形狀決定
export function TengfuCard({ def, className = "", style }: { def: TengfuDef; className?: string; style?: CSSProperties }) {
  return (
    <span
      className={`tf-piece tf-card ${className}`}
      style={{ "--tw": def.w, "--th": def.h, ...style } as CSSProperties}
    >
      <TengfuFace def={def} />
    </span>
  );
}

// 背包與圖錄用的小圖
function ShapeIcon({ def }: { def: TengfuDef }) {
  return (
    <span className="tf-thumb" style={{ "--tw": def.w, "--th": def.h } as CSSProperties} aria-hidden="true">
      <TengfuFace def={def} />
    </span>
  );
}

// 滕符圖錄:全部滕符、數值與掉落秘境
function TengfuCodex({ lang, owned }: { lang: "zh" | "en"; owned: (id: string) => number }) {
  const statText = useStatText();
  return (
    <div className="space-y-1.5">
      {TENGFU.map((def) => {
        const n = owned(def.id);
        return (
          <div key={def.id} className={`tf-codex-row ${n ? "" : "opacity-60"}`}>
            <ShapeIcon def={def} />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline gap-x-2">
                <span className="font-bold text-cream text-sm">{def.name}</span>
                <span className="text-[11px] text-faded">
                  {TIER_LABEL[def.tier]} · {def.h}×{def.w}
                  {n > 0 && ` · ×${n}`}
                </span>
              </div>
              <p className="text-[11px] text-jade">
                {Object.entries(tengfuStatValues(def))
                  .map(([k, v]) => statText(k as TengfuStat, v as number))
                  .join(" · ")}
              </p>
              <p className="text-[11px] text-faded">
                {tengfuLocationsOf(def.id)
                  .map((id) => {
                    const l = LOCATIONS.find((x) => x.id === id);
                    return l ? locationDisplayName(l, lang) : id;
                  })
                  .join("、")}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
