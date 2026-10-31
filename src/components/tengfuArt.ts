// 滕符外觀(5.1 版):月夜符籙,每張滕符各有取材自名稱與效果的專屬圖騰(見下方 ART 與 buildTengfuCard 上方說明)。
// 輸出為純 SVG 字串(不依賴 React),元件以 dangerouslySetInnerHTML 掛上;內容全是程式內的常數,沒有使用者輸入。
// 座標系:每格 TENGFU_CELL(120)單位,viewBox = (寬格數 × 120) × (高格數 × 120);符徽圖騰在 100 × 100 的方框內作畫再縮放。
import type { TengfuDef } from "@/game/data/tengfu";

type Motif = { ink: string; accent?: string };
interface Art {
  motif: (W: number, H: number, rnd: () => number) => Motif; // 符徽圖騰(在 100 × 100 的方框內作畫)
  sw?: number; // 圖騰線寬
}

// ── 小工具 ──
const n = (v: number) => Math.round(v * 10) / 10;
const P = (d: string, extra = "") => `<path d="${d}"${extra}/>`;
const C = (cx: number, cy: number, r: number, extra = "") => `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r)}"${extra}/>`;
const L = (x1: number, y1: number, x2: number, y2: number, extra = "") =>
  `<line x1="${n(x1)}" y1="${n(y1)}" x2="${n(x2)}" y2="${n(y2)}"${extra}/>`;
const FILL = ` fill="currentColor" stroke="none"`;
const THIN = ` stroke-width="1.6"`;
const FAINT = ` opacity="0.55"`;
const seedOf = (s: string) => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
};
const rng = (seed: number) => () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
// 波浪線(x0 → x1,在 y 上下起伏)
const wave = (x0: number, x1: number, y: number, amp: number, k: number) => {
  const step = (x1 - x0) / k;
  let d = `M${n(x0)},${n(y)}`;
  for (let i = 0; i < k; i++) d += `q${n(step / 2)},${n(i % 2 ? amp : -amp)} ${n(step)},0`;
  return d;
};
// 四芒星
const star4 = (cx: number, cy: number, r: number) =>
  `M${n(cx)},${n(cy - r)}Q${n(cx + r * 0.18)},${n(cy - r * 0.18)} ${n(cx + r)},${n(cy)}Q${n(cx + r * 0.18)},${n(cy + r * 0.18)} ${n(cx)},${n(cy + r)}Q${n(cx - r * 0.18)},${n(cy + r * 0.18)} ${n(cx - r)},${n(cy)}Q${n(cx - r * 0.18)},${n(cy - r * 0.18)} ${n(cx)},${n(cy - r)}Z`;
const poly = (pts: [number, number][]) => `M${pts.map(([x, y]) => `${n(x)},${n(y)}`).join("L")}Z`;

// ── 五行 / 屬性的輔助色(只用在少數點綴),與遊戲的五行色一致(tailwind.config.ts) ──
const EL = { 金: "#e6c680", 木: "#7fcb8a", 水: "#6fa8dc", 火: "#f07c6c", 土: "#c99a62" };
const fiveDots = (cx: number, cy: number, r: number, dot: number) =>
  (["金", "水", "木", "火", "土"] as const)
    .map((el, i) => {
      const a = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
      return C(cx + Math.cos(a) * r, cy + Math.sin(a) * r, dot, ` fill="${EL[el]}" stroke="none"`);
    })
    .join("");

