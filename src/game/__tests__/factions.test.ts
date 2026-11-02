// 5.4 版仙界派系:飛昇擇派、入派開通航路、加成、領地(巡守截殺/過路費/功勳)、歸宗令、商店、叛派、破空。
import { describe, it, expect, afterEach, vi } from "vitest";
import { applyAction, newSave, normalizeSave, statsOf, currentZoneOf, tollOf } from "../engine";
import type { SaveData } from "../engine";
import { REALMS } from "../data/realms";
import { zoneById, zoneUnlocked } from "../data/geography";
import { relationOf, type FactionId } from "../data/factions";
import { mockRandom } from "./testUtils";

const MIN = 60_000;
const HOUR = 3_600_000;
const T0 = new Date("2026-11-01T00:00:00Z").getTime();
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
const XIAN = REALMS.findIndex((r) => r.id === "feisheng");
function xian(faction: FactionId | null, zone = "zhongtu"): SaveData {
  const s = newSave("測試員", "huangfeng");
  s.realmIdx = XIAN;
  s.faction = faction;
  s.stones = 1e12;
  s.energy = 99999;
  s.location = { zone };
  normalizeSave(s);
  s.hp = statsOf(s).hpMax;
  return s;
}
// 讓目前的戰鬥一擊結束
function winFight(s: SaveData): SaveData {
  s.combat!.monsterHp = 1;
  s.combat!.hand = ["spell_attack"];
  s.mp = 999;
  restore?.();
  restore = mockRandom([0.99, 0.5, 0.99, 0.99, 0.99, 0.99]);
  return applyAction(s, "castBatch", { techIds: ["spell_attack"] }).save;
}

describe("擇定派系", () => {
  it("舊存檔的真仙沒有派系:標記待選,且不能狩獵、移動", () => {
    const s = xian(null);
    expect(s.factionPending).toBe(true);
    expect(applyAction(structuredClone(s), "hunt", { locationId: "nantianmen" }).error).toMatch(/擇定派系/);
    expect(applyAction(structuredClone(s), "travel", { to: "beihan", mode: "fly" }).error).toMatch(/擇定派系/);
  });
  it("擇定後解除限制;九幽修羅不需灰質破界盤即開通蠻荒與灰仙界", () => {
    const r = applyAction(xian(null), "chooseFaction", { factionId: "jiuyou" });
    expect(r.save.faction).toBe("jiuyou");
    expect(r.save.factionPending).toBe(false);
    expect(r.save.huixianUnlocked).toBe(false);
    expect(zoneUnlocked(r.save, zoneById("huixian")!)).toBe(true);
    expect(zoneUnlocked(r.save, zoneById("manhuang")!)).toBe(true);
    expect(zoneUnlocked(r.save, zoneById("zhenmo")!)).toBe(false);
  });
  it("未飛昇不能擇派", () => {
    expect(applyAction(newSave("t", "huangfeng"), "chooseFaction", { factionId: "tianting" }).error).toBeTruthy();
  });
  it("改投他派:7 天內不行,之後可以且功勳歸零", () => {
    at(T0);
    let s = applyAction(xian(null), "chooseFaction", { factionId: "tianting" }).save;
    s.merit = 500;
    expect(applyAction(structuredClone(s), "chooseFaction", { factionId: "lunhui" }).error).toMatch(/等待/);
    at(T0 + 7 * 24 * HOUR);
    s = applyAction(s, "chooseFaction", { factionId: "lunhui" }).save;
    expect(s.faction).toBe("lunhui");
    expect(s.merit).toBe(0);
  });
  it("渡劫飛昇落在北寒仙域並等待擇派", () => {
    const s = newSave("t", "huangfeng");
    s.realmIdx = XIAN - 1;
    s.inventory.zhenxiandan = 1;
    s.exp = REALMS[s.realmIdx].expNeed;
    s.energy = 999;
    s.location = { zone: "fengyuan" };
    let r = applyAction(s, "breakthrough").save; // 進入天劫試煉
    expect(r.combat?.tianjieTrial).toBe(true);
    r.combat!.monsterHp = 1;
    r.combat!.hand = ["spell_attack"];
    r.mp = 999;
    restore = mockRandom(Array(20).fill(0)); // 天劫神靈不閃避、飛昇擲骰必中
    r = applyAction(r, "castBatch", { techIds: ["spell_attack"] }).save;
    expect(REALMS[r.realmIdx].stage).toBe(10);
    expect(currentZoneOf(r)).toBe("beihan");
    expect(r.factionPending).toBe(true);
  });
});

describe("敵友關係", () => {
  it("天庭與輪迴殿死敵、兩魔道互為敵對、蠻荒勢力與所有派系中立", () => {
    expect(relationOf("tianting", "lunhui")).toBe("enemy");
    expect(relationOf("jiuyou", "zhenmo")).toBe("hostile");
    for (const f of ["tianting", "lunhui", "jiuyou", "zhenmo"] as const) expect(relationOf("manhuang", f)).toBe("neutral");
  });
});

