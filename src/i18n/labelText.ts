// 通用術語英文對照(物品分類/裝備槽/五行屬性)——1.22 版新增。
import { Language } from "./dict";
import { ItemKind, EquipSlot, Element, KIND_LABEL } from "@/game/types";

export const KIND_LABEL_EN: Record<string, string> = {
  material: "Material",
  herb: "Herb",
  pill: "Pill",
  manual: "Manual",
  artifact: "Artifact",
  robe: "Robe",
  amulet: "Amulet",
  talisman: "Talisman",
  pet: "Pet",
  mingqi: "Mingqi",
  recipe: "Blueprint",
  treasure: "Robe",
  special: "Relic",
  tactic: "Tactic Card",
};

export const EQUIP_SLOT_LABEL_EN: Record<EquipSlot, string> = {
  weapon: "Artifact",
  robe: "Robe",
  amulet: "Amulet",
  talisman: "Talisman",
  pet: "Pet",
  ming: "Mingqi",
};

export const ELEMENT_LABEL_EN: Record<Element, string> = {
  金: "Metal",
  木: "Wood",
  水: "Water",
  火: "Fire",
  土: "Earth",
  無: "None",
};

export function kindLabel(kind: ItemKind | string, lang: Language): string {
  if (lang !== "en") return KIND_LABEL[kind] ?? kind;
  return KIND_LABEL_EN[kind] ?? kind;
}

export function equipSlotLabel(slot: EquipSlot, label: string, lang: Language): string {
  if (lang !== "en") return label;
  return EQUIP_SLOT_LABEL_EN[slot] ?? label;
}

export function elementLabel(el: Element, lang: Language): string {
  if (lang !== "en") return el;
  return ELEMENT_LABEL_EN[el] ?? el;
}
