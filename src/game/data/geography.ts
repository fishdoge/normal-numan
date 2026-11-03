// 三界地理(5.2 版新增,設計見 world-travel-design.md):界 → 地域 → 秘境。
// 「現在位置」以地域為單位:同一地域內切換秘境不花時間,地域之間要趕路(真實時間),
// 人間/靈界/仙界彼此隔絕,往上靠飛昇,往下靠破界珠/逆星盤。
import type { SaveData } from "../engine";
import type { Location } from "../types";
import { LOCATIONS } from "./world";
import { factionById } from "./factions";

export type WorldTier = "renjian" | "lingjie" | "xianjie";
export const WORLD_TIERS: { id: WorldTier; name: string }[] = [
  { id: "renjian", name: "人間" },
  { id: "lingjie", name: "靈界" },
  { id: "xianjie", name: "仙界" },
];
export const tierIndex = (t: WorldTier) => WORLD_TIERS.findIndex((x) => x.id === t);
export const tierName = (t: WorldTier) => WORLD_TIERS.find((x) => x.id === t)!.name;

// 境界所屬的界:練氣~煉虛(1~6)人間、合體~渡劫(7~9)靈界、真仙以上(10+)仙界
export const LINGJIE_STAGE = 7;
export const XIANJIE_STAGE = 10;
export const tierOfStage = (stage: number): WorldTier =>
  stage >= XIANJIE_STAGE ? "xianjie" : stage >= LINGJIE_STAGE ? "lingjie" : "renjian";

export interface Zone {
  id: string;
  name: string;
  tier: WorldTier;
  region: string; // 對應 REGIONS 的 id
  continent?: string; // 靈界三大陸:同一 region 再以 continent 細分
  // 需要開通的旗標(沿用既有的區域解鎖欄位);未設定 = 天生可達
  unlockFlag?:
    | "jinyuanUnlocked"
    | "manhuangUnlocked"
    | "zhenmoUnlocked"
    | "huixianUnlocked"
    | "lunhuiUnlocked"
    | "jilingUnlocked"
    | "chashuiUnlocked";
  unlockHint?: string; // 未開通時顯示的取得方式
}

const CANTU_HINT = "蠻荒異界血肉聖殿的妖獸掉落界域殘圖,打開隨機開啟";
export const ZONES: Zone[] = [
  { id: "tiannan", name: "天南 · 越國", tier: "renjian", region: "tiannan" },
  { id: "jindi", name: "血色禁地", tier: "renjian", region: "jindi" },
  { id: "luanxinghai", name: "亂星海", tier: "renjian", region: "luanxinghai" },
  { id: "dajin", name: "大晉皇朝", tier: "renjian", region: "dajin" },
  { id: "fengyuan", name: "風元大陸", tier: "lingjie", region: "lingjie", continent: "fengyuan" },
  { id: "leiming", name: "雷鳴大陸", tier: "lingjie", region: "lingjie", continent: "leiming" },
  { id: "xuetian", name: "血天大陸", tier: "lingjie", region: "lingjie", continent: "xuetian" },
  // 5.4 版:三大陸之外、懸於靈界邊緣的靈環小天地,渡劫期的歷練之地
  { id: "linghuan", name: "靈環界", tier: "lingjie", region: "lingjie", continent: "linghuan" },
  { id: "zhongtu", name: "中土仙域", tier: "xianjie", region: "zhongtu" },
  { id: "beihan", name: "北寒仙域", tier: "xianjie", region: "beihan" },
  { id: "jinyuan", name: "金源仙域", tier: "xianjie", region: "jinyuan", unlockFlag: "jinyuanUnlocked", unlockHint: "雲遊探索秘境時機緣發現" },
  { id: "manhuang", name: "蠻荒異界", tier: "xianjie", region: "manhuang", unlockFlag: "manhuangUnlocked", unlockHint: "集滿五色異星盤開路" },
  // 5.4 版:真魔、灰仙、輪迴、積菱空境、茶水仙域一律由血肉聖殿(蠻荒)妖獸掉落的界域殘圖隨機開啟
  { id: "zhenmo", name: "真魔界", tier: "xianjie", region: "zhenmo", unlockFlag: "zhenmoUnlocked", unlockHint: CANTU_HINT },
  { id: "huixian", name: "灰仙界", tier: "xianjie", region: "huixian", unlockFlag: "huixianUnlocked", unlockHint: CANTU_HINT },
  { id: "lunhui", name: "輪迴界", tier: "xianjie", region: "lunhui", unlockFlag: "lunhuiUnlocked", unlockHint: CANTU_HINT },
  { id: "jiling", name: "積菱空境", tier: "xianjie", region: "jiling", unlockFlag: "jilingUnlocked", unlockHint: CANTU_HINT },
  { id: "chashui", name: "茶水仙域", tier: "xianjie", region: "chashui", unlockFlag: "chashuiUnlocked", unlockHint: CANTU_HINT },
];

