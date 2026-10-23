// 通天閣真仙 PvP(3.19 版新增,3.19.1 改為先後手回合制)——設計說明:
// 這是獨立於主線 PvE 戰鬥(SaveData.combat)的另一套對戰引擎,狀態存在 pvp_matches.state,
// 不寫回玩家本體存檔,不影響 PvE 進度。玩家指定「其他都跟挑戰怪物一樣」,所以這裡刻意共用 engine.ts
// 匯出的同一套狀態效果邏輯(applyStatus/decrementStatus/atkMultFromStatus/tickDot/STATUS_BY_ELEMENT)、
// 同一套 elementMult 五行相剋,以及跟 castBatch 相同的符寶連攜公式(synergyPct/comboSizePct/
// crossElementPct/manaGain/shieldPct/forceStatus/selfCleanse/selfStatus evade/chargeNextTurnPct/
// nextPlayBuffPct/lifeStealPct/soloOnly/endsTurn)。跟 PvE 不同的地方只有一點:PvE 是「玩家連續
// 出牌 → 回合結束 → 怪物固定公式反擊一次」,PvP 是貨真價實的先手/後手——雙方各自輪流拿到一個完整
// 回合(可連續出牌直到主動結束回合、法力耗盡、或打出終結技),沒有回合的一方只能等待。
// 因為對戰雙方都是「玩家」而非怪物,defender 沒有天生的五行屬性可供相剋判定——這裡以 defender 目前
// 裝備的法器/符籙屬性(weaponEl)充當防禦方的「元素」,沒裝備則視為「無」,套用同一份 elementMult。
import { Element, Technique } from "./types";
import { techById } from "./data/techniques";
import {
  techPowerMult,
  techLevelOf,
  statsOf,
  effectivePouch,
  HAND_SIZE,
  SYNERGY_STACK_CAP,
  COMBO_SIZE_STACK_CAP,
  elementMult,
  StatusEffect,
  applyStatus,
  decrementStatus,
  hasStatus,
  atkMultFromStatus,
  tickDot,
  STATUS_BY_ELEMENT,
  STATUS_LABEL,
  STATUS_PROC_CHANCE,
  STATUS_DURATION,
  FREEZE_DURATION,
} from "./engine";
import type { SaveData } from "./engine";

export const PVP_DAMAGE_MULT = 0.05; // 通天閣傷害降為 20 分之一
export const PVP_TURN_SECONDS = 20; // 每回合思考時間

export interface PvpFighter {
  userId: number;
  name: string;
  hp: number;
  hpMax: number;
  mp: number;
  mpMax: number;
  atk: number;
  weaponEl?: Element;
  techLevels: Record<string, number>;
  deck: string[];
  hand: string[];
  discard: string[];
  status: StatusEffect[]; // 燒傷/中毒/冰封/虛弱/縹緲,跟 PvE 完全共用同一套
  shield: number;
  pendingElementBuff?: { element: Element; pct: number };
  pendingChargeBuffPct?: number;
  activeChargeBuffPct?: number;
}

export interface PvpMatchState {
  turn: number; // 目前是第幾個回合(雙方輪流各占一個回合數)
  turnUserId: number; // 目前輪到誰的回合
  firstUserId: number; // 先手(挑戰發起方)
  fighters: [PvpFighter, PvpFighter];
  log: string[];
  winnerId?: number | null; // 對戰結束時才會有值;null = 平手(同一時間點雙方皆陣亡)
}

