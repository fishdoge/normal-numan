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

// 仙靈力顯示色(真仙專屬,紫色)
export const XIANLI_COLOR = "text-fuchsia-400";

// 傷害顯示:每一億(1e8)點傷害計為一點「仙法傷害」
export function formatDamage(n: number): string {
  if (n >= 1e8) {
    const v = n / 1e8;
    return `${v >= 100 ? Math.round(v) : v.toFixed(2)} 仙法傷害`;
  }
  return `${n}`;
}

// 美金顯示:千分位,大額以 K/M/B 縮寫
export function formatStones(n: number): string {
  if (n <= 0) return "$0";
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 10_000) return `$${(n / 1000).toFixed(1)}K`;
  return `$${n.toLocaleString("en-US")}`;
}

export interface Realm {
  id: string;
  name: string; // 煉氣期 前期
  stage: number;
  expNeed: number; // 突破所需修為
  hpMax: number;
  mpMax: number; // 法力上限
  atk: number;
  breakChance: number; // 突破成功率
  lifespan: number; // 該境界壽元上限(載)
}

export type ItemKind =
  | "material"
  | "herb"
  | "pill"
  | "manual"
  | "artifact" // 法器(攻擊,武器槽)
  | "robe" // 法衣(防禦,護甲槽)
  | "amulet" // 護身符(防禦,飾品槽)
  | "talisman" // 符籙(攻擊/輔助,符籙槽)
  | "pet" // 靈寵(寵物槽)
  | "recipe" // 煉器圖譜(使用後解鎖配方)
  | "treasure" // 舊:護身之寶(向後相容,視為 robe)
  | "special";

// 裝備槽定義(硬體配置,順序即交易員欄顯示順序)
export type EquipSlot = "weapon" | "robe" | "amulet" | "talisman" | "pet";
export const EQUIP_SLOTS: { slot: EquipSlot; label: string; kinds: ItemKind[] }[] = [
  { slot: "weapon", label: "顯示卡 GPU", kinds: ["artifact"] },
  { slot: "robe", label: "散熱系統", kinds: ["robe", "treasure"] },
  { slot: "amulet", label: "不斷電 UPS", kinds: ["amulet"] },
  { slot: "talisman", label: "處理器 CPU", kinds: ["talisman"] },
  { slot: "pet", label: "交易機器人", kinds: ["pet"] },
];
export const KIND_LABEL: Record<string, string> = {
  material: "零件",
  herb: "能量飲",
  pill: "營養補給",
  manual: "策略手冊",
  artifact: "顯示卡",
  robe: "散熱",
  amulet: "不斷電",
  talisman: "處理器",
  pet: "交易機器人",
  recipe: "組裝藍圖",
  treasure: "散熱",
  special: "稀有道具",
};
export const slotOfKind = (kind: ItemKind): EquipSlot | null =>
  EQUIP_SLOTS.find((s) => s.kinds.includes(kind))?.slot ?? null;

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
  lifePct?: number; // 依當前壽元上限的百分比延壽(增元丹 = 0.05)
  xianli?: number; // 給予仙靈力點數(天仙丹、先天仙器,真仙專屬)
  // manual → 對應仙法
  teaches?: string;
  // recipe → 解鎖的煉器配方 id
  unlocksRecipe?: string;
  // 裝備屬性
  atkBonus?: number;
  defBonus?: number;
  speedBonus?: number;
  // 靈寵專屬:靈石收益倍率(1.2 = +20%)
  stoneMult?: number;
  // 裝備 / 道具境界需求(stage);超過大乘(8)者僅能由妖獸掉落,坊市與煉器不得取得
  reqStage?: number;
  // 僅能由妖獸掉落(不可購買 / 一般煉器)
  dropOnly?: boolean;
}

export interface Technique {
  id: string;
  name: string;
  element: Element;
  desc: string;
  mpCost: number; // 法力消耗
  power: number; // 威力倍率基底
  reqStage: number; // 需要境界 stage
  learnYears?: number; // 修習年數覆寫(真仙/金仙仙法極長,預設為 reqStage×10)
}

export interface Recipe {
  id: string;
  result: string; // 產出裝備 item id
  name: string;
  materials: { id: string; n: number }[];
  stones: number; // 靈石費用
  desc: string;
  dropOnly?: boolean; // 需由妖獸掉落圖譜解鎖後方可煉製(高階裝備)
  reqStage?: number; // 需要境界
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
  isLord?: boolean; // 地域王(妖獸領主),極稀有
}

export interface Region {
  id: string;
  name: string;
  desc: string;
  reqStage: number;
  lordId?: string; // 該區域的地域王(妖獸領主)
  hidden?: boolean; // 需透過探索秘境解鎖(金源仙域)
  color?: "gold" | "fuchsia"; // 地圖標示色(北寒/金源=紫)
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
