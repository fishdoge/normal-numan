"use client";

// 4.1 版動態特效:打坐 / 調息 / 雲遊四海的按鈕特效、修為增長浮字、突破成功的「天降鴻運」慶典、
// 斬妖後的戰利品噴發,以及出牌時符寶飛向妖獸的軌跡。全部是純前端表現層,不影響任何伺服器邏輯。
import { CSSProperties, useEffect, useMemo, useState } from "react";
import { itemById, isXuantianArtifact } from "@/game/data/items";
import { isXianItem } from "@/game/types";
import { itemDisplayName } from "@/i18n/itemText";
import { tengfuById } from "@/game/data/tengfu";
import { useT } from "@/i18n/useT";
import type { Language } from "@/i18n/dict";

// 以索引產生的穩定亂數,同一個特效每次重播粒子分佈一致,不必存 state
const rnd = (i: number, salt = 1) => {
  const x = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return x - Math.floor(x);
};
type Vars = CSSProperties & Record<`--${string}`, string | number>;

export type ActionFxKind = "cultivate" | "rest" | "wander" | "break";

// ─── 行動按鈕特效:掛在按鈕所在格(relative)內,播完自行通知移除 ───
export function ActionFx({ kind, onDone }: { kind: ActionFxKind; onDone: () => void }) {
  useEffect(() => {
    const ms = kind === "wander" ? 1500 : 1200;
    const tm = window.setTimeout(onDone, ms);
    return () => window.clearTimeout(tm);
  }, [kind, onDone]);

  if (kind === "cultivate") {
    // 靈氣自四方匯入丹田:粒子由外向中心收束,中心一圈太極法陣旋轉後綻開
    return (
      <span className="fx-layer" aria-hidden="true">
        <span className="fx-taiji" />
        <span className="fx-ring fx-ring-jade" />
        {Array.from({ length: 14 }, (_, i) => {
          const a = (i / 14) * Math.PI * 2;
          const r = 70 + rnd(i) * 40;
          return (
            <span
              key={i}
              className="fx-qi"
              style={
                {
                  "--sx": `${Math.cos(a) * r}px`,
                  "--sy": `${Math.sin(a) * r * 0.6}px`,
                  "--d": `${rnd(i, 2) * 0.35}s`,
                } as Vars
              }
            />
          );
        })}
      </span>
    );
  }
  if (kind === "rest") {
    return (
      <span className="fx-layer" aria-hidden="true">
        <span className="fx-ring fx-ring-water" />
        <span className="fx-ring fx-ring-water" style={{ animationDelay: "0.25s" }} />
      </span>
    );
  }
  if (kind === "wander") {
    // 御劍乘雲:雲氣橫掃 + 一道劍光斜劃而過
    return (
      <span className="fx-layer fx-layer-wide" aria-hidden="true">
        {Array.from({ length: 5 }, (_, i) => (
          <span
            key={i}
            className="fx-cloud"
            style={
              {
                "--y": `${15 + i * 17}%`,
                "--d": `${i * 0.08}s`,
                "--w": `${60 + rnd(i, 3) * 60}px`,
              } as Vars
            }
          />
        ))}
        <span className="fx-sword" />
      </span>
    );
  }
  return (
    <span className="fx-layer" aria-hidden="true">
      <span className="fx-ring fx-ring-gold" />
    </span>
  );
}

// ─── 數值浮字:「修為 +12」「氣血 +30」等 ───
export function GainFloat({
  text,
  tone,
  onDone,
}: {
  text: string;
  tone: string;
  onDone: () => void;
}) {
  return (
    <span className={`fx-gain ${tone}`} onAnimationEnd={onDone} aria-hidden="true">
      {text}
    </span>
  );
}

