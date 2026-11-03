// 5.4 版:擊敗蠻荒四大地域王後現身血肉聖殿;聖殿妖獸 4% 掉落界域殘圖,打開完全隨機開啟
// 輪迴界/真魔界/灰仙界/積菱空境/茶水仙域其一;舊的開通方式(真魔門令、灰質破界盤、雲遊尋輪迴)移除。
import { describe, it, expect, afterEach } from "vitest";
import { applyAction, newSave, normalizeSave } from "../engine";
import type { SaveData } from "../engine";
import { MONSTERS, LOCATIONS } from "../data/world";
import { REALMS } from "../data/realms";
import { ZONES, zoneById, zoneUnlocked, ROUTES, CANTU_ZONES, MANHUANG_LORDS } from "../data/geography";
import { mockRandom } from "./testUtils";

let restore: (() => void) | null = null;
afterEach(() => {
  restore?.();
  restore = null;
});

function xian(stage = 10): SaveData {
  const s = newSave("測試員", "huangfeng");
  s.realmIdx = REALMS.findIndex((r) => r.stage === stage);
  s.faction = "tianting";
  s.manhuangUnlocked = true;
  s.energy = 999;
  s.location = { zone: "manhuang" };
  normalizeSave(s);
  return s;
}
const killLord = (s: SaveData, lordId: string) => {
  // 法器攻擊:黑眼貔貅會封印法術攻擊
  s.combat = { monsterId: lordId, monsterHp: 1, locationId: "manhuang_tianhu", isLord: true, hand: ["artifact_attack"], deck: [], discard: [], monsterStatus: [], playerStatus: [] };
  return applyAction(s, "castBatch", { techIds: ["artifact_attack"] });
};

describe("血肉聖殿", () => {
  it("四隻妖獸都會 4% 掉落界域殘圖", () => {
    const sanctum = LOCATIONS.find((l) => l.id === "xuerou_shengdian")!;
    expect(sanctum.region).toBe("manhuang");
    expect(sanctum.monsters.map((id) => MONSTERS.find((m) => m.id === id)!.name).sort()).toEqual(
      ["搬山古仙猿", "天荒青鸞", "蠻荒異獸", "鯤鵬殘魂"].sort(),
    );
    for (const id of sanctum.monsters) {
      expect(MONSTERS.find((m) => m.id === id)!.drops.find((d) => d.id === "jieyu_cantu")?.chance).toBe(0.04);
    }
  });
  it("擊敗四大地域王之前進不去;第四位伏誅時聖殿現世", () => {
    let s = xian();
    expect(applyAction(structuredClone(s), "hunt", { locationId: "xuerou_shengdian" }).error).toMatch(/尚未現世/);
    for (const id of MANHUANG_LORDS.slice(0, 3)) s = killLord(s, id).save;
    expect(applyAction(structuredClone(s), "hunt", { locationId: "xuerou_shengdian" }).error).toMatch(/尚未現世/);
    const r = killLord(s, MANHUANG_LORDS[3]);
    expect(r.loot?.title).toMatch(/血 肉 聖 殿/);
    restore = mockRandom([0.99, 0.99, 0.99, 0.99, 0.99, 0]);
    expect(applyAction(r.save, "hunt", { locationId: "xuerou_shengdian" }).error).toBeUndefined();
  });
  it("舊存檔:太乙境視為四王已斬;手上的太乙精魂回推對應的地域王", () => {
    const a = newSave("測試員", "huangfeng");
    a.realmIdx = REALMS.findIndex((r) => r.stage === 12);
    delete (a as Partial<SaveData>).manhuangLordsSlain;
    normalizeSave(a);
    expect(a.manhuangLordsSlain?.length).toBe(4);
    const b = newSave("測試員", "huangfeng");
    delete (b as Partial<SaveData>).manhuangLordsSlain;
    b.inventory.taiyi_jinghun_baxia = 1;
    normalizeSave(b);
    expect(b.manhuangLordsSlain).toEqual(["lord_baxia"]);
  });
});

describe("界域殘圖", () => {
  it("打開完全隨機開啟五處之一;抽到已開通的則白白耗掉", () => {
    expect(CANTU_ZONES.sort()).toEqual(["chashui", "huixian", "jiling", "lunhui", "zhenmo"]);
    const s = xian();
    s.inventory.jieyu_cantu = 2;
    restore = mockRandom([0.79]); // 第 4 個(0.79 × 5 = 3.95)
    const id = CANTU_ZONES[3];
    const r = applyAction(s, "useItem", { itemId: "jieyu_cantu" });
    expect(zoneUnlocked(r.save, zoneById(id)!)).toBe(true);
    expect(r.loot?.success).toBe(true);
    restore();
    restore = mockRandom([0.79]);
    const again = applyAction(r.save, "useItem", { itemId: "jieyu_cantu" });
    expect(again.loot?.success).toBe(false);
    expect(again.save.inventory.jieyu_cantu ?? 0).toBe(0);
  });
  it("舊的真魔門令、灰質破界盤 1:1 換成界域殘圖", () => {
    const s = newSave("測試員", "huangfeng");
    s.inventory.zhenmo_menling = 2;
    s.inventory.huizhi_pojiepan = 1;
    normalizeSave(s);
    expect(s.inventory.zhenmo_menling).toBeUndefined();
    expect(s.inventory.jieyu_cantu).toBe(3);
  });
  it("積菱空境、茶水仙域皆由蠻荒飛遁前往;茶水仙域妖獸很弱但大量掉落補品", () => {
    for (const z of ["jiling", "chashui"]) {
      expect(ZONES.some((x) => x.id === z)).toBe(true);
      expect(ROUTES.some((r) => (r.a === "manhuang" && r.b === z) || (r.b === "manhuang" && r.a === z))).toBe(true);
    }
    const cs = MONSTERS.filter((m) => m.id.startsWith("cs_") && !m.elite);
    expect(cs.length).toBeGreaterThan(0);
    for (const m of cs) {
      expect(m.atk).toBeLessThan(100_000);
      const healing = m.drops.filter((d) => ["xianyuan_huichun", "jiuzhuan_xianlu", "taiyi_huanhun"].includes(d.id));
      expect(healing.reduce((a, d) => a + d.chance, 0), m.id).toBeGreaterThan(0.6);
    }
    const jl = MONSTERS.filter((m) => m.id.startsWith("jl_") && !m.elite);
    const hx = MONSTERS.filter((m) => m.id.startsWith("hx_") && !m.elite && !m.isLord);
    const avg = (xs: typeof jl) => xs.reduce((a, m) => a + m.atk, 0) / xs.length;
    expect(avg(jl)).toBeGreaterThan(avg(hx));
  });
});
