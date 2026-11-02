// 伺服器權威遊戲引擎:所有獎勵運算在此執行,前端僅顯示
import { COUNTERS, Element, Monster, ItemDef, Location, Recipe, Technique, formatDamage, formatHp, formatHpPair, formatStones } from "./types";
import { REALMS } from "./data/realms";
import { SECTS } from "./data/sects";
import { techById } from "./data/techniques";
import { itemById, ITEMS, XUANTIAN_ARTIFACT_IDS, RETIRED_ITEMS, isXuantianArtifact } from "./data/items";
import { LOCATIONS, MONSTERS, RECIPES, REGIONS, ELITE_SPAWNS, ELITE_SPAWN_CHANCE } from "./data/world";
import { MISSIONS } from "./data/missions";
import { dwellingLevelOf } from "./data/sectTiers";
import { currentEraYears } from "./data/eraTime";
import {
  TengfuPlacement,
  tengfuById,
  tengfuBonusOf,
  canPlaceTengfu,
  TENGFU_DROPS,
  TENGFU_DROP_CHANCE,
  TENGFU_DROP_CHANCE_LORD,
  TENGFU_DROP_CHANCE_ELITE,
} from "./data/tengfu";
import {
  zoneById,
  zoneOfLocation,
  zoneUnlocked,
  locationsOfZone,
  homeZoneForStage,
  tierOfStage,
  tierName,
  flyPlan,
  portalPlan,
  descendTargets,
  POJIE_ZHU,
  NIXING_PAN,
  DESCENT_ZONE,
  needsDescentPlatform,
  LANDING_ZONE,
  CROSS_REALM_MINUTES,
  VISIT_HOURS,
  MINUTE_MS,
  HOUR_MS,
  type TravelOptions,
  type WorldTier,
} from "./data/geography";
import {
  factionById,
  ownerOfZone,
  relationOf,
  type FactionId,
  TIANTING_DEF_PCT,
  TIANTING_PORTAL_MULT,
  TIANTING_TRAVEL_MULT,
  TIANTING_FAST_ZONES,
  LUNHUI_ATK_PCT,
  LUNHUI_VISIT_MULT,
  LUNHUI_PEARLS_FOR_DISC,
  LUNHUI_GRACE_HOURS,
  MANHUANG_HP_PCT,
  MANHUANG_MOUNT_MULT,
  JIUYOU_SHA_CARD_PCT,
  JIUYOU_SHAQI_PENALTY_MULT,
  ZHENMO_KILL_HEAL_PCT,
  ZHENMO_XISHA_MULT,
  HOME_DROP_MULT,
  AMBUSH_CHANCE,
  TOLL_KILLS,
  MERIT_HOME_KILL,
  MERIT_GUARD_KILL,
  RECALL_COOLDOWN_HOURS,
  CHANGE_COOLDOWN_DAYS,
  RIFT_COOLDOWN_HOURS,
  RIFT_CROSS_COOLDOWN_HOURS,
  RIFT_CROSS_WEAPON,
  shopOf,
} from "./data/factions";
import {
  craftCostOf,
  failChanceFinal,
  ELEMENT_DROP,
  elementMaterialFor,
  XUANTIAN_ELEMENTS,
  XUANTIAN_FAIL,
  XUANTIAN_STONES,
  XUANTIAN_FORGE_MINUTES,
  TAIYI_SOUL_IDS,
  forgeMinutesOf,
} from "./data/crafting";

// 狀態效果(2.21 版新增,仙法卡牌化的一部分;3.1 版新增 weaken;3.14 版新增 evade):掛在既有五行系統上,
// 火→燒傷、木→中毒、水→冰封,不獨立發明新屬性池;weaken(虛弱)不對應五行,僅由戰術卡的「衰運針」附加;
// evade(縹緲)只掛在玩家身上,僅由掛 selfStatus:"evade" 的符寶附加,保證避過怪物下一次攻擊,用掉即消。
// turns 為剩餘回合數,歸零即移除。
export interface StatusEffect {
  kind: "burn" | "poison" | "freeze" | "weaken" | "evade";
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
  factionGuard?: boolean; // 5.4 版:敵對派系領地的巡守截殺,擊殺得功勳
  // 5.4 版道祖特技(見 DAOZU_* 常數):已用掉的復活次數、本回合血條凍結、本回合封法
  revivesUsed?: number;
  timeFrozen?: boolean;
  spellSealed?: boolean;
  zhenmoGate?: boolean; // 真魔之門守關戰(5.0 版):擊敗冥翎天魔古龍才開啟真魔界,落敗不消耗真魔門令
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
  // 蓄力連攜(3.14 版新增):打出帶 chargeNextTurnPct 的符寶時先登記到 pending,回合結束時整批轉為
  // active、供下一整個玩家回合的傷害計算套用,那個回合結束時 active 歸零(見 postPlayerTurn)。
  pendingChargeBuffPct?: number;
  activeChargeBuffPct?: number;
  // 戰鬥見聞錄(獨立於 s.log 的全局見聞錄):只收錄本場戰鬥開打後產生的訊息,開戰時從空陣列開始,
  // 讓戰鬥中的見聞錄面板只顯示本場戰況,不與戰前的打坐/探索紀錄混在一起——見 log()。
  battleLog?: string[];
}

// 現在位置(5.2 版新增,見 world-travel-design.md):以地域(geography.ts 的 ZONES)為單位。
// travel:趕路中(真實時間,抵達時間由伺服器判定);visit:以破界珠/逆星盤下界遠征中,
// until 一到即被界面之力送回 returnZone。
export interface Travel {
  from: string;
  to: string;
  departAt: number;
  arriveAt: number;
  kind: "fly" | "descend" | "return";
}
export interface PlayerLocation {
  zone: string;
  travel?: Travel;
  visit?: { returnZone: string; until: number };
}

export interface Learning {
  techId: string;
  remain: number; // 剩餘年數
}

// 煉製中的器物(5.4 版):failChance 於開爐時定下;材料開爐即扣,失敗全數損失
export interface Forge {
  kind: "craft" | "xuantian";
  recipeId?: string;
  name: string;
  startAt: number;
  readyAt: number;
  failChance: number;
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
  // 3.19 版新增:真魔界(尋找洗煞池)、灰仙界(集滿五色異星盤+灰質破界盤)、通天閣(PvP)三處解鎖旗標,
  // 寫法比照 jinyuanUnlocked/manhuangUnlocked。
  zhenmoUnlocked?: boolean;
  huixianUnlocked?: boolean;
  tongtianUnlocked?: boolean;
  // 煞氣(3.19 版新增):真仙以上(realm.stage>=10)才會累積/生效的持久負面狀態,0~10000,只增不減
  // 靠擊殺(見 winCombat)、只減不增靠真實時間(見 applyShaqiDecay)與滅煞丹/洗煞池歸零。
  // 每點 -0.01% 傷害,滿 10000 時傷害完全歸零、觸發灰仙灰階視覺。
  shaqi?: number;
  kills: Record<string, number>;
  seen: string[];
  lordsSeen: string[]; // 已遭遇的地域王(妖獸領主)
  missionId: string | null;
  missionBase: number;
  age: number;
  lifeBonus: number;
  day: number;
  cultToday: number;
  xianli: number; // 仙靈力(真仙專屬,攻擊倍數單位,每點 +0.02% 額外傷害)
  techLevels: Record<string, number>; // 仙法等級(1~7),增靈珠強化
  pouch?: string[]; // 符寶袋(3.4 版新增):玩家自選的符寶清單,可重複(同名仙法可放入多張);
  // 未設定(新角色/舊存檔)時由 effectivePouch() 退回預設組合,不需要遷移欄位
  techCopies?: Record<string, number>; // 符寶副本(見 ownedCopiesOf()):每門仙法在「已學會的 1 份」
  // 之外額外擁有的副本數,決定符寶袋裡最多能放幾張同名仙法——不再是學會就能無限放,必須真的擁有
  // 多份副本(再次參悟同一本秘笈可多得一份,見 useItem 的 manual 分支)。未設定視為全數 0(僅擁有
  // 1 份);與生俱來的基礎卡片(法器攻擊/法術攻擊)不受此限,見 ownedCopiesOf()。
  pouchTrimmed?: boolean; // 已執行 3.16 版符寶袋回溯修正(見 trimPouchToOwnership):砍除擁有份數
  // 制上線前就已存在、超過目前擁有份數的符寶袋殘留張數,影響遊戲平衡故予以追溯修正,僅執行一次。
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
  // 滕符陣(4.2 版新增):tengfuBag 為尚未安裝的滕符(id → 張數),tengfuGrid 為已安裝在 6 寬 × 5 高符陣上的位置
  tengfuBag: Record<string, number>;
  tengfuGrid: TengfuPlacement[];
  // 5.2 版:現在位置(舊存檔由 normalizeSave 依境界補上)
  location?: PlayerLocation;
  // 5.3 版:坐騎槽、煉器保底(配方 id → 連續失敗次數)
  equippedMount?: string | null;
  craftPity?: Record<string, number>;
  // 5.4 版:十階器具與玄天仙器的煉製需要時間,爐中只能有一件(開爐即扣材料,出爐時才擲成敗)
  forge?: Forge | null;
  // 5.4 版:派系(飛昇後擇定)、功勳、各種冷卻(epoch 毫秒)、輪迴界開通旗標
  faction?: FactionId | null;
  factionPending?: boolean; // 已在仙界但尚未擇定派系
  factionChangedAt?: number;
  merit?: number;
  recallAt?: number; // 歸宗令
  riftAt?: number; // 破空(玄天仙器)
  riftCrossAt?: number; // 玄天斬靈劍斬破界壁
  lunhuiGraceAt?: number; // 輪迴殿:每日一次戰敗不損靈石
  lunhuiUnlocked?: boolean;
}

export interface Modal {
  title: string;
  lines: string[];
  success?: boolean;
  // 4.1 版新增:擊殺妖獸的結構化戰利品,供前端播放掉落動畫(lines 仍是給玩家讀的完整文字)
  rewards?: { exp?: number; stones?: number; items?: string[]; tengfu?: string[] };
}