// ─── 突破成功:天降鴻運 ───
// 金光柱自天而降 → 旋轉霞光 → 銅錢靈石如噴泉般灑落 → 新境界大字落印。點擊任意處可提前收下。
export function BreakthroughCelebration({
  realmName,
  major,
  xian,
  lines = [],
  onDone,
}: {
  realmName: string;
  major: boolean; // 跨越大境界(如築基 → 結丹)時更盛大
  xian: boolean; // 飛昇真仙以上改用仙紫霞光
  lines?: string[]; // 4.2 版:突破結果文字直接放在慶典裡,不再另外跳一次相同內容的彈窗
  onDone: () => void;
}) {
  const t = useT();
  const [canClose, setCanClose] = useState(false);
  useEffect(() => {
    const a = window.setTimeout(() => setCanClose(true), 900);
    const b = window.setTimeout(onDone, major ? 5200 : 4200);
    return () => {
      window.clearTimeout(a);
      window.clearTimeout(b);
    };
  }, [major, onDone]);
  const count = major ? 64 : 40;
  const coins = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const kind = i % 5 === 0 ? "gem" : i % 7 === 0 ? "rune" : "coin";
        return {
          kind,
          style: {
            "--x": `${(rnd(i, 4) - 0.5) * 110}vw`,
            "--peak": `${-30 - rnd(i, 5) * 45}vh`,
            "--r": `${(rnd(i, 6) - 0.5) * 1440}deg`,
            "--d": `${0.55 + rnd(i, 7) * (major ? 1.6 : 1.1)}s`,
            "--s": 0.6 + rnd(i, 8) * 0.9,
            "--t": `${1.8 + rnd(i, 9) * 1.2}s`,
          } as Vars,
          glyph: "福祿壽財運道仙靈"[i % 8],
        };
      }),
    [count, major],
  );
  return (
    <div
      className={`fx-celebrate ${xian ? "fx-celebrate-xian" : ""} ${major ? "fx-celebrate-major" : ""}`}
      onClick={() => canClose && onDone()}
      role="alert"
    >
      <span className="fx-cel-flash" />
      <span className="fx-cel-rays" />
      <span className="fx-cel-pillar" />
      <span className="fx-cel-ring" />
      <span className="fx-cel-ring" style={{ animationDelay: "0.35s" }} />
      <div className="fx-cel-coins" aria-hidden="true">
        {coins.map((c, i) => (
          <span key={i} className={`fx-cel-${c.kind}`} style={c.style}>
            {c.kind === "rune" ? c.glyph : null}
          </span>
        ))}
      </div>
      <div className="fx-cel-copy">
        <p className="fx-cel-eyebrow">{major ? t("fxBreakMajor") : t("fxBreakMinor")}</p>
        <h2 className="fx-cel-realm">{realmName}</h2>
        <p className="fx-cel-sub">{t("fxBreakBlessing")}</p>
        {lines.length > 0 && (
          <div className="fx-cel-lines">
            {lines.slice(0, 3).map((l, i) => (
              <p key={i}>{l}</p>
            ))}
          </div>
        )}
        {canClose && <p className="fx-cel-hint">{t("fxTapContinue")}</p>}
      </div>
    </div>
  );
}

// ─── 突破失敗:靈氣暴走 ───
// 紅光一閃、畫面震動、裂紋自中心迸開,「突破失敗」四字碎裂下墜;播完才顯示失敗明細彈窗。
export function BreakFailFx({ onDone }: { onDone: () => void }) {
  const t = useT();
  useEffect(() => {
    const tm = window.setTimeout(onDone, 1500);
    return () => window.clearTimeout(tm);
  }, [onDone]);
  return (
    <div className="fx-fail" onClick={onDone} role="alert">
      <span className="fx-fail-flash" />
      <svg className="fx-fail-cracks" viewBox="-50 -50 100 100" aria-hidden="true">
        {Array.from({ length: 9 }, (_, i) => {
          const a = (i / 9) * Math.PI * 2 + rnd(i, 21) * 0.5;
          const r1 = 18 + rnd(i, 22) * 10;
          const r2 = 40 + rnd(i, 23) * 18;
          const bend = (rnd(i, 24) - 0.5) * 0.5;
          return (
            <path
              key={i}
              d={`M0 0 L${Math.cos(a) * r1} ${Math.sin(a) * r1} L${Math.cos(a + bend) * r2} ${Math.sin(a + bend) * r2}`}
              style={{ animationDelay: `${0.05 + i * 0.02}s` }}
            />
          );
        })}
      </svg>
      <p className="fx-fail-text">
        {Array.from(t("fxBreakFail")).map((ch, i) => (
          <span key={i} style={{ "--i": i } as Vars}>
            {ch}
          </span>
        ))}
      </p>
    </div>
  );
}