// 各界的落點:飛昇靈界落在風元大陸、飛昇仙界落在北寒仙域(中土是道祖坐鎮的最強地域,不適合初飛昇者)
export const LANDING_ZONE: Record<WorldTier, string> = {
  renjian: "tiannan",
  lingjie: "fengyuan",
  xianjie: "beihan",
};

export const zoneById = (id: string | undefined) => ZONES.find((z) => z.id === id);

// 降靈臺(5.4 版):往下界只能從各界的降靈臺出發(靈界在風元大陸、仙界在北寒仙域,都是飛昇落點)
export const DESCENT_ZONE: Partial<Record<WorldTier, string>> = { lingjie: "fengyuan", xianjie: "beihan" };
export const isDescentZone = (zoneId: string) => Object.values(DESCENT_ZONE).includes(zoneId);
// 仙界往靈界不必經過降靈臺(界壁較薄),任何仙域都能直接下界;往人間、靈界往人間仍須從降靈臺出發
export const needsDescentPlatform = (from: WorldTier, to: WorldTier) =>
  !!DESCENT_ZONE[from] && !(from === "xianjie" && to === "lingjie");

// 地圖上的節點位置(座標 0~100 × 0~72,遊歷探索的界域地圖用)
export const ZONE_MAP_POS: Record<string, { x: number; y: number }> = {
  tiannan: { x: 22, y: 50 },
  jindi: { x: 14, y: 20 },
  luanxinghai: { x: 52, y: 44 },
  dajin: { x: 82, y: 26 },
  fengyuan: { x: 18, y: 42 },
  leiming: { x: 50, y: 24 },
  xuetian: { x: 82, y: 44 },
  linghuan: { x: 50, y: 62 },
  beihan: { x: 50, y: 7 },
  jinyuan: { x: 16, y: 27 },
  zhongtu: { x: 50, y: 27 },
  manhuang: { x: 50, y: 46 },
  zhenmo: { x: 20, y: 64 },
  lunhui: { x: 50, y: 65 },
  huixian: { x: 80, y: 64 },
  jiling: { x: 84, y: 40 },
  chashui: { x: 16, y: 46 },
};

// ═══ 5.4 版:血肉聖殿與界域殘圖 ═══
// 擊敗蠻荒四大地域王後,四大領地現出【血肉聖殿】;聖殿妖獸 4% 掉落界域殘圖,
// 打開後完全隨機開啟以下其一(抽到已開通的地域,殘圖就白白耗掉)
export const MANHUANG_LORDS = ["lord_tianhu", "lord_zhenlong", "lord_baxia", "lord_pixiu"];
export const SOUL_OF_LORD: Record<string, string> = {
  taiyi_jinghun_tianhu: "lord_tianhu",
  taiyi_jinghun_zhenlong: "lord_zhenlong",
  taiyi_jinghun_baxia: "lord_baxia",
  taiyi_jinghun_pixiu: "lord_pixiu",
};
export const XUEROU_LOCATION = "xuerou_shengdian";
export const JIEYU_CANTU = "jieyu_cantu";
export const CANTU_DROP_CHANCE = 0.04;
export const CANTU_ZONES = ["lunhui", "zhenmo", "huixian", "jiling", "chashui"];
export const manhuangLordsCleared = (s: Pick<SaveData, "manhuangLordsSlain">) =>
  MANHUANG_LORDS.every((id) => s.manhuangLordsSlain?.includes(id));
export const locationRevealed = (s: Pick<SaveData, "manhuangLordsSlain">, loc: Pick<Location, "unlock">) =>
  loc.unlock !== "manhuangLords" || manhuangLordsCleared(s);