describe("加成", () => {
  it("天庭防禦 +8%、輪迴殿攻擊 +8%、蠻荒勢力氣血 +10%", () => {
    const none = statsOf(xian("jiuyou"));
    expect(statsOf(xian("lunhui")).atk).toBe(Math.floor(none.atk * 1.08));
    expect(statsOf(xian("manhuang")).hpMax).toBe(Math.floor(none.hpMax * 1.1));
    const tt = xian("tianting");
    tt.inventory.bh_xuanwu_jia = 1;
    const base = xian("jiuyou");
    base.inventory.bh_xuanwu_jia = 1;
    const a = applyAction(tt, "equip", { itemId: "bh_xuanwu_jia" }).save;
    const b = applyAction(base, "equip", { itemId: "bh_xuanwu_jia" }).save;
    expect(statsOf(a).def).toBe(Math.floor(statsOf(b).def * 1.08));
  });
  it("天庭:中土 → 北寒移動 ×0.75、仙界傳送陣半價;與天庭敵對者不得使用仙界傳送陣", () => {
    at(T0);
    const tt = applyAction(xian("tianting"), "travel", { to: "beihan", mode: "fly" }).save;
    expect(tt.location?.travel?.arriveAt).toBe(T0 + Math.ceil(30 * 0.75) * MIN);
    const p = xian("tianting");
    p.stones = 10_000_000;
    expect(applyAction(p, "travel", { to: "beihan", mode: "portal" }).save.stones).toBe(10_000_000 - 1_500_000);
    expect(applyAction(xian("lunhui"), "travel", { to: "beihan", mode: "portal" }).error).toMatch(/傳送陣/);
  });
  it("輪迴殿:兩顆破界珠代替逆星盤、下界停留 12 小時", () => {
    at(T0);
    const s = xian("lunhui", "beihan");
    s.inventory.pojie_zhu = 2;
    const r = applyAction(s, "descend", { itemId: "pojie_zhu", to: "tiannan" }).save;
    expect(r.inventory.pojie_zhu ?? 0).toBe(0);
    expect(r.location?.visit?.until).toBe(T0 + 30 * MIN + 12 * HOUR);
    const other = xian("tianting", "beihan");
    other.inventory.pojie_zhu = 2;
    expect(applyAction(other, "descend", { itemId: "pojie_zhu", to: "tiannan" }).error).toBeTruthy();
  });
  it("輪迴殿:每 24 小時一次戰敗不損失靈石", () => {
    at(T0);
    const s = xian("lunhui", "beihan");
    s.stones = 1000;
    s.combat = { monsterId: "bh_hanpeng", monsterHp: 1e9, locationId: "xuanbing_yuan", hand: [], deck: [], discard: [], monsterStatus: [], playerStatus: [] };
    s.hp = 1;
    restore = mockRandom([0.99, 0.01, 0.99, 0.99]);
    const r = applyAction(s, "endTurn").save;
    expect(r.combat).toBeNull();
    expect(r.stones).toBe(1000);
  });
});

describe("領地", () => {
  it("輪迴殿成員在天庭領地狩獵,可能遭天兵巡守截殺;擊殺得 30 功勳", () => {
    let s = xian("lunhui");
    restore = mockRandom([0]);
    s = applyAction(s, "hunt", { locationId: "nantianmen" }).save;
    expect(s.combat?.monsterId).toBe("guard_tianting");
    expect(s.combat?.factionGuard).toBe(true);
    s = winFight(s);
    expect(s.combat).toBeNull();
    expect(s.merit).toBe(30);
  });
  it("天庭成員在本派領地擊殺妖獸 +1 功勳,不會遭巡守", () => {
    let s = xian("tianting");
    restore = mockRandom([0, 0.99, 0.99, 0]);
    s = applyAction(s, "hunt", { locationId: "nantianmen" }).save;
    expect(s.combat?.factionGuard).toBeUndefined();
    s = winFight(s);
    expect(s.merit).toBe(1);
  });
  it("前往中立派系領地要繳過路費;本派不必", () => {
    const tt = xian("tianting");
    tt.manhuangUnlocked = true;
    const toll = tollOf(tt, "manhuang");
    expect(toll).toBeGreaterThan(0);
    expect(tollOf(xian("manhuang"), "manhuang")).toBe(0);
    expect(tollOf(tt, "beihan")).toBe(0);
    const before = tt.stones;
    const r = applyAction(tt, "travel", { to: "manhuang", mode: "fly" }).save;
    expect(r.stones).toBe(before - toll);
  });
});

describe("歸宗令與派系商店", () => {
  it("歸宗令瞬移回本派領地,12 小時冷卻", () => {
    at(T0);
    let s = xian("tianting", "beihan");
    s = applyAction(s, "recall").save;
    expect(currentZoneOf(s)).toBe("zhongtu");
    s.location = { zone: "beihan" };
    expect(applyAction(structuredClone(s), "recall").error).toMatch(/靈光未復/);
    at(T0 + 12 * HOUR);
    expect(currentZoneOf(applyAction(s, "recall").save)).toBe("zhongtu");
  });
  it("以功勳兌換;不能買他派的坐騎", () => {
    const s = xian("tianting");
    s.merit = 2000;
    const r = applyAction(s, "buyFaction", { itemId: "mount_tianma" }).save;
    expect(r.inventory.mount_tianma).toBe(1);
    expect(r.merit).toBe(500);
    expect(applyAction(r, "buyFaction", { itemId: "mount_moqi" }).error).toBeTruthy();
  });
});

describe("破空", () => {
  it("祭出玄天仙器可在同界瞬移,8 小時冷卻;沒有玄天仙器不行", () => {
    at(T0);
    expect(applyAction(xian("tianting"), "rift", { to: "beihan" }).error).toMatch(/玄天仙器/);
    const s = xian("tianting");
    s.equippedWeapon = "xuantian_zhanling_jian@150";
    const r = applyAction(s, "rift", { to: "beihan" }).save;
    expect(currentZoneOf(r)).toBe("beihan");
    expect(applyAction(r, "rift", { to: "zhongtu" }).error).toMatch(/未復/);
  });
  it("玄天斬靈劍可免破界珠往下一界", () => {
    at(T0);
    const s = xian("tianting", "beihan");
    s.equippedWeapon = "xuantian_zhanling_jian@150";
    const r = applyAction(s, "descend", { itemId: "xuantian_zhanling_jian", to: "fengyuan" }).save;
    expect(r.location?.travel?.kind).toBe("descend");
  });
});
