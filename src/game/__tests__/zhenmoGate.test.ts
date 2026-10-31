// 5.0 版真魔之門:秘境尋得真魔門令後,須擊敗冥翎天魔古龍才開啟真魔界;落敗保留門令;古龍免疫燒傷/中毒。
import { describe, it, expect, afterEach } from "vitest";
import { applyAction, newSave, statsOf } from "../engine";
import type { SaveData } from "../engine";
import { REALMS } from "../data/realms";
import { mockRandom } from "./testUtils";

let restore: (() => void) | null = null;
afterEach(() => {
  restore?.();
  restore = null;
});

function xianWithToken(): SaveData {
  const s = newSave("測試員", "huadao");
  s.realmIdx = REALMS.findIndex((r) => r.id === "feisheng");
  s.inventory["zhenmo_menling"] = 1;
  s.hp = statsOf(s).hpMax;
  return s;
}

describe("真魔之門:冥翎天魔古龍守關", () => {
  it("動用真魔門令進入守關戰,門令先不消耗", () => {
    const r = applyAction(xianWithToken(), "useItem", { itemId: "zhenmo_menling" });
    expect(r.save.combat?.monsterId).toBe("zm_mingling_gulong");
    expect(r.save.combat?.zhenmoGate).toBe(true);
    expect(r.save.inventory["zhenmo_menling"]).toBe(1);
    expect(r.save.zhenmoUnlocked).toBe(false);
  });

  it("擊敗古龍:開啟真魔界並消耗門令", () => {
    const s = applyAction(xianWithToken(), "useItem", { itemId: "zhenmo_menling" }).save;
    s.combat!.monsterHp = 1;
    s.combat!.hand = ["spell_attack"];
    restore = mockRandom([0.99, 0.5, 0.5]); // 第一個亂數避開古龍的閃避
    const r = applyAction(s, "castBatch", { techIds: ["spell_attack"] });
    expect(r.save.combat).toBeNull();
    expect(r.save.zhenmoUnlocked).toBe(true);
    expect(r.save.inventory["zhenmo_menling"] ?? 0).toBe(0);
    expect(r.loot?.title).toContain("真 魔 之 門");
  });

  it("不敵古龍:真魔界不開啟,門令保留可再戰,煞氣 +2500", () => {
    const s = applyAction(xianWithToken(), "useItem", { itemId: "zhenmo_menling" }).save;
    s.hp = 1;
    s.shaqi = 100;
    restore = mockRandom([0.99, 0.5, 0.5, 0.5]); // 不閃避、照常命中
    const r = applyAction(s, "endTurn");
    expect(r.save.combat).toBeNull();
    expect(r.save.zhenmoUnlocked).toBe(false);
    expect(r.save.inventory["zhenmo_menling"]).toBe(1);
    expect(r.save.shaqi).toBe(2600);
    expect(r.loot?.lines.some((l) => l.includes("煞氣暴增 2500"))).toBe(true);
  });

  it("煞氣暴增有上限 10000", () => {
    const s = applyAction(xianWithToken(), "useItem", { itemId: "zhenmo_menling" }).save;
    s.hp = 1;
    s.shaqi = 9000;
    restore = mockRandom([0.99, 0.5, 0.5, 0.5]);
    expect(applyAction(s, "endTurn").save.shaqi).toBe(10000);
  });

  it("遁走不增加煞氣", () => {
    const s = applyAction(xianWithToken(), "useItem", { itemId: "zhenmo_menling" }).save;
    s.shaqi = 0;
    restore = mockRandom([0.1]); // 遁走成功
    const r = applyAction(s, "flee");
    expect(r.save.combat).toBeNull();
    expect(r.save.shaqi).toBe(0);
  });

  it("戰鬥中門令已不在身上(例如掛上市集賣掉),打贏也不會開門", () => {
    const s = applyAction(xianWithToken(), "useItem", { itemId: "zhenmo_menling" }).save;
    delete s.inventory["zhenmo_menling"];
    s.combat!.monsterHp = 1;
    s.combat!.hand = ["spell_attack"];
    restore = mockRandom([0.99, 0.5, 0.5]);
    const r = applyAction(s, "castBatch", { techIds: ["spell_attack"] });
    expect(r.save.combat).toBeNull();
    expect(r.save.zhenmoUnlocked).toBe(false);
  });

  it("魔鱗不侵:戰術卡必定燒傷對古龍無效", () => {
    const s = applyAction(xianWithToken(), "useItem", { itemId: "zhenmo_menling" }).save;
    s.inventory["liehuo_yin"] = 1;
    const r = applyAction(s, "useTacticCard", { itemId: "liehuo_yin" });
    expect((r.save.combat?.monsterStatus ?? []).some((e) => e.kind === "burn")).toBe(false);
  });

  it("已開啟真魔界後,門令無法再動用", () => {
    const s = xianWithToken();
    s.zhenmoUnlocked = true;
    const r = applyAction(s, "useItem", { itemId: "zhenmo_menling" });
    expect(r.save.combat).toBeNull();
  });
});

describe("黑眼貔貅封法", () => {
  it("只能出法器攻擊;其他符寶被擋,法器攻擊照常造成傷害", async () => {
    const { freshCombatSave } = await import("./testUtils");
    const { isCardSealed } = await import("../engine");
    const s = freshCombatSave("huadao", "lord_pixiu", { learned: ["huoqiu"], hand: ["artifact_attack", "huoqiu"] });
    expect(isCardSealed("lord_pixiu", "artifact_attack")).toBe(false);
    expect(isCardSealed("lord_pixiu", "huoqiu")).toBe(true);
    expect(isCardSealed("qinglang", "huoqiu")).toBe(false);
    expect(applyAction(structuredClone(s), "castBatch", { techIds: ["huoqiu"] }).error).toBeTruthy();
    restore = mockRandom([0.5, 0.5, 0.5]);
    const r = applyAction(structuredClone(s), "castBatch", { techIds: ["artifact_attack"] });
    expect(r.error).toBeFalsy();
    expect(r.save.combat!.monsterHp).toBeLessThan(s.combat!.monsterHp);
  });
});
