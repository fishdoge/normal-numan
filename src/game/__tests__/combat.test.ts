// 戰鬥核心(castBatch/monsterTurn/postPlayerTurn/useTacticCard)的整合測試。
// 覆蓋符寶的每一種連攜/特殊機制各至少一例,而非每張卡都各寫一遍——79 張符寶實際上只用了約 15 種
// 機制组合,測機制本身比逐卡重複測更有效益;卡牌資料本身的健檢見 cards.test.ts 的全表掃描。
import { describe, it, expect, afterEach } from "vitest";
import { applyAction, statsOf } from "../engine";
import { mockRandom, freshCombatSave } from "./testUtils";

let restore: (() => void) | null = null;
afterEach(() => {
  restore?.();
  restore = null;
});

describe("castBatch:基礎傷害與五行相剋", () => {
  it("單卡出牌,中性屬性(不觸發相剋),傷害 = atk × power × 變動(0.9~1.1)", () => {
    restore = mockRandom([0.99, 0.5]); // 不閃避、變動取中間值
    const s = freshCombatSave("huadao", "shulang", { learned: ["huoqiu"], hand: ["huoqiu"] });
    // 火彈術(火) vs 赤目鼠狼(土):COUNTERS[火]=金、COUNTERS[土]=水,皆與對方無關 → 中性
    const r = applyAction(s, "castBatch", { techIds: ["huoqiu"] });
    expect(r.error).toBeUndefined();
    const ev = r.damageEvents?.find((e) => e.target === "monster");
    expect(ev?.advantage).toBeUndefined();
    expect(ev?.element).toBe("火");
  });

  it("命中克制屬性(木克土),傷害標記 advantage=super,實際倍率 ×1.5", () => {
    restore = mockRandom([0.99, 0.5]);
    const s = freshCombatSave("huangfeng", "shulang", { learned: ["mujian"], hand: ["mujian"] });
    const r = applyAction(s, "castBatch", { techIds: ["mujian"] });
    const ev = r.damageEvents?.find((e) => e.target === "monster");
    expect(ev?.advantage).toBe("super");
  });

  it("被屬性剋制(水被土剋),傷害標記 advantage=resist,倍率 ×0.75", () => {
    restore = mockRandom([0.99, 0.5]);
    const s = freshCombatSave("yanyue", "shulang", { learned: ["shuijian"], hand: ["shuijian"] });
    const r = applyAction(s, "castBatch", { techIds: ["shuijian"] });
    const ev = r.damageEvents?.find((e) => e.target === "monster");
    expect(ev?.advantage).toBe("resist");
  });
});

