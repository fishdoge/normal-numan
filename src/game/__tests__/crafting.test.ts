// 5.3 版五行煉器:裝備配方補五行材料、靈石倍率、失敗率、失敗損失一半主材料、保底;煉丹不受影響。
import { describe, it, expect, afterEach } from "vitest";
import { applyAction, newSave } from "../engine";
import type { SaveData } from "../engine";
import { RECIPES } from "../data/world";
import { craftCostOf, failChanceOfStage, failChanceWithPity, failChanceFinal, pillFailOfStage, recipeStage, ELEMENT_MATERIAL } from "../data/crafting";
import { mockRandom } from "./testUtils";

let restore: (() => void) | null = null;
afterEach(() => {
  restore?.();
  restore = null;
});

const rec = (id: string) => RECIPES.find((r) => r.id === id)!;
function stocked(recipeId: string, times = 1): SaveData {
  const s = newSave("測試員", "huangfeng");
  s.realmIdx = 20; // 足以駕馭人間與靈界配方
  s.energy = 9999;
  const c = craftCostOf(rec(recipeId));
  s.stones = c.stones * times;
  for (const m of [...c.materials, ...c.elements]) s.inventory[m.id] = m.n * times;
  return s;
}

describe("五行成本", () => {
  it("青索劍(人間木):青木髓 ×2、癸水精 ×1(水生木),靈石 ×1.2", () => {
    const c = craftCostOf(rec("r_qingsuo"));
    expect(c.gear).toBe(true);
    expect(c.elements).toEqual([
      { id: ELEMENT_MATERIAL.renjian["木"], n: 2 },
      { id: ELEMENT_MATERIAL.renjian["水"], n: 1 },
    ]);
    expect(c.stones).toBe(Math.ceil(60 * 1.2));
    expect(c.baseFail).toBeCloseTo(failChanceOfStage(1));
  });
  it("配方階層取材料產地:金剛璃甲的蛟龍之鱗來自亂星海(4 階)", () => {
    expect(recipeStage(rec("r_jinganghu"))).toBe(4);
  });
  it("仙界配方用仙品、靈界配方用靈品", () => {
    expect(craftCostOf(rec("r_zaohua_jian")).elements[0].id.startsWith("wx_xian_")).toBe(true);
    expect(craftCostOf(rec("r_leiming_zhanjia")).elements[0].id.startsWith("wx_ling_")).toBe(true);
  });
  it("煉丹配方不加五行、不加靈石;5.4 版起有較溫和的失敗率 min(25%, 2% + 2% × 階層)", () => {
    const c = craftCostOf(rec("r_huanglongdan"));
    expect(c.gear).toBe(false);
    expect(c.elements).toEqual([]);
    expect(c.baseFail).toBeCloseTo(pillFailOfStage(c.stage));
    expect(c.stones).toBe(rec("r_huanglongdan").stones);
    expect(pillFailOfStage(30)).toBe(0.25);
  });
  it("失敗率隨階層升高、上限 40%", () => {
    expect(failChanceOfStage(1)).toBeCloseTo(0.065);
    expect(failChanceOfStage(10)).toBeCloseTo(0.29);
    expect(failChanceOfStage(20)).toBe(0.4);
  });
  it("配方自帶的失敗率較高時取自帶值", () => {
    expect(craftCostOf(rec("r_xuesha_suohunfu")).baseFail).toBeCloseTo(0.32);
  });
});

describe("煉製結果", () => {
  it("成功:扣除全部材料與五行,保底歸零", () => {
    const s = stocked("r_qingsuo");
    s.craftPity = { r_qingsuo: 2 };
    restore = mockRandom([0.99, 0.5]);
    const r = applyAction(s, "craft", { recipeId: "r_qingsuo" });
    expect(r.loot?.success).toBe(true);
    expect(r.save.inventory.qingmu ?? 0).toBe(0);
    expect(r.save.inventory[ELEMENT_MATERIAL.renjian["木"]] ?? 0).toBe(0);
    expect(r.save.stones).toBe(0);
    expect(r.save.craftPity?.r_qingsuo).toBeUndefined();
  });
  it("失敗:靈石與所有材料全數損失,保底 +1", () => {
    const s = stocked("r_qingsuo");
    restore = mockRandom([0]);
    const r = applyAction(s, "craft", { recipeId: "r_qingsuo" });
    expect(r.loot?.success).toBe(false);
    expect(r.save.inventory.qingmu ?? 0).toBe(0);
    expect(r.save.inventory.tiekuang ?? 0).toBe(0);
    expect(r.save.inventory[ELEMENT_MATERIAL.renjian["木"]] ?? 0).toBe(0);
    expect(r.save.stones).toBe(0);
    expect(r.save.craftPity?.r_qingsuo).toBe(1);
  });
  it("保底:每次連續失敗,失敗率 −5%", () => {
    const base = craftCostOf(rec("r_leiming_zhanjia")).baseFail;
    expect(failChanceWithPity(base, 2)).toBeCloseTo(base - 0.1);
    expect(failChanceWithPity(0.06, 3)).toBe(0);
  });
  it("缺五行材料無法煉製", () => {
    const s = stocked("r_qingsuo");
    delete s.inventory[ELEMENT_MATERIAL.renjian["水"]];
    const r = applyAction(s, "craft", { recipeId: "r_qingsuo" });
    expect(r.loot).toBeUndefined();
    expect(r.save.inventory.qingmu).toBe(2);
  });
  it("載具成品不浮動品質,可裝上坐騎槽", () => {
    const s = stocked("r_fengxing_zhou");
    restore = mockRandom([0.99]);
    const r = applyAction(s, "craft", { recipeId: "r_fengxing_zhou" });
    expect(r.save.inventory.fengxing_zhou).toBe(1);
    expect(applyAction(r.save, "equip", { itemId: "fengxing_zhou" }).save.equippedMount).toBe("fengxing_zhou");
  });
});

describe("命器加成(5.4 版)", () => {
  it("命器的突破加成同時降低煉器失敗率", () => {
    expect(failChanceFinal(0.3, 0, 0.1)).toBeCloseTo(0.2);
    expect(failChanceFinal(0.3, 2, 0.1)).toBeCloseTo(0.1);
    expect(failChanceFinal(0.05, 0, 0.1)).toBe(0);
  });
  it("裝備命器後,原本會失敗的擲骰變成功;消耗型命器不會因煉製而耗去", () => {
    const s = stocked("r_qingsuo");
    s.inventory.tianjifu = 1; // 天極符 +8%,消耗型
    s.equippedMing = "tianjifu";
    const fail = craftCostOf(rec("r_qingsuo")).baseFail; // 6.5%
    restore = mockRandom([fail - 0.01, 0.5]); // 沒有命器時會失敗
    const r = applyAction(s, "craft", { recipeId: "r_qingsuo" });
    expect(r.loot?.success).toBe(true);
    expect(r.save.equippedMing).toBe("tianjifu");
    expect(r.save.inventory.tianjifu).toBe(1);
  });
});
