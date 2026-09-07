// 伺服器權威遊戲引擎:所有獎勵運算在此執行,前端僅顯示
import { COUNTERS, Element, Monster, ItemDef, Technique, formatDamage } from "./types";
import { REALMS } from "./data/realms";
import { SECTS } from "./data/sects";
import { techById } from "./data/techniques";
import { itemById, ITEMS, XUANTIAN_ARTIFACT_IDS } from "./data/items";
import { LOCATIONS, MONSTERS, RECIPES, REGIONS } from "./data/world";
import { MISSIONS } from "./data/missions";
import { dwellingLevelOf } from "./data/sectTiers";
import { currentEraYears } from "./data/eraTime";

// 狀態效果(2.21 版新增,仙法卡牌化的一部分;3.1 版新增 weaken):掛在既有五行系統上,火→燒傷、木→中毒、
// 水→冰封,不獨立發明新屬性池;weaken(虛弱)不對應五行,僅由戰術卡的「衰運針」附加。
// turns 為剩餘回合數,歸零即移除。
export interface StatusEffect {
  kind: "burn" | "poison" | "freeze" | "weaken";
  turns: number;
}

export interface CombatState {
  monsterId: string;
  monsterHp: number;
  locationId: string;
  isLord?: boolean; // 地域王 / 仙帝 / 超級 BOSS 遭遇(額外標示)
  futuFloor?: number; // 浮屠塔:正在挑戰的層數(幻象太歲天尊)
  bossHpMax?: number; // 動態 BOSS 的氣血上限(浮屠塔用)
  bossAtk?: number; // 動態 BOSS 的攻擊(浮屠塔用)
  tianjieTrial?: boolean; // 渡劫→真仙:服下真仙丹後降臨的天劫神靈試煉,勝負直接決定本次突破機率翻倍/減半
  // 本回合可施展的仙法卡牌 id(不含法器攻擊,法器攻擊恆常可用)。3.4 版起改為符寶袋抽棄牌制:
  // 開戰由 startingCombatHand() 從符寶袋洗牌抽 HAND_SIZE 張,打出的牌進 discard,回合結束整批
  // 棄置重抽(見 redrawHand())。
  hand?: string[];
  deck?: string[]; // 符寶袋(3.4 版新增):本場戰鬥洗混後尚未抽出的牌堆
  discard?: string[]; // 已打出/回合結束棄置的符寶,牌堆抽空時洗回牌堆繼續抽
  // 符寶連攜的延續加成(3.5 版新增):上一次出牌若打出過帶 nextPlayBuffPct 的符寶,記錄其元素與
  // 加成比例,供下一次出牌時比對(只有下一批次含同元素符寶才會觸發),觸發或跳過一次即清除。
  pendingElementBuff?: { element: Element; pct: number };
  monsterStatus?: StatusEffect[]; // 怪物身上的狀態效果
  playerStatus?: StatusEffect[]; // 玩家身上的狀態效果
  playerShield?: number; // 戰術卡「護體法箓」賦予的護盾額度(3.1 版新增),優先抵擋接下來受到的直接傷害,用完即消
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
  pouch?: string[]; // 符寶袋(3.4 版新增):玩家自選的符寶清單,可重複(同名仙法可放入多張);
  // 未設定(新角色/舊存檔)時由 effectivePouch() 退回預設組合,不需要遷移欄位
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
  bornEra: number; // 這一世修仙之旅開始時的恆紀年(總年數),newSave() 當下的 currentEraYears()
  oracleOffered: boolean; // 雲遊四海機緣觸發的「天算術」黑市機會是否待處理(購買或婉拒前持續為 true)
  pouchStones: number; // 存於乾坤袋中的靈石(1.24 版新增,黑眼貔貅掉落);與 stones 分開計算,戰敗遺失/被盜皆不受影響
  energyDoubled?: boolean; // 是否已使用【煉神術】(九龍獄馬良極稀有掉落,終身限用一次,令精力上限永久翻倍)
}

export interface Modal {
  title: string;
  lines: string[];
  success?: boolean;
}

// 戰鬥浮動傷害數字(3.5 版新增):每次 applyAction 呼叫過程中(含巢狀呼叫,如 postPlayerTurn 觸發
// 的 monsterTurn)累積發生的傷害事件,結尾一併回傳給前端,驅動畫面上跳出的浮動數字。
export interface DamageEvent {
  target: "monster" | "player";
  amount: number;
}
let pendingDamageEvents: DamageEvent[] = [];
function pushDamageEvent(target: DamageEvent["target"], amount: number) {
  if (amount > 0) pendingDamageEvents.push({ target, amount });
}

export interface ActionResult {
  save: SaveData;
  loot?: Modal; // 採集/戰利品彈窗
  breakResult?: Modal; // 突破結果彈窗
  error?: string;
  damageEvents?: DamageEvent[]; // 本次行動(含連鎖觸發的怪物出手/持續傷害)產生的浮動傷害數字
}

const MAX_LOG = 60;

// 打坐修煉每次消耗的壽元:5 年,隨大境界翻倍(練氣5 築基10 結丹20 元嬰40……)
const cultCostForStage = (stage: number) => 5 * Math.pow(2, stage - 1);

export const cultCostOf = (s: Pick<SaveData, "realmIdx">) =>
  cultCostForStage(REALMS[s.realmIdx].stage);

// 每部秘笈的學習年數:仙法可自訂 learnYears(真仙/金仙/太乙頂尖仙法極為稀有,手動設定天文數字);
// 其餘依境界估算「約需打坐 reqStage×3 次」所需年數(打坐消耗壽元隨境界指數翻倍,若沿用舊版
// 「境界需求×10 年」的線性公式,元嬰期起單次打坐消耗的壽元便已超過學習所需,秘笈形同一坐即成,
// 與頂尖仙法動輒數十萬年的修習時間帶寬相差懸殊,2.20 版起改為隨境界指數成長以拉近落差)
export const learnYears = (techId: string) => {
  const t = techById(techId);
  return t.learnYears ?? cultCostForStage(t.reqStage) * t.reqStage * 3;
};

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
const ENERGY_BASE = 300;
const ENERGY_PER_STAGE = 50;
export const energyMaxOf = (
  s: Pick<SaveData, "realmIdx" | "energyPotionStacks" | "energyDoubled">,
) => {
  const base = ENERGY_BASE + ENERGY_PER_STAGE * (REALMS[s.realmIdx].stage - 1);
  const withPotions = Math.floor(base * (1 + 0.1 * (s.energyPotionStacks ?? 0)));
  return s.energyDoubled ? withPotions * 2 : withPotions;
};

// 各項行動消耗的精力(戰鬥中每回合的攻擊/施法/遁走不額外收費,已含在啟動獵殺的那次消耗裡)
export const ENERGY_COST: Record<string, number> = {
  cultivate: 5,
  rest: 5,
  wander: 15,
  gather: 4,
  hunt: 5,
  breakthrough: 20,
  craft: 10,
  craftXuantian: 10,
};
export const MAX_ENERGY_POTION_STACKS = 5;

