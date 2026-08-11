import { Realm } from "../types";

// 大境界(取材凡人修仙傳:人界→靈界→飛昇)
// stage: 1煉氣 2築基 3結丹 4元嬰 5化神 6煉虛 7合體 8大乘 9渡劫
// lifespan: 該大境界壽元上限(載),取材原著設定
const MAJORS = [
  { name: "練氣期", exp: 30, hp: 50, mp: 25, atk: 5, brk: 0.95, life: 120 },
  { name: "築基期", exp: 110, hp: 150, mp: 80, atk: 16, brk: 0.85, life: 200 },
  { name: "結丹期", exp: 380, hp: 450, mp: 240, atk: 50, brk: 0.75, life: 400 },
  { name: "元嬰期", exp: 1300, hp: 1400, mp: 720, atk: 160, brk: 0.65, life: 1200 },
  { name: "化神期", exp: 4500, hp: 4200, mp: 2200, atk: 500, brk: 0.55, life: 2000 },
  { name: "煉虛期", exp: 15000, hp: 13000, mp: 6800, atk: 1600, brk: 0.5, life: 6000 },
  { name: "合體期", exp: 52000, hp: 40000, mp: 21000, atk: 5000, brk: 0.45, life: 15000 },
  { name: "大乘期", exp: 180000, hp: 120000, mp: 63000, atk: 16000, brk: 0.4, life: 40000 },
];

// 前/中/後期 修為與屬性倍率
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
    // 後期→下一大境界 是大關卡,成功率驟降
    breakChance: j < 2 ? 0.95 : M.brk,
    lifespan: M.life,
  })),
);

REALMS.push(
  {
    id: "dujie",
    name: "渡劫期",
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
    name: "真仙境(已飛昇)",
    stage: 10,
    expNeed: 9999999999,
    hpMax: 500000,
    mpMax: 500000,
    atk: 30000,
    breakChance: 0,
    lifespan: 99999999, // 仙人無壽
  },
  {
    id: "jinxian_realm",
    name: "金仙境",
    stage: 11,
    expNeed: 9999999999,
    hpMax: 1200000,
    mpMax: 1200000,
    atk: 80000,
    breakChance: 0,
    lifespan: 99999999, // 金仙超脫,以金魂丹自真仙突破而成
  },
  {
    id: "taiyi_realm",
    name: "太乙境",
    stage: 12,
    expNeed: 9999999999,
    hpMax: 2000000,
    mpMax: 2000000,
    atk: 150000,
    breakChance: 0,
    lifespan: 99999999, // 太乙超脫,集齊蠻荒異界四大地域王的太乙精魂於浮屠塔太乙殿突破而成
  },
);
