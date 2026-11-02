// 五行煉器(5.3 版新增,設計見 world-travel-design.md 第五節):
// 裝備類配方在 world.ts 原本的材料之外,依配方階層自動補上五行基礎材料、提高靈石費用,並有失敗風險。
// 配方本身不必逐條改寫,所有額外成本都由這裡依規則推算,介面與引擎共用同一份結果。
import type { Element, ItemKind, Recipe } from "../types";
import { ITEMS, itemById } from "./items";
import { LOCATIONS, MONSTERS, REGIONS, ELITE_SPAWNS } from "./world";
import { tierOfStage, type WorldTier } from "./geography";
import { RECIPE_ZONE } from "./xianExpansion";

export type BaseElement = "金" | "木" | "水" | "火" | "土";
export const BASE_ELEMENTS: BaseElement[] = ["金", "木", "水", "火", "土"];

// 五行基礎材料:人間凡品 / 靈界靈品 / 仙界仙品
export const ELEMENT_MATERIAL: Record<WorldTier, Record<BaseElement, string>> = {
  renjian: { 金: "wx_fan_jin", 木: "wx_fan_mu", 水: "wx_fan_shui", 火: "wx_fan_huo", 土: "wx_fan_tu" },
  lingjie: { 金: "wx_ling_jin", 木: "wx_ling_mu", 水: "wx_ling_shui", 火: "wx_ling_huo", 土: "wx_ling_tu" },
  xianjie: { 金: "wx_xian_jin", 木: "wx_xian_mu", 水: "wx_xian_shui", 火: "wx_xian_huo", 土: "wx_xian_tu" },
};
export const isElementMaterial = (id: string) => id.startsWith("wx_");

// 相生:土生金、金生水、水生木、木生火、火生土 —— 輔五行取「生主五行者」
export const GENERATED_BY: Record<BaseElement, BaseElement> = { 金: "土", 水: "金", 木: "水", 火: "木", 土: "火" };

const asBase = (el: Element | undefined): BaseElement =>
  el && (BASE_ELEMENTS as Element[]).includes(el) ? (el as BaseElement) : "土";

// 會套用五行成本與失敗率的成品種類(煉丹配方不變,已有壽元成本)
export const GEAR_KINDS: ItemKind[] = ["artifact", "robe", "treasure", "amulet", "talisman", "mount"];

// ── 物品產地境界:在哪一階的秘境採到、或哪一階的妖獸掉落(取最低者),推算配方階層用 ──
const monsterStage = new Map<string, number>();
const setMin = (m: Map<string, number>, id: string | undefined, v: number) => {
  if (id) m.set(id, Math.min(m.get(id) ?? 99, v));
};
for (const l of LOCATIONS) {
  for (const id of l.monsters) setMin(monsterStage, id, l.reqStage);
  setMin(monsterStage, l.lordId, l.reqStage);
  setMin(monsterStage, ELITE_SPAWNS[l.id], l.reqStage);
  const region = REGIONS.find((r) => r.id === l.region);
  setMin(monsterStage, region?.lordId, l.reqStage);
}
const originStage = new Map<string, number>();
for (const l of LOCATIONS) for (const id of [...l.materials, ...l.herbs]) setMin(originStage, id, l.reqStage);
for (const m of MONSTERS) {
  const st = monsterStage.get(m.id);
  if (st != null) for (const d of m.drops) setMin(originStage, d.id, st);
}
export const itemOriginStage = (id: string) => originStage.get(id.split("@")[0]);

export const isGearRecipe = (rec: Pick<Recipe, "result">) => GEAR_KINDS.includes(itemById(rec.result).kind);

// 配方階層 = max(配方需求境界, 成品需求境界, 各材料的產地境界)
export function recipeStage(rec: Pick<Recipe, "result" | "reqStage" | "materials">): number {
  const result = itemById(rec.result);
  const matStage = Math.max(0, ...rec.materials.map((m) => itemOriginStage(m.id) ?? itemById(m.id).reqStage ?? 1));
  return Math.max(1, rec.reqStage ?? 0, result.reqStage ?? 0, matStage);
}

// 五行材料數量與靈石倍率(依配方階層)
interface ElementBand {
  maxStage: number;
  main: number;
  sub: number;
  all?: number; // 太乙:五行各 all 個
  stoneMult: number;
}
export const ELEMENT_BANDS: ElementBand[] = [
  { maxStage: 3, main: 2, sub: 1, stoneMult: 1.2 },
  { maxStage: 6, main: 4, sub: 2, stoneMult: 1.3 },
  { maxStage: 9, main: 4, sub: 2, stoneMult: 1.4 },
  { maxStage: 11, main: 5, sub: 3, stoneMult: 1.5 },
  { maxStage: 99, main: 0, sub: 0, all: 5, stoneMult: 1.5 },
];
const bandOf = (stage: number) => ELEMENT_BANDS.find((b) => stage <= b.maxStage)!;

export function elementCostOf(stage: number, element: Element | undefined): { id: string; n: number }[] {
  const band = bandOf(stage);
  const mats = ELEMENT_MATERIAL[tierOfStage(stage)];
  if (band.all) return BASE_ELEMENTS.map((el) => ({ id: mats[el], n: band.all! }));
  const main = asBase(element);
  return [
    { id: mats[main], n: band.main },
    { id: mats[GENERATED_BY[main]], n: band.sub },
  ];
}

