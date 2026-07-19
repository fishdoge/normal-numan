import { Realm } from "../types";

// 大境界(取材凡人修仙傳:人界→靈界→飛昇)
// stage: 1煉氣 2築基 3結丹 4元嬰 5化神 6煉虛 7合體 8大乘 9渡劫
const MAJORS = [
  { name: "煉氣期", exp: 40, hp: 60, mp: 30, atk: 6, brk: 0.95 },
  { name: "築基期", exp: 420, hp: 420, mp: 230, atk: 42, brk: 0.85 },
  { name: "結丹期", exp: 3200, hp: 2300, mp: 1300, atk: 190, brk: 0.75 },
  { name: "元嬰期", exp: 22000, hp: 12000, mp: 7000, atk: 850, brk: 0.65 },
  { name: "化神期", exp: 130000, hp: 62000, mp: 37000, atk: 3800, brk: 0.55 },
  { name: "煉虛期", exp: 750000, hp: 310000, mp: 190000, atk: 17000, brk: 0.5 },
  { name: "合體期", exp: 4200000, hp: 1500000, mp: 950000, atk: 75000, brk: 0.45 },
  { name: "大乘期", exp: 22000000, hp: 7200000, mp: 4600000, atk: 330000, brk: 0.4 },
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
  }))
);

REALMS.push(
  {
    id: "dujie", name: "渡劫期", stage: 9,
    expNeed: 100000000, hpMax: 30000000, mpMax: 20000000, atk: 1300000,
    breakChance: 0.3,
  },
  {
    id: "feisheng", name: "真仙(已飛昇)", stage: 10,
    expNeed: 999999999999, hpMax: 99999999, mpMax: 99999999, atk: 9999999,
    breakChance: 0,
  }
);
