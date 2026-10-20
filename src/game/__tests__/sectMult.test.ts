// 宗門聲勢戰鬥加成——這是戰力稽核(2026-09-21)點名的「無上限」變數之一,這裡把它的行為釘死成
// 測試,未來如果決定加封頂,這份測試會直接變紅、提醒要同步更新,而不是悄悄被遺忘。
import { describe, it, expect } from "vitest";
import { sectDamageMultOfStages, SECT_STAGE_BONUS } from "../engine";

describe("sectDamageMultOfStages", () => {
  it("沒有符合門檻的同門時,倍率為 1(無加成)", () => {
    expect(sectDamageMultOfStages([])).toBe(1);
    expect(sectDamageMultOfStages([1, 2, 3])).toBe(1); // 練氣~結丹未達門檻(元嬰以上才算)
    expect(sectDamageMultOfStages([null, undefined])).toBe(1);
  });

  it("每位達標同門依境界疊加對應比例,公式為純加總", () => {
    // 3 位元嬰(stage 4,各 +0.05)
    expect(sectDamageMultOfStages([4, 4, 4])).toBeCloseTo(1.15, 10);
    // 3 位真仙(stage 10,各 +0.4)
    expect(sectDamageMultOfStages([10, 10, 10])).toBeCloseTo(2.2, 10);
    // 混合境界
    expect(sectDamageMultOfStages([4, 5, 7])).toBeCloseTo(
      1 + SECT_STAGE_BONUS[4] + SECT_STAGE_BONUS[5] + SECT_STAGE_BONUS[7],
      10,
    );
  });

  it("【已知設計問題】完全沒有封頂——宗門規模越大,倍率可以無限疊加", () => {
    // 20 位真仙:1 + 20×0.4 = 9.0
    expect(sectDamageMultOfStages(Array(20).fill(10))).toBeCloseTo(9.0, 10);
    // 100 位太乙境(每位 +1.2):1 + 100×1.2 = 121,無任何上限檢查會擋下這個數字
    expect(sectDamageMultOfStages(Array(100).fill(12))).toBeCloseTo(121, 10);
  });
});
