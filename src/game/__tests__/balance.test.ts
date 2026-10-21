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
  MONSTER_ATK_EARLY_FLOOR,
  NOVICE_GUARD_REALMS,
  MONSTER_HP_NORMAL_MULT,
  MONSTER_HP_EARLY_MULT,
  isEarlyMonster,
  isLateMonster,
  monsterMinStage,
  monsterExpOf,
  MONSTER_HP_STAGE_EXTRA,
  MONSTER_HP_LATE_MULT,
  canEnterStage,
} from "../engine";
import { MONSTERS, LOCATIONS, ELITE_SPAWNS } from "../data/world";
import { SECTS } from "../data/sects";
import { REALMS } from "../data/realms";
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
    // 4.2 版:天南(練氣期)一般妖獸 ×MONSTER_HP_EARLY_MULT;其餘一般妖獸 ×MONSTER_HP_NORMAL_MULT;地域王/BOSS 不變
    expect(isEarlyMonster(mon.id)).toBe(true);
    expect(monsterHpOf(mon)).toBe(Math.floor(mon.hp * MONSTER_HP_BALANCE_MULT * MONSTER_HP_EARLY_MULT));
    const later = MONSTERS.find((m) => !m.isLord && !isEarlyMonster(m.id) && !isLateMonster(m.id))!;
    // 煉虛~大乘(出沒秘境最低 6~8 階)一般妖獸再 ×MONSTER_HP_LATE_MULT
    const late = MONSTERS.find((m) => !m.isLord && isLateMonster(m.id) && monsterMinStage(m.id) === 6)!;
    expect(monsterHpOf(late)).toBe(
      Math.floor(late.hp * MONSTER_HP_BALANCE_MULT * MONSTER_HP_NORMAL_MULT * MONSTER_HP_LATE_MULT),
    );
    // 合體期(7 階)再 ×2、大乘期(8 階)再 ×2.5
    for (const stage of [7, 8]) {
      const m = MONSTERS.find((x) => !x.isLord && monsterMinStage(x.id) === stage)!;
      expect(monsterHpOf(m)).toBe(
        Math.floor(
          m.hp * MONSTER_HP_BALANCE_MULT * MONSTER_HP_NORMAL_MULT * MONSTER_HP_LATE_MULT * MONSTER_HP_STAGE_EXTRA[stage],
        ),
      );
    }
    expect(isLateMonster("mohua")).toBe(false); // 同時出沒於 5 階魔淵,不受影響
    expect(monsterHpOf(later)).toBe(
      Math.floor(later.hp * MONSTER_HP_BALANCE_MULT * MONSTER_HP_NORMAL_MULT),
    );
    const lord = MONSTERS.find((m) => m.isLord)!;
    expect(monsterHpOf(lord)).toBe(Math.floor(lord.hp * MONSTER_HP_BALANCE_MULT));
    // 4.2 版:低攻擊妖獸另有保底(原始攻擊 + MONSTER_ATK_EARLY_FLOOR),取兩者較高
    expect(monsterAtkOf(mon)).toBe(
      Math.max(Math.floor(mon.atk * MONSTER_ATK_BALANCE_MULT), mon.atk + MONSTER_ATK_EARLY_FLOOR),
    );
    const strong = MONSTERS.find((m) => m.atk >= 20)!;
    expect(monsterAtkOf(strong)).toBe(Math.floor(strong.atk * MONSTER_ATK_BALANCE_MULT));
  });

  it("開戰時 combat.monsterHp 套用的是平衡性倍率後的數字,不是 world.ts 的原始值", () => {
    // 強制走「採集時遇襲」分支:第一個隨機數 <0.35 觸發遇襲,第二個隨機數選中怪物清單第 0 位
    restore = mockRandom([0.1, 0]);
    const s = newSave("測試員", "huadao");
    const r = applyAction(s, "gather", { locationId: "caiyaoshan" });
    expect(r.save.combat).not.toBeNull();
    const encountered = MONSTERS.find((m) => m.id === r.save.combat!.monsterId)!;
    expect(r.save.combat!.monsterHp).toBe(monsterHpOf(encountered));
    expect(r.save.combat!.monsterHp).toBe(
      Math.floor(encountered.hp * MONSTER_HP_BALANCE_MULT * MONSTER_HP_EARLY_MULT),
    );
  });
});

