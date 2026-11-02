// 仙界派系(5.4 版新增,設計見 world-travel-design.md 第四節):飛昇真仙時擇定派系,
// 各有領地(地域)、加成與敵友關係。領地內的戰鬥/掉落/功勳、敵對領地的巡守截殺、中立領地的過路費,
// 以及加成的實際套用都在 engine.ts;這裡只放資料與純函式。
export type FactionId = "tianting" | "lunhui" | "manhuang" | "jiuyou" | "zhenmo";

export interface Faction {
  id: FactionId;
  name: string;
  homeZone: string; // 領地(geography.ts 的地域 id)
  city: string; // 主城名稱(歸宗令的落點,位於領地內)
  stance: string;
  desc: string;
  perks: string[]; // 介面顯示用的加成說明(數值與下方常數一致)
  opensZones: string[]; // 入派即開通的地域(本派領地,以及從中土前往領地必經之地)
  guardId: string; // 派系巡守(敵對派系成員在本派領地狩獵/採集時可能遭遇)
  color: string; // Tailwind 文字色
}

export const FACTIONS: Faction[] = [
  {
    id: "tianting",
    name: "天庭",
    homeZone: "zhongtu",
    city: "凌霄天宮",
    stance: "正統",
    desc: "執掌仙界秩序的正統仙庭,時間道祖古或今與七八位道祖坐鎮,仙界傳送網的主人。本派領地妖獸冠絕仙界,要到後期才打得動。",
    perks: ["防禦 +8%", "仙界傳送陣半價", "中土、北寒、金源之間移動時間 ×0.75"],
    opensZones: [],
    guardId: "guard_tianting",
    color: "text-amber-300",
  },
  {
    id: "lunhui",
    name: "輪迴殿",
    homeZone: "lunhui",
    city: "輪迴殿",
    stance: "逆天",
    desc: "誓要打破天庭掌控輪迴的隱秘勢力,穿梭界壁是他們的看家本領。",
    perks: ["攻擊 +8%", "下界停留時間 ×2", "兩顆破界珠可代替逆星盤", "每日一次戰敗不損失靈石"],
    opensZones: ["manhuang", "lunhui"],
    guardId: "guard_lunhui",
    color: "text-violet-300",
  },
  {
    id: "manhuang",
    name: "蠻荒勢力",
    homeZone: "manhuang",
    city: "蠻荒王庭",
    stance: "中立",
    desc: "盤踞蠻荒異界的洪荒部族,馴養異獸、肉身強橫,握有中土通往後期三界的要衝。",
    perks: ["氣血 +10%", "坐騎效果再 ×0.8", "蠻荒異界掉落率 +20%"],
    opensZones: ["manhuang"],
    guardId: "guard_manhuang",
    color: "text-orange-300",
  },
  {
    id: "jiuyou",
    name: "九幽修羅",
    homeZone: "huixian",
    city: "九幽修羅殿",
    stance: "魔道",
    desc: "以煞入道的修羅一脈,化煞氣為力量,盤踞死寂的灰仙界。",
    perks: ["煞屬性符寶傷害 +20%", "煞氣造成的傷害懲罰減半", "灰仙界掉落率 +20%"],
    opensZones: ["manhuang", "huixian"],
    guardId: "guard_jiuyou",
    color: "text-red-400",
  },
  {
    id: "zhenmo",
    name: "真魔聖域",
    homeZone: "zhenmo",
    city: "真魔聖殿",
    stance: "魔道",
    desc: "真魔界的魔道聖地,嗜殺續戰、以戰養戰。",
    perks: ["擊殺妖獸後回復 10% 氣血", "真魔界掉落率 +20%", "洗煞池機率 ×2"],
    opensZones: ["manhuang", "zhenmo"],
    guardId: "guard_zhenmo",
    color: "text-rose-400",
  },
];