// 精力回復速率(2.5 版起加倍):平時每 5 分鐘真實時間回復 2 點。
// 停泊宗門仙境閉關潛修時,額外再加成:基礎 +2,宗門每提升一階再 +1(依宗門目前等級),
// 加成與平時速率相加,而非另外乘倍——由 /api/action、/api/save 依各自查到的宗門等級呼叫。
export const ENERGY_REGEN_PER_TICK = 2;
export const DWELLING_ENERGY_BONUS_BASE = 2;
export const DWELLING_ENERGY_BONUS_PER_TIER = 1;
export const dwellingEnergyBonusOf = (tier: number) =>
  DWELLING_ENERGY_BONUS_BASE + DWELLING_ENERGY_BONUS_PER_TIER * Math.max(0, tier - 1);

// 精力回復:由 /api/action、/api/save 依 last_energy_at 差距換算成點數呼叫。
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

// ═══ 符寶袋(2.21 版仙法卡牌化 → 3.1 持有制手牌 → 3.4 版全面改為符寶袋抽棄牌,見
// pvp-territory-design.md 第九節 9.3/9.4)═══
// 玩家從已學仙法中自選(可重複,同一門仙法可放入多張)組成至少 POUCH_MIN 張的符寶袋;開戰洗混
// 成牌堆,抽 HAND_SIZE 張成為手牌,法力允許可連續出牌,打出的牌進棄牌堆,回合結束手中剩牌一併
// 棄置、重新抽 HAND_SIZE 張,牌堆抽空則洗回棄牌堆繼續抽——真正的「抽牌/棄牌/洗牌」牌庫,取代
// 3.0/3.1 版「從已學仙法隨機/持有」的手牌邏輯。法器攻擊仍不佔手牌、恆常可用。
export const HAND_SIZE = 6;
export const POUCH_MIN = 10;
export const POUCH_MAX_COPIES = 5; // 單一仙法最多可放入符寶袋的張數,避免十張同名符寶的退化陣容

function shuffled<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = rand(0, i);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// 符寶袋尚未由玩家設定(新角色/舊存檔)時的預設內容:把已學仙法輪流填滿至 POUCH_MIN 張,
// 確保任何情況下都能湊出可用的符寶袋。已學仙法一門都沒有時回傳空陣列(理論上不會發生,
// 各門派角色創建時必有一門起手仙法)。
export function defaultPouch(learned: string[]): string[] {
  if (learned.length === 0) return [];
  const out: string[] = [];
  for (let i = 0; i < POUCH_MIN; i++) out.push(learned[i % learned.length]);
  return out;
}

// 目前有效的符寶袋:玩家已設定過就用玩家的選擇(濾掉理論上不該發生、但防禦性排除已不在
// 已學仙法中的殘留項目),否則退回預設符寶袋。
export function effectivePouch(s: Pick<SaveData, "learned" | "pouch">): string[] {
  const raw = (s.pouch ?? []).filter((id) => s.learned.includes(id));
  return raw.length > 0 ? raw : defaultPouch(s.learned);
}

// 符寶袋最低張數需求:正常是 POUCH_MIN,但已學仙法太少(乘上單卡上限仍湊不滿)時降低門檻,
// 避免極早期角色(通常只學會起手那一門仙法)被卡住無法組出合法符寶袋。
export function pouchMinFor(learnedCount: number): number {
  return Math.min(POUCH_MIN, learnedCount * POUCH_MAX_COPIES);
}

// 開戰抽牌:洗混符寶袋成牌堆,抽 HAND_SIZE 張成為手牌,其餘留在牌堆,棄牌堆清空。順帶把法力回滿
// (開戰法力回滿,見設計文件 9.8)——放在這裡一併處理,8 個建立 CombatState 的地方都用
// `...startingCombatHand(s)` 展開,不用每處各自補一行 s.mp = mpMax。
function startingCombatHand(s: SaveData): { hand: string[]; deck: string[]; discard: string[] } {
  const { mpMax } = statsOf(s);
  s.mp = mpMax;
  const deck = shuffled(effectivePouch(s));
  const hand = deck.splice(0, HAND_SIZE);
  return { hand, deck, discard: [] };
}

// 從牌堆抽 n 張;牌堆不夠時先把棄牌堆洗回牌堆再繼續抽(兩者都空,代表符寶袋本身不足欲抽張數,
// 能抽多少算多少,不會出錯)。
function drawCards(
  deckIn: string[],
  discardIn: string[],
  n: number,
): { drawn: string[]; deck: string[]; discard: string[] } {
  let deck = [...deckIn];
  let discard = [...discardIn];
  const drawn: string[] = [];
  for (let i = 0; i < n; i++) {
    if (deck.length === 0) {
      if (discard.length === 0) break;
      deck = shuffled(discard);
      discard = [];
    }
    drawn.push(deck.shift()!);
  }
  return { drawn, deck, discard };
}

// 回合結束:手中剩牌一併棄置,重新抽 HAND_SIZE 張補滿手牌。
function redrawHand(combat: Pick<CombatState, "hand" | "deck" | "discard">) {
  const discardAll = [...(combat.discard ?? []), ...(combat.hand ?? [])];
  return drawCards(combat.deck ?? [], discardAll, HAND_SIZE);
}

// 移除手牌中「一張」指定仙法(手牌可能有同名重複符寶,只移掉打出的那一張,其餘留著)。
function removeOneFromHand(hand: string[], id: string): string[] {
  const idx = hand.indexOf(id);
  if (idx === -1) return hand;
  return [...hand.slice(0, idx), ...hand.slice(idx + 1)];
}

// 狀態效果掛在既有五行系統上,不獨立發明新屬性池:火→燒傷(持續傷害)、木→中毒(持續傷害+攻擊力打折)、
// 水→冰封(跳過一回合)。金/土先不掛狀態,留待驗證過這三種好不好玩後再擴充(見設計文件的收斂建議)。
const STATUS_BY_ELEMENT: Partial<Record<Element, StatusEffect["kind"]>> = {
  火: "burn",
  木: "poison",
  水: "freeze",
};
const STATUS_LABEL: Record<StatusEffect["kind"], string> = {
  burn: "燒傷",
  poison: "中毒",
  freeze: "冰封",
  weaken: "虛弱",
};
const STATUS_PROC_CHANCE = 0.3; // 對應屬性的招式命中時,額外機率附加狀態
const STATUS_DURATION = 3; // 燒傷/中毒持續回合數
const FREEZE_DURATION = 2; // 冰封持續回合數(較短,避免控制鏈過強)
const BURN_TICK_PCT = 0.04; // 燒傷:每回合造成目標氣血上限 4% 的持續傷害
const POISON_TICK_PCT = 0.025; // 中毒:每回合造成目標氣血上限 2.5% 的持續傷害
const POISON_WEAKEN_MULT = 0.8; // 中毒:攻擊輸出打八折(法器攻擊與仙法皆適用)
// 虛弱(3.1 版新增,僅由戰術卡「衰運針」附加,不與五行掛鉤):攻擊輸出打七折,持續 2 回合
const WEAKEN_MULT = 0.7;
const WEAKEN_DURATION = 2;

function hasStatus(list: StatusEffect[] | undefined, kind: StatusEffect["kind"]): boolean {
  return !!list?.some((e) => e.kind === kind && e.turns > 0);
}