export const zoneOfLocation = (loc: Pick<Location, "region" | "continent">): Zone | undefined =>
  ZONES.find((z) => z.region === loc.region && (!z.continent || z.continent === loc.continent));

export const locationsOfZone = (zoneId: string): Location[] => {
  const z = zoneById(zoneId);
  if (!z) return [];
  return LOCATIONS.filter((l) => l.region === z.region && (!z.continent || z.continent === l.continent));
};

// 地域的進入門檻 = 其中秘境最低的需求境界(沒有秘境的地域,如中土仙域,沿用該界的起始境界)
export const zoneReqStage = (zoneId: string): number => {
  const locs = locationsOfZone(zoneId);
  if (locs.length) return Math.min(...locs.map((l) => l.reqStage));
  const z = zoneById(zoneId);
  return z?.tier === "xianjie" ? XIANJIE_STAGE : z?.tier === "lingjie" ? LINGJIE_STAGE : 1;
};

// 開通:旗標已解鎖,或所屬派系入派即開通此地域(5.4 版:本派領地與必經之地)
export const zoneUnlocked = (
  s: Partial<Pick<SaveData, NonNullable<Zone["unlockFlag"]> | "faction">>,
  zone: Zone,
): boolean =>
  !zone.unlockFlag || !!s[zone.unlockFlag] || !!factionById(s.faction)?.opensZones.includes(zone.id);

// 地圖可見(5.4 版):已開通、且以目前境界進得去(越一階內)的地域才顯示;下界遠征中看得到整個下界
export const zoneVisible = (
  s: Partial<Pick<SaveData, NonNullable<Zone["unlockFlag"]> | "faction">> & { realmIdx: number },
  zone: Zone,
  stage: number,
): boolean => zoneUnlocked(s, zone) && zoneReqStage(zone.id) <= stage + 1;

// 依境界決定所在界的預設地域(舊存檔遷移、境界與所在界不符時的校正):
// 人間放在能進入的最高地域,靈界/仙界放在落點
export function homeZoneForStage(stage: number): string {
  const tier = tierOfStage(stage);
  if (tier !== "renjian") return LANDING_ZONE[tier];
  const reachable = ZONES.filter((z) => z.tier === "renjian" && zoneReqStage(z.id) <= stage);
  return reachable.length ? reachable[reachable.length - 1].id : LANDING_ZONE.renjian;
}

// ═══ 航路:基礎飛遁時間(真實分鐘)、傳送陣費用、險路 ═══
export interface Route {
  a: string;
  b: string;
  minutes: number;
  portalFee?: number; // 有傳送陣:支付靈石瞬間抵達
  perilous?: boolean; // 險路:唯有坐騎的 routes 列出此航路方可通行
}

export const ROUTES: Route[] = [
  { a: "tiannan", b: "jindi", minutes: 5 },
  { a: "tiannan", b: "luanxinghai", minutes: 20, portalFee: 200 }, // 原著的上古傳送陣
  { a: "luanxinghai", b: "dajin", minutes: 30, portalFee: 2_000 },
  { a: "fengyuan", b: "leiming", minutes: 45, portalFee: 500_000 }, // 靈界超級傳送陣
  { a: "leiming", b: "xuetian", minutes: 45, portalFee: 500_000 },
  { a: "fengyuan", b: "linghuan", minutes: 60 }, // 靈環界在三大陸之外,只有飛遁可達,沒有傳送陣
  { a: "xuetian", b: "linghuan", minutes: 60 },
  { a: "zhongtu", b: "beihan", minutes: 30, portalFee: 3_000_000 }, // 天庭掌控的仙界傳送網
  { a: "zhongtu", b: "jinyuan", minutes: 45, portalFee: 3_000_000 },
  { a: "zhongtu", b: "manhuang", minutes: 120, portalFee: 10_000_000 },
  { a: "beihan", b: "manhuang", minutes: 90, perilous: true },
  { a: "manhuang", b: "zhenmo", minutes: 60 },
  { a: "manhuang", b: "huixian", minutes: 90 },
  { a: "manhuang", b: "lunhui", minutes: 60 },
  { a: "manhuang", b: "jiling", minutes: 90 }, // 5.4 版:界域殘圖開啟的兩處新地域,皆由蠻荒前往
  { a: "manhuang", b: "chashui", minutes: 45 },
];

export const routeKey = (a: string, b: string) => [a, b].sort().join("|");

