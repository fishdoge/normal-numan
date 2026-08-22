// 儲物袋分類:全站共用的道具分類方式,原本只用於儲物袋分頁(ActionTabs.tsx 的 BAG_SECTIONS)。
// 坊市、黑市、交易行、混沌萬靈榜、宗門倉庫等所有「列出一堆道具」的地方一律改用同一份分類,
// 分類鍵一律用語言無關的 DictKey 當識別碼(而非中文標題本身),避免篩選狀態隨語言切換而失效。
import type { DictKey } from "@/i18n/dict";
import type { ItemKind } from "@/game/types";

export const ITEM_SECTIONS: [DictKey, ItemKind[]][] = [
  ["bagSecMaterial", ["material"]],
  ["bagSecHerbPill", ["herb", "pill"]],
  ["bagSecGear", ["artifact", "robe", "treasure", "amulet", "talisman"]],
  ["bagSecPet", ["pet"]],
  ["bagSecMing", ["mingqi"]],
  ["bagSecManual", ["manual", "recipe"]],
  ["bagSecSpecial", ["special"]],
];

// 依 ITEM_SECTIONS 順序,找出某個 kind 屬於哪一個分類鍵(找不到時回傳 null)
export const sectionKeyOfKind = (kind: ItemKind): DictKey | null =>
  ITEM_SECTIONS.find(([, kinds]) => kinds.includes(kind))?.[0] ?? null;
