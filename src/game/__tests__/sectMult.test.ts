// 宗門聲勢戰鬥加成——這是戰力稽核(2026-09-21)點名的「無上限」變數之一。4.0 版戰鬥平衡性修正
// 把它封頂在 SECT_MULT_CAP(見「戰鬥膨脹診斷卷」),這份測試改成釘死「封頂確實生效」,
// 未來如果又悄悄被繞過或拿掉,這裡會直接變紅。
import { describe, it, expect } from "vitest";
import { sectDamageMultOfStages, SECT_STAGE_BONUS, SECT_MULT_CAP } from "../engine";

describe("sectDamageMultOfStages", () => {
  it("沒有符合門檻的同門時,倍率為 1(無加成)", () => {
    expect(sectDamageMultOfStages([])).toBe(1);
    expect(sectDamageMultOfStages([1, 2, 3])).toBe(1); // 練氣~結丹未達門檻(元嬰以上才算)
    expect(sectDamageMultOfStages([null, undefined])).toBe(1);
  });

  it("未達封頂前,每位達標同門依境界疊加對應比例,公式為純加總", () => {
    // 3 位元嬰(stage 4,各 +0.03,3.19 版由 +0.05 下修)
    expect(sectDamageMultOfStages([4, 4, 4])).toBeCloseTo(1.09, 10);
    // 混合境界(總和遠低於封頂,照常加總)
    expect(sectDamageMultOfStages([4, 5, 7])).toBeCloseTo(
      1 + SECT_STAGE_BONUS[4] + SECT_STAGE_BONUS[5] + SECT_STAGE_BONUS[7],
      10,
    );
  });

  it("封頂生效——宗門規模再大,倍率也不會超過 SECT_MULT_CAP", () => {
    // 3 位真仙(stage 10,各 +0.12):1+0.36,遠低於封頂
    expect(sectDamageMultOfStages([10, 10, 10])).toBeCloseTo(1.36, 10);
    // 10 位真仙:1+1.2=2.2,已超過封頂 2,應被夾在 SECT_MULT_CAP
    expect(sectDamageMultOfStages(Array(10).fill(10))).toBeCloseTo(SECT_MULT_CAP, 10);
    // 20 位真仙、100 位太乙境:封頂修正前會分別衝到 9.0、121,修正後兩者都應等於同一個上限
    expect(sectDamageMultOfStages(Array(20).fill(10))).toBeCloseTo(SECT_MULT_CAP, 10);
    expect(sectDamageMultOfStages(Array(100).fill(12))).toBeCloseTo(SECT_MULT_CAP, 10);
  });
});