// ═══ 49 張滕符的符徽圖騰 ═══
const ART: Record<string, Art> = {
  // ── 一品 · 天南 ──
  tf_qingmu: {
    // 青木:嫩芽破土
    motif: (W, H) => ({
      ink:
        P(`M${W / 2},${H * 0.8}V${H * 0.38}`) +
        P(`M${W / 2},${H * 0.52}C${W * 0.36},${H * 0.5} ${W * 0.26},${H * 0.4} ${W * 0.27},${H * 0.28}C${W * 0.4},${H * 0.3} ${W * 0.49},${H * 0.4} ${W / 2},${H * 0.52}Z`, FILL) +
        P(`M${W / 2},${H * 0.42}C${W * 0.62},${H * 0.4} ${W * 0.72},${H * 0.3} ${W * 0.72},${H * 0.2}C${W * 0.6},${H * 0.22} ${W * 0.51},${H * 0.3} ${W / 2},${H * 0.42}Z`, FILL) +
        P(`M${W * 0.3},${H * 0.8}Q${W / 2},${H * 0.74} ${W * 0.7},${H * 0.8}M${W * 0.4},${H * 0.86}Q${W / 2},${H * 0.83} ${W * 0.6},${H * 0.86}`, THIN),
    }),
  },
  tf_ruijin: {
    // 銳金:三重鋒刃
    motif: (W, H) => ({
      ink:
        [0.3, 0.46, 0.62].map((y) => P(`M${W * 0.26},${H * (y + 0.12)}L${W / 2},${H * y}L${W * 0.74},${H * (y + 0.12)}`)).join("") +
        L(W / 2, H * 0.2, W / 2, H * 0.84, THIN),
    }),
    sw: 4,
  },
  tf_hanshui: {
    // 寒水:寒潭漣漪與一滴水
    motif: (W, H) => ({
      ink:
        P(`M${W / 2},${H * 0.2}C${W * 0.6},${H * 0.34} ${W * 0.62},${H * 0.42} ${W / 2},${H * 0.48}C${W * 0.38},${H * 0.42} ${W * 0.4},${H * 0.34} ${W / 2},${H * 0.2}Z`, FILL) +
        P(`M${W * 0.24},${H * 0.64}Q${W / 2},${H * 0.52} ${W * 0.76},${H * 0.64}Q${W / 2},${H * 0.76} ${W * 0.24},${H * 0.64}Z`) +
        P(`M${W * 0.34},${H * 0.64}Q${W / 2},${H * 0.58} ${W * 0.66},${H * 0.64}Q${W / 2},${H * 0.7} ${W * 0.34},${H * 0.64}Z`, THIN),
    }),
  },
  tf_huodan: {
    // 火彈:拖著火舌的火球
    motif: (W, H) => ({
      ink:
        C(W * 0.6, H * 0.6, W * 0.14, FILL) +
        P(`M${W * 0.48},${H * 0.52}Q${W * 0.32},${H * 0.4} ${W * 0.2},${H * 0.42}M${W * 0.47},${H * 0.62}Q${W * 0.3},${H * 0.62} ${W * 0.18},${H * 0.58}M${W * 0.52},${H * 0.71}Q${W * 0.36},${H * 0.8} ${W * 0.24},${H * 0.76}`) +
        C(W * 0.6, H * 0.6, W * 0.22, THIN + FAINT),
    }),
  },
  tf_juqi: {
    // 聚氣:四方靈氣旋入丹田
    motif: (W, H) => {
      const cx = W / 2;
      const cy = H / 2;
      return {
        ink:
          [0, 1, 2, 3]
            .map((i) => {
              const a = (i * Math.PI) / 2;
              const r0 = W * 0.36;
              const x0 = cx + Math.cos(a) * r0;
              const y0 = cy + Math.sin(a) * r0;
              const x1 = cx + Math.cos(a + 1.2) * r0 * 0.45;
              const y1 = cy + Math.sin(a + 1.2) * r0 * 0.45;
              return P(`M${n(x0)},${n(y0)}Q${n(cx + Math.cos(a + 0.9) * r0)},${n(cy + Math.sin(a + 0.9) * r0)} ${n(x1)},${n(y1)}`);
            })
            .join("") + C(cx, cy, W * 0.07, FILL),
      };
    },
  },
  tf_huanyang: {
    // 小還陽:日出、生息之脈
    motif: (W, H) => ({
      ink:
        P(`M${W * 0.24},${H * 0.3}A${W * 0.26},${W * 0.26} 0 0 1 ${W * 0.76},${H * 0.3}Z`, FILL) +
        [-60, -30, 0, 30, 60]
          .map((deg) => {
            const a = ((deg - 90) * Math.PI) / 180;
            return L(W / 2 + Math.cos(a) * W * 0.32, H * 0.3 + Math.sin(a) * W * 0.32, W / 2 + Math.cos(a) * W * 0.42, H * 0.3 + Math.sin(a) * W * 0.42, THIN);
          })
          .join("") +
        L(W * 0.18, H * 0.34, W * 0.82, H * 0.34, THIN) +
        P(`M${W * 0.2},${H * 0.6}H${W * 0.36}L${W * 0.44},${H * 0.48}L${W * 0.54},${H * 0.72}L${W * 0.62},${H * 0.6}H${W * 0.8}`) +
        P(`M${W / 2},${H * 0.78}V${H * 0.9}M${W * 0.4},${H * 0.84}H${W * 0.6}`, THIN),
    }),
  },
  tf_jingang: {
    // 金剛:金剛杵
    motif: (W, H) => {
      const cx = W / 2;
      const prong = (y: number, dir: 1 | -1) =>
        P(`M${cx},${y}Q${cx - W * 0.2},${y + dir * H * 0.08} ${cx - W * 0.1},${y + dir * H * 0.16}M${cx},${y}Q${cx + W * 0.2},${y + dir * H * 0.08} ${cx + W * 0.1},${y + dir * H * 0.16}M${cx},${y}V${y + dir * H * 0.17}`);
      return {
        ink:
          prong(H * 0.2, 1) +
          prong(H * 0.86, -1) +
          L(cx, H * 0.37, cx, H * 0.69) +
          P(`M${cx - W * 0.16},${H * 0.5}H${cx + W * 0.16}M${cx - W * 0.12},${H * 0.56}H${cx + W * 0.12}`, THIN) +
          C(cx, H * 0.53, W * 0.06, FILL),
      };
    },
  },
  tf_qingshen: {
    // 輕身:一根飄羽
    motif: (W, H) => ({
      ink:
        P(`M${W * 0.3},${H * 0.86}Q${W * 0.5},${H * 0.5} ${W * 0.68},${H * 0.14}`) +
        Array.from({ length: 7 }, (_, i) => {
          const t = 0.2 + i * 0.1;
          const x = W * (0.3 + 0.38 * t);
          const y = H * (0.86 - 0.72 * t);
          return P(`M${n(x)},${n(y)}q${n(-W * 0.22)},${n(-H * 0.02)} ${n(-W * 0.26)},${n(-H * 0.09)}M${n(x)},${n(y)}q${n(W * 0.16)},${n(H * 0.03)} ${n(W * 0.22)},${n(H * 0.1)}`, THIN);
        }).join(""),
    }),
  },
  tf_leizhu: {
    // 雷竹:竹簡上劈過一道雷
    motif: (W, H) => ({
      ink:
        [0.3, 0.56, 0.8].map((y) => P(`M8,${n(H * y)}H${W - 8}`, THIN + FAINT)).join("") +
        P(`M${W * 0.6},${H * 0.1}L${W * 0.38},${H * 0.48}H${W * 0.56}L${W * 0.34},${H * 0.9}L${W * 0.72},${H * 0.42}H${W * 0.52}L${W * 0.7},${H * 0.1}Z`, FILL),
    }),
  },
  // ── 二品 · 血色禁地 ──
  tf_xuesha: {
    // 血煞:三道爪痕與血滴
    motif: (W, H) => ({
      ink:
        [0, 1, 2]
          .map((i) => P(`M${W * (0.24 + i * 0.16)},${H * 0.2}Q${W * (0.36 + i * 0.16)},${H * 0.5} ${W * (0.3 + i * 0.16)},${H * 0.8}`, ` stroke-width="${7 - i}"`))
          .join("") +
        [
          [0.76, 0.3, 1],
          [0.8, 0.5, 0.7],
          [0.72, 0.7, 0.85],
        ]
          .map(([x, y, s]) => P(`M${W * x},${H * y - 10 * s}q${6 * s},${9 * s} 0,${15 * s}q${-6 * s},${-6 * s} 0,${-15 * s}Z`, FILL))
          .join(""),
    }),
  },
  tf_houtu: {
    // 厚土:層層夯土上的山
    motif: (W, H) => ({
      ink:
        [0.62, 0.72, 0.82].map((y) => L(10, H * y, W - 10, H * y, THIN + FAINT)).join("") +
        P(`M${W * 0.16},${H * 0.56}L${W * 0.4},${H * 0.24}L${W * 0.52},${H * 0.38}L${W * 0.62},${H * 0.3}L${W * 0.84},${H * 0.56}Z`, FILL) +
        P(`M${W * 0.36},${H * 0.92}H${W * 0.64}`),
    }),
  },
  tf_kugu: {
    // 枯骨鎮魂:脊骨被一枚鎮魂環壓住
    motif: (W, H) => {
      const cx = W / 2;
      const verts = Array.from({ length: 7 }, (_, i) => {
        const y = H * (0.34 + i * 0.085);
        const w = W * (0.13 - i * 0.008);
        return P(`M${n(cx - w)},${n(y)}h${n(w * 2)}l-4,${n(H * 0.05)}h${n(-w * 2 + 8)}Z`, FILL) + P(`M${n(cx - w)},${n(y + 6)}q${n(-W * 0.18)},${n(H * 0.02)} ${n(-W * 0.22)},${n(H * 0.07)}M${n(cx + w)},${n(y + 6)}q${n(W * 0.18)},${n(H * 0.02)} ${n(W * 0.22)},${n(H * 0.07)}`, THIN + FAINT);
      }).join("");
      return {
        ink: C(cx, H * 0.18, W * 0.14) + C(cx, H * 0.18, W * 0.06, FILL) + L(cx, H * 0.26, cx, H * 0.32) + verts,
      };
    },
  },
  tf_canfu: {
    // 禁地殘符:殘缺的五行陣
    motif: (W, H) => {
      const pts = [0, 1, 2, 3, 4].map((i) => {
        const a = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
        return [W * 0.46 + Math.cos(a) * W * 0.27, H * 0.54 + Math.sin(a) * H * 0.27] as [number, number];
      });
      return {
        ink: P(`M${n(pts[1][0])},${n(pts[1][1])}L${n(pts[2][0])},${n(pts[2][1])}L${n(pts[3][0])},${n(pts[3][1])}L${n(pts[4][0])},${n(pts[4][1])}`) + P(`M${n(pts[4][0])},${n(pts[4][1])}L${n(pts[1][0])},${n(pts[1][1])}`, THIN + ` stroke-dasharray="3 5"`),
        accent: fiveDots(W * 0.46, H * 0.54, W * 0.27, 4),
      };
    },
  },
  // ── 三品 · 亂星海 ──
  tf_xingchen: {
    // 星辰:北斗七星
    motif: (W, H) => {
      const s: [number, number][] = [
        [0.18, 0.3],
        [0.32, 0.36],
        [0.44, 0.44],
        [0.56, 0.5],
        [0.62, 0.7],
        [0.82, 0.74],
        [0.84, 0.54],
      ];
      return {
        ink:
          P(`M${s.map(([x, y]) => `${n(W * x)},${n(H * y)}`).join("L")}L${n(W * s[3][0])},${n(H * s[3][1])}`, THIN) +
          s.map(([x, y], i) => P(star4(W * x, H * y, i === 0 ? 11 : 7), FILL)).join("") +
          C(W * 0.24, H * 0.76, 2.5, FILL + FAINT) +
          C(W * 0.7, H * 0.2, 2, FILL + FAINT),
      };
    },
  },
  tf_chaoxi: {
    // 潮汐:月下層層潮浪
    motif: (W, H) => ({
      ink:
        P(`M${W * 0.62},${H * 0.05}A${W * 0.2},${W * 0.2} 0 1 0 ${W * 0.62},${H * 0.15}A${W * 0.15},${W * 0.15} 0 1 1 ${W * 0.62},${H * 0.05}Z`, FILL) +
        [0.24, 0.36, 0.48, 0.6, 0.72, 0.84].map((y, i) => P(wave(W * 0.16, W * 0.84, H * y, 8, 4), i % 2 ? THIN : "")).join(""),
    }),
  },
  tf_zhenhai: {
    // 星宮鎮海:海眼漩渦被一方鎮印壓住
    motif: (W, H) => {
      const cx = W / 2;
      const cy = H * 0.5;
      return {
        ink:
          P(wave(W * 0.08, W * 0.92, H * 0.84, 7, 10), THIN) +
          P(wave(W * 0.08, W * 0.92, H * 0.16, 7, 10), THIN) +
          [0.3, 0.22, 0.14].map((r) => C(cx, cy, H * r, THIN + FAINT)).join("") +
          `<rect x="${cx - H * 0.15}" y="${cy - H * 0.15}" width="${H * 0.3}" height="${H * 0.3}" fill="currentColor" stroke="none" transform="rotate(45 ${cx} ${cy})"/>` +
          L(W * 0.14, cy, cx - H * 0.24, cy) +
          L(cx + H * 0.24, cy, W * 0.86, cy),
      };
    },
  },
  tf_xunhai: {
    // 巡海:一葉帆舟
    motif: (W, H) => ({
      ink:
        L(W * 0.5, H * 0.14, W * 0.5, H * 0.58) +
        P(`M${W * 0.52},${H * 0.16}Q${W * 0.82},${H * 0.34} ${W * 0.76},${H * 0.54}H${W * 0.52}Z`, FILL) +
        P(`M${W * 0.46},${H * 0.24}Q${W * 0.26},${H * 0.4} ${W * 0.3},${H * 0.54}H${W * 0.46}Z`, FILL + FAINT) +
        P(`M${W * 0.2},${H * 0.62}H${W * 0.8}L${W * 0.68},${H * 0.68}H${W * 0.32}Z`, FILL) +
        P(wave(W * 0.16, W * 0.84, H * 0.74, 4, 4), THIN),
    }),
  },
  tf_luoxing: {
    // 落星:一道流星橫貫五格
    motif: (W, H) => ({
      ink:
        P(`M${W * 0.06},${H * 0.3}L${W * 0.82},${H * 0.52}`, THIN + FAINT) +
        P(`M${W * 0.14},${H * 0.66}L${W * 0.82},${H * 0.54}`, THIN + FAINT) +
        P(`M${W * 0.02},${H * 0.5}L${W * 0.84},${H * 0.53}`) +
        P(star4(W * 0.87, H * 0.53, 30), FILL) +
        [0.2, 0.36, 0.5, 0.64].map((x, i) => C(W * x, H * (i % 2 ? 0.26 : 0.78), 2.5, FILL + FAINT)).join(""),
    }),
  },
  tf_dimai: {
    // 地脈:岩碑中蜿蜒的地脈
    motif: (W, H) => ({
      ink:
        P(`M${W * 0.5},${H * 0.04}C${W * 0.2},${H * 0.2} ${W * 0.8},${H * 0.34} ${W * 0.46},${H * 0.5}S${W * 0.28},${H * 0.8} ${W * 0.54},${H * 0.96}`) +
        P(`M${W * 0.56},${H * 0.3}Q${W * 0.8},${H * 0.36} ${W * 0.84},${H * 0.44}M${W * 0.42},${H * 0.66}Q${W * 0.2},${H * 0.7} ${W * 0.16},${H * 0.78}M${W * 0.48},${H * 0.16}Q${W * 0.28},${H * 0.14} ${W * 0.18},${H * 0.2}`, THIN) +
        [0.3, 0.5, 0.7].map((t) => C(W * 0.5, H * t, 6, FILL)).join(""),
    }),
  },
  // ── 四品 · 大晉 / 魔淵 / 陰界 ──
  tf_foguang: {
    // 佛光:蓮台與圓光
    motif: (W, H) => {
      const cx = W / 2;
      const rays = Array.from({ length: 16 }, (_, i) => {
        const a = (i * Math.PI) / 8;
        return L(cx + Math.cos(a) * W * 0.24, H * 0.4 + Math.sin(a) * W * 0.24, cx + Math.cos(a) * W * 0.34, H * 0.4 + Math.sin(a) * W * 0.34, THIN + FAINT);
      }).join("");
      const petal = (dx: number, h: number) =>
        P(`M${cx + dx},${H * 0.8}Q${cx + dx - W * 0.09},${H * 0.8 - h * 0.5} ${cx + dx},${H * 0.8 - h}Q${cx + dx + W * 0.09},${H * 0.8 - h * 0.5} ${cx + dx},${H * 0.8}Z`, FILL);
      return {
        ink: C(cx, H * 0.4, W * 0.18) + rays + petal(0, H * 0.3) + petal(-W * 0.12, H * 0.2) + petal(W * 0.12, H * 0.2) + P(`M${cx - W * 0.24},${H * 0.82}H${cx + W * 0.24}`),
      };
    },
  },
  tf_xuanmen: {
    // 道門玄符:太極與八卦
    motif: (W, H) => {
      const cx = W / 2;
      const cy = H * 0.5;
      const r = W * 0.22;
      const tri = [7, 3, 5, 6, 0, 4, 2, 1]
        .map((bits, i) => {
          const a = -Math.PI / 2 + (i * Math.PI) / 4;
          const R = W * 0.36;
          const x = cx + Math.cos(a) * R;
          const y = cy + Math.sin(a) * R;
          const deg = (a * 180) / Math.PI + 90;
          return `<g transform="translate(${n(x)} ${n(y)}) rotate(${n(deg)})">${[0, 1, 2]
            .map((k) => (bits >> k) & 1 ? L(-9, -6 + k * 6, 9, -6 + k * 6, THIN) : L(-9, -6 + k * 6, -2, -6 + k * 6, THIN) + L(2, -6 + k * 6, 9, -6 + k * 6, THIN))
            .join("")}</g>`;
        })
        .join("");
      return {
        ink:
          C(cx, cy, r) +
          P(`M${cx},${cy - r}A${r / 2},${r / 2} 0 0 1 ${cx},${cy}A${r / 2},${r / 2} 0 0 0 ${cx},${cy + r}A${r},${r} 0 0 1 ${cx},${cy - r}Z`, FILL) +
          C(cx, cy - r / 2, r * 0.14) +
          C(cx, cy + r / 2, r * 0.14, FILL) +
          tri,
      };
    },
  },
  tf_moyan: {
    // 魔焰:繞符而燃的黑焰
    motif: (W, H) => ({
      ink:
        P(`M${W / 2},${H * 0.12}C${W * 0.82},${H * 0.36} ${W * 0.78},${H * 0.64} ${W / 2},${H * 0.86}C${W * 0.22},${H * 0.64} ${W * 0.3},${H * 0.42} ${W * 0.44},${H * 0.32}C${W * 0.42},${H * 0.5} ${W * 0.52},${H * 0.56} ${W / 2},${H * 0.36}Z`, FILL) +
        P(`M${W / 2},${H * 0.5}C${W * 0.64},${H * 0.6} ${W * 0.62},${H * 0.72} ${W / 2},${H * 0.8}C${W * 0.38},${H * 0.72} ${W * 0.4},${H * 0.62} ${W / 2},${H * 0.5}Z`, ` fill="#2f2a28" stroke="none"`),
    }),
  },
  tf_tianlei: {
    // 天雷:雷雲與貫穿的雷霆
    motif: (W, H) => ({
      ink:
        P(`M${W * 0.2},${H * 0.14}a${W * 0.12},${W * 0.12} 0 0 1 ${W * 0.2},-${H * 0.04}a${W * 0.16},${W * 0.16} 0 0 1 ${W * 0.3},${H * 0.02}a${W * 0.1},${W * 0.1} 0 0 1 ${W * 0.1},${H * 0.06}Z`, FILL) +
        P(`M${W * 0.56},${H * 0.18}L${W * 0.34},${H * 0.44}H${W * 0.54}L${W * 0.3},${H * 0.7}H${W * 0.5}L${W * 0.36},${H * 0.94}L${W * 0.74},${H * 0.62}H${W * 0.54}L${W * 0.76},${H * 0.4}H${W * 0.58}L${W * 0.7},${H * 0.18}Z`, FILL) +
        C(W * 0.2, H * 0.5, 5, THIN) +
        C(W * 0.8, H * 0.76, 5, THIN),
    }),
  },
  tf_jiuyou: {
    // 九幽:九道幽冥之門,五行霧氣穿行其間
    motif: (W, H) => ({
      ink:
        Array.from({ length: 9 }, (_, i) => {
          const x = W * (0.08 + i * 0.105);
          return P(`M${n(x - 12)},${H * 0.72}V${H * 0.42}A12,12 0 0 1 ${n(x + 12)},${H * 0.42}V${H * 0.72}`, THIN);
        }).join("") + P(wave(W * 0.04, W * 0.96, H * 0.6, 10, 9), ` opacity="0.8"`),
      accent: (["金", "水", "木", "火", "土"] as const).map((el, i) => C(W * (0.2 + i * 0.15), H * 0.26, 4.5, ` fill="${EL[el]}" stroke="none"`)).join(""),
    }),
  },
  tf_longwen: {
    // 大晉龍紋:S 形龍身逐珠
    motif: (W, H) => ({
      ink:
        P(`M${W * 0.12},${H * 0.66}C${W * 0.26},${H * 0.2} ${W * 0.42},${H * 0.2} ${W * 0.5},${H * 0.5}S${W * 0.74},${H * 0.82} ${W * 0.84},${H * 0.36}`, ` stroke-width="11"`) +
        P(`M${W * 0.12},${H * 0.66}C${W * 0.26},${H * 0.2} ${W * 0.42},${H * 0.2} ${W * 0.5},${H * 0.5}S${W * 0.74},${H * 0.82} ${W * 0.84},${H * 0.36}`, ` stroke="#c4a35a" stroke-width="2.5" stroke-dasharray="5 7" opacity="0.7"`) +
        [0.2, 0.3, 0.4, 0.58, 0.68, 0.76].map((x) => {
          // 沿龍身上緣的背鰭
          const y = x < 0.5 ? 0.62 - Math.sin(((x - 0.12) / 0.38) * Math.PI) * 0.3 : 0.5 + Math.sin(((x - 0.5) / 0.34) * Math.PI) * 0.24;
          return P(`M${n(W * x - 6)},${n(H * y - 4)}l6,-14l6,14Z`, FILL);
        }).join("") +
        P(`M${W * 0.84},${H * 0.36}l${W * 0.04},-${H * 0.12}M${W * 0.84},${H * 0.36}l${W * 0.07},-${H * 0.04}`, THIN) +
        C(W * 0.92, H * 0.68, H * 0.08, FILL) +
        P(`M${W * 0.92},${H * 0.56}q4,-8 0,-12M${W * 0.88},${H * 0.58}q-2,-8 -6,-10`, THIN),
    }),
  },
  tf_huangsha: {
    // 黃沙:沙丘與風中沙粒
    motif: (W, H, rnd) => ({
      ink:
        P(`M${W * 0.08},${H * 0.66}Q${W * 0.36},${H * 0.5} ${W * 0.6},${H * 0.62}T${W * 0.92},${H * 0.58}`) +
        P(`M${W * 0.08},${H * 0.8}Q${W * 0.44},${H * 0.66} ${W * 0.92},${H * 0.76}`, THIN) +
        Array.from({ length: 16 }, () => C(W * (0.12 + rnd() * 0.76), H * (0.12 + rnd() * 0.36), 1.2 + rnd() * 1.6, FILL)).join("") +
        P(`M${W * 0.16},${H * 0.3}q${W * 0.3},-${H * 0.06} ${W * 0.6},0`, THIN + FAINT),
    }),
  },
  // ── 五品 · 靈界 ──
  tf_tianyuan: {
    // 天淵:一劍直指深淵
    motif: (W, H) => ({
      ink:
        P(`M${W * 0.22},${H * 0.36}L${W / 2},${H * 0.86}L${W * 0.78},${H * 0.36}`, THIN + FAINT) +
        P(`M${W / 2},${H * 0.18}V${H * 0.72}`, ` stroke-width="5"`) +
        P(`M${W * 0.36},${H * 0.3}H${W * 0.64}`) +
        P(`M${W / 2 - 5},${H * 0.66}L${W / 2},${H * 0.78}L${W / 2 + 5},${H * 0.66}Z`, FILL),
    }),
  },
  tf_feisheng: {
    // 飛昇:天梯盡頭的仙門
    motif: (W, H) => ({
      ink:
        P(`M${W * 0.3},${H * 0.42}V${H * 0.24}H${W * 0.7}V${H * 0.42}`) +
        L(W * 0.24, H * 0.24, W * 0.76, H * 0.24) +
        Array.from({ length: 6 }, (_, i) => L(W * (0.32 - i * 0.03), H * (0.5 + i * 0.07), W * (0.68 + i * 0.03), H * (0.5 + i * 0.07), THIN)).join("") +
        [-0.14, 0, 0.14].map((dx) => L(W * (0.5 + dx), H * 0.14, W * (0.5 + dx * 1.6), H * 0.06, THIN + FAINT)).join(""),
      accent: fiveDots(W / 2, H * 0.33, W * 0.1, 2.6),
    }),
  },
  tf_fengyuan: {
    // 風元:三道捲風
    motif: (W, H) => ({
      ink: [0.26, 0.5, 0.74]
        .map((y, i) => {
          const x0 = W * (i % 2 ? 0.8 : 0.2);
          const dir = i % 2 ? -1 : 1;
          return P(`M${n(x0)},${n(H * y)}H${n(W / 2 + dir * W * 0.1)}a${n(W * 0.14)},${n(W * 0.14)} 0 1 ${dir > 0 ? 0 : 1} ${n(dir * -W * 0.02)},${n(-W * 0.2)}a${n(W * 0.07)},${n(W * 0.07)} 0 1 ${dir > 0 ? 0 : 1} ${n(dir * -W * 0.08)},${n(W * 0.08)}`);
        })
        .join(""),
    }),
  },
  tf_muling: {
    // 木靈:古樹之心與年輪
    motif: (W, H) => {
      const cx = W / 2;
      return {
        ink:
          [W * 0.13, W * 0.09, W * 0.05].map((r) => C(cx, H * 0.6, r, THIN)).join("") +
          P(`M${cx - W * 0.05},${H * 0.46}Q${cx - W * 0.06},${H * 0.34} ${cx - W * 0.2},${H * 0.28}M${cx + W * 0.05},${H * 0.46}Q${cx + W * 0.06},${H * 0.34} ${cx + W * 0.2},${H * 0.28}M${cx},${H * 0.47}V${H * 0.2}`) +
          [
            [-0.2, 0.24, 0.1],
            [0.2, 0.24, 0.1],
            [0, 0.16, 0.11],
          ]
            .map(([dx, y, r]) => C(cx + W * dx, H * y, W * r, FILL + FAINT))
            .join("") +
          P(`M${cx - W * 0.1},${H * 0.72}Q${cx - W * 0.16},${H * 0.84} ${cx - W * 0.3},${H * 0.88}M${cx + W * 0.1},${H * 0.72}Q${cx + W * 0.16},${H * 0.84} ${cx + W * 0.3},${H * 0.88}M${cx},${H * 0.74}V${H * 0.9}`, THIN),
      };
    },
  },
  tf_yecha: {
    // 夜叉戰符:三叉戟與血紋
    motif: (W, H) => {
      const cx = W / 2;
      return {
        ink:
          L(cx, H * 0.22, cx, H * 0.8, ` stroke-width="5"`) +
          P(`M${cx - W * 0.22},${H * 0.12}V${H * 0.24}Q${cx - W * 0.22},${H * 0.3} ${cx},${H * 0.3}Q${cx + W * 0.22},${H * 0.3} ${cx + W * 0.22},${H * 0.24}V${H * 0.12}`) +
          P(`M${cx},${H * 0.08}l-6,12h12Z`, FILL) +
          P(`M${cx - W * 0.22 - 5},${H * 0.12}l5,-10l5,10ZM${cx + W * 0.22 - 5},${H * 0.12}l5,-10l5,10Z`, FILL) +
          [0.42, 0.52, 0.62].map((y) => P(`M${W * 0.14},${H * y}l${W * 0.12},${H * 0.04}l-${W * 0.12},${H * 0.04}M${W * 0.86},${H * y}l-${W * 0.12},${H * 0.04}l${W * 0.12},${H * 0.04}`, THIN)).join(""),
      };
    },
  },
  tf_feiling: {
    // 飛靈:長羽翼紋
    motif: (W, H) => ({
      ink:
        L(W / 2, H * 0.08, W / 2, H * 0.94) +
        Array.from({ length: 13 }, (_, i) => {
          const y = H * (0.14 + i * 0.06);
          const s = 1 - Math.abs(i - 6) / 12;
          return P(`M${W / 2},${n(y)}l${n(-W * 0.32 * s)},${n(H * 0.05)}M${W / 2},${n(y)}l${n(W * 0.32 * s)},${n(H * 0.05)}`, THIN);
        }).join(""),
    }),
  },
  tf_jiaochi: {
    // 角蚩戰符:一對蠻角與戰斧
    motif: (W, H) => {
      const cx = W / 2;
      return {
        ink:
          P(`M${cx - W * 0.06},${H * 0.5}C${cx - W * 0.22},${H * 0.5} ${cx - W * 0.34},${H * 0.36} ${cx - W * 0.3},${H * 0.12}C${cx - W * 0.24},${H * 0.3} ${cx - W * 0.16},${H * 0.38} ${cx - W * 0.06},${H * 0.4}Z`, FILL) +
          P(`M${cx + W * 0.06},${H * 0.5}C${cx + W * 0.22},${H * 0.5} ${cx + W * 0.34},${H * 0.36} ${cx + W * 0.3},${H * 0.12}C${cx + W * 0.24},${H * 0.3} ${cx + W * 0.16},${H * 0.38} ${cx + W * 0.06},${H * 0.4}Z`, FILL) +
          L(cx, H * 0.3, cx, H * 0.86, ` stroke-width="4"`) +
          P(`M${cx},${H * 0.54}Q${cx + W * 0.14},${H * 0.5} ${cx + W * 0.13},${H * 0.66}Q${cx + W * 0.06},${H * 0.62} ${cx},${H * 0.66}Z`, FILL) +
          P(`M${W * 0.08},${H * 0.9}${Array.from({ length: 12 }, (_, i) => `L${n(W * (0.08 + (i + 0.5) * 0.07))},${n(H * (i % 2 ? 0.9 : 0.82))}`).join("")}`, THIN),
      };
    },
  },
  tf_minghe: {
    // 冥河:靜水上漂著河燈
    motif: (W, H) => ({
      ink:
        P(wave(W * 0.03, W * 0.97, H * 0.62, 6, 14), THIN) +
        P(wave(W * 0.03, W * 0.97, H * 0.76, 5, 18), THIN + FAINT) +
        [0.18, 0.42, 0.66, 0.86]
          .map((x) => P(`M${W * x - 12},${H * 0.56}h24l-5,-12h-14Z`, FILL) + P(`M${W * x},${H * 0.42}q4,-8 0,-14q-4,6 0,14Z`, FILL + FAINT))
          .join(""),
    }),
  },
  tf_xueyu: {
    // 血獄:牢籠中奔湧的血
    motif: (W, H) => ({
      ink:
        P(`M${W / 2},${H * 0.22}C${W * 0.72},${H * 0.46} ${W * 0.7},${H * 0.66} ${W / 2},${H * 0.76}C${W * 0.3},${H * 0.66} ${W * 0.28},${H * 0.46} ${W / 2},${H * 0.22}Z`, FILL) +
        [0.24, 0.38, 0.62, 0.76].map((x) => L(W * x, H * 0.14, W * x, H * 0.86, ` stroke="#9aa79a" stroke-width="3"`)).join("") +
        L(W * 0.16, H * 0.14, W * 0.84, H * 0.14, ` stroke="#9aa79a" stroke-width="3"`) +
        L(W * 0.16, H * 0.86, W * 0.84, H * 0.86, ` stroke="#9aa79a" stroke-width="3"`),
    }),
  },
  tf_jiulong: {
    // 九龍:九道龍爪環繞龍珠
    motif: (W, H) => {
      const cx = W / 2;
      const cy = H * 0.5;
      return {
        ink:
          C(cx, cy, W * 0.13, FILL) +
          C(cx, cy, W * 0.3, THIN + FAINT) +
          Array.from({ length: 9 }, (_, i) => {
            const a = (i * 2 * Math.PI) / 9 - Math.PI / 2;
            const r0 = W * 0.2;
            const r1 = W * 0.4;
            return P(`M${n(cx + Math.cos(a) * r0)},${n(cy + Math.sin(a) * r0)}Q${n(cx + Math.cos(a + 0.35) * r1)},${n(cy + Math.sin(a + 0.35) * r1)} ${n(cx + Math.cos(a + 0.12) * r1 * 1.05)},${n(cy + Math.sin(a + 0.12) * r1 * 1.05)}`);
          }).join(""),
        accent: fiveDots(cx, cy, W * 0.07, 2.4),
      };
    },
  },
  tf_tianding: {
    // 天鼎:三足古鼎、饕餮紋、裊裊鼎煙
    motif: (W, H) => {
      const cx = W / 2;
      return {
        ink:
          P(`M${cx - W * 0.2},${H * 0.42}H${cx + W * 0.2}Q${cx + W * 0.2},${H * 0.74} ${cx},${H * 0.74}Q${cx - W * 0.2},${H * 0.74} ${cx - W * 0.2},${H * 0.42}Z`, FILL) +
          P(`M${cx - W * 0.16},${H * 0.42}V${H * 0.32}h${W * 0.06}v${H * 0.1}M${cx + W * 0.16},${H * 0.42}V${H * 0.32}h-${W * 0.06}v${H * 0.1}`) +
          P(`M${cx - W * 0.12},${H * 0.7}L${cx - W * 0.16},${H * 0.88}M${cx + W * 0.12},${H * 0.7}L${cx + W * 0.16},${H * 0.88}M${cx},${H * 0.74}V${H * 0.88}`, ` stroke-width="5"`) +
          P(`M${cx - W * 0.12},${H * 0.54}h${W * 0.06}v${H * 0.06}h-${W * 0.06}ZM${cx + W * 0.06},${H * 0.54}h${W * 0.06}v${H * 0.06}h-${W * 0.06}Z`, ` stroke="#6f8d7f" stroke-width="2.5"`) +
          P(`M${cx - W * 0.06},${H * 0.28}q-${W * 0.04},-${H * 0.08} 0,-${H * 0.14}t0,-${H * 0.1}M${cx + W * 0.06},${H * 0.28}q${W * 0.04},-${H * 0.08} 0,-${H * 0.14}`, THIN + FAINT) +
          P(`M${W * 0.08},${H * 0.92}H${W * 0.92}`, THIN),
      };
    },
  },
  // ── 六品 · 仙域 ──
  tf_xuanbing: {
    // 玄冰:六角冰晶
    motif: (W, H) => {
      const cx = W / 2;
      const cy = H / 2;
      const r = W * 0.34;
      return {
        ink: Array.from({ length: 6 }, (_, i) => {
          const a = (i * Math.PI) / 3;
          const x = cx + Math.cos(a) * r;
          const y = cy + Math.sin(a) * r;
          const b = (t: number, s: number) => {
            const px = cx + Math.cos(a) * r * t;
            const py = cy + Math.sin(a) * r * t;
            return L(px, py, px + Math.cos(a + 0.7) * s, py + Math.sin(a + 0.7) * s, THIN) + L(px, py, px + Math.cos(a - 0.7) * s, py + Math.sin(a - 0.7) * s, THIN);
          };
          return L(cx, cy, x, y) + b(0.5, W * 0.1) + b(0.78, W * 0.07);
        }).join("") + P(poly(Array.from({ length: 6 }, (_, i) => [cx + Math.cos((i * Math.PI) / 3 + Math.PI / 6) * W * 0.09, cy + Math.sin((i * Math.PI) / 3 + Math.PI / 6) * W * 0.09] as [number, number])), FILL),
      };
    },
  },
  tf_beihan: {
    // 北寒仙尊:雪峰、孤松、寒月
    motif: (W, H) => ({
      ink:
        C(W * 0.7, H * 0.24, W * 0.1) +
        P(`M${W * 0.08},${H * 0.66}L${W * 0.38},${H * 0.34}L${W * 0.52},${H * 0.48}L${W * 0.64},${H * 0.4}L${W * 0.92},${H * 0.66}Z`, FILL + ` opacity="0.35"`) +
        P(`M${W * 0.31},${H * 0.42}L${W * 0.38},${H * 0.34}L${W * 0.46},${H * 0.43}L${W * 0.41},${H * 0.41}L${W * 0.37},${H * 0.45}Z`, ` fill="#e2e7e1" stroke="none"`) +
        L(W * 0.5, H * 0.92, W * 0.5, H * 0.5, ` stroke-width="4"`) +
        [0.56, 0.66, 0.76].map((y, i) => P(`M${W * (0.3 - i * 0.04)},${H * y}L${W / 2},${H * (y - 0.1)}L${W * (0.7 + i * 0.04)},${H * y}Z`, FILL)).join(""),
    }),
  },
  tf_jinyuan: {
    // 金源仙符:金氣沖霄
    motif: (W, H) => ({
      ink:
        [0.86, 0.74, 0.62].map((y, i) => `<rect x="${W * (0.24 + i * 0.05)}" y="${H * y}" width="${W * (0.52 - i * 0.1)}" height="${H * 0.07}" rx="4" fill="currentColor" stroke="none"/>`).join("") +
        P(`M${W / 2},${H * 0.58}V${H * 0.08}`, ` stroke-width="5"`) +
        P(`M${W * 0.34},${H * 0.56}Q${W * 0.26},${H * 0.34} ${W * 0.38},${H * 0.16}M${W * 0.66},${H * 0.56}Q${W * 0.74},${H * 0.34} ${W * 0.62},${H * 0.16}`, THIN) +
        P(`M${W / 2},${H * 0.04}l-9,14h18Z`, FILL),
    }),
  },
  tf_wuchong: {
    // 五重仙關:一劍貫穿五道仙門
    motif: (W, H) => ({
      ink:
        Array.from({ length: 5 }, (_, i) => {
          const x = W * (0.12 + i * 0.18);
          return P(`M${n(x - 18)},${H * 0.84}V${H * 0.36}H${n(x + 18)}V${H * 0.84}M${n(x - 24)},${H * 0.3}H${n(x + 24)}`, THIN);
        }).join("") +
        L(W * 0.03, H * 0.6, W * 0.9, H * 0.6, ` stroke-width="5"`) +
        P(`M${W * 0.9},${H * 0.6 - 7}l${W * 0.06},7l-${W * 0.06},7Z`, FILL),
    }),
  },
  tf_jindi: {
    // 金源帝符:展開的帝詔與方印
    motif: (W, H) => {
      const cx = W / 2;
      const cy = H * 0.5;
      return {
        ink:
          `<rect x="${cx - H * 0.18}" y="${cy - H * 0.18}" width="${H * 0.36}" height="${H * 0.36}" rx="4"/>` +
          P(`M${cx - H * 0.1},${cy - H * 0.06}h${H * 0.2}M${cx},${cy - H * 0.12}v${H * 0.24}M${cx - H * 0.08},${cy + H * 0.04}h${H * 0.16}`, THIN) +
          Array.from({ length: 12 }, (_, i) => {
            const a = (i * Math.PI) / 6;
            return L(cx + Math.cos(a) * H * 0.26, cy + Math.sin(a) * H * 0.26, cx + Math.cos(a) * H * 0.36, cy + Math.sin(a) * H * 0.36, THIN + FAINT);
          }).join("") +
          [0.16, 0.24, 0.76, 0.84].map((x) => L(W * x, H * 0.22, W * x, H * 0.78, THIN + FAINT)).join(""),
        accent: (["金", "水", "木", "火", "土"] as const).map((el, i) => C(W * (0.36 + i * 0.07), H * 0.88, 3.5, ` fill="${EL[el]}" stroke="none"`)).join(""),
      };
    },
  },
  tf_tianhu: {
    // 天狐:狐面與狐火
    motif: (W, H) => ({
      ink:
        P(`M${W * 0.22},${H * 0.42}L${W * 0.28},${H * 0.2}L${W * 0.42},${H * 0.32}H${W * 0.58}L${W * 0.72},${H * 0.2}L${W * 0.78},${H * 0.42}Q${W * 0.74},${H * 0.54} ${W / 2},${H * 0.62}Q${W * 0.26},${H * 0.54} ${W * 0.22},${H * 0.42}Z`, FILL) +
        P(`M${W * 0.36},${H * 0.42}l${W * 0.08},${H * 0.02}M${W * 0.64},${H * 0.42}l-${W * 0.08},${H * 0.02}`, ` stroke="#c07a47" stroke-width="3"`) +
        [0.26, 0.5, 0.74].map((x, i) => P(`M${W * x},${H * 0.9}q-9,-12 0,-${H * (0.12 + (i % 2) * 0.04)}q9,12 0,${H * (0.12 + (i % 2) * 0.04)}Z`, FILL + FAINT)).join(""),
    }),
  },
  tf_zhenlong: {
    // 真龍:一片逆鱗
    motif: (W, H) => ({
      ink:
        [0.34, 0.5, 0.66]
          .map((y, row) =>
            Array.from({ length: 3 - (row === 2 ? 1 : 0) }, (_, i) => {
              const k = 3 - (row === 2 ? 1 : 0);
              const x = W * (0.5 + (i - (k - 1) / 2) * 0.22);
              return P(`M${n(x - W * 0.11)},${n(H * y)}Q${n(x)},${n(H * (y + 0.12))} ${n(x + W * 0.11)},${n(H * y)}`, THIN);
            }).join(""),
          )
          .join("") +
        P(`M${W / 2},${H * 0.76}Q${W * 0.58},${H * 0.84} ${W / 2},${H * 0.9}Q${W * 0.42},${H * 0.84} ${W / 2},${H * 0.76}Z`, FILL) +
        P(`M${W * 0.3},${H * 0.22}Q${W / 2},${H * 0.3} ${W * 0.7},${H * 0.22}`),
    }),
  },
  tf_baxia: {
    // 霸下:龜甲紋上負著石碑
    motif: (W, H) => {
      const hex = (cx: number, cy: number, r: number) =>
        P(poly(Array.from({ length: 6 }, (_, i) => [cx + Math.cos((i * Math.PI) / 3) * r, cy + Math.sin((i * Math.PI) / 3) * r] as [number, number])), THIN + FAINT);
      const r = H * 0.14;
      let shell = "";
      for (let col = 0; col < 7; col++)
        for (let row = 0; row < 3; row++) shell += hex(W * 0.08 + col * r * 1.5, H * 0.2 + row * r * 1.73 + (col % 2 ? r * 0.87 : 0), r * 0.94);
      return {
        ink:
          shell +
          `<rect x="${W * 0.42}" y="${H * 0.16}" width="${W * 0.16}" height="${H * 0.6}" rx="3" fill="currentColor" stroke="none"/>` +
          P(`M${W * 0.36},${H * 0.82}H${W * 0.64}L${W * 0.6},${H * 0.76}H${W * 0.4}Z`, FILL) +
          [0.28, 0.38, 0.48, 0.58].map((y) => L(W * 0.46, H * y, W * 0.54, H * y, ` stroke="#5d6058" stroke-width="2"`)).join(""),
      };
    },
  },
  tf_pixiu: {
    // 貔貅:獨角獸首張口,銜住一枚方孔錢;黑眼
    motif: (W, H) => {
      const cx = W / 2;
      return {
        ink:
          P(`M${W * 0.2},${H * 0.5}C${W * 0.18},${H * 0.3} ${W * 0.32},${H * 0.2} ${cx},${H * 0.2}C${W * 0.68},${H * 0.2} ${W * 0.82},${H * 0.3} ${W * 0.8},${H * 0.5}`) +
          P(`M${cx - 6},${H * 0.2}L${cx + 2},${H * 0.06}L${cx + 8},${H * 0.21}Z`, FILL) +
          P(`M${W * 0.3},${H * 0.36}q${W * 0.06},-${H * 0.06} ${W * 0.13},0q-${W * 0.06},${H * 0.05} -${W * 0.13},0Z`, FILL) +
          P(`M${W * 0.57},${H * 0.36}q${W * 0.07},-${H * 0.06} ${W * 0.13},0q-${W * 0.07},${H * 0.05} -${W * 0.13},0Z`, FILL) +
          P(`M${W * 0.2},${H * 0.5}Q${cx},${H * 0.62} ${W * 0.8},${H * 0.5}`) +
          [0.3, 0.4, 0.6, 0.7].map((x) => P(`M${W * x - 4},${H * 0.54}l4,9l4,-9`, FILL)).join("") +
          C(cx, H * 0.74, W * 0.15, ` stroke-width="5"`) +
          `<rect x="${n(cx - W * 0.05)}" y="${n(H * 0.74 - W * 0.05)}" width="${n(W * 0.1)}" height="${n(W * 0.1)}"/>`,
      };
    },
  },
  tf_zhenmo: {
    // 真魔血符:魔眼與滴落的魔血
    motif: (W, H) => ({
      ink:
        P(`M${W * 0.2},${H * 0.3}Q${W / 2},${H * 0.18} ${W * 0.8},${H * 0.3}Q${W / 2},${H * 0.42} ${W * 0.2},${H * 0.3}Z`) +
        P(`M${W / 2},${H * 0.22}Q${W * 0.56},${H * 0.3} ${W / 2},${H * 0.38}Q${W * 0.44},${H * 0.3} ${W / 2},${H * 0.22}Z`, FILL) +
        [0.36, 0.5, 0.64].map((x, i) => P(`M${W * x},${H * 0.42}V${H * (0.52 + i * 0.06)}`, ` stroke-width="${4 - i}"`) + C(W * x, H * (0.55 + i * 0.06), 4 - i * 0.6, FILL)).join(""),
    }),
  },
  tf_huixian: {
    // 灰仙寂滅:枯枝上一點新芽
    motif: (W, H) => ({
      ink:
        P(`M${W * 0.22},${H * 0.86}Q${W * 0.38},${H * 0.6} ${W * 0.46},${H * 0.4}Q${W * 0.52},${H * 0.26} ${W * 0.66},${H * 0.18}`, ` stroke-width="5"`) +
        P(`M${W * 0.4},${H * 0.54}Q${W * 0.6},${H * 0.52} ${W * 0.72},${H * 0.6}M${W * 0.46},${H * 0.4}Q${W * 0.34},${H * 0.3} ${W * 0.26},${H * 0.3}`, THIN),
      accent: P(`M${W * 0.72},${H * 0.6}c6,-10 18,-12 22,-8c-6,8 -14,12 -22,8Z`, ` fill="#7f9a5a" stroke="none"`),
    }),
  },
  tf_hundun: {
    // 混沌五行:五色旋入一點
    motif: (W, H) => {
      const cx = W / 2;
      const cy = H / 2;
      return {
        ink: C(cx, cy, W * 0.06, FILL),
        accent: (["金", "水", "木", "火", "土"] as const)
          .map((el, i) => {
            const a = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
            const r = W * 0.3;
            return P(`M${n(cx + Math.cos(a) * r)},${n(cy + Math.sin(a) * r)}Q${n(cx + Math.cos(a + 1) * r * 0.75)},${n(cy + Math.sin(a + 1) * r * 0.75)} ${n(cx + Math.cos(a + 1.6) * r * 0.25)},${n(cy + Math.sin(a + 1.6) * r * 0.25)}`, ` fill="none" stroke="${EL[el]}" stroke-width="4" stroke-linecap="round"`) + C(cx + Math.cos(a) * r, cy + Math.sin(a) * r, 5, ` fill="${EL[el]}" stroke="none"`);
          })
          .join(""),
      };
    },
  },
};

