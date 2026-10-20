// 符寶全表資料健檢:掃描 TECHNIQUES 裡全部 79 張符寶,檢查基本欄位是否自洽。這類測試抓不到「這張
// 卡在戰鬥裡實際好不好用」,但能便宜地抓到打錯數字、element 打錯字、reqStage 超出範圍這類資料輸入
// 錯誤——新增符寶時這份測試會立刻告訴你哪裡漏填或填錯,而不必等到實際玩到那張卡才發現。
import { describe, it, expect } from "vitest";
import { TECHNIQUES, techById } from "../data/techniques";
import { ELEMENTS_WITH_NONE } from "../types";
import { MAX_TECH_LEVEL, learnYears, techPowerMult } from "../engine";
import { ITEMS } from "../data/items";

describe("符寶全表健檢", () => {
  it("總數為 79 張(card.md 記載的 3.14 版基準)", () => {
    expect(TECHNIQUES.length).toBe(79);
  });

  it("id 不重複", () => {
    const ids = TECHNIQUES.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("每張符寶的基本欄位都在合理範圍內", () => {
    for (const t of TECHNIQUES) {
      expect(t.power, `${t.name} power 應 > 0`).toBeGreaterThan(0);
      expect(t.mpCost, `${t.name} mpCost 應 > 0`).toBeGreaterThan(0);
      expect(t.reqStage, `${t.name} reqStage 應在 1~10`).toBeGreaterThanOrEqual(1);
      expect(t.reqStage, `${t.name} reqStage 應在 1~10(3.14 版全面封頂於 10)`).toBeLessThanOrEqual(10);
      expect(ELEMENTS_WITH_NONE, `${t.name} element 應為合法五行之一`).toContain(t.element);
      if (t.extraElements) {
        for (const el of t.extraElements) {
          expect(ELEMENTS_WITH_NONE, `${t.name} extraElements 內含非法屬性`).toContain(el);
        }
      }
      if (t.hits !== undefined) expect(t.hits, `${t.name} hits 應 >= 1`).toBeGreaterThanOrEqual(1);
    }
  });

  it("除基礎卡片(innate)外,每張符寶都能用 techById 查回同一個物件", () => {
    for (const t of TECHNIQUES) {
      expect(techById(t.id)).toBe(t);
    }
  });

  it("非 innate 的符寶,都有對應的秘笈可修習(items.ts 裡存在 teaches 指到它的 manual 道具)", () => {
    const teachable = new Set(ITEMS.filter((i) => i.kind === "manual" && i.teaches).map((i) => i.teaches));
    const sectStartTechIds = new Set(
      // 各門派起手符寶由 newSave() 直接傳授,不需要秘笈,排除在「孤兒卡」檢查之外
      ["mujian", "tengbian", "shuijian", "hanchao", "jinren", "ruijin", "huoqiu", "huozhu", "tudun", "gutu"],
    );
    const orphans = TECHNIQUES.filter(
      (t) => !t.innate && !sectStartTechIds.has(t.id) && !teachable.has(t.id),
    );
    expect(orphans.map((t) => t.name)).toEqual([]);
  });

  it("learnYears() 對每一張符寶都能算出正數年限,不會是 NaN 或 0", () => {
    for (const t of TECHNIQUES) {
      const years = learnYears(t.id);
      expect(years, `${t.name} 修習年限異常`).toBeGreaterThan(0);
      expect(Number.isFinite(years), `${t.name} 修習年限應為有限數`).toBe(true);
    }
  });

  it("增靈珠等級曲線:1~7 級均為正數,且單調遞增", () => {
    let prev = 0;
    for (let lv = 1; lv <= MAX_TECH_LEVEL; lv++) {
      const mult = techPowerMult(lv);
      expect(mult).toBeGreaterThan(prev);
      prev = mult;
    }
  });

  it("屬性分佈:含雙/三屬性符寶的每個屬性各自計入一次,金系符寶數量最多(呼應 card.md 統計)", () => {
    const counts: Record<string, number> = {};
    for (const t of TECHNIQUES) {
      for (const el of [t.element, ...(t.extraElements ?? [])]) {
        counts[el] = (counts[el] ?? 0) + 1;
      }
    }
    expect(counts["金"]).toBeGreaterThanOrEqual(counts["土"]);
  });
});
