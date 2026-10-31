import { afterEach, describe, expect, it } from "vitest";
import { applyAction, statsOf, tickDot } from "../engine";
import type { SaveData, StatusEffect } from "../engine";
import { techById } from "../data/techniques";
import { buildPvpFighter, endTurn as endPvpTurn, playMove } from "../pvpEngine";
import type { PvpMatchState } from "../pvpEngine";
import { freshCombatSave, mockRandom } from "./testUtils";

let restore: (() => void) | undefined;
afterEach(() => {
  restore?.();
  restore = undefined;
});

function combat(monsterId = "shulang", hand = ["artifact_attack"]): SaveData {
  return freshCombatSave("huadao", monsterId, {
    learned: [...new Set([...hand, "artifact_attack", "spell_attack"])],
    hand,
    monsterHp: 999_999,
    mp: 200,
  });
}

const turnsOf = (s: SaveData, kind: StatusEffect["kind"]) =>
  s.combat?.playerStatus?.find((e) => e.kind === kind)?.turns ?? 0;

describe("A0:貔貅封法保留法器攻擊", () => {
  it.each(["castBatch", "cast"])("%s 可單獨打出法器,扣除法力並棄牌", (action) => {
    restore = mockRandom([0.99, 0.5]);
    const s = combat("lord_pixiu");
    const r = applyAction(s, action, { techIds: ["artifact_attack"], techId: "artifact_attack" });
    expect(r.error).toBeUndefined();
    expect(r.damageEvents?.some((e) => e.target === "monster" && e.amount > 0)).toBe(true);
    expect(r.save.mp).toBe(200 - techById("artifact_attack").mpCost);
    expect(r.save.combat?.hand).toEqual([]);
    expect(r.save.combat?.discard).toEqual(["artifact_attack"]);
  });

  it.each(["castBatch", "cast"])("%s 仍封鎖仙法,不扣法力或棄牌", (action) => {
    const s = combat("lord_pixiu", ["qingxin_jue"]);
    const r = applyAction(s, action, { techIds: ["qingxin_jue"], techId: "qingxin_jue" });
    expect(r.error).toContain("唯有以法器相搏");
    expect(r.save.mp).toBe(200);
    expect(r.save.combat?.hand).toEqual(["qingxin_jue"]);
    expect(r.damageEvents ?? []).toEqual([]);
  });

  it("法器與仙法混打仍被封鎖", () => {
    const s = combat("lord_pixiu", ["artifact_attack", "spell_attack"]);
    const r = applyAction(s, "castBatch", { techIds: ["artifact_attack", "spell_attack"] });
    expect(r.error).toContain("唯有以法器相搏");
    expect(r.save.mp).toBe(200);
    expect(r.save.combat?.hand).toEqual(["artifact_attack", "spell_attack"]);
  });

  it.each(["castBatch", "cast"])("%s 的法器例外仍檢查手牌與法力", (action) => {
    const s = combat("lord_pixiu", ["spell_attack"]);
    const missing = applyAction(s, action, {
      techIds: ["artifact_attack"],
      techId: "artifact_attack",
    });
    expect(missing.error).toContain("手牌");
    s.combat!.hand = ["artifact_attack"];
    s.mp = 1;
    const poor = applyAction(s, action, {
      techIds: ["artifact_attack"],
      techId: "artifact_attack",
    });
    expect(poor.damageEvents ?? []).toEqual([]);
    expect(poor.save.mp).toBe(1);
    expect(poor.save.combat?.hand).toEqual(["artifact_attack"]);
  });
});

describe("A1:冰封只在玩家回合收尾扣減一次", () => {
  it("連續施法結束令冰封 2 → 1 → 0,之後可正常攻擊", () => {
    restore = mockRandom([]);
    let s = combat();
    s.combat!.playerStatus = [{ kind: "freeze", turns: 2 }];
    s = applyAction(s, "endTurn").save;
    expect(turnsOf(s, "freeze")).toBe(1);
    s = applyAction(s, "endTurn").save;
    expect(turnsOf(s, "freeze")).toBe(0);
    s.combat!.hand = ["artifact_attack"];
    const r = applyAction(s, "castBatch", { techIds: ["artifact_attack"] });
    expect(r.damageEvents?.some((e) => e.target === "monster")).toBe(true);
  });

  it.each(["castBatch", "cast", "useTacticCard", "flee"])(
    "%s 被冰封跳過或遁走失敗都只扣一次",
    (action) => {
      restore = mockRandom([0.99]); // 遁走失敗;其餘隨機取 0.5,不會閃避
      const s = combat("lord_pixiu");
      s.inventory.hufu_fu = 1;
      s.combat!.playerStatus = [{ kind: "freeze", turns: 2 }];
      s.combat!.monsterStatus = [{ kind: "freeze", turns: 2 }];
      const r = applyAction(s, action, {
        techIds: ["artifact_attack"],
        techId: "artifact_attack",
        itemId: "hufu_fu",
      });
      expect(r.error).toBeUndefined();
      expect(turnsOf(r.save, "freeze")).toBe(1);
      expect(r.save.combat?.monsterStatus).toEqual([{ kind: "freeze", turns: 1 }]);
      expect(r.save.inventory.hufu_fu).toBe(1);
      expect(r.damageEvents ?? []).toEqual([]);
    },
  );

  it("怪物在本次反擊新附加的冰封保留完整兩回合", () => {
    restore = mockRandom([0.99, 0.5, 0.99, 0.1]);
    const r = applyAction(combat("hanshuimang"), "endTurn");
    expect(turnsOf(r.save, "freeze")).toBe(2);
  });

  it("保留 A2:冰封仍可成功遁走", () => {
    restore = mockRandom([0.1]);
    const s = combat();
    s.combat!.playerStatus = [{ kind: "freeze", turns: 2 }];
    expect(applyAction(s, "flee").save.combat).toBeNull();
  });
});

