"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
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

interface GameState {
  started: boolean;
  name: string;
  sectId: string | null;
  realmIdx: number;
  exp: number;
  hp: number;
  mp: number;
  stones: number; // 靈石
  inventory: Record<string, number>;
  learned: string[]; // technique ids
  equippedWeapon: string | null;
  equippedArmor: string | null;
  log: string[];
  combat: CombatState | null;
  kills: Record<string, number>; // 擊殺數(圖鑑/任務)
  seen: string[]; // 圖鑑目擊
  hasVial: boolean; // 小綠瓶
  vialCharge: number; // 每次修煉/採集 +1,滿 3 可催熟
  missionId: string | null;
  missionBase: number; // 接取時的擊殺基數
  age: number; // 年齡(載)
  lifeBonus: number; // 額外壽元(突破贈壽+延壽極品)
  day: number; // 修行日
  cultToday: number; // 今日已修煉次數(上限3)
  dead: boolean; // 壽元耗盡

  // actions
  startGame: (name: string, sectId: string) => void;
  addLog: (msg: string) => void;
  cultivate: () => void;
  restDay: () => void; // 調息一日:日+1、壽元-10載、重置修煉次數
  breakthrough: () => void;
  gather: (locationId: string) => void;
  startHunt: (locationId: string) => void;
  castTech: (techId: string) => void;
  attackBasic: () => void;
  flee: () => void;
  useItem: (itemId: string) => void;
  buyItem: (itemId: string) => void;
  sellItem: (itemId: string) => void;
  craft: (recipeId: string) => void;
  equip: (itemId: string) => void;
  useVial: () => void;
  acceptMission: (id: string) => void;
  completeMission: () => void;
  abandonMission: () => void;
  resetGame: () => void;
}

const MAX_LOG = 60;

function playerStats(s: GameState) {
  const realm = REALMS[s.realmIdx];
  const sect = SECTS.find((x) => x.id === s.sectId);
  const weapon = s.equippedWeapon ? itemById(s.equippedWeapon) : null;
  const armor = s.equippedArmor ? itemById(s.equippedArmor) : null;
  const atk = realm.atk + (sect?.bonus.atk ?? 0) + (weapon?.atkBonus ?? 0);
  const def = (weapon?.defBonus ?? 0) + (armor?.defBonus ?? 0);
  const hpMax = realm.hpMax + (sect?.bonus.hp ?? 0);
  const mpMax = realm.mpMax + (sect?.bonus.mp ?? 0);
  return { realm, sect, atk, def, hpMax, mpMax, weaponEl: weapon?.element };
}

export const getStats = playerStats;

// 壽元上限 = 境界壽元 + 額外壽元
export const maxLife = (s: Pick<GameState, "realmIdx" | "lifeBonus">) =>
  REALMS[s.realmIdx].lifespan + s.lifeBonus;

function elementMult(attacker: Element | undefined, defender: Element): number {
  if (!attacker) return 1;
  if (COUNTERS[attacker] === defender) return 1.5; // 相剋
  if (COUNTERS[defender] === attacker) return 0.75; // 被剋
  return 1;
}

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function monsterById(id: string): Monster {
  return MONSTERS.find((m) => m.id === id)!;
}

function markSeen(get: () => GameState, set: (p: Partial<GameState>) => void, monId: string) {
  const s = get();
  if (!s.seen.includes(monId)) set({ seen: [...s.seen, monId] });
}