// ─── 斬妖戰利品噴發 ───
// 妖獸潰散成光點 → 靈石、修為、掉落物從中心以拋物線噴出、落成一排 → 交給戰利品彈窗
export interface Rewards {
  exp?: number;
  stones?: number;
  items?: string[];
  tengfu?: string[];
}
type LootVisual = "stone" | "exp" | "jade" | "talisman";
export function LootBurst({
  rewards,
  lord,
  lang,
  onDone,
}: {
  rewards: Rewards;
  lord: boolean;
  lang: Language;
  onDone: () => void;
}) {
  const t = useT();
  useEffect(() => {
    const tm = window.setTimeout(onDone, lord ? 2300 : 1800);
    return () => window.clearTimeout(tm);
  }, [lord, onDone]);
  const tokens: { key: string; label: string; sub: string; cls: string; visual: LootVisual }[] = [];
  if (rewards.stones)
    tokens.push({
      key: "stones",
      label: "",
      sub: `${t("fxStones")} +${rewards.stones}`,
      cls: "fx-loot-stone",
      visual: "stone",
    });
  if (rewards.exp)
    tokens.push({ key: "exp", label: "", sub: `${t("fxExp")} +${rewards.exp}`, cls: "fx-loot-exp", visual: "exp" });
  (rewards.tengfu ?? []).forEach((id, i) => {
    const def = tengfuById(id);
    if (def) tokens.push({ key: `tf-${id}-${i}`, label: def.name[0], sub: def.name, cls: "fx-loot-tf", visual: "talisman" });
  });
  (rewards.items ?? []).forEach((id, i) => {
    const item = itemById(id);
    if (!item) return;
    const cls = isXuantianArtifact(id)
      ? "fx-loot-xuantian"
      : isXianItem(item)
        ? "fx-loot-xian"
        : "fx-loot-item";
    tokens.push({
      key: `${id}-${i}`,
      label: itemDisplayName(item, lang).slice(0, 1),
      sub: itemDisplayName(item, lang),
      cls,
      visual: "jade",
    });
  });
  const n = tokens.length;
  return (
    <div className={`fx-loot ${lord ? "fx-loot-lord" : ""}`} onClick={onDone} aria-hidden="true">
      <span className="fx-loot-shatter" />
      {Array.from({ length: 18 }, (_, i) => (
        <span
          key={i}
          className="fx-loot-spark"
          style={
            {
              "--a": `${(i / 18) * 360}deg`,
              "--len": `${80 + rnd(i, 11) * 120}px`,
              "--d": `${rnd(i, 12) * 0.12}s`,
            } as Vars
          }
        />
      ))}
      <p className="fx-loot-title">{lord ? t("fxLootLord") : t("fxLootTitle")}</p>
      <div className="fx-loot-row">
        {tokens.map((tok, i) => (
          <span
            key={tok.key}
            className={`fx-loot-token ${tok.cls}`}
            style={
              {
                "--fromx": `${(n / 2 - i - 0.5) * 92}px`,
                "--hop": `${-110 - rnd(i, 13) * 80}px`,
                "--d": `${0.25 + i * 0.12}s`,
              } as Vars
            }
          >
            {tok.visual === "stone" || tok.visual === "exp" ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                className="fx-loot-icon"
                src={tok.visual === "stone" ? "/images/icons/spirit-stone.webp" : "/images/icons/cultivation.webp"}
                alt=""
              />
            ) : tok.visual === "talisman" ? (
              <span className="fx-loot-talisman">{tok.label}</span>
            ) : (
              <span className="fx-loot-jade">{tok.label}</span>
            )}
            <span className="fx-loot-sub">{tok.sub}</span>
          </span>
        ))}
        {n === 0 && <span className="fx-loot-empty">{t("fxLootNone")}</span>}
      </div>
    </div>
  );
}

// ─── 出牌飛行:被打出的符寶從手牌位置飛向妖獸法陣,沿途拖曳屬性色光尾,抵達時爆開 ───
export interface CardFlight {
  id: string;
  from: { x: number; y: number; w: number; h: number };
  to: { x: number; y: number };
  art: string;
  color: string;
  delay: number;
}
export function CardFlights({
  flights,
  onDone,
}: {
  flights: CardFlight[];
  onDone: (id: string) => void;
}) {
  return (
    <div className="fx-flight-layer" aria-hidden="true">
      {flights.map((f) => {
        const cx = f.from.x + f.from.w / 2;
        const cy = f.from.y + f.from.h / 2;
        return (
          <span
            key={f.id}
            className="fx-flight"
            style={
              {
                left: cx,
                top: cy,
                width: f.from.w,
                height: f.from.h,
                "--dx": `${f.to.x - cx}px`,
                "--dy": `${f.to.y - cy}px`,
                "--c": f.color,
                "--d": `${f.delay}s`,
                backgroundImage: `url(${f.art})`,
              } as Vars
            }
            onAnimationEnd={(e) => {
              if (e.animationName === "fxFlight") onDone(f.id);
            }}
          />
        );
      })}
    </div>
  );
}
