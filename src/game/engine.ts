// 伺服器權威遊戲引擎:所有獎勵運算在此執行,前端僅顯示
import { COUNTERS, Element, Monster } from "./types";
import { REALMS } from "./data/realms";
import { SECTS } from "./data/sects";
import { techById } from "./data/techniques";
import { itemById } from "./data/items";
import { LOCATIONS, MONSTERS, RECIPES } from "./data/world";
import { MISSIONS } from "./data/missions";

export interface CombatState {
  monsterId: string;
  monsterHp: number;
  locationId: string;
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
  equippedWeapon: string | null;
  equippedArmor: string | null;
  kills: Record<string, number>;
  seen: string[];
  missionId: string | null;
  missionBase: number;
  age: number;
  lifeBonus: number;
  day: number;
  cultToday: number;
  dead: boolean;
  log: string[];
  combat: CombatState | null;
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

// 每部秘笈的學習年數:境界需求 ×10 年
export const learnYears = (techId: string) => techById(techId).reqStage * 10;

export const maxLifeOf = (s: Pick<SaveData, "realmIdx" | "lifeBonus">) =>
  REALMS[s.realmIdx].lifespan + s.lifeBonus;

export function statsOf(s: SaveData) {
  const realm = REALMS[s.realmIdx];
  const sect = SECTS.find((x) => x.id === s.sectId);
  const weapon = s.equippedWeapon ? itemById(s.equippedWeapon) : null;
  const armor = s.equippedArmor ? itemById(s.equippedArmor) : null;
  const atk = realm.atk + (sect?.bonus.atk ?? 0) + (weapon?.atkBonus ?? 0);
  const def = (weapon?.defBonus ?? 0) + (armor?.defBonus ?? 0);
  const hpMax = realm.hpMax + (sect?.bonus.hp ?? 0);
  const mpMax = realm.mpMax + (sect?.bonus.mp ?? 0);
  const speed = realm.atk + Math.floor(((weapon?.atkBonus ?? 0) + (armor?.defBonus ?? 0)) * 0.02) + realm.stage * 5;
  return { realm, sect, atk, def, hpMax, mpMax, speed, weaponEl: weapon?.element };
}

const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const monsterById = (id: string): Monster => MONSTERS.find((m) => m.id === id)!;

function elementMult(attacker: Element | undefined, defender: Element): number {
  if (!attacker) return 1;
  if (COUNTERS[attacker] === defender) return 1.5;
  if (COUNTERS[defender] === attacker) return 0.75;
  return 1;
}

function log(s: SaveData, ...msgs: string[]) {
  s.log = [...s.log, ...msgs].slice(-MAX_LOG);
}

function give(s: SaveData, id: string, n = 1) {
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
    started: true, name: name || "無名散修", sectId, realmIdx: 0, exp: 0,
    hp: 0, mp: 0, stones: 20,
    inventory: { huanglongdan: 2, liaoshangdan: 1 },
    learned: [sect.startTech], learning: null,
    equippedWeapon: null, equippedArmor: null,
    kills: {}, seen: [], missionId: null, missionBase: 0,
    age: 16, lifeBonus: 0, day: 1, cultToday: 0, dead: false,
    log: [], combat: null,
  };
  const { hpMax, mpMax } = statsOf(s);
  s.hp = hpMax;
  s.mp = mpMax;
  log(s,
    `${s.name} 拜入 ${sect.name},自此踏上修仙之路。`,
    `長老傳授入門仙法:${techById(sect.startTech).name}。`,
    "身上僅有 20 枚下品靈石與幾瓶丹藥,前路漫漫,道阻且長。"
  );
  return s;
}

