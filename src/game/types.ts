// 凡人修仙傳 · 核心型別

// 「無」屬性:少數仙法(如元磁神光)本身無五行歸屬,不參與五行相剋,亦不計入 ELEMENTS(該陣列供
// 異星盤集滿/蠻荒異界解鎖等明確以五行為基準的邏輯使用,見 ELEMENTS_WITH_NONE 供仙法分類 UI 專用)。
export type Element = "金" | "木" | "水" | "火" | "土" | "無";
export const ELEMENTS: Element[] = ["金", "木", "水", "火", "土"];
export const ELEMENTS_WITH_NONE: Element[] = [...ELEMENTS, "無"];

// 五行相剋:金克木 木克土 土克水 水克火 火克金;「無」不參與相剋,故用 Partial(查無對應即視為無剋制加成)
export const COUNTERS: Partial<Record<Element, Element>> = {
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
  無: "text-faded",
};

// 仙靈力顯示色(真仙專屬,紫色)
export const XIANLI_COLOR = "text-fuchsia-400";

// 真仙品級道具標色:達真仙(stage 10)以上境界需求的一般道具,不分坊市/掉落/交易行/混沌萬靈榜等顯示情境,
// 一律以紫色標註名稱以資醒目。玄天仙器(見 isXuantianArtifact)另有專屬的流動漸層特效,優先於此。
export const isXianItem = (item: Pick<ItemDef, "reqStage">) => (item.reqStage ?? 0) >= 10;
export const XIAN_ITEM_COLOR = "text-purple-400";

// 玩家道號依境界配色:化神以下(stage < 5)綠、化神~渡劫(5~9)藍、真仙以上(≥10)維持既有的流動金紫漸層。
// 不分道籍面板/排行榜/同門名錄/對話集等顯示情境,一律套用同一份規則。
export const NAME_COLOR_BELOW_HUASHEN = "text-jade";
export const NAME_COLOR_HUASHEN_TO_DUJIE = "text-azure";
export const NAME_COLOR_XIAN_GRADIENT =
  "text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-300 via-amber-200 to-fuchsia-300";
export const nameColorOf = (stage: number): string =>
  stage >= 10
    ? NAME_COLOR_XIAN_GRADIENT
    : stage >= 5
      ? NAME_COLOR_HUASHEN_TO_DUJIE
      : NAME_COLOR_BELOW_HUASHEN;

// 傷害顯示:每一億(1e8)點傷害計為一點「仙法傷害」
export function formatDamage(n: number): string {
  if (n >= 1e8) {
    const v = n / 1e8;
    return `${v >= 100 ? Math.round(v) : v.toFixed(2)} 仙法傷害`;
  }
  return `${n}`;
}

// 靈石面額:1 仙元石 = 100 極品 = 10,000 上品 = 1,000,000 中品 = 100,000,000 下品
// 原著設定:靈石積至百枚極品自動兌換為一枚仙元石,故顯示時一律優先折算為仙元石。
export const STONE_UNITS: [string, number][] = [
  ["仙元石", 100000000],
  ["極品", 1000000],
  ["上品", 10000],
  ["中品", 100],
  ["下品", 1],
];

export interface StonePart {
  label: string;
  qty: number;
}

// 拆解靈石數量為(最多)兩級面額,供純文字與著色顯示共用同一份換算邏輯
export function stoneParts(n: number): StonePart[] {
  if (n <= 0) return [{ label: "下品", qty: 0 }];
  const parts: StonePart[] = [];
  let rest = n;
  for (const [label, v] of STONE_UNITS) {
    const q = Math.floor(rest / v);
    if (q > 0) {
      parts.push({ label, qty: q });
      rest -= q * v;
    }
    if (parts.length >= 2) break; // 最多顯示兩級,避免冗長
  }
  return parts;
}

