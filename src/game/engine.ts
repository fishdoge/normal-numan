// 伺服器權威遊戲引擎:所有獎勵運算在此執行,前端僅顯示
import { COUNTERS, Element, Monster, ItemDef, formatDamage } from "./types";
import { REALMS } from "./data/realms";
import { SECTS } from "./data/sects";
import { techById } from "./data/techniques";
import { itemById, ITEMS, XUANTIAN_ARTIFACT_IDS } from "./data/items";
import { LOCATIONS, MONSTERS, RECIPES, REGIONS } from "./data/world";
import { MISSIONS } from "./data/missions";
import { dwellingLevelOf } from "./data/sectTiers";

export interface CombatState {
  monsterId: string;
  monsterHp: number;
  locationId: string;
  isLord?: boolean; // 地域王 / 仙帝 / 超級 BOSS 遭遇(額外標示)
  futuFloor?: number; // 浮屠塔:正在挑戰的層數(幻象太歲天尊)
  bossHpMax?: number; // 動態 BOSS 的氣血上限(浮屠塔用)
  bossAtk?: number; // 動態 BOSS 的攻擊(浮屠塔用)
}

export interface Learning {
  techId: string;
  remain: number; // 剩餘年數
}

export interface SaveData {
  started: boolean;
  name: string;
  sectId: string | null;
  realmIdx: number;
  exp: number;
  hp: number;
  mp: number;
  stones: number;
  inventory: Record<string, number>;
  learned: string[];
  learning: Learning | null;
  equippedWeapon: string | null; // 法器
  equippedArmor: string | null; // 舊欄位(法衣);保留以相容,遷移至 equippedRobe
  equippedRobe: string | null; // 法衣
  equippedAmulet: string | null; // 護身符
  equippedTalisman: string | null; // 符籙
  equippedPet: string | null; // 靈寵
  equippedMing: string | null; // 命器(天命符/地運符等,突破成功率加成)
  unlockedRecipes: string[]; // 已解鎖的圖譜配方 id
  jinyuanUnlocked: boolean; // 金源仙域是否已由探索秘境解鎖
  manhuangUnlocked: boolean; // 蠻荒異界是否已集滿五色異星盤解鎖
  futuFloor: number; // 浮屠塔已通關的最高層數(幻象太歲天尊)
  kills: Record<string, number>;
  seen: string[];
  lordsSeen: string[]; // 已遭遇的地域王(妖獸領主)
  missionId: string | null;
  missionBase: number;
  age: number;
  lifeBonus: number;
  day: number;
  cultToday: number;
  xianli: number; // 仙靈力(真仙專屬,攻擊倍數單位,每點 +0.2 倍)
  techLevels: Record<string, number>; // 仙法等級(1~7),增靈珠強化
  boonHp: number; // 雲遊四海永久加成(固定比例累加)
  boonAtk: number;
  boonDef: number;
  boonSpeed: number;
  boonReset?: boolean; // 已執行 1.5 版 boon 歸零遷移
  dead: boolean;
  log: string[];
  combat: CombatState | null;
  dwellingSlot: number | null; // 目前停泊的宗門仙境位置(slot_idx),未停泊為 null
  energy: number; // 精力,每 5 分鐘真實時間回復 1 點,行動皆需消耗
  energyPotionStacks: number; // 倍力丹已疊加次數(0~5),每疊永久 +10% 精力上限
}

export interface Modal {
  title: string;
  lines: string[];
  success?: boolean;
}

export interface ActionResult {
  save: SaveData;
  loot?: Modal; // 採集/戰利品彈窗
  breakResult?: Modal; // 突破結果彈窗
  error?: string;
}

const MAX_LOG = 60;

// 每部秘笈的學習年數:仙法可自訂 learnYears,否則境界需求 ×10 年
export const learnYears = (techId: string) => {
  const t = techById(techId);
  return t.learnYears ?? t.reqStage * 10;
};

// 打坐修煉每次消耗的壽元:5 年,隨大境界翻倍(練氣5 築基10 結丹20 元嬰40……)
export const cultCostOf = (s: Pick<SaveData, "realmIdx">) =>
  5 * Math.pow(2, REALMS[s.realmIdx].stage - 1);

// 仙法等級(1~7),以增靈珠強化;每級 +30% 威力
export const MAX_TECH_LEVEL = 7;
export const techLevelOf = (s: Pick<SaveData, "techLevels">, techId: string) =>
  s.techLevels?.[techId] ?? 1;
export const techPowerMult = (level: number) => 1 + (level - 1) * 0.3;

// 仙靈力:每一點 = 攻擊 ×0.2 倍(真仙專屬,紫色)
export const XIANLI_MULT = 0.2;

export const maxLifeOf = (s: Pick<SaveData, "realmIdx" | "lifeBonus">) =>
  REALMS[s.realmIdx].lifespan + s.lifeBonus;

// 精力上限:隨大境界緩慢遞增(非氣血/法力那種指數翻倍),煉氣期 100、每個大境界 +15;
// 倍力丹每疊(最多 5 疊)永久 +10% 上限。
const ENERGY_BASE = 100;
const ENERGY_PER_STAGE = 15;
export const energyMaxOf = (s: Pick<SaveData, "realmIdx" | "energyPotionStacks">) => {
  const base = ENERGY_BASE + ENERGY_PER_STAGE * (REALMS[s.realmIdx].stage - 1);
  return Math.floor(base * (1 + 0.1 * (s.energyPotionStacks ?? 0)));
};

// 各項行動消耗的精力(戰鬥中每回合的攻擊/施法/遁走不額外收費,已含在啟動獵殺的那次消耗裡)
export const ENERGY_COST: Record<string, number> = {
  cultivate: 5,
  rest: 5,
  wander: 15,
  gather: 8,
  hunt: 10,
  breakthrough: 20,
  craft: 10,
  craftXuantian: 10,
};
export const MAX_ENERGY_POTION_STACKS = 5;

// 精力回復:每 5 分鐘真實時間 1 點,由 /api/action、/api/save 依 last_energy_at 差距換算成點數呼叫。
export function applyEnergyRegen(s: SaveData, points: number) {
  if (points <= 0) return;
  s.energy = Math.min(energyMaxOf(s), (s.energy ?? 0) + points);
}

export function statsOf(s: SaveData) {
  const realm = REALMS[s.realmIdx];
  const sect = SECTS.find((x) => x.id === s.sectId);
  // 各裝備槽(法器 / 法衣 / 護身符 / 符籙 / 靈寵 / 命器)
  const weapon = s.equippedWeapon ? itemById(s.equippedWeapon) : null;
  const robe =
    (s.equippedRobe ?? s.equippedArmor) ? itemById((s.equippedRobe ?? s.equippedArmor)!) : null;
  const amulet = s.equippedAmulet ? itemById(s.equippedAmulet) : null;
  const talisman = s.equippedTalisman ? itemById(s.equippedTalisman) : null;
  const pet = s.equippedPet ? itemById(s.equippedPet) : null;
  const ming = s.equippedMing ? itemById(s.equippedMing) : null;
  const gear = [weapon, robe, amulet, talisman, pet, ming];
  const sumAtk = gear.reduce((a, g) => a + (g?.atkBonus ?? 0), 0);
  const sumDef = gear.reduce((a, g) => a + (g?.defBonus ?? 0), 0);
  const sumSpeed = gear.reduce((a, g) => a + (g?.speedBonus ?? 0), 0);
  const baseAtk = realm.atk + (sect?.bonus.atk ?? 0) + sumAtk + (s.boonAtk ?? 0);
  // 仙靈力:一點 = 攻擊 ×0.2 倍(真仙專屬,紫色)
  const xianli = s.xianli ?? 0;
  const atk = Math.floor(baseAtk * (1 + xianli * XIANLI_MULT));
  const def = sumDef + (s.boonDef ?? 0);
  const hpMax = realm.hpMax + (sect?.bonus.hp ?? 0) + (s.boonHp ?? 0);
  const mpMax = realm.mpMax + (sect?.bonus.mp ?? 0);
  const speed = realm.atk + Math.floor(sumSpeed) + realm.stage * 5 + (s.boonSpeed ?? 0);
  const stoneMult = pet?.stoneMult ?? 1;
  const breakBonus = ming?.breakBonus ?? 0;
  return {
    realm,
    sect,
    atk,
    baseAtk,
    xianli,
    def,
    hpMax,
    mpMax,
    speed,
    stoneMult,
    breakBonus,
    weaponEl: weapon?.element ?? talisman?.element,
  };
}

// 突破成功率:境界基礎值 + 命器(天命符/地運符等)加成,上限 99%。
// 境界基礎值為 0(如真仙,僅能靠仙物突破)者一律鎖死為 0,命器加成不生效——
// 避免玩家繞過「集齊真仙丹」等專屬機制,直接用命器把不可能的突破賭成小機率可行。
export function breakChanceOf(s: SaveData): number {
  const realm = REALMS[s.realmIdx];
  if (realm.breakChance <= 0) return 0;
  const { breakBonus } = statsOf(s);
  return Math.min(0.99, realm.breakChance + breakBonus);
}

// 宗門集體戰力:境界 stage → 每人每次疊加的戰鬥傷害加成比例(未列出的境界不貢獻)。
// 同一份表由 /api/action(算真正套用的倍率)與前端(算顯示用的目前加成)共用,避免兩邊算法各寫一份而兜不起來。
export const SECT_STAGE_BONUS: Record<number, number> = {
  4: 0.05, // 元嬰
  5: 0.07, // 化神
  6: 0.09, // 煉虛
  7: 0.11, // 合體
  8: 0.15, // 大乘
  10: 0.4, // 真仙
  11: 0.6, // 金仙
  12: 1.2, // 太乙境
};