// 跨界(破界珠/逆星盤/返回上界)固定穿越時間,與下界停留時限
export const CROSS_REALM_MINUTES = 30;
export const VISIT_HOURS = 6;
export const MINUTE_MS = 60_000;
export const HOUR_MS = 3_600_000;

// 跨界道具:破界珠往下一界;逆星盤自仙界往人間或靈界
export const POJIE_ZHU = "pojie_zhu";
export const NIXING_PAN = "nixing_pan";
export function descendTargets(itemId: string, from: WorldTier): WorldTier[] {
  if (itemId === POJIE_ZHU) {
    const i = tierIndex(from);
    return i > 0 ? [WORLD_TIERS[i - 1].id] : [];
  }
  if (itemId === NIXING_PAN) return from === "xianjie" ? ["renjian", "lingjie"] : [];
  return [];
}

export interface TravelOptions {
  unlocked: (zone: Zone) => boolean;
  travelMult: number; // 坐騎/載具的移動時間倍率
  mountRoutes: string[]; // 坐騎可走的險路(routeKey)
  routeMult?: (r: Route) => number; // 個別航路的時間倍率(派系加成)
  portalFee?: (r: Route) => number | null; // 個別航路的傳送陣費用(派系折扣;null = 不准使用)
}

function usableEdges(opts: TravelOptions, from: string): { to: string; route: Route }[] {
  const fromZone = zoneById(from);
  if (!fromZone) return [];
  const out: { to: string; route: Route }[] = [];
  for (const r of ROUTES) {
    if (r.a !== from && r.b !== from) continue;
    const to = r.a === from ? r.b : r.a;
    const toZone = zoneById(to);
    if (!toZone || toZone.tier !== fromZone.tier || !opts.unlocked(toZone)) continue;
    if (r.perilous && !opts.mountRoutes.includes(routeKey(r.a, r.b))) continue;
    out.push({ to, route: r });
  }
  return out;
}

// 最短路徑(Dijkstra):cost 決定以「時間」或「傳送陣費用」為權重,傳回 null 表示不可達
function shortestPath(
  opts: TravelOptions,
  from: string,
  to: string,
  cost: (r: Route) => number | null,
): { total: number; path: string[] } | null {
  const dist = new Map<string, number>([[from, 0]]);
  const prev = new Map<string, string>();
  const done = new Set<string>();
  while (true) {
    let cur: string | null = null;
    for (const [z, d] of dist) if (!done.has(z) && (cur === null || d < dist.get(cur)!)) cur = z;
    if (cur === null) return null;
    if (cur === to) break;
    done.add(cur);
    for (const { to: nxt, route } of usableEdges(opts, cur)) {
      const c = cost(route);
      if (c === null) continue;
      const nd = dist.get(cur)! + c;
      if (nd < (dist.get(nxt) ?? Infinity)) {
        dist.set(nxt, nd);
        prev.set(nxt, cur);
      }
    }
  }
  const path = [to];
  while (path[0] !== from) path.unshift(prev.get(path[0])!);
  return { total: dist.get(to)!, path };
}

// 飛遁:沿航路趕路,時間 = 各段基礎時間 × 坐騎倍率,至少 1 分鐘
export function flyPlan(opts: TravelOptions, from: string, to: string): { minutes: number; path: string[] } | null {
  if (from === to) return null;
  const p = shortestPath(opts, from, to, (r) => r.minutes * (opts.routeMult?.(r) ?? 1));
  if (!p) return null;
  return { minutes: Math.max(1, Math.ceil(p.total * opts.travelMult)), path: p.path };
}

// 傳送陣:整條路徑每一段都要有傳送陣,費用加總,瞬間抵達
export function portalPlan(opts: TravelOptions, from: string, to: string): { fee: number; path: string[] } | null {
  if (from === to) return null;
  const p = shortestPath(opts, from, to, (r) =>
    r.portalFee == null ? null : opts.portalFee ? opts.portalFee(r) : r.portalFee,
  );
  return p ? { fee: p.total, path: p.path } : null;
}

// 相鄰航路(輿圖顯示用,不論是否開通)
export const routesOfZone = (zoneId: string) =>
  ROUTES.filter((r) => r.a === zoneId || r.b === zoneId).map((r) => ({
    route: r,
    to: r.a === zoneId ? r.b : r.a,
  }));
