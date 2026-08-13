// 境界名稱英文翻譯對照表(1.21 版新增)——依 realms.ts 的 id 對照。
import { Language } from "./dict";

const MAJOR_EN = [
  "Qi Refining",
  "Foundation Establishment",
  "Core Formation",
  "Nascent Soul",
  "Deity Transformation",
  "Void Refinement",
  "Body Integration",
  "Mahayana",
];
const MINOR_EN = ["Early", "Middle", "Late"];

export const REALM_NAME_EN: Record<string, string> = {
  dujie: "Tribulation Crossing",
  feisheng: "True Immortal (Ascended)",
  jinxian_realm: "Golden Immortal Realm",
  taiyi_realm: "Taiyi Realm",
};
for (let i = 0; i < MAJOR_EN.length; i++) {
  for (let j = 0; j < MINOR_EN.length; j++) {
    REALM_NAME_EN[`r${i}_${j}`] = `${MINOR_EN[j]} ${MAJOR_EN[i]}`;
  }
}

export function realmDisplayName(realm: { id: string; name: string } | undefined | null, lang: Language): string {
  if (!realm) return "??";
  if (lang !== "en") return realm.name;
  return REALM_NAME_EN[realm.id] ?? realm.name;
}

// 大境界階數(stage)→ 英文名稱,供宗門加成來源等只有 stage 數字、沒有完整 Realm 物件的地方查詢
export const STAGE_LABEL_EN: Record<number, string> = {
  4: "Nascent Soul",
  5: "Deity Transformation",
  6: "Void Refinement",
  7: "Body Integration",
  8: "Mahayana",
  10: "True Immortal",
  11: "Golden Immortal",
  12: "Taiyi Realm",
};

export function stageLabel(stage: number, zhFallback: string, lang: Language): string {
  if (lang !== "en") return zhFallback;
  return STAGE_LABEL_EN[stage] ?? zhFallback;
}