// 依宗門成員的境界 stage 清單,算出戰鬥傷害倍率:1 + Σ(每人對應加成)
export function sectDamageMultOfStages(stages: (number | null | undefined)[]): number {
  let mult = 1;
  for (const stage of stages) {
    if (stage != null && SECT_STAGE_BONUS[stage]) mult += SECT_STAGE_BONUS[stage];
  }
  return mult;
}

const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const monsterById = (id: string): Monster => MONSTERS.find((m) => m.id === id)!;

// 秘境可給予的裝備 / 秘笈池
const EQUIP_KINDS = ["artifact", "robe", "amulet", "talisman", "pet"];
const ITEMS_EQUIP = ITEMS.filter((i) => EQUIP_KINDS.includes(i.kind));
const ITEMS_MANUAL = ITEMS.filter((i) => i.kind === "manual" && i.teaches);

function elementMult(attacker: Element | undefined, defender: Element): number {
  if (!attacker) return 1;
  if (COUNTERS[attacker] === defender) return 1.5;
  if (COUNTERS[defender] === attacker) return 0.75;
  return 1;
}

// 蠻荒異界四大地域王的專屬異能(monster id 對照見 world.ts)
const MONSTER_DODGE_CHANCE: Record<string, number> = { lord_tianhu: 0.3 }; // 天狐:三成機率避過玩家攻擊
const MONSTER_TRIPLE_ATK_CHANCE: Record<string, number> = { lord_zhenlong: 0.2 }; // 真龍:兩成機率反擊 ×3
const SPELL_SEALED_MONSTERS = new Set(["lord_pixiu"]); // 黑眼貔貅:封鎖玩家法術,無法施展仙法

function log(s: SaveData, ...msgs: string[]) {
  s.log = [...s.log, ...msgs].slice(-MAX_LOG);
}

export function give(s: SaveData, id: string, n = 1) {
  s.inventory[id] = (s.inventory[id] ?? 0) + n;
}

function take(s: SaveData, id: string, n = 1): boolean {
  if ((s.inventory[id] ?? 0) < n) return false;
  s.inventory[id] -= n;
  if (s.inventory[id] <= 0) delete s.inventory[id];
  return true;
}

export function newSave(name: string, sectId: string): SaveData {
  const sect = SECTS.find((x) => x.id === sectId)!;
  const s: SaveData = {
    started: true,
    name: name || "無名散修",
    sectId,
    realmIdx: 0,
    exp: 0,
    hp: 0,
    mp: 0,
    stones: 20,
    inventory: { huanglongdan: 2, liaoshangdan: 1 },
    learned: [sect.startTech],
    learning: null,
    equippedWeapon: null,
    equippedArmor: null,
    equippedRobe: null,
    equippedAmulet: null,
    equippedTalisman: null,
    equippedPet: null,
    equippedMing: null,
    unlockedRecipes: [],
    jinyuanUnlocked: false,
    manhuangUnlocked: false,
    futuFloor: 0,
    kills: {},
    seen: [],
    lordsSeen: [],
    missionId: null,
    missionBase: 0,
    age: 16,
    lifeBonus: 0,
    day: 1,
    cultToday: 0,
    xianli: 0,
    techLevels: {},
    boonHp: 0,
    boonAtk: 0,
    boonDef: 0,
    boonSpeed: 0,
    dead: false,
    log: [],
    combat: null,
    dwellingSlot: null,
    energy: 0,
    energyPotionStacks: 0,
  };
  const { hpMax, mpMax } = statsOf(s);
  s.hp = hpMax;
  s.mp = mpMax;
  s.energy = energyMaxOf(s);
  log(
    s,
    `${s.name} 拜入 ${sect.name},自此踏上修仙之路。`,
    `長老傳授入門仙法:${techById(sect.startTech).name}。`,
    "身上僅有 20 枚下品靈石與幾瓶丹藥,前路漫漫,道阻且長。",
  );
  return s;
}

function maybeEncounter(s: SaveData) {
  const realm = REALMS[s.realmIdx];
  const roll = Math.random();
  if (roll < 0.03) {
    // 真仙/金仙的 expNeed 是無法達成的巨大佔位值(用來鎖死「靠修為突破」這條路),
    // 不可拿來換算獎勵,否則會灌出天量修為/靈石——改以 hpMax 為基準。
    const gain =
      realm.stage >= 10 ? Math.floor(realm.hpMax * 0.3) : Math.floor(realm.expNeed * 0.15);
    s.exp += gain;
    log(s, `打坐間心神空明,天地法則於眼前一閃而逝——頓悟!修為 +${gain}。`);
  } else if (roll < 0.05) {
    const stones =
      realm.stage >= 10
        ? Math.floor(realm.hpMax * 0.5) + rand(1000, 5000)
        : Math.floor(realm.expNeed * 0.005) + rand(10, 100);
    s.stones += stones;
    log(s, `你偶遇一位隕落修士的遺蛻,收殮入土後,拾得遺留靈石 ${stones} 枚。`);
  } else if (roll < 0.075) {
    const herbs = ["zhuguo", "xuelingzhi", "zijinhua", "qiannianlingru"];
    const h = herbs[rand(0, realm.stage >= 3 ? 3 : 2)];
    give(s, h);
    log(s, `一隻靈猴自林間擲來一株【${itemById(h).name}】,吱吱兩聲便竄得無影無蹤。`);
  } else if (roll < 0.085) {
    const lost = Math.floor(s.stones * 0.05);
    s.stones -= lost;
    log(s, `一名遊方散修與你論道半日,臨別時你才發現儲物袋輕了——被順走了 ${lost} 靈石!`);
  } else if (roll < 0.105) {
    const gain = Math.floor(realm.expNeed * 0.025);
    s.exp += gain;
    log(s, `荒亭避雨,偶遇一位白髮老道與你手談一局。局終人杳,棋盤上殘留一縷道韻——修為 +${gain}。`);
  } else if (roll < 0.12 && realm.stage >= 3) {
    give(s, "dahuandan");
    log(s, "你救下一名被妖獸圍攻的散修,對方傾囊相贈一枚【大還丹】,拱手而別。");
  } else if (roll < 0.135 && realm.stage >= 4) {
    const pool = ["m_aohan", "m_dageng", "m_yuanci"];
    const m = pool[rand(0, realm.stage >= 5 ? 2 : 1)];
    give(s, m);
    log(s, `地動山搖,一座上古洞府破土而出!你搶在群修之前取走【${itemById(m).name}】,遁光而去。`);
  } else if (roll < 0.143) {
    give(s, "wanshoudan");
    log(s, "你於一處無名廢墟中掘出一只丹盒,盒中靜臥一枚【百壽丹】——延壽百載的奇丹!");
  } else if (roll < 0.146) {
    give(s, "yanshouguo");
    log(s, "懸崖之下異香撲鼻——竟是一株萬載一熟的【延壽果】!你顫抖著雙手將其摘下。");
  } else if (roll < 0.147 && REALMS[s.realmIdx].stage >= 5) {
    give(s, "panlongtao");
    log(s, "九天之上仙音縹緲,一枚龍紋壽桃自雲端墜落,正落你掌心——【蟠龍壽桃】!此乃仙界之物!");
  }
}

// 全伺服器統一時間戳:每 1 小時真實時間 = 1 年壽元,與 cultivate/rest/wander 原本的耗壽元並存。
// 由 /api/action、/api/save 於每次請求時依 last_life_at 與現在時間的差距呼叫。
export function applyRealTimeAging(s: SaveData, hours: number) {
  if (hours <= 0 || !s.started || s.dead) return;
  const cap = maxLifeOf(s);
  s.age += hours;
  s.day = s.age;
  if (s.age >= cap) {
    s.age = cap;
    s.day = s.age;
    s.dead = true;
    s.combat = null;
    log(
      s,
      "光陰似箭,任你道行通天,終究抵不過時光流逝——你在光陰荏苒間壽元耗盡。",
      `享年 ${cap} 年,道隕於【${REALMS[s.realmIdx].name}】。`,
    );
    return;
  }
  log(s, `光陰荏苒,${hours} 年悄然流逝(現壽元 ${s.age}/${cap})。`);
}

// 宗門仙境:停泊中的位置每小時真實時間緩慢增長修為,由 /api/action 依各位置目前等級結算。
// 由伺服器依 saves.dwelling_since 與現在時間的差距呼叫,level 由呼叫端查詢 sect_dwelling 表後傳入。
export function applyDwellingExp(s: SaveData, hours: number, level: number) {
  if (hours <= 0 || !s.started || s.dead) return;
  const gain = Math.floor(hours * dwellingLevelOf(level).expPerHour);
  if (gain <= 0) return;
  s.exp += gain;
  log(s, `你於宗門仙境靜心潛修 ${hours} 個時辰,修為 +${gain}。`);
}

// 向仙班祈禱 · 六道輪迴盤:確認付款成功後由 /api/webhooks/payments 呼叫,使道隕的角色死而復生。
// 終身僅可一次(由呼叫端的 users.revival_used 把關),此函式本身只負責復活時的存檔狀態還原。
export function reviveSave(s: SaveData): void {
  if (!s.dead) return;
  const cap = maxLifeOf(s);
  s.dead = false;
  s.combat = null;
  // 壽元退回上限的八成,留出喘息空間,而非卡在死亡當下的臨界值
  s.age = Math.max(0, cap - Math.floor(cap * 0.2));
  s.day = s.age;
  const { hpMax, mpMax } = statsOf(s);
  s.hp = hpMax;
  s.mp = mpMax;
  log(
    s,
    "六道輪迴盤光華大盛,輪迴道祖以【輪迴天生術】自死劫中將你的道基重新接引回來——你死而復生!",
  );
}