// 奇遇事件(修煉/採集時低機率觸發)
function maybeEncounter(get: () => GameState, set: (p: Partial<GameState>) => void, logs: string[]) {
  const s = get();
  const realm = REALMS[s.realmIdx];
  const roll = Math.random();
  const give = (id: string, n = 1) => {
    const inv = { ...get().inventory };
    inv[id] = (inv[id] ?? 0) + n;
    set({ inventory: inv });
  };
  if (!s.hasVial && roll < 0.03) {
    set({ hasVial: true, vialCharge: 0 });
    logs.push("你於亂石堆中拾得一只不起眼的小綠瓶——瓶身古樸,內壁凝著一滴碧色液珠,似有造化之機!");
    return;
  }
  if (roll < 0.03) {
    // 已有小綠瓶:頓悟
    const gain = Math.floor(realm.expNeed * 0.15);
    set({ exp: get().exp + gain });
    logs.push(`打坐間心神空明,天地法則於眼前一閃而逝——頓悟!修為 +${gain}。`);
    return;
  }
  if (roll < 0.06) {
    const stones = Math.floor(realm.expNeed * 0.3) + rand(10, 30);
    set({ stones: get().stones + stones });
    logs.push(`你偶遇一位隕落修士的遺蛻,收殮入土後,拾得遺留靈石 ${stones} 枚。`);
    return;
  }
  if (roll < 0.08) {
    const herbs = ["zhuguo", "xuelingzhi", "zijinhua", "qiannianlingru"];
    const h = herbs[rand(0, realm.stage >= 3 ? 3 : 2)];
    give(h);
    logs.push(`一隻靈猴自林間擲來一株【${itemById(h).name}】,吱吱兩聲便竄得無影無蹤。`);
    return;
  }
  if (roll < 0.095) {
    const lost = Math.floor(get().stones * 0.1);
    set({ stones: get().stones - lost });
    logs.push(`一名遊方散修與你論道半日,臨別時你才發現儲物袋輕了——被順走了 ${lost} 靈石!`);
    return;
  }
  if (roll < 0.11) {
    const gain = Math.floor(realm.expNeed * 0.25);
    set({ exp: get().exp + gain });
    logs.push(`荒亭避雨,偶遇一位白髮老道與你手談一局。局終人杳,棋盤上殘留一縷道韻——修為 +${gain}。`);
    return;
  }
  if (roll < 0.125 && realm.stage >= 3) {
    give("dahuandan");
    logs.push("你救下一名被妖獸圍攻的散修,對方傾囊相贈一枚【大還丹】,拱手而別。");
    return;
  }
  if (roll < 0.14 && realm.stage >= 4) {
    const pool = ["m_aohan", "m_dageng", "m_yuanci"];
    const m = pool[rand(0, realm.stage >= 5 ? 2 : 1)];
    give(m);
    logs.push(`地動山搖,一座上古洞府破土而出!你搶在群修之前取走【${itemById(m).name}】,遁光而去。`);
    return;
  }
  // 延壽極品:總計約 1.2% 機率,愈稀有愈難得
  if (roll < 0.148) {
    give("wanshoudan");
    logs.push("你於一處無名廢墟中掘出一只丹盒,盒中靜臥一枚【萬壽丹】——延壽百載的奇丹!");
    return;
  }
  if (roll < 0.151) {
    give("yanshouguo");
    logs.push("懸崖之下異香撲鼻——竟是一株萬載一熟的【延壽果】!你顫抖著雙手將其摘下。");
    return;
  }
  if (roll < 0.152 && realm.stage >= 5) {
    give("panlongtao");
    logs.push("九天之上仙音縹緲,一枚龍紋壽桃自雲端墜落,正落你掌心——【蟠龍壽桃】!此乃仙界之物!");
  }
}

function monsterTurn(s: GameState, set: (p: Partial<GameState>) => void, logs: string[]) {
  if (!s.combat) return;
  const mon = monsterById(s.combat.monsterId);
  const { def, hpMax } = playerStats(s);
  const dmg = Math.max(1, rand(Math.floor(mon.atk * 0.8), Math.floor(mon.atk * 1.2)) - def);
  const hp = s.hp - dmg;
  logs.push(`${mon.name} 反擊,你受到 ${dmg} 點傷害。`);
  if (hp <= 0) {
    // 戰敗:損失一半靈石,退出戰鬥,半血復原
    const lost = Math.floor(s.stones / 2);
    logs.push(`你身受重傷不敵,倉皇遁走…… 遺失了 ${lost} 靈石。`);
    set({
      hp: Math.max(1, Math.floor(hpMax * 0.3)),
      stones: s.stones - lost,
      combat: null,
    });
  } else {
    set({ hp });
  }
}