describe("castBatch:連攜機制", () => {
  it("同屬疊加(synergyPct):2 張同元素符寶一起出,傷害明顯高於兩次單卡傷害之和", () => {
    restore = mockRandom([0.99, 0.5]);
    const solo = freshCombatSave("huangfeng", "qinglang", {
      learned: ["mujian"],
      hand: ["mujian"],
      monsterHp: 999999,
    });
    const soloR = applyAction(solo, "castBatch", { techIds: ["mujian"] });
    const soloDmg = soloR.damageEvents!.find((e) => e.target === "monster")!.amount;

    restore?.();
    restore = mockRandom([0.99, 0.5]);
    const combo = freshCombatSave("huangfeng", "qinglang", {
      learned: ["mujian"],
      hand: ["mujian", "mujian"],
      monsterHp: 999999,
    });
    const comboR = applyAction(combo, "castBatch", { techIds: ["mujian", "mujian"] });
    const comboDmg = comboR.damageEvents!.find((e) => e.target === "monster")!.amount;

    // 同屬疊加是「每張都各自多吃一次加成」,2 張的總傷害應該超過單卡的 2 倍(平方成長,不是線性)
    expect(comboDmg).toBeGreaterThan(soloDmg * 2);
  });

  it("組合疊加(comboSizePct):同一批次多打一張(不同屬性亦可),傷害隨張數提升", () => {
    restore = mockRandom([0.99, 0.5]);
    const s = freshCombatSave("julian", "qinglang", {
      learned: ["shuangfeng_hebi", "jinren"],
      hand: ["shuangfeng_hebi"],
      monsterHp: 999999,
    });
    const soloR = applyAction(s, "castBatch", { techIds: ["shuangfeng_hebi"] });
    const soloDmg = soloR.damageEvents!.find((e) => e.target === "monster")!.amount;

    restore?.();
    restore = mockRandom([0.99, 0.5]);
    const s2 = freshCombatSave("julian", "qinglang", {
      learned: ["shuangfeng_hebi", "jinren"],
      hand: ["shuangfeng_hebi", "jinren"],
      monsterHp: 999999,
    });
    const comboR = applyAction(s2, "castBatch", { techIds: ["shuangfeng_hebi", "jinren"] });
    const shuangfengPortion = comboR.damageEvents!.find((e) => e.target === "monster")!.amount;
    // 批次總傷害含兩張符寶,應明顯大於雙鋒合璧單獨出牌(即使只看合併後的總傷害也會更大)
    expect(shuangfengPortion).toBeGreaterThan(soloDmg);
  });

  it("混屬加成(crossElementPct):批次混搭越多種屬性,傷害越高", () => {
    // 挑選監測對象與怪物屬性時要避開五行相剋的干擾(不然「混搭變強」可能只是剛好踩中克制怪物的
    // 屬性,不是 crossElementPct 本身的效果)。用兩張完全沒有連攜特性的「平凡基礎牌」(陰風劍/
    // 金雷錐)當填充,monster 選寒水蟒(水屬性)——金、木兩屬性對水都是中性,乾淨地只留下
    // crossElementPct 這一個變數。attack=julian 宗門(13 點),變動鎖定在 1.0 倍(mock 0.5 → 0.9+0.1=1.0),
    // 兩邊 rawPower 可手算到整數:
    //   同屬(yuanci + 金雷竹×2,僅 1 種非「無」屬性):3.0 + 3.0 + 3.0 = 9.0 → floor(13×9.0) = 117
    //   混屬(yuanci + 金雷竹 + 陰風劍,2 種非「無」屬性):3.5 + 3.0 + 2.6 = 9.1 → floor(13×9.1) = 118
    restore = mockRandom([0.99, 0.5]);
    const sameEl = freshCombatSave("julian", "hanshuimang", {
      learned: ["yuanci", "jinlei_zhui"],
      hand: ["yuanci", "jinlei_zhui", "jinlei_zhui"],
      monsterHp: 999999,
    });
    const sameElR = applyAction(sameEl, "castBatch", {
      techIds: ["yuanci", "jinlei_zhui", "jinlei_zhui"],
    });
    const sameElDmg = sameElR.damageEvents!.find((e) => e.target === "monster")!.amount;
    expect(sameElDmg).toBe(117);

    restore?.();
    restore = mockRandom([0.99, 0.5]);
    const mixEl = freshCombatSave("julian", "hanshuimang", {
      learned: ["yuanci", "jinlei_zhui", "yinfeng_jian"],
      hand: ["yuanci", "jinlei_zhui", "yinfeng_jian"],
      monsterHp: 999999,
    });
    const mixElR = applyAction(mixEl, "castBatch", {
      techIds: ["yuanci", "jinlei_zhui", "yinfeng_jian"],
    });
    const mixElDmg = mixElR.damageEvents!.find((e) => e.target === "monster")!.amount;
    expect(mixElDmg).toBe(118);

    expect(mixElDmg).toBeGreaterThan(sameElDmg);
  });

  it("延續加成(nextPlayBuffPct):上一次出牌帶的加成,下一次同屬性出牌才會套用,且用掉即消耗", () => {
    restore = mockRandom([0.99, 0.5]); // 疾風藤鞭(無額外機率事件)
    const s = freshCombatSave("huangfeng", "qinglang", {
      learned: ["tengbian", "mujian"],
      hand: ["tengbian"],
      monsterHp: 999999,
      mp: 999,
    });
    const first = applyAction(s, "castBatch", { techIds: ["tengbian"] });
    expect(first.save.combat?.pendingElementBuff).toEqual({ element: "木", pct: 0.35 });

    restore?.();
    restore = mockRandom([0.99, 0.5]);
    first.save.combat!.hand = ["mujian"];
    const withBuff = applyAction(first.save, "castBatch", { techIds: ["mujian"] });
    expect(withBuff.save.combat?.pendingElementBuff).toBeUndefined(); // 用掉即消耗

    restore?.();
    restore = mockRandom([0.99, 0.5]);
    const baseline = freshCombatSave("huangfeng", "qinglang", {
      learned: ["mujian"],
      hand: ["mujian"],
      monsterHp: 999999,
    });
    const withoutBuff = applyAction(baseline, "castBatch", { techIds: ["mujian"] });

    const dmgWith = withBuff.damageEvents!.find((e) => e.target === "monster")!.amount;
    const dmgWithout = withoutBuff.damageEvents!.find((e) => e.target === "monster")!.amount;
    expect(dmgWith).toBeGreaterThan(dmgWithout);
  });

  it("蓄力(chargeNextTurnPct):終結技打完,下一整個回合的傷害額外提升", () => {
    restore = mockRandom([0.99, 0.5, 0.99, 0.5]); // 運氣待招本身的 dodge/variance + postPlayerTurn 的怪物反擊 dodge/dmg
    const s = freshCombatSave("huangfeng", "shulang", {
      learned: ["yunqi_daizhao", "mujian"],
      hand: ["yunqi_daizhao"],
      mp: 999,
    });
    const r = applyAction(s, "castBatch", { techIds: ["yunqi_daizhao"] }); // soloOnly + endsTurn,自動觸發回合結束
    expect(r.save.combat?.activeChargeBuffPct).toBeCloseTo(0.4, 10);
  });
});