// ═══ 5.1 版定稿:月夜符籙 ═══
// 依道教符籙的結構排版,配色與遊戲的「夜色仙境」一致:
//   符頭 = 消光金屬箍(一二品玄鐵、三四品銀青、五六品淡金),鉚釘數 = 品階;其下三清勾與「敕令」
//   符膽 = 金屬緣圓牌,內為各張專屬的圖騰(上方 ART),四周放射五行力場線
//   符身 = 粗重宋體符名,背後壓一筆飛白大筆觸;一道符文長筆從符頭貫穿到符腳
//   符腳 = 五行鎮紋(金鋒、木藤、水波、火焰、土山)+ 五行字朱印
//   符紙 = 深墨宣紙只帶一點五行色調,毛邊不規整、邊緣壓暗,帶摺痕與纖維;雙框刻意不平直
// 五行色沿用遊戲的金 / 木 / 水 / 火 / 土色(tailwind.config.ts),紅色不再大面積使用(遊戲中紅色保留給氣血與警示)。
// 同一份 buildTengfuCard 也供 Figma 設計稿產生器使用,兩邊外觀一致。
export const TENGFU_CELL = 120; // 設計稿每格的單位數
export type TengfuWu = "金" | "木" | "水" | "火" | "土" | "混";
const STAT_WU: Record<string, TengfuWu> = { atk: "金", def: "土", hp: "木", mp: "水", energy: "火", allEl: "混", 金: "金", 木: "木", 水: "水", 火: "火", 土: "土", 無: "混" };
export const TENGFU_PAPER: Record<TengfuWu, { name: string; paper: string; paper2: string; edge: string; ink: string; accent: string; swash: string }> = {
  金: { name: "金 · 月白鎏金", paper: "#1F1D19", paper2: "#121110", edge: "#030303", ink: "#F3E6C4", accent: "#E6C680", swash: "#050608" },
  木: { name: "木 · 青冥竹", paper: "#14211B", paper2: "#0B140F", edge: "#020403", ink: "#D7EFD9", accent: "#7FCB8A", swash: "#040806" },
  水: { name: "水 · 玄淵", paper: "#121D2B", paper2: "#09111B", edge: "#020408", ink: "#D6E6F5", accent: "#6FA8DC", swash: "#03060B" },
  火: { name: "火 · 赤霄", paper: "#251715", paper2: "#170D0C", edge: "#050202", ink: "#F8DCD3", accent: "#F07C6C", swash: "#080303" },
  土: { name: "土 · 玄黃", paper: "#231D15", paper2: "#15110C", edge: "#040302", ink: "#F0DEC0", accent: "#C99A62", swash: "#070504" },
  混: { name: "混沌 · 紫微", paper: "#1C1725", paper2: "#100D17", edge: "#030205", ink: "#E4D8F0", accent: "#A88BC8", swash: "#05040A" },
};
export const TENGFU_METALS = [
  { name: "玄鐵 · 一二品", body: "#4A5258", hi: "#7C868C", lo: "#1F2427" },
  { name: "銀青 · 三四品", body: "#5F7C77", hi: "#A6C6BF", lo: "#263532" },
  { name: "淡金 · 五六品", body: "#A88C52", hi: "#E6C680", lo: "#4E3E1B" },
];
const EL5: Record<string, string> = { 金: "#E6C680", 木: "#7FCB8A", 水: "#6FA8DC", 火: "#F07C6C", 土: "#C99A62" };
const metalOf = (tier: number) => TENGFU_METALS[tier <= 2 ? 0 : tier <= 4 ? 1 : 2];
export const tengfuWuOf = (def: TengfuDef): TengfuWu =>
  STAT_WU[(Object.entries(def.stats) as [string, number][]).sort((a, b) => b[1] - a[1])[0][0]] ?? "混";