function shuffled<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function drawCards(deckIn: string[], discardIn: string[], n: number) {
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

// 以玩家目前存檔快照建立一名 PvP 參戰者:攻擊/氣血/法力/符寶袋/法器屬性皆取當下數值,凍結於這場
// 對戰,不會因為對戰途中本體存檔變動(理論上不會,PvP 進行中本體無法行動)而跑掉。
export function buildPvpFighter(userId: number, name: string, s: SaveData): PvpFighter {
  const { atk, hpMax, mpMax, weaponEl } = statsOf(s);
  const pouch = effectivePouch(s);
  const deck = shuffled(pouch.length > 0 ? pouch : ["spell_attack"]);
  const hand = deck.splice(0, HAND_SIZE);
  const techLevels: Record<string, number> = {};
  for (const id of new Set(pouch)) techLevels[id] = techLevelOf(s, id);
  return {
    userId,
    name,
    hp: hpMax,
    hpMax,
    mp: mpMax,
    mpMax,
    atk,
    weaponEl,
    techLevels,
    deck,
    hand,
    discard: [],
    status: [],
    shield: 0,
  };
}

export function newMatch(a: PvpFighter, b: PvpFighter): PvpMatchState {
  return {
    turn: 1,
    turnUserId: a.userId,
    firstUserId: a.userId,
    fighters: [a, b],
    log: [`對戰開始!${a.name} 是先手,${b.name} 是後手。`],
  };
}

function other(state: PvpMatchState, userId: number): PvpFighter {
  return state.fighters.find((f) => f.userId !== userId)!;
}
function mine(state: PvpMatchState, userId: number): PvpFighter {
  return state.fighters.find((f) => f.userId === userId)!;
}

// 出一批符寶(比照 castBatch 的核心公式)。回傳是否真的施展成功——法力不足/違規合併時回傳 false,
// 呼叫端(playMove)必須看這個回傳值才能決定要不要把這些牌移出手牌、送進棄牌堆(失敗時牌要留著,
// 不能白白棄掉玩家根本沒打出去的符寶)。呼叫端已確保現在真的輪到 attacker 的回合、attacker 沒有冰封。
function resolveBatch(state: PvpMatchState, attacker: PvpFighter, defender: PvpFighter, ids: string[]): boolean {
  const techs = ids.map((id) => techById(id));
  const totalCost = techs.reduce((sum, t) => sum + t.mpCost, 0);
  if (totalCost > attacker.mp) {
    state.log.push(`${attacker.name} 法力不足,這次出牌未能施展。`);
    return false;
  }
  if (techs.length > 1 && techs.some((t) => t.soloOnly)) {
    state.log.push(`${attacker.name} 嘗試合併打出限單獨施展的符寶,未能成功。`);
    return false;
  }
  attacker.mp -= totalCost;

  const elemsOf = (t: Technique): Element[] => [t.element, ...(t.extraElements ?? [])];
  const elementCounts = new Map<Element, number>();
  for (const t of techs) for (const el of elemsOf(t)) elementCounts.set(el, (elementCounts.get(el) ?? 0) + 1);
  const distinctElementCount = elementCounts.size;
  const buff = attacker.pendingElementBuff;

  let rawPower = 0;
  let bestMult = 1;
  for (const t of techs) {
    const level = attacker.techLevels[t.id] ?? 1;
    let p = t.power * techPowerMult(level);
    // 5.0 版合併:與 PvE(engine.ts castBatch)同步套用 4.0 版的連攜疊加封頂
    if (t.synergyPct) p *= 1 + t.synergyPct * Math.min(SYNERGY_STACK_CAP, elementCounts.get(t.element) ?? 1);
    if (t.comboSizePct) p *= 1 + t.comboSizePct * Math.min(COMBO_SIZE_STACK_CAP, techs.length - 1);
    if (t.crossElementPct) p *= 1 + t.crossElementPct * (distinctElementCount - 1);
    if (buff && buff.element === t.element) p *= 1 + buff.pct;
    const mult = Math.max(...elemsOf(t).map((el) => elementMult(el, defender.weaponEl ?? "無")));
    if (Math.abs(mult - 1) > Math.abs(bestMult - 1)) bestMult = mult;
    p *= mult;
    if (attacker.activeChargeBuffPct) p *= 1 + attacker.activeChargeBuffPct;
    rawPower += p;
  }
  if (buff) attacker.pendingElementBuff = undefined;

  const manaGainSum = techs.reduce((sum, t) => sum + (t.manaGain ?? 0), 0);
  if (manaGainSum > 0) attacker.mp = Math.min(attacker.mpMax, attacker.mp + manaGainSum);

  const buffGivers = techs.filter((t) => t.nextPlayBuffPct);
  if (buffGivers.length > 0) {
    const strongest = buffGivers.reduce((a2, b2) => (b2.nextPlayBuffPct! > a2.nextPlayBuffPct! ? b2 : a2));
    attacker.pendingElementBuff = { element: strongest.element, pct: strongest.nextPlayBuffPct! };
  }
  const shieldGain = techs.reduce((sum, t) => sum + (t.shieldPct ? Math.floor(attacker.hpMax * t.shieldPct) : 0), 0);
  if (shieldGain > 0) attacker.shield += shieldGain;
  const chargeGain = techs.reduce((sum, t) => sum + (t.chargeNextTurnPct ?? 0), 0);
  if (chargeGain > 0) attacker.pendingChargeBuffPct = (attacker.pendingChargeBuffPct ?? 0) + chargeGain;
  if (techs.some((t) => t.selfStatus === "evade")) {
    attacker.status = applyStatus(attacker.status, "evade", 1);
  }
  if (techs.some((t) => t.selfCleanse)) {
    attacker.status = attacker.status.filter((e) => e.kind === "evade");
  }

  const names = techs.map((t) => t.name).join("、");

  // 縹緲(selfStatus:"evade"):保證避過對方下一次攻擊,用掉即消,優先於傷害結算。
  if (hasStatus(defender.status, "evade")) {
    defender.status = decrementStatus(defender.status, "evade");
    state.log.push(`${attacker.name} 施展【${names}】,但 ${defender.name} 身形縹緲,穩穩避開了這一擊!`);
  } else {
    const weaken = atkMultFromStatus(attacker.status);
    const dmg = Math.max(1, Math.floor(attacker.atk * rawPower * PVP_DAMAGE_MULT * weaken * (0.9 + Math.random() * 0.2)));
    const absorbed = Math.min(defender.shield, dmg);
    defender.shield -= absorbed;
    const dmgAfterShield = dmg - absorbed;
    defender.hp = Math.max(0, defender.hp - dmgAfterShield);

    let statusNote = "";
    for (const t of techs) {
      if (t.forceStatus) {
        defender.status = applyStatus(defender.status, t.forceStatus, t.forceStatus === "freeze" ? FREEZE_DURATION : STATUS_DURATION);
        statusNote += `,${defender.name} 因此${STATUS_LABEL[t.forceStatus]}!`;
        continue;
      }
      const kind = STATUS_BY_ELEMENT[t.element];
      if (kind && Math.random() < STATUS_PROC_CHANCE) {
        defender.status = applyStatus(defender.status, kind, kind === "freeze" ? FREEZE_DURATION : STATUS_DURATION);
        statusNote += `,${defender.name} 因此${STATUS_LABEL[kind]}!`;
      }
    }
    const lifeStealSum = techs.reduce((sum, t) => sum + (t.lifeStealPct ?? 0), 0);
    if (lifeStealSum > 0) {
      const heal = Math.max(0, Math.floor(dmgAfterShield * lifeStealSum));
      if (heal > 0) attacker.hp = Math.min(attacker.hpMax, attacker.hp + heal);
    }
    state.log.push(
      `${attacker.name} 施展【${names}】,對 ${defender.name} 造成 ${dmgAfterShield} 傷害` +
        (absorbed > 0 ? `(護盾抵擋 ${absorbed})` : "") +
        (bestMult > 1 ? "(五行相剋!)" : bestMult < 1 ? "(屬性被剋)" : "") +
        statusNote +
        "。",
    );
  }

  if (defender.hp <= 0) {
    state.winnerId = attacker.hp > 0 ? attacker.userId : null;
  } else if (attacker.hp <= 0) {
    state.winnerId = null;
  }
  return true;
}

// 玩家在自己的回合內出一批牌(不結束回合,除非批次含終結技或法力已耗盡)。
export function playMove(state: PvpMatchState, userId: number, techIds: string[]): PvpMatchState {
  if (state.winnerId !== undefined) return state;
  if (state.turnUserId !== userId) return state; // 不是你的回合,忽略
  const attacker = mine(state, userId);
  const defender = other(state, userId);
  const handCopy = [...attacker.hand];
  for (const id of techIds) {
    const idx = handCopy.indexOf(id);
    if (idx === -1) return state; // 手牌裡沒有這張,忽略整批(前端應先擋下)
    handCopy.splice(idx, 1);
  }
  if (techIds.length === 0) return state;
  const cast = resolveBatch(state, attacker, defender, techIds);
  if (!cast) return state; // 法力不足/違規合併:不消耗手牌,讓玩家可以重新選擇
  attacker.hand = handCopy;
  attacker.discard = [...attacker.discard, ...techIds];
  const techs = techIds.map((id) => techById(id));
  if (state.winnerId !== undefined || attacker.mp <= 0 || techs.some((t) => t.endsTurn)) {
    return endTurn(state);
  }
  return state;
}

// 主動結束回合,或逾時/冰封被迫結束回合時呼叫。處理:自身燒傷/中毒持續傷害 → 判定死亡 →
// 重抽手牌、蓄力連攜生效、交棒給對方 → 若對方冰封則直接連續跳過對方整個回合(改回自己)。
export function endTurn(state: PvpMatchState): PvpMatchState {
  if (state.winnerId !== undefined) return state;
  let current = mine(state, state.turnUserId);

  // 保險上限,避免理論上不該發生的雙方永久冰封造成無窮迴圈
  for (let guard = 0; guard < 4; guard++) {
    const tick = tickDot(current.status, current.hpMax);
    current.status = tick.list;
    if (tick.dmg > 0) {
      current.hp = Math.max(0, current.hp - tick.dmg);
      state.log.push(`${current.name} 因${tick.labels.join("、")}持續受創!`);
      if (current.hp <= 0) {
        state.winnerId = other(state, current.userId).hp > 0 ? other(state, current.userId).userId : null;
        return state;
      }
    }
    const redraw = drawCards(current.deck, [...current.discard, ...current.hand], HAND_SIZE);
    current.hand = redraw.drawn;
    current.deck = redraw.deck;
    current.discard = redraw.discard;
    current.activeChargeBuffPct = current.pendingChargeBuffPct ?? 0;
    current.pendingChargeBuffPct = 0;

    const next = other(state, current.userId);
    state.turnUserId = next.userId;
    state.turn += 1;
    // 5.0 版修正:比照 PvE(每回合結束法力回滿),輪到的一方法力回滿。3.19 原版沒有回復,
    // 雙方約 15 回合後法力見底、再也出不了牌,對戰只能靠逾時無限換手、永遠打不完。
    next.mp = next.mpMax;

    if (hasStatus(next.status, "freeze")) {
      next.status = decrementStatus(next.status, "freeze");
      state.log.push(`輪到 ${next.name} 的回合,但深陷冰封,動彈不得,直接換手!`);
      current = next; // 換這位被冰封的人跑一次「結束回合」流程(重抽/交棒),但不能出牌
      continue;
    }
    break;
  }
  return state;
}

export function isMatchOver(state: PvpMatchState): boolean {
  return state.winnerId !== undefined;
}