// 失敗率 = min(40%, 4% + 2.5% × 階層);配方自帶 failChance 者取較高值
export const FAIL_BASE = 0.04;
export const FAIL_PER_STAGE = 0.025;
export const FAIL_CAP = 0.4;
export const failChanceOfStage = (stage: number) => Math.min(FAIL_CAP, FAIL_BASE + FAIL_PER_STAGE * stage);
// 保底(煉器心得):同一配方每連續失敗一次,下次失敗率 −5%,成功後歸零
export const PITY_STEP = 0.05;

// 主五行 = 成品的五行;成品沒有五行時取第一個帶五行的材料,都沒有才用「土」
export const mainElementOf = (rec: Pick<Recipe, "result" | "materials">): Element | undefined =>
  itemById(rec.result).element ?? rec.materials.map((m) => itemById(m.id).element).find((el) => el && el !== "無");

export interface CraftCost {
  gear: boolean;
  stage: number;
  materials: { id: string; n: number }[]; // world.ts 原本的材料
  elements: { id: string; n: number }[]; // 補上的五行材料(非裝備為空)
  stones: number;
  baseFail: number; // 未計保底的失敗率
}

// 煉丹失敗率(5.4 版):min(25%, 2% + 2% × 階層),比煉器溫和;配方自帶失敗率較高時取自帶值
export const PILL_FAIL_BASE = 0.02;
export const PILL_FAIL_PER_STAGE = 0.02;
export const PILL_FAIL_CAP = 0.25;
export const pillFailOfStage = (stage: number) => Math.min(PILL_FAIL_CAP, PILL_FAIL_BASE + PILL_FAIL_PER_STAGE * stage);
const isPillRecipe = (rec: Pick<Recipe, "result">) => itemById(rec.result).kind === "pill";

export function craftCostOf(rec: Recipe): CraftCost {
  if (!isGearRecipe(rec)) {
    const stage = recipeStage(rec);
    const baseFail = Math.max(rec.failChance ?? 0, isPillRecipe(rec) ? pillFailOfStage(stage) : 0);
    return { gear: false, stage, materials: rec.materials, elements: [], stones: rec.stones, baseFail };
  }
  const stage = recipeStage(rec);
  const band = bandOf(stage);
  return {
    gear: true,
    stage,
    materials: rec.materials,
    elements: elementCostOf(stage, mainElementOf(rec)),
    stones: Math.ceil(rec.stones * band.stoneMult),
    baseFail: Math.max(rec.failChance ?? 0, failChanceOfStage(stage)),
  };
}

export const failChanceWithPity = (baseFail: number, pity: number) => Math.max(0, baseFail - PITY_STEP * pity);
// 命器(5.4 版):裝備中的命器,其突破加成同時降低煉器與煉丹的失敗率(消耗型命器煉製時不會耗去)
export const failChanceFinal = (baseFail: number, pity: number, mingBonus: number) =>
  Math.max(0, failChanceWithPity(baseFail, pity) - mingBonus);


// 玄天仙器(太乙境):額外需要仙品五行各 5;失敗時所有材料(含太乙精魂)與靈石全數損失
export const XUANTIAN_ELEMENTS = BASE_ELEMENTS.map((el) => ({ id: ELEMENT_MATERIAL.xianjie[el], n: 5 }));
export const XUANTIAN_FAIL = 0.35; // 5.4 版由 40% 改為 35%
export const XUANTIAN_STONES = 2_500_000_000; // 5.4 版:爐火之資 25 仙元石

// 神器(5.4 版):玄天仙器煉化與道祖神念符,煉器堂另立「神器」分頁、紫框顯示,皆需太乙精魂一枚
export const DIVINE_RECIPE_IDS = ["r_zt_b_shennian_fu"];
export const isDivineItem = (id: string) => id.split("@")[0] === "zt_b_shennian_fu";
export const TAIYI_SOUL_IDS = ["taiyi_jinghun_tianhu", "taiyi_jinghun_zhenlong", "taiyi_jinghun_baxia", "taiyi_jinghun_pixiu"];

// 十階器具的煉製時間(5.4 版,真實分鐘):開爐即扣材料,時間到才出爐揭曉成敗。
// 一般仙域裝備 1~2 小時、圖譜進階裝備 4~6 小時(依仙域強弱),玄天仙器 6 小時;丹藥與十階以下照舊即時完成
const FORGE_ZONE_RANK: Record<string, number> = { beihan: 0, jinyuan: 0, manhuang: 1, zhenmo: 1, lunhui: 1, huixian: 2, zhongtu: 2 };
export const XUANTIAN_FORGE_MINUTES = 360;
export function forgeMinutesOf(rec: Recipe): number {
  if ((rec.reqStage ?? 1) < 10 || !GEAR_KINDS.includes(itemById(rec.result).kind)) return 0;
  const rank = FORGE_ZONE_RANK[RECIPE_ZONE[rec.id] ?? ""] ?? 0;
  return rec.dropOnly ? 240 + 60 * rank : 60 + 30 * rank;
}

// 五行材料掉落:一般妖獸 20% 掉 1 個、菁英 60% 掉 2 個、地域王必掉 3 個
export const ELEMENT_DROP = {
  normal: { chance: 0.2, n: 1 },
  elite: { chance: 0.6, n: 2 },
  lord: { chance: 1, n: 3 },
};
// 「無」「煞」屬性妖獸隨機一種五行
export const elementMaterialFor = (tier: WorldTier, el: Element, roll: number): string =>
  ELEMENT_MATERIAL[tier][
    (BASE_ELEMENTS as Element[]).includes(el) ? (el as BaseElement) : BASE_ELEMENTS[Math.min(4, Math.floor(roll * 5))]
  ];

// 測試/介面:所有五行材料 id
export const ALL_ELEMENT_MATERIALS = ITEMS.filter((i) => isElementMaterial(i.id)).map((i) => i.id);