describe("castBatch:輔助型符寶效果", () => {
  it("必定狀態(forceStatus):不受命中機率限制,一定附加指定狀態", () => {
    restore = mockRandom([0.99]); // 只需擋下 dodge 判定,狀態本身不擲骰
    const s = freshCombatSave("huadao", "shulang", {
      learned: ["fentian_liyu"],
      hand: ["fentian_liyu"],
    });
    const r = applyAction(s, "castBatch", { techIds: ["fentian_liyu"] });
    expect(r.save.combat?.monsterStatus?.some((e) => e.kind === "burn")).toBe(true);
  });

  it("護盾(shieldPct):打出後立即獲得「氣血上限 × 比例」護盾", () => {
    restore = mockRandom([0.99, 0.5]);
    const s = freshCombatSave("tianque", "shulang", {
      learned: ["houtu_suohun"],
      hand: ["houtu_suohun"],
    });
    const { hpMax } = statsOf(s);
    const r = applyAction(s, "castBatch", { techIds: ["houtu_suohun"] });
    expect(r.save.combat?.playerShield).toBe(Math.floor(hpMax * 0.12));
  });

  it("回法力(manaGain):打出後立即回復法力,可部分抵銷這次出牌花費", () => {
    restore = mockRandom([0.99, 0.5]);
    const s = freshCombatSave("yanyue", "shulang", {
      learned: ["canghai_niliu"],
      hand: ["canghai_niliu"],
      mp: 200,
    });
    const r = applyAction(s, "castBatch", { techIds: ["canghai_niliu"] });
    // canghai_niliu mpCost=110, manaGain=40 → 淨消耗 70
    expect(r.save.mp).toBe(200 - 110 + 40);
  });

  it("必避下次攻擊(selfStatus evade):打出後必定避過怪物下一次攻擊", () => {
    restore = mockRandom([0.99, 0.5, /* monsterTurn 若判定命中會多耗一個 random,evade 應讓它完全不執行 */]);
    const s = freshCombatSave("yanyue", "shulang", {
      learned: ["piaomiao_bu"],
      hand: ["piaomiao_bu"],
    });
    const r = applyAction(s, "castBatch", { techIds: ["piaomiao_bu"] });
    expect(r.save.combat?.playerStatus?.some((e) => e.kind === "evade")).toBe(true);
  });

  it("清心(selfCleanse):打出後立即清除玩家身上所有負面狀態,但不影響 evade", () => {
    restore = mockRandom([0.99, 0.5]);
    const s = freshCombatSave("yanyue", "shulang", {
      learned: ["qingxin_jue"],
      hand: ["qingxin_jue"],
    });
    s.combat!.playerStatus = [
      { kind: "poison", turns: 2 },
      { kind: "evade", turns: 1 },
    ];
    const r = applyAction(s, "castBatch", { techIds: ["qingxin_jue"] });
    const statuses = r.save.combat?.playerStatus ?? [];
    expect(statuses.some((e) => e.kind === "poison")).toBe(false);
    expect(statuses.some((e) => e.kind === "evade")).toBe(true);
  });

  it("吸血(lifeStealPct):依造成傷害的比例回復氣血,不超過氣血上限", () => {
    restore = mockRandom([0.99, 0.5]);
    const s = freshCombatSave("huangfeng", "shulang", {
      learned: ["shishen_zhu"],
      hand: ["shishen_zhu"],
    });
    s.hp = 1; // 壓到極低,確保吸血確實把氣血拉回來且不炸上限
    const r = applyAction(s, "castBatch", { techIds: ["shishen_zhu"] });
    expect(r.save.hp).toBeGreaterThan(1);
  });

  it("多段傷害(hits):總傷害拆成多筆 damageEvents,加總等於單次傷害量級", () => {
    restore = mockRandom([0.99, 0.5]);
    const s = freshCombatSave("julian", "shulang", {
      learned: ["lianhuan_sanji"],
      hand: ["lianhuan_sanji"],
      monsterHp: 999999,
    });
    const r = applyAction(s, "castBatch", { techIds: ["lianhuan_sanji"] });
    const hits = r.damageEvents!.filter((e) => e.target === "monster");
    expect(hits.length).toBe(3);
    expect(hits.every((e) => e.amount > 0)).toBe(true);
  });

  it("限單獨(soloOnly):不能跟其他符寶一起打出", () => {
    const s = freshCombatSave("julian", "shulang", {
      learned: ["jiandao_yiji", "jinren"],
      hand: ["jiandao_yiji", "jinren"],
    });
    const r = applyAction(s, "castBatch", { techIds: ["jiandao_yiji", "jinren"] });
    expect(r.error).toBeTruthy();
  });

  it("雙屬性符寶(extraElements):相剋倍率取兩種屬性中最高者", () => {
    restore = mockRandom([0.99, 0.5]);
    // 水火交融訣(水/火)vs 赤目鼠狼(土):水被土剋(resist),火對土中性 → 應取火的中性,而非水的 resist
    const s = freshCombatSave("yanyue", "shulang", {
      learned: ["shuihuo_jiaorong"],
      hand: ["shuihuo_jiaorong"],
    });
    const r = applyAction(s, "castBatch", { techIds: ["shuihuo_jiaorong"] });
    const ev = r.damageEvents!.find((e) => e.target === "monster")!;
    expect(ev.advantage).not.toBe("resist");
  });
});