describe("新手護體(4.2 版):練氣期突破失敗只散一半修為、不折損壽元", () => {
  it("練氣期失敗:修為減半、最大壽元不變", () => {
    const s = newSave("測試員", SECTS[0].id);
    s.realmIdx = 0;
    s.exp = 40;
    s.energy = 999;
    const lifeBefore = s.lifeBonus;
    const restoreRand = mockRandom([0.999]);
    const r = applyAction(s, "breakthrough");
    restoreRand();
    expect(r.breakResult?.success).toBe(false);
    expect(r.save.exp).toBe(20);
    expect(r.save.lifeBonus).toBe(lifeBefore);
  });
  it("築基期之後失敗:照舊修為歸零、折損壽元", () => {
    const s = newSave("測試員", SECTS[0].id);
    s.realmIdx = NOVICE_GUARD_REALMS;
    s.exp = REALMS[s.realmIdx].expNeed;
    s.energy = 999;
    const lifeBefore = s.lifeBonus;
    const restoreRand = mockRandom([0.999]);
    const r = applyAction(s, "breakthrough");
    restoreRand();
    expect(r.breakResult?.success).toBe(false);
    expect(r.save.exp).toBe(0);
    expect(r.save.lifeBonus).toBeLessThan(lifeBefore);
  });
});

describe("越階挑戰(4.2 版):可進入需求境界高一階的秘境,仙域仍須飛昇", () => {
  it("canEnterStage 規則", () => {
    expect(canEnterStage(1, 2)).toBe(true);
    expect(canEnterStage(1, 3)).toBe(false);
    expect(canEnterStage(8, 9)).toBe(true);
    expect(canEnterStage(9, 10)).toBe(false);
    expect(canEnterStage(10, 10)).toBe(true);
  });
  it("練氣期(1 階)可獵殺 2 階秘境,不可進 3 階秘境", () => {
    const s = newSave("測試員", SECTS[0].id);
    s.energy = 999;
    const ok = applyAction(s, "hunt", { locationId: "hantan" });
    expect(ok.save.combat).toBeTruthy();
    const s2 = newSave("測試員", SECTS[0].id);
    s2.energy = 999;
    const no = applyAction(s2, "hunt", { locationId: "xuesehe" });
    expect(no.save.combat).toBeFalsy();
  });
});

describe("大乘期菁英(4.2 版)", () => {
  it("每處 8 階靈界秘境都有菁英,且菁英確實存在、非地域王", () => {
    for (const l of LOCATIONS.filter((x) => x.region === "lingjie" && x.reqStage === 8)) {
      const id = ELITE_SPAWNS[l.id];
      expect(id, l.id).toBeTruthy();
      const m = MONSTERS.find((x) => x.id === id)!;
      expect(m.elite).toBe(true);
      expect(m.isLord).toBeFalsy();
      expect(monsterMinStage(id)).toBe(8);
    }
  });
  it("獵殺時可遭遇菁英,擊殺後標題為「菁 英 伏 誅」", () => {
    const s = newSave("測試員", SECTS[0].id);
    s.realmIdx = REALMS.findIndex((r) => r.stage === 8);
    s.energy = 999;
    // 第一個亂數:地域王機率判定(不觸發);第二個:菁英判定(觸發)
    restore = mockRandom([0.99, 0.99, 0.01]);
    const h = applyAction(s, "hunt", { locationId: "feishengtai" });
    restore();
    restore = null;
    expect(h.save.combat?.monsterId).toBe("elite_leizun");
    const won = applyAction({ ...h.save, combat: { ...h.save.combat!, monsterHp: 1 } }, "castBatch", {
      techIds: [h.save.combat!.hand!.find((id) => id !== "artifact_attack") ?? "spell_attack"],
    });
    expect(won.loot?.title).toBe("菁 英 伏 誅");
  });
});

describe("妖獸修為下修(4.2 版):結丹~合體 ×0.25、大乘 ×0.15,BOSS 不打折", () => {
  it("依出沒最低階數打折", () => {
    for (const [stage, mult] of [[2, 1], [3, 0.25], [7, 0.25], [8, 0.15]] as const) {
      const m = MONSTERS.find((x) => !x.isLord && !x.elite && monsterMinStage(x.id) === stage)!;
      expect(monsterExpOf(m), `${stage}階 ${m.id}`).toBe(Math.floor(m.exp * mult));
    }
  });
  it("地域王與菁英不打折", () => {
    const lord = MONSTERS.find((x) => x.isLord && x.exp > 0)!;
    expect(monsterExpOf(lord)).toBe(lord.exp);
    const elite = MONSTERS.find((x) => x.elite)!;
    expect(monsterExpOf(elite)).toBe(elite.exp);
  });
});
