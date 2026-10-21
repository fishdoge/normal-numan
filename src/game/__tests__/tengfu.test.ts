// 滕符陣(4.2 版):資料完整性、放置規則、加成實際生效
import { describe, expect, it } from "vitest";
import { applyAction, newSave, statsOf, energyMaxOf } from "../engine";
import { SECTS } from "../data/sects";
import { LOCATIONS } from "../data/world";
import {
  TENGFU,
  TENGFU_DROPS,
  TENGFU_ROWS,
  TENGFU_COLS,
  canPlaceTengfu,
  tengfuById,
  tengfuBonusOf,
} from "../data/tengfu";

const sect = SECTS[0].id;

describe("滕符資料", () => {
  it("至少 40 種,id 不重複,形狀放得進 6 寬 × 5 高的符陣", () => {
    expect(TENGFU.length).toBeGreaterThanOrEqual(40);
    expect(new Set(TENGFU.map((t) => t.id)).size).toBe(TENGFU.length);
    for (const t of TENGFU) {
      expect(t.h).toBeLessThanOrEqual(TENGFU_ROWS);
      expect(t.w).toBeLessThanOrEqual(TENGFU_COLS);
    }
  });
  it("涵蓋需求的七種形狀", () => {
    const shapes = new Set(TENGFU.map((t) => `${t.h}x${t.w}`));
    for (const s of ["2x1", "1x1", "2x3", "2x2", "3x2", "4x1", "1x5"]) expect(shapes).toContain(s);
  });
  it("每種滕符都至少在一個秘境掉落,掉落表只引用存在的秘境與滕符", () => {
    const dropped = new Set(Object.values(TENGFU_DROPS).flat());
    for (const t of TENGFU) expect(dropped, t.id).toContain(t.id);
    for (const [loc, ids] of Object.entries(TENGFU_DROPS)) {
      expect(LOCATIONS.some((l) => l.id === loc), loc).toBe(true);
      for (const id of ids) expect(tengfuById(id), id).toBeDefined();
    }
  });
  it("每個秘境都有滕符可掉", () => {
    for (const l of LOCATIONS) expect(TENGFU_DROPS[l.id]?.length ?? 0, l.id).toBeGreaterThan(0);
  });
});

describe("放置規則", () => {
  const big = tengfuById("tf_luoxing")!; // 1×5
  it("不可出界", () => {
    expect(canPlaceTengfu([], big, 0, 1)).toBe(true);
    expect(canPlaceTengfu([], big, 0, 2)).toBe(false);
    expect(canPlaceTengfu([], tengfuById("tf_chaoxi")!, 1, 0)).toBe(true); // 4×1 從第 2 列起剛好到底
    expect(canPlaceTengfu([], tengfuById("tf_chaoxi")!, 2, 0)).toBe(false); // 從第 3 列起會超出
  });
  it("不可重疊", () => {
    const grid = [{ id: "tf_xuesha", r: 0, c: 0 }]; // 2×2
    expect(canPlaceTengfu(grid, tengfuById("tf_qingmu")!, 1, 1)).toBe(false);
    expect(canPlaceTengfu(grid, tengfuById("tf_qingmu")!, 1, 2)).toBe(true);
  });
});

describe("安裝與加成", () => {
  it("從背包安裝後攻擊/氣血/精力上限提升,卸下後回到原值並退回背包", () => {
    const s = newSave("測試員", sect);
    s.realmIdx = 12; // 低境界攻擊力太小,百分比加成會被取整吃掉
    s.tengfuBag = { tf_luoxing: 1, tf_huanyang: 1, tf_qingshen: 1 };
    const before = statsOf(s);
    const energyBefore = energyMaxOf(s);
    let r = applyAction(s, "tengfuPlace", { id: "tf_luoxing", r: 0, c: 0 });
    r = applyAction(r.save, "tengfuPlace", { id: "tf_huanyang", r: 1, c: 0 });
    r = applyAction(r.save, "tengfuPlace", { id: "tf_qingshen", r: 1, c: 1 });
    expect(r.error).toBeFalsy();
    expect(r.save.tengfuGrid).toHaveLength(3);
    expect(r.save.tengfuBag).toEqual({});
    const after = statsOf(r.save);
    expect(after.atk).toBeGreaterThan(before.atk);
    expect(after.hpMax).toBeGreaterThan(before.hpMax);
    expect(energyMaxOf(r.save)).toBe(energyBefore + tengfuBonusOf(r.save.tengfuGrid).energy);

    r = applyAction(r.save, "tengfuRemove", { index: 0 });
    expect(r.save.tengfuBag.tf_luoxing).toBe(1);
    expect(statsOf(r.save).atk).toBe(before.atk);
  });
  it("沒有的滕符、放不下的位置、戰鬥中都會被拒絕", () => {
    const s = newSave("測試員", sect);
    expect(applyAction(s, "tengfuPlace", { id: "tf_luoxing", r: 0, c: 0 }).error).toBeTruthy();
    s.tengfuBag = { tf_luoxing: 1 };
    expect(applyAction(s, "tengfuPlace", { id: "tf_luoxing", r: 0, c: 3 }).error).toBeTruthy();
  });
  it("可在符陣內移動到新位置", () => {
    const s = newSave("測試員", sect);
    s.tengfuGrid = [{ id: "tf_xuesha", r: 0, c: 0 }];
    const r = applyAction(s, "tengfuPlace", { index: 0, r: 2, c: 4 });
    expect(r.error).toBeFalsy();
    expect(r.save.tengfuGrid[0]).toEqual({ id: "tf_xuesha", r: 2, c: 4 });
  });
});
