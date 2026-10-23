import { LOCATIONS, MONSTERS } from "./world";
import type { Element } from "../types";

// 遊歷場景插畫(4.1 版新增):每個大區域一張夜色仙俠風景,靈界依三大陸再細分。同一區域內的秘境共用
// 同一張圖,改用不同的取景位置(SCENE_FOCUS)做出區別;戰鬥畫面的背景也取自這裡。
const REGION_ART: Record<string, string> = {
  tiannan: "tiannan",
  jindi: "jindi",
  luanxinghai: "luanxinghai",
  dajin: "dajin",
  beihan: "beihan",
  jinyuan: "jinyuan",
  manhuang: "manhuang",
  zhenmo: "zhenmo", // 5.0 版合併 3.19:真魔界
  huixian: "huixian", // 5.0 版合併 3.19:灰仙界
};
const CONTINENT_ART: Record<string, string> = {
  fengyuan: "lingjie-fengyuan",
  leiming: "lingjie-leiming",
  xuetian: "lingjie-xuetian",
};
// 非秘境的特殊戰鬥(雲遊大 BOSS / 天劫試煉 / 浮屠塔)
const SPECIAL_ART: Record<string, string> = {
  __wander__: "/images/world/moonlit-mountains.webp",
  __tianjie__: "/images/world/regions/lingjie-leiming.webp",
  __futu__: "/images/world/regions/jinyuan.webp",
  // 3.19 版一次性秘境地圖道具(locationId 為 __map_{道具 id}__)
  __map_guanghanjie__: "/images/world/regions/guanghan.webp",
  __map_kunpeng_yihai__: "/images/world/regions/kunpeng.webp",
};
const FALLBACK_ART = "/images/world/spirit-forest.webp";

const SCENE_FOCUS = ["50% 45%", "18% 62%", "82% 38%", "35% 78%", "68% 22%", "8% 30%", "92% 70%"];

// 秘境氛圍色:取該秘境妖獸最多的屬性,疊一層淡淡的五行光暈(炎火谷偏赤、寒潭偏藍……)
const ELEMENT_TINT: Record<Element, string> = {
  金: "rgba(212, 175, 55, 0.30)",
  木: "rgba(90, 168, 96, 0.30)",
  水: "rgba(90, 143, 208, 0.34)",
  火: "rgba(224, 96, 58, 0.34)",
  土: "rgba(176, 128, 64, 0.30)",
  無: "rgba(238, 172, 67, 0.18)",
  煞: "rgba(120, 104, 128, 0.36)",
};
function tintOf(monsterIds: string[]): string {
  const count = new Map<Element, number>();
  for (const id of monsterIds) {
    const el = MONSTERS.find((m) => m.id === id)?.element;
    if (el) count.set(el, (count.get(el) ?? 0) + 1);
  }
  let best: Element = "無";
  let bestN = 0;
  for (const [el, n] of count) if (n > bestN) [best, bestN] = [el, n];
  return ELEMENT_TINT[best];
}

const artPath = (name: string) => `/images/world/regions/${name}.webp`;

export function regionArt(regionId: string, continentId?: string): string {
  if (continentId && CONTINENT_ART[continentId]) return artPath(CONTINENT_ART[continentId]);
  if (regionId === "lingjie") return artPath(CONTINENT_ART.fengyuan);
  return REGION_ART[regionId] ? artPath(REGION_ART[regionId]) : FALLBACK_ART;
}

export function sceneOfLocation(locationId: string): { src: string; focus: string; tint: string } {
  if (SPECIAL_ART[locationId]) return { src: SPECIAL_ART[locationId], focus: "50% 50%", tint: "transparent" };
  const loc = LOCATIONS.find((l) => l.id === locationId);
  if (!loc) return { src: FALLBACK_ART, focus: "50% 50%", tint: "transparent" };
  const siblings = LOCATIONS.filter(
    (l) => l.region === loc.region && l.continent === loc.continent,
  );
  const idx = Math.max(
    0,
    siblings.findIndex((l) => l.id === loc.id),
  );
  return {
    src: regionArt(loc.region, loc.continent),
    focus: SCENE_FOCUS[idx % SCENE_FOCUS.length],
    tint: tintOf(loc.monsters),
  };
}
