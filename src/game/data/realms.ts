import { Realm } from "../types";

// LDZ 交易風雲傳 — 交易員晉級體系(韭菜 → 家族基金經理人)
// stage: 1韭菜 2銅牌 3銀牌 4金牌 5白金 6鑽石 7大師 8精英
// life: 該大境界的「資產上限」(載),依 README 設定
const MAJORS = [
  { name: "韭菜", exp: 30, hp: 50, mp: 25, atk: 5, brk: 0.85, life: 150 },
  { name: "銅牌交易員", exp: 110, hp: 150, mp: 80, atk: 16, brk: 0.75, life: 300 },
  { name: "銀牌交易員", exp: 380, hp: 450, mp: 240, atk: 50, brk: 0.65, life: 600 },
  { name: "金牌交易員", exp: 1300, hp: 1400, mp: 720, atk: 160, brk: 0.55, life: 1200 },
  { name: "白金交易員", exp: 4500, hp: 4200, mp: 2200, atk: 500, brk: 0.5, life: 2500 },
  { name: "鑽石交易員", exp: 15000, hp: 13000, mp: 6800, atk: 1600, brk: 0.45, life: 6000 },
  { name: "大師交易員", exp: 52000, hp: 40000, mp: 21000, atk: 5000, brk: 0.4, life: 15000 },
  { name: "精英交易員", exp: 180000, hp: 120000, mp: 63000, atk: 16000, brk: 0.3, life: 40000 },
];

// 前/中/後期 交易量與屬性倍率
const MINORS: [string, number, number][] = [
  ["前期", 1, 1],
  ["中期", 2.4, 1.55],
  ["後期", 5.5, 2.4],
];

export const REALMS: Realm[] = MAJORS.flatMap((M, i) =>
  MINORS.map(([label, expMul, statMul], j) => ({
    id: `r${i}_${j}`,
    name: `${M.name} ${label}`,
    stage: i + 1,
    expNeed: Math.floor(M.exp * expMul),
    hpMax: Math.floor(M.hp * statMul),
    mpMax: Math.floor(M.mp * statMul),
    atk: Math.floor(M.atk * statMul),
    // 後期衝大境界是大關(升等考核),成功率驟降
    breakChance: j < 2 ? 0.95 : M.brk,
    lifespan: M.life,
  })),
);

REALMS.push(
  {
    id: "dujie",
    name: "首席操盤手",
    stage: 9,
    expNeed: 600000,
    hpMax: 380000,
    mpMax: 200000,
    atk: 50000,
    breakChance: 0.3,
    lifespan: 100000,
  },
  {
    id: "feisheng",
    name: "基金經理人(已封神)",
    stage: 10,
    expNeed: 9999999999,
    hpMax: 500000,
    mpMax: 500000,
    atk: 30000,
    breakChance: 0,
    lifespan: 99999999, // 基金經理人超脫壽元
  },
  {
    id: "jinxian_realm",
    name: "家族基金經理人",
    stage: 11,
    expNeed: 9999999999,
    hpMax: 1200000,
    mpMax: 1200000,
    atk: 80000,
    breakChance: 0,
    lifespan: 99999999, // 以金魂丹(操盤密鑰)自基金經理人突破而成
  },
);
