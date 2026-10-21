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
// 主屬性 → 符紙配色(對應 globals.css 的 .tf-tone-*)
const TONE: Record<TengfuStat, string> = {
  atk: "atk",
  def: "def",
  hp: "hp",
  mp: "mp",
  energy: "energy",
  allEl: "chaos",
  金: "metal",
  木: "wood",
  水: "water",
  火: "fire",
  土: "earth",
  無: "chaos",
};
const TIER_LABEL = ["", "一品", "二品", "三品", "四品", "五品", "六品"];

const primaryStat = (d: TengfuDef) =>
  (Object.entries(d.stats) as [TengfuStat, number][]).sort((a, b) => b[1] - a[1])[0][0];

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
                    className={`tf-piece tf-tone-${TONE[primaryStat(def)]} tf-tier-${def.tier} ${picked ? "tf-piece-picked" : ""}`}
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

// 符紙正面:大字符頭 + 名稱(依形狀自動直書或橫書)
function TengfuFace({ def }: { def: TengfuDef }) {
  const vertical = def.h > def.w;
  return (
    <span className={`tf-face ${vertical ? "tf-face-v" : ""}`}>
      <span className="tf-glyph">{def.name[0]}</span>
      {def.h * def.w > 1 && <span className="tf-name">{def.name}</span>}
    </span>
  );
}

// 背包與圖錄用的小形狀示意
function ShapeIcon({ def }: { def: TengfuDef }) {
  return (
    <span
      className={`tf-shape tf-tone-${TONE[primaryStat(def)]}`}
      style={{ gridTemplateColumns: `repeat(${def.w}, 9px)`, gridTemplateRows: `repeat(${def.h}, 9px)` }}
      aria-hidden="true"
    >
      {Array.from({ length: def.h * def.w }, (_, i) => (
        <span key={i} />
      ))}
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