export const factionById = (id: string | null | undefined) => FACTIONS.find((f) => f.id === id);
// 領地的主人(沒有派系坐鎮的地域,如北寒、金源,回傳 undefined)
export const ownerOfZone = (zoneId: string) => FACTIONS.find((f) => f.homeZone === zoneId);

export type Relation = "self" | "neutral" | "hostile" | "enemy";
// 敵友關係:天庭與輪迴殿死敵;天庭與兩魔道、兩魔道彼此敵對;蠻荒勢力與所有派系中立
const HOSTILE: [FactionId, FactionId, Relation][] = [
  ["tianting", "lunhui", "enemy"],
  ["tianting", "jiuyou", "hostile"],
  ["tianting", "zhenmo", "hostile"],
  ["jiuyou", "zhenmo", "hostile"],
];
export function relationOf(a: FactionId, b: FactionId): Relation {
  if (a === b) return "self";
  const hit = HOSTILE.find(([x, y]) => (x === a && y === b) || (x === b && y === a));
  return hit ? hit[2] : "neutral";
}
export const RELATION_LABEL: Record<Relation, string> = { self: "本派", neutral: "中立", hostile: "敵對", enemy: "死敵" };

// ── 加成數值 ──
export const TIANTING_DEF_PCT = 0.08;
export const TIANTING_PORTAL_MULT = 0.5;
export const TIANTING_TRAVEL_MULT = 0.75;
export const TIANTING_FAST_ZONES = ["zhongtu", "beihan", "jinyuan"];
export const LUNHUI_ATK_PCT = 0.08;
export const LUNHUI_VISIT_MULT = 2;
export const LUNHUI_PEARLS_FOR_DISC = 2;
export const LUNHUI_GRACE_HOURS = 24;
export const MANHUANG_HP_PCT = 0.1;
export const MANHUANG_MOUNT_MULT = 0.8;
export const JIUYOU_SHA_CARD_PCT = 0.2;
export const JIUYOU_SHAQI_PENALTY_MULT = 0.5;
export const ZHENMO_KILL_HEAL_PCT = 0.1;
export const ZHENMO_XISHA_MULT = 2;
export const HOME_DROP_MULT = 1.2; // 本派領地掉落率(蠻荒/九幽/真魔)

// ── 領地規則 ──
export const AMBUSH_CHANCE: Partial<Record<Relation, number>> = { hostile: 0.12, enemy: 0.2 };
export const TOLL_KILLS = 10; // 中立領地過路費 = 該地域一般妖獸平均靈石 × 10
export const MERIT_HOME_KILL = 1;
export const MERIT_GUARD_KILL = 30;
export const RECALL_COOLDOWN_HOURS = 12;
export const CHANGE_COOLDOWN_DAYS = 7;
// 破空(玄天仙器):同界瞬移冷卻;玄天斬靈劍斬破界壁(免破界珠往下一界)冷卻
export const RIFT_COOLDOWN_HOURS = 8;
export const RIFT_CROSS_COOLDOWN_HOURS = 24;
export const RIFT_CROSS_WEAPON = "xuantian_zhanling_jian";

// ── 派系商店(功勳兌換):faction 未設定 = 各派皆售 ──
export interface FactionShopEntry {
  itemId: string;
  merit: number;
  faction?: FactionId;
}
export const FACTION_SHOP: FactionShopEntry[] = [
  { itemId: "pojie_zhu", merit: 600 },
  { itemId: "nixing_pan", merit: 2500 },
  { itemId: "mount_tianma", merit: 1500, faction: "tianting" },
  { itemId: "mount_mingchuan", merit: 1500, faction: "lunhui" },
  { itemId: "mount_juxi", merit: 1500, faction: "manhuang" },
  { itemId: "mount_gujiu", merit: 1500, faction: "jiuyou" },
  { itemId: "mount_moqi", merit: 1500, faction: "zhenmo" },
];
export const shopOf = (f: FactionId) => FACTION_SHOP.filter((e) => !e.faction || e.faction === f);