// 回傳戰敗彈窗(defeat 有值時代表這回合被打到氣血歸零,呼叫端應以此彈窗取代靜默記錄)
function monsterTurn(s: SaveData): { lines: string[]; defeat?: Modal } {
  if (!s.combat) return { lines: [] };
  const lines: string[] = [];
  const mon = monsterById(s.combat.monsterId);
  const monAtk = s.combat.bossAtk ?? mon.atk;
  const { def, hpMax, speed } = statsOf(s);
  const monSpeed = Math.floor(monAtk * 1.2);
  const dodge = Math.min(0.35, Math.max(0.05, (speed / (speed + monSpeed)) * 0.5));
  if (Math.random() < dodge) {
    lines.push(`${mon.name} 撲擊而來,你身形一晃,堪堪避過!(閃避 ${Math.round(dodge * 100)}%)`);
    log(s, ...lines);
    return { lines };
  }
  let dmg = Math.max(1, rand(Math.floor(monAtk * 0.8), Math.floor(monAtk * 1.2)) - def);
  const enraged = Math.random() < (MONSTER_TRIPLE_ATK_CHANCE[mon.id] ?? 0);
  if (enraged) dmg *= 3;
  lines.push(
    `${mon.name} 反擊${enraged ? ",龍血狂暴,攻擊力驟增三倍" : ""},你受到 ${dmg} 點傷害。`,
  );
  s.hp -= dmg;
  if (s.hp <= 0) {
    const lost = Math.floor(s.stones / 2);
    const surviveHp = Math.max(1, Math.floor(hpMax * 0.3));
    lines.push(`你身受重傷不敵,倉皇遁走…… 遺失了 ${lost} 靈石。`);
    s.hp = surviveHp;
    s.stones -= lost;
    s.combat = null;
    log(s, ...lines);
    return {
      lines,
      defeat: {
        title: "戰 敗 遁 走",
        success: false,
        lines: [
          `不敵【${mon.name}】,身受重傷!`,
          `受創 ${dmg} 點,氣血驟降至 ${surviveHp}/${hpMax}(僅剩三成)。`,
          `倉皇遁走間,遺失靈石 ${lost} 枚。`,
        ],
      },
    };
  }
  log(s, ...lines);
  return { lines };
}

function winCombat(s: SaveData): Modal {
  const mon = monsterById(s.combat!.monsterId);
  const { stoneMult } = statsOf(s);

  // 浮屠塔:通關一層 → 記錄層數、給予隨層數遞增的獎勵
  const floor = s.combat!.futuFloor;
  if (floor && mon.id === "huanxiang_taisui") {
    s.combat = null;
    s.futuFloor = Math.max(s.futuFloor, floor);
    const reward = Math.floor(200000 * floor * stoneMult);
    s.stones += reward;
    const lines = [`你在浮屠塔擊碎第 ${floor} 層的幻象太歲天尊!`, `靈石 +${reward}`];
    // 每 5 層必得天仙丹;每 10 層必得金魂丹
    if (floor % 10 === 0) {
      give(s, "jinhundan");
      lines.push("塔靈嘉獎:【金魂丹】一枚!");
    } else if (floor % 5 === 0) {
      give(s, "tianxiandan");
      lines.push("塔靈嘉獎:【天仙丹】一枚!");
    } else if (Math.random() < 0.25) {
      give(s, "tianxiandan");
      lines.push("幻象崩解間,一枚【天仙丹】墜落!");
    }
    // 高層機緣:頂尖仙法秘笈(極難)
    if (floor >= 30 && !s.learned.includes("zhutian_shenlei") && Math.random() < 0.1) {
      give(s, "m_zhutian");
      lines.push("塔頂金光大盛——你竟得傳說中的【《誅天神雷金仙法》仙簡】!");
    } else if (floor >= 15 && !s.learned.includes("taiqing_daoyun") && Math.random() < 0.12) {
      give(s, "m_taiqing");
      lines.push("幻象深處浮現一卷【《太清道韻九轉》玉冊】,你伸手攝來!");
    }
    lines.push(`下一層(第 ${floor + 1} 層)的幻象太歲天尊,將強大一倍。`);
    log(s, `浮屠塔第 ${floor} 層告破!靈石 +${reward}。`);
    return { title: `浮 屠 塔 · 第 ${floor} 層`, success: true, lines };
  }

  // 靈石橫財:10% 機率雙倍靈石
  let stones = Math.floor(rand(mon.stones[0], mon.stones[1]) * stoneMult);
  const windfall = Math.random() < 0.1;
  if (windfall) stones *= 2;
  const dropNames: string[] = [];
  for (const d of mon.drops) {
    if (Math.random() < d.chance) {
      give(s, d.id);
      dropNames.push(itemById(d.id).name);
    }
  }
  s.exp += mon.exp;
  s.stones += stones;
  s.kills[mon.id] = (s.kills[mon.id] ?? 0) + 1;
  const isLord = mon.isLord;
  s.combat = null;
  log(
    s,
    `${isLord ? "歷經苦戰,你竟斬殺了地域之王 " : "你擊殺了 "}${mon.name}!獲得修為 ${mon.exp}、靈石 ${stones}${windfall ? "(靈石橫財,雙倍!)" : ""}${dropNames.length ? ",拾得:" + dropNames.join("、") : ""}。`,
  );
  return {
    title: isLord ? "地 域 王 授 首" : "戰 利 品",
    success: true,
    lines: [
      `${isLord ? "斬殺地域王" : "擊殺"}【${mon.name}】`,
      ...(mon.exp > 0 ? [`修為 +${mon.exp}`] : []),
      `靈石 +${stones}${windfall ? "(靈石橫財,雙倍!)" : ""}`,
      ...(dropNames.length
        ? [`拾得:${dropNames.join("、")}`]
        : [isLord ? "此王氣運深厚,竟未留下寶物,可惜!" : "妖獸未留下完整材料。"]),
    ],
  };
}

// 依道具種類裝備到對應槽位;回傳是否成功
function equipToSlot(s: SaveData, item: ItemDef): boolean {
  switch (item.kind) {
    case "artifact":
      s.equippedWeapon = item.id;
      return true;
    case "robe":
    case "treasure":
      s.equippedRobe = item.id;
      return true;
    case "amulet":
      s.equippedAmulet = item.id;
      return true;
    case "talisman":
      s.equippedTalisman = item.id;
      return true;
    case "pet":
      s.equippedPet = item.id;
      return true;
    case "mingqi":
      s.equippedMing = item.id;
      return true;
    default:
      return false;
  }
}
const slotVerb = (kind: string) =>
  kind === "artifact"
    ? "祭於身前,攻伐大增"
    : kind === "talisman"
      ? "貼身催動"
      : kind === "mingqi"
        ? "佩於命宮,冥冥中似有天機牽引"
        : kind === "pet"
          ? "收為靈寵,伴隨左右"
          : "穿戴護身";

// 探索秘境(雲遊際遇,紫色):秘笈 / 靈石 / 法術 / 裝備 / 靈寵,並有機會解鎖金源仙域
function exploreSecretRealm(s: SaveData): ActionResult {
  const realm = REALMS[s.realmIdx];
  const lines: string[] = ["雲遊途中,你踏入一處與世隔絕的上古【秘境】——"];
  const roll = Math.random();

  // 12% 解鎖金源仙域(僅真仙,且尚未解鎖)
  if (realm.stage >= 10 && !s.jinyuanUnlocked && roll < 0.12) {
    s.jinyuanUnlocked = true;
    lines.push(
      "秘境盡頭,一道金色仙門轟然洞開——【金源仙域】的入口自此為你顯現!",
      "遊歷探索的地圖上,金源仙域已然解鎖。其中妖獸之強,遠勝北寒五十倍,慎入。",
    );
    log(s, "你於秘境深處尋得通往【金源仙域】的仙門,新地圖解鎖!");
    return { save: s, loot: { title: "秘 境 · 金 源 仙 門", success: true, lines } };
  }

  // 5% 得靈寵(依境界給對應等級靈寵)
  if (roll < 0.17) {
    const petPool = [
      { id: "pet_linghu", stage: 4 },
      { id: "pet_xuangui", stage: 5 },
      { id: "pet_jinpeng", stage: 8 },
      { id: "pet_tianhu", stage: 10 },
      { id: "pet_hundun", stage: 11 },
    ].filter((p) => realm.stage >= p.stage);
    const pick = petPool.length ? petPool[petPool.length - 1] : { id: "pet_linghu", stage: 4 };
    give(s, pick.id);
    const pet = itemById(pick.id);
    lines.push(`秘境靈氣氤氳,一頭【${pet.name}】與你一見投緣,自願隨行!`, pet.desc);
    log(s, `你在秘境中收服了靈寵【${pet.name}】!`);
    return { save: s, loot: { title: "秘 境 · 靈 寵 相 隨", success: true, lines } };
  }

  // 25% 完整裝備(依境界給予,秘境不受 dropOnly 限制)
  if (roll < 0.42) {
    const gearPool = ITEMS_EQUIP.filter(
      (i) => (i.reqStage ?? 1) <= realm.stage && i.id !== "jinhundan",
    );
    if (gearPool.length) {
      const g = gearPool[rand(0, gearPool.length - 1)];
      give(s, g.id);
      lines.push(`石室中靜置著一件【${g.name}】,你伸手取之,如獲至寶!`, g.desc);
      log(s, `你於秘境得到裝備【${g.name}】!`);
      return { save: s, loot: { title: "秘 境 · 仙 家 遺 寶", success: true, lines } };
    }
  }

  // 25% 法術秘笈(依境界)
  if (roll < 0.67) {
    const manualPool = ITEMS_MANUAL.filter((i) => {
      const t = i.teaches ? techById(i.teaches) : null;
      return t && t.reqStage <= realm.stage && !s.learned.includes(i.teaches!);
    });
    if (manualPool.length) {
      const m = manualPool[rand(0, manualPool.length - 1)];
      give(s, m.id);
      lines.push(`一方玉簡懸浮於秘境祭壇——【${m.name}】,你小心收入囊中。`, m.desc);
      log(s, `你於秘境得到秘笈【${m.name}】!`);
      return { save: s, loot: { title: "秘 境 · 玉 簡 傳 承", success: true, lines } };
    }
  }

  // 其餘:大量靈石
  const gain = Math.floor(realm.expNeed * 0.5) + rand(100, 500);
  s.stones += gain;
  lines.push(`秘境中一座靈石礦脈熠熠生輝,你滿載而歸——靈石 +${gain}!`);
  log(s, `你於秘境採得靈石 ${gain} 枚!`);
  return { save: s, loot: { title: "秘 境 · 靈 石 礦 脈", success: true, lines } };
}