// 毛邊符紙(座標取整數,Figma 向量可直接使用)
function deckle(W: number, H: number, m: number, rnd: () => number) {
  const cs: [number, number][] = [
    [m + rnd() * 4, m + rnd() * 3],
    [W - m - rnd() * 4, m + rnd() * 3],
    [W - m - rnd() * 4, H - m - rnd() * 3],
    [m + rnd() * 4, H - m - rnd() * 3],
  ];
  const pts: [number, number][] = [];
  const chips = [Math.floor(rnd() * 4), Math.floor(rnd() * 4)];
  cs.forEach(([x0, y0], ci) => {
    const [x1, y1] = cs[(ci + 1) % 4];
    const len = Math.hypot(x1 - x0, y1 - y0);
    const nx = -(y1 - y0) / len;
    const ny = (x1 - x0) / len;
    const k = Math.max(5, Math.round(len / 6));
    const chipAt = chips.includes(ci) ? 0.2 + rnd() * 0.6 : -1;
    for (let i = 0; i < k; i++) {
      const t = i / k;
      let j = i === 0 ? 0 : (rnd() - 0.35) * 3.4;
      if (chipAt > 0 && Math.abs(t - chipAt) < 0.035) j += 5 + rnd() * 5;
      pts.push([x0 + (x1 - x0) * t + nx * j, y0 + (y1 - y0) * t + ny * j]);
    }
  });
  return `M${pts.map(([x, y]) => `${Math.round(x)} ${Math.round(y)}`).join(" L ")} Z`;
}
// 手繪感的不平直框線
function wobbleRect(x: number, y: number, w: number, h: number, rnd: () => number, amp = 1.2) {
  const pts: [number, number][] = [];
  const edge = (x0: number, y0: number, x1: number, y1: number) => {
    const k = Math.max(3, Math.round(Math.hypot(x1 - x0, y1 - y0) / 24));
    for (let i = 0; i < k; i++) pts.push([x0 + ((x1 - x0) * i) / k + (rnd() - 0.5) * amp, y0 + ((y1 - y0) * i) / k + (rnd() - 0.5) * amp]);
  };
  edge(x, y, x + w, y);
  edge(x + w, y, x + w, y + h);
  edge(x + w, y + h, x, y + h);
  edge(x, y + h, x, y);
  return poly(pts);
}
// 紙纖維與斑點:纖維合成深淺兩條 path,減少節點數
function fibers(W: number, H: number, rnd: () => number, color: string) {
  const k = Math.round((W * H) / 1100);
  const layers = ["", ""];
  for (let i = 0; i < k; i++) {
    const x = 8 + rnd() * (W - 16);
    const y = 8 + rnd() * (H - 16);
    const a = rnd() * Math.PI;
    const l = 3 + rnd() * 9;
    layers[i % 2] += `M${Math.round(x)},${Math.round(y)}l${Math.round(Math.cos(a) * l)},${Math.round(Math.sin(a) * l)}`;
  }
  let out =
    P(layers[0], ` fill="none" stroke="${color}" stroke-opacity="0.16" stroke-width="0.7" stroke-linecap="round"`) +
    P(layers[1], ` fill="none" stroke="${color}" stroke-opacity="0.09" stroke-width="1" stroke-linecap="round"`);
  for (let i = 0; i < 3; i++) {
    const r = Math.min(W, H) * (0.08 + rnd() * 0.12);
    out += `<ellipse cx="${n(W * (0.15 + rnd() * 0.7))}" cy="${n(H * (0.15 + rnd() * 0.7))}" rx="${n(r)}" ry="${n(r * (0.6 + rnd() * 0.5))}" fill="${color}" fill-opacity="0.04"/>`;
  }
  return out;
}
// 飛白大筆觸(沿 x0,y0 → x1,y1,兩端收尖)
function swash(x0: number, y0: number, x1: number, y1: number, w: number, rnd: () => number, color: string, op: number) {
  const len = Math.hypot(x1 - x0, y1 - y0);
  const nx = -(y1 - y0) / len;
  const ny = (x1 - x0) / len;
  const top: [number, number][] = [];
  const bot: [number, number][] = [];
  for (let i = 0; i <= 14; i++) {
    const t = i / 14;
    const ww = w * (0.3 + 0.7 * Math.sin(Math.PI * Math.min(1, t * 1.18))) * (0.86 + rnd() * 0.28);
    const cx = x0 + (x1 - x0) * t + nx * Math.sin(t * Math.PI * 2) * w * 0.06;
    const cy = y0 + (y1 - y0) * t + ny * Math.sin(t * Math.PI * 2) * w * 0.06;
    top.push([cx + nx * ww * 0.5, cy + ny * ww * 0.5]);
    bot.push([cx - nx * ww * 0.5, cy - ny * ww * 0.5]);
  }
  return P(poly([...top, ...bot.reverse()]), ` fill="${color}" fill-opacity="${op}"`);
}
// 符文:從符頭一路寫到符腳的連筆曲線(沿主軸)
function scriptCurve(ax: number, ay: number, bx: number, by: number, amp: number, rnd: () => number) {
  const len = Math.hypot(bx - ax, by - ay);
  const nx = -(by - ay) / len;
  const ny = (bx - ax) / len;
  const k = Math.max(4, Math.round(len / 34));
  let d = `M${n(ax)},${n(ay)}`;
  for (let i = 1; i <= k; i++) {
    const t = i / k;
    const side = i % 2 ? 1 : -1;
    const cx = ax + (bx - ax) * (t - 0.5 / k) + nx * amp * side * (0.6 + rnd() * 0.6);
    const cy = ay + (by - ay) * (t - 0.5 / k) + ny * amp * side * (0.6 + rnd() * 0.6);
    d += `Q${n(cx)},${n(cy)} ${n(ax + (bx - ax) * t)},${n(ay + (by - ay) * t)}`;
    if (rnd() < 0.35) d += `l${n(nx * amp * 0.5 * side)},${n(ny * amp * 0.5 * side)}l${n(-nx * amp * 0.5 * side)},${n(-ny * amp * 0.5 * side)}`;
  }
  return d;
}
// 三清勾(局部座標:中心 0,0,往 +y 寫)
function threeHooks(s: number, color: string) {
  const hook = (x: number) =>
    P(`M${n(x)},${n(-s * 0.55)}C${n(x + s * 0.12)},${n(-s * 0.1)} ${n(x + s * 0.1)},${n(s * 0.3)} ${n(x - s * 0.08)},${n(s * 0.55)}`, ` fill="none" stroke="${color}" stroke-width="${n(s * 0.16)}" stroke-linecap="round"`);
  return hook(-s * 0.42) + hook(0) + hook(s * 0.42);
}
// 符腳五行紋(局部座標:長 len、厚 T,沿 +x 排列)
function footPattern(wu: TengfuWu, len: number, T: number, color: string, rnd: () => number) {
  const k = Math.max(3, Math.round(len / 26));
  const step = len / k;
  let out = "";
  if (wu === "水") {
    for (const [y, a] of [
      [T * 0.35, T * 0.22],
      [T * 0.72, T * 0.18],
    ] as const) {
      let d = `M0,${n(y)}`;
      for (let i = 0; i < k; i++) d += `q${n(step / 4)},${n(-a)} ${n(step / 2)},0q${n(step / 4)},${n(a)} ${n(step / 2)},0`;
      out += P(d, ` fill="none" stroke="${color}" stroke-width="2.4" stroke-linecap="round"`);
    }
  } else if (wu === "火") {
    let d = `M0,${n(T)}`;
    for (let i = 0; i < k; i++) d += `Q${n(step * i + step * 0.1)},${n(T * 0.2)} ${n(step * i + step * 0.5)},${n(T * 0.05)}Q${n(step * i + step * 0.55)},${n(T * 0.55)} ${n(step * (i + 1))},${n(T)}`;
    out += P(d + "Z", ` fill="${color}" fill-opacity="0.85"`);
  } else if (wu === "木") {
    let d = `M0,${n(T * 0.6)}`;
    for (let i = 0; i < k; i++) d += `q${n(step / 2)},${n(i % 2 ? T * 0.35 : -T * 0.35)} ${n(step)},0`;
    out += P(d, ` fill="none" stroke="${color}" stroke-width="2.4" stroke-linecap="round"`);
    for (let i = 0; i < k; i++) {
      const up = i % 2 ? -1 : 1;
      out += P(`M${n(step * (i + 0.5))},${n(T * 0.6)}q${n(step * 0.2)},${n(-T * 0.45 * up)} ${n(step * 0.38)},${n(-T * 0.3 * up)}q${n(-step * 0.1)},${n(T * 0.25 * up)} ${n(-step * 0.38)},${n(T * 0.3 * up)}Z`, ` fill="${color}"`);
    }
  } else if (wu === "金") {
    for (let i = 0; i < k; i++) out += P(`M${n(step * i + step * 0.2)},${n(T)}L${n(step * i + step * 0.5)},${n(T * 0.05)}L${n(step * i + step * 0.8)},${n(T)}Z`, ` fill="${color}" fill-opacity="0.85"`);
    out += L(0, T, len, T, ` stroke="${color}" stroke-width="2"`);
  } else if (wu === "土") {
    let d = `M0,${n(T)}`;
    for (let i = 0; i < k; i++) d += `L${n(step * i + step * (0.35 + rnd() * 0.3))},${n(T * (0.1 + rnd() * 0.3))}L${n(step * (i + 1))},${n(T * 0.75)}`;
    out += P(`${d}L${n(len)},${n(T)}Z`, ` fill="${color}" fill-opacity="0.85"`);
    out += L(0, T * 0.92, len, T * 0.92, ` stroke="${color}" stroke-width="1.4"`);
  } else {
    let d = `M0,${n(T * 0.5)}`;
    for (let i = 0; i < k; i++) d += `c${n(step * 0.3)},${n(-T * 0.5)} ${n(step * 0.7)},${n(T * 0.5)} ${n(step)},0`;
    out += P(d, ` fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round"`);
    ["金", "水", "木", "火", "土"].forEach((el, i) => (out += C(len * (0.18 + i * 0.16), T * 0.5, T * 0.18, ` fill="${EL5[el]}"`)));
  }
  return out;
}

