// 凡人修仙傳 · 核心型別

export type Element = "金" | "木" | "水" | "火" | "土";
export const ELEMENTS: Element[] = ["金", "木", "水", "火", "土"];

// 五行相剋:金克木 木克土 土克水 水克火 火克金
export const COUNTERS: Record<Element, Element> = {
  金: "木",
  木: "土",
  土: "水",
  水: "火",
  火: "金",
};

export const ELEMENT_COLOR: Record<Element, string> = {
  金: "text-metal",
  木: "text-wood",
  水: "text-water",
  火: "text-fire",
  土: "text-earth",
};

// 靈石面額:1 極品 = 100 上品 = 10,000 中品 = 1,000,000 下品
export function formatStones(n: number): string {
  if (n <= 0) return "0 下品";
  const units: [string, number][] = [
    ["極品", 1000000],
    ["上品", 10000],
    ["中品", 100],
    ["下品", 1],
  ];
  const parts: string[] = [];
  let rest = n;
  for (const [label, v] of units) {
    const q = Math.floor(rest / v);
    if (q > 0) {
      parts.push(`${q} ${label}`);
      rest -= q * v;
    }
    if (parts.length >= 2) break; // 最多顯示兩級,避免冗長
  }
  return parts.join(" ");
}

export interface Realm {
  id: string;
  name: string; // 煉氣期 前期
  stage: number;
  expNeed: number; // 突破所需修為
  hpMax: number;
  mpMax: number; // 仙靈力上限
  atk: number;
  breakChance: number; // 突破成功率
  lifespan: number; // 該境界壽元上限(載)
}

export type ItemKind = "material" | "herb" | "pill" | "manual" | "artifact" | "treasure";

export interface ItemDef {
  id: string;
  name: string;
  kind: ItemKind;
  desc: string;
  element?: Element;
  price: number; // 靈石售價
  // pill / herb 效果
  heal?: number;
  mp?: number;
  exp?: number;
  life?: number; // 延壽(載)——極品,坊市不售
  // manual → 對應仙法
  teaches?: string;
  // artifact 屬性
  atkBonus?: number;
  defBonus?: number;
}

export interface Technique {
  id: string;
  name: string;
  element: Element;
  desc: string;
  mpCost: number; // 仙靈力消耗
  power: number; // 威力倍率基底
  reqStage: number; // 需要境界 stage
}

export interface Recipe {
  id: string;
  result: string; // artifact item id
  name: string;
  materials: { id: string; n: number }[];
  stones: number; // 靈石費用
  desc: string;
}

export interface Sect {
  id: string;
  name: string;
  desc: string;
  element: Element;
  startTech: string; // technique id
  bonus: { exp?: number; atk?: number; hp?: number; mp?: number };
}

export interface Monster {
  id: string;
  name: string;
  element: Element;
  hp: number;
  atk: number;
  exp: number;
  stones: [number, number];
  drops: { id: string; chance: number }[];
  desc: string;
}

export interface Region {
  id: string;
  name: string;
  desc: string;
  reqStage: number;
}

export interface Location {
  id: string;
  name: string;
  desc: string;
  region: string;
  reqStage: number;
  monsters: string[];
  materials: string[]; // 可採集
  herbs: string[]; // 仙草
  manualChance: number; // 秘笈掉落率
  manuals: string[];
}