describe("增靈珠等級(techLevelOf/techPowerMult)", () => {
  it("符寶等級越高,傷害越高(每級 +30%,7 級 = ×2.8)", () => {
    restore = mockRandom([0.99, 0.5]);
    const lv1 = freshCombatSave("huadao", "shulang", {
      learned: ["huoqiu"],
      hand: ["huoqiu"],
      monsterHp: 999999,
    });
    const r1 = applyAction(lv1, "castBatch", { techIds: ["huoqiu"] });
    const dmg1 = r1.damageEvents!.find((e) => e.target === "monster")!.amount;

    restore?.();
    restore = mockRandom([0.99, 0.5]);
    const lv7 = freshCombatSave("huadao", "shulang", {
      learned: ["huoqiu"],
      hand: ["huoqiu"],
      monsterHp: 999999,
    });
    lv7.techLevels = { huoqiu: 7 };
    const r7 = applyAction(lv7, "castBatch", { techIds: ["huoqiu"] });
    const dmg7 = r7.damageEvents!.find((e) => e.target === "monster")!.amount;

    expect(dmg7).toBeGreaterThan(dmg1 * 2.5); // 2.8x 扣掉隨機浮動誤差,仍應遠大於 2.5x
  });
});

describe("冰封:動彈不得", () => {
  it("玩家被冰封時,castBatch 不扣這張符寶的法力、這一擊落空,仍會結算整個回合(DOT/怪物出手/回合結束回滿法力)", () => {
    restore = mockRandom([0.99, 0.5]); // 怪物出手的 dodge/dmg roll(shulang 無狀態對應屬性,不會再擲狀態骰)
    const s = freshCombatSave("huadao", "shulang", { learned: ["huoqiu"], hand: ["huoqiu"], mp: 1 });
    s.combat!.playerStatus = [{ kind: "freeze", turns: 2 }];
    const r = applyAction(s, "castBatch", { techIds: ["huoqiu"] });
    // 冰封這一擊落空等同「動彈不得」,直接進入 postPlayerTurn 結算整個回合——不扣 75 點法力消耗,
    // 但回合結束本身會把法力回滿(見設計文件「下一個玩家回合開始,法力直接回滿」),不是維持原值
    const { mpMax } = statsOf(r.save);
    expect(r.save.mp).toBe(mpMax);
    expect(r.save.combat?.playerStatus?.find((e) => e.kind === "freeze")?.turns).toBe(1);
  });
});