// ═══ 主入口 ═══
export function applyAction(
  s: SaveData,
  type: string,
  payload: Record<string, unknown> = {},
): ActionResult {
  const result = applyActionInner(s, type, payload);
  // 統一收尾:氣血 / 法力 不得超過各自上限(也不得為負)
  const { hpMax, mpMax } = statsOf(result.save);
  result.save.hp = Math.max(0, Math.min(hpMax, result.save.hp));
  result.save.mp = Math.max(0, Math.min(mpMax, result.save.mp));
  return result;
}

function applyActionInner(
  s: SaveData,
  type: string,
  payload: Record<string, unknown> = {},
): ActionResult {
  // 向後相容:補齊舊存檔缺少的欄位
  if (!Array.isArray(s.lordsSeen)) s.lordsSeen = [];
  if (typeof s.xianli !== "number") s.xianli = 0;
  if (!s.techLevels || typeof s.techLevels !== "object") s.techLevels = {};
  // 1.5 版:雲遊四海 boon 曾為指數成長,一律歸零重置(遊戲平衡)
  if (!s.boonReset) {
    s.boonHp = 0;
    s.boonAtk = 0;
    s.boonDef = 0;
    s.boonSpeed = 0;
    s.boonReset = true;
  }
  if (typeof s.boonHp !== "number") s.boonHp = 0;
  if (typeof s.boonAtk !== "number") s.boonAtk = 0;
  if (typeof s.boonDef !== "number") s.boonDef = 0;
  if (typeof s.boonSpeed !== "number") s.boonSpeed = 0;
  // 1.5 版:裝備槽重構——舊 equippedArmor(法衣)遷移至 equippedRobe
  if (s.equippedRobe === undefined) s.equippedRobe = s.equippedArmor ?? null;
  if (s.equippedAmulet === undefined) s.equippedAmulet = null;
  if (s.equippedTalisman === undefined) s.equippedTalisman = null;
  if (s.equippedPet === undefined) s.equippedPet = null;
  if (s.equippedMing === undefined) s.equippedMing = null;
  if (!Array.isArray(s.unlockedRecipes)) s.unlockedRecipes = [];
  if (typeof s.jinyuanUnlocked !== "boolean") s.jinyuanUnlocked = false;
  if (typeof s.manhuangUnlocked !== "boolean") s.manhuangUnlocked = false;
  if (typeof s.futuFloor !== "number") s.futuFloor = 0;
  if (s.dwellingSlot === undefined) s.dwellingSlot = null;
  // 精力系統:舊存檔沒有這兩個欄位,補滿精力、疊加次數歸零
  if (typeof s.energyPotionStacks !== "number") s.energyPotionStacks = 0;
  if (typeof s.energy !== "number") s.energy = energyMaxOf(s);

  if (s.dead && type !== "reset") return { save: s, error: "你已道隕,唯有轉世重修。" };

  // 精力不足時,消耗精力的行動一律無法發起(不足以嘗試就不算數,不扣任何資源)
  const energyCost = ENERGY_COST[type];
  if (energyCost != null && (s.energy ?? 0) < energyCost) {
    return { save: s, error: `精力不足(需 ${energyCost},現有 ${Math.floor(s.energy ?? 0)}),稍待回復或服用倍力丹。` };
  }

  // 停泊宗門仙境靜心潛修時,無法分心他顧——採集/獵殺/雲遊/打坐/調息/突破一律不可行
  if (
    s.dwellingSlot != null &&
    (type === "gather" ||
      type === "hunt" ||
      type === "wander" ||
      type === "cultivate" ||
      type === "rest" ||
      type === "breakthrough")
  ) {
    return { save: s, error: "你正於宗門仙境中閉關潛修,無法分心他顧,須先離開仙境方可行動。" };
  }

  switch (type) {
    case "cultivate": {
      if (s.combat) return { save: s, error: "激戰之中,無法打坐。" };
      s.energy -= energyCost;
      const { realm, sect, mpMax } = statsOf(s);
      const cost = cultCostOf(s);
      const cap = maxLifeOf(s);
      // 打坐消耗壽元;壽元耗盡即道隕
      if (s.age + cost >= cap) {
        s.age = cap;
        s.dead = true;
        s.combat = null;
        log(
          s,
          "你強提一口真氣打坐,卻覺經脈枯涸,鏡中鬢髮霜白——壽元已盡。",
          `享年 ${cap} 年,道隕於【${realm.name}】。仙路無情,一步遲,步步遲。`,
        );
        return { save: s };
      }
      s.age += cost;
      s.day = s.age; // 修行年限直接等於壽元
      // 真仙/金仙的 expNeed 是不可達成的巨大佔位值,打坐修為公式同樣不可直接套用,
      // 否則會在真仙期一次打坐就灌出數億修為(詳見 1.6 版說明)。
      const expBase = realm.stage >= 10 ? realm.hpMax * 0.02 : realm.expNeed;
      const base = expBase * (0.04 + Math.random() * 0.03);
      const gain = Math.max(1, Math.floor(base * (1 + (sect?.bonus.exp ?? 0) / 100)));
      s.exp += gain;
      s.mp = Math.min(mpMax, s.mp + Math.floor(mpMax * 0.25));
      s.cultToday += 1;
      const lines = [`你盤膝打坐,吐納靈氣,修為 +${gain}(耗壽元 ${cost} 年,現 ${s.age}/${cap})。`];
      // 修習仙法推進(以打坐年月推進)
      if (s.learning) {
        s.learning.remain -= cost;
        const tech = techById(s.learning.techId);
        if (s.learning.remain <= 0) {
          s.learned.push(s.learning.techId);
          s.learning = null;
          lines.push(`苦修有成,水到渠成——你終於參透【${tech.name}】,自此多一大神通!`);
        } else {
          lines.push(`【${tech.name}】修習中,尚需 ${s.learning.remain} 年。`);
        }
      }
      log(s, ...lines);
      maybeEncounter(s);
      return { save: s };
    }

    case "rest": {
      if (s.combat) return { save: s, error: "激戰之中,無法調息。" };
      const { hpMax } = statsOf(s);
      if (s.hp >= hpMax) {
        log(s, "你氣血充盈,無需調息。");
        return { save: s };
      }
      s.energy -= energyCost;
      // 調息消耗壽元:為打坐修煉的 2 倍
      const restCost = cultCostOf(s) * 2;
      const cap = maxLifeOf(s);
      if (s.age + restCost >= cap) {
        s.age = cap;
        s.dead = true;
        s.combat = null;
        log(
          s,
          "你強行運轉周天調息療傷,卻覺生機如燭火將熄——壽元已盡。",
          `享年 ${cap} 年,道隕於【${REALMS[s.realmIdx].name}】。`,
        );
        return { save: s };
      }
      s.age += restCost;
      s.day = s.age;
      s.hp = hpMax;
      log(s, `你緩緩吐納,周天運轉,氣血盡復(耗壽元 ${restCost} 年,現 ${s.age}/${cap})。`);
      return { save: s };
    }

    case "wander": {
      if (s.combat) return { save: s, error: "激戰之中,無法遠遊。" };
      const WANDER_LIFE = 5000;
      const WANDER_STONES = 100 * 1000000; // 100 極品靈石
      const cap = maxLifeOf(s);
      if (s.stones < WANDER_STONES) {
        log(s, `雲遊四海需備 100 極品靈石為盤纏,你囊中羞澀,無法成行。`);
        return { save: s };
      }
      if (s.age + WANDER_LIFE >= cap) {
        log(s, `雲遊四海耗時 5000 載,你壽元將盡,豈能遠行?先延壽再議。`);
        return { save: s };
      }
      s.stones -= WANDER_STONES;
      s.age += WANDER_LIFE;
      s.day = s.age;
      s.energy -= energyCost;
      const roll = Math.random();
      // 4% 遭遇金仙境超級大 BOSS
      if (roll < 0.04) {
        const boss = monsterById("jinxian");
        s.combat = {
          monsterId: boss.id,
          monsterHp: boss.hp,
          locationId: "__wander__",
          isLord: true,
        };
        if (!s.seen.includes(boss.id)) s.seen.push(boss.id);
        if (!s.lordsSeen.includes(boss.id)) s.lordsSeen.push(boss.id);
        log(
          s,
          "雲遊萬里,忽見金光垂天——一位【太上金仙】立於雲端俯瞰眾生!絕世威壓下,你竟無從遁逃,唯有死戰!",
        );
        return { save: s };
      }
      // 5% 探索秘境(紫色際遇):秘笈 / 靈石 / 法術 / 裝備,並有機會解鎖金源仙域
      if (roll < 0.08) {
        return exploreSecretRealm(s);
      }
      // 2.5% 直接得天仙丹
      if (roll < 0.105) {
        give(s, "tianxiandan");
        log(s, "雲遊至一處仙家洞府,你於塵封玉匣中尋得一枚【天仙丹】——曠世機緣!");
        return {
          save: s,
          loot: {
            title: "雲 遊 奇 緣",
            success: true,
            lines: [
              "雲遊四海,福緣深厚:",
              "於仙家洞府得【天仙丹】一枚!",
              "飛昇為真仙後煉化,可增一點仙靈力。",
            ],
          },
        };
      }
      // 30% 永久屬性提升(固定比例:以「境界基礎值」的 3% 累加,非指數成長)
      if (roll < 0.405) {
        const realm = REALMS[s.realmIdx];
        const kind = rand(0, 3);
        let line: string;
        if (kind === 0) {
          const g = Math.max(5, Math.floor(realm.hpMax * 0.03));
          s.boonHp += g;
          line = `於仙山秘境洗髓伐毛,氣血上限永久 +${g}!`;
        } else if (kind === 1) {
          const g = Math.max(2, Math.floor(realm.atk * 0.03));
          s.boonAtk += g;
          line = `得一位隱世前輩指點武道,攻擊永久 +${g}!`;
        } else if (kind === 2) {
          const g = Math.max(2, Math.floor(realm.atk * 0.03));
          s.boonDef += g;
          line = `於古戰場悟得護體真意,防禦永久 +${g}!`;
        } else {
          const g = Math.max(2, Math.floor(realm.stage * 3));
          s.boonSpeed += g;
          line = `踏遍名山大川,身法漸臻化境,速度永久 +${g}!`;
        }
        log(s, `雲遊四海,遍歷奇遇——${line}`);
        return {
          save: s,
          loot: { title: "雲 遊 際 遇", success: true, lines: ["歷經五千載雲遊,終有所得:", line] },
        };
      }
      // 一無所獲
      log(s, "雲遊四海五千載,山川壯麗,人事滄桑,卻未逢機緣,徒增閱歷而已。");
      return {
        save: s,
        loot: {
          title: "雲 遊 四 海",
          success: false,
          lines: ["五千載遊歷,飽覽天地,卻無所得。", "仙途本就如此——大機緣可遇不可求。"],
        },
      };
    }

    case "breakthrough": {
      if (s.combat) return { save: s, error: "激戰之中,無法突破。" };
      const realm = REALMS[s.realmIdx];
      // 金仙/太乙皆非修為突破可及(金仙→太乙須集滿太乙精魂於太乙殿突破),一併攔下
      if (s.realmIdx >= REALMS.length - 1 || realm.id === "jinxian_realm") {
        log(s, "你已位列仙班,此境非修為突破可及,另有機緣方能更進一步。");
        return { save: s };
      }
      if (s.exp < realm.expNeed) {
        log(
          s,
          `修為不足,突破 ${REALMS[s.realmIdx + 1].name} 需 ${realm.expNeed} 修為(現有 ${s.exp})。`,
        );
        return { save: s };
      }
      // 渡劫→真仙:除修為外,還需一枚真仙丹(唯靈界地域王「太古龍祖」掉落)。
      // 無論這次突破成敗,真仙丹都會被耗盡。
      const needsZhenxian = realm.id === "dujie";
      if (needsZhenxian && (s.inventory["zhenxiandan"] ?? 0) < 1) {
        log(s, "天劫將至,然你尚未集得【真仙丹】——僅憑修為,道基終究不穩,無法渡劫飛昇。");
        return { save: s };
      }
      if (needsZhenxian) take(s, "zhenxiandan");
      s.energy -= energyCost;
      const chance = breakChanceOf(s);
      // 消耗型命器:機率已計入本次 chance,只要確實擲骰嘗試,無論成敗都會化為飛灰
      if (s.equippedMing) {
        const mingItem = itemById(s.equippedMing);
        if (mingItem?.consumable) {
          take(s, s.equippedMing);
          s.equippedMing = null;
        }
      }
      if (Math.random() < chance) {
        const next = REALMS[s.realmIdx + 1];
        s.realmIdx += 1;
        s.exp -= realm.expNeed;
        const { hpMax, mpMax } = statsOf(s);
        s.hp = hpMax;
        s.mp = mpMax;
        let breakResult: Modal;
        if (next.stage === 10) {
          breakResult = {
            success: true,
            title: "白 日 飛 昇",
            lines: [
              "九霄之上雷雲翻湧,萬丈金光自天門傾瀉——你踏碎虛空,白日飛昇!",
              "自山村凡童至真仙之軀,這一步,你走了一生。",
            ],
          };
        } else if (next.stage > realm.stage) {
          const gift = Math.floor(next.lifespan * 0.1);
          s.lifeBonus += gift;
          breakResult = {
            success: true,
            title: "突 破 大 關",
            lines: [
              `天地色變,靈氣如百川歸海——你渡過大關,晉入【${next.name}】!`,
              `壽元上限躍升至 ${next.lifespan} 年,脫胎換骨,額外增壽 ${gift} 年。`,
            ],
          };
        } else {
          breakResult = {
            success: true,
            title: "突 破 成 功",
            lines: [`靈氣灌體,經脈轟鳴——你成功突破至【${next.name}】!氣血法力盡復。`],
          };
        }
        log(s, ...breakResult.lines);
        return { save: s, breakResult };
      }
      // 失敗:修為直接歸零,道基折損最大壽元 15%
      const lost = s.exp;
      const lifeCut = Math.floor(maxLifeOf(s) * 0.15);
      s.exp = 0;
      s.lifeBonus -= lifeCut;
      const cap = maxLifeOf(s);
      const lines = [
        `靈氣暴走,經脈俱震!修為盡數潰散,歸零損失 ${lost}。`,
        `道基受創,最大壽元折損 ${lifeCut} 年(現上限 ${cap} 年)。`,
      ];
      if (s.age >= cap) {
        s.age = cap;
        s.dead = true;
        s.combat = null;
        lines.push("壽元隨道基崩毀而枯竭——你隕落於突破途中。");
      }
      log(s, ...lines);
      return { save: s, breakResult: { success: false, title: "突 破 失 敗", lines } };
    }

    case "gather": {
      if (s.combat) return { save: s, error: "激戰之中!" };
      const loc = LOCATIONS.find((l) => l.id === payload.locationId);
      if (!loc) return { save: s, error: "無此秘境" };
      const { realm } = statsOf(s);
      if (realm.stage < loc.reqStage) {
        log(s, `${loc.name} 兇險異常,以你現在的境界踏入必死無疑。`);
        return { save: s };
      }
      s.energy -= energyCost;
      if (Math.random() < 0.35 && loc.monsters.length) {
        const mid = loc.monsters[rand(0, loc.monsters.length - 1)];
        const mon = monsterById(mid);
        s.combat = { monsterId: mid, monsterHp: mon.hp, locationId: loc.id };
        if (!s.seen.includes(mid)) s.seen.push(mid);
        log(s, `你在 ${loc.name} 採集時,${mon.name} 突然襲來!`);
        return { save: s };
      }
      const pool = [...loc.materials, ...loc.herbs];
      if (pool.length === 0) {
        log(s, `${loc.name} 靈氣雖濃,卻無可供採集的靈材,唯有獵殺妖獸方有所得。`);
        return { save: s };
      }
      const found: string[] = [];
      const n = rand(1, 2);
      for (let i = 0; i < n; i++) {
        const id = pool[rand(0, pool.length - 1)];
        give(s, id);
        found.push(itemById(id).name);
      }
      const lines = [`採得:${found.join("、")}`];
      log(s, `你在 ${loc.name} 仔細搜尋,${lines.join(";")}。`);
      maybeEncounter(s);
      return {
        save: s,
        loot: {
          title: "採 集 所 得",
          success: true,
          lines: [`於【${loc.name}】搜尋一番:`, ...lines],
        },
      };
    }

    case "hunt": {
      if (s.combat) return { save: s, error: "激戰之中!" };
      const loc = LOCATIONS.find((l) => l.id === payload.locationId);
      if (!loc) return { save: s, error: "無此秘境" };
      const { realm } = statsOf(s);
      if (realm.stage < loc.reqStage) {
        log(s, `${loc.name} 兇險異常,以你現在的境界踏入必死無疑。`);
        return { save: s };
      }
      s.energy -= energyCost;
      // 機率遭遇地域王(妖獸領主);秘境專屬地域王(如蠻荒異界四領地)優先於區域統一地域王
      const region = REGIONS.find((r) => r.id === loc.region);
      const lordId = loc.lordId ?? region?.lordId;
      const [lcMin, lcMax] = region?.lordChance ?? [0.02, 0.03];
      const lordChance = lcMin + Math.random() * (lcMax - lcMin);
      if (lordId && Math.random() < lordChance) {
        const lord = monsterById(lordId);
        s.combat = { monsterId: lord.id, monsterHp: lord.hp, locationId: loc.id, isLord: true };
        if (!s.seen.includes(lord.id)) s.seen.push(lord.id);
        if (!s.lordsSeen.includes(lord.id)) s.lordsSeen.push(lord.id);
        log(
          s,
          `⚠ 天地驟然一暗——${loc.name} 的地域之王【${lord.name}】現身了!(${lord.element}屬性)絕世凶威,撲面而來!`,
        );
        return { save: s };
      }
      const mid = loc.monsters[rand(0, loc.monsters.length - 1)];
      const mon = monsterById(mid);
      s.combat = { monsterId: mid, monsterHp: mon.hp, locationId: loc.id, isLord: mon.isLord };
      if (!s.seen.includes(mid)) s.seen.push(mid);
      if (mon.isLord && !s.lordsSeen.includes(mid)) s.lordsSeen.push(mid);
      log(
        s,
        mon.isLord
          ? `⚠ 你踏入 ${loc.name},仙威如淵——【${mon.name}】(${mon.element}屬性)橫亙眼前!`
          : `你主動深入 ${loc.name} 尋妖,遭遇了 ${mon.name}(${mon.element}屬性)!`,
      );
      return { save: s };
    }

    case "cast": {
      if (!s.combat) return { save: s, error: "並無戰鬥" };
      if (SPELL_SEALED_MONSTERS.has(s.combat.monsterId)) {
        return { save: s, error: "黑眼貔貅雙目幽光暴閃,將你的法力波動盡數封鎖,此戰唯有以法器相搏!" };
      }
      const techId = String(payload.techId ?? "");
      if (!s.learned.includes(techId)) return { save: s, error: "未習得此仙法" };
      const tech = techById(techId);
      if (s.mp < tech.mpCost) {
        log(s, `法力不足,無法施展 ${tech.name}(需 ${tech.mpCost})。`);
        return { save: s };
      }
      const mon = monsterById(s.combat.monsterId);
      const { atk } = statsOf(s);
      const mult = elementMult(tech.element, mon.element);
      const level = techLevelOf(s, techId);
      const lvlMult = techPowerMult(level);
      const sectMult = Number(payload.sectDamageMult ?? 1);
      s.mp -= tech.mpCost;
      if (Math.random() < (MONSTER_DODGE_CHANCE[mon.id] ?? 0)) {
        log(s, `你施展【${tech.name}】,${mon.name} 身形一晃,竟憑空避過這一擊!`);
      } else {
        const dmg = Math.max(
          1,
          Math.floor(atk * tech.power * lvlMult * mult * sectMult * (0.9 + Math.random() * 0.2)),
        );
        log(
          s,
          `你施展【${tech.name}】(${level} 級),對 ${mon.name} 造成 ${formatDamage(dmg)}傷害` +
            (mult > 1 ? "(五行相剋,威力大增!)" : mult < 1 ? "(屬性被剋,威力受阻)" : "") +
            (sectMult > 1 ? `(宗門聲勢加持 ×${sectMult.toFixed(2)})` : "") +
            "。",
        );
        s.combat.monsterHp -= dmg;
      }
      if (s.combat.monsterHp <= 0) return { save: s, loot: winCombat(s) };
      const turn = monsterTurn(s);
      if (turn.defeat) return { save: s, loot: turn.defeat };
      return { save: s };
    }

    case "attack": {
      if (!s.combat) return { save: s, error: "並無戰鬥" };
      const mon = monsterById(s.combat.monsterId);
      const { atk, weaponEl } = statsOf(s);
      const mult = elementMult(weaponEl, mon.element);
      const sectMult = Number(payload.sectDamageMult ?? 1);
      if (Math.random() < (MONSTER_DODGE_CHANCE[mon.id] ?? 0)) {
        log(s, `你御使法器直取要害,${mon.name} 身形一晃,竟憑空避過這一擊!`);
      } else {
        const dmg = Math.max(1, Math.floor(atk * mult * sectMult * (0.85 + Math.random() * 0.3)));
        log(
          s,
          `你御使法器直取要害,對 ${mon.name} 造成 ${formatDamage(dmg)}傷害${sectMult > 1 ? `(宗門聲勢加持 ×${sectMult.toFixed(2)})` : ""}。`,
        );
        s.combat.monsterHp -= dmg;
      }
      if (s.combat.monsterHp <= 0) return { save: s, loot: winCombat(s) };
      const turn = monsterTurn(s);
      if (turn.defeat) return { save: s, loot: turn.defeat };
      return { save: s };
    }

    case "flee": {
      if (!s.combat) return { save: s, error: "並無戰鬥" };
      const mon = monsterById(s.combat.monsterId);
      if (Math.random() < 0.6) {
        s.combat = null;
        log(s, `你祭出遁光,成功從 ${mon.name} 爪下逃離。`);
      } else {
        log(s, "遁走失敗!");
        const turn = monsterTurn(s);
        if (turn.defeat) return { save: s, loot: turn.defeat };
      }
      return { save: s };
    }

    case "challengeFutu": {
      if (s.combat) return { save: s, error: "激戰之中,無法登塔。" };
      // 浮屠塔僅真仙可挑戰,且需先解鎖金源仙域
      if (REALMS[s.realmIdx].stage < 10) {
        return { save: s, error: "浮屠塔位於金源仙域深處,唯有飛昇真仙方能踏入。" };
      }
      if (!s.jinyuanUnlocked) {
        return { save: s, error: "你尚未尋得金源仙域,浮屠塔無從得見。" };
      }
      const base = monsterById("huanxiang_taisui");
      const floor = s.futuFloor + 1; // 挑戰下一層(從第 1 層起)
      const hpMult = Math.pow(1.5, floor - 1); // 每層氣血 ×1.5
      const atkMult = Math.pow(1.2, floor - 1); // 每層攻擊 ×1.2
      const bossHp = Math.floor(base.hp * hpMult);
      const bossAtk = Math.floor(base.atk * atkMult);
      s.combat = {
        monsterId: base.id,
        monsterHp: bossHp,
        locationId: "__futu__",
        isLord: true,
        futuFloor: floor,
        bossHpMax: bossHp,
        bossAtk,
      };
      if (!s.seen.includes(base.id)) s.seen.push(base.id);
      if (!s.lordsSeen.includes(base.id)) s.lordsSeen.push(base.id);
      log(
        s,
        `⚠ 你踏上浮屠塔第 ${floor} 層——幻象太歲天尊自虛空凝形!(氣血 ${bossHp}、攻擊 ${bossAtk})`,
      );
      return { save: s };
    }

    case "unlockManhuang": {
      if (s.manhuangUnlocked) {
        log(s, "蠻荒異界之門早已為你敞開,無需再度開啟。");
        return { save: s };
      }
      const disks = ["xingpan_jin", "xingpan_mu", "xingpan_shui", "xingpan_huo", "xingpan_tu"];
      if (!disks.every((id) => (s.inventory[id] ?? 0) >= 1)) {
        log(s, "五色異星盤尚未集滿(金木水火土),無法開啟蠻荒異界之門。");
        return { save: s };
      }
      disks.forEach((id) => take(s, id));
      s.manhuangUnlocked = true;
      log(s, "金木水火土五色異星盤同時懸空、轟然共鳴——蠻荒異界之門訇然洞開!");
      return {
        save: s,
        breakResult: {
          success: true,
          title: "蠻 荒 異 界 · 門 開",
          lines: [
            "五色異星盤共鳴,虛空裂開一道巨門——",
            "蠻荒異界自此對你敞開,天狐、真龍、霸下、貔貅四大領地静候踏足。",
          ],
        },
      };
    }

    case "ascendTaiyi": {
      if (s.combat) return { save: s, error: "激戰之中,無法突破。" };
      const taiyiIdx = REALMS.findIndex((r) => r.id === "taiyi_realm");
      if (s.realmIdx >= taiyiIdx) {
        log(s, "你已臻太乙之境,太乙殿於你已無用處。");
        return { save: s };
      }
      if (REALMS[s.realmIdx].id !== "jinxian_realm") {
        log(s, "太乙殿只渡金仙——唯有先臻金仙之境,方能於此突破太乙。");
        return { save: s };
      }
      if (s.futuFloor < 20) {
        log(s, "太乙殿深鎖,唯浮屠塔登臨第 20 層者方能窺見其門。");
        return { save: s };
      }
      const souls = [
        "taiyi_jinghun_tianhu",
        "taiyi_jinghun_zhenlong",
        "taiyi_jinghun_baxia",
        "taiyi_jinghun_pixiu",
      ];
      if (!souls.every((id) => (s.inventory[id] ?? 0) >= 1)) {
        log(s, "四枚太乙精魂(天狐/真龍/霸下/黑眼貔貅)尚未集滿,無法於太乙殿突破。");
        return { save: s };
      }
      souls.forEach((id) => take(s, id));
      s.realmIdx = taiyiIdx;
      const { hpMax: nhp3, mpMax: nmp3 } = statsOf(s);
      s.hp = nhp3;
      s.mp = nmp3;
      give(s, "m_taiyi_hunyuan_lu", 1);
      log(s, "四枚太乙精魂同祭太乙殿,金光暴漲、天地共鳴——你自金仙一步踏入【太乙境】!");
      log(s, "太乙殿感應道行圓滿,饋贈《太乙葫蘆天地訣》仙簡一份。");
      return {
        save: s,
        breakResult: {
          success: true,
          title: "太 乙 殿 · 飛 升 太 乙",
          lines: [
            "天狐、真龍、霸下、黑眼貔貅四道精魂同時祭入太乙殿——",
            "你正式晉入【太乙境】,道行更勝金仙,亦為宗門帶來莫大聲勢!",
          ],
        },
      };
    }

    case "useItem": {
      const itemId = String(payload.itemId ?? "");
      const item = itemById(itemId);
      if (!item || (s.inventory[itemId] ?? 0) <= 0) return { save: s, error: "並無此物" };
      const { hpMax, mpMax, realm } = statsOf(s);

      if (item.kind === "manual" && item.teaches) {
        if (s.learned.includes(item.teaches)) {
          log(s, "你已參透此篇仙法,無需再讀。");
          return { save: s };
        }
        const tech = techById(item.teaches);
        if (realm.stage < tech.reqStage) {
          log(s, `【${tech.name}】玄奧非常,以你現在的境界難以參悟(需更高境界)。`);
          return { save: s };
        }
        if (s.learning) {
          log(
            s,
            `你正在修習【${techById(s.learning.techId).name}】(尚需 ${s.learning.remain} 年),心無二用,無法同時參悟他法。`,
          );
          return { save: s };
        }
        take(s, itemId);
        const years = learnYears(item.teaches);
        s.learning = { techId: item.teaches, remain: years };
        log(
          s,
          `你焚香沐浴,開始參悟【${item.name}】。此法玄奧,需潛修 ${years} 年方可大成(調息推進)。`,
        );
        return { save: s };
      }

      // 裝備:法器 / 法衣 / 護身符 / 符籙 / 靈寵 / 命器
      if (["artifact", "robe", "treasure", "amulet", "talisman", "pet", "mingqi"].includes(item.kind)) {
        if ((item.reqStage ?? 1) > realm.stage) {
          log(s, `【${item.name}】非你此境界所能駕馭(需更高境界)。`);
          return { save: s };
        }
        equipToSlot(s, item);
        log(s, `你將【${item.name}】${slotVerb(item.kind)}。`);
        return { save: s };
      }

      // 煉器圖譜:使用後解鎖對應配方
      if (item.kind === "recipe" && item.unlocksRecipe) {
        if (s.unlockedRecipes.includes(item.unlocksRecipe)) {
          log(s, `你早已參透【${item.name}】所載之法,無需再研。`);
          return { save: s };
        }
        take(s, itemId);
        s.unlockedRecipes.push(item.unlocksRecipe);
        const rec = RECIPES.find((r) => r.id === item.unlocksRecipe);
        log(s, `你參詳【${item.name}】,煉器堂新增可煉之物:【${rec?.name ?? "?"}】!`);
        return {
          save: s,
          loot: {
            title: "圖 譜 參 悟",
            success: true,
            lines: [`參透【${item.name}】`, `煉器新配方解鎖:${rec?.name ?? "?"}`],
          },
        };
      }

      // 金魂丹:真仙突破金仙
      if (item.kind === "special" && itemId === "jinhundan") {
        const jinxianIdx = REALMS.findIndex((r) => r.id === "jinxian_realm");
        if (REALMS[s.realmIdx].stage < 10) {
          log(s, "【金魂丹】乃金仙之物,唯有飛昇真仙服之方能蛻變,此刻你無福消受。");
          return { save: s };
        }
        if (s.realmIdx >= jinxianIdx) {
          log(s, "你已臻金仙之境,金魂丹於你已無用處。");
          return { save: s };
        }
        take(s, itemId);
        s.realmIdx = jinxianIdx;
        const { hpMax: nhp, mpMax: nmp } = statsOf(s);
        s.hp = nhp;
        s.mp = nmp;
        log(
          s,
          "你吞下【金魂丹】,金光自魂魄深處炸開——魂軀蛻變,道果金鑄,你自真仙一步踏入【金仙】之境!",
        );
        return {
          save: s,
          breakResult: {
            success: true,
            title: "晉 入 金 仙",
            lines: [
              "金魂丹入腹,魂魄盡數金鑄,超脫真仙桎梏——",
              "你正式晉入【金仙】之境,萬法加身,睥睨仙庭!",
            ],
          },
        };
      }

      // 先天造化丹:築基期服下直升煉虛期,連跨結丹/元嬰/化神三大境界
      if (item.kind === "special" && itemId === "xiantian_zaohuadan") {
        if (REALMS[s.realmIdx].stage !== 2) {
          log(
            s,
            "【先天造化丹】藥性霸道無匹,唯築基期修士可服——此刻服下,恐經脈俱裂、當場殞命,萬萬不可輕試。",
          );
          return { save: s };
        }
        take(s, itemId);
        const targetIdx = REALMS.findIndex((r) => r.stage === 6);
        s.realmIdx = targetIdx;
        s.exp = 0;
        const next = REALMS[targetIdx];
        const gift = Math.floor(next.lifespan * 0.1);
        s.lifeBonus += gift;
        const { hpMax: nhp2, mpMax: nmp2 } = statsOf(s);
        s.hp = nhp2;
        s.mp = nmp2;
        log(
          s,
          "你服下【先天造化丹】,丹入腹中霸道藥力橫衝直撞,經脈血肉一夕重塑——你自築基一步踏入煉虛之境!",
        );
        return {
          save: s,
          breakResult: {
            success: true,
            title: "先 天 造 化 · 連 越 三 境",
            lines: [
              "先天造化丹入腹,天地奇效霸道無雙——",
              "你自【築基期】一舉躍入【煉虛期】,連跨結丹、元嬰、化神三大境界!",
              `壽元上限躍升至 ${next.lifespan} 年,額外增壽 ${gift} 年。`,
            ],
          },
        };
      }

      // 倍力丹(黑市限定):立即回滿精力,並疊加永久 +10% 精力上限(帳號最多疊 5 顆)
      if (item.kind === "special" && itemId === "beilidan") {
        if (s.energyPotionStacks >= MAX_ENERGY_POTION_STACKS) {
          log(s, "你體內經脈已被倍力丹之效撐至極限,再服無益——【倍力丹】暫且收好。");
          return { save: s };
        }
        take(s, itemId);
        s.energyPotionStacks += 1;
        s.energy = energyMaxOf(s);
        log(
          s,
          `你服下【倍力丹】,精力充盈、經脈為之一闊——精力上限永久 +10%(現已疊加 ${s.energyPotionStacks}/${MAX_ENERGY_POTION_STACKS} 顆),精力全滿!`,
        );
        return { save: s };
      }

      // 真仙之物:凝練仙靈力(需已飛昇)
      if (item.kind === "special" && item.xianli) {
        if (REALMS[s.realmIdx].stage < 10) {
          log(s, `【${item.name}】乃仙界之物,唯有飛昇真仙方能煉化,此刻你尚無從下手。`);
          return { save: s };
        }
        take(s, itemId);
        s.xianli = (s.xianli ?? 0) + item.xianli;
        log(
          s,
          `你盤坐九霄,煉化【${item.name}】——仙靈力 +${item.xianli}(現 ${s.xianli} 點),攻伐之力再攀新境!`,
        );
        return {
          save: s,
          loot: {
            title: "仙 靈 力 增 長",
            success: true,
            lines: [`煉化【${item.name}】`, `仙靈力 +${item.xianli}`, `現有仙靈力:${s.xianli} 點`],
          },
        };
      }

      // 增靈珠須於「仙法」欄位使用
      if (item.kind === "special") {
        log(s, `【${item.name}】須於「仙法」欄位選定一門仙法後使用。`);
        return { save: s };
      }

      take(s, itemId);
      const effects: string[] = [];
      if (item.heal) {
        s.hp = Math.min(hpMax, s.hp + item.heal);
        effects.push(`回復氣血 ${item.heal}`);
      }
      if (item.mp) {
        s.mp = Math.min(mpMax, s.mp + item.mp);
        effects.push(`回復法力 ${item.mp}`);
      }
      if (item.exp) {
        s.exp += item.exp;
        effects.push(`修為 +${item.exp}`);
      }
      if (item.life) {
        s.lifeBonus += item.life;
        effects.push(`壽元上限 +${item.life} 年`);
      }
      if (item.lifePct) {
        const gain = Math.floor(maxLifeOf(s) * item.lifePct);
        s.lifeBonus += gain;
        effects.push(`壽元上限 +${gain} 年(${Math.round(item.lifePct * 100)}%)`);
      }
      log(s, `你服下 ${item.name},${effects.join(",")}。`);
      return { save: s };
    }

    case "buy": {
      const item = itemById(String(payload.itemId ?? ""));
      if (!item) return { save: s, error: "無此商品" };
      if (
        item.life ||
        item.lifePct ||
        (item.kind === "manual" && !item.shopSellable) ||
        item.kind === "special" ||
        item.kind === "recipe" ||
        item.kind === "pet" ||
        item.dropOnly ||
        (item.reqStage ?? 1) > 8
      ) {
        return { save: s, error: "此物坊市不售,唯有斬妖奪寶方能得之" };
      }
      if (s.stones < item.price) {
        log(s, `靈石不足,${item.name} 需 ${item.price} 靈石。`);
        return { save: s };
      }
      s.stones -= item.price;
      give(s, item.id);
      log(s, `坊市購入 ${item.name},花費 ${item.price} 靈石。`);
      return { save: s };
    }

    case "sell": {
      const item = itemById(String(payload.itemId ?? ""));
      if (!item || !take(s, item.id)) return { save: s, error: "並無此物" };
      const gain = Math.max(1, Math.floor(item.price * 0.6));
      s.stones += gain;
      const gone = !(s.inventory[item.id] > 0);
      if (gone) {
        if (s.equippedWeapon === item.id) s.equippedWeapon = null;
        if (s.equippedArmor === item.id) s.equippedArmor = null;
        if (s.equippedRobe === item.id) s.equippedRobe = null;
        if (s.equippedAmulet === item.id) s.equippedAmulet = null;
        if (s.equippedTalisman === item.id) s.equippedTalisman = null;
        if (s.equippedPet === item.id) s.equippedPet = null;
        if (s.equippedMing === item.id) s.equippedMing = null;
      }
      log(s, `售出 ${item.name},得 ${gain} 靈石。`);
      return { save: s };
    }

    case "craft": {
      const rec = RECIPES.find((x) => x.id === payload.recipeId);
      if (!rec) return { save: s, error: "無此配方" };
      // 高階配方(圖譜解鎖):需先由妖獸掉落圖譜研讀
      if (rec.dropOnly && !s.unlockedRecipes.includes(rec.id)) {
        return { save: s, error: "此配方尚未參透,需先取得對應圖譜研讀" };
      }
      const { realm } = statsOf(s);
      if ((rec.reqStage ?? 1) > realm.stage) {
        return { save: s, error: "境界不足,無法駕馭此配方" };
      }
      if (s.stones < rec.stones) {
        log(s, `煉製 ${rec.name} 需 ${rec.stones} 靈石作爐火之資,靈石不足。`);
        return { save: s };
      }
      for (const m of rec.materials) {
        if ((s.inventory[m.id] ?? 0) < m.n) {
          log(s, `材料不足:煉製 ${rec.name} 需 ${itemById(m.id).name} ×${m.n}。`);
          return { save: s };
        }
      }
      for (const m of rec.materials) take(s, m.id, m.n);
      s.stones -= rec.stones;
      s.energy -= energyCost;
      // 煉器屬性浮動 ±30%:每次出爐品質隨機,攻/防/速皆等比例縮放
      const quality = rand(70, 130);
      const rolledId = `${rec.result}@${quality}`;
      give(s, rolledId);
      const rolled = itemById(rolledId);
      log(s, `爐火純青,三日三夜——你成功煉製出【${rolled.name}】!`);
      return {
        save: s,
        loot: {
          title: "煉 器 大 成",
          success: true,
          lines: [`【${rolled.name}】出爐!`, rolled.desc],
        },
      };
    }

    case "craftXuantian": {
      const { realm } = statsOf(s);
      if (realm.stage < 12) {
        return { save: s, error: "玄天仙器唯太乙境修士方能煉化,此刻你尚無資格。" };
      }
      const FRAGMENT_COST = 10;
      const FRAGMENT_COST2 = 20;
      if ((s.inventory["xuantian_canpian"] ?? 0) < FRAGMENT_COST) {
        log(s, `煉化玄天仙器需玄天殘片 ${FRAGMENT_COST} 枚,你尚未集齊。`);
        return { save: s };
      }
      if ((s.inventory["poshou_jinhow"] ?? 0) < FRAGMENT_COST2) {
        log(s, `煉化玄天仙器需破曉精華 ${FRAGMENT_COST2} 枚,你尚未集齊。`);
        return { save: s };
      }
      const soulIds = [
        "taiyi_jinghun_tianhu",
        "taiyi_jinghun_zhenlong",
        "taiyi_jinghun_baxia",
        "taiyi_jinghun_pixiu",
      ];
      const haveSoul = soulIds.find((id) => (s.inventory[id] ?? 0) >= 1);
      if (!haveSoul) {
        log(s, "煉化玄天仙器需太乙精魂一枚(天狐/真龍/霸下/黑眼貔貅任一皆可),你尚未持有。");
        return { save: s };
      }
      take(s, "xuantian_canpian", FRAGMENT_COST);
      take(s, "poshou_jinhow", FRAGMENT_COST2);
      take(s, haveSoul);
      s.energy -= energyCost;
      const pool = Array.from(XUANTIAN_ARTIFACT_IDS);
      const picked = pool[rand(0, pool.length - 1)];
      const quality = rand(100, 300); // 玄天仙器屬性浮動 100%~300%
      const rolledId = `${picked}@${quality}`;
      give(s, rolledId);
      const rolled = itemById(rolledId);
      log(s, `玄天殘片與太乙精魂同淬爐火,天地紫氣暴湧——煉成【${rolled.name}】!`);
      return {
        save: s,
        loot: {
          title: "玄 天 仙 器 · 煉 成",
          success: true,
          lines: [`煉成【${rolled.name}】`, rolled.desc],
        },
      };
    }

    case "equip": {
      const item = itemById(String(payload.itemId ?? ""));
      if (!item || (s.inventory[item.id] ?? 0) <= 0) return { save: s, error: "並無此物" };
      const { realm } = statsOf(s);
      if ((item.reqStage ?? 1) > realm.stage) {
        return { save: s, error: "境界不足,無法駕馭此物" };
      }
      if (!equipToSlot(s, item)) return { save: s, error: "此物無法裝備" };
      log(s, `你將【${item.name}】${slotVerb(item.kind)}。`);
      return { save: s };
    }

    case "restoreMp": {
      // 聚靈回力:按住即逐步回力。每次呼叫回復一小段法力並碾碎少量靈石。
      const { realm, mpMax } = statsOf(s);
      const need = mpMax - s.mp;
      if (need <= 0) {
        return { save: s }; // 已滿,靜默(按住時不洗版見聞錄)
      }
      const fullCost = Math.max(10, Math.floor(realm.expNeed * 0.05));
      const mpPerTick = Math.max(1, Math.ceil(mpMax * 0.08));
      const restore = Math.min(mpPerTick, need);
      const cost = Math.max(1, Math.ceil((fullCost * restore) / mpMax));
      if (s.stones < cost) {
        log(s, `靈石不足,聚靈中斷(每息需 ${cost} 靈石,現有 ${s.stones})。`);
        return { save: s };
      }
      s.stones -= cost;
      s.mp += restore;
      // 恰好回滿時,補一句見聞
      if (s.mp >= mpMax) log(s, "靈氣如霧納入丹田——法力盡復。");
      return { save: s };
    }

    case "acceptMission": {
      if (s.missionId) {
        log(s, "你已領有宗門任務,須先完成或放棄。");
        return { save: s };
      }
      const m = MISSIONS.find((x) => x.id === payload.missionId);
      if (!m) return { save: s, error: "無此任務" };
      const { realm } = statsOf(s);
      if (realm.stage < m.reqStage) return { save: s, error: "境界不足" };
      s.missionId = m.id;
      s.missionBase = m.kind === "kill" ? (s.kills[m.targetId] ?? 0) : 0;
      log(s, `你在執事堂領取任務【${m.name}】:${m.desc}`);
      return { save: s };
    }

    case "completeMission": {
      if (!s.missionId) return { save: s, error: "並無任務" };
      const m = MISSIONS.find((x) => x.id === s.missionId)!;
      if (m.kind === "kill") {
        const done = (s.kills[m.targetId] ?? 0) - s.missionBase;
        if (done < m.n) {
          log(s, `任務未竟:已獵殺 ${done}/${m.n}。`);
          return { save: s };
        }
      } else {
        if ((s.inventory[m.targetId] ?? 0) < m.n) {
          log(s, `任務未竟:${itemById(m.targetId).name} ${s.inventory[m.targetId] ?? 0}/${m.n}。`);
          return { save: s };
        }
        take(s, m.targetId, m.n);
      }
      s.missionId = null;
      s.missionBase = 0;
      s.stones += m.stones;
      s.exp += m.exp;
      const lines = [`靈石 +${m.stones}`, `修為 +${m.exp}`];
      if (m.item) {
        give(s, m.item);
        lines.push(`另賜【${itemById(m.item).name}】`);
      }
      log(s, `任務【${m.name}】完成!執事堂發放:${lines.join("、")}。`);
      return {
        save: s,
        loot: { title: "任 務 完 成", success: true, lines: [`【${m.name}】覆命`, ...lines] },
      };
    }

    case "abandonMission": {
      if (!s.missionId) return { save: s, error: "並無任務" };
      const m = MISSIONS.find((x) => x.id === s.missionId)!;
      s.missionId = null;
      s.missionBase = 0;
      log(s, `你放棄了任務【${m.name}】,執事一臉不悅。`);
      return { save: s };
    }

    case "upgradeTech": {
      const techId = String(payload.techId ?? "");
      if (!s.learned.includes(techId)) return { save: s, error: "未習得此仙法" };
      if ((s.inventory["zenglingzhu"] ?? 0) <= 0) return { save: s, error: "並無增靈珠" };
      const level = techLevelOf(s, techId);
      if (level >= MAX_TECH_LEVEL) {
        log(s, `【${techById(techId).name}】已臻 ${MAX_TECH_LEVEL} 級大圓滿,無法再進。`);
        return { save: s };
      }
      take(s, "zenglingzhu");
      s.techLevels = { ...s.techLevels, [techId]: level + 1 };
      const tech = techById(techId);
      log(s, `你以增靈珠溫養【${tech.name}】,法術精進——${level} 級 → ${level + 1} 級,威力大增!`);
      return {
        save: s,
        loot: {
          title: "仙 法 精 進",
          success: true,
          lines: [
            `【${tech.name}】`,
            `${level} 級 → ${level + 1} 級`,
            `威力倍率 ×${techPowerMult(level + 1).toFixed(1)}`,
          ],
        },
      };
    }

    default:
      return { save: s, error: `未知操作:${type}` };
  }
}