function maybeEncounter(s: SaveData) {
  const realm = REALMS[s.realmIdx];
  const roll = Math.random();
  if (roll < 0.03) {
    const gain = Math.floor(realm.expNeed * 0.15);
    s.exp += gain;
    log(s, `打坐間心神空明,天地法則於眼前一閃而逝——頓悟!修為 +${gain}。`);
  } else if (roll < 0.06) {
    const stones = Math.floor(realm.expNeed * 0.3) + rand(10, 30);
    s.stones += stones;
    log(s, `你偶遇一位隕落修士的遺蛻,收殮入土後,拾得遺留靈石 ${stones} 枚。`);
  } else if (roll < 0.08) {
    const herbs = ["zhuguo", "xuelingzhi", "zijinhua", "qiannianlingru"];
    const h = herbs[rand(0, realm.stage >= 3 ? 3 : 2)];
    give(s, h);
    log(s, `一隻靈猴自林間擲來一株【${itemById(h).name}】,吱吱兩聲便竄得無影無蹤。`);
  } else if (roll < 0.095) {
    const lost = Math.floor(s.stones * 0.1);
    s.stones -= lost;
    log(s, `一名遊方散修與你論道半日,臨別時你才發現儲物袋輕了——被順走了 ${lost} 靈石!`);
  } else if (roll < 0.11) {
    const gain = Math.floor(realm.expNeed * 0.25);
    s.exp += gain;
    log(s, `荒亭避雨,偶遇一位白髮老道與你手談一局。局終人杳,棋盤上殘留一縷道韻——修為 +${gain}。`);
  } else if (roll < 0.125 && realm.stage >= 3) {
    give(s, "dahuandan");
    log(s, "你救下一名被妖獸圍攻的散修,對方傾囊相贈一枚【大還丹】,拱手而別。");
  } else if (roll < 0.14 && realm.stage >= 4) {
    const pool = ["m_aohan", "m_dageng", "m_yuanci"];
    const m = pool[rand(0, realm.stage >= 5 ? 2 : 1)];
    give(s, m);
    log(s, `地動山搖,一座上古洞府破土而出!你搶在群修之前取走【${itemById(m).name}】,遁光而去。`);
  } else if (roll < 0.148) {
    give(s, "wanshoudan");
    log(s, "你於一處無名廢墟中掘出一只丹盒,盒中靜臥一枚【萬壽丹】——延壽百載的奇丹!");
  } else if (roll < 0.151) {
    give(s, "yanshouguo");
    log(s, "懸崖之下異香撲鼻——竟是一株萬載一熟的【延壽果】!你顫抖著雙手將其摘下。");
  } else if (roll < 0.152 && REALMS[s.realmIdx].stage >= 5) {
    give(s, "panlongtao");
    log(s, "九天之上仙音縹緲,一枚龍紋壽桃自雲端墜落,正落你掌心——【蟠龍壽桃】!此乃仙界之物!");
  }
}

function monsterTurn(s: SaveData): string[] {
  if (!s.combat) return [];
  const lines: string[] = [];
  const mon = monsterById(s.combat.monsterId);
  const { def, hpMax, speed } = statsOf(s);
  const monSpeed = Math.floor(mon.atk * 1.2);
  const dodge = Math.min(0.35, Math.max(0.05, (speed / (speed + monSpeed)) * 0.5));
  if (Math.random() < dodge) {
    lines.push(`${mon.name} 撲擊而來,你身形一晃,堪堪避過!(閃避 ${Math.round(dodge * 100)}%)`);
    log(s, ...lines);
    return lines;
  }
  const dmg = Math.max(1, rand(Math.floor(mon.atk * 0.8), Math.floor(mon.atk * 1.2)) - def);
  lines.push(`${mon.name} 反擊,你受到 ${dmg} 點傷害。`);
  s.hp -= dmg;
  if (s.hp <= 0) {
    const lost = Math.floor(s.stones / 2);
    lines.push(`你身受重傷不敵,倉皇遁走…… 遺失了 ${lost} 靈石。`);
    s.hp = Math.max(1, Math.floor(hpMax * 0.3));
    s.stones -= lost;
    s.combat = null;
  }
  log(s, ...lines);
  return lines;
}

function winCombat(s: SaveData): Modal {
  const mon = monsterById(s.combat!.monsterId);
  const stones = rand(mon.stones[0], mon.stones[1]);
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
  s.combat = null;
  log(s, `你擊殺了 ${mon.name}!獲得修為 ${mon.exp}、靈石 ${stones}${dropNames.length ? ",拾得:" + dropNames.join("、") : ""}。`);
  return {
    title: "戰 利 品",
    success: true,
    lines: [
      `擊殺【${mon.name}】`,
      `修為 +${mon.exp}`,
      `靈石 +${stones}`,
      ...(dropNames.length ? [`拾得:${dropNames.join("、")}`] : ["妖獸未留下完整材料。"]),
    ],
  };
}

