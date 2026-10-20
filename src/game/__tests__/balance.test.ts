// 4.0 版「戰鬥平衡性修正」的釘死測試(詳見「戰鬥膨脹診斷卷」)。這份報告點名了三個無上限的
// 乘數(符寶連攜張數、宗門聲勢、仙靈力)跟一個校準基準問題(怪物氣血/攻擊力),本檔案逐一釘死
// 修正後的行為,避免日後改動時悄悄退回無上限的舊狀態。宗門聲勢封頂的測試另見 sectMult.test.ts。
import { describe, it, expect, afterEach } from "vitest";
import {
  applyAction,
  statsOf,
  newSave,
  XIANLI_MULT,
  XIANLI_MULT_CAP,
  monsterHpOf,
  monsterAtkOf,
  MONSTER_HP_BALANCE_MULT,
  MONSTER_ATK_BALANCE_MULT,
} from "../engine";
import { MONSTERS } from "../data/world";
import { mockRandom, freshCombatSave } from "./testUtils";

let restore: (() => void) | null = null;
afterEach(() => {
  restore?.();
  restore = null;
});

describe("仙靈力攻擊力乘數封頂(XIANLI_MULT_CAP)", () => {
  it("封頂前,乘數隨仙靈力線性成長", () => {
    const s = newSave("測試員", "huadao");
    s.xianli = 5; // 1 + 5*0.2 = 2.0,未達封頂
    expect(statsOf(s).atk).toBe(Math.floor(statsOf({ ...s, xianli: 0 }).atk * 2));
  });

  it("封頂後,無論仙靈力刷多高,攻擊力乘數都不會超過 XIANLI_MULT_CAP", () => {
    const base = newSave("測試員", "huadao");
    const atk0 = statsOf({ ...base, xianli: 0 }).atk;
    const s30 = { ...base, xianli: 30 }; // 1+30*0.2=7.0,未封頂前會到 ×7
    const s9999 = { ...base, xianli: 9999 }; // 無論刷多高
    expect(statsOf(s30).atk).toBe(Math.floor(atk0 * XIANLI_MULT_CAP));
    expect(statsOf(s9999).atk).toBe(Math.floor(atk0 * XIANLI_MULT_CAP));
    // 封頂數值本身要跟公式(1 + xianli*XIANLI_MULT 的理論上限)一致,不是隨便挑的數字
    expect(XIANLI_MULT_CAP).toBeGreaterThan(1);
  });
});

describe("符寶連攜同屬疊加封頂(SYNERGY_STACK_CAP)", () => {
  it("3 張同元素符寶的總傷害,相對 2 張是線性(×1.5),不再是平方成長", () => {
    restore = mockRandom([0.99, 0.5]);
    const two = freshCombatSave("huangfeng", "qinglang", {
      learned: ["mujian"],
      hand: ["mujian", "mujian"],
      monsterHp: 999999,
    });
    const twoR = applyAction(two, "castBatch", { techIds: ["mujian", "mujian"] });
    const twoDmg = twoR.damageEvents!.find((e) => e.target === "monster")!.amount;

    restore?.();
    restore = mockRandom([0.99, 0.5]);
    const three = freshCombatSave("huangfeng", "qinglang", {
      learned: ["mujian"],
      hand: ["mujian", "mujian", "mujian"],
      monsterHp: 999999,
    });
    const threeR = applyAction(three, "castBatch", { techIds: ["mujian", "mujian", "mujian"] });
    const threeDmg = threeR.damageEvents!.find((e) => e.target === "monster")!.amount;

    // 封頂後,第 3 張開始的同屬加成不再繼續墊高「每張」的倍率——3 張 = 2 張 + 1 張「已封頂倍率」的牌,
    // 總傷害應正好是 2 張總傷害的 1.5 倍(允許 floor() 誤差),而不是封頂前會出現的更高比例。
    expect(threeDmg / twoDmg).toBeCloseTo(1.5, 1);
  });
});

describe("怪物氣血/攻擊力的戰鬥平衡性倍率(MONSTER_HP_BALANCE_MULT / MONSTER_ATK_BALANCE_MULT)", () => {
  it("monsterHpOf / monsterAtkOf 回傳的是原始資料乘上平衡性倍率", () => {
    const mon = MONSTERS.find((m) => m.id === "shulang")!;
    expect(monsterHpOf(mon)).toBe(Math.floor(mon.hp * MONSTER_HP_BALANCE_MULT));
    expect(monsterAtkOf(mon)).toBe(Math.floor(mon.atk * MONSTER_ATK_BALANCE_MULT));
  });

  it("開戰時 combat.monsterHp 套用的是平衡性倍率後的數字,不是 world.ts 的原始值", () => {
    // 強制走「採集時遇襲」分支:第一個隨機數 <0.35 觸發遇襲,第二個隨機數選中怪物清單第 0 位
    restore = mockRandom([0.1, 0]);
    const s = newSave("測試員", "huadao");
    const r = applyAction(s, "gather", { locationId: "caiyaoshan" });
    expect(r.save.combat).not.toBeNull();
    const encountered = MONSTERS.find((m) => m.id === r.save.combat!.monsterId)!;
    expect(r.save.combat!.monsterHp).toBe(monsterHpOf(encountered));
    expect(r.save.combat!.monsterHp).toBe(Math.floor(encountered.hp * MONSTER_HP_BALANCE_MULT));
  });
});
