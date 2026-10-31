// 5.0 版戰鬥丹藥:固定量回血的丹藥、解除負面狀態的丹藥(手牌下方丹藥欄服用),一律妖獸掉落。
import { describe, it, expect } from "vitest";
import { applyAction, statsOf } from "../engine";
import { freshCombatSave } from "./testUtils";

describe("戰鬥丹藥", () => {
  it("回血丹藥:戰鬥中依固定量回血,不超過氣血上限,服藥不結束戰鬥", () => {
    const s = freshCombatSave("huadao", "qinglang");
    const hpMax = statsOf(s).hpMax;
    s.hp = 1;
    s.inventory["xuelingdan"] = 1;
    const r = applyAction(s, "useItem", { itemId: "xuelingdan" });
    expect(r.save.hp).toBe(Math.min(hpMax, 1 + 30000));
    expect(r.save.inventory["xuelingdan"] ?? 0).toBe(0);
    expect(r.save.combat).not.toBeNull();
  });

  it("新增的丹藥一律妖獸掉落,坊市不賣", () => {
    const s = freshCombatSave("huadao", "qinglang");
    s.combat = null;
    for (const id of ["jiedudan", "qingliangsan", "huiyangdan", "tishendan", "baicao_linglu", "yusui_lingquan", "xuelingdan", "longxuedan", "xianyuan_huichun", "jiuzhuan_xianlu", "taiyi_huanhun"]) {
      expect(applyAction(s, "buy", { itemId: id }).error, id).toBeTruthy();
    }
  });

  it("解毒丹:只解除中毒,其他狀態保留", () => {
    const s = freshCombatSave("huadao", "qinglang");
    s.combat!.playerStatus = [
      { kind: "poison", turns: 3 },
      { kind: "burn", turns: 3 },
    ];
    s.inventory["jiedudan"] = 1;
    const r = applyAction(s, "useItem", { itemId: "jiedudan" });
    expect(r.save.combat!.playerStatus!.map((e) => e.kind)).toEqual(["burn"]);
  });

  it("玉髓靈泉:回血 10000 並解除所有負面狀態", () => {
    const s = freshCombatSave("huadao", "qinglang");
    s.hp = 1;
    s.combat!.playerStatus = [
      { kind: "freeze", turns: 2 },
      { kind: "weaken", turns: 2 },
    ];
    s.inventory["yusui_lingquan"] = 1;
    const r = applyAction(s, "useItem", { itemId: "yusui_lingquan" });
    expect(r.save.combat!.playerStatus).toEqual([]);
    expect(r.save.hp).toBeGreaterThan(1);
  });

  it("純解狀態丹藥在戰鬥外服用不消耗", () => {
    const s = freshCombatSave("huadao", "qinglang");
    s.combat = null;
    s.inventory["jiedudan"] = 1;
    const r = applyAction(s, "useItem", { itemId: "jiedudan" });
    expect(r.error).toBeTruthy();
    expect(r.save.inventory["jiedudan"]).toBe(1);
  });
});