// ═══ 主入口 ═══
export function applyAction(s: SaveData, type: string, payload: Record<string, unknown> = {}): ActionResult {
  if (s.dead && type !== "reset") return { save: s, error: "你已道隕,唯有轉世重修。" };

  switch (type) {
    case "cultivate": {
      if (s.combat) return { save: s, error: "激戰之中,無法打坐。" };
      if (s.cultToday >= 3) {
        log(s, "今年心神已竭,再修無益。且調息一年,養精蓄銳。");
        return { save: s };
      }
      const { realm, sect, hpMax, mpMax } = statsOf(s);
      const base = realm.expNeed * (0.04 + Math.random() * 0.03);
      const gain = Math.max(1, Math.floor(base * (1 + (sect?.bonus.exp ?? 0) / 100)));
      s.exp += gain;
      s.hp = Math.min(hpMax, s.hp + Math.floor(hpMax * 0.15));
      s.mp = Math.min(mpMax, s.mp + Math.floor(mpMax * 0.25));
      s.cultToday += 1;
      log(s, `你盤膝打坐,吐納靈氣,修為 +${gain}(本年 ${s.cultToday}/3)。`);
      maybeEncounter(s);
      return { save: s };
    }

    case "rest": {
      if (s.combat) return { save: s, error: "激戰之中,無法調息。" };
      const cap = maxLifeOf(s);
      const age = s.age + 10;
      const { hpMax, mpMax } = statsOf(s);
      if (age >= cap) {
        s.age = cap;
        s.dead = true;
        s.combat = null;
        log(s, "枯坐洞府,你忽覺經脈枯涸,鏡中鬢髮霜白——壽元已盡。",
          `享年 ${cap} 年,道隕於【${REALMS[s.realmIdx].name}】。仙路無情,一步遲,步步遲。`);
        return { save: s };
      }
      s.age = age;
      s.day += 1;
      s.cultToday = 0;
      s.hp = hpMax;
      s.mp = mpMax;
      const lines = [`你閉關調息,吐納周天,氣血仙靈力盡復。歲月如梭,又是十年(${age}/${cap} 年)。`];
      // 修習仙法推進
      if (s.learning) {
        s.learning.remain -= 10;
        const tech = techById(s.learning.techId);
        if (s.learning.remain <= 0) {
          s.learned.push(s.learning.techId);
          s.learning = null;
          lines.push(`十年苦修,水到渠成——你終於參透【${tech.name}】,自此多一大神通!`);
        } else {
          lines.push(`【${tech.name}】修習中,尚需 ${s.learning.remain} 年。`);
        }
      }
      log(s, ...lines);
      return { save: s };
    }

    case "breakthrough": {
      if (s.combat) return { save: s, error: "激戰之中,無法突破。" };
      const realm = REALMS[s.realmIdx];
      if (s.realmIdx >= REALMS.length - 1) {
        log(s, "你已白日飛昇,位列仙班。仙界的故事,是另一部書了……");
        return { save: s };
      }
      if (s.exp < realm.expNeed) {
        log(s, `修為不足,突破 ${REALMS[s.realmIdx + 1].name} 需 ${realm.expNeed} 修為(現有 ${s.exp})。`);
        return { save: s };
      }
      if (Math.random() < realm.breakChance) {
        const next = REALMS[s.realmIdx + 1];
        s.realmIdx += 1;
        s.exp -= realm.expNeed;
        const { hpMax, mpMax } = statsOf(s);
        s.hp = hpMax;
        s.mp = mpMax;
        let breakResult: Modal;
        if (next.stage === 10) {
          breakResult = {
            success: true, title: "白 日 飛 昇",
            lines: ["九霄之上雷雲翻湧,萬丈金光自天門傾瀉——你踏碎虛空,白日飛昇!",
              "自山村凡童至真仙之軀,這一步,你走了一生。"],
          };
        } else if (next.stage > realm.stage) {
          const gift = Math.floor(next.lifespan * 0.1);
          s.lifeBonus += gift;
          breakResult = {
            success: true, title: "突 破 大 關",
            lines: [`天地色變,靈氣如百川歸海——你渡過大關,晉入【${next.name}】!`,
              `壽元上限躍升至 ${next.lifespan} 年,脫胎換骨,額外增壽 ${gift} 年。`],
          };
        } else {
          breakResult = {
            success: true, title: "突 破 成 功",
            lines: [`靈氣灌體,經脈轟鳴——你成功突破至【${next.name}】!氣血仙靈力盡復。`],
          };
        }
        log(s, ...breakResult.lines);
        return { save: s, breakResult };
      }
      // 失敗
      const lost = Math.floor(realm.expNeed * 0.2);
      const lifeCut = Math.floor(maxLifeOf(s) * 0.15);
      s.exp = Math.max(0, s.exp - lost);
      s.lifeBonus -= lifeCut;
      const cap = maxLifeOf(s);
      const lines = [
        `靈氣暴走,經脈俱震!修為損失 ${lost}。`,
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
      if (Math.random() < 0.35 && loc.monsters.length) {
        const mid = loc.monsters[rand(0, loc.monsters.length - 1)];
        const mon = monsterById(mid);
        s.combat = { monsterId: mid, monsterHp: mon.hp, locationId: loc.id };
        if (!s.seen.includes(mid)) s.seen.push(mid);
        log(s, `你在 ${loc.name} 採集時,${mon.name} 突然襲來!`);
        return { save: s };
      }
      const pool = [...loc.materials, ...loc.herbs];
      const found: string[] = [];
      const n = rand(1, 2);
      for (let i = 0; i < n; i++) {
        const id = pool[rand(0, pool.length - 1)];
        give(s, id);
        found.push(itemById(id).name);
      }
      const lines = [`採得:${found.join("、")}`];
      if (Math.random() < loc.manualChance && loc.manuals.length) {
        const mid = loc.manuals[rand(0, loc.manuals.length - 1)];
        give(s, mid);
        lines.push(`石壁之後竟藏有一部【${itemById(mid).name}】!天大機緣!`);
      }
      log(s, `你在 ${loc.name} 仔細搜尋,${lines.join(";")}。`);
      maybeEncounter(s);
      return { save: s, loot: { title: "採 集 所 得", success: true, lines: [`於【${loc.name}】搜尋一番:`, ...lines] } };
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
      const mid = loc.monsters[rand(0, loc.monsters.length - 1)];
      const mon = monsterById(mid);
      s.combat = { monsterId: mid, monsterHp: mon.hp, locationId: loc.id };
      if (!s.seen.includes(mid)) s.seen.push(mid);
      log(s, `你主動深入 ${loc.name} 尋妖,遭遇了 ${mon.name}(${mon.element}屬性)!`);
      return { save: s };
    }

    case "cast": {
      if (!s.combat) return { save: s, error: "並無戰鬥" };
      const techId = String(payload.techId ?? "");
      if (!s.learned.includes(techId)) return { save: s, error: "未習得此仙法" };
      const tech = techById(techId);
      if (s.mp < tech.mpCost) {
        log(s, `仙靈力不足,無法施展 ${tech.name}(需 ${tech.mpCost})。`);
        return { save: s };
      }
      const mon = monsterById(s.combat.monsterId);
      const { atk } = statsOf(s);
      const mult = elementMult(tech.element, mon.element);
      const dmg = Math.max(1, Math.floor(atk * tech.power * mult * (0.9 + Math.random() * 0.2)));
      s.mp -= tech.mpCost;
      log(s, `你施展【${tech.name}】,對 ${mon.name} 造成 ${dmg} 傷害` +
        (mult > 1 ? "(五行相剋,威力大增!)" : mult < 1 ? "(屬性被剋,威力受阻)" : "") + "。");
      s.combat.monsterHp -= dmg;
      if (s.combat.monsterHp <= 0) return { save: s, loot: winCombat(s) };
      monsterTurn(s);
      return { save: s };
    }

    case "attack": {
      if (!s.combat) return { save: s, error: "並無戰鬥" };
      const mon = monsterById(s.combat.monsterId);
      const { atk, weaponEl } = statsOf(s);
      const mult = elementMult(weaponEl, mon.element);
      const dmg = Math.max(1, Math.floor(atk * mult * (0.85 + Math.random() * 0.3)));
      log(s, `你御使法器直取要害,對 ${mon.name} 造成 ${dmg} 傷害。`);
      s.combat.monsterHp -= dmg;
      if (s.combat.monsterHp <= 0) return { save: s, loot: winCombat(s) };
      monsterTurn(s);
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
        monsterTurn(s);
      }
      return { save: s };
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
          log(s, `你正在修習【${techById(s.learning.techId).name}】(尚需 ${s.learning.remain} 年),心無二用,無法同時參悟他法。`);
          return { save: s };
        }
        take(s, itemId);
        const years = learnYears(item.teaches);
        s.learning = { techId: item.teaches, remain: years };
        log(s, `你焚香沐浴,開始參悟【${item.name}】。此法玄奧,需潛修 ${years} 年方可大成(調息推進)。`);
        return { save: s };
      }

      if (item.kind === "artifact" || item.kind === "treasure") {
        if (item.kind === "artifact") s.equippedWeapon = itemId;
        else s.equippedArmor = itemId;
        log(s, `你將【${item.name}】${item.kind === "artifact" ? "祭於身前,攻伐之力大增" : "穿戴護身"}。`);
        return { save: s };
      }

      take(s, itemId);
      const effects: string[] = [];
      if (item.heal) { s.hp = Math.min(hpMax, s.hp + item.heal); effects.push(`回復氣血 ${item.heal}`); }
      if (item.mp) { s.mp = Math.min(mpMax, s.mp + item.mp); effects.push(`回復仙靈力 ${item.mp}`); }
      if (item.exp) { s.exp += item.exp; effects.push(`修為 +${item.exp}`); }
      if (item.life) { s.lifeBonus += item.life; effects.push(`壽元 +${item.life} 年`); }
      log(s, `你服下 ${item.name},${effects.join(",")}。`);
      return { save: s };
    }

    case "buy": {
      const item = itemById(String(payload.itemId ?? ""));
      if (!item) return { save: s, error: "無此商品" };
      if (item.life) return { save: s, error: "延壽極品坊市不售" };
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
      if (s.equippedWeapon === item.id && !(s.inventory[item.id] > 0)) s.equippedWeapon = null;
      if (s.equippedArmor === item.id && !(s.inventory[item.id] > 0)) s.equippedArmor = null;
      log(s, `售出 ${item.name},得 ${gain} 靈石。`);
      return { save: s };
    }

    case "craft": {
      const rec = RECIPES.find((x) => x.id === payload.recipeId);
      if (!rec) return { save: s, error: "無此配方" };
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
      give(s, rec.result);
      log(s, `爐火純青,三日三夜——你成功煉製出法器【${rec.name}】!`);
      return { save: s, loot: { title: "煉 器 大 成", success: true, lines: [`【${rec.name}】出爐!`, itemById(rec.result).desc] } };
    }

    case "equip": {
      const item = itemById(String(payload.itemId ?? ""));
      if (!item || (s.inventory[item.id] ?? 0) <= 0) return { save: s, error: "並無此物" };
      if (item.kind === "artifact") s.equippedWeapon = item.id;
      else if (item.kind === "treasure") s.equippedArmor = item.id;
      else return { save: s, error: "此物無法裝備" };
      log(s, `你將【${item.name}】${item.kind === "artifact" ? "祭於身前" : "穿戴護身"}。`);
      return { save: s };
    }

    case "restoreMp": {
      const { realm, mpMax } = statsOf(s);
      if (s.mp >= mpMax) {
        log(s, "仙靈力已滿盈,無需聚靈。");
        return { save: s };
      }
      const cost = Math.max(10, Math.floor(realm.expNeed * 0.05));
      if (s.stones < cost) {
        log(s, `聚靈需碾碎靈石吸納靈氣,需 ${cost} 靈石(現有 ${s.stones})。`);
        return { save: s };
      }
      s.stones -= cost;
      s.mp = mpMax;
      log(s, `你碾碎 ${cost} 靈石,靈氣如霧納入丹田——仙靈力盡復。`);
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
      return { save: s, loot: { title: "任 務 完 成", success: true, lines: [`【${m.name}】覆命`, ...lines] } };
    }

    case "abandonMission": {
      if (!s.missionId) return { save: s, error: "並無任務" };
      const m = MISSIONS.find((x) => x.id === s.missionId)!;
      s.missionId = null;
      s.missionBase = 0;
      log(s, `你放棄了任務【${m.name}】,執事一臉不悅。`);
      return { save: s };
    }

    default:
      return { save: s, error: `未知操作:${type}` };
  }
}