describe("A3/A5:淨化可解冰封且保留縹緲", () => {
  const negative: StatusEffect[] = [
    { kind: "freeze", turns: 2 },
    { kind: "burn", turns: 3 },
    { kind: "poison", turns: 3 },
    { kind: "weaken", turns: 2 },
  ];

  for (const action of ["castBatch", "cast"]) {
    it.each(["qingxin_jue", "dinghun_fu", "qingfeng_ganlu"])(
      `${action} 的 %s 在冰封中正常出牌與淨化`,
      (id) => {
        restore = mockRandom([0.99, 0.5]);
        const s = combat("shulang", [id]);
        const hp = s.hp;
        s.combat!.playerStatus = [...negative, { kind: "evade", turns: 1 }];
        const r = applyAction(s, action, { techIds: [id], techId: id });
        expect(r.error).toBeUndefined();
        expect(r.save.combat?.playerStatus).toEqual([{ kind: "evade", turns: 1 }]);
        expect(r.save.mp).toBe(200 - techById(id).mpCost);
        expect(r.save.combat?.hand).toEqual([]);
        expect(r.save.combat?.discard).toEqual([id]);
        expect(r.save.hp).toBe(hp); // 淨化出牌不會觸發怪物反擊或 DOT
        expect(r.damageEvents?.some((e) => e.target === "monster")).toBe(true);
      },
    );
  }

  it("冰封中可使用洗髓符,只消耗一張並保留縹緲", () => {
    const s = combat();
    s.inventory.xishen_fu = 2;
    s.combat!.playerStatus = [...negative, { kind: "evade", turns: 1 }];
    const r = applyAction(s, "useTacticCard", { itemId: "xishen_fu" });
    expect(r.save.combat?.playerStatus).toEqual([{ kind: "evade", turns: 1 }]);
    expect(r.save.inventory.xishen_fu).toBe(1);
    expect(r.save.mp).toBe(200);
    expect(r.damageEvents ?? []).toEqual([]);
  });

  it.each(["castBatch", "cast"])("%s 法力不足時不淨化、不棄牌、不消耗冰封", (action) => {
    const s = combat("shulang", ["qingxin_jue"]);
    s.mp = 1;
    s.combat!.playerStatus = negative;
    const r = applyAction(s, action, { techIds: ["qingxin_jue"], techId: "qingxin_jue" });
    expect(r.save.combat?.playerStatus).toEqual(negative);
    expect(r.save.mp).toBe(1);
    expect(r.save.combat?.hand).toEqual(["qingxin_jue"]);
    expect(r.damageEvents ?? []).toEqual([]);
  });

  it("批次可由其中一張清心解控,但仍檢查整批手牌與總法力", () => {
    restore = mockRandom([]);
    const ids = ["qingxin_jue", "spell_attack"];
    const s = combat("shulang", ids);
    s.combat!.playerStatus = negative;
    s.mp = techById("qingxin_jue").mpCost;
    const poor = applyAction(s, "castBatch", { techIds: ids });
    expect(poor.error).toContain("法力不足");
    expect(poor.save.combat?.playerStatus).toEqual(negative);
    s.mp = 200;
    const missing = applyAction(s, "castBatch", { techIds: [...ids, "dinghun_fu"] });
    expect(missing.error).toBeTruthy();
    expect(missing.save.combat?.playerStatus).toEqual(negative);
    const valid = applyAction(s, "castBatch", { techIds: ids });
    expect(valid.error).toBeUndefined();
    expect(valid.save.combat?.playerStatus).toEqual([]);
    expect(valid.save.combat?.discard).toEqual(ids);
  });

  it("僅有縹緲時洗髓符保留它,戰報正確說明沒有負面狀態", () => {
    const s = combat();
    s.inventory.xishen_fu = 1;
    s.combat!.playerStatus = [{ kind: "evade", turns: 1 }];
    const r = applyAction(s, "useTacticCard", { itemId: "xishen_fu" });
    expect(r.save.combat?.playerStatus).toEqual([{ kind: "evade", turns: 1 }]);
    expect(r.save.log.at(-1)).toContain("並無負面狀態");
  });
});

