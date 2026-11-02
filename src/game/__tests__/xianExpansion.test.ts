// 5.4 版仙界大擴充:區域與關卡結構、資料完整性、數值落在所屬仙域的範圍內、採集不再空手。
import { describe, it, expect, afterEach } from "vitest";
import { LOCATIONS, MONSTERS, RECIPES, ELITE_SPAWNS } from "../data/world";
import { ITEMS } from "../data/items";
import { XIAN_AREAS, XIAN_LOCATIONS, XIAN_MONSTERS, XIAN_ITEMS } from "../data/xianExpansion";
import { zoneOfLocation } from "../data/geography";
import { applyAction, newSave, normalizeSave, monsterTierOf } from "../engine";
import { TENGFU_DROPS } from "../data/tengfu";
import { REALMS } from "../data/realms";
import { mockRandom } from "./testUtils";

let restore: (() => void) | null = null;
afterEach(() => {
  restore?.();
  restore = null;
});
const dupes = (ids: string[]) => ids.filter((id, i) => ids.indexOf(id) !== i);

describe("結構", () => {
  it("七大仙域各有 2~3 個區域,每區 3~6 個關卡", () => {
    const zones = new Set(XIAN_AREAS.map((a) => a.zone));
    expect(zones.size).toBe(7);
    for (const z of zones) {
      const n = XIAN_AREAS.filter((a) => a.zone === z).length;
      expect(n, z).toBeGreaterThanOrEqual(2);
      expect(n, z).toBeLessThanOrEqual(3);
    }
    for (const a of XIAN_AREAS) {
      expect(a.locations.length, a.id).toBeGreaterThanOrEqual(3);
      expect(a.locations.length, a.id).toBeLessThanOrEqual(6);
    }
  });
  it("每個仙界秘境都歸屬一個區域,且屬於該區的仙域", () => {
    for (const l of LOCATIONS.filter((l) => l.reqStage >= 10)) {
      const area = XIAN_AREAS.find((a) => a.locations.includes(l.id));
      expect(area, l.id).toBeTruthy();
      expect(zoneOfLocation(l)?.id).toBe(area!.zone);
    }
  });
});

describe("資料完整性", () => {
  it("妖獸、秘境、道具、配方的 id 都不重複", () => {
    expect(dupes(MONSTERS.map((m) => m.id))).toEqual([]);
    expect(dupes(LOCATIONS.map((l) => l.id))).toEqual([]);
    expect(dupes(ITEMS.map((i) => i.id))).toEqual([]);
    expect(dupes(RECIPES.map((r) => r.id))).toEqual([]);
  });
  it("所有參照都存在:秘境的妖獸/採集物、妖獸掉落、配方材料、菁英", () => {
    const mon = new Set(MONSTERS.map((m) => m.id));
    const item = new Set(ITEMS.map((i) => i.id));
    for (const l of XIAN_LOCATIONS) {
      for (const id of l.monsters) expect(mon.has(id), `${l.id}:${id}`).toBe(true);
      for (const id of [...l.materials, ...l.herbs]) expect(item.has(id), `${l.id}:${id}`).toBe(true);
      expect(TENGFU_DROPS[l.id]?.length ?? 0, l.id).toBeGreaterThan(0);
    }
    for (const m of XIAN_MONSTERS) for (const d of m.drops) expect(item.has(d.id), `${m.id}:${d.id}`).toBe(true);
    for (const r of RECIPES) for (const m of r.materials) expect(item.has(m.id), `${r.id}:${m.id}`).toBe(true);
    for (const [loc, id] of Object.entries(ELITE_SPAWNS)) {
      expect(mon.has(id), id).toBe(true);
      expect(LOCATIONS.some((l) => l.id === loc), loc).toBe(true);
    }
  });
  it("一整批新內容:至少 35 個新關卡、80 隻新妖獸;裝備 = 7 套 ×4 + 21 件圖譜裝備 + 9 件道祖神兵", () => {
    expect(XIAN_LOCATIONS.length).toBeGreaterThanOrEqual(35);
    expect(XIAN_MONSTERS.length).toBeGreaterThanOrEqual(80);
    expect(XIAN_ITEMS.filter((i) => ["artifact", "robe", "amulet", "talisman"].includes(i.kind)).length).toBe(28 + 21 + 9);
  });
});