export interface TengfuText {
  role: "chiling" | "name" | "seal";
  chars: string; // 直書或兩行時以 \n 分行
  x: number; // 文字框中心
  y: number;
  size: number;
  color: string;
  vertical: boolean;
}
export interface TengfuCard {
  W: number;
  H: number;
  wu: TengfuWu;
  paper: { d: string; paper: string; paper2: string; edge: string };
  art: string; // 紙上的所有圖形(不含符紙本體與文字),SVG 片段
  texts: TengfuText[];
}

export function buildTengfuCard(def: TengfuDef): TengfuCard {
  const W = def.w * TENGFU_CELL;
  const H = def.h * TENGFU_CELL;
  const rnd = rng(seedOf(def.id + "v3"));
  const wu = tengfuWuOf(def);
  const pp = TENGFU_PAPER[wu];
  const mt = metalOf(def.tier);
  const mini = def.w * def.h === 1;
  const horiz = def.w > def.h;
  const square = def.w === def.h;
  const texts: TengfuText[] = [];
  let g = "";

  // ── 符紙上的紋理:纖維、摺痕、印刷雙框 ──
  const paper = deckle(W, H, 4, rnd);
  g += fibers(W, H, rnd, pp.ink);
  if (!mini) {
    for (const t of [0.34, 0.67]) {
      g += horiz
        ? L(W * t, 8, W * t + (rnd() - 0.5) * 4, H - 8, ` stroke="${pp.edge}" stroke-opacity="0.5" stroke-width="1.2"`) + L(W * t + 1.4, 8, W * t + 1.4, H - 8, ` stroke="#FFFFFF" stroke-opacity="0.05" stroke-width="1"`)
        : L(8, H * t, W - 8, H * t + (rnd() - 0.5) * 4, ` stroke="${pp.edge}" stroke-opacity="0.5" stroke-width="1.2"`) + L(8, H * t + 1.4, W - 8, H * t + 1.4, ` stroke="#FFFFFF" stroke-opacity="0.05" stroke-width="1"`);
    }
  }
  const inset = mini ? 10 : 14;
  g += P(wobbleRect(inset, inset, W - inset * 2, H - inset * 2, rnd), ` fill="none" stroke="${pp.accent}" stroke-opacity="0.34" stroke-width="1.4"`);
  g += P(wobbleRect(inset + 4, inset + 4, W - inset * 2 - 8, H - inset * 2 - 8, rnd), ` fill="none" stroke="${pp.accent}" stroke-opacity="0.18" stroke-width="0.8"`);

  // ── 版面:直符 / 方符由上到下,橫符由左到右 ──
  const capT = mini ? 16 : 24;
  // 短直符(高 ≤ 寬 × 2,且不是方形):不寫敕令、符徽縮小、符腳變薄,把空間讓給名稱
  const compact = !horiz && !square && def.h <= def.w * 2;
  const footT = mini ? 0 : compact ? 15 : Math.min(26, (horiz ? W : H) * 0.09);
  const sealS = mini ? 18 : Math.min(30, (horiz ? H : W) * 0.24);
  let emblem = { cx: 0, cy: 0, r: 0 };
  let hooks = { x: 0, y: 0, s: 0, rot: 0 };
  let nameBox = { x0: 0, y0: 0, x1: 0, y1: 0 };
  if (horiz) {
    // 橫長符:符頭在左,三清勾與直書「敕令」同一欄上下排列
    const chilingS = Math.min(H * 0.17, 22);
    hooks = { x: capT + 22, y: H / 2 - chilingS * 1.2, s: Math.min(H * 0.13, 18), rot: 0 };
    const r = Math.min(H * 0.3, 52);
    emblem = { cx: hooks.x + 26 + r, cy: H / 2, r };
    nameBox = { x0: emblem.cx + r * 1.45 + 6, y0: inset + 10, x1: W - footT - 22 - (H < 200 ? sealS + 6 : 0), y1: H - inset - 10 };
    texts.push({ role: "chiling", chars: "敕\n令", x: hooks.x, y: H / 2 + chilingS * 0.55, size: chilingS, color: pp.accent, vertical: true });
  } else {
    hooks = { x: W / 2, y: capT + (mini ? 12 : compact ? 16 : 22), s: mini ? 12 : compact ? 16 : Math.min(W * 0.2, 24), rot: 0 };
    const r = mini ? W * 0.3 : compact ? W * 0.19 : Math.min(W * (square ? 0.17 : 0.27), 50);
    const chilingH = mini || compact ? 0 : Math.min(W * 0.16, 22);
    emblem = { cx: W / 2, cy: mini ? H * 0.58 : hooks.y + (compact ? 14 : 24) + chilingH + (compact ? 0 : 8) + r * 1.15, r };
    // 方形符:符頭在上,符徽靠左、名稱在右(可分兩行)
    if (square && !mini) emblem = { cx: inset + 10 + W * 0.17, cy: H * 0.6, r: W * 0.15 };
    nameBox = mini
      ? nameBox
      : square
        ? { x0: emblem.cx + emblem.r * 1.4, y0: hooks.y + 24 + chilingH + 6, x1: W - inset - 6, y1: H - footT - inset - 16 - sealS * 0.6 }
        : { x0: inset + 8, y0: emblem.cy + r * 1.45 + 4, x1: W - inset - 8, y1: H - footT - (compact ? 14 : 20) - sealS * (compact ? 0.2 : 0.5) };
    if (!mini && !compact) texts.push({ role: "chiling", chars: "敕令", x: W / 2, y: hooks.y + 18 + chilingH / 2, size: chilingH, color: pp.accent, vertical: false });
  }

  // 符文長筆:沿主軸貫穿全符(在名稱之下)
  if (!mini) {
    const sc = horiz ? scriptCurve(capT + 14, H * 0.5, W - 14, H * 0.5, H * 0.12, rnd) : scriptCurve(W * 0.5, capT + 10, W * 0.5, H - 14, W * 0.12, rnd);
    g += P(sc, ` fill="none" stroke="${pp.accent}" stroke-opacity="0.2" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"`);
  }
  // 五行力場:符膽四周的放射線
  const rays = mini ? 20 : 28;
  const rayD = ["", ""];
  for (let i = 0; i < rays; i++) {
    const a = (i / rays) * Math.PI * 2 + rnd() * 0.05;
    const r0 = emblem.r * 1.12;
    const r1 = emblem.r * (i % 2 ? 1.32 : 1.55);
    rayD[i % 2] += `M${n(emblem.cx + Math.cos(a) * r0)},${n(emblem.cy + Math.sin(a) * r0)}L${n(emblem.cx + Math.cos(a) * r1)},${n(emblem.cy + Math.sin(a) * r1)}`;
  }
  g += P(rayD[0], ` fill="none" stroke="${pp.accent}" stroke-opacity="0.55" stroke-width="2.4" stroke-linecap="round"`);
  g += P(rayD[1], ` fill="none" stroke="${pp.accent}" stroke-opacity="0.55" stroke-width="1.4" stroke-linecap="round"`);
  // 名稱背後的大筆觸
  if (mini) g += swash(W * 0.16, H * 0.72, W * 0.86, H * 0.46, 36, rnd, pp.swash, 0.5);
  else if (horiz || square) {
    const cy = (nameBox.y0 + nameBox.y1) / 2;
    g += swash(nameBox.x0 - 4, cy + 6, nameBox.x1 + 4, cy - 6, Math.min(nameBox.y1 - nameBox.y0, 70) * 0.9, rnd, pp.swash, 0.5);
  } else g += swash(W * 0.52, nameBox.y0 - 4, W * 0.47, nameBox.y1 + 6, Math.min(W * 0.62, 74), rnd, pp.swash, 0.5);

  // 符膽:金屬緣圓牌 + 專屬圖騰
  g += C(emblem.cx, emblem.cy, emblem.r, ` fill="${pp.paper2}" stroke="${mt.body}" stroke-width="${mini ? 2.4 : 3.6}"`);
  g += C(emblem.cx, emblem.cy, emblem.r - (mini ? 3.5 : 5.5), ` fill="none" stroke="${mt.hi}" stroke-opacity="0.35" stroke-width="0.9"`);
  const art = ART[def.id];
  if (art) {
    const motif = art.motif(100, 100, rng(seedOf(def.id)));
    const t = `translate(${n(emblem.cx - emblem.r * 0.75)} ${n(emblem.cy - emblem.r * 0.75)}) scale(${Math.round(emblem.r * 15) / 1000})`;
    g += `<g transform="${t}" fill="none" stroke="${pp.ink}" stroke-width="${n((art.sw ?? 3) * 1.7)}" stroke-linecap="round" stroke-linejoin="round" opacity="${mini ? 0.3 : 0.95}">${motif.ink.replace(/currentColor/g, pp.ink)}</g>`;
    if (motif.accent && !mini) g += `<g transform="${t}">${motif.accent}</g>`;
  }
  // 三清勾
  g += `<g transform="translate(${n(hooks.x)} ${n(hooks.y)}) rotate(${hooks.rot})">${threeHooks(hooks.s, pp.accent)}</g>`;
  // 符腳
  if (!mini) {
    g += horiz
      ? `<g transform="translate(${n(W - inset - 6)} ${n(inset + 8)}) rotate(90)">${footPattern(wu, H - inset * 2 - 16, footT, pp.accent, rnd)}</g>`
      : `<g transform="translate(${n(inset + 8)} ${n(H - inset - 6 - footT)})">${footPattern(wu, W - inset * 2 - 16, footT, pp.accent, rnd)}</g>`;
  }
  // 符頭金屬箍(消光):直符在上、橫符在左;鉚釘數 = 品階
  const cap = horiz ? { x: 4, y: 6, w: capT, h: H - 12 } : { x: 6, y: 4, w: W - 12, h: capT };
  g += `<rect x="${cap.x}" y="${cap.y}" width="${cap.w}" height="${cap.h}" rx="2" fill="${mt.body}"/>`;
  g += horiz
    ? L(cap.x + 1.5, cap.y + 2, cap.x + 1.5, cap.y + cap.h - 2, ` stroke="${mt.hi}" stroke-opacity="0.5" stroke-width="1"`) +
      L(cap.x + cap.w, cap.y, cap.x + cap.w, cap.y + cap.h, ` stroke="${mt.lo}" stroke-width="2.2"`) +
      L(cap.x + cap.w * 0.5, cap.y + 8, cap.x + cap.w * 0.5, cap.y + cap.h - 8, ` stroke="${mt.lo}" stroke-opacity="0.45" stroke-width="0.8" stroke-dasharray="6 3"`)
    : L(cap.x + 2, cap.y + 1.5, cap.x + cap.w - 2, cap.y + 1.5, ` stroke="${mt.hi}" stroke-opacity="0.5" stroke-width="1"`) +
      L(cap.x, cap.y + cap.h, cap.x + cap.w, cap.y + cap.h, ` stroke="${mt.lo}" stroke-width="2.2"`) +
      L(cap.x + 8, cap.y + cap.h * 0.5, cap.x + cap.w - 8, cap.y + cap.h * 0.5, ` stroke="${mt.lo}" stroke-opacity="0.45" stroke-width="0.8" stroke-dasharray="6 3"`);
  for (let i = 0; i < def.tier; i++) {
    const t = (i + 1) / (def.tier + 1);
    g += C(horiz ? cap.x + cap.w / 2 : cap.x + cap.w * t, horiz ? cap.y + cap.h * t : cap.y + cap.h / 2, mini ? 2.2 : 3.2, ` class="tf-rivet" fill="${mt.hi}" stroke="${mt.lo}" stroke-width="0.9"`);
  }

  // ── 文字 ──
  const name = def.name;
  if (mini) texts.push({ role: "name", chars: name[0], x: W / 2, y: H * 0.57, size: 62, color: pp.ink, vertical: false });
  else if (horiz || square) {
    const bw = nameBox.x1 - nameBox.x0;
    const bh = nameBox.y1 - nameBox.y0;
    const one = Math.min(bh * 0.86, bw / (name.length * 1.04));
    const split = [name.slice(0, Math.ceil(name.length / 2)), name.slice(Math.ceil(name.length / 2))];
    const two = Math.min(bh / (2 * 1.12), bw / (split[0].length * 1.04));
    // 長名字在兩行字級比較大時才分行
    const useTwo = name.length >= 4 && def.h >= 2 && two > one;
    texts.push({ role: "name", chars: useTwo ? split.join("\n") : name, x: (nameBox.x0 + nameBox.x1) / 2, y: (nameBox.y0 + nameBox.y1) / 2, size: Math.floor(useTwo ? two : one), color: pp.ink, vertical: false });
  } else {
    const size = Math.floor(Math.min((nameBox.x1 - nameBox.x0) * 0.92, (nameBox.y1 - nameBox.y0) / (name.length * 1.06)));
    texts.push({ role: "name", chars: name.split("").join("\n"), x: W / 2, y: (nameBox.y0 + nameBox.y1) / 2, size, color: pp.ink, vertical: true });
  }
  // 五行朱印(印泥用該屬性的五行色)
  const sx = W - inset - sealS - 4;
  const sy = horiz ? H - inset - sealS - 4 : H - footT - inset - sealS - 8;
  g += `<g transform="rotate(${n((rnd() - 0.5) * 9)} ${n(sx + sealS / 2)} ${n(sy + sealS / 2)})"><rect x="${n(sx)}" y="${n(sy)}" width="${n(sealS)}" height="${n(sealS)}" rx="2.5" fill="${pp.accent}" fill-opacity="0.9"/><rect x="${n(sx + 2.2)}" y="${n(sy + 2.2)}" width="${n(sealS - 4.4)}" height="${n(sealS - 4.4)}" rx="1" fill="none" stroke="${pp.paper}" stroke-width="1.1"/></g>`;
  texts.push({ role: "seal", chars: wu === "混" ? "元" : wu, x: sx + sealS / 2, y: sy + sealS / 2, size: Math.round(sealS * 0.62), color: pp.paper, vertical: false });

  return { W, H, wu, paper: { d: paper, paper: pp.paper, paper2: pp.paper2, edge: pp.edge }, art: g, texts };
}

