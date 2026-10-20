// 測試共用工具。不是遊戲邏輯,純粹服務 __tests__ 底下的測試檔案。
import { newSave } from "../engine";
import type { SaveData } from "../engine";
import { MONSTERS } from "../data/world";

/**
 * 佇列式 Math.random() 覆寫:依序回傳 seq 裡的值,用完則 fallback 0.5(不拋錯,避免測試因為
 * 呼叫次數差一次就整組炸掉)。回傳一個 restore() 函式,務必在測試結束(或 afterEach)呼叫,
 * 否則全域 Math.random 會一路污染到下一個測試檔案。
 */
export function mockRandom(seq: number[]): () => void {
  let i = 0;
  const original = Math.random;
  Math.random = () => (i < seq.length ? seq[i++] : 0.5);
  return () => {
    Math.random = original;
  };
}

/** 建一個已經在戰鬥中的存檔,供 castBatch/endTurn/useTacticCard 等動作直接測試,不必跑隨機遭遇流程。 */
export function freshCombatSave(
  sectId: string,
  monsterId: string,
  opts: { learned?: string[]; hand?: string[]; monsterHp?: number; mp?: number } = {},
): SaveData {
  const s = newSave("測試員", sectId);
  if (opts.learned) s.learned = opts.learned;
  s.mp = opts.mp ?? 999;
  s.stones = 1_000_000;
  const mon = MONSTERS.find((m) => m.id === monsterId);
  if (!mon) throw new Error(`測試用到了不存在的怪物 id:${monsterId}`);
  const hand = opts.hand ?? s.learned.slice(0, 6);
  s.combat = {
    monsterId,
    monsterHp: opts.monsterHp ?? mon.hp,
    locationId: "test",
    hand,
    deck: [],
    discard: [],
    monsterStatus: [],
    playerStatus: [],
  };
  return s;
}