// 疊加/刷新狀態效果:同名狀態取剩餘回合數較大者,不疊加傷害倍率——避免同屬性連續命中無限堆疊爆炸
function applyStatus(
  list: StatusEffect[] | undefined,
  kind: StatusEffect["kind"],
  turns: number,
): StatusEffect[] {
  const arr = list ? [...list] : [];
  const existing = arr.find((e) => e.kind === kind);
  if (existing) existing.turns = Math.max(existing.turns, turns);
  else arr.push({ kind, turns });
  return arr;
}

// 扣減指定狀態一回合(用於冰封在跳過回合當下的消耗),歸零即移除
function decrementStatus(list: StatusEffect[] | undefined, kind: StatusEffect["kind"]): StatusEffect[] {
  return (list ?? [])
    .map((e) => (e.kind === kind ? { ...e, turns: e.turns - 1 } : e))
    .filter((e) => e.turns > 0);
}

// 中毒/虛弱狀態下攻擊輸出打折(不論法器攻擊或仙法皆適用,雙方通用);兩者同時存在時效果相乘
function atkMultFromStatus(list: StatusEffect[] | undefined): number {
  let mult = 1;
  if (hasStatus(list, "poison")) mult *= POISON_WEAKEN_MULT;
  if (hasStatus(list, "weaken")) mult *= WEAKEN_MULT;
  return mult;
}

// 結算燒傷/中毒的持續傷害(冰封不在此處理,由跳過回合的邏輯各自扣減),回傳傷害總和與新的狀態清單;
// 虛弱沒有持續傷害,但仍與燒傷/中毒一併在此扣減剩餘回合數,歸零即移除
function tickDot(
  list: StatusEffect[] | undefined,
  maxHp: number,
): { list: StatusEffect[]; dmg: number; labels: string[] } {
  const arr = list ? [...list] : [];
  let dmg = 0;
  const labels: string[] = [];
  for (const e of arr) {
    if (e.kind === "burn") {
      const d = Math.max(1, Math.floor(maxHp * BURN_TICK_PCT));
      dmg += d;
      labels.push(`燒傷 -${d}`);
    } else if (e.kind === "poison") {
      const d = Math.max(1, Math.floor(maxHp * POISON_TICK_PCT));
      dmg += d;
      labels.push(`中毒 -${d}`);
    }
  }
  const next = arr.map((e) => (e.kind === "freeze" ? e : { ...e, turns: e.turns - 1 })).filter((e) => e.turns > 0);
  return { list: next, dmg, labels };
}