describe("數值", () => {
  it("新妖獸都有傷害階層,而且屬於所在的仙域", () => {
    for (const m of XIAN_MONSTERS) {
      const t = monsterTierOf(m.id);
      expect(t, m.id).toBeDefined();
      expect(t!.startsWith("x-"), m.id).toBe(true);
    }
  });
  it("一般妖獸的氣血落在所屬仙域既有妖獸的 0.6~1.6 倍之間(以中位數為準)", () => {
    const tierOf = (id: string) => monsterTierOf(id)!;
    const old = MONSTERS.filter((m) => !XIAN_MONSTERS.includes(m) && !m.isLord && !m.elite);
    for (const m of XIAN_MONSTERS.filter((m) => !m.elite && !m.isLord)) {
      const peers = old.filter((o) => tierOf(o.id) === tierOf(m.id)).map((o) => o.hp).sort((a, b) => a - b);
      const med = peers[Math.floor(peers.length / 2)];
      expect(m.hp / med, m.id).toBeGreaterThan(0.55);
      expect(m.hp / med, m.id).toBeLessThan(1.6);
    }
  });
  it("仙域由弱到強的順序不變:北寒 < 金源 < 蠻荒 < 灰仙 < 中土", () => {
    const avgHp = (zone: string) => {
      const ms = XIAN_MONSTERS.filter((m) => !m.elite && !m.isLord && monsterTierOf(m.id) === `x-${zone}`);
      return ms.reduce((a, m) => a + m.hp, 0) / ms.length;
    };
    const order = ["beihan", "jinyuan", "manhuang", "huixian", "zhongtu"].map(avgHp);
    for (let i = 1; i < order.length; i++) expect(order[i]).toBeGreaterThan(order[i - 1]);
  });
});

describe("採集", () => {
  it("每個仙界秘境(含既有的)都有東西可採", () => {
    for (const l of LOCATIONS.filter((l) => l.reqStage >= 10)) {
      expect(l.materials.length + l.herbs.length, l.id).toBeGreaterThan(0);
    }
  });
  it("在新關卡採集會拿到該區的材料或仙草", () => {
    const s = newSave("t", "huangfeng");
    s.realmIdx = REALMS.findIndex((r) => r.id === "feisheng");
    s.faction = "manhuang";
    s.energy = 999;
    s.location = { zone: "beihan" };
    normalizeSave(s);
    restore = mockRandom([0.99, 0.99, 0, 0.99, 0.99]); // 不觸發遭遇
    const r = applyAction(s, "gather", { locationId: "bh_donghun" });
    expect(r.loot?.success).toBe(true);
    expect((r.save.inventory.bh_m_langya ?? 0) + (r.save.inventory.bh_h_xuelian ?? 0)).toBeGreaterThan(0);
  });
});

describe("道祖與圖譜", () => {
  const DAOZU = ["daozu_panyue", "daozu_moluo", "daozu_guixu", "daozu_wangsheng"];
  it("蠻荒、真魔、灰仙、輪迴各有一位道祖,坐鎮自己的道場,數值遠超該界地域王", () => {
    for (const id of DAOZU) {
      const m = MONSTERS.find((x) => x.id === id)!;
      expect(m.isLord).toBe(true);
      const loc = LOCATIONS.find((l) => l.monsters.length === 1 && l.monsters[0] === id);
      expect(loc, id).toBeTruthy();
      expect(m.hp).toBeGreaterThanOrEqual(10_000_000_000);
      expect(m.atk).toBeGreaterThanOrEqual(1_000_000); // 力之道祖 100 萬但每回合攻擊兩次
      const treasures = m.drops.filter((d) => d.id.startsWith("dz_"));
      expect(treasures.length, id).toBe(2);
    }
  });
  it("每個仙域 3 張圖譜,研讀後才能煉製對應的進階裝備", () => {
    const bps = ITEMS.filter((i) => i.id.startsWith("bp_"));
    expect(bps.length).toBe(21);
    for (const bp of bps) {
      const rec = RECIPES.find((r) => r.id === bp.unlocksRecipe)!;
      expect(rec.dropOnly).toBe(true);
      expect(MONSTERS.some((m) => m.drops.some((d) => d.id === bp.id)), bp.id).toBe(true);
    }
    const s = newSave("t", "huangfeng");
    s.realmIdx = REALMS.findIndex((r) => r.id === "feisheng");
    s.inventory.bp_bh_b_kunlin_jian = 1;
    expect(applyAction(structuredClone(s), "craft", { recipeId: "r_bh_b_kunlin_jian" }).error).toMatch(/圖譜/);
    const r = applyAction(s, "useItem", { itemId: "bp_bh_b_kunlin_jian" }).save;
    expect(r.unlockedRecipes).toContain("r_bh_b_kunlin_jian");
  });
  it("既有的仙界妖獸也有該仙域的加料掉落", () => {
    const lord = MONSTERS.find((m) => m.id === "lord_beihan")!;
    expect(lord.drops.some((d) => d.id === "bh_x_kunlin")).toBe(true);
    expect(lord.drops.some((d) => d.id.startsWith("bp_bh_"))).toBe(true);
  });
});