export function formatStones(n: number): string {
  return stoneParts(n)
    .map((p) => `${p.qty} ${p.label}`)
    .join(" ");
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
  | "mingqi" // 命器(天命符/地運符等,突破成功率加成,命器槽)
  | "recipe" // 煉器圖譜(使用後解鎖配方)
  | "treasure" // 舊:護身之寶(向後相容,視為 robe)
  | "special";

// 裝備槽定義(順序即人物欄顯示順序)
export type EquipSlot = "weapon" | "robe" | "amulet" | "talisman" | "pet" | "ming";
export const EQUIP_SLOTS: { slot: EquipSlot; label: string; kinds: ItemKind[] }[] = [
  { slot: "weapon", label: "法器", kinds: ["artifact"] },
  { slot: "robe", label: "法衣", kinds: ["robe", "treasure"] },
  { slot: "amulet", label: "護身符", kinds: ["amulet"] },
  { slot: "talisman", label: "符籙", kinds: ["talisman"] },
  { slot: "pet", label: "靈寵", kinds: ["pet"] },
  { slot: "ming", label: "命器", kinds: ["mingqi"] },
];
export const KIND_LABEL: Record<string, string> = {
  material: "材料",
  herb: "仙草",
  pill: "丹藥",
  manual: "秘笈",
  artifact: "法器",
  robe: "法衣",
  amulet: "護身符",
  talisman: "符籙",
  pet: "靈寵",
  mingqi: "命器",
  recipe: "圖譜",
  treasure: "法衣",
  special: "仙物",
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
  energy?: number; // 回復精力點數(1.24 版新增)
  life?: number; // 延壽(載)——極品,坊市不售
  lifePct?: number; // 依當前壽元上限的百分比延壽(增元丹 = 0.05)
  xianli?: number; // 給予仙靈力點數(天仙丹、先天仙器,真仙專屬)
  // manual → 對應仙法
  teaches?: string;
  // manual 專屬:設為 true 者可於坊市直接購買(其餘秘笈一律不販售,只能靠獵殺/任務/秘境取得)
  shopSellable?: boolean;
  // recipe → 解鎖的煉器配方 id
  unlocksRecipe?: string;
  // 裝備屬性
  atkBonus?: number;
  defBonus?: number;
  speedBonus?: number;
  // 靈寵專屬:靈石收益倍率(1.2 = +20%)
  stoneMult?: number;
  // 命器專屬:突破成功率加成(0.05 = +5%),不分境界皆生效
  breakBonus?: number;
  // 裝備 / 道具境界需求(stage);超過大乘(8)者僅能由妖獸掉落,坊市與煉器不得取得
  reqStage?: number;
  // 僅能由妖獸掉落(不可購買 / 一般煉器)
  dropOnly?: boolean;
  // 消耗型命器專屬:裝備後,下一次「嘗試突破」無論成敗皆會自動卸下並消耗一枚(見 engine.ts 的 breakthrough case)
  consumable?: boolean;
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
  result: string; // 產出道具 id(裝備或丹藥皆可,「煉器＆煉丹」共用同一套配方機制)
  name: string;
  materials: { id: string; n: number }[];
  stones: number; // 靈石費用
  desc: string;
  dropOnly?: boolean; // 需由妖獸掉落圖譜解鎖後方可煉製(高階裝備/丹藥皆適用)
  reqStage?: number; // 需要境界
  lifeCost?: number; // 煉丹配方額外消耗壽元(載);煉器類配方不填即可,向後相容
  failChance?: number; // 煉製失敗機率(2.17 版新增,目前僅需三種以上材料的符籙配方使用);材料與靈石照樣消耗,失敗則無成品
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
  lordId?: string; // 該區域統一的地域王(妖獸領主);若各秘境領主不同,改用 Location.lordId
  lordChance?: [number, number]; // 地域王遭遇機率區間 [下限, 上限],預設 [0.02, 0.03]
  hidden?: boolean; // 需額外條件解鎖(金源仙域:雲遊探索秘境;蠻荒異界:集滿五色異星盤)
  color?: "gold" | "fuchsia"; // 地圖標示色(北寒/金源/蠻荒=紫)
}

export interface Location {
  id: string;
  name: string;
  desc: string;
  region: string;
  reqStage: number;
  monsters: string[];
  lordId?: string; // 本秘境專屬地域王(蠻荒異界四領地各自不同);未設定則沿用所屬 Region.lordId
  materials: string[]; // 可採集
  herbs: string[]; // 仙草
  manualChance: number; // 秘笈掉落率
  manuals: string[];
  continent?: string; // 同一大陸底下的子分類(如靈界三大陸),對應 CONTINENTS 的 id;未設定則只在「全部」篩選下顯示
}

// 大陸子分類(2.14 版新增,目前僅靈界三大陸使用):供遊歷探索頁籤篩選秘境
export const CONTINENTS: { id: string; name: string }[] = [
  { id: "fengyuan", name: "風元大陸" },
  { id: "leiming", name: "雷鳴大陸" },
  { id: "xuetian", name: "血天大陸" },
];
