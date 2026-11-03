// 5.4 版:天地靈氣——現實每 12 小時換一次(台灣時間 00:00 / 12:00);五行同屬性 +20%、被克 −20%;
// 雷/煞天氣仙法 −30%,雷系、煞屬性仙法不受影響。
import { describe, it, expect, afterEach } from "vitest";
import {
  weatherAt,
  weatherOfSlot,
  weatherSlotOf,
  setWeatherOverride,
  playerWeatherMult,
  elementWeatherMult,
  WEATHER_SLOT_MS,
} from "../data/weather";

afterEach(() => setWeatherOverride(null));

describe("換天時間與分布", () => {
  it("台灣時間 00:00 與 12:00 換天,每段 12 小時", () => {
    setWeatherOverride(undefined);
    const t = new Date("2026-11-03T03:00:00+08:00").getTime();
    const w = weatherAt(t);
    expect(new Date(w.startsAt).toISOString()).toBe("2026-11-02T16:00:00.000Z"); // 台灣 11/03 00:00
    expect(w.endsAt - w.startsAt).toBe(WEATHER_SLOT_MS);
    expect(weatherSlotOf(w.endsAt)).toBe(weatherSlotOf(t) + 1);
    expect(weatherAt(w.endsAt - 1).kind).toBe(w.kind); // 同一時段天氣不變
  });
  it("雷、煞罕見(約 8% / 7%),其餘五行大致均分", () => {
    const n = 20000;
    const count: Record<string, number> = {};
    for (let i = 0; i < n; i++) {
      const k = weatherOfSlot(40000 + i);
      count[k] = (count[k] ?? 0) + 1;
    }
    expect(count["雷"] / n).toBeGreaterThan(0.06);
    expect(count["雷"] / n).toBeLessThan(0.1);
    expect(count["煞"] / n).toBeGreaterThan(0.05);
    expect(count["煞"] / n).toBeLessThan(0.09);
    for (const k of ["金", "木", "水", "火", "土"]) {
      expect(count[k] / n, k).toBeGreaterThan(0.14);
      expect(count[k] / n, k).toBeLessThan(0.2);
    }
  });
});

describe("傷害倍率", () => {
  it("五行天氣:同屬性 +20%、被克 −20%(火克金),其他不變", () => {
    expect(elementWeatherMult("火", "火")).toBeCloseTo(1.2);
    expect(elementWeatherMult("火", "金")).toBeCloseTo(0.8);
    expect(elementWeatherMult("火", "水")).toBe(1);
    expect(elementWeatherMult("火", "無")).toBe(1);
    expect(playerWeatherMult("水", { name: "x" }, ["火", "水"])).toBeCloseTo(1.2); // 多屬性取最有利
  });
  it("雷天:仙法 −30%,雷系仙法不受影響;煞天:煞屬性仙法不受影響;妖獸不受雷/煞天氣影響", () => {
    expect(playerWeatherMult("雷", { name: "青元劍訣" }, ["木"])).toBeCloseTo(0.7);
    expect(playerWeatherMult("雷", { name: "五雷連擊" }, ["金"])).toBe(1);
    expect(playerWeatherMult("煞", { name: "x" }, ["火"])).toBeCloseTo(0.7);
    expect(playerWeatherMult("煞", { name: "x" }, ["煞"])).toBe(1);
    expect(elementWeatherMult("雷", "金")).toBe(1);
    expect(elementWeatherMult("煞", "煞")).toBe(1);
  });
});