// 護體護盾(3.1 版新增,戰術卡「護體法箓」賦予):優先抵擋玩家接下來受到的直接傷害,額度用完即消;
// 僅抵擋怪物的直接攻擊,不抵擋燒傷/中毒的持續傷害(與多數卡牌遊戲的「護盾只擋直接傷害」慣例一致)
function absorbShield(s: SaveData, dmg: number): { dmg: number; absorbed: number } {
  const shield = s.combat?.playerShield ?? 0;
  if (shield <= 0 || dmg <= 0 || !s.combat) return { dmg, absorbed: 0 };
  const absorbed = Math.min(shield, dmg);
  s.combat.playerShield = shield - absorbed;
  return { dmg: dmg - absorbed, absorbed };
}

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
    // 法器攻擊/法術攻擊是與生俱來的基礎卡片,不需要修習,所有角色一律持有(見 techniques.ts innate 標記)
    learned: ["artifact_attack", "spell_attack", sect.startTech, sect.startTech2],
    // 起手符寶袋(3.8 版新增,固定 10 張):3 法器攻擊 + 3 法術攻擊 + 3 入門仙法 + 1 第二張起手仙法
    pouch: [
      "artifact_attack",
      "artifact_attack",
      "artifact_attack",
      "spell_attack",
      "spell_attack",
      "spell_attack",
      sect.startTech,
      sect.startTech,
      sect.startTech,
      sect.startTech2,
    ],
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
    bornEra: currentEraYears(),
    oracleOffered: false,
    pouchStones: 0,
  };
  const { hpMax, mpMax } = statsOf(s);
  s.hp = hpMax;
  s.mp = mpMax;
  s.energy = energyMaxOf(s);
  log(
    s,
    `${s.name} 拜入 ${sect.name},自此踏上修仙之路。`,
    `長老傳授入門仙法:${techById(sect.startTech).name}、${techById(sect.startTech2).name}。`,
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

// 天算術(黑市限定):付款後隨機賜下一件真仙等級道具,福禍難料——權重手動配置,權重越高越常見(越「弱」),
// 越低越稀有(越「強」),不採價格反推(許多真仙級道具本就 price:0,無法反映實際強弱)。
const ORACLE_POOL: { id: string; weight: number }[] = [
  { id: "tianxiandan", weight: 20 }, // 仙靈力 +1
  { id: "xiantian_zhong", weight: 16 }, // 仙靈力 +2
  { id: "fu_taixu", weight: 14 }, // 太虛混元符
  { id: "jinyuan_hujing", weight: 12 }, // 金源護道鏡
  { id: "zhuxian_fu", weight: 12 }, // 誅仙滅魂符
  { id: "jinyuan_ji", weight: 10 }, // 金源戮神戟
  { id: "jy_taiyi", weight: 10 }, // 太乙金光劍
  { id: "jy_hunyuan", weight: 10 }, // 混元仙袍
  { id: "taixu_hunyuanjia", weight: 10 }, // 太虛混元甲
  { id: "zaohua_jian", weight: 8 }, // 造化戮仙劍
  { id: "xiantian_qi", weight: 8 }, // 仙靈力 +3
  { id: "pet_tianhu", weight: 6 }, // 九尾天狐(真仙級靈寵)
  { id: "thantian_lu", weight: 4 }, // 仙靈力 +15
  { id: "pet_hundun", weight: 3 }, // 混沌幼獸(金仙級靈寵)
  { id: "xuantian_zhanling_jian", weight: 2 }, // 玄天仙器(唯太乙境可用,屬性極強)
  { id: "xuantian_hulu", weight: 2 },
  { id: "potian_chui", weight: 2 },
  { id: "tianhu_huaxie_ren", weight: 2 },
  { id: "xuantian_zhanmo_jian", weight: 2 },
  { id: "huantian_jing", weight: 2 },
];
export function rollOracleItem(): string {
  const total = ORACLE_POOL.reduce((a, e) => a + e.weight, 0);
  let roll = Math.random() * total;
  for (const e of ORACLE_POOL) {
    roll -= e.weight;
    if (roll <= 0) return e.id;
  }
  return ORACLE_POOL[0].id;
}

// 渡劫→真仙的最終判定(天劫神靈試煉勝負後代入翻倍/減半後的機率呼叫;與 REALMS 中 dujie→feisheng 唯一銜接的一次跳境,
// 固定走「白日飛昇」文案,不像一般突破需依 next.stage 分支)
function resolveAscensionRoll(s: SaveData, chance: number): Modal {
  const realm = REALMS[s.realmIdx]; // 此時仍是渡劫期,尚未晉升
  // 消耗型命器:機率已計入本次 chance,只要確實擲骰嘗試,無論成敗都會化為飛灰
  if (s.equippedMing) {
    const mingItem = itemById(s.equippedMing);
    if (mingItem?.consumable) {
      take(s, s.equippedMing);
      s.equippedMing = null;
    }
  }
  if (Math.random() < chance) {
    s.realmIdx += 1;
    s.exp -= realm.expNeed;
    const { hpMax, mpMax } = statsOf(s);
    s.hp = hpMax;
    s.mp = mpMax;
    const lines = [
      "九霄之上雷雲翻湧,萬丈金光自天門傾瀉——你踏碎虛空,白日飛昇!",
      "自山村凡童至真仙之軀,這一步,你走了一生。",
    ];
    log(s, ...lines);
    return { success: true, title: "白 日 飛 昇", lines };
  }
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
  return { success: false, title: "突 破 失 敗", lines };
}

// 玩家氣血歸零時的統一處理——不論死因是怪物攻擊還是狀態效果的持續傷害(2.21 版起,DOT 也可能致死,
// 抽成共用函式以免兩處各寫一份)。天劫神靈試煉例外:不扣靈石,直接以減半後機率完成渡劫判定。
function handlePlayerDefeat(s: SaveData, causeLine: string): Modal {
  const { hpMax, mpMax } = statsOf(s);
  const surviveHp = Math.max(1, Math.floor(hpMax * 0.3));
  if (s.combat?.tianjieTrial) {
    s.hp = surviveHp;
    s.mp = mpMax;
    s.combat = null;
    log(s, causeLine, "你不敵天劫神靈之威,身受重創、倉皇脫身——道基因此動搖,飛昇之機大減!");
    const chance = Math.max(0, breakChanceOf(s) * 0.5);
    return resolveAscensionRoll(s, chance);
  }
  const mon = monsterById(s.combat!.monsterId);
  const lost = Math.floor(s.stones / 2);
  s.hp = surviveHp;
  s.mp = mpMax;
  s.stones -= lost;
  s.combat = null;
  log(s, causeLine, `你身受重傷不敵,倉皇遁走…… 遺失了 ${lost} 靈石。`);
  return {
    title: "戰 敗 遁 走",
    success: false,
    lines: [
      `不敵【${mon.name}】,身受重傷!`,
      `氣血驟降至 ${surviveHp}/${hpMax}(僅剩三成)。`,
      `倉皇遁走間,遺失靈石 ${lost} 枚。`,
    ],
  };
}

// 回傳戰敗彈窗(defeat 有值時代表這回合被打到氣血歸零,呼叫端應以此彈窗取代靜默記錄)。
// 冰封判定放在最前面:不論攻擊/施法/遁走失敗召來的這一回合,只要怪物身上仍有冰封,一律直接跳過其攻擊。
function monsterTurn(s: SaveData): { lines: string[]; defeat?: Modal } {
  if (!s.combat) return { lines: [] };
  const mon = monsterById(s.combat.monsterId);
  if (hasStatus(s.combat.monsterStatus, "freeze")) {
    s.combat.monsterStatus = decrementStatus(s.combat.monsterStatus, "freeze");
    const line = `${mon.name} 深陷冰封,動彈不得!`;
    log(s, line);
    return { lines: [line] };
  }
  const lines: string[] = [];
  const monAtkBase = s.combat.bossAtk ?? mon.atk;
  const monAtk = Math.floor(monAtkBase * atkMultFromStatus(s.combat.monsterStatus));
  const { def, speed } = statsOf(s);
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
  let statusNote = "";
  const statusKind = STATUS_BY_ELEMENT[mon.element];
  if (statusKind && Math.random() < STATUS_PROC_CHANCE) {
    s.combat.playerStatus = applyStatus(
      s.combat.playerStatus,
      statusKind,
      statusKind === "freeze" ? FREEZE_DURATION : STATUS_DURATION,
    );
    statusNote = `,你因此${STATUS_LABEL[statusKind]}!`;
  }
  const { dmg: dmgAfterShield, absorbed } = absorbShield(s, dmg);
  lines.push(
    `${mon.name} 反擊${enraged ? ",龍血狂暴,攻擊力驟增三倍" : ""},你受到 ${dmgAfterShield} 點傷害${
      absorbed > 0 ? `(護盾抵擋 ${absorbed} 點)` : ""
    }${statusNote}。`,
  );
  s.hp -= dmgAfterShield;
  pushDamageEvent("player", dmgAfterShield);
  if (s.hp <= 0) {
    return { lines, defeat: handlePlayerDefeat(s, lines[lines.length - 1]) };
  }
  log(s, ...lines);
  return { lines };
}

// 玩家「回合結束」時的共用收尾:怪物身上的燒傷/中毒持續傷害 → 判定怪物死亡 →
// 怪物出手(冰封則跳過,見 monsterTurn)→ 玩家身上的燒傷/中毒持續傷害 → 判定玩家戰敗 →
// 存活則進入下一個玩家回合(法力回滿、法器攻擊次數限制重置)。
// 3.3 版起,回合結構改為「連續出牌直到主動施法結束」(見 pvp-territory-design.md 9.5):
// attack/cast/useTacticCard/rerollHand 只在「冰封動彈不得」時才會呼叫這裡(冰封=整回合直接跳過);
// 正常情況下這些動作只套用效果本身、不會結束回合,只有明確的 endTurn 動作與 flee 失敗會呼叫這裡。
// 3.4 版起手牌為符寶袋抽棄牌制:回合結束時手中剩牌一併棄置、重新抽 HAND_SIZE 張(見 redrawHand())。
function postPlayerTurn(s: SaveData): { loot?: Modal } {
  if (!s.combat) return {};
  const mon = monsterById(s.combat.monsterId);
  const monMaxHp = s.combat.bossHpMax ?? mon.hp;

  const monTick = tickDot(s.combat.monsterStatus, monMaxHp);
  s.combat.monsterStatus = monTick.list;
  if (monTick.dmg > 0) {
    s.combat.monsterHp -= monTick.dmg;
    pushDamageEvent("monster", monTick.dmg);
    log(s, `${mon.name} 因${monTick.labels.join("、")}持續受創!`);
    if (s.combat.monsterHp <= 0) return { loot: winCombat(s) };
  }

  const turn = monsterTurn(s);
  if (turn.defeat) return { loot: turn.defeat };
  if (!s.combat) return {}; // 防禦性檢查:理論上戰敗已由上一行攔截

  const { hpMax, mpMax } = statsOf(s);
  const plyTick = tickDot(s.combat.playerStatus, hpMax);
  s.combat.playerStatus = plyTick.list;
  if (plyTick.dmg > 0) {
    s.hp -= plyTick.dmg;
    pushDamageEvent("player", plyTick.dmg);
    const line = `你因${plyTick.labels.join("、")}持續受創!`;
    if (s.hp <= 0) return { loot: handlePlayerDefeat(s, line) };
    log(s, line);
  }

  // 下一個玩家回合開始:法力直接回滿(3.6 版一度誤刪、3.7 版修正改回——這條規則本身沒問題,
  // 真正缺的是戰鬥結束後也要回滿,見設計文件 9.8)。
  s.mp = mpMax;
  // 符寶袋回合制(3.4 版):手中剩牌一併棄置,重新抽 HAND_SIZE 張補滿手牌(牌堆不夠會自動洗回棄牌堆)
  const redrawn = redrawHand(s.combat);
  s.combat.hand = redrawn.drawn;
  s.combat.deck = redrawn.deck;
  s.combat.discard = redrawn.discard;

  return {};
}

function winCombat(s: SaveData): Modal {
  const mon = monsterById(s.combat!.monsterId);
  const { stoneMult, mpMax } = statsOf(s);
  // 戰鬥結束(獲勝)法力回滿,跟戰敗遁走一致,置於所有分支之前確保無論哪種勝利收尾都套用到
  s.mp = mpMax;

  // 天劫神靈試煉:斬滅此劫,飛昇機率翻倍——不掉落任何道具,直接代入翻倍後機率完成本次渡劫判定
  if (s.combat!.tianjieTrial) {
    s.combat = null;
    log(s, "你力挽狂瀾,竟將天劫神靈當場斬滅!劫雲消散,飛昇之機大增!");
    const chance = Math.min(1, breakChanceOf(s) * 2);
    return resolveAscensionRoll(s, chance);
  }

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
    // 高層機緣:頂尖仙法秘笈(極難)。太乙頂尖仙法唯登臨絕頂、窺見真正太歲天尊方可悟得,
    // 不應由九龍獄墮落真仙馬良(遠低於太乙之境)掉落,2.20 版起改為浮屠塔絕頂機緣
    if (floor >= 50 && !s.learned.includes("taiyi_hunyuan_lu") && Math.random() < 0.08) {
      give(s, "m_taiyi_hunyuan_lu");
      lines.push("塔尖霞光沖霄,幻象盡數崩碎——你竟窺見那真正的【太歲天尊】,悟得傳說中的【《北冥六真天地訣》仙簡】!");
    } else if (floor >= 30 && !s.learned.includes("zhutian_shenlei") && Math.random() < 0.1) {
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
  pendingDamageEvents = [];
  const result = applyActionInner(s, type, payload);
  // 統一收尾:氣血 / 法力 不得超過各自上限(也不得為負)
  const { hpMax, mpMax } = statsOf(result.save);
  result.save.hp = Math.max(0, Math.min(hpMax, result.save.hp));
  result.save.mp = Math.max(0, Math.min(mpMax, result.save.mp));
  if (pendingDamageEvents.length > 0) result.damageEvents = pendingDamageEvents;
  return result;
}

function applyActionInner(
  s: SaveData,
  type: string,
  payload: Record<string, unknown> = {},
): ActionResult {
  // 向後相容:補齊舊存檔缺少的欄位
  // 3.8 版:法器攻擊/法術攻擊改為與生俱來的基礎卡片,新角色由 newSave() 直接寫入 learned,
  // 舊存檔沒有這兩項,补上以免完全沒有基礎攻擊手段可用(原本恆常可用的法器攻擊已移除)
  if (!s.learned.includes("artifact_attack")) s.learned = ["artifact_attack", ...s.learned];
  if (!s.learned.includes("spell_attack")) s.learned = ["spell_attack", ...s.learned];
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
  // 恆紀年:舊存檔沒有創建當下的紀年快照,以「現在」回填(僅為顯示用,不影響任何遊戲數值)
  if (typeof s.bornEra !== "number") s.bornEra = currentEraYears();
  if (typeof s.oracleOffered !== "boolean") s.oracleOffered = false;
  // 3.0/3.1/3.3 版:符寶袋上線前,可能已有玩家戰鬥進行到一半(combat 存在但缺少 deck/discard,
  // 舊制 hand 就算存在也是不同邏輯抽出來的,一併重新洗一手新的),避免舊戰鬥因缺欄位而出錯或
  // 前端無牌可選(playerShield 為 undefined 時各處皆以 ?? 0 處理,無需在此額外補值)
  if (s.combat && !s.combat.deck) {
    const draw = startingCombatHand(s);
    s.combat.hand = draw.hand;
    s.combat.deck = draw.deck;
    s.combat.discard = draw.discard;
    s.combat.monsterStatus = s.combat.monsterStatus ?? [];
    s.combat.playerStatus = s.combat.playerStatus ?? [];
  }

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
      // 天算術機緣(黑市限定,獨立於下方本次雲遊收穫判定之外,不互斥):偶爾激發一次購買機會
      if (!s.oracleOffered && Math.random() < 0.05) {
        s.oracleOffered = true;
        log(
          s,
          "雲遊途中,忽遇一位鶴髮老者攔路,低語道:「貧道夜觀天象,算出你有一線生機——50 美利堅靈石,信則有,不信則無。」言罷飄然遠去,只留下黑市中一縷若有似無的天機。",
        );
      }
      const roll = Math.random();
      // 4% 遭遇金仙境超級大 BOSS
      if (roll < 0.04) {
        const boss = monsterById("jinxian");
        s.combat = {
          monsterId: boss.id,
          monsterHp: boss.hp,
          locationId: "__wander__",
          isLord: true,
          ...startingCombatHand(s),
          monsterStatus: [],
          playerStatus: [],
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
      // 渡劫→真仙:除修為外,還需一枚真仙丹(唯靈界地域王「太古龍祖」、九龍獄墮落真仙馬良掉落)。
      // 無論這次突破成敗,真仙丹都會被耗盡;服下之後,天劫神靈自天門降臨,須先過此劫方能渡劫飛昇——
      // 斬滅天劫神靈,飛昇機率翻倍;不敵此劫,飛昇機率減半,不會另外扣損靈石(2.18 版新增)。
      const needsZhenxian = realm.id === "dujie";
      if (needsZhenxian && (s.inventory["zhenxiandan"] ?? 0) < 1) {
        log(s, "天劫將至,然你尚未集得【真仙丹】——僅憑修為,道基終究不穩,無法渡劫飛昇。");
        return { save: s };
      }
      s.energy -= energyCost;
      if (needsZhenxian) {
        take(s, "zhenxiandan");
        const tianjie = monsterById("tianjie_shenling");
        s.combat = {
          monsterId: tianjie.id,
          monsterHp: tianjie.hp,
          locationId: "__tianjie__",
          isLord: true,
          tianjieTrial: true,
          ...startingCombatHand(s),
          monsterStatus: [],
          playerStatus: [],
        };
        if (!s.seen.includes(tianjie.id)) s.seen.push(tianjie.id);
        if (!s.lordsSeen.includes(tianjie.id)) s.lordsSeen.push(tianjie.id);
        log(s, "你服下【真仙丹】,九霄雷雲驟然翻湧——天劫神靈自天門凝形而降,阻你飛昇之路!");
        return { save: s };
      }
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
        s.combat = {
          monsterId: mid,
          monsterHp: mon.hp,
          locationId: loc.id,
          ...startingCombatHand(s),
          monsterStatus: [],
          playerStatus: [],
        };
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
        s.combat = {
          monsterId: lord.id,
          monsterHp: lord.hp,
          locationId: loc.id,
          isLord: true,
          ...startingCombatHand(s),
          monsterStatus: [],
          playerStatus: [],
        };
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
      s.combat = {
        monsterId: mid,
        monsterHp: mon.hp,
        locationId: loc.id,
        isLord: mon.isLord,
        ...startingCombatHand(s),
        monsterStatus: [],
        playerStatus: [],
      };
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

    // 出牌(3.5 版新增,取代單張 cast 作為前端主要施法入口,見 pvp-territory-design.md 第九節):
    // 一次「出牌」可同時打出多張手牌符寶(可重複,法力總和只要打得起即可),合併結算成一次傷害:
    // 每張符寶各自算出「威力(power × 增靈珠倍率 × 連攜 synergyPct × 延續加成 pendingElementBuff ×
    // 五行相剋)」後加總,宗門聲勢/虛弱狀態則對加總後的威力套用一次。法力歸零時自動觸發回合結束,
    // 不需要玩家再按一次施法結束。
    case "castBatch": {
      if (!s.combat) return { save: s, error: "並無戰鬥" };
      if (SPELL_SEALED_MONSTERS.has(s.combat.monsterId)) {
        return { save: s, error: "黑眼貔貅雙目幽光暴閃,將你的法力波動盡數封鎖,此戰唯有以法器相搏!" };
      }
      const techIds = Array.isArray(payload.techIds) ? payload.techIds.map(String) : [];
      if (techIds.length === 0) return { save: s, error: "尚未選取任何符寶" };

      // 冰封:動彈不得,這一整批出牌落空,不耗法力,但仍照樣結算本回合
      if (hasStatus(s.combat.playerStatus, "freeze")) {
        s.combat.playerStatus = decrementStatus(s.combat.playerStatus, "freeze");
        log(s, "你深陷冰封,動彈不得,這一擊落空!");
        const { loot } = postPlayerTurn(s);
        if (loot) return { save: s, loot };
        return { save: s };
      }

      // 逐張核銷手牌:必須真的持有(允許同名重複,但不得超過手牌實際張數)
      let remainingHand = [...(s.combat.hand ?? [])];
      for (const id of techIds) {
        if (!s.learned.includes(id)) return { save: s, error: "未習得此仙法" };
        if (!remainingHand.includes(id)) {
          return { save: s, error: "所選符寶不在手牌中,或選取張數超過手牌持有數量" };
        }
        remainingHand = removeOneFromHand(remainingHand, id);
      }

      const techs = techIds.map((id) => techById(id));
      // 法器攻擊只能單獨出牌,不能跟其他符寶合併打出(包含跟另一張法器攻擊一起選)
      if (techs.length > 1 && techs.some((t) => t.soloOnly)) {
        return { save: s, error: "法器攻擊只能單獨出牌,無法與其他符寶一起打出。" };
      }
      const totalCost = techs.reduce((sum, t) => sum + t.mpCost, 0);
      if (s.mp < totalCost) {
        return { save: s, error: `法力不足,這次出牌共需 ${totalCost} 點法力` };
      }

      const mon = monsterById(s.combat.monsterId);
      const { atk, weaponEl } = statsOf(s);
      const sectMult = Number(payload.sectDamageMult ?? 1);
      const weaken = atkMultFromStatus(s.combat.playerStatus);
      const buff = s.combat.pendingElementBuff;
      // 法器攻擊的屬性依裝備法器動態決定,不用資料表裡的佔位「無」屬性
      const effEl = (t: Technique) => (t.id === "artifact_attack" ? weaponEl : t.element) ?? t.element;

      // 同批次同元素張數(含自己),供 synergyPct 使用
      const elementCounts = new Map<Element, number>();
      for (const t of techs) elementCounts.set(effEl(t), (elementCounts.get(effEl(t)) ?? 0) + 1);

      let rawPower = 0;
      let bestElementMult = 1; // 戰報顯示用:批次內最高的相剋倍率
      for (const t of techs) {
        const level = techLevelOf(s, t.id);
        let p = t.power * techPowerMult(level);
        if (t.synergyPct) p *= 1 + t.synergyPct * (elementCounts.get(effEl(t)) ?? 1);
        if (buff && buff.element === effEl(t)) p *= 1 + buff.pct;
        const mult = elementMult(effEl(t), mon.element);
        bestElementMult = Math.max(bestElementMult, mult);
        p *= mult;
        rawPower += p;
      }
      // 延續加成用掉即消耗,不論這次批次是否真的命中同元素都算用過一次機會
      if (buff) s.combat.pendingElementBuff = undefined;

      s.mp -= totalCost;
      s.combat.hand = remainingHand;
      s.combat.discard = [...(s.combat.discard ?? []), ...techIds];

      // 打出後,若批次中有帶 nextPlayBuffPct 的符寶,登記給下一次出牌用(多張只取加成最高者)
      const buffGivers = techs.filter((t) => t.nextPlayBuffPct);
      if (buffGivers.length > 0) {
        const strongest = buffGivers.reduce((a, b) => (b.nextPlayBuffPct! > a.nextPlayBuffPct! ? b : a));
        s.combat.pendingElementBuff = { element: effEl(strongest), pct: strongest.nextPlayBuffPct! };
      }

      const names = techs.map((t) => t.name).join("、");
      if (Math.random() < (MONSTER_DODGE_CHANCE[mon.id] ?? 0)) {
        log(s, `你同時施展【${names}】,${mon.name} 身形一晃,竟憑空避過這一擊!`);
      } else {
        const dmg = Math.max(1, Math.floor(atk * rawPower * sectMult * weaken * (0.9 + Math.random() * 0.2)));
        let statusNote = "";
        for (const t of techs) {
          const statusKind = STATUS_BY_ELEMENT[effEl(t)];
          if (statusKind && Math.random() < STATUS_PROC_CHANCE) {
            s.combat.monsterStatus = applyStatus(
              s.combat.monsterStatus,
              statusKind,
              statusKind === "freeze" ? FREEZE_DURATION : STATUS_DURATION,
            );
            statusNote += `,${mon.name} 因此${STATUS_LABEL[statusKind]}!`;
          }
        }
        log(
          s,
          `你同時施展【${names}】,對 ${mon.name} 造成 ${formatDamage(dmg)}傷害` +
            (bestElementMult > 1 ? "(五行相剋,威力大增!)" : bestElementMult < 1 ? "(屬性被剋,威力受阻)" : "") +
            (sectMult > 1 ? `(宗門聲勢加持 ×${sectMult.toFixed(2)})` : "") +
            statusNote +
            "。",
        );
        s.combat.monsterHp -= dmg;
        pushDamageEvent("monster", dmg);
      }
      if (s.combat.monsterHp <= 0) return { save: s, loot: winCombat(s) };

      // 法力歸零:自動觸發施法結束,不需要玩家再按一次
      if (s.mp <= 0) {
        const { loot } = postPlayerTurn(s);
        if (loot) return { save: s, loot };
      }
      return { save: s };
    }

    case "cast": {
      if (!s.combat) return { save: s, error: "並無戰鬥" };
      if (SPELL_SEALED_MONSTERS.has(s.combat.monsterId)) {
        return { save: s, error: "黑眼貔貅雙目幽光暴閃,將你的法力波動盡數封鎖,此戰唯有以法器相搏!" };
      }
      const techId = String(payload.techId ?? "");
      if (!s.learned.includes(techId)) return { save: s, error: "未習得此仙法" };
      // 仙法卡牌化:僅本回合手牌內的仙法可施展,不在手牌中一律拒絕(前端只會顯示手牌內的按鈕,此為後端防線)
      if (!(s.combat.hand ?? []).includes(techId)) {
        return { save: s, error: "此仙法本回合未在手牌中,無法施展" };
      }
      const tech = techById(techId);

      // 冰封:動彈不得,這一擊直接落空,不耗法力,但仍照樣結算本回合(怪物出手、雙方 DOT、重抽手牌)
      if (hasStatus(s.combat.playerStatus, "freeze")) {
        s.combat.playerStatus = decrementStatus(s.combat.playerStatus, "freeze");
        log(s, "你深陷冰封,動彈不得,這一擊落空!");
        const { loot } = postPlayerTurn(s);
        if (loot) return { save: s, loot };
        return { save: s };
      }

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
      // 打出這張手牌:不論接下來是否被閃避,這張符寶都算「已出手」,從手中移掉這一張(手牌可能有
      // 同名重複符寶,只移掉這張)、送入棄牌堆,回合結束才會整批補回新的一手
      s.combat.hand = removeOneFromHand(s.combat.hand ?? [], techId);
      s.combat.discard = [...(s.combat.discard ?? []), techId];
      if (Math.random() < (MONSTER_DODGE_CHANCE[mon.id] ?? 0)) {
        log(s, `你施展【${tech.name}】,${mon.name} 身形一晃,竟憑空避過這一擊!`);
      } else {
        const weaken = atkMultFromStatus(s.combat.playerStatus);
        const dmg = Math.max(
          1,
          Math.floor(atk * tech.power * lvlMult * mult * sectMult * weaken * (0.9 + Math.random() * 0.2)),
        );
        let statusNote = "";
        const statusKind = STATUS_BY_ELEMENT[tech.element];
        if (statusKind && Math.random() < STATUS_PROC_CHANCE) {
          s.combat.monsterStatus = applyStatus(
            s.combat.monsterStatus,
            statusKind,
            statusKind === "freeze" ? FREEZE_DURATION : STATUS_DURATION,
          );
          statusNote = `,${mon.name} 因此${STATUS_LABEL[statusKind]}!`;
        }
        log(
          s,
          `你施展【${tech.name}】(${level} 級),對 ${mon.name} 造成 ${formatDamage(dmg)}傷害` +
            (mult > 1 ? "(五行相剋,威力大增!)" : mult < 1 ? "(屬性被剋,威力受阻)" : "") +
            (sectMult > 1 ? `(宗門聲勢加持 ×${sectMult.toFixed(2)})` : "") +
            statusNote +
            "。",
        );
        s.combat.monsterHp -= dmg;
        pushDamageEvent("monster", dmg);
      }
      if (s.combat.monsterHp <= 0) return { save: s, loot: winCombat(s) };
      // 3.3 版:出牌不再自動結束回合,法力允許就能接著出下一張,直到玩家主動施法結束(見 case "endTurn")
      return { save: s };
    }

    case "flee": {
      if (!s.combat) return { save: s, error: "並無戰鬥" };
      if (s.combat.tianjieTrial) {
        return { save: s, error: "天劫神靈自天門降下,插翅難逃,唯有放手一搏!" };
      }
      const mon = monsterById(s.combat.monsterId);
      if (Math.random() < 0.6) {
        const { mpMax } = statsOf(s);
        s.combat = null;
        s.mp = mpMax;
        log(s, `你祭出遁光,成功從 ${mon.name} 爪下逃離。`);
        return { save: s };
      }
      log(s, "遁走失敗!");
      const { loot } = postPlayerTurn(s);
      if (loot) return { save: s, loot };
      return { save: s };
    }

    // 戰術卡(3.1 版新增):儲物袋內 kind === "tactic" 的消耗型卡,戰鬥中打出後即消耗一張;
    // 3.3 版起不再自動結束回合,只是同一回合裡的其中一次出手,消耗的道具本身就是稀缺性所在。
    case "useTacticCard": {
      if (!s.combat) return { save: s, error: "並未身處戰鬥,無法使用戰術卡" };
      const itemId = String(payload.itemId ?? "");
      const item = itemById(itemId);
      if (!item || item.kind !== "tactic" || (s.inventory[itemId] ?? 0) <= 0) {
        return { save: s, error: "並無此戰術卡" };
      }
      const mon = monsterById(s.combat.monsterId);

      // 冰封:動彈不得,連戰術卡都取用不了,但仍照樣結算本回合
      if (hasStatus(s.combat.playerStatus, "freeze")) {
        s.combat.playerStatus = decrementStatus(s.combat.playerStatus, "freeze");
        log(s, "你深陷冰封,動彈不得,取不出這張戰術卡!");
        const { loot } = postPlayerTurn(s);
        if (loot) return { save: s, loot };
        return { save: s };
      }

      take(s, itemId);
      const lines: string[] = [`你打出戰術卡【${item.name}】!`];
      if (item.shieldPct) {
        const { hpMax } = statsOf(s);
        const gain = Math.max(1, Math.floor(hpMax * item.shieldPct));
        s.combat.playerShield = (s.combat.playerShield ?? 0) + gain;
        lines.push(`凝聚護盾 ${gain} 點,將優先抵擋接下來受到的傷害。`);
      }
      if (item.cleanse) {
        const had = (s.combat.playerStatus ?? []).length > 0;
        s.combat.playerStatus = [];
        lines.push(had ? "自身負面狀態盡數清除!" : "你身上並無負面狀態,此符暫無用武之地。");
      }
      if (item.enemyWeaken) {
        s.combat.monsterStatus = applyStatus(s.combat.monsterStatus, "weaken", WEAKEN_DURATION);
        lines.push(`${mon.name} 氣機紊亂,陷入虛弱!`);
      }
      if (item.forceStatus) {
        const dur = item.forceStatus === "freeze" ? FREEZE_DURATION : STATUS_DURATION;
        s.combat.monsterStatus = applyStatus(s.combat.monsterStatus, item.forceStatus, dur);
        lines.push(`${mon.name} 中招,必定${STATUS_LABEL[item.forceStatus]}!`);
      }
      log(s, ...lines);
      // 3.3 版:打出戰術卡不再自動結束回合,同一回合內仍可接著出牌(見 case "endTurn")
      return { save: s };
    }


    // 施法結束(3.3 版新增,見 pvp-territory-design.md 9.5):回合結構改寫的核心——玩家一回合內
    // 可連續使用 attack/cast/useTacticCard/rerollHand,直到主動呼叫這個動作才觸發怪物出手與雙方
    // 狀態效果結算,對應原本 postPlayerTurn 一直在做的事。
    case "endTurn": {
      if (!s.combat) return { save: s, error: "並無戰鬥" };
      const { loot } = postPlayerTurn(s);
      if (loot) return { save: s, loot };
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
        ...startingCombatHand(s),
        monsterStatus: [],
        playerStatus: [],
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
      log(s, "四枚太乙精魂同祭太乙殿,金光暴漲、天地共鳴——你自金仙一步踏入【太乙境】!");
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

      // 煉神術(九龍獄墮落真仙馬良極稀有掉落):終身限用一次,直接令精力上限永久翻倍
      if (item.kind === "special" && itemId === "lianshenshu") {
        if (s.energyDoubled) {
          log(s, "你已然煉神功成,精力上限早已倍增——【煉神術】對你已無用武之地。");
          return { save: s };
        }
        take(s, itemId);
        s.energyDoubled = true;
        s.energy = energyMaxOf(s);
        log(s, "你依《煉神術》祭煉真靈,周身經脈徹底脫胎換骨——精力上限就此永久倍增!");
        return {
          save: s,
          loot: {
            title: "煉 神 功 成",
            success: true,
            lines: ["精力上限永久 ×2", `現有精力上限:${energyMaxOf(s)}`],
          },
        };
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

      // 乾坤袋:隨身法寶,不消耗、不需「使用」,持有即可於儲物袋存取靈石
      if (item.kind === "special" && itemId === "qiankun_dai") {
        log(s, "【乾坤袋】乃隨身法寶,無需服用——持有即可於儲物袋中存入、取出靈石。");
        return { save: s };
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
      if (item.energy) {
        s.energy = Math.min(energyMaxOf(s), (s.energy ?? 0) + item.energy);
        effects.push(`回復精力 ${item.energy}`);
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

    // 乾坤袋:存入/取出靈石(1.24 版新增,黑眼貔貅掉落)。袋中靈石與 s.stones 分開計算,
    // 戰敗遁走遺失一半靈石、或雲遊途中被順走靈石,皆只動用 s.stones,袋中所藏分毫不失。
    case "depositPouch": {
      if ((s.inventory["qiankun_dai"] ?? 0) <= 0) return { save: s, error: "未持有乾坤袋" };
      const amount = Math.max(0, Math.floor(Number(payload.amount ?? 0)));
      if (amount <= 0 || amount > s.stones) return { save: s, error: "靈石不足" };
      s.stones -= amount;
      s.pouchStones = (s.pouchStones ?? 0) + amount;
      log(s, `你將 ${amount} 枚靈石存入乾坤袋,袋中自成天地,即便戰敗遁走亦不會遺散。`);
      return { save: s };
    }
    case "withdrawPouch": {
      if ((s.inventory["qiankun_dai"] ?? 0) <= 0) return { save: s, error: "未持有乾坤袋" };
      const amount = Math.max(0, Math.floor(Number(payload.amount ?? 0)));
      const have = s.pouchStones ?? 0;
      if (amount <= 0 || amount > have) return { save: s, error: "乾坤袋中靈石不足" };
      s.pouchStones = have - amount;
      s.stones += amount;
      log(s, `你自乾坤袋中取出 ${amount} 枚靈石。`);
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
      // 煉丹配方額外消耗壽元;壽元耗盡即道隕(與打坐/調息一致的處理方式)
      const lifeCost = rec.lifeCost ?? 0;
      const cap = maxLifeOf(s);
      if (lifeCost > 0 && s.age + lifeCost >= cap) {
        for (const m of rec.materials) take(s, m.id, m.n);
        s.stones -= rec.stones;
        s.age = cap;
        s.dead = true;
        s.combat = null;
        log(
          s,
          `煉丹爐火正盛,你卻覺一縷精魂隨爐煙散去——壽元已盡。`,
          `享年 ${cap} 年,道隕於【${realm.name}】。`,
        );
        return { save: s };
      }
      for (const m of rec.materials) take(s, m.id, m.n);
      s.stones -= rec.stones;
      s.energy -= energyCost;
      if (lifeCost > 0) {
        s.age += lifeCost;
        s.day = s.age;
      }
      // 高階符籙配方(需三種以上材料)有一定機率煉製失敗:材料與靈石照樣耗盡,但煉不出成品
      if (rec.failChance && Math.random() < rec.failChance) {
        log(s, `爐火驟然失控,轟然一聲炸響——煉製【${rec.name}】失敗,材料盡數化為飛灰!`);
        return {
          save: s,
          loot: {
            title: "煉 製 失 敗",
            success: false,
            lines: [`煉製【${rec.name}】失敗`, "材料與靈石已耗盡,一無所獲。"],
          },
        };
      }
      const result = itemById(rec.result);
      // 丹藥/仙物類產出效果不隨品質浮動(exp/heal/mp 等非 atkBonus/defBonus/speedBonus,浮動無意義),
      // 直接原樣給予;裝備類維持既有的 ±30% 屬性浮動機制。
      const isPillLike = result.kind === "pill" || result.kind === "special";
      const rolledId = isPillLike ? rec.result : `${rec.result}@${rand(70, 130)}`;
      give(s, rolledId);
      const rolled = itemById(rolledId);
      const lifeNote = lifeCost > 0 ? `(耗壽元 ${lifeCost} 年)` : "";
      log(s, `爐火純青,三日三夜——你成功煉製出【${rolled.name}】!${lifeNote}`);
      return {
        save: s,
        loot: {
          title: isPillLike ? "煉 丹 大 成" : "煉 器 大 成",
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

    case "dismissOracle": {
      // 婉拒天算術機緣(不涉及金流),清除待處理旗標,鶴髮老者不再等候
      if (!s.oracleOffered) return { save: s };
      s.oracleOffered = false;
      log(s, "你婉拒了老者的天算之言,轉身繼續趕路——機緣自來,不強求。");
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

    // 符寶袋調整(3.4 版新增):挑選已學仙法放入符寶袋,可重複放入同一門仙法(每門上限
    // POUCH_MAX_COPIES 張),移除時不得低於 pouchMinFor() 算出的最低張數——用「調整時擋下」取代
    // 「開戰時擋下」,玩家永遠處於合法狀態,不會卡在無法開戰的中間態。
    case "pouchAdjust": {
      if (s.combat) return { save: s, error: "激戰之中,無法調整符寶袋。" };
      const techId = String(payload.techId ?? "");
      if (!s.learned.includes(techId)) return { save: s, error: "未習得此仙法" };
      const delta = Number(payload.delta ?? 0);
      if (delta !== 1 && delta !== -1) return { save: s, error: "無效操作" };
      const pouch = s.pouch && s.pouch.length > 0 ? [...s.pouch] : defaultPouch(s.learned);
      if (delta > 0) {
        const count = pouch.filter((id) => id === techId).length;
        if (count >= POUCH_MAX_COPIES) {
          return { save: s, error: `單一仙法最多放入符寶袋 ${POUCH_MAX_COPIES} 張` };
        }
        pouch.push(techId);
      } else {
        const idx = pouch.indexOf(techId);
        if (idx === -1) return { save: s, error: "符寶袋中並無此符寶" };
        const minReq = pouchMinFor(s.learned.length);
        if (pouch.length <= minReq) {
          return { save: s, error: `符寶袋至少需保留 ${minReq} 張符寶` };
        }
        pouch.splice(idx, 1);
      }
      s.pouch = pouch;
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
