// 5.4 版:十階器具與玄天仙器需要煉製時間(開爐即扣材料,出爐時才擲成敗,失敗材料全數損失)、玄天仙器 25 仙元石 / 35% 失敗率、
// 道祖神念符另需太乙精魂。
import { describe, it, expect, afterEach, vi } from "vitest";
import { applyAction, newSave, normalizeSave } from "../engine";
import type { SaveData } from "../engine";
import { RECIPES } from "../data/world";
import { REALMS } from "../data/realms";
import { craftCostOf, forgeMinutesOf, XUANTIAN_ELEMENTS, XUANTIAN_STONES, XUANTIAN_FORGE_MINUTES, XUANTIAN_FAIL } from "../data/crafting";
import { mockRandom } from "./testUtils";

const MIN = 60_000;
const T0 = new Date("2026-11-03T00:00:00Z").getTime();
let restore: (() => void) | null = null;
afterEach(() => {
  restore?.();
  restore = null;
  vi.useRealTimers();
});
const at = (ms: number) => {
  vi.useFakeTimers();
  vi.setSystemTime(ms);
};
const rec = (id: string) => RECIPES.find((r) => r.id === id)!;

function saveAt(stage: number): SaveData {
  const s = newSave("測試員", "huangfeng");
  s.realmIdx = REALMS.findIndex((r) => r.stage === stage);
  s.faction = "jiuyou";
  s.stones = 1e12;
  s.energy = 999;
  normalizeSave(s);
  return s;
}
function stock(s: SaveData, recipeId: string) {
  const c = craftCostOf(rec(recipeId));
  for (const m of [...c.materials, ...c.elements]) s.inventory[m.id] = (s.inventory[m.id] ?? 0) + m.n;
  return c;
}

describe("煉製時間", () => {
  it("一般仙域裝備 1~2 小時、圖譜進階裝備 4~6 小時;丹藥與十階以下即時完成", () => {
    expect(forgeMinutesOf(rec("r_bh_g_xiaoyue_ren"))).toBe(60);
    expect(forgeMinutesOf(rec("r_bh_b_kunlin_jian"))).toBe(240);
    expect(forgeMinutesOf(rec("r_zt_b_shennian_fu"))).toBe(360);
    for (const r of RECIPES) {
      const m = forgeMinutesOf(r);
      if ((r.reqStage ?? 1) < 10) expect(m, r.id).toBe(0);
      if (m > 0) expect(m === 0 || (m >= 60 && m <= 120) || (m >= 240 && m <= 360), r.id).toBe(true);
    }
    expect(forgeMinutesOf(rec("r_xisuidan"))).toBe(0); // 十階丹藥
  });

  it("開爐即扣材料與靈石;爐中一次一件;火候未到不能出爐;時間到出爐成功", () => {
    at(T0);
    let s = saveAt(10);
    const c = stock(s, "r_bh_g_xiaoyue_ren");
    const stones0 = s.stones;
    s = applyAction(s, "craft", { recipeId: "r_bh_g_xiaoyue_ren" }).save;
    expect(s.forge?.readyAt).toBe(T0 + 60 * MIN);
    expect(s.stones).toBe(stones0 - c.stones);
    for (const m of [...c.materials, ...c.elements]) expect(s.inventory[m.id] ?? 0, m.id).toBe(0);
    stock(s, "r_bh_g_xiaoyue_ren");
    expect(applyAction(structuredClone(s), "craft", { recipeId: "r_bh_g_xiaoyue_ren" }).error).toMatch(/未出爐/);
    expect(applyAction(structuredClone(s), "forgeCollect").error).toMatch(/火候未到/);
    at(T0 + 61 * MIN);
    restore = mockRandom([0.99, 0.5]);
    const r = applyAction(s, "forgeCollect");
    expect(r.loot?.success).toBe(true);
    expect(r.save.forge).toBeNull();
    expect(Object.keys(r.save.inventory).some((k) => k.startsWith("bh_g_xiaoyue_ren@"))).toBe(true);
  });
});

describe("道祖神念符(神器)", () => {
  it("需研讀圖譜並另耗太乙精魂一枚;失敗時太乙精魂與所有材料全數損失", () => {
    at(T0);
    let s = saveAt(10);
    s.unlockedRecipes.push("r_zt_b_shennian_fu");
    const c = stock(s, "r_zt_b_shennian_fu");
    expect(applyAction(structuredClone(s), "craft", { recipeId: "r_zt_b_shennian_fu" }).save.forge).toBeFalsy();
    s.inventory.taiyi_jinghun_baxia = 1;
    s = applyAction(s, "craft", { recipeId: "r_zt_b_shennian_fu" }).save;
    expect(s.inventory.taiyi_jinghun_baxia ?? 0).toBe(0);
    expect(s.forge?.readyAt).toBe(T0 + 360 * MIN);
    at(T0 + 361 * MIN);
    restore = mockRandom([0]);
    const r = applyAction(s, "forgeCollect");
    expect(r.loot?.success).toBe(false);
    expect(r.save.inventory.taiyi_jinghun_baxia ?? 0).toBe(0);
    for (const m of [...c.materials, ...c.elements]) expect(r.save.inventory[m.id] ?? 0, m.id).toBe(0);
    expect(r.save.craftPity?.r_zt_b_shennian_fu).toBe(1);
  });
});

describe("玄天仙器煉化", () => {
  const ready = () => {
    const s = saveAt(12);
    s.inventory.xuantian_canpian = 10;
    s.inventory.poshou_jinhow = 20;
    s.inventory.taiyi_jinghun_tianhu = 1;
    for (const m of XUANTIAN_ELEMENTS) s.inventory[m.id] = m.n;
    return s;
  };
  it("需 25 仙元石,失敗率 35%,煉 6 小時", () => {
    expect(XUANTIAN_STONES).toBe(25 * 100_000_000);
    expect(XUANTIAN_FAIL).toBe(0.35);
    at(T0);
    const poor = ready();
    poor.stones = XUANTIAN_STONES - 1;
    expect(applyAction(poor, "craftXuantian").save.forge).toBeFalsy();
    let s = ready();
    const stones0 = s.stones;
    s = applyAction(s, "craftXuantian").save;
    expect(s.stones).toBe(stones0 - XUANTIAN_STONES);
    expect(s.forge?.failChance).toBe(0.35);
    expect(s.forge?.readyAt).toBe(T0 + XUANTIAN_FORGE_MINUTES * MIN);
  });
  it("出爐:擲出 0.36 成功煉成玄天仙器;擲出 0.34 失敗,殘片、精華、太乙精魂全數損失", () => {
    at(T0);
    const s = applyAction(ready(), "craftXuantian").save;
    at(T0 + 361 * MIN);
    restore = mockRandom([0.36]);
    const ok = applyAction(structuredClone(s), "forgeCollect");
    expect(ok.loot?.success).toBe(true);
    restore();
    restore = mockRandom([0.34]);
    const bad = applyAction(structuredClone(s), "forgeCollect");
    expect(bad.loot?.success).toBe(false);
    expect(bad.save.inventory.xuantian_canpian ?? 0).toBe(0);
    expect(bad.save.inventory.poshou_jinhow ?? 0).toBe(0);
    expect(bad.save.inventory.taiyi_jinghun_tianhu ?? 0).toBe(0);
  });
});