// 文字的行高(與 Figma 設計稿的文字圖層一致)
export const tengfuLineHeight = (t: TengfuText) => (t.vertical ? 1.04 : 1.12);
const SERIF = `'Noto Serif TC', 'Songti TC', serif`;

const CACHE = new Map<string, string>();
export function tengfuSvg(def: TengfuDef): string {
  const hit = CACHE.get(def.id);
  if (hit) return hit;
  const svg = buildSvg(def);
  CACHE.set(def.id, svg);
  return svg;
}

function buildSvg(def: TengfuDef): string {
  if (!ART[def.id]) return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${def.w * TENGFU_CELL} ${def.h * TENGFU_CELL}"></svg>`;
  const c = buildTengfuCard(def);
  const uid = def.id.replace(/[^a-z0-9_]/gi, "");
  const text = c.texts
    .map((t) => {
      const lines = t.chars.split("\n");
      const lh = t.size * tengfuLineHeight(t);
      const weight = t.role === "chiling" ? 700 : 900;
      return lines
        .map((ln, i) => `<text x="${n(t.x)}" y="${n(t.y + (i - (lines.length - 1) / 2) * lh)}" font-size="${t.size}" font-weight="${weight}" fill="${t.color}" text-anchor="middle" dominant-baseline="central"${t.role === "name" && !t.vertical ? ` letter-spacing="${n(t.size * 0.04)}"` : ""}>${ln}</text>`)
        .join("");
    })
    .join("");
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${c.W} ${c.H}" preserveAspectRatio="xMidYMid meet" aria-hidden="true">` +
    `<defs><radialGradient id="tfg-${uid}" cx="50%" cy="44%" r="72%"><stop offset="0" stop-color="${c.paper.paper}"/><stop offset="0.7" stop-color="${c.paper.paper}"/><stop offset="1" stop-color="${c.paper.paper2}"/></radialGradient>` +
    `<clipPath id="tfc-${uid}"><path d="${c.paper.d}"/></clipPath></defs>` +
    `<path d="${c.paper.d}" fill="url(#tfg-${uid})"/>` +
    // 邊緣壓暗:沿紙緣的寬描邊只留在紙內
    `<g clip-path="url(#tfc-${uid})"><path d="${c.paper.d}" fill="none" stroke="${c.paper.edge}" stroke-opacity="0.55" stroke-width="22"/><path d="${c.paper.d}" fill="none" stroke="${c.paper.edge}" stroke-opacity="0.5" stroke-width="7"/></g>` +
    `<path d="${c.paper.d}" fill="none" stroke="${c.paper.edge}" stroke-width="2.4" stroke-linejoin="round"/>` +
    c.art +
    `<g font-family="${SERIF}">${text}</g>` +
    `</svg>`
  );
}

export const hasTengfuArt = (id: string) => id in ART;

// 單張滕符的符徽圖騰(在 W × H 的方框內作畫;rnd 省略時以滕符 id 為種子),供設計稿產生器等外部工具使用
export function tengfuMotif(id: string, W = 100, H = 100, rnd: () => number = rng(seedOf(id))) {
  const art = ART[id];
  return art ? { ...art.motif(W, H, rnd), sw: art.sw ?? 3 } : null;
}