describe("A4:縹緲只在實際攻擊時消耗", () => {
  it("怪物冰封兩回合都保留縹緲,第三次反擊才消耗", () => {
    restore = mockRandom([]);
    let s = combat();
    s.combat!.monsterStatus = [{ kind: "freeze", turns: 2 }];
    s.combat!.playerStatus = [{ kind: "evade", turns: 1 }];
    const hp = s.hp;
    for (let i = 0; i < 2; i++) {
      s = applyAction(s, "endTurn").save;
      expect(turnsOf(s, "evade")).toBe(1);
      expect(s.hp).toBe(hp);
    }
    s = applyAction(s, "endTurn").save;
    expect(turnsOf(s, "evade")).toBe(0);
    expect(s.hp).toBe(hp);
    s = applyAction(s, "endTurn").save;
    expect(s.hp).toBeLessThan(hp);
  });

  it("共用 tickDot 保留冰封與縹緲,正常結算其他狀態", () => {
    const r = tickDot(
      [
        { kind: "burn", turns: 1 },
        { kind: "poison", turns: 1 },
        { kind: "weaken", turns: 1 },
        { kind: "freeze", turns: 2 },
        { kind: "evade", turns: 1 },
      ],
      1000,
    );
    expect(r.dmg).toBe(65);
    expect(r.list).toEqual([
      { kind: "freeze", turns: 2 },
      { kind: "evade", turns: 1 },
    ]);
  });

  it("PvP 共用 tickDot 後,縹緲跨過空回合並只抵擋一次攻擊", () => {
    restore = mockRandom([]);
    const fighter = (id: number) => buildPvpFighter(id, `玩家 ${id}`, combat());
    const a = fighter(1);
    const b = fighter(2);
    a.status = [{ kind: "evade", turns: 1 }];
    b.hand = ["spell_attack", "spell_attack"];
    const state: PvpMatchState = {
      turn: 1,
      turnUserId: 1,
      firstUserId: 1,
      fighters: [a, b],
      log: [],
    };
    endPvpTurn(state);
    expect(a.status).toEqual([{ kind: "evade", turns: 1 }]);
    const hp = a.hp;
    playMove(state, 2, ["spell_attack"]);
    expect(a.status).toEqual([]);
    expect(a.hp).toBe(hp);
    playMove(state, 2, ["spell_attack"]);
    expect(a.hp).toBeLessThan(hp);
  });
});

describe("A6:怪物減攻涵蓋完整持續回合", () => {
  it.each([
    { statuses: [{ kind: "weaken", turns: 2 }], expected: [70, 70, 100] },
    { statuses: [{ kind: "poison", turns: 3 }], expected: [80, 80, 80, 100] },
    {
      statuses: [
        { kind: "poison", turns: 3 },
        { kind: "weaken", turns: 2 },
      ],
      expected: [55, 55, 80, 100],
    },
  ])("$statuses 的最後一回合仍減攻,之後恢復正常", ({ statuses, expected }) => {
    restore = mockRandom([]);
    let s = combat();
    const { def } = statsOf(s);
    expect(def).toBe(0);
    s.combat!.bossAtk = 100;
    s.combat!.playerShield = 10_000; // 吸收反擊,用每次護盾消耗量量測傷害
    s.combat!.monsterStatus = statuses as StatusEffect[];
    const damages: number[] = [];
    for (let i = 0; i < expected.length; i++) {
      const shield = s.combat!.playerShield!;
      s = applyAction(s, "endTurn").save;
      damages.push(shield - s.combat!.playerShield!);
    }
    // 固定隨機 0.5 取整數擲骰中值;雙減攻保留既有的浮點取整結果 55。
    expect(damages).toEqual(expected);
    expect(s.combat?.monsterStatus).toEqual([]);
  });

  it("最後一次 DOT 殺死怪物時仍先勝利,不反擊", () => {
    restore = mockRandom([]);
    const s = combat();
    s.combat!.monsterHp = 1;
    s.combat!.monsterStatus = [{ kind: "poison", turns: 1 }];
    const hp = s.hp;
    const r = applyAction(s, "endTurn");
    expect(r.save.combat).toBeNull();
    expect(r.loot?.success).toBe(true);
    expect(r.save.hp).toBe(hp);
    expect(r.damageEvents?.filter((e) => e.target === "player") ?? []).toEqual([]);
  });
});
