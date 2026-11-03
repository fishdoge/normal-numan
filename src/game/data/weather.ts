// 天地靈氣(5.4 版):全服共用的天氣,現實每 12 小時換一次(台灣時間 00:00 / 12:00)。
// 平時是五行之一,依傳統生剋加成;偶有罕見的雷、煞——此時仙法傷害 −30%,唯雷系仙法(雷)或煞屬性仙法(煞)不受影響。
//   五行天氣 X:X 屬性傷害 +20%;被 X 所克的屬性 −20%(玩家與妖獸皆同)
//   相剋:金克木、木克土、土克水、水克火、火克金
// 天氣由時段編號雜湊決定,不需存檔,也不必伺服器排程。
import type { Element } from "../types";

export type WeatherKind = "金" | "木" | "水" | "火" | "土" | "雷" | "煞";
export const WEATHER_SLOT_MS = 12 * 3_600_000;
const TW_OFFSET_MS = 8 * 3_600_000;
export const RARE_WEATHER_PENALTY = 0.7; // 雷/煞天氣:非相關仙法傷害 −30%
export const WEATHER_BOOST = 0.2; // 五行天氣:同屬性 +20%、被克 −20%
// 機率:雷 8%、煞 7%,其餘五行均分
const RARE_ODDS: [WeatherKind, number][] = [
  ["雷", 0.08],
  ["煞", 0.07],
];
const FIVE: WeatherKind[] = ["金", "木", "水", "火", "土"];
// X 克 KE[X]
export const KE: Record<string, Element> = { 金: "木", 木: "土", 土: "水", 水: "火", 火: "金" };

export const WEATHER_INFO: Record<WeatherKind, { name: string; desc: string }> = {
  金: { name: "金氣肅殺", desc: "天地間金氣凝重,刀兵之聲隱隱可聞。" },
  木: { name: "木氣生發", desc: "草木瘋長,處處是勃勃生機。" },
  水: { name: "水氣氤氳", desc: "連日細雨,江河漲滿,靈泉翻湧。" },
  火: { name: "火氣熾盛", desc: "烈日當空,地脈中的火氣蒸騰而上。" },
  土: { name: "土氣厚重", desc: "地氣沉凝,山嶽都顯得格外穩固。" },
  雷: { name: "雷劫橫空", desc: "九天雷雲壓境,尋常法力難以凝聚,唯雷法如魚得水。" },
  煞: { name: "煞氣蔽日", desc: "陰煞之氣遮天蔽日,靈氣滯澀,唯煞屬性仙法不受壓制。" },
};

// 時段編號 → [0, 1) 的固定亂數(mulberry32)
function slotRandom(slot: number): number {
  let t = (slot + 0x6d2b79f5) | 0;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
export const weatherSlotOf = (ms: number) => Math.floor((ms + TW_OFFSET_MS) / WEATHER_SLOT_MS);
export function weatherOfSlot(slot: number): WeatherKind {
  let r = slotRandom(slot);
  for (const [kind, p] of RARE_ODDS) {
    if (r < p) return kind;
    r -= p;
  }
  const rest = 1 - RARE_ODDS.reduce((a, [, p]) => a + p, 0);
  return FIVE[Math.min(FIVE.length - 1, Math.floor((r / rest) * FIVE.length))];
}

// 測試用:固定天氣(null 為無任何加成)
let override: WeatherKind | null | undefined;
export const setWeatherOverride = (k: WeatherKind | null | undefined) => {
  override = k;
};

export interface Weather {
  kind: WeatherKind | null;
  startsAt: number;
  endsAt: number;
}
export function weatherAt(ms: number): Weather {
  const slot = weatherSlotOf(ms);
  const startsAt = slot * WEATHER_SLOT_MS - TW_OFFSET_MS;
  return { kind: override !== undefined ? override : weatherOfSlot(slot), startsAt, endsAt: startsAt + WEATHER_SLOT_MS };
}

// 某屬性在此天氣下的五行倍率(雷/煞天氣不看五行)
export function elementWeatherMult(kind: WeatherKind | null, el: Element | undefined): number {
  if (!kind || kind === "雷" || kind === "煞" || !el) return 1;
  if (el === kind) return 1 + WEATHER_BOOST;
  if (KE[kind] === el) return 1 - WEATHER_BOOST;
  return 1;
}
export const isThunderTech = (t: { name: string }) => t.name.includes("雷");
// 玩家仙法在此天氣下的倍率:雷/煞天氣非相關仙法 ×0.7;五行天氣多屬性符寶取最有利的屬性
export function playerWeatherMult(kind: WeatherKind | null, tech: { name: string }, els: Element[]): number {
  if (kind === "雷") return isThunderTech(tech) ? 1 : RARE_WEATHER_PENALTY;
  if (kind === "煞") return els.includes("煞") ? 1 : RARE_WEATHER_PENALTY;
  return Math.max(...els.map((el) => elementWeatherMult(kind, el)));
}
// 介面說明:「火 +20%、金 −20%」或「仙法 −30%(雷法不受影響)」
export function weatherEffectText(kind: WeatherKind | null): string {
  if (!kind) return "";
  if (kind === "雷") return "仙法傷害 −30%,雷系仙法不受影響";
  if (kind === "煞") return "仙法傷害 −30%,煞屬性仙法不受影響";
  return `${kind}屬性 +20%、${KE[kind]}屬性 −20%`;
}