// 戰鬥浮動傷害數字(3.5 版新增):每次 applyAction 呼叫過程中(含巢狀呼叫,如 postPlayerTurn 觸發
// 的 monsterTurn)累積發生的傷害事件,結尾一併回傳給前端,驅動畫面上跳出的浮動數字。
// element/advantage 為後續新增欄位:element 決定前端數字的屬性配色(未帶則沿用 target 預設色);
// advantage 僅玩家出牌造成的傷害才有意義("super" = 五行相剋加成、"resist" = 被剋減傷),前端據此
// 額外標示「克制!/抵抗」,怪物反擊與持續傷害(燒傷/中毒)只帶 element、不帶 advantage。
export interface DamageEvent {
  target: "monster" | "player";
  amount: number;
  element?: Element;
  advantage?: "super" | "resist";
}
let pendingDamageEvents: DamageEvent[] = [];
function pushDamageEvent(
  target: DamageEvent["target"],
  amount: number,
  element?: Element,
  advantage?: DamageEvent["advantage"],
) {
  if (amount > 0) pendingDamageEvents.push({ target, amount, element, advantage });
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

// 仙靈力:每一點 = 攻擊 ×0.02 倍,即 2% 額外傷害(真仙專屬,紫色)——3.19 版由 ×0.2 下修
export const XIANLI_MULT = 0.02;
// 戰鬥平衡性修正(4.0 版):仙靈力原本無上限,刷得越多攻擊力乘數越大、沒有盡頭。封頂在 ×8;
// 5.0 版合併 3.19 的 ×0.02 後,需累積 350 點仙靈力才會碰到上限(由 ×5 上調,讓長期累積的老角色保有回報)。
export const XIANLI_MULT_CAP = 8;

// 戰鬥平衡性修正(4.0 版):符寶連攜原本是「每多打一張同屬性符寶,全部同屬性符寶各自多吃一次加成」,
// 總傷害隨張數呈平方成長(3 卡已達單卡的 104%~286%、4 卡 159%~436%,見「戰鬥膨脹診斷卷」03 節)。
// 以下兩個常數把「用來計算加成的張數」封頂,讓連攜仍然值得打(2 張內持續有感),但不再無止盡疊乘:
// 同屬性加成(synergyPct)最多疊 2 張;批次張數加成(comboSizePct)最多疊 2 張(即最多 +1 張的額度)。
export const SYNERGY_STACK_CAP = 2;
export const COMBO_SIZE_STACK_CAP = 2;

export const maxLifeOf = (s: Pick<SaveData, "realmIdx" | "lifeBonus">) =>
  REALMS[s.realmIdx].lifespan + s.lifeBonus;

// 精力上限:隨大境界緩慢遞增(非氣血/法力那種指數翻倍),煉氣期 100、每個大境界 +15;
// 倍力丹每疊(最多 5 疊)永久 +10% 上限。
const ENERGY_BASE = 300;
const ENERGY_PER_STAGE = 50;
export const energyMaxOf = (
  s: Pick<SaveData, "realmIdx" | "energyPotionStacks" | "energyDoubled"> & {
    tengfuGrid?: TengfuPlacement[];
  },
) => {
  const base = ENERGY_BASE + ENERGY_PER_STAGE * (REALMS[s.realmIdx].stage - 1);
  const withPotions = Math.floor(base * (1 + 0.1 * (s.energyPotionStacks ?? 0)));
  // 滕符陣的精力加成為固定點數,加在煉神術翻倍之後
  return (s.energyDoubled ? withPotions * 2 : withPotions) + tengfuBonusOf(s.tengfuGrid).energy;
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
  // 仙靈力:一點 = 攻擊 ×0.02 倍(真仙專屬,紫色;3.19 版由 ×0.2 下修),4.0 版封頂 ×XIANLI_MULT_CAP
  const xianli = s.xianli ?? 0;
  // 滕符陣(4.2 版):攻擊/氣血/法力為百分比加成;防禦以境界攻擊力的百分比換算成護體值
  const tf = tengfuBonusOf(s.tengfuGrid);
  // 派系加成(5.4 版):天庭防禦、輪迴殿攻擊、蠻荒勢力氣血
  const fac = s.faction;
  const atk = Math.floor(
    baseAtk *
      Math.min(XIANLI_MULT_CAP, 1 + xianli * XIANLI_MULT) *
      (1 + tf.atk) *
      (fac === "lunhui" ? 1 + LUNHUI_ATK_PCT : 1),
  );
  const def = Math.floor(
    (sumDef + (s.boonDef ?? 0) + Math.floor(realm.atk * tf.def)) * (fac === "tianting" ? 1 + TIANTING_DEF_PCT : 1),
  );
  const hpMax = Math.floor(
    (realm.hpMax + (sect?.bonus.hp ?? 0) + (s.boonHp ?? 0)) * (1 + tf.hp) * (fac === "manhuang" ? 1 + MANHUANG_HP_PCT : 1),
  );
  const mpMax = Math.floor((realm.mpMax + (sect?.bonus.mp ?? 0)) * (1 + tf.mp));
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
    tengfu: tf,
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
  4: 0.03, // 元嬰
  5: 0.04, // 化神
  6: 0.05, // 煉虛
  7: 0.06, // 合體
  8: 0.08, // 大乘
  10: 0.12, // 真仙
  11: 0.16, // 金仙
  12: 0.25, // 太乙境
};

// 戰鬥平衡性修正(4.0 版):宗門聲勢原本純加總、無上限,宗門越養越大、全宗門一起無止盡變強——
// 實測日誌已出現 ×2.32~×3.30,見「戰鬥膨脹診斷卷」。封頂在 ×2,宗門仍會隨境界更高的同門持續成長,
// 只是到頂之後不再繼續疊加,避免跟仙靈力一樣變成沒有盡頭的乘數。
export const SECT_MULT_CAP = 2;

// 依宗門成員的境界 stage 清單,算出戰鬥傷害倍率:1 + Σ(每人對應加成),封頂 SECT_MULT_CAP
export function sectDamageMultOfStages(stages: (number | null | undefined)[]): number {
  let mult = 1;
  for (const stage of stages) {
    if (stage != null && SECT_STAGE_BONUS[stage]) mult += SECT_STAGE_BONUS[stage];
  }
  return Math.min(SECT_MULT_CAP, mult);
}

const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const monsterById = (id: string): Monster => MONSTERS.find((m) => m.id === id)!;

// 妖獸氣血與攻擊力:world.ts 寫多少就是多少。
// 4.0~4.2 版曾在戰鬥開場對氣血另乘平衡倍率(全域 ×2.5、一般妖獸 ×1.35、天南 ×0.7、煉虛~大乘再 ×1.35、
// 合體 ×2、大乘 ×2.5),5.0 版起已把換算後的數值直接寫回 world.ts,引擎不再乘任何倍率。
const minStageOfMonster = new Map<string, number>();
for (const l of LOCATIONS) {
  const ids = [...l.monsters, ...(ELITE_SPAWNS[l.id] ? [ELITE_SPAWNS[l.id]] : [])];
  for (const id of ids) minStageOfMonster.set(id, Math.min(minStageOfMonster.get(id) ?? 99, l.reqStage));
}
export const monsterMinStage = (id: string) => minStageOfMonster.get(id);

// 4.2 版:中後期妖獸修為下修——原始資料從結丹起「一隻就給一整個小境界的修為」(化神、合體甚至一隻超過需求),
// 多角色模擬從練氣到渡劫只要約 100 次行動。依妖獸出沒秘境的最低需求境界打折:結丹~合體(3~7 階)×0.25、
// 大乘(8 階)×0.15;地域王與菁英等 BOSS 不打折。
export const MONSTER_EXP_STAGE_MULT: Record<number, number> = { 3: 0.25, 4: 0.25, 5: 0.25, 6: 0.25, 7: 0.25, 8: 0.15 };
export const monsterExpOf = (mon: Pick<Monster, "id" | "exp" | "isLord" | "elite">) =>
  mon.isLord || mon.elite
    ? mon.exp
    : Math.floor(mon.exp * (MONSTER_EXP_STAGE_MULT[minStageOfMonster.get(mon.id) ?? 0] ?? 1));
export const monsterHpOf = (mon: Pick<Monster, "hp">) => Math.max(1, mon.hp);

// 4.2 版:秘境開放「越一階挑戰」——可進入需求境界比自身高一階的秘境;但仙域(需求 10 階)仍須真正飛昇
export const LOCATION_STAGE_LEEWAY = 1;
export const XIAN_STAGE = 10;
export const canEnterStage = (playerStage: number, reqStage: number) =>
  reqStage >= XIAN_STAGE ? playerStage >= reqStage : playerStage + LOCATION_STAGE_LEEWAY >= reqStage;
// 5.0 版:隱藏區域(金源仙域、蠻荒異界、真魔界、灰仙界)須先解鎖才能進入。舊版只在前端隱藏按鈕,
// 伺服器端並未檢查,手動送出請求即可直闖;合併 3.19 新增兩個高獎勵區域後補上這道檢查。
const REGION_UNLOCK_FLAG: Record<string, keyof SaveData> = {
  jinyuan: "jinyuanUnlocked",
  manhuang: "manhuangUnlocked",
  zhenmo: "zhenmoUnlocked",
  huixian: "huixianUnlocked",
  lunhui: "lunhuiUnlocked",
};
export const regionUnlocked = (s: SaveData, regionId: string) => {
  const flag = REGION_UNLOCK_FLAG[regionId];
  if (!flag || !!s[flag]) return true;
  // 5.4 版:派系入派即開通的地域(本派領地與必經之地)也算開啟
  const zone = zoneById(regionId);
  return !!zone && zoneUnlocked(s, zone);
};
// ═══ 5.2 版:現在位置與移動(設計見 world-travel-design.md;地域與航路資料見 geography.ts)═══
export const currentZoneOf = (s: Pick<SaveData, "location" | "realmIdx">) =>
  s.location?.zone ?? homeZoneForStage(REALMS[s.realmIdx].stage);
export const homeTierOf = (s: Pick<SaveData, "realmIdx">): WorldTier => tierOfStage(REALMS[s.realmIdx].stage);
export function travelOptionsOf(s: SaveData): TravelOptions {
  const mount = s.equippedMount ? itemById(s.equippedMount) : null;
  const fac = s.faction;
  // 派系加成(5.4 版):蠻荒勢力坐騎效果再 ×0.8;天庭在中土/北寒/金源之間移動 ×0.75、仙界傳送陣半價;
  // 與天庭敵對的派系不得使用天庭掌控的仙界傳送網
  const tiantingRel = fac ? relationOf(fac, "tianting") : "neutral";
  return {
    unlocked: (z) => zoneUnlocked(s, z),
    travelMult: (mount?.travelMult ?? 1) * (mount && fac === "manhuang" ? MANHUANG_MOUNT_MULT : 1),
    mountRoutes: mount?.routes ?? [],
    routeMult: (r) =>
      fac === "tianting" && TIANTING_FAST_ZONES.includes(r.a) && TIANTING_FAST_ZONES.includes(r.b)
        ? TIANTING_TRAVEL_MULT
        : 1,
    portalFee: (r) => {
      const xian = zoneById(r.a)?.tier === "xianjie";
      if (!xian || r.portalFee == null) return r.portalFee ?? null;
      if (tiantingRel === "hostile" || tiantingRel === "enemy") return null;
      return fac === "tianting" ? Math.floor(r.portalFee * TIANTING_PORTAL_MULT) : r.portalFee;
    },
  };
}
const zoneLabel = (id: string) => {
  const z = zoneById(id);
  return z ? `${tierName(z.tier)} · ${z.name}` : id;
};

// 結算移動:抵達目的地、下界時限到期被送回、境界與所在界不符時校正。
// 每次動作前(normalizeSave)與讀檔時都會呼叫,時間一律以伺服器的 now 為準。
export function settleLocation(s: SaveData, now: number): void {
  const stage = REALMS[s.realmIdx].stage;
  if (!s.location || !zoneById(s.location.zone)) s.location = { zone: homeZoneForStage(stage) };
  const loc = s.location;
  const t = loc.travel;
  if (t && now >= t.arriveAt) {
    loc.zone = t.to;
    delete loc.travel;
    if (t.kind === "return") {
      delete loc.visit;
      log(s, `穿過界壁,你回到了【${zoneLabel(t.to)}】。`);
    } else if (t.kind === "descend") {
      log(s, `界壁在身後合攏——你降臨【${zoneLabel(t.to)}】。界面之力如影隨形,時限一到便會將你送回上界。`);
    } else {
      log(s, `一路風塵僕僕,你抵達了【${zoneLabel(t.to)}】。`);
    }
  }
  // 下界時限到期:戰鬥中先打完,返回途中則讓它走完
  if (loc.visit && now >= loc.visit.until && !s.combat && loc.travel?.kind !== "return") {
    const back = loc.visit.returnZone;
    s.location = { zone: back };
    log(s, `界面之力驟然收緊,將你強行推回上界——你回到了【${zoneLabel(back)}】。`);
  }
  // 不在下界遠征時,所在界必須與境界相符(舊存檔、飛昇、其他途徑改變境界時校正)
  if (!s.location.visit && zoneById(s.location.zone)!.tier !== tierOfStage(stage)) {
    s.location = { zone: homeZoneForStage(stage) };
  }
}

// 飛昇跨界:境界跨入新的界時,移到該界落點並回傳敘事文字
function ascendRealmIfNeeded(s: SaveData, fromStage: number, toStage: number): string[] {
  const from = tierOfStage(fromStage);
  const to = tierOfStage(toStage);
  if (from === to) return [];
  s.location = { zone: LANDING_ZONE[to] };
  if (to === "lingjie") {
    return [
      `一道接引之光自天而降,將你托起——你飛昇靈界,落足【${zoneLabel(LANDING_ZONE.lingjie)}】。`,
      "人間自此與你隔絕,唯有破界珠方能重返。",
    ];
  }
  // 5.4 版:飛昇仙界須先擇定派系
  if (!s.faction) s.factionPending = true;
  return [
    `你落足仙界【${zoneLabel(LANDING_ZONE.xianjie)}】。萬載玄冰之上,仙靈之氣撲面而來;南方的中土仙域是道祖坐鎮之地,非初飛昇者所能涉足。`,
    "下界自此與你隔絕,唯有破界珠、逆星盤方能重返。",
    ...(s.factionPending ? ["仙界五大派系的使者已在此等候——擇定派系之前,無法動身。"] : []),
  ];
}

// 狩獵/採集等「在秘境裡做事」的動作:必須身在該秘境所屬地域,且不在趕路途中
function locationActionError(s: SaveData, loc: { name: string; region: string; continent?: string }): string | null {
  if (s.location?.travel) return "你正在趕路途中,抵達之前無法在此行動。";
  const z = zoneOfLocation(loc);
  if (!z || z.id !== currentZoneOf(s)) {
    return `${loc.name} 位於【${z ? zoneLabel(z.id) : "未知之地"}】,你須先前往該地。`;
  }
  return null;
}

// 新手護體:realmIdx 小於此值(練氣期前/中/後)時,突破失敗只散去一半修為、不折損壽元
export const NOVICE_GUARD_REALMS = 3;
// ═══ 5.1 版:妖獸傷害回到減法,防禦依階層換算;妖獸攻擊/氣血仍是 world.ts 寫多少就是多少 ═══
// 4.0 以前是純減法「妖獸攻擊 − 玩家防禦」,但裝備防禦遠高於同階妖獸攻擊(例如元嬰坊市裝備防禦 818,元嬰妖獸
// 攻擊只有 36~58),從築基起只要穿上坊市裝備,幾乎所有妖獸都只打 1 點。5.0 版改成比例減傷 K ÷ (K + 防禦),
// 但 K 沒有下限,裝備防禦遠超 K 時同樣趨近免疫(結丹裸裝與坊市頂裝的受傷差到 91 倍)。
//
// 5.1 版(公式也寫在修仙入門錄裡):
//   妖獸傷害 = max(保底, 妖獸攻擊 − 玩家防禦 × 防禦係數) × 隨機 0.8~1.2
//     妖獸攻擊 = world.ts 寫的 atk,寫多少就是多少
//     標準傷害 = 目標比例 × 參考氣血:參考玩家(參考氣血、參考防禦)被一般妖獸打一下該掉的氣血
//     防禦係數 = 標準傷害 ÷ 參考防禦:參考玩家的防禦剛好擋掉一份標準傷害;裝備防禦動輒上萬,
//               直接相減會讓防禦只在很窄的區間內有作用,所以先換算成同階妖獸傷害的量級
//     保底 = 妖獸攻擊 × MONSTER_MIN_DMG_FRAC:防禦超過參考防禦兩倍以後不再減傷,但仍會被打痛
// world.ts 的 atk 是依下式校準後寫回的數值:標準傷害 × (1 + 階內相對強度(0.75~1.3) × 身分倍率(一般 1、
// 菁英 1.8、地域王 2.2))——「1 份」被參考玩家的防禦擋掉,剩下的才是實際傷害,參考玩家被一般妖獸打一下約掉
// 目標比例(約 5~9%,11~20 下倒地),裸裝約兩倍。參考氣血 = 該境界中期的氣血上限(仙域以真仙境計);
// 參考防禦 = 該階中期玩家的典型防禦。調整單隻妖獸直接改 world.ts。
export interface AtkTier {
  refHp: number;
  refDef: number;
  target: number;
}
const midHpOf = (stage: number) => {
  const xs = REALMS.filter((r) => r.stage === stage);
  return xs[Math.min(1, xs.length - 1)].hpMax;
};
export const ATK_TIERS: Record<string, AtkTier> = {
  "1": { refHp: midHpOf(1), refDef: 10, target: 0.05 }, // 練氣:新手期稍輕
  "2": { refHp: midHpOf(2), refDef: 20, target: 0.065 },
  "3": { refHp: midHpOf(3), refDef: 240, target: 0.065 },
  "4": { refHp: midHpOf(4), refDef: 865, target: 0.065 },
  "5": { refHp: midHpOf(5), refDef: 13200, target: 0.065 },
  "6": { refHp: midHpOf(6), refDef: 13200, target: 0.065 },
  "7": { refHp: midHpOf(7), refDef: 13200, target: 0.065 },
  "8": { refHp: midHpOf(8), refDef: 16600, target: 0.065 },
  "9": { refHp: midHpOf(9), refDef: 20100, target: 0.065 }, // 天劫試煉
  "x-beihan": { refHp: midHpOf(10), refDef: 20100, target: 0.06 },
  "x-jinyuan": { refHp: midHpOf(10), refDef: 20100, target: 0.07 },
  "x-manhuang": { refHp: midHpOf(10), refDef: 135000, target: 0.08 },
  "x-zhenmo": { refHp: midHpOf(10), refDef: 135000, target: 0.08 },
  "x-huixian": { refHp: midHpOf(10), refDef: 200000, target: 0.09 }, // 灰仙界:非常強大
  "x-zhongtu": { refHp: midHpOf(10), refDef: 260000, target: 0.1 }, // 中土仙域:道祖坐鎮,仙界最強(高於灰仙界)
  "x-lunhui": { refHp: midHpOf(10), refDef: 135000, target: 0.08 }, // 5.4 版:輪迴界與蠻荒、真魔同階
};
const XIAN_TIER_ORDER: Record<string, number> = { beihan: 1, jinyuan: 2, manhuang: 3, zhenmo: 3, lunhui: 3, huixian: 4, zhongtu: 5 };
const tierRank = (key: string) => (key.startsWith("x-") ? 100 + (XIAN_TIER_ORDER[key.slice(2)] ?? 9) : Number(key));
const tierOfLocation = (l: { reqStage: number; region: string }) =>
  l.reqStage < XIAN_STAGE ? String(l.reqStage) : `x-${l.region}`;
// 每隻妖獸歸屬的階層:出沒的秘境中最低的那一階;地域王依所屬秘境/區域;菁英依現身秘境;
// 不在任何秘境的特殊妖獸另外指定(天劫試煉、雲遊大 BOSS、浮屠塔、一次性秘境)
const MONSTER_TIER = new Map<string, string>();
const setTier = (id: string | undefined, key: string) => {
  if (!id) return;
  const cur = MONSTER_TIER.get(id);
  if (!cur || tierRank(key) < tierRank(cur)) MONSTER_TIER.set(id, key);
};
for (const l of LOCATIONS) {
  const key = tierOfLocation(l);
  for (const id of l.monsters) setTier(id, key);
  setTier(l.lordId, key);
  setTier(ELITE_SPAWNS[l.id], key);
}
for (const r of REGIONS) {
  const locs = LOCATIONS.filter((l) => l.region === r.id);
  if (!r.lordId || locs.length === 0) continue;
  setTier(r.lordId, locs.map(tierOfLocation).sort((a, b) => tierRank(a) - tierRank(b))[0]);
}
for (const [id, key] of [
  ["tianjie_shenling", "9"],
  ["jinxian", "x-beihan"],
  ["huanxiang_taisui", "x-jinyuan"],
  ["boss_guanghan", "x-jinyuan"],
  ["boss_kunpeng", "x-jinyuan"],
  ["zm_mingling_gulong", "x-zhenmo"],
  ["guard_tianting", "x-zhongtu"],
  ["guard_lunhui", "x-lunhui"],
  ["guard_manhuang", "x-manhuang"],
  ["guard_jiuyou", "x-huixian"],
  ["guard_zhenmo", "x-zhenmo"],
] as const)
  MONSTER_TIER.set(id, key);
export const monsterTierOf = (id: string) => MONSTER_TIER.get(id);
// 某階的標準傷害:參考玩家被一般妖獸打一下該掉的氣血
const tierStdDmgOf = (t: AtkTier) => t.target * t.refHp;
// 妖獸攻擊力:world.ts 寫多少就是多少
export const monsterAtkOf = (mon: Pick<Monster, "atk">) => Math.max(1, mon.atk);
// 某階一般妖獸的基準攻擊(相對強度 1、身分倍率 1)
export const tierBaseAtkOf = (key: string) => Math.round(tierStdDmgOf(ATK_TIERS[key]) * 2);
// 防禦係數:該妖獸所屬階層的標準傷害 ÷ 參考防禦(未歸屬階層的妖獸是純減法)
export const monsterDefCoefOf = (mon: Pick<Monster, "id">) => {
  const t = ATK_TIERS[MONSTER_TIER.get(mon.id) ?? ""];
  return t ? tierStdDmgOf(t) / t.refDef : 1;
};
// 保底:防禦再高,妖獸每下至少打出攻擊的這個比例(一般妖獸約為標準傷害的 30%)
export const MONSTER_MIN_DMG_FRAC = 0.15;
// 浮屠塔每層攻擊倍率
export const FUTU_ATK_PER_FLOOR = 1.2;
// 妖獸對玩家的傷害(不含隨機浮動、閃避、三倍重擊、護盾):max(保底, 攻擊 − 防禦 × 防禦係數),最低 1
export const monsterDamageAfterDef = (rawAtk: number, def: number, defCoef: number) =>
  Math.max(1, Math.floor(rawAtk * MONSTER_MIN_DMG_FRAC), Math.floor(rawAtk - Math.max(0, def) * defCoef));

// 秘境可給予的裝備 / 秘笈池
const EQUIP_KINDS = ["artifact", "robe", "amulet", "talisman", "pet"];
const ITEMS_EQUIP = ITEMS.filter((i) => EQUIP_KINDS.includes(i.kind));
const ITEMS_MANUAL = ITEMS.filter((i) => i.kind === "manual" && i.teaches);

// ignoresDefenderCounters(3.19 版新增,灰仙界怪物專屬):被攻擊方完全無視五行相剋,不論攻擊方
// 用什麼屬性都吃中性 1 倍傷害。匯出供 pvpEngine.ts 共用同一份相剋判定,避免兩邊各寫一份不同步。
export function elementMult(
  attacker: Element | undefined,
  defender: Element,
  ignoresDefenderCounters?: boolean,
): number {
  if (!attacker || ignoresDefenderCounters) return 1;
  if (COUNTERS[attacker] === defender) return 1.5;
  if (COUNTERS[defender] === attacker) return 0.75;
  return 1;
}

// 蠻荒異界四大地域王的專屬異能(monster id 對照見 world.ts)
const MONSTER_DODGE_CHANCE: Record<string, number> = {
  lord_tianhu: 0.3, // 天狐:三成機率避過玩家攻擊
  zm_mingling_gulong: 0.2, // 冥翎天魔古龍:冥翎蔽身
  // 4.2 版大乘期菁英
  elite_yujiang: 0.25,
  elite_baidu: 0.25,
  elite_longwei: 0.2,
};
const MONSTER_TRIPLE_ATK_CHANCE: Record<string, number> = {
  lord_zhenlong: 0.2, // 真龍:兩成機率反擊 ×3
  zm_mingling_gulong: 0.15, // 冥翎天魔古龍:天魔龍威
  // 4.2 版大乘期菁英
  elite_leizun: 0.2,
  elite_zhanzun: 0.2,
  elite_mojun: 0.2,
  elite_luzhu: 0.15,
};
const SPELL_SEALED_MONSTERS = new Set(["lord_pixiu"]); // 黑眼貔貅:封鎖玩家法術,無法施展仙法
// 該張符寶此回合是否被封印(只剩法器攻擊可出),供前端把手牌變灰。
// 黑眼貔貅整場封法;時間道祖古或今每回合 25% 機率封法(combat.spellSealed,見 rollDaozuTurn)
export const isSpellSealed = (combat: Pick<CombatState, "monsterId" | "spellSealed">) =>
  SPELL_SEALED_MONSTERS.has(combat.monsterId) || !!combat.spellSealed;
export const isCardSealed = (combat: Pick<CombatState, "monsterId" | "spellSealed">, techId: string) =>
  isSpellSealed(combat) && techId !== "artifact_attack";

// ═══ 5.4 版:道祖特技 ═══
export const DAOZU_IDS = new Set(["daozu_wangsheng", "daozu_guixu", "daozu_moluo", "daozu_panyue", "lord_zhongtu"]);
export const DAOZU_CRIT_CHANCE = 0.2; // 所有道祖:兩成機率暴擊,傷害 ×1.5
export const DAOZU_CRIT_MULT = 1.5;
export const WANGSHENG_REVIVES = 2; // 輪迴道祖:死後復活兩次(氣血回滿、狀態清空)
export const GUIXU_DMG_TAKEN = 0.5; // 死寂道祖:受到的傷害減半
export const GUIXU_DEATH_BLAST = 500_000; // 死寂道祖:隕落時爆發 50 萬傷害,玩家因此倒下仍算戰敗
export const MOLUO_SURGE_HIGH = 1.6; // 真魔道祖:每次出手各半機率攻擊 ×1.6 或 ×0.6
export const MOLUO_SURGE_LOW = 0.6;
export const MOLUO_COUNTER_CHANCE = 0.35; // 真魔道祖:每次被出牌擊中時 35% 機率反擊,威力為一般攻擊的 1/3
export const MOLUO_COUNTER_FRAC = 1 / 3;
export const PANYUE_REGEN_PCT = 0.05; // 力之道祖:每回合回復 5% 氣血
export const PANYUE_ATTACKS = 2; // 力之道祖:每回合攻擊兩次
export const GUHUOJIN_FREEZE_CHANCE = 0.2; // 時間道祖:每回合 20% 機率凍結血條,該回合不受任何傷害
export const GUHUOJIN_SEAL_CHANCE = 0.25; // 時間道祖:每回合 25% 機率封法(同黑眼貔貅,只剩法器攻擊)

// 戰鬥畫面顯示的特性說明(道祖與既有的特技妖獸)
const DAOZU_TRAITS: Record<string, string[]> = {
  daozu_wangsheng: [`輪迴不滅:死後復活 ${WANGSHENG_REVIVES} 次,每次氣血回滿`],
  daozu_guixu: [
    `歸墟之體:受到的傷害減半`,
    `同歸寂滅:隕落時爆發 ${GUIXU_DEATH_BLAST.toLocaleString()} 點傷害,你若因此倒下仍算戰敗`,
  ],
  daozu_moluo: [
    `魔性無常:每次出手各半機率攻擊 +${Math.round((MOLUO_SURGE_HIGH - 1) * 100)}% 或 −${Math.round((1 - MOLUO_SURGE_LOW) * 100)}%`,
    `以殺止殺:每次被你出牌擊中,${Math.round(MOLUO_COUNTER_CHANCE * 100)}% 機率反擊(威力 1/3)`,
  ],
  daozu_panyue: [`不朽肉身:每回合回復 ${Math.round(PANYUE_REGEN_PCT * 100)}% 氣血`, `開天雙擊:每回合攻擊 ${PANYUE_ATTACKS} 次`],
  lord_zhongtu: [
    `光陰凝滯:每回合 ${Math.round(GUHUOJIN_FREEZE_CHANCE * 100)}% 機率凍結血條,該回合不受任何傷害`,
    `時光禁錮:每回合 ${Math.round(GUHUOJIN_SEAL_CHANCE * 100)}% 機率封印仙法,只能以法器攻擊`,
  ],
};
export function monsterTraitsOf(monId: string): string[] {
  const out = [...(DAOZU_TRAITS[monId] ?? [])];
  if (DAOZU_IDS.has(monId)) out.push(`道祖威壓:${Math.round(DAOZU_CRIT_CHANCE * 100)}% 機率暴擊,傷害 ×${DAOZU_CRIT_MULT}`);
  if (MONSTER_DODGE_CHANCE[monId]) out.push(`身法:${Math.round(MONSTER_DODGE_CHANCE[monId] * 100)}% 機率避過你的攻擊`);
  if (MONSTER_TRIPLE_ATK_CHANCE[monId]) out.push(`狂暴:${Math.round(MONSTER_TRIPLE_ATK_CHANCE[monId] * 100)}% 機率攻擊 ×3`);
  if (SPELL_SEALED_MONSTERS.has(monId)) out.push("封法:整場只能以法器攻擊");
  if (DOT_IMMUNE_MONSTERS.has(monId)) out.push("魔鱗不侵:免疫燒傷、中毒");
  const mon = MONSTERS.find((m) => m.id === monId);
  if (mon?.ignoresCounters) out.push("無視五行相剋");
  if (mon?.element === "煞") {
    const gain = mon.isLord ? SHAQI_ON_SHA_HIT.lord : mon.elite ? SHAQI_ON_SHA_HIT.elite : SHAQI_ON_SHA_HIT.normal;
    out.push(`煞氣侵體:每次擊中你,煞氣 +${gain}`);
  }
  return out;
}

// 玩家對妖獸造成傷害時的修正:時間道祖凍結血條(歸零)、死寂道祖減半
function daozuDamageTaken(s: SaveData, dmg: number): { dmg: number; note: string } {
  const id = s.combat?.monsterId;
  if (s.combat?.timeFrozen) return { dmg: 0, note: "(光陰凝滯,傷害如石沉大海)" };
  if (id === "daozu_guixu") return { dmg: Math.max(1, Math.floor(dmg * GUIXU_DMG_TAKEN)), note: "(歸墟之體,傷害減半)" };
  return { dmg, note: "" };
}

// 新的玩家回合開始時:時間道祖擲骰決定本回合是否凍結血條、是否封法
function rollDaozuTurn(s: SaveData) {
  if (!s.combat || s.combat.monsterId !== "lord_zhongtu") return;
  s.combat.timeFrozen = Math.random() < GUHUOJIN_FREEZE_CHANCE;
  s.combat.spellSealed = Math.random() < GUHUOJIN_SEAL_CHANCE;
  if (s.combat.timeFrozen) log(s, "古或今袖袍一拂,周身光陰凝滯——這一回合,任何攻擊都傷不了祂!");
  if (s.combat.spellSealed) log(s, "時光倒流,你剛凝聚的法力化為烏有——這一回合只能以法器相搏!");
}

// 妖獸氣血歸零:輪迴道祖復活、死寂道祖同歸寂滅,否則照常勝利結算。回傳 null 代表戰鬥繼續
function resolveMonsterDeath(s: SaveData): Modal | null {
  const combat = s.combat!;
  const mon = monsterById(combat.monsterId);
  if (mon.id === "daozu_wangsheng" && (combat.revivesUsed ?? 0) < WANGSHENG_REVIVES) {
    combat.revivesUsed = (combat.revivesUsed ?? 0) + 1;
    combat.monsterHp = combat.bossHpMax ?? monsterHpOf(mon);
    combat.monsterStatus = [];
    log(s, `六道輪盤轟然轉動——${mon.name} 自輪迴中重生,氣血盡復!(已復活 ${combat.revivesUsed}/${WANGSHENG_REVIVES} 次)`);
    return null;
  }
  if (mon.id === "daozu_guixu") {
    const { dmg, absorbed } = absorbShield(s, GUIXU_DEATH_BLAST);
    s.hp -= dmg;
    pushDamageEvent("player", dmg, mon.element);
    const line = `${mon.name} 隕落之際,歸墟之力轟然爆發,你受到 ${dmg} 點傷害${absorbed > 0 ? `(護盾抵擋 ${absorbed} 點)` : ""}!`;
    if (s.hp <= 0) return handlePlayerDefeat(s, `${line}你與歸墟道祖同歸於盡。`);
    log(s, line);
  }
  return winCombat(s);
}
// 免疫燒傷/中毒(5.0 版,冥翎天魔古龍「魔鱗不侵」):燒傷、中毒按氣血上限比例扣血,會讓超厚血的王反而
// 最好打;這類妖獸只吃直接傷害。冰封、虛弱仍然有效。
const DOT_IMMUNE_MONSTERS = new Set(["zm_mingling_gulong"]);
// 被煞屬性妖獸擊中時增加的煞氣(5.4 版):一般 30、菁英 60、地域王/道祖 150,真仙以上才累積,上限 10000
export const SHAQI_ON_SHA_HIT = { normal: 30, elite: 60, lord: 150 };
// 被這些妖獸擊敗(氣血歸零)時額外增加的煞氣(5.0 版);遁走不算
const SHAQI_ON_DEFEAT: Record<string, number> = { zm_mingling_gulong: 2500 };
const dotBlocked = (monId: string, kind: StatusEffect["kind"]) =>
  DOT_IMMUNE_MONSTERS.has(monId) && (kind === "burn" || kind === "poison");

// ═══ 符寶袋(2.21 版仙法卡牌化 → 3.1 持有制手牌 → 3.4 版全面改為符寶袋抽棄牌,見
// pvp-territory-design.md 第九節 9.3/9.4)═══
// 玩家從已學仙法中自選(可重複,同一門仙法可放入多張)組成至少 POUCH_MIN 張的符寶袋;開戰洗混
// 成牌堆,抽 HAND_SIZE 張成為手牌,法力允許可連續出牌,打出的牌進棄牌堆,回合結束手中剩牌一併
// 棄置、重新抽 HAND_SIZE 張,牌堆抽空則洗回棄牌堆繼續抽——真正的「抽牌/棄牌/洗牌」牌庫,取代
// 3.0/3.1 版「從已學仙法隨機/持有」的手牌邏輯。法器攻擊仍不佔手牌、恆常可用。
export const HAND_SIZE = 6;
export const POUCH_MIN = 10;
export const POUCH_MAX_COPIES = 5; // 單一仙法最多可放入符寶袋的張數,避免十張同名符寶的退化陣容
// 4.2 版:基礎卡片(法器攻擊/法術攻擊)在符寶袋中各至少 BASIC_CARD_MIN 張,開局即有 6 張必選牌,
// 避免整袋只塞高倍率仙法、每回合都抽到頂級連攜的極端組合,讓抽牌節奏更平衡。
export const BASIC_CARD_MIN = 3;
export const BASIC_CARDS = ["artifact_attack", "spell_attack"] as const;
export const isBasicCard = (id: string) => (BASIC_CARDS as readonly string[]).includes(id);
// 補足基礎卡片到最低張數(不足才補,超過的不動)
export function withBasicMinimum(pouch: string[]): string[] {
  const out = [...pouch];
  for (const id of BASIC_CARDS) {
    let n = out.filter((x) => x === id).length;
    while (n < BASIC_CARD_MIN) {
      out.push(id);
      n += 1;
    }
  }
  return out;
}

function shuffled<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = rand(0, i);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// 符寶副本(3.15 版新增,回應「學會即可無限放入符寶袋」的設計問題):與生俱來的基礎卡片(法器攻擊/
// 法術攻擊)不受擁有份數限制,視為恆常擁有 POUCH_MAX_COPIES 份;真正修習來的仙法預設只擁有 1 份
// (學會本身即代表擁有第一份符寶),額外份數來自 techCopies(見 SaveData 欄位註解、useItem 的
// manual 分支——再次參悟已學會的秘笈可多得一份),封頂同樣是 POUCH_MAX_COPIES。
export function ownedCopiesOf(s: Pick<SaveData, "techCopies">, techId: string): number {
  const tech = techById(techId);
  if (tech.innate) return POUCH_MAX_COPIES;
  return Math.min(POUCH_MAX_COPIES, 1 + (s.techCopies?.[techId] ?? 0));
}

// 符寶袋回溯修正(3.16 版新增):擁有份數制上線前,舊存檔的符寶袋可能已經放了超過目前擁有份數的
// 張數(過去學會即可無限複製到單卡上限)。這會影響遊戲平衡,因此主動砍掉每門仙法超過擁有份數的
// 多餘張數——跟 3.15 版原本「不溯及既往」的決定不同,見存檔欄位 pouchTrimmed(只執行一次)。
function trimPouchToOwnership(s: SaveData) {
  if (!s.pouch || s.pouch.length === 0) return;
  const counts: Record<string, number> = {};
  s.pouch = s.pouch.filter((id) => {
    const owned = ownedCopiesOf(s, id);
    counts[id] = (counts[id] ?? 0) + 1;
    return counts[id] <= owned;
  });
}

// 符寶袋尚未由玩家設定(新角色/舊存檔)時的預設內容:把已學仙法輪流填滿,每門仙法最多填到其擁有
// 份數(ownedCopiesOf),湊滿 POUCH_MIN 張或擁有份數用盡為止(擁有份數用盡代表角色目前擁有的符寶
// 副本天生就湊不滿 POUCH_MIN,屬於早期角色的正常情況,不需要也不應該硬湊超過擁有量)。
export function defaultPouch(s: Pick<SaveData, "learned" | "techCopies">): string[] {
  const learned = s.learned;
  if (learned.length === 0) return [];
  const remaining = new Map(learned.map((id) => [id, ownedCopiesOf(s, id)] as const));
  const totalAvailable = [...remaining.values()].reduce((a, b) => a + b, 0);
  const target = Math.min(POUCH_MIN, totalAvailable);
  const out: string[] = [];
  let i = 0;
  while (out.length < target) {
    const id = learned[i % learned.length];
    const left = remaining.get(id)!;
    if (left > 0) {
      out.push(id);
      remaining.set(id, left - 1);
    }
    i += 1;
  }
  return out;
}

// 目前有效的符寶袋:玩家已設定過就用玩家的選擇(濾掉理論上不該發生、但防禦性排除已不在
// 已學仙法中的殘留項目),否則退回預設符寶袋。
// 注意:這裡刻意不額外過濾「超過目前擁有份數」的殘留張數——擁有份數系統上線前就已組好的符寶袋
// 維持原狀(不溯及既往、不會有玩家一登入符寶就無聲消失),之後只透過 pouchAdjust 擋下「新增」到超
// 過擁有份數,不會強制砍掉玩家已經存在的設定。
export function effectivePouch(s: Pick<SaveData, "learned" | "pouch" | "techCopies">): string[] {
  const raw = (s.pouch ?? []).filter((id) => s.learned.includes(id));
  return withBasicMinimum(raw.length > 0 ? raw : defaultPouch(s));
}

// 符寶袋最低張數需求:正常是 POUCH_MIN,但已學仙法/擁有份數太少(依 ownedCopiesOf 加總仍湊不滿)
// 時降低門檻,避免極早期角色(通常只擁有起手那幾張符寶)被卡住無法組出合法符寶袋。
export function pouchMinFor(s: Pick<SaveData, "learned" | "techCopies">): number {
  const totalAvailable = s.learned.reduce((sum, id) => sum + ownedCopiesOf(s, id), 0);
  return Math.min(POUCH_MIN, totalAvailable);
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
// 匯出供 pvpEngine.ts 共用同一套狀態效果邏輯(通天閣 PvP 比照挑戰怪物,同樣支援燒傷/中毒/冰封/虛弱/縹緲)。
export const STATUS_BY_ELEMENT: Partial<Record<Element, StatusEffect["kind"]>> = {
  火: "burn",
  木: "poison",
  水: "freeze",
};
export const STATUS_LABEL: Record<StatusEffect["kind"], string> = {
  burn: "燒傷",
  poison: "中毒",
  freeze: "冰封",
  weaken: "虛弱",
  evade: "縹緲",
};
export const STATUS_PROC_CHANCE = 0.3; // 對應屬性的招式命中時,額外機率附加狀態
export const STATUS_DURATION = 3; // 燒傷/中毒持續回合數
export const FREEZE_DURATION = 2; // 冰封持續回合數(較短,避免控制鏈過強)
const BURN_TICK_PCT = 0.04; // 燒傷:每回合造成目標氣血上限 4% 的持續傷害
const POISON_TICK_PCT = 0.025; // 中毒:每回合造成目標氣血上限 2.5% 的持續傷害
const POISON_WEAKEN_MULT = 0.8; // 中毒:攻擊輸出打八折(法器攻擊與仙法皆適用)
// 虛弱(3.1 版新增,僅由戰術卡「衰運針」附加,不與五行掛鉤):攻擊輸出打七折,持續 2 回合
const WEAKEN_MULT = 0.7;
const WEAKEN_DURATION = 2;

export function hasStatus(list: StatusEffect[] | undefined, kind: StatusEffect["kind"]): boolean {
  return !!list?.some((e) => e.kind === kind && e.turns > 0);
}

// 疊加/刷新狀態效果:同名狀態取剩餘回合數較大者,不疊加傷害倍率——避免同屬性連續命中無限堆疊爆炸
export function applyStatus(
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
export function decrementStatus(list: StatusEffect[] | undefined, kind: StatusEffect["kind"]): StatusEffect[] {
  return (list ?? [])
    .map((e) => (e.kind === kind ? { ...e, turns: e.turns - 1 } : e))
    .filter((e) => e.turns > 0);
}

// 中毒/虛弱狀態下攻擊輸出打折(不論法器攻擊或仙法皆適用,雙方通用);兩者同時存在時效果相乘
export function atkMultFromStatus(list: StatusEffect[] | undefined): number {
  let mult = 1;
  if (hasStatus(list, "poison")) mult *= POISON_WEAKEN_MULT;
  if (hasStatus(list, "weaken")) mult *= WEAKEN_MULT;
  return mult;
}

// 結算燒傷/中毒的持續傷害(冰封在回合跳過時扣減,縹緲在抵擋攻擊時消耗),回傳傷害總和與新的狀態清單;
// 虛弱沒有持續傷害,但仍與燒傷/中毒一併在此扣減剩餘回合數,歸零即移除
export function tickDot(
  list: StatusEffect[] | undefined,
  maxHp: number,
): { list: StatusEffect[]; dmg: number; labels: string[]; events: { element: Element; dmg: number }[] } {
  const arr = list ? [...list] : [];
  let dmg = 0;
  const labels: string[] = [];
  const events: { element: Element; dmg: number }[] = [];
  for (const e of arr) {
    if (e.kind === "burn") {
      const d = Math.max(1, Math.floor(maxHp * BURN_TICK_PCT));
      dmg += d;
      labels.push(`燒傷 -${d}`);
      events.push({ element: "火", dmg: d });
    } else if (e.kind === "poison") {
      const d = Math.max(1, Math.floor(maxHp * POISON_TICK_PCT));
      dmg += d;
      labels.push(`中毒 -${d}`);
      events.push({ element: "木", dmg: d });
    }
  }
  const next = arr
    .map((e) => (e.kind === "freeze" || e.kind === "evade" ? e : { ...e, turns: e.turns - 1 }))
    .filter((e) => e.turns > 0);
  return { list: next, dmg, labels, events };
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
  if (s.combat) s.combat.battleLog = [...(s.combat.battleLog ?? []), ...msgs].slice(-MAX_LOG);
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
    // 擁有份數(3.15 版新增)需與上面的起手符寶袋對齊:startTech 起手就放了 3 張,故額外擁有 2 份
    // (1 份來自學會本身 + 2 份 techCopies = 3 份),startTech2 起手只放 1 張,不需要額外份數。
    techCopies: { [sect.startTech]: 2 },
    learning: null,
    equippedWeapon: null,
    equippedArmor: null,
    equippedRobe: null,
    equippedAmulet: null,
    equippedTalisman: null,
    equippedPet: null,
    equippedMing: null,
    equippedMount: null,
    unlockedRecipes: [],
    jinyuanUnlocked: false,
    manhuangUnlocked: false,
    zhenmoUnlocked: false,
    huixianUnlocked: false,
    tongtianUnlocked: false,
    shaqi: 0,
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
    tengfuBag: {},
    tengfuGrid: [],
    pouchStones: 0,
    location: { zone: LANDING_ZONE.renjian },
    craftPity: {},
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
  // 5.0 版:真仙以上修為唯有斬妖獲得,打坐/採集時的頓悟、手談不再給修為(該次奇遇直接略過)
  const xian = realm.stage >= XIAN_STAGE;
  if (roll < 0.03) {
    if (xian) return;
    const gain = Math.floor(realm.expNeed * 0.15);
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
    const herbs = ["zhuguo", "xuelingzhi", "qiannianlingru"];
    const h = herbs[rand(0, realm.stage >= 3 ? 3 : 2)];
    give(s, h);
    log(s, `一隻靈猴自林間擲來一株【${itemById(h).name}】,吱吱兩聲便竄得無影無蹤。`);
  } else if (roll < 0.085) {
    const lost = Math.floor(s.stones * 0.05);
    s.stones -= lost;
    log(s, `一名遊方散修與你論道半日,臨別時你才發現儲物袋輕了——被順走了 ${lost} 靈石!`);
  } else if (roll < 0.105) {
    if (xian) return;
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

// 煞氣隨真實時間緩慢消退(3.19 版新增):搭 applyRealTimeAging 同一個 hours 值,不需要另外的
// DB 時間戳欄位。每小時 -50,下限 0;未累積過煞氣(0)時直接跳過,避免每次行動都寫入無意義的 0。
export const SHAQI_DECAY_PER_HOUR = 50;
export function applyShaqiDecay(s: SaveData, hours: number) {
  if (hours <= 0 || !(s.shaqi && s.shaqi > 0)) return;
  s.shaqi = Math.max(0, s.shaqi - hours * SHAQI_DECAY_PER_HOUR);
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
      ...ascendRealmIfNeeded(s, realm.stage, REALMS[s.realmIdx].stage),
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
  // 輪迴殿(5.4 版):每 24 小時一次戰敗不損失靈石
  const now = Date.now();
  const grace = s.faction === "lunhui" && now - (s.lunhuiGraceAt ?? 0) >= LUNHUI_GRACE_HOURS * HOUR_MS;
  if (grace) s.lunhuiGraceAt = now;
  const lost = grace ? 0 : Math.floor(s.stones / 2);
  s.hp = surviveHp;
  s.mp = mpMax;
  s.stones -= lost;
  s.combat = null;
  // 冥翎天魔古龍(5.0 版):落敗者遭天魔魔氣侵體,煞氣暴增(上限 10000)
  const shaqiGain = SHAQI_ON_DEFEAT[mon.id] ?? 0;
  if (shaqiGain > 0) s.shaqi = Math.min(10000, (s.shaqi ?? 0) + shaqiGain);
  log(s, causeLine, grace ? "你身受重傷不敵,遁入輪迴暗道脫身——靈石分毫未失。" : `你身受重傷不敵,倉皇遁走…… 遺失了 ${lost} 靈石。`);
  return {
    title: "戰 敗 遁 走",
    success: false,
    lines: [
      `不敵【${mon.name}】,身受重傷!`,
      `氣血驟降至 ${formatHpPair(surviveHp, hpMax)}(僅剩三成)。`,
      grace ? "遁入輪迴暗道脫身,靈石分毫未失(輪迴殿每日一次)。" : `倉皇遁走間,遺失靈石 ${lost} 枚。`,
      ...(shaqiGain > 0 ? [`天魔魔氣侵體,煞氣暴增 ${shaqiGain}(現 ${s.shaqi}/10000)!`] : []),
    ],
  };
}

// 回傳戰敗彈窗(defeat 有值時代表這回合被打到氣血歸零,呼叫端應以此彈窗取代靜默記錄)。
// 冰封判定放在最前面:不論攻擊/施法/遁走失敗召來的這一回合,只要怪物身上仍有冰封,一律直接跳過其攻擊。
function monsterTurn(s: SaveData, attackMult: number, counter = false): { lines: string[]; defeat?: Modal } {
  if (!s.combat) return { lines: [] };
  const mon = monsterById(s.combat.monsterId);
  if (hasStatus(s.combat.monsterStatus, "freeze")) {
    s.combat.monsterStatus = decrementStatus(s.combat.monsterStatus, "freeze");
    const line = `${mon.name} 深陷冰封,動彈不得!`;
    log(s, line);
    return { lines: [line] };
  }
  const lines: string[] = [];
  // 縹緲(3.14 版新增,由 selfStatus:"evade" 符寶附加):保證避過這一次攻擊,用掉即消,
  // 優先於下方以速度計算的一般機率式閃避判定。
  if (hasStatus(s.combat.playerStatus, "evade")) {
    s.combat.playerStatus = decrementStatus(s.combat.playerStatus, "evade");
    const line = `${mon.name} 撲擊而來,你身法縹緲如影,穩穩避開了這一擊!`;
    log(s, line);
    return { lines: [line] };
  }
  const monAtkBase = s.combat.bossAtk ?? monsterAtkOf(mon);
  // 真魔道祖:魔性無常,各半機率攻擊 ×1.6 / ×0.6
  const surge = mon.id === "daozu_moluo" ? (Math.random() < 0.5 ? MOLUO_SURGE_HIGH : MOLUO_SURGE_LOW) : 1;
  const monAtk = Math.floor(monAtkBase * attackMult * surge);
  const { def, speed } = statsOf(s);
  const monSpeed = Math.floor(monAtk * 1.2);
  const dodge = Math.min(0.35, Math.max(0.05, (speed / (speed + monSpeed)) * 0.5));
  if (Math.random() < dodge) {
    lines.push(`${mon.name} 撲擊而來,你身形一晃,堪堪避過!(閃避 ${Math.round(dodge * 100)}%)`);
    log(s, ...lines);
    return { lines };
  }
  // 5.1 版:減法,防禦依階層換算(見 ATK_TIERS 上方說明);浮屠塔每層攻擊變強,防禦係數同步放大,
  // 讓同一位玩家在每一層承受的傷害都是第 1 層的同一倍數
  const defScale = s.combat.futuFloor ? Math.pow(FUTU_ATK_PER_FLOOR, s.combat.futuFloor - 1) : 1;
  const dmgBase = monsterDamageAfterDef(monAtk, def, monsterDefCoefOf(mon) * defScale);
  let dmg = Math.max(1, rand(Math.floor(dmgBase * 0.8), Math.floor(dmgBase * 1.2)));
  const enraged = Math.random() < (MONSTER_TRIPLE_ATK_CHANCE[mon.id] ?? 0);
  if (enraged) dmg *= 3;
  const crit = DAOZU_IDS.has(mon.id) && Math.random() < DAOZU_CRIT_CHANCE;
  if (crit) dmg = Math.floor(dmg * DAOZU_CRIT_MULT);
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
  if (mon.element === "煞" && REALMS[s.realmIdx].stage >= XIAN_STAGE) {
    const gain = mon.isLord ? SHAQI_ON_SHA_HIT.lord : mon.elite ? SHAQI_ON_SHA_HIT.elite : SHAQI_ON_SHA_HIT.normal;
    s.shaqi = Math.min(10000, (s.shaqi ?? 0) + gain);
    statusNote += `,煞氣侵體 +${gain}(現 ${s.shaqi}/10000)`;
  }
  lines.push(
    `${mon.name} ${counter ? "以殺止殺,當場還手" : "反擊"}${enraged ? ",龍血狂暴,攻擊力驟增三倍" : ""}${
      surge > 1 ? ",魔性大發,攻勢暴漲" : surge < 1 ? ",魔性低迷,攻勢稍緩" : ""
    }${crit ? ",道祖威壓之下竟是暴擊" : ""},你受到 ${dmgAfterShield} 點傷害${
      absorbed > 0 ? `(護盾抵擋 ${absorbed} 點)` : ""
    }${statusNote}。`,
  );
  s.hp -= dmgAfterShield;
  pushDamageEvent("player", dmgAfterShield, mon.element);
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
  // 本回合既有的冰封統一在此扣減一次;反擊新附加的冰封留到下一回合,避免立即少一回合。
  s.combat.playerStatus = decrementStatus(s.combat.playerStatus, "freeze");
  const mon = monsterById(s.combat.monsterId);
  const monMaxHp = s.combat.bossHpMax ?? monsterHpOf(mon);

  // 先保留本回合的減攻倍率,讓最後一回合的中毒/虛弱在 DOT 扣減回合後仍影響本次反擊。
  const monAttackMult = atkMultFromStatus(s.combat.monsterStatus);
  const monTick = tickDot(s.combat.monsterStatus, monMaxHp);
  s.combat.monsterStatus = monTick.list;
  if (monTick.dmg > 0) {
    // 5.4 版:持續傷害同樣受道祖的凍結血條、減傷影響
    const taken = daozuDamageTaken(s, monTick.dmg);
    const scale = taken.dmg / monTick.dmg;
    s.combat.monsterHp -= taken.dmg;
    for (const ev of monTick.events) pushDamageEvent("monster", Math.floor(ev.dmg * scale), ev.element);
    log(s, `${mon.name} 因${monTick.labels.join("、")}持續受創!${taken.note}`);
    if (s.combat.monsterHp <= 0) {
      const end = resolveMonsterDeath(s);
      if (end) return { loot: end };
    }
  }
  // 本回合的凍結/封法到此為止,換妖獸出手
  s.combat.timeFrozen = false;
  s.combat.spellSealed = false;

  // 力之道祖每回合攻擊兩次;其餘妖獸一次
  const attacks = mon.id === "daozu_panyue" ? PANYUE_ATTACKS : 1;
  for (let i = 0; i < attacks; i++) {
    const turn = monsterTurn(s, monAttackMult);
    if (turn.defeat) return { loot: turn.defeat };
    if (!s.combat) return {}; // 防禦性檢查:理論上戰敗已由上一行攔截
  }
  // 力之道祖:不朽肉身,每回合回復 5% 氣血
  if (mon.id === "daozu_panyue") {
    const heal = Math.floor(monMaxHp * PANYUE_REGEN_PCT);
    s.combat.monsterHp = Math.min(monMaxHp, s.combat.monsterHp + heal);
    log(s, `${mon.name} 肉身不朽,傷勢自行癒合(氣血 +${formatHp(heal)})。`);
  }

  const { hpMax, mpMax } = statsOf(s);
  const plyTick = tickDot(s.combat.playerStatus, hpMax);
  s.combat.playerStatus = plyTick.list;
  if (plyTick.dmg > 0) {
    s.hp -= plyTick.dmg;
    for (const ev of plyTick.events) pushDamageEvent("player", ev.dmg, ev.element);
    const line = `你因${plyTick.labels.join("、")}持續受創!`;
    if (s.hp <= 0) return { loot: handlePlayerDefeat(s, line) };
    log(s, line);
  }

  // 下一個玩家回合開始:法力直接回滿(3.6 版一度誤刪、3.7 版修正改回——這條規則本身沒問題,
  // 真正缺的是戰鬥結束後也要回滿,見設計文件 9.8)。
  s.mp = mpMax;
  // 蓄力連攜生效轉移(3.14 版新增):這回合累積的 pending 蓄力額度,轉為下一整個玩家回合的 active
  // 加成;若這回合沒打蓄力符寶則兩者皆為 0,對一般戰鬥完全沒有影響。
  s.combat.activeChargeBuffPct = s.combat.pendingChargeBuffPct ?? 0;
  s.combat.pendingChargeBuffPct = 0;
  // 符寶袋回合制(3.4 版):手中剩牌一併棄置,重新抽 HAND_SIZE 張補滿手牌(牌堆不夠會自動洗回棄牌堆)
  const redrawn = redrawHand(s.combat);
  s.combat.hand = redrawn.drawn;
  s.combat.deck = redrawn.deck;
  s.combat.discard = redrawn.discard;
  rollDaozuTurn(s);

  return {};
}

// ═══ 5.4 版:派系 ═══
// 煞氣傷害懲罰:每點 −0.01%,九幽修羅減半
function shaqiPenaltyMult(s: SaveData): number {
  const pen = (s.shaqi ?? 0) / 10000;
  return Math.max(0, 1 - pen * (s.faction === "jiuyou" ? JIUYOU_SHAQI_PENALTY_MULT : 1));
}
function combatZoneOf(locationId: string): string | undefined {
  const loc = LOCATIONS.find((l) => l.id === locationId);
  return loc ? zoneOfLocation(loc)?.id : undefined;
}
// 敵對派系領地:狩獵/採集時機率遭派系巡守截殺(敵對 12%、死敵 20%)
function maybeFactionAmbush(s: SaveData, loc: Location): ActionResult | null {
  const owner = ownerOfZone(zoneOfLocation(loc)?.id ?? "");
  if (!owner || !s.faction) return null;
  const chance = AMBUSH_CHANCE[relationOf(s.faction, owner.id)] ?? 0;
  if (!(chance > 0) || Math.random() >= chance) return null;
  const guard = monsterById(owner.guardId);
  s.combat = {
    monsterId: guard.id,
    monsterHp: monsterHpOf(guard),
    locationId: loc.id,
    factionGuard: true,
    ...startingCombatHand(s),
    monsterStatus: [],
    playerStatus: [],
  };
  if (!s.seen.includes(guard.id)) s.seen.push(guard.id);
  log(s, `你身為${factionById(s.faction)!.name}門人擅入${owner.name}領地——【${guard.name}】自暗處殺出!(${guard.element}屬性)`);
  return { save: s };
}
// 中立領地的過路費:該地域一般妖獸平均靈石 × TOLL_KILLS(本派、敵對、無主地域不收)
export function tollOf(s: Pick<SaveData, "faction">, zoneId: string): number {
  const owner = ownerOfZone(zoneId);
  if (!owner || !s.faction || relationOf(s.faction, owner.id) !== "neutral") return 0;
  const normals = locationsOfZone(zoneId)
    .flatMap((l) => l.monsters)
    .map(monsterById)
    .filter((m) => !m.isLord && !m.elite);
  if (!normals.length) return 0;
  const avg = normals.reduce((a, m) => a + (m.stones[0] + m.stones[1]) / 2, 0) / normals.length;
  return Math.floor(avg * TOLL_KILLS);
}

// ═══ 5.2/5.3 版:依妖獸所屬界統一追加的掉落(不必逐隻改 world.ts;圖鑑也用同一份顯示)═══
export function worldTierOfMonster(id: string): WorldTier | null {
  const key = MONSTER_TIER.get(id);
  if (!key) return null;
  if (key.startsWith("x-")) return "xianjie";
  return tierOfStage(Number(key));
}
// 五行基礎材料:依自身五行、品級依所在界;一般 20% ×1、菁英 60% ×2、地域王必掉 ×3
export function elementDropOf(mon: Monster): { id: string; n: number; chance: number } | null {
  const tier = worldTierOfMonster(mon.id);
  if (!tier || mon.id === "tianjie_shenling" || mon.id === "huanxiang_taisui") return null;
  const rule = mon.isLord ? ELEMENT_DROP.lord : mon.elite ? ELEMENT_DROP.elite : ELEMENT_DROP.normal;
  return { id: elementMaterialFor(tier, mon.element, Math.random()), n: rule.n, chance: rule.chance };
}
// 破界珠:靈界地域王 2%、靈界菁英 0.5%、仙界妖獸 0.3%;逆星盤:北寒/金源地域王 1%;
// 碧眼雷鵬:靈界地域王 1%;鯤鵬坐騎:金源仙帝 1%
export function geoDropsOf(mon: Pick<Monster, "id" | "isLord" | "elite">): { id: string; chance: number }[] {
  const tier = worldTierOfMonster(mon.id);
  if (!tier || mon.id === "tianjie_shenling" || mon.id === "huanxiang_taisui") return [];
  const out: { id: string; chance: number }[] = [];
  if (tier === "lingjie" && mon.isLord) out.push({ id: "pojie_zhu", chance: 0.02 }, { id: "biyan_leipeng", chance: 0.01 });
  else if (tier === "lingjie" && mon.elite) out.push({ id: "pojie_zhu", chance: 0.005 });
  else if (tier === "xianjie") out.push({ id: "pojie_zhu", chance: 0.003 });
  if (mon.id === "lord_beihan" || mon.id === "lord_jinyuan") out.push({ id: "nixing_pan", chance: 0.01 });
  if (mon.id === "lord_jinyuan") out.push({ id: "kunpeng_zuoqi", chance: 0.01 });
  return out;
}

function winCombat(s: SaveData): Modal {
  const mon = monsterById(s.combat!.monsterId);
  const { stoneMult, mpMax, realm } = statsOf(s);
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

  // 真魔之門守關戰(5.0 版):擊敗冥翎天魔古龍,消耗真魔門令、開啟真魔界,其餘獎勵照一般擊殺結算
  const gateLines: string[] = [];
  // 門令須在勝利當下仍在身上才算數:戰鬥中把門令掛上市集賣掉,打贏也不會開門
  if (s.combat!.zhenmoGate && !s.zhenmoUnlocked && take(s, "zhenmo_menling")) {
    s.zhenmoUnlocked = true;
    gateLines.push("冥翎天魔古龍轟然墜地,漆黑魔門應聲洞開——【真魔界】自此為你敞開!");
    log(s, "你斬落冥翎天魔古龍,真魔之門洞開,新地圖【真魔界】解鎖!");
  }

  // 靈石橫財:10% 機率雙倍靈石
  let stones = Math.floor(rand(mon.stones[0], mon.stones[1]) * stoneMult);
  const windfall = Math.random() < 0.1;
  if (windfall) stones *= 2;
  const dropNames: string[] = [];
  const dropIds: string[] = [];
  // 5.2/5.3 版:五行基礎材料與跨界道具、異獸坐騎等依階層統一追加的掉落(見 geoDropsOf / elementDropOf)
  const el = elementDropOf(mon);
  if (el && Math.random() < el.chance) {
    give(s, el.id, el.n);
    dropNames.push(`${itemById(el.id).name}${el.n > 1 ? ` ×${el.n}` : ""}`);
    for (let i = 0; i < el.n; i++) dropIds.push(el.id);
  }
  // 5.4 版:蠻荒/九幽/真魔成員在本派領地掉落率 +20%;本派領地擊殺 +1 功勳、擊殺巡守 +30 功勳
  const combatZone = combatZoneOf(s.combat!.locationId);
  const homeHere = !!s.faction && ownerOfZone(combatZone ?? "")?.id === s.faction;
  const dropMult = homeHere && ["manhuang", "jiuyou", "zhenmo"].includes(s.faction!) ? HOME_DROP_MULT : 1;
  const meritGain = (s.combat!.factionGuard ? MERIT_GUARD_KILL : 0) + (homeHere ? MERIT_HOME_KILL : 0);
  if (meritGain > 0) {
    s.merit = (s.merit ?? 0) + meritGain;
    dropNames.push(`功勳 +${meritGain}`);
  }
  if (s.faction === "zhenmo") {
    const { hpMax } = statsOf(s);
    s.hp = Math.min(hpMax, s.hp + Math.floor(hpMax * ZHENMO_KILL_HEAL_PCT));
  }
  for (const d of [...mon.drops, ...geoDropsOf(mon)]) {
    if (Math.random() < d.chance * dropMult) {
      give(s, d.id);
      dropNames.push(itemById(d.id).name);
      dropIds.push(d.id);
    }
  }
  const expGain = monsterExpOf(mon);
  s.exp += expGain;
  s.stones += stones;
  s.kills[mon.id] = (s.kills[mon.id] ?? 0) + 1;
  // 煞氣累積(3.19 版新增):真仙以上每擊殺一隻怪物 +1,上限 10000
  if (realm.stage >= 10) s.shaqi = Math.min(10000, (s.shaqi ?? 0) + 1);
  const isLord = mon.isLord;
  // 滕符掉落(4.2 版):依戰鬥所在秘境的滕符池判定,地域王機率較高
  const tengfuPool = TENGFU_DROPS[s.combat!.locationId] ?? [];
  const tengfuIds: string[] = [];
  const tfChance = isLord ? TENGFU_DROP_CHANCE_LORD : mon.elite ? TENGFU_DROP_CHANCE_ELITE : TENGFU_DROP_CHANCE;
  if (tengfuPool.length && Math.random() < tfChance) {
    const id = tengfuPool[rand(0, tengfuPool.length - 1)];
    s.tengfuBag[id] = (s.tengfuBag[id] ?? 0) + 1;
    tengfuIds.push(id);
    dropNames.push(`滕符·${tengfuById(id)!.name}`);
  }
  s.combat = null;
  log(
    s,
    `${isLord ? "歷經苦戰,你竟斬殺了地域之王 " : mon.elite ? "一番惡戰,你終於斬落菁英 " : "你擊殺了 "}${mon.name}!獲得修為 ${expGain}、靈石 ${stones}${windfall ? "(靈石橫財,雙倍!)" : ""}${dropNames.length ? ",拾得:" + dropNames.join("、") : ""}。`,
  );
  return {
    title: gateLines.length ? "真 魔 之 門 · 洞 開" : isLord ? "地 域 王 授 首" : mon.elite ? "菁 英 伏 誅" : "戰 利 品",
    success: true,
    rewards: { exp: expGain, stones, items: dropIds, tengfu: tengfuIds },
    lines: [
      ...gateLines,
      `${isLord ? "斬殺地域王" : mon.elite ? "斬落菁英" : "擊殺"}【${mon.name}】`,
      ...(expGain > 0 ? [`修為 +${expGain}`] : []),
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
    case "mount":
      s.equippedMount = item.id;
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
        : kind === "mount"
          ? "收為坐騎,往後遠行快上許多"
        : kind === "pet"
          ? "收為靈寵,伴隨左右"
          : "穿戴護身";

// 探索秘境(雲遊際遇,紫色):秘笈 / 靈石 / 法術 / 裝備 / 靈寵,並有機會解鎖金源仙域
function exploreSecretRealm(s: SaveData): ActionResult {
  const realm = REALMS[s.realmIdx];
  const lines: string[] = ["雲遊途中,你踏入一處與世隔絕的上古【秘境】——"];
  const roll = Math.random();

  // 5.4 版:身在蠻荒異界雲遊時 8% 尋得輪迴界入口(尚未開通者;獨立骰,不影響下方既有機率序列)
  if (realm.stage >= 10 && currentZoneOf(s) === "manhuang" && !zoneUnlocked(s, zoneById("lunhui")!) && Math.random() < 0.08) {
    s.lunhuiUnlocked = true;
    lines.push(
      "秘境深處傳來忘川水聲——一道幽暗古門在你面前緩緩開啟,【輪迴界】的入口自此為你顯現!",
      "輪迴界與蠻荒異界相連,是輪迴殿的領地,慎入。",
    );
    log(s, "你於蠻荒秘境深處尋得通往【輪迴界】的古門,新地圖解鎖!");
    return { save: s, loot: { title: "秘 境 · 輪 迴 古 門", success: true, lines } };
  }

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

  // 8% 解鎖真魔界(3.19 版新增,僅真仙,且尚未解鎖;獨立骰,不影響下方既有機率序列)
  // 5.0 版:尋得魔門後不再直接解鎖,改得「真魔門令」,須擊敗守門的冥翎天魔古龍才開啟真魔界。
  // 已持有門令或已開啟真魔界者仍會持續遇到,多的門令可於玩家市集轉賣
  if (realm.stage >= 10 && Math.random() < 0.08) {
    give(s, "zhenmo_menling");
    const zhenmoLines = [
      "雲遊途中,你踏入一處與世隔絕的上古【秘境】——",
      "秘境盡頭,一道漆黑魔門矗立虛空,門前盤踞著一頭羽翼遮天的上古魔龍——【冥翎天魔古龍】!",
      "你拾得魔門前的【真魔門令】。於儲物袋中動用此令,擊敗古龍方能踏入真魔界。",
    ];
    log(s, "你於秘境深處尋得真魔之門,拾得【真魔門令】——守門的冥翎天魔古龍虎視眈眈!");
    return { save: s, loot: { title: "秘 境 · 真 魔 之 門", success: true, lines: zhenmoLines } };
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
// 向後相容(4.2 版抽出為獨立函式):補齊舊存檔缺少的欄位、遷移舊格式。每次行動前執行,
// /api/save 讀檔時也會先跑一次——線上存檔可能來自更舊的版本(例如 2.x 沒有符寶袋/手牌/滕符陣),
// 讀檔當下就補齊,前端第一次渲染看到的就是完整格式,不必等玩家做出第一個行動。
export function normalizeSave(s: SaveData): void {
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
  if (s.equippedMount === undefined) s.equippedMount = null;
  if (!s.craftPity || typeof s.craftPity !== "object") s.craftPity = {};
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
  if (!s.tengfuBag || typeof s.tengfuBag !== "object") s.tengfuBag = {};
  // 4.2 版:舊存檔的符寶袋若基礎卡片不足 BASIC_CARD_MIN 張,自動補足
  if (s.pouch && s.pouch.length > 0) s.pouch = withBasicMinimum(s.pouch);
  if (!Array.isArray(s.tengfuGrid)) s.tengfuGrid = [];
  // 3.19 版:舊存檔沒有這幾個新欄位,補上預設值
  if (typeof s.zhenmoUnlocked !== "boolean") s.zhenmoUnlocked = false;
  if (typeof s.huixianUnlocked !== "boolean") s.huixianUnlocked = false;
  if (typeof s.tongtianUnlocked !== "boolean") s.tongtianUnlocked = false;
  if (typeof s.shaqi !== "number") s.shaqi = 0;
  // 3.16 版:符寶袋回溯修正,只執行一次(見 trimPouchToOwnership 註解)
  if (!s.pouchTrimmed) {
    trimPouchToOwnership(s);
    s.pouchTrimmed = true;
  }
  // 5.2 版:移除已無作用的補法力丹藥/仙草,持有者依原售價六成折回靈石(見 RETIRED_ITEMS)
  for (const [id, { name, price }] of Object.entries(RETIRED_ITEMS)) {
    if (!(id in s.inventory)) continue;
    const n = Math.max(0, s.inventory[id] ?? 0);
    delete s.inventory[id];
    if (n <= 0) continue;
    const refund = Math.floor(price * 0.6) * n;
    s.stones += refund;
    log(s, `【${name}】補充法力之效已無用武之地,${n} 份折回靈石 ${refund}。`);
  }
  // 5.2 版:現在位置(舊存檔依境界補上,並結算移動抵達與下界時限)
  settleLocation(s, Date.now());
  // 5.4 版:仙界玩家尚未擇定派系(舊存檔、或飛昇時未選)一律補上待選旗標
  if (typeof s.merit !== "number") s.merit = 0;
  if (typeof s.lunhuiUnlocked !== "boolean") s.lunhuiUnlocked = false;
  if (!s.faction && REALMS[s.realmIdx].stage >= XIAN_STAGE) s.factionPending = true;
  if (s.faction && s.factionPending) s.factionPending = false;
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
}

// ═══ 煉器結果(即時煉製與 5.4 版開爐出爐共用)═══
export const forgeDurationText = (minutes: number) =>
  minutes % 60 === 0 ? `${minutes / 60} 小時` : minutes > 60 ? `${Math.floor(minutes / 60)} 小時 ${minutes % 60} 分` : `${minutes} 分鐘`;

// 失敗:同一配方連續失敗累積保底,下次失敗率 −5%(材料的扣除由呼叫端處理)
function craftFailed(s: SaveData, rec: Recipe, lifeCost = 0): ActionResult {
  const result0 = itemById(rec.result);
  const pity = s.craftPity?.[rec.id] ?? 0;
  s.craftPity = { ...(s.craftPity ?? {}), [rec.id]: pity + 1 };
  const nextFail = Math.round(failChanceFinal(craftCostOf(rec).baseFail, pity + 1, statsOf(s).breakBonus) * 100);
  log(
    s,
    result0.kind === "pill"
      ? `丹爐中藥香驟散,一爐靈液化作焦炭——煉製【${rec.name}】失敗!`
      : `爐火驟然失控,轟然一聲炸響——煉製【${rec.name}】失敗!`,
  );
  return {
    save: s,
    loot: {
      title: "煉 製 失 敗",
      success: false,
      lines: [
        `煉製【${rec.name}】失敗`,
        `靈石與所有材料已全數損失${lifeCost > 0 ? ",壽元照耗" : ""}。`,
        `${result0.kind === "pill" ? "煉丹" : "煉器"}心得 +1:下次煉製此物失敗率降為 ${nextFail}%。`,
      ],
    },
  };
}

function craftSucceeded(s: SaveData, rec: Recipe, lifeCost = 0): ActionResult {
  if (s.craftPity?.[rec.id]) {
    const { [rec.id]: _done, ...rest } = s.craftPity;
    s.craftPity = rest;
  }
  const result = itemById(rec.result);
  // 丹藥/仙物類產出效果不隨品質浮動(exp/heal/mp 等非 atkBonus/defBonus/speedBonus,浮動無意義),
  // 直接原樣給予;裝備類維持既有的 ±30% 屬性浮動機制。坐騎只有移動倍率,同樣不浮動。
  const isPillLike = result.kind === "pill" || result.kind === "special" || result.kind === "mount";
  const rolledId = isPillLike ? rec.result : `${rec.result}@${rand(70, 130)}`;
  give(s, rolledId);
  const rolled = itemById(rolledId);
  const lifeNote = lifeCost > 0 ? `(耗壽元 ${lifeCost} 年)` : "";
  log(s, `爐火純青,三日三夜——你成功煉製出【${rolled.name}】!${lifeNote}`);
  return {
    save: s,
    loot: {
      title: result.kind === "pill" ? "煉 丹 大 成" : "煉 器 大 成",
      success: true,
      lines: [`【${rolled.name}】出爐!`, rolled.desc],
    },
  };
}

// 玄天仙器煉成:隨機一種,屬性浮動 100%~300%
function xuantianSucceeded(s: SaveData): ActionResult {
  const pool = Array.from(XUANTIAN_ARTIFACT_IDS);
  const picked = pool[rand(0, pool.length - 1)];
  const quality = rand(100, 300);
  const rolledId = `${picked}@${quality}`;
  give(s, rolledId);
  const rolled = itemById(rolledId);
  log(s, `玄天殘片與太乙精魂同淬爐火,天地紫氣暴湧——煉成【${rolled.name}】!`);
  return {
    save: s,
    loot: { title: "玄 天 仙 器 · 煉 成", success: true, lines: [`煉成【${rolled.name}】`, rolled.desc] },
  };
}

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
  normalizeSave(s);

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
      type === "breakthrough" ||
      type === "travel" ||
      type === "descend" ||
      type === "returnUp")
  ) {
    return { save: s, error: "你正於宗門仙境中閉關潛修,無法分心他顧,須先離開仙境方可行動。" };
  }

  // 5.4 版:仙界玩家擇定派系之前,無法離開飛昇台(狩獵、採集、移動、雲遊、下界、登塔)
  if (
    s.factionPending &&
    ["hunt", "gather", "travel", "wander", "descend", "challengeFutu", "rift", "recall"].includes(type)
  ) {
    return { save: s, error: "仙界五大派系的使者正等你答覆——請先擇定派系。" };
  }

  switch (type) {
    case "cultivate": {
      if (s.combat) return { save: s, error: "激戰之中,無法打坐。" };
      s.energy -= energyCost;
      const { realm, sect, mpMax, hpMax } = statsOf(s);
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
      // 5.0 版:真仙以上打坐不再增長修為(只療傷、推進修習),修為唯有斬妖獲得,讓修為榜可以比較
      const xianNoExp = realm.stage >= XIAN_STAGE;
      const base = realm.expNeed * (0.04 + Math.random() * 0.03);
      const gain = xianNoExp ? 0 : Math.max(1, Math.floor(base * (1 + (sect?.bonus.exp ?? 0) / 100)));
      s.exp += gain;
      s.mp = Math.min(mpMax, s.mp + Math.floor(mpMax * 0.25));
      // 4.2 版:調息併入打坐——打坐同時運轉周天療傷,氣血回滿(原「調息」行動保留於引擎供相容,介面已移除)
      const healed = hpMax - s.hp;
      s.hp = hpMax;
      s.cultToday += 1;
      const lines = [
        xianNoExp
          ? `你盤膝打坐,吐納仙靈${healed > 0 ? `,周天運轉間傷勢盡復(氣血 +${healed})` : ""}(耗壽元 ${cost} 年,現 ${s.age}/${cap})。仙軀已成,修為唯有斬妖方能精進。`
          : `你盤膝打坐,吐納靈氣,修為 +${gain}${healed > 0 ? `,周天運轉間傷勢盡復(氣血 +${healed})` : ""}(耗壽元 ${cost} 年,現 ${s.age}/${cap})。`,
      ];
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
      if (s.location?.travel) return { save: s, error: "你正在趕路途中,無法分心雲遊。" };
      if (s.location?.visit) return { save: s, error: "身處下界,受界面之力牽制,無法雲遊四海。" };
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
          monsterHp: monsterHpOf(boss),
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
      if (s.location?.visit) return { save: s, error: "身處下界,受界面之力壓制,無法突破。" };
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
          monsterHp: monsterHpOf(tianjie),
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
        breakResult.lines.push(...ascendRealmIfNeeded(s, realm.stage, next.stage));
        log(s, ...breakResult.lines);
        return { save: s, breakResult };
      }
      // 失敗:修為直接歸零,道基折損最大壽元 15%
      // 4.2 版新手護體:練氣期(前三次小境界突破)失敗只散去一半修為、不折損壽元,避免新手一失手就被勸退
      if (s.realmIdx < NOVICE_GUARD_REALMS) {
        const lostHalf = Math.ceil(s.exp / 2);
        s.exp -= lostHalf;
        const lines = [
          `靈氣暴走,經脈一震!所幸根基尚淺、師門護體符護住心脈——修為散去一半(損失 ${lostHalf}),壽元無損。`,
          "新手護體僅限練氣期,築基之後突破失敗將修為盡散、折損壽元,務必謹慎。",
        ];
        log(s, ...lines);
        return { save: s, breakResult: { success: false, title: "突 破 失 敗", lines } };
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
      return { save: s, breakResult: { success: false, title: "突 破 失 敗", lines } };
    }

    case "gather": {
      if (s.combat) return { save: s, error: "激戰之中!" };
      const loc = LOCATIONS.find((l) => l.id === payload.locationId);
      if (!loc) return { save: s, error: "無此秘境" };
      if (!regionUnlocked(s, loc.region)) return { save: s, error: "此地尚未開啟" };
      const locErr = locationActionError(s, loc);
      if (locErr) return { save: s, error: locErr };
      const { realm } = statsOf(s);
      if (!canEnterStage(realm.stage, loc.reqStage)) {
        log(s, `${loc.name} 兇險異常,以你現在的境界踏入必死無疑。`);
        return { save: s };
      }
      s.energy -= energyCost;
      const ambush = maybeFactionAmbush(s, loc);
      if (ambush) return ambush;
      if (Math.random() < 0.35 && loc.monsters.length) {
        const mid = loc.monsters[rand(0, loc.monsters.length - 1)];
        const mon = monsterById(mid);
        s.combat = {
          monsterId: mid,
          monsterHp: monsterHpOf(mon),
          locationId: loc.id,
          ...startingCombatHand(s),
          monsterStatus: [],
          playerStatus: [],
        };
        if (!s.seen.includes(mid)) s.seen.push(mid);
        log(s, `你在 ${loc.name} 採集時,${mon.name} 突然襲來!`);
        return { save: s };
      }
      // 洗煞池(3.19 版新增):真魔界採集時,一定機率不掉材料、改觸發洗煞池,將煞氣直接歸零
      const xishaChance = 0.08 * (s.faction === "zhenmo" ? ZHENMO_XISHA_MULT : 1);
      if (loc.region === "zhenmo" && (s.shaqi ?? 0) > 0 && Math.random() < xishaChance) {
        s.shaqi = 0;
        log(s, `你在 ${loc.name} 採集時,腳下靈光一閃——竟是一池上古【洗煞池】!煞氣瞬間滌淨無存。`);
        return {
          save: s,
          loot: { title: "洗 煞 池", success: true, lines: [`於【${loc.name}】意外尋得洗煞池`, "煞氣已完全清空。"] },
        };
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
      if (!regionUnlocked(s, loc.region)) return { save: s, error: "此地尚未開啟" };
      const locErr = locationActionError(s, loc);
      if (locErr) return { save: s, error: locErr };
      const { realm } = statsOf(s);
      if (!canEnterStage(realm.stage, loc.reqStage)) {
        log(s, `${loc.name} 兇險異常,以你現在的境界踏入必死無疑。`);
        return { save: s };
      }
      s.energy -= energyCost;
      const ambush = maybeFactionAmbush(s, loc);
      if (ambush) return ambush;
      // 機率遭遇地域王(妖獸領主);秘境專屬地域王(如蠻荒異界四領地)優先於區域統一地域王
      const region = REGIONS.find((r) => r.id === loc.region);
      const lordId = loc.lordId ?? region?.lordId;
      const [lcMin, lcMax] = region?.lordChance ?? [0.02, 0.03];
      const lordChance = lcMin + Math.random() * (lcMax - lcMin);
      if (lordId && Math.random() < lordChance) {
        const lord = monsterById(lordId);
        s.combat = {
          monsterId: lord.id,
          monsterHp: monsterHpOf(lord),
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
          `天地驟然一暗——${loc.name} 的地域之王【${lord.name}】現身了!(${lord.element}屬性)絕世凶威,撲面而來!`,
        );
        return { save: s };
      }
      // 4.2 版:大乘期秘境的菁英小 BOSS
      const eliteId = ELITE_SPAWNS[loc.id];
      if (eliteId && Math.random() < ELITE_SPAWN_CHANCE) {
        const elite = monsterById(eliteId);
        s.combat = {
          monsterId: elite.id,
          monsterHp: monsterHpOf(elite),
          locationId: loc.id,
          ...startingCombatHand(s),
          monsterStatus: [],
          playerStatus: [],
        };
        if (!s.seen.includes(elite.id)) s.seen.push(elite.id);
        log(s, `一股兇煞之氣撲面而來——${loc.name} 的菁英【${elite.name}】擋住了去路!(${elite.element}屬性)`);
        return { save: s };
      }
      const mid = loc.monsters[rand(0, loc.monsters.length - 1)];
      const mon = monsterById(mid);
      s.combat = {
        monsterId: mid,
        monsterHp: monsterHpOf(mon),
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
          ? `你踏入 ${loc.name},仙威如淵——【${mon.name}】(${mon.element}屬性)橫亙眼前!`
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
      const techIds = Array.isArray(payload.techIds) ? payload.techIds.map(String) : [];
      if (techIds.length === 0) return { save: s, error: "尚未選取任何符寶" };
      // 封法只攔仙法;法器仍須通過下方的手牌、單獨出牌與法力檢查。
      if (isSpellSealed(s.combat) && techIds.some((id) => id !== "artifact_attack")) {
        return {
          save: s,
          error: s.combat.spellSealed
            ? "時光禁錮之下,法力凝滯不動,這一回合唯有以法器相搏!"
            : "黑眼貔貅雙目幽光暴閃,將你的法力波動盡數封鎖,此戰唯有以法器相搏!",
        };
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
      // 清心是冰封的解控例外,整批仍須持有有效手牌且付得起總法力。
      const doesCleanse = techs.some((t) => t.selfCleanse);
      if (hasStatus(s.combat.playerStatus, "freeze") && !doesCleanse) {
        log(s, "你深陷冰封,動彈不得,這一擊落空!");
        const { loot } = postPlayerTurn(s);
        if (loot) return { save: s, loot };
        return { save: s };
      }
      const totalCost = techs.reduce((sum, t) => sum + t.mpCost, 0);
      if (s.mp < totalCost) {
        return { save: s, error: `法力不足,這次出牌共需 ${totalCost} 點法力` };
      }

      const mon = monsterById(s.combat.monsterId);
      const { atk, weaponEl, hpMax } = statsOf(s);
      const sectMult = Number(payload.sectDamageMult ?? 1);
      const weaken = atkMultFromStatus(s.combat.playerStatus);
      const buff = s.combat.pendingElementBuff;
      // 法器攻擊的屬性依裝備法器動態決定,不用資料表裡的佔位「無」屬性
      const effEl = (t: Technique) => (t.id === "artifact_attack" ? weaponEl : t.element) ?? t.element;
      // 雙/三屬性符寶(3.14 版新增):除主屬性外,extraElements 列出的屬性一併視為這張符寶的屬性
      const elemsOf = (t: Technique): Element[] => [effEl(t), ...(t.extraElements ?? [])];
      const tengfuEl = tengfuBonusOf(s.tengfuGrid);

      // 同批次同元素張數(含自己),供 synergyPct 使用;不同元素種類數(不分張數),供 crossElementPct 使用。
      // 雙/三屬性符寶每個屬性都各自計入一次,讓其他符寶的同屬疊加/混屬加成也把它算進去。
      const elementCounts = new Map<Element, number>();
      for (const t of techs) for (const el of elemsOf(t)) elementCounts.set(el, (elementCounts.get(el) ?? 0) + 1);
      const distinctElementCount = elementCounts.size;

      let rawPower = 0;
      // 戰報/浮動數字顯示用:批次內「偏離中性(×1)最多」的相剋倍率——不能單純取 Math.max(初始值 1, mult),
      // 那樣會讓「整批全被剋制、沒有任何一張克制或中性」的情況因為 max(1, 0.75)=1 而被吃掉,導致
      // 「屬性被剋,威力受阻」的提示永遠不會出現(3.15 版修正,寫傷害事件的 advantage 標示時發現)。
      let bestElementMult = 1;
      // 煞氣傷害懲罰(3.19 版新增):真仙以上才會累積 shaqi(其餘角色恆為 0,以下恆為 1 倍,無影響)。
      // 每點 -0.01% 傷害,滿 10000 時 0 倍;煞屬性符寶反其道而行,見下方逐張判斷。
      const shaqi = s.shaqi ?? 0;
      const shaqiDmgMult = shaqiPenaltyMult(s);
      for (const t of techs) {
        const level = techLevelOf(s, t.id);
        let p = t.power * techPowerMult(level);
        if (t.synergyPct) p *= 1 + t.synergyPct * Math.min(SYNERGY_STACK_CAP, elementCounts.get(effEl(t)) ?? 1);
        // 進階連攜(3.13 版新增):批次張數越多疊得越高;批次含越多「不同」元素疊得越高——兩者
        // 鼓勵的出牌習慣正好相反(前者鼓勵同名堆疊,後者鼓勵混搭),各自看符寶本身掛哪一種
        // (4.0 版:張數加成封頂 COMBO_SIZE_STACK_CAP,理由見該常數說明)
        if (t.comboSizePct) p *= 1 + t.comboSizePct * Math.min(COMBO_SIZE_STACK_CAP, techs.length - 1);
        if (t.crossElementPct) p *= 1 + t.crossElementPct * (distinctElementCount - 1);
        if (buff && buff.element === effEl(t)) p *= 1 + buff.pct;
        // 滕符陣屬性加成(4.2 版):多屬性符寶取加成最高的屬性,再加上全屬性加成
        const tfEl = Math.max(...elemsOf(t).map((el) => tengfuEl.el[el] ?? 0)) + tengfuEl.allEl;
        if (tfEl > 0) p *= 1 + tfEl;
        // 雙/三屬性符寶(3.14 版新增):相剋倍率取所有屬性中最高者,天生百搭、不怕撞上被剋的屬性
        const mult = Math.max(...elemsOf(t).map((el) => elementMult(el, mon.element, mon.ignoresCounters)));
        if (Math.abs(mult - 1) > Math.abs(bestElementMult - 1)) bestElementMult = mult;
        p *= mult;
        // 蓄力連攜(3.14 版新增):上一回合若蓄力過,這整回合的傷害額外提升 activeChargeBuffPct
        if (s.combat.activeChargeBuffPct) p *= 1 + s.combat.activeChargeBuffPct;
        // 煞屬性符寶(3.19 版新增):不受煞氣傷害懲罰,反而依煞氣額外提升傷害;其餘符寶正常吃懲罰
        if (t.element === "煞" && t.shaqiScalePct) p *= 1 + (shaqi / 10000) * t.shaqiScalePct;
        else p *= shaqiDmgMult;
        // 九幽修羅(5.4 版):煞屬性符寶傷害 +20%
        if (t.element === "煞" && s.faction === "jiuyou") p *= 1 + JIUYOU_SHA_CARD_PCT;
        rawPower += p;
      }
      // 延續加成用掉即消耗,不論這次批次是否真的命中同元素都算用過一次機會
      if (buff) s.combat.pendingElementBuff = undefined;

      // 浮動傷害數字的顯示屬性/加成標示(供前端上色與「克制!/抵抗」標示用):單張出牌就用那張的
      // 屬性;多張混打時,若全部同屬性仍可標色,否則屬性不明確,前端退回預設色,但加成標示(取批次
      // 內最高相剋倍率)不受影響,一樣照樣顯示。
      const displayElement: Element | undefined =
        techs.length === 1 ? effEl(techs[0]) : techs.every((t) => effEl(t) === effEl(techs[0])) ? effEl(techs[0]) : undefined;
      const displayAdvantage: DamageEvent["advantage"] | undefined =
        bestElementMult > 1 ? "super" : bestElementMult < 1 ? "resist" : undefined;

      s.mp -= totalCost;
      // 法力回復符寶(3.13 版新增):打出後立即回復法力,可能部分/全額抵銷這次出牌的花費
      const manaGainSum = techs.reduce((sum, t) => sum + (t.manaGain ?? 0), 0);
      if (manaGainSum > 0) s.mp += manaGainSum;
      s.combat.hand = remainingHand;
      s.combat.discard = [...(s.combat.discard ?? []), ...techIds];

      // 打出後,若批次中有帶 nextPlayBuffPct 的符寶,登記給下一次出牌用(多張只取加成最高者)
      const buffGivers = techs.filter((t) => t.nextPlayBuffPct);
      if (buffGivers.length > 0) {
        const strongest = buffGivers.reduce((a, b) => (b.nextPlayBuffPct! > a.nextPlayBuffPct! ? b : a));
        s.combat.pendingElementBuff = { element: effEl(strongest), pct: strongest.nextPlayBuffPct! };
      }

      // 護盾符寶(3.13 版新增):打出後立即獲得護盾,沿用戰術卡護體法箓的機制(優先抵擋接下來的直接傷害)
      const shieldGain = techs.reduce((sum, t) => sum + (t.shieldPct ? Math.floor(hpMax * t.shieldPct) : 0), 0);
      if (shieldGain > 0) {
        s.combat.playerShield = (s.combat.playerShield ?? 0) + shieldGain;
      }
      // 蓄力符寶(3.14 版新增):登記到 pending,回合結束時整批轉為下一整個玩家回合的 active 加成
      const chargeGain = techs.reduce((sum, t) => sum + (t.chargeNextTurnPct ?? 0), 0);
      if (chargeGain > 0) {
        s.combat.pendingChargeBuffPct = (s.combat.pendingChargeBuffPct ?? 0) + chargeGain;
      }
      // 縹緲符寶(3.14 版新增):打出後為玩家附加一次保證避過怪物下次攻擊的效果
      const grantsEvade = techs.some((t) => t.selfStatus === "evade");
      if (grantsEvade) {
        s.combat.playerStatus = applyStatus(s.combat.playerStatus, "evade", 1);
      }
      // 清心符寶(3.14 版新增):立即清除玩家身上所有負面狀態(燒傷/中毒/冰封/虛弱),不影響 evade
      if (doesCleanse) {
        s.combat.playerStatus = (s.combat.playerStatus ?? []).filter((e) => e.kind === "evade");
      }

      const names = techs.map((t) => t.name).join("、");
      const extraNotes: string[] = [];
      if (manaGainSum > 0) extraNotes.push(`法力回復 ${manaGainSum} 點`);
      if (shieldGain > 0) extraNotes.push(`凝聚護盾 ${shieldGain} 點`);
      if (chargeGain > 0) extraNotes.push(`蓄力,下回合傷害 +${Math.round(chargeGain * 100)}%`);
      if (grantsEvade) extraNotes.push("身形縹緲,必避過對方下次攻擊");
      if (doesCleanse) extraNotes.push("清除自身負面狀態");
      if (Math.random() < (MONSTER_DODGE_CHANCE[mon.id] ?? 0)) {
        log(s, `你同時施展【${names}】,${mon.name} 身形一晃,竟憑空避過這一擊!` + (extraNotes.length ? `(${extraNotes.join("、")})` : ""));
      } else {
        const taken = daozuDamageTaken(s, Math.max(1, Math.floor(atk * rawPower * sectMult * weaken * (0.9 + Math.random() * 0.2))));
        const dmg = taken.dmg;
        let statusNote = taken.note;
        for (const t of techs) {
          // forceStatus(3.13 版新增):必定命中,不受一般命中機率限制,優先於機率判定
          if (t.forceStatus && dotBlocked(mon.id, t.forceStatus)) {
            statusNote += `,${mon.name} 魔鱗不侵,${STATUS_LABEL[t.forceStatus]}無效!`;
            continue;
          }
          if (t.forceStatus) {
            s.combat.monsterStatus = applyStatus(
              s.combat.monsterStatus,
              t.forceStatus,
              t.forceStatus === "freeze" ? FREEZE_DURATION : STATUS_DURATION,
            );
            statusNote += `,${mon.name} 因此${STATUS_LABEL[t.forceStatus]}!`;
            continue;
          }
          const statusKind = STATUS_BY_ELEMENT[effEl(t)];
          if (statusKind && !dotBlocked(mon.id, statusKind) && Math.random() < STATUS_PROC_CHANCE) {
            s.combat.monsterStatus = applyStatus(
              s.combat.monsterStatus,
              statusKind,
              statusKind === "freeze" ? FREEZE_DURATION : STATUS_DURATION,
            );
            statusNote += `,${mon.name} 因此${STATUS_LABEL[statusKind]}!`;
          }
        }
        // 多段傷害(3.14 版新增):總傷害不變,單獨出牌且掛 hits 時拆成多段個別數字連續命中,
        // 呈現「連續打擊」的觀感(慣例上搭配 soloOnly,批次混打時只會拿批次唯一那張符寶的 hits)
        const soleHits = techs.length === 1 ? Math.max(1, techs[0].hits ?? 1) : 1;
        if (soleHits > 1) {
          let remaining = dmg;
          const per = Math.max(1, Math.floor(dmg / soleHits));
          for (let h = 0; h < soleHits; h++) {
            const thisHit = h === soleHits - 1 ? remaining : Math.min(per, remaining);
            remaining -= thisHit;
            pushDamageEvent("monster", thisHit, displayElement, displayAdvantage);
          }
        } else {
          pushDamageEvent("monster", dmg, displayElement, displayAdvantage);
        }
        log(
          s,
          `你同時施展【${names}】,` +
            (soleHits > 1 ? `連續 ${soleHits} 段擊中` : "對") +
            ` ${mon.name} ,合計造成 ${formatDamage(dmg)}傷害` +
            (bestElementMult > 1 ? "(五行相剋,威力大增!)" : bestElementMult < 1 ? "(屬性被剋,威力受阻)" : "") +
            (sectMult > 1 ? `(宗門聲勢加持 ×${sectMult.toFixed(2)})` : "") +
            statusNote +
            (extraNotes.length ? `(${extraNotes.join("、")})` : "") +
            "。",
        );
        s.combat.monsterHp -= dmg;
        // 吸血符寶(3.14 版新增):依這次造成的傷害的比例回復氣血,不超過氣血上限
        const lifeStealSum = techs.reduce((sum, t) => sum + (t.lifeStealPct ?? 0), 0);
        if (lifeStealSum > 0) {
          const heal = Math.max(0, Math.floor(dmg * lifeStealSum));
          if (heal > 0) {
            s.hp = Math.min(hpMax, s.hp + heal);
            log(s, `【${names}】汲取傷害轉化為生機,你回復 ${heal} 點氣血。`);
          }
        }
      }
      if (s.combat.monsterHp <= 0) {
        const end = resolveMonsterDeath(s);
        if (end) return { save: s, loot: end };
      } else if (mon.id === "daozu_moluo" && Math.random() < MOLUO_COUNTER_CHANCE) {
        // 真魔道祖:每次被出牌擊中都可能反擊(一回合出牌多次就可能被反擊多次)
        const counter = monsterTurn(s, atkMultFromStatus(s.combat.monsterStatus) * MOLUO_COUNTER_FRAC, true);
        if (counter.defeat) return { save: s, loot: counter.defeat };
      }

      // 法力歸零,或批次中含終結技(endsTurn):自動觸發施法結束,不需要玩家再按一次
      if (s.mp <= 0 || techs.some((t) => t.endsTurn)) {
        const { loot } = postPlayerTurn(s);
        if (loot) return { save: s, loot };
      }
      return { save: s };
    }

    case "cast": {
      if (!s.combat) return { save: s, error: "並無戰鬥" };
      const techId = String(payload.techId ?? "");
      if (isCardSealed(s.combat, techId)) {
        return {
          save: s,
          error: s.combat.spellSealed
            ? "時光禁錮之下,法力凝滯不動,這一回合唯有以法器相搏!"
            : "黑眼貔貅雙目幽光暴閃,將你的法力波動盡數封鎖,此戰唯有以法器相搏!",
        };
      }
      if (!s.learned.includes(techId)) return { save: s, error: "未習得此仙法" };
      // 仙法卡牌化:僅本回合手牌內的仙法可施展,不在手牌中一律拒絕(前端只會顯示手牌內的按鈕,此為後端防線)
      if (!(s.combat.hand ?? []).includes(techId)) {
        return { save: s, error: "此仙法本回合未在手牌中,無法施展" };
      }
      const tech = techById(techId);

      // 清心可在冰封中施展;其餘出牌跳過整回合,由共用收尾扣減冰封。
      if (hasStatus(s.combat.playerStatus, "freeze") && !tech.selfCleanse) {
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
      const mult = elementMult(tech.element, mon.element, mon.ignoresCounters);
      const level = techLevelOf(s, techId);
      const lvlMult = techPowerMult(level);
      const sectMult = Number(payload.sectDamageMult ?? 1);
      const weaken = atkMultFromStatus(s.combat.playerStatus);
      s.mp -= tech.mpCost;
      // 打出這張手牌:不論接下來是否被閃避,這張符寶都算「已出手」,從手中移掉這一張(手牌可能有
      // 同名重複符寶,只移掉這張)、送入棄牌堆,回合結束才會整批補回新的一手
      s.combat.hand = removeOneFromHand(s.combat.hand ?? [], techId);
      s.combat.discard = [...(s.combat.discard ?? []), techId];
      if (tech.selfCleanse) {
        s.combat.playerStatus = (s.combat.playerStatus ?? []).filter((e) => e.kind === "evade");
        log(s, `【${tech.name}】清除自身負面狀態。`);
      }
      if (Math.random() < (MONSTER_DODGE_CHANCE[mon.id] ?? 0)) {
        log(s, `你施展【${tech.name}】,${mon.name} 身形一晃,竟憑空避過這一擊!`);
      } else {
        const shaqi = s.shaqi ?? 0;
        const shaqiMult =
          (tech.element === "煞" && tech.shaqiScalePct
            ? 1 + (shaqi / 10000) * tech.shaqiScalePct
            : shaqiPenaltyMult(s)) * (tech.element === "煞" && s.faction === "jiuyou" ? 1 + JIUYOU_SHA_CARD_PCT : 1);
        const taken = daozuDamageTaken(
          s,
          Math.max(1, Math.floor(atk * tech.power * lvlMult * mult * sectMult * weaken * shaqiMult * (0.9 + Math.random() * 0.2))),
        );
        const dmg = taken.dmg;
        let statusNote = taken.note;
        const statusKind = STATUS_BY_ELEMENT[tech.element];
        if (statusKind && !dotBlocked(mon.id, statusKind) && Math.random() < STATUS_PROC_CHANCE) {
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
        pushDamageEvent("monster", dmg, tech.element, mult > 1 ? "super" : mult < 1 ? "resist" : undefined);
      }
      if (s.combat.monsterHp <= 0) {
        const end = resolveMonsterDeath(s);
        if (end) return { save: s, loot: end };
      } else if (mon.id === "daozu_moluo" && Math.random() < MOLUO_COUNTER_CHANCE) {
        const counter = monsterTurn(s, atkMultFromStatus(s.combat.monsterStatus) * MOLUO_COUNTER_FRAC, true);
        if (counter.defeat) return { save: s, loot: counter.defeat };
      }
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

      // 淨化戰術卡可解冰封;其餘戰術卡仍跳過整回合,由共用收尾扣減冰封。
      if (hasStatus(s.combat.playerStatus, "freeze") && !item.cleanse) {
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
        const had = (s.combat.playerStatus ?? []).some((e) => e.kind !== "evade" && e.turns > 0);
        s.combat.playerStatus = (s.combat.playerStatus ?? []).filter((e) => e.kind === "evade");
        lines.push(had ? "自身負面狀態盡數清除!" : "你身上並無負面狀態,此符暫無用武之地。");
      }
      if (item.enemyWeaken) {
        s.combat.monsterStatus = applyStatus(s.combat.monsterStatus, "weaken", WEAKEN_DURATION);
        lines.push(`${mon.name} 氣機紊亂,陷入虛弱!`);
      }
      if (item.forceStatus && dotBlocked(mon.id, item.forceStatus)) {
        lines.push(`${mon.name} 魔鱗不侵,${STATUS_LABEL[item.forceStatus]}無效!`);
      } else if (item.forceStatus) {
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
      if (s.location?.travel || currentZoneOf(s) !== "jinyuan") {
        return { save: s, error: "浮屠塔矗立於金源仙域,須身在金源仙域方能登塔。" };
      }
      const base = monsterById("huanxiang_taisui");
      const floor = s.futuFloor + 1; // 挑戰下一層(從第 1 層起)
      // 5.0 版合併:每層氣血 ×1.4(沿用 3.19)、每層攻擊 ×1.2(沿用 4.2);第 1 層氣血即 world.ts 的數值
      const hpMult = Math.pow(1.4, floor - 1); // 每層氣血 ×1.4
      const atkMult = Math.pow(FUTU_ATK_PER_FLOOR, floor - 1); // 每層攻擊 ×1.2
      const bossHp = Math.floor(base.hp * hpMult);
      // 5.0 版:第 1 層以金源仙域一般妖獸的基準攻擊起算,之後每層 ×1.2(以地域王攻擊起算時只能爬 7~10 層,
      // 太乙境需要登上第 20 層,門檻過高)
      const bossAtk = Math.floor(tierBaseAtkOf("x-jinyuan") * atkMult);
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
        `你踏上浮屠塔第 ${floor} 層——幻象太歲天尊自虛空凝形!(氣血 ${formatHp(bossHp)}、攻擊 ${bossAtk})`,
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

    // 灰仙界(3.19 版新增):再集滿一輪五色異星盤 + 極稀有的灰質破界盤,寫法比照 unlockManhuang
    case "unlockHuixian": {
      if (s.huixianUnlocked) {
        log(s, "灰仙界之門早已為你敞開,無需再度開啟。");
        return { save: s };
      }
      const disks = ["xingpan_jin", "xingpan_mu", "xingpan_shui", "xingpan_huo", "xingpan_tu", "huizhi_pojiepan"];
      if (!disks.every((id) => (s.inventory[id] ?? 0) >= 1)) {
        log(s, "五色異星盤與灰質破界盤尚未集滿,無法開啟灰仙界之門。");
        return { save: s };
      }
      disks.forEach((id) => take(s, id));
      s.huixianUnlocked = true;
      log(s, "五色異星盤與灰質破界盤同時懸空、轟然共鳴——灰仙界之門訇然洞開,死寂之氣撲面而來!");
      return {
        save: s,
        breakResult: {
          success: true,
          title: "灰 仙 界 · 門 開",
          lines: [
            "五色異星盤與灰質破界盤共鳴,虛空裂開一道死寂巨門——",
            "灰仙界自此對你敞開,煞氣瀰漫,妖獸不分五行,非常強大。",
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
        // 已學會此仙法:改為「複製符寶副本」(3.15 版新增),不需要重新花年限修習——再次參悟已熟稔
        // 的秘笈,直接多凝一份可放入符寶袋的副本。基礎卡片(法器攻擊/法術攻擊)不會出現在這裡,
        // 因為它們沒有對應的 manual 道具。
        if (s.learned.includes(item.teaches)) {
          const owned = ownedCopiesOf(s, item.teaches);
          const tech = techById(item.teaches);
          if (owned >= POUCH_MAX_COPIES) {
            log(s, `你已擁有 ${owned} 份【${tech.name}】符寶副本,達符寶袋單卡上限,此篇秘笈對你已無用武之地。`);
            return { save: s };
          }
          take(s, itemId);
          s.techCopies = { ...s.techCopies, [item.teaches]: (s.techCopies?.[item.teaches] ?? 0) + 1 };
          const newOwned = owned + 1;
          log(
            s,
            `你重新參悟【${item.name}】,竟從中提煉出一枚全新的符寶副本!【${tech.name}】現擁有 ${newOwned} 份,符寶袋可多放一張。`,
          );
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

      // 一次性秘境地圖道具(3.19 版新增,廣寒界/鯤鵬遺骸):使用後直接消耗道具、開啟對應一次性
      // 秘境戰鬥,獎勵沿用該怪物自己的 drops[] 掉落表(見 winCombat 的一般擊殺分支),不需要另外
      // 寫一套特判邏輯。
      if (item.kind === "special" && item.mapEncounter) {
        if (s.combat) return { save: s, error: "激戰之中,無法使用。" };
        if (realm.stage < 10) return { save: s, error: "此物玄奧非常,唯真仙以上方能啟用。" };
        const boss = monsterById(item.mapEncounter);
        // 真魔門令:擊敗古龍才消耗(見 winCombat),落敗保留可再戰
        const isZhenmoGate = itemId === "zhenmo_menling";
        if (isZhenmoGate && s.zhenmoUnlocked) {
          log(s, "真魔界之門早已為你敞開,此令已無用處。");
          return { save: s };
        }
        if (!isZhenmoGate) take(s, itemId);
        s.combat = {
          monsterId: boss.id,
          monsterHp: monsterHpOf(boss),
          locationId: `__map_${itemId}__`,
          isLord: true,
          ...(isZhenmoGate ? { zhenmoGate: true } : {}),
          ...startingCombatHand(s),
          monsterStatus: [],
          playerStatus: [],
        };
        log(s, `你動用【${item.name}】,眼前景象驟然扭曲——${boss.name}(${boss.element}屬性)已然現身!`);
        return { save: s };
      }

      // 通天令(3.19 版新增):使用即消耗,永久解鎖通天閣進場資格
      if (item.kind === "special" && itemId === "tongtian_ling") {
        if (s.tongtianUnlocked) {
          log(s, "通天閣之門早已為你敞開,無需再度使用通天令。");
          return { save: s };
        }
        if (realm.stage < 10) return { save: s, error: "此物玄奧非常,唯真仙以上方能啟用。" };
        take(s, itemId);
        s.tongtianUnlocked = true;
        log(s, "你動用【通天令】,一道天光自天際垂落——通天閣之門自此為你敞開!");
        return { save: s };
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

      // 純解狀態的丹藥(5.0 版)只在戰鬥中有意義,戰鬥外服用不消耗
      if (item.cureStatus?.length && !item.heal && !s.combat) {
        return { save: s, error: "此藥用以解除戰鬥中的負面狀態,須於戰鬥中服用。" };
      }
      take(s, itemId);
      const effects: string[] = [];
      if (item.heal) {
        s.hp = Math.min(hpMax, s.hp + item.heal);
        effects.push(`回復氣血 ${item.heal}`);
      }
      if (item.cureStatus?.length && s.combat) {
        const before = s.combat.playerStatus ?? [];
        const cured = before.filter((e) => item.cureStatus!.includes(e.kind as never));
        s.combat.playerStatus = before.filter((e) => !item.cureStatus!.includes(e.kind as never));
        effects.push(cured.length ? `解除${cured.map((e) => STATUS_LABEL[e.kind]).join("、")}` : "身上並無可解除的狀態");
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
      if (item.cureShaqi) {
        s.shaqi = 0;
        effects.push("清除全部煞氣");
      }
      log(s, `你服下 ${item.name},${effects.join(",")}。`);
      return { save: s };
    }

    // ═══ 5.2 版:移動(見 world-travel-design.md 第三節)═══
    // 前端倒數結束時呼叫,僅觸發 normalizeSave 裡的移動結算
    case "syncLocation":
      return { save: s };

    // 同一界內移動:mode "fly" 沿航路飛遁(真實時間,坐騎縮短);"portal" 支付傳送陣費用瞬間抵達
    case "travel": {
      if (s.combat) return { save: s, error: "激戰之中,無法脫身遠行。" };
      if (s.location?.travel) return { save: s, error: "你已在趕路途中。" };
      const from = currentZoneOf(s);
      const dest = zoneById(String(payload.to ?? ""));
      if (!dest) return { save: s, error: "無此地域" };
      if (dest.id === from) return { save: s, error: "你已身在此地。" };
      if (dest.tier !== zoneById(from)!.tier) return { save: s, error: "界壁阻隔,無法以尋常手段前往他界。" };
      if (!zoneUnlocked(s, dest)) return { save: s, error: `尚未開通前往【${dest.name}】的航路(${dest.unlockHint ?? "另有機緣"})。` };
      const opts = travelOptionsOf(s);
      // 5.4 版:前往中立派系領地須先繳過路費(與傳送陣費用分開計)
      const toll = tollOf(s, dest.id);
      const tollNote = toll > 0 ? `,繳交${ownerOfZone(dest.id)!.name}過路費 ${formatStones(toll)}` : "";
      if (payload.mode === "portal") {
        const plan = portalPlan(opts, from, dest.id);
        if (!plan) return { save: s, error: `沒有通往【${dest.name}】的傳送陣(或你的派系不得使用)。` };
        if (s.stones < plan.fee + toll) {
          log(s, `傳送陣需 ${formatStones(plan.fee)} 靈石${tollNote},你囊中不足。`);
          return { save: s };
        }
        s.stones -= plan.fee + toll;
        s.location = { ...s.location!, zone: dest.id };
        log(s, `你付出 ${formatStones(plan.fee)} 靈石${tollNote},陣紋亮起——轉瞬便到了【${zoneLabel(dest.id)}】。`);
        return { save: s };
      }
      const plan = flyPlan(opts, from, dest.id);
      if (!plan) return { save: s, error: `找不到通往【${dest.name}】的航路。` };
      if (s.stones < toll) {
        log(s, `前往【${dest.name}】須繳${ownerOfZone(dest.id)!.name}過路費 ${formatStones(toll)},你囊中不足。`);
        return { save: s };
      }
      s.stones -= toll;
      const now = Date.now();
      s.location = {
        ...s.location!,
        travel: { from, to: dest.id, departAt: now, arriveAt: now + plan.minutes * MINUTE_MS, kind: "fly" },
      };
      const via = plan.path.length > 2 ? `,途經${plan.path.slice(1, -1).map((z) => zoneById(z)!.name).join("、")}` : "";
      log(s, `你駕起遁光,自【${zoneById(from)!.name}】動身前往【${dest.name}】${via}${tollNote},約需 ${plan.minutes} 分鐘。`);
      return { save: s };
    }

    // 折返:立即回到出發地,已花的時間不退;下界途中折返則取消遠征(破界珠/逆星盤已耗用,不退還)
    case "cancelTravel": {
      const t = s.location?.travel;
      if (!t) return { save: s, error: "你並未在趕路。" };
      if (t.kind === "return") return { save: s, error: "已在返回上界的界壁通道中,無法回頭。" };
      if (t.kind === "descend") {
        s.location = { zone: t.from };
        log(s, "你在界壁通道中回身折返,通道隨即崩散——這次下界之行就此作罷。");
        return { save: s };
      }
      s.location = { ...s.location!, zone: t.from, travel: undefined };
      log(s, `你掉轉遁光,回到了【${zoneById(t.from)!.name}】。`);
      return { save: s };
    }

    // 下界:破界珠往下一界、逆星盤自仙界往人間或靈界;穿越界壁 30 分鐘,停留 VISIT_HOURS 小時
    case "descend": {
      if (s.combat) return { save: s, error: "激戰之中,無法脫身遠行。" };
      if (s.location?.travel) return { save: s, error: "你已在趕路途中。" };
      if (s.location?.visit) return { save: s, error: "你已身處下界。" };
      const itemId = String(payload.itemId ?? "");
      const from = currentZoneOf(s);
      const fromTier = zoneById(from)!.tier;
      const dest = zoneById(String(payload.to ?? ""));
      if (!dest) return { save: s, error: "無此地域" };
      // 5.4 版:下界須從本界的降靈臺出發;唯仙界往靈界不必(任何仙域皆可)
      if (needsDescentPlatform(fromTier, dest.tier) && from !== DESCENT_ZONE[fromTier]) {
        return { save: s, error: `須先前往降靈臺(${zoneById(DESCENT_ZONE[fromTier])!.name})方能下界。` };
      }
      const now = Date.now();
      // 下界方式:破界珠/逆星盤;輪迴殿可用兩顆破界珠代替逆星盤;玄天斬靈劍斬破界壁(冷卻 24 小時,免道具)
      let cost: { id: string; n: number } | null = null;
      let how = "";
      if (itemId === RIFT_CROSS_WEAPON) {
        if (s.equippedWeapon?.split("@")[0] !== RIFT_CROSS_WEAPON) return { save: s, error: "你並未祭出玄天斬靈劍。" };
        if (now - (s.riftCrossAt ?? 0) < RIFT_CROSS_COOLDOWN_HOURS * HOUR_MS) {
          return { save: s, error: "玄天斬靈劍劍意未復,尚無法再斬界壁。" };
        }
        if (!descendTargets(POJIE_ZHU, fromTier).includes(dest.tier)) {
          return { save: s, error: `玄天斬靈劍只能斬開通往下一界的界壁。` };
        }
        s.riftCrossAt = now;
        how = "你祭起玄天斬靈劍,一劍斬落,界壁應聲而開";
      } else if (descendTargets(itemId, fromTier).includes(dest.tier) && (s.inventory[itemId] ?? 0) > 0) {
        cost = { id: itemId, n: 1 };
      } else if (
        itemId === POJIE_ZHU &&
        s.faction === "lunhui" &&
        descendTargets(NIXING_PAN, fromTier).includes(dest.tier) &&
        (s.inventory[POJIE_ZHU] ?? 0) >= LUNHUI_PEARLS_FOR_DISC
      ) {
        cost = { id: POJIE_ZHU, n: LUNHUI_PEARLS_FOR_DISC };
      } else if ((s.inventory[itemId] ?? 0) <= 0) {
        return { save: s, error: "並無此物" };
      } else {
        return { save: s, error: `【${itemById(itemId).name}】無法帶你前往${tierName(dest.tier)}。` };
      }
      if (cost) {
        take(s, cost.id, cost.n);
        how = `你捏碎${cost.n > 1 ? `${cost.n} 顆` : ""}【${itemById(cost.id).name}】,界壁應聲裂開一道縫隙`;
      }
      const stayHours = VISIT_HOURS * (s.faction === "lunhui" ? LUNHUI_VISIT_MULT : 1);
      const arriveAt = now + CROSS_REALM_MINUTES * MINUTE_MS;
      s.location = {
        zone: from,
        travel: { from, to: dest.id, departAt: now, arriveAt, kind: "descend" },
        visit: { returnZone: from, until: arriveAt + stayHours * HOUR_MS },
      };
      log(
        s,
        `${how}——動身前往${tierName(dest.tier)}【${dest.name}】,穿越界壁約需 ${CROSS_REALM_MINUTES} 分鐘,可停留 ${stayHours} 小時。`,
      );
      return { save: s };
    }

    // 返回上界:下界遠征中隨時可以返回出發地(穿越界壁 30 分鐘)
    case "returnUp": {
      if (s.combat) return { save: s, error: "激戰之中,無法脫身。" };
      const visit = s.location?.visit;
      if (!visit) return { save: s, error: "你並未身處下界。" };
      if (s.location?.travel?.kind === "return") return { save: s, error: "你已在返回上界的途中。" };
      if (s.location?.travel?.kind === "descend") return { save: s, error: "尚在界壁通道中,可選擇折返。" };
      const now = Date.now();
      const from = s.location!.zone;
      s.location = {
        zone: from,
        visit,
        travel: { from, to: visit.returnZone, departAt: now, arriveAt: now + CROSS_REALM_MINUTES * MINUTE_MS, kind: "return" },
      };
      log(s, `你循著來時的界壁裂隙動身返回【${zoneLabel(visit.returnZone)}】,約需 ${CROSS_REALM_MINUTES} 分鐘。`);
      return { save: s };
    }

    // ═══ 5.4 版:派系 ═══
    // 擇定 / 改投派系:仙界限定;改投須距上次 CHANGE_COOLDOWN_DAYS 天,功勳歸零
    case "chooseFaction": {
      const fac = factionById(String(payload.factionId ?? ""));
      if (!fac) return { save: s, error: "無此派系" };
      if (REALMS[s.realmIdx].stage < XIAN_STAGE) return { save: s, error: "唯有飛昇真仙方能投身仙界派系。" };
      if (s.faction === fac.id) return { save: s, error: `你已是${fac.name}門人。` };
      const now = Date.now();
      if (s.faction) {
        if (s.combat) return { save: s, error: "激戰之中,無法改投他派。" };
        const wait = s.factionChangedAt ? s.factionChangedAt + CHANGE_COOLDOWN_DAYS * 24 * HOUR_MS - now : 0;
        if (wait > 0) return { save: s, error: `叛派之事非同小可,尚須等待 ${Math.ceil(wait / HOUR_MS)} 小時方能改投他派。` };
      }
      const prev = factionById(s.faction);
      s.faction = fac.id;
      s.factionPending = false;
      s.factionChangedAt = now;
      s.merit = 0;
      const lines = prev
        ? [`你叛出${prev.name},改投${fac.name}門下——過往功勳一筆勾銷。`]
        : [`你投身【${fac.name}】,自此以${fac.city}為歸宿。`];
      if (fac.opensZones.length) {
        lines.push(`${fac.name}的航路已為你開通:${fac.opensZones.map((z) => zoneById(z)!.name).join("、")}。`);
      }
      log(s, ...lines);
      return { save: s, breakResult: { success: true, title: `投 身 ${fac.name}`, lines } };
    }

    // 歸宗令:每 RECALL_COOLDOWN_HOURS 小時可瞬移回本派主城一次(趕路中使用會取消趕路)
    case "recall": {
      const fac = factionById(s.faction);
      if (!fac) return { save: s, error: "你尚未投身任何派系。" };
      if (s.combat) return { save: s, error: "激戰之中,無法脫身。" };
      if (s.location?.visit) return { save: s, error: "身處下界,歸宗令感應不到宗門。" };
      const now = Date.now();
      const wait = (s.recallAt ?? 0) + RECALL_COOLDOWN_HOURS * HOUR_MS - now;
      if (wait > 0) return { save: s, error: `歸宗令靈光未復,尚須 ${Math.ceil(wait / MINUTE_MS)} 分鐘。` };
      if (currentZoneOf(s) === fac.homeZone && !s.location?.travel) return { save: s, error: `你已身在${fac.city}所在的領地。` };
      s.recallAt = now;
      s.location = { zone: fac.homeZone };
      log(s, `你捏碎歸宗令,一道靈光將你接引回【${fac.city}】(${zoneLabel(fac.homeZone)})。`);
      return { save: s };
    }

    // 破空(玄天仙器):同一界內瞬移至已開通的地域,冷卻 RIFT_COOLDOWN_HOURS 小時
    case "rift": {
      if (!s.equippedWeapon || !isXuantianArtifact(s.equippedWeapon)) return { save: s, error: "唯有祭出玄天仙器方能破開虛空。" };
      if (s.combat) return { save: s, error: "激戰之中,無法脫身。" };
      if (s.location?.travel) return { save: s, error: "你正在趕路途中。" };
      const dest = zoneById(String(payload.to ?? ""));
      const from = currentZoneOf(s);
      if (!dest || dest.id === from) return { save: s, error: "無此地域" };
      if (dest.tier !== zoneById(from)!.tier) return { save: s, error: "破空只能在同一界內往來。" };
      if (!zoneUnlocked(s, dest)) return { save: s, error: `尚未開通前往【${dest.name}】的航路。` };
      const now = Date.now();
      const wait = (s.riftAt ?? 0) + RIFT_COOLDOWN_HOURS * HOUR_MS - now;
      if (wait > 0) return { save: s, error: `仙器之力未復,尚須 ${Math.ceil(wait / MINUTE_MS)} 分鐘方能再破虛空。` };
      const toll = tollOf(s, dest.id);
      if (s.stones < toll) return { save: s, error: `須繳${ownerOfZone(dest.id)!.name}過路費 ${formatStones(toll)},你囊中不足。` };
      s.stones -= toll;
      s.riftAt = now;
      s.location = { ...s.location!, zone: dest.id };
      log(s, `你以玄天仙器破開虛空,一步踏出,已到【${zoneLabel(dest.id)}】。`);
      return { save: s };
    }

    // 派系商店:以功勳兌換
    case "buyFaction": {
      const fac = factionById(s.faction);
      if (!fac) return { save: s, error: "你尚未投身任何派系。" };
      const entry = shopOf(fac.id).find((e) => e.itemId === payload.itemId);
      if (!entry) return { save: s, error: "此物不在派系商店之列。" };
      if ((s.merit ?? 0) < entry.merit) {
        log(s, `兌換【${itemById(entry.itemId).name}】需功勳 ${entry.merit}(現有 ${s.merit ?? 0})。`);
        return { save: s };
      }
      s.merit = (s.merit ?? 0) - entry.merit;
      give(s, entry.itemId);
      log(s, `你以功勳 ${entry.merit} 向${fac.name}兌換了【${itemById(entry.itemId).name}】。`);
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
        if (s.equippedMount === item.id) s.equippedMount = null;
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
      // 5.4 版:十階器具需要煉製時間,爐中一次只能煉一件
      const forgeMin = forgeMinutesOf(rec);
      if (forgeMin > 0 && s.forge) {
        return { save: s, error: `爐中尚有【${s.forge.name}】未出爐,待其出爐後方可再開爐。` };
      }
      // 5.3 版:裝備類配方另需五行材料、靈石費用提高,並有失敗率(見 crafting.ts 的 craftCostOf)
      const cost = craftCostOf(rec);
      if (s.stones < cost.stones) {
        log(s, `煉製 ${rec.name} 需 ${cost.stones} 靈石作爐火之資,靈石不足。`);
        return { save: s };
      }
      for (const m of [...cost.materials, ...cost.elements]) {
        if ((s.inventory[m.id] ?? 0) < m.n) {
          log(s, `材料不足:煉製 ${rec.name} 需 ${itemById(m.id).name} ×${m.n}。`);
          return { save: s };
        }
      }
      const soul = rec.taiyiSoul ? TAIYI_SOUL_IDS.find((id) => (s.inventory[id] ?? 0) >= 1) : undefined;
      if (rec.taiyiSoul && !soul) {
        log(s, `煉製 ${rec.name} 需太乙精魂一枚(天狐/真龍/霸下/黑眼貔貅任一皆可),你尚未持有。`);
        return { save: s };
      }
      if (forgeMin > 0) {
        s.stones -= cost.stones;
        s.energy -= energyCost;
        for (const m of [...cost.elements, ...cost.materials]) take(s, m.id, m.n);
        if (soul) take(s, soul);
        const now = Date.now();
        s.forge = {
          kind: "craft",
          recipeId: rec.id,
          name: rec.name,
          startAt: now,
          readyAt: now + forgeMin * MINUTE_MS,
          failChance: failChanceFinal(cost.baseFail, s.craftPity?.[rec.id] ?? 0, statsOf(s).breakBonus),
        };
        log(s, `爐火已起——【${rec.name}】需煉 ${forgeDurationText(forgeMin)},屆時方可出爐。`);
        return { save: s };
      }
      // 煉丹配方額外消耗壽元;壽元耗盡即道隕(與打坐/調息一致的處理方式)
      const lifeCost = rec.lifeCost ?? 0;
      const cap = maxLifeOf(s);
      if (lifeCost > 0 && s.age + lifeCost >= cap) {
        for (const m of [...cost.materials, ...cost.elements]) take(s, m.id, m.n);
        s.stones -= cost.stones;
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
      s.stones -= cost.stones;
      s.energy -= energyCost;
      for (const m of cost.elements) take(s, m.id, m.n);
      if (lifeCost > 0) {
        s.age += lifeCost;
        s.day = s.age;
      }
      // 失敗:靈石與所有材料全數損失;同一配方連續失敗累積保底,下次失敗率 −5%
      const pity = s.craftPity?.[rec.id] ?? 0;
      const mingBonus = statsOf(s).breakBonus;
      const failChance = failChanceFinal(cost.baseFail, pity, mingBonus);
      if (failChance > 0 && Math.random() < failChance) {
        for (const m of cost.materials) take(s, m.id, m.n);
        return craftFailed(s, rec, lifeCost);
      }
      for (const m of cost.materials) take(s, m.id, m.n);
      return craftSucceeded(s, rec, lifeCost);
    }

    case "craftXuantian": {
      const { realm } = statsOf(s);
      if (realm.stage < 12) {
        return { save: s, error: "玄天仙器唯太乙境修士方能煉化,此刻你尚無資格。" };
      }
      if (s.forge) return { save: s, error: `爐中尚有【${s.forge.name}】未出爐,待其出爐後方可再開爐。` };
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
      const haveSoul = TAIYI_SOUL_IDS.find((id) => (s.inventory[id] ?? 0) >= 1);
      if (!haveSoul) {
        log(s, "煉化玄天仙器需太乙精魂一枚(天狐/真龍/霸下/黑眼貔貅任一皆可),你尚未持有。");
        return { save: s };
      }
      // 5.3 版:另需仙品五行各 5;5.4 版:爐火之資 25 仙元石、失敗率 35%、需煉 6 小時
      const lackEl = XUANTIAN_ELEMENTS.find((m) => (s.inventory[m.id] ?? 0) < m.n);
      if (lackEl) {
        log(s, `煉化玄天仙器需${itemById(lackEl.id).name} ×${lackEl.n}(仙品五行各 5),你尚未集齊。`);
        return { save: s };
      }
      if (s.stones < XUANTIAN_STONES) {
        log(s, `煉化玄天仙器需 ${formatStones(XUANTIAN_STONES)} 作爐火之資,靈石不足。`);
        return { save: s };
      }
      // 開爐即扣,失敗時所有材料(含太乙精魂)與靈石全數損失
      for (const m of XUANTIAN_ELEMENTS) take(s, m.id, m.n);
      take(s, "xuantian_canpian", FRAGMENT_COST);
      take(s, "poshou_jinhow", FRAGMENT_COST2);
      take(s, haveSoul);
      s.stones -= XUANTIAN_STONES;
      s.energy -= energyCost;
      const now = Date.now();
      s.forge = {
        kind: "xuantian",
        name: "玄天仙器",
        startAt: now,
        readyAt: now + XUANTIAN_FORGE_MINUTES * MINUTE_MS,
        failChance: Math.max(0, XUANTIAN_FAIL - statsOf(s).breakBonus),
      };
      log(s, `玄天殘片與太乙精魂同入爐中,紫氣氤氳——煉化玄天仙器需 ${forgeDurationText(XUANTIAN_FORGE_MINUTES)},屆時方可出爐。`);
      return { save: s };
    }

    // 出爐(5.4 版):時間到才擲成敗;失敗時材料已在開爐時扣除,全數損失
    case "forgeCollect": {
      const f = s.forge;
      if (!f) return { save: s, error: "爐中並無煉製中的器物。" };
      if (Date.now() < f.readyAt) return { save: s, error: `【${f.name}】火候未到,尚不能出爐。` };
      s.forge = null;
      const failed = f.failChance > 0 && Math.random() < f.failChance;
      if (f.kind === "xuantian") {
        if (!failed) return xuantianSucceeded(s);
        log(s, "紫氣反噬,爐中殘片與太乙精魂盡數崩散——煉化玄天仙器失敗!");
        return {
          save: s,
          loot: {
            title: "煉 化 失 敗",
            success: false,
            lines: ["煉化玄天仙器失敗", "靈石、仙品五行材料、玄天殘片、破曉精華與太乙精魂全數損失。"],
          },
        };
      }
      const rec = RECIPES.find((x) => x.id === f.recipeId);
      if (!rec) return { save: s, error: "無此配方" };
      return failed ? craftFailed(s, rec) : craftSucceeded(s, rec);
    }

    // 滕符陣(4.2 版):安裝 / 移動 / 卸下。payload.from = "bag" 從未安裝區放入,或傳 index 移動已安裝的滕符
    case "tengfuPlace": {
      if (s.combat) return { save: s, error: "戰鬥中無法調整滕符陣" };
      const r = Number(payload.r);
      const c = Number(payload.c);
      const moveIndex = payload.index === undefined ? -1 : Number(payload.index);
      const id = moveIndex >= 0 ? s.tengfuGrid[moveIndex]?.id : String(payload.id ?? "");
      const def = id ? tengfuById(id) : undefined;
      if (!def) return { save: s, error: "並無此滕符" };
      if (moveIndex < 0 && (s.tengfuBag[def.id] ?? 0) <= 0) return { save: s, error: "並無此滕符" };
      if (!Number.isInteger(r) || !Number.isInteger(c) || !canPlaceTengfu(s.tengfuGrid, def, r, c, moveIndex)) {
        return { save: s, error: "此處放不下這張滕符" };
      }
      if (moveIndex >= 0) {
        s.tengfuGrid[moveIndex] = { id: def.id, r, c };
      } else {
        s.tengfuBag[def.id] -= 1;
        if (s.tengfuBag[def.id] <= 0) delete s.tengfuBag[def.id];
        s.tengfuGrid.push({ id: def.id, r, c });
        log(s, `你將【${def.name}】安入滕符陣,符光一閃,與周身氣機相連。`);
      }
      return { save: s };
    }
    case "tengfuRemove": {
      if (s.combat) return { save: s, error: "戰鬥中無法調整滕符陣" };
      const index = Number(payload.index);
      const placed = s.tengfuGrid[index];
      if (!placed) return { save: s, error: "並無此滕符" };
      s.tengfuGrid.splice(index, 1);
      s.tengfuBag[placed.id] = (s.tengfuBag[placed.id] ?? 0) + 1;
      // 卸下氣血/法力滕符後,現值不可超過新上限
      const { hpMax, mpMax } = statsOf(s);
      s.hp = Math.min(s.hp, hpMax);
      s.mp = Math.min(s.mp, mpMax);
      s.energy = Math.min(s.energy ?? 0, energyMaxOf(s));
      return { save: s };
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

    // 符寶袋調整(3.4 版新增;3.15 版改為受「擁有份數」節制,見 ownedCopiesOf):挑選已學仙法放入
    // 符寶袋,可重複放入同一門仙法,但張數不得超過實際擁有的符寶副本數(基礎卡片不受此限);移除時
    // 不得低於 pouchMinFor() 算出的最低張數——用「調整時擋下」取代「開戰時擋下」,玩家永遠處於合
    // 法狀態,不會卡在無法開戰的中間態。
    case "pouchAdjust": {
      if (s.combat) return { save: s, error: "激戰之中,無法調整符寶袋。" };
      const techId = String(payload.techId ?? "");
      if (!s.learned.includes(techId)) return { save: s, error: "未習得此仙法" };
      const delta = Number(payload.delta ?? 0);
      if (delta !== 1 && delta !== -1) return { save: s, error: "無效操作" };
      const pouch = s.pouch && s.pouch.length > 0 ? [...s.pouch] : defaultPouch(s);
      if (delta > 0) {
        const count = pouch.filter((id) => id === techId).length;
        const owned = ownedCopiesOf(s, techId);
        if (count >= owned) {
          return {
            save: s,
            error: techById(techId).innate
              ? `單一符寶最多放入符寶袋 ${POUCH_MAX_COPIES} 張`
              : `你只擁有 ${owned} 份【${techById(techId).name}】符寶副本,無法放入更多張(再次參悟同門秘笈可多得一份)`,
          };
        }
        pouch.push(techId);
      } else {
        const idx = pouch.indexOf(techId);
        if (idx === -1) return { save: s, error: "符寶袋中並無此符寶" };
        if (isBasicCard(techId) && pouch.filter((id) => id === techId).length <= BASIC_CARD_MIN) {
          return { save: s, error: `【${techById(techId).name}】為基礎卡片,符寶袋中至少需保留 ${BASIC_CARD_MIN} 張` };
        }
        const minReq = pouchMinFor(s);
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