function winCombat(s: GameState, set: (p: Partial<GameState>) => void, logs: string[]) {
  const mon = monsterById(s.combat!.monsterId);
  const stones = rand(mon.stones[0], mon.stones[1]);
  const inv = { ...s.inventory };
  const dropNames: string[] = [];
  for (const d of mon.drops) {
    if (Math.random() < d.chance) {
      inv[d.id] = (inv[d.id] ?? 0) + 1;
      dropNames.push(itemById(d.id).name);
    }
  }
  logs.push(`你擊殺了 ${mon.name}!獲得修為 ${mon.exp}、靈石 ${stones}${dropNames.length ? ",拾得:" + dropNames.join("、") : ""}。`);
  const kills = { ...s.kills, [mon.id]: (s.kills[mon.id] ?? 0) + 1 };
  set({
    exp: s.exp + mon.exp,
    stones: s.stones + stones,
    inventory: inv,
    combat: null,
    kills,
  });
}

function pushLogs(get: () => GameState, set: (p: Partial<GameState>) => void, logs: string[]) {
  if (!logs.length) return;
  const cur = get().log;
  set({ log: [...cur, ...logs].slice(-MAX_LOG) });
}

export const useGame = create<GameState>()(
  persist(
    (set, get) => ({
      started: false,
      name: "",
      sectId: null,
      realmIdx: 0,
      exp: 0,
      hp: 60,
      mp: 30,
      stones: 20,
      inventory: { huanglongdan: 2, liaoshangdan: 1 },
      learned: [],
      equippedWeapon: null,
      equippedArmor: null,
      log: [],
      combat: null,
      kills: {},
      seen: [],
      hasVial: false,
      vialCharge: 0,
      missionId: null,
      missionBase: 0,
      age: 16,
      lifeBonus: 0,
      day: 1,
      cultToday: 0,
      dead: false,

      addLog: (msg) => pushLogs(get, set, [msg]),

      startGame: (name, sectId) => {
        const sect = SECTS.find((x) => x.id === sectId)!;
        const tech = techById(sect.startTech);
        set({
          started: true,
          name: name || "韓立",
          sectId,
          learned: [sect.startTech],
        });
        const s = get();
        const { hpMax, mpMax } = playerStats(s);
        set({ hp: hpMax, mp: mpMax });
        pushLogs(get, set, [
          `${name || "韓立"} 拜入 ${sect.name},自此踏上修仙之路。`,
          `長老傳授入門仙法:${tech.name}。`,
          `身上僅有 20 枚靈石與幾瓶丹藥,前路漫漫,道阻且長。`,
        ]);
      },

      cultivate: () => {
        const s = get();
        if (s.combat || s.dead) return;
        if (s.cultToday >= 3) {
          pushLogs(get, set, ["今日心神已竭,再修無益。且調息一日,養精蓄銳。"]);
          return;
        }
        const { realm, sect, hpMax, mpMax } = playerStats(s);
        // 收益隨境界放大:每一小階約 20 次打坐
        const base = realm.expNeed * (0.04 + Math.random() * 0.03);
        const gain = Math.max(1, Math.floor(base * (1 + (sect?.bonus.exp ?? 0) / 100)));
        const heal = Math.floor(hpMax * 0.15);
        const mpGain = Math.floor(mpMax * 0.25);
        set({
          exp: s.exp + gain,
          hp: Math.min(hpMax, s.hp + heal),
          mp: Math.min(mpMax, s.mp + mpGain),
          vialCharge: s.hasVial ? Math.min(3, s.vialCharge + 1) : 0,
          cultToday: s.cultToday + 1,
        });
        const logs = [`你盤膝打坐,吐納靈氣,修為 +${gain}(今日 ${s.cultToday + 1}/3)。`];
        maybeEncounter(get, set, logs);
        pushLogs(get, set, logs);
      },

      restDay: () => {
        const s = get();
        if (s.combat || s.dead) return;
        const age = s.age + 10;
        const cap = maxLife(s);
        const { hpMax, mpMax } = playerStats(s);
        if (age >= cap) {
          set({ age: cap, dead: true, combat: null });
          pushLogs(get, set, [
            `枯坐洞府,你忽覺經脈枯涸,鏡中鬢髮霜白——壽元已盡。`,
            `享年 ${cap} 載,道隕於【${REALMS[s.realmIdx].name}】。仙路無情,一步遲,步步遲。`,
          ]);
          return;
        }
        set({ age, day: s.day + 1, cultToday: 0, hp: hpMax, mp: mpMax });
        pushLogs(get, set, [`你閉關調息一日,氣血仙靈力盡復,修煉之機重聚。歲月如梭,壽元又逝十載(${age}/${cap})。`]);
      },

      breakthrough: () => {
        const s = get();
        if (s.combat || s.dead) return;
        const realm = REALMS[s.realmIdx];
        if (s.realmIdx >= REALMS.length - 1) {
          pushLogs(get, set, ["你已白日飛昇,位列仙班。仙界的故事,是另一部書了……"]);
          return;
        }
        if (s.exp < realm.expNeed) {
          pushLogs(get, set, [`修為不足,突破 ${REALMS[s.realmIdx + 1].name} 需 ${realm.expNeed} 修為(現有 ${s.exp})。`]);
          return;
        }
        if (Math.random() < realm.breakChance) {
          const next = REALMS[s.realmIdx + 1];
          set({ realmIdx: s.realmIdx + 1, exp: s.exp - realm.expNeed });
          const ns = get();
          const { hpMax, mpMax } = playerStats(ns);
          set({ hp: hpMax, mp: mpMax });
          if (next.stage === 10) {
            pushLogs(get, set, [
              "九霄之上雷雲翻湧,萬丈金光自天門傾瀉——你踏碎虛空,白日飛昇!",
              "自山村凡童至真仙之軀,這一步,你走了一生。《凡人修仙傳》,至此功德圓滿。",
            ]);
          } else if (next.stage > realm.stage) {
            const gift = Math.floor(next.lifespan * 0.1);
            set({ lifeBonus: get().lifeBonus + gift });
            pushLogs(get, set, [
              `天地色變,靈氣如百川歸海——你渡過大關,晉入【${next.name}】!`,
              `脫胎換骨,壽元上限升至 ${next.lifespan} 載,更額外增壽 ${gift} 載。`,
            ]);
          } else {
            pushLogs(get, set, [`靈氣灌體,經脈轟鳴——你成功突破至【${next.name}】!氣血仙靈力盡復。`]);
          }
        } else {
          const lost = Math.floor(realm.expNeed * 0.2);
          set({ exp: Math.max(0, s.exp - lost) });
          const isMajor = s.realmIdx % 3 === 2 || realm.id === "dujie";
          pushLogs(get, set, [
            `突破失敗!靈氣暴走,修為損失 ${lost}。` +
              (isMajor
                ? `大關未破,壽元仍困於【${realm.name}】之限(${maxLife(get())} 載)——壽關迫近,不可不慎。`
                : "穩固心境,再接再厲。"),
          ]);
        }
      },

      gather: (locationId) => {
        const s = get();
        if (s.combat || s.dead) return;
        const loc = LOCATIONS.find((l) => l.id === locationId)!;
        const { realm } = playerStats(s);
        if (realm.stage < loc.reqStage) {
          pushLogs(get, set, [`${loc.name} 兇險異常,以你現在的境界踏入必死無疑。`]);
          return;
        }
        const logs: string[] = [];
        const inv = { ...s.inventory };
        // 遇襲機率 35%
        if (Math.random() < 0.35 && loc.monsters.length) {
          const mid = loc.monsters[rand(0, loc.monsters.length - 1)];
          const mon = monsterById(mid);
          set({ combat: { monsterId: mid, monsterHp: mon.hp, locationId } });
          markSeen(get, set, mid);
          pushLogs(get, set, [`你在 ${loc.name} 採集時,${mon.name} 突然襲來!`]);
          return;
        }
        const pool = [...loc.materials, ...loc.herbs];
        const found: string[] = [];
        const n = rand(1, 2);
        for (let i = 0; i < n; i++) {
          const id = pool[rand(0, pool.length - 1)];
          inv[id] = (inv[id] ?? 0) + 1;
          found.push(itemById(id).name);
        }
        if (Math.random() < loc.manualChance && loc.manuals.length) {
          const mid = loc.manuals[rand(0, loc.manuals.length - 1)];
          inv[mid] = (inv[mid] ?? 0) + 1;
          logs.push(`石壁之後竟藏有一部【${itemById(mid).name}】!天大機緣!`);
        }
        logs.unshift(`你在 ${loc.name} 仔細搜尋,採得:${found.join("、")}。`);
        set({ inventory: inv, vialCharge: s.hasVial ? Math.min(3, s.vialCharge + 1) : 0 });
        maybeEncounter(get, set, logs);
        pushLogs(get, set, logs);
      },

      startHunt: (locationId) => {
        const s = get();
        if (s.combat || s.dead) return;
        const loc = LOCATIONS.find((l) => l.id === locationId)!;
        const { realm } = playerStats(s);
        if (realm.stage < loc.reqStage) {
          pushLogs(get, set, [`${loc.name} 兇險異常,以你現在的境界踏入必死無疑。`]);
          return;
        }
        const mid = loc.monsters[rand(0, loc.monsters.length - 1)];
        const mon = monsterById(mid);
        set({ combat: { monsterId: mid, monsterHp: mon.hp, locationId } });
        markSeen(get, set, mid);
        pushLogs(get, set, [`你主動深入 ${loc.name} 尋妖,遭遇了 ${mon.name}(${mon.element}屬性)!`]);
      },

      castTech: (techId) => {
        const s = get();
        if (!s.combat) return;
        const tech = techById(techId);
        if (s.mp < tech.mpCost) {
          pushLogs(get, set, [`仙靈力不足,無法施展 ${tech.name}(需 ${tech.mpCost})。`]);
          return;
        }
        const mon = monsterById(s.combat.monsterId);
        const { atk } = playerStats(s);
        const mult = elementMult(tech.element, mon.element);
        const dmg = Math.max(1, Math.floor(atk * tech.power * mult * (0.9 + Math.random() * 0.2)));
        const logs: string[] = [];
        logs.push(
          `你施展【${tech.name}】,對 ${mon.name} 造成 ${dmg} 傷害` +
            (mult > 1 ? "(五行相剋,威力大增!)" : mult < 1 ? "(屬性被剋,威力受阻)" : "") + "。"
        );
        const newHp = s.combat.monsterHp - dmg;
        set({ mp: s.mp - tech.mpCost });
        if (newHp <= 0) {
          winCombat(get(), set, logs);
        } else {
          set({ combat: { ...s.combat, monsterHp: newHp } });
          monsterTurn(get(), set, logs);
        }
        pushLogs(get, set, logs);
      },

      attackBasic: () => {
        const s = get();
        if (!s.combat) return;
        const mon = monsterById(s.combat.monsterId);
        const { atk, weaponEl } = playerStats(s);
        const mult = elementMult(weaponEl, mon.element);
        const dmg = Math.max(1, Math.floor(atk * mult * (0.85 + Math.random() * 0.3)));
        const logs: string[] = [`你御使法器直取要害,對 ${mon.name} 造成 ${dmg} 傷害。`];
        const newHp = s.combat.monsterHp - dmg;
        if (newHp <= 0) {
          winCombat(get(), set, logs);
        } else {
          set({ combat: { ...s.combat, monsterHp: newHp } });
          monsterTurn(get(), set, logs);
        }
        pushLogs(get, set, logs);
      },

      flee: () => {
        const s = get();
        if (!s.combat) return;
        const mon = monsterById(s.combat.monsterId);
        if (Math.random() < 0.6) {
          set({ combat: null });
          pushLogs(get, set, [`你祭出遁光,成功從 ${mon.name} 爪下逃離。`]);
        } else {
          const logs: string[] = [`遁走失敗!`];
          monsterTurn(get(), set, logs);
          pushLogs(get, set, logs);
        }
      },

      useItem: (itemId) => {
        const s = get();
        const item = itemById(itemId);
        if ((s.inventory[itemId] ?? 0) <= 0) return;
        const { hpMax, mpMax, realm } = playerStats(s);
        const inv = { ...s.inventory };
        const logs: string[] = [];

        if (item.kind === "manual" && item.teaches) {
          if (s.learned.includes(item.teaches)) {
            pushLogs(get, set, [`你已參透此篇仙法,無需再讀。`]);
            return;
          }
          const tech = techById(item.teaches);
          if (realm.stage < tech.reqStage) {
            pushLogs(get, set, [`【${tech.name}】玄奧非常,以你現在的境界難以參悟(需更高境界)。`]);
            return;
          }
          inv[itemId] -= 1;
          if (inv[itemId] <= 0) delete inv[itemId];
          set({ inventory: inv, learned: [...s.learned, item.teaches] });
          pushLogs(get, set, [`你閉關七日,參悟【${itemById(itemId).name}】,習得仙法:${tech.name}!`]);
          return;
        }

        if (item.kind === "artifact" || item.kind === "treasure") {
          get().equip(itemId);
          return;
        }

        inv[itemId] -= 1;
        if (inv[itemId] <= 0) delete inv[itemId];
        const patch: Partial<GameState> = { inventory: inv };
        const effects: string[] = [];
        if (item.heal) { patch.hp = Math.min(hpMax, s.hp + item.heal); effects.push(`回復氣血 ${item.heal}`); }
        if (item.mp) { patch.mp = Math.min(mpMax, s.mp + item.mp); effects.push(`回復仙靈力 ${item.mp}`); }
        if (item.exp) { patch.exp = s.exp + item.exp; effects.push(`修為 +${item.exp}`); }
        if (item.life) { patch.lifeBonus = s.lifeBonus + item.life; effects.push(`壽元 +${item.life} 載`); }
        set(patch);
        logs.push(`你服下 ${item.name},${effects.join(",")}。`);
        pushLogs(get, set, logs);
      },

      buyItem: (itemId) => {
        const s = get();
        const item = itemById(itemId);
        if (s.stones < item.price) {
          pushLogs(get, set, [`靈石不足,${item.name} 需 ${item.price} 靈石。`]);
          return;
        }
        const inv = { ...s.inventory };
        inv[itemId] = (inv[itemId] ?? 0) + 1;
        set({ stones: s.stones - item.price, inventory: inv });
        pushLogs(get, set, [`坊市購入 ${item.name},花費 ${item.price} 靈石。`]);
      },

      sellItem: (itemId) => {
        const s = get();
        if ((s.inventory[itemId] ?? 0) <= 0) return;
        const item = itemById(itemId);
        const gain = Math.max(1, Math.floor(item.price * 0.6));
        const inv = { ...s.inventory };
        inv[itemId] -= 1;
        if (inv[itemId] <= 0) delete inv[itemId];
        if (s.equippedWeapon === itemId && !(inv[itemId] > 0)) set({ equippedWeapon: null });
        if (s.equippedArmor === itemId && !(inv[itemId] > 0)) set({ equippedArmor: null });
        set({ stones: s.stones + gain, inventory: inv });
        pushLogs(get, set, [`售出 ${item.name},得 ${gain} 靈石。`]);
      },

      craft: (recipeId) => {
        const s = get();
        const rec = RECIPES.find((x) => x.id === recipeId)!;
        if (s.stones < rec.stones) {
          pushLogs(get, set, [`煉製 ${rec.name} 需 ${rec.stones} 靈石作爐火之資,靈石不足。`]);
          return;
        }
        for (const m of rec.materials) {
          if ((s.inventory[m.id] ?? 0) < m.n) {
            pushLogs(get, set, [`材料不足:煉製 ${rec.name} 需 ${itemById(m.id).name} ×${m.n}。`]);
            return;
          }
        }
        const inv = { ...s.inventory };
        for (const m of rec.materials) {
          inv[m.id] -= m.n;
          if (inv[m.id] <= 0) delete inv[m.id];
        }
        inv[rec.result] = (inv[rec.result] ?? 0) + 1;
        set({ stones: s.stones - rec.stones, inventory: inv });
        pushLogs(get, set, [`爐火純青,三日三夜——你成功煉製出法器【${rec.name}】!`]);
      },

      equip: (itemId) => {
        const s = get();
        const item = itemById(itemId);
        if ((s.inventory[itemId] ?? 0) <= 0) return;
        if (item.kind === "artifact") {
          set({ equippedWeapon: itemId });
          pushLogs(get, set, [`你將【${item.name}】祭於身前,攻伐之力大增。`]);
        } else if (item.kind === "treasure") {
          set({ equippedArmor: itemId });
          pushLogs(get, set, [`你將【${item.name}】穿戴護身。`]);
        }
      },

      useVial: () => {
        const s = get();
        if (!s.hasVial || s.combat) return;
        if (s.vialCharge < 3) {
          pushLogs(get, set, [`小綠瓶內液珠尚未凝滿(${s.vialCharge}/3)。修煉、採集皆可蘊養瓶靈。`]);
          return;
        }
        const { realm } = playerStats(s);
        const gain = Math.floor(realm.expNeed * 0.35);
        const inv = { ...s.inventory };
        // 綠液催熟:隨機催生一株仙草;5% 機率竟催熟出延壽果
        if (Math.random() < 0.05) {
          inv.yanshouguo = (inv.yanshouguo ?? 0) + 1;
          set({ vialCharge: 0, exp: s.exp + gain, inventory: inv });
          pushLogs(get, set, [
            `子夜時分,綠液滴落——藥圃中竟結出一枚【延壽果】!瓶中造化,奪天地壽數!修為 +${gain}。`,
          ]);
          return;
        }
        const herbs = ["zhuguo", "xuelingzhi", "zijinhua", "tianlingguo"];
        const herb = Math.random() < 0.15 ? "tianlingguo" : herbs[rand(0, 2)];
        inv[herb] = (inv[herb] ?? 0) + 1;
        set({ vialCharge: 0, exp: s.exp + gain, inventory: inv });
        pushLogs(get, set, [
          `子夜時分,小綠瓶降下一滴綠液——藥圃靈草瞬息百年!催熟得【${itemById(herb).name}】,參悟造化,修為 +${gain}。`,
        ]);
      },

      acceptMission: (id) => {
        const s = get();
        if (s.missionId) {
          pushLogs(get, set, ["你已領有宗門任務,須先完成或放棄。"]);
          return;
        }
        const m = MISSIONS.find((x) => x.id === id)!;
        const base = m.kind === "kill" ? (s.kills[m.targetId] ?? 0) : 0;
        set({ missionId: id, missionBase: base });
        pushLogs(get, set, [`你在執事堂領取任務【${m.name}】:${m.desc}`]);
      },

      completeMission: () => {
        const s = get();
        if (!s.missionId) return;
        const m = MISSIONS.find((x) => x.id === s.missionId)!;
        const logs: string[] = [];
        if (m.kind === "kill") {
          const done = (s.kills[m.targetId] ?? 0) - s.missionBase;
          if (done < m.n) {
            pushLogs(get, set, [`任務未竟:已獵殺 ${done}/${m.n}。`]);
            return;
          }
          set({ missionId: null, missionBase: 0 });
        } else {
          if ((s.inventory[m.targetId] ?? 0) < m.n) {
            pushLogs(get, set, [`任務未竟:${itemById(m.targetId).name} ${s.inventory[m.targetId] ?? 0}/${m.n}。`]);
            return;
          }
          const inv = { ...s.inventory };
          inv[m.targetId] -= m.n;
          if (inv[m.targetId] <= 0) delete inv[m.targetId];
          set({ inventory: inv, missionId: null, missionBase: 0 });
        }
        const s2 = get();
        const inv2 = { ...s2.inventory };
        let bonus = "";
        if (m.item) {
          inv2[m.item] = (inv2[m.item] ?? 0) + 1;
          bonus = `,另賜【${itemById(m.item).name}】`;
        }
        set({ stones: s2.stones + m.stones, exp: s2.exp + m.exp, inventory: inv2 });
        logs.push(`任務【${m.name}】完成!執事堂發放靈石 ${m.stones}、修為 ${m.exp}${bonus}。`);
        pushLogs(get, set, logs);
      },

      abandonMission: () => {
        const s = get();
        if (!s.missionId) return;
        const m = MISSIONS.find((x) => x.id === s.missionId)!;
        set({ missionId: null, missionBase: 0 });
        pushLogs(get, set, [`你放棄了任務【${m.name}】,執事一臉不悅。`]);
      },

      resetGame: () => {
        set({
          started: false, name: "", sectId: null, realmIdx: 0, exp: 0,
          hp: 60, mp: 30, stones: 20,
          inventory: { huanglongdan: 2, liaoshangdan: 1 },
          learned: [], equippedWeapon: null, equippedArmor: null,
          log: [], combat: null,
          kills: {}, seen: [], hasVial: false, vialCharge: 0,
          missionId: null, missionBase: 0,
          age: 16, lifeBonus: 0, day: 1, cultToday: 0, dead: false,
        });
      },
    }),
    {
      name: "fanren-save",
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export { playerStats };