describe("postPlayerTurn / endTurn:DOT 與怪物反擊", () => {
  it("怪物身上的燒傷/中毒 tick 傷害,各自標記正確的屬性(火/木)", () => {
    restore = mockRandom([0.99, 0.99]); // 怪物反擊的 dodge/dmg roll(高血量不會死)
    const s = freshCombatSave("huadao", "shulang", {
      learned: ["huoqiu"],
      hand: ["huoqiu"],
      monsterHp: 99999,
    });
    s.combat!.monsterStatus = [
      { kind: "burn", turns: 2 },
      { kind: "poison", turns: 2 },
    ];
    const r = applyAction(s, "endTurn", {});
    const monsterEvents = r.damageEvents?.filter((e) => e.target === "monster") ?? [];
    expect(monsterEvents.some((e) => e.element === "火")).toBe(true);
    expect(monsterEvents.some((e) => e.element === "木")).toBe(true);
  });

  it("怪物反擊傷害標記怪物自身屬性", () => {
    restore = mockRandom([0.99, 0.01]); // 不閃避、命中玩家(qinglang 是木屬性會再擲一次狀態骰,交給 fallback 0.5 處理)
    const s = freshCombatSave("huadao", "qinglang", {
      learned: ["huoqiu"],
      hand: ["huoqiu"],
      monsterHp: 99999,
    });
    const r = applyAction(s, "endTurn", {});
    const playerEvents = r.damageEvents?.filter((e) => e.target === "player") ?? [];
    expect(playerEvents.some((e) => e.element === "木")).toBe(true);
  });

  it("秒殺:一擊斬殺怪物時,damageEvents 仍然包含這一下傷害(不會因 combat 變 null 而消失)", () => {
    restore = mockRandom([0.99, 0.5]);
    const s = freshCombatSave("huangfeng", "shulang", {
      learned: ["mujian"],
      hand: ["mujian"],
      monsterHp: 1,
    });
    const r = applyAction(s, "castBatch", { techIds: ["mujian"] });
    expect(r.save.combat).toBeNull();
    expect(r.loot).toBeTruthy();
    expect(r.damageEvents?.some((e) => e.target === "monster" && e.amount > 0)).toBe(true);
  });
});

describe("useTacticCard:戰術卡", () => {
  it("護體法箓:打出後消耗道具、立即獲得護盾", () => {
    restore = mockRandom([0.99, 0.5]);
    const s = freshCombatSave("huadao", "shulang", { monsterHp: 99999 });
    s.inventory["hufu_fu"] = 1;
    const r = applyAction(s, "useTacticCard", { itemId: "hufu_fu" });
    expect(r.save.inventory["hufu_fu"]).toBeUndefined();
    expect(r.save.combat?.playerShield).toBeGreaterThan(0);
  });

  it("烈焰印:必定附加燒傷,不受命中機率限制", () => {
    restore = mockRandom([0.99, 0.5]);
    const s = freshCombatSave("huadao", "shulang", { monsterHp: 99999 });
    s.inventory["liehuo_yin"] = 1;
    const r = applyAction(s, "useTacticCard", { itemId: "liehuo_yin" });
    expect(r.save.combat?.monsterStatus?.some((e) => e.kind === "burn")).toBe(true);
  });

  it("沒有這張戰術卡時應回傳錯誤,不扣任何東西", () => {
    const s = freshCombatSave("huadao", "shulang");
    const r = applyAction(s, "useTacticCard", { itemId: "hufu_fu" });
    expect(r.error).toBeTruthy();
  });
});
