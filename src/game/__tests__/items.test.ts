// itemById 的品質浮動解析(report.md 2026-08-12 點名「本專案最巧妙的資料設計」,但一直沒有測試覆蓋)。
import { describe, it, expect } from "vitest";
import { itemById, itemDefByDisplayName, ITEMS } from "../data/items";

describe("itemById:品質浮動道具(基底id@品質%)", () => {
  it("沒有 @ 時直接回傳原始道具", () => {
    const item = itemById("qingsuo");
    expect(item.name).toBe("青索劍");
    expect(item.atkBonus).toBe(6);
  });

  it("品質 113% 時,攻擊力等比例縮放並四捨五入,名稱附註 +13%", () => {
    const item = itemById("qingsuo@113");
    expect(item.id).toBe("qingsuo@113");
    expect(item.name).toBe("青索劍(+13%)");
    expect(item.atkBonus).toBe(Math.max(1, Math.round((6 * 113) / 100)));
  });

  it("品質低於 100% 時名稱顯示負號,但數值縮放最低保底為 1", () => {
    const item = itemById("qingsuo@10");
    expect(item.name).toBe("青索劍(-90%)");
    expect(item.atkBonus).toBeGreaterThanOrEqual(1);
  });

  it("縮放只套用在 atk/def/speed 三項加成,其餘欄位(desc/price/element)維持原樣", () => {
    const base = itemById("qingsuo");
    const scaled = itemById("qingsuo@150");
    expect(scaled.desc).toBe(base.desc);
    expect(scaled.price).toBe(base.price);
    expect(scaled.element).toBe(base.element);
  });
});

describe("itemDefByDisplayName", () => {
  it("可用完整原始名稱查回道具", () => {
    expect(itemDefByDisplayName("青索劍")?.id).toBe("qingsuo");
  });

  it("可用帶品質百分比尾綴的顯示名稱查回同一個基底道具", () => {
    expect(itemDefByDisplayName("青索劍(+13%)")?.id).toBe("qingsuo");
  });

  it("查無對應道具時回傳 undefined,不丟錯", () => {
    expect(itemDefByDisplayName("不存在的道具名稱")).toBeUndefined();
  });
});

describe("ITEMS 全表健檢", () => {
  it("id 不重複", () => {
    const ids = ITEMS.map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("每個道具的 price 皆為非負數", () => {
    for (const item of ITEMS) {
      expect(item.price, `${item.name} price 不應為負`).toBeGreaterThanOrEqual(0);
    }
  });
});
