// 5.2 版三界地理:現在位置、移動計時、傳送陣、坐騎、跨界下界、飛昇落點、舊存檔遷移、移除補法力道具。
import { describe, it, expect, afterEach, vi } from "vitest";
import { applyAction, newSave, normalizeSave, currentZoneOf, geoDropsOf, elementDropOf } from "../engine";
import type { SaveData } from "../engine";
import { REALMS } from "../data/realms";
import { MONSTERS } from "../data/world";
import { ITEMS } from "../data/items";
import { zoneById, zoneVisible, ZONES, ZONE_MAP_POS, zoneOfLocation, homeZoneForStage, ROUTES, CROSS_REALM_MINUTES, VISIT_HOURS } from "../data/geography";
import { LOCATIONS } from "../data/world";
import { mockRandom } from "./testUtils";

const MIN = 60_000;
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
const idxOf = (id: string) => REALMS.findIndex((r) => r.id === id);
function saveAt(realmId: string, zone?: string): SaveData {
  const s = newSave("測試員", "huangfeng");
  s.realmIdx = idxOf(realmId);
  s.stones = 1e12;
  s.energy = 9999;
  // 5.4 版:仙界須先擇定派系;九幽修羅的加成與移動時間、人間傳送陣無關
  if (REALMS[s.realmIdx].stage >= 10) s.faction = "jiuyou";
  if (zone) s.location = { zone };
  normalizeSave(s);
  return s;
}

describe("地域資料", () => {
  it("每個秘境都屬於唯一一個地域", () => {
    for (const l of LOCATIONS) expect(zoneOfLocation(l), l.id).toBeTruthy();
  });
  it("航路兩端都是同一界的地域", () => {
    for (const r of ROUTES) expect(zoneById(r.a)!.tier, `${r.a}-${r.b}`).toBe(zoneById(r.b)!.tier);
  });
});

describe("現在位置與遷移", () => {
  it("新角色在天南", () => {
    expect(currentZoneOf(newSave("t", "huangfeng"))).toBe("tiannan");
  });
  it("舊存檔依境界補上位置:人間放在能進入的最高地域、靈界風元大陸、仙界北寒仙域", () => {
    expect(homeZoneForStage(1)).toBe("tiannan");
    expect(homeZoneForStage(3)).toBe("jindi");
    expect(homeZoneForStage(4)).toBe("luanxinghai");
    expect(homeZoneForStage(6)).toBe("dajin");
    for (const [realm, zone] of [["r5_0", "dajin"], ["r7_1", "fengyuan"], ["feisheng", "beihan"]] as const) {
      const s = newSave("t", "huangfeng") as SaveData;
      delete s.location;
      s.realmIdx = idxOf(realm);
      normalizeSave(s);
      expect(currentZoneOf(s)).toBe(zone);
    }
  });
  it("只能在現在所在地域的秘境狩獵/採集", () => {
    const s = saveAt("r3_0", "luanxinghai");
    expect(applyAction(structuredClone(s), "hunt", { locationId: "caiyaoshan" }).error).toMatch(/須先前往/);
    expect(applyAction(structuredClone(s), "hunt", { locationId: "waihaidao" }).error).toBeUndefined();
  });
});

describe("同一界內移動", () => {
  it("飛遁:真實時間到了才抵達,途中不能狩獵", () => {
    at(T0);
    let s = saveAt("r0_0");
    s = applyAction(s, "travel", { to: "luanxinghai", mode: "fly" }).save;
    expect(s.location?.travel?.arriveAt).toBe(T0 + 20 * MIN);
    expect(currentZoneOf(s)).toBe("tiannan");
    expect(applyAction(structuredClone(s), "hunt", { locationId: "waihaidao" }).error).toMatch(/趕路/);
    at(T0 + 19 * MIN);
    s = applyAction(s, "syncLocation").save;
    expect(s.location?.travel).toBeTruthy();
    at(T0 + 20 * MIN);
    s = applyAction(s, "syncLocation").save;
    expect(s.location?.travel).toBeUndefined();
    expect(currentZoneOf(s)).toBe("luanxinghai");
  });
  it("多段航路時間相加(天南 → 大晉 = 20 + 30)", () => {
    at(T0);
    const s = applyAction(saveAt("r0_0"), "travel", { to: "dajin", mode: "fly" }).save;
    expect(s.location?.travel?.arriveAt).toBe(T0 + 50 * MIN);
  });
  it("傳送陣:付費瞬間抵達,費用加總", () => {
    const s = saveAt("r0_0");
    s.stones = 5000;
    const r = applyAction(s, "travel", { to: "dajin", mode: "portal" }).save;
    expect(currentZoneOf(r)).toBe("dajin");
    expect(r.stones).toBe(5000 - 2200);
  });
  it("沒有傳送陣的航路不能傳送;靈石不足不能傳送", () => {
    expect(applyAction(saveAt("r0_0"), "travel", { to: "jindi", mode: "portal" }).error).toMatch(/傳送陣/);
    const poor = saveAt("r0_0");
    poor.stones = 10;
    expect(currentZoneOf(applyAction(poor, "travel", { to: "luanxinghai", mode: "portal" }).save)).toBe("tiannan");
  });
  it("折返:立即回到出發地", () => {
    at(T0);
    let s = applyAction(saveAt("r0_0"), "travel", { to: "luanxinghai", mode: "fly" }).save;
    s = applyAction(s, "cancelTravel").save;
    expect(s.location?.travel).toBeUndefined();
    expect(currentZoneOf(s)).toBe("tiannan");
  });
  it("未開通的地域不能前往;不能直接飛往他界", () => {
    const s = saveAt("feisheng");
    expect(applyAction(structuredClone(s), "travel", { to: "jinyuan", mode: "fly" }).error).toMatch(/尚未開通/);
    expect(applyAction(structuredClone(s), "travel", { to: "tiannan", mode: "fly" }).error).toMatch(/界壁/);
  });
  it("坐騎縮短時間;險路需要鯤鵬坐騎", () => {
    at(T0);
    const s = saveAt("feisheng", "beihan");
    s.manhuangUnlocked = true;
    const walk = applyAction(structuredClone(s), "travel", { to: "manhuang", mode: "fly" }).save;
    expect(walk.location?.travel?.arriveAt).toBe(T0 + 150 * MIN); // 北寒 → 中土 → 蠻荒
    s.inventory.kunpeng_zuoqi = 1;
    const eq = applyAction(s, "equip", { itemId: "kunpeng_zuoqi" }).save;
    expect(eq.equippedMount).toBe("kunpeng_zuoqi");
    const fly = applyAction(eq, "travel", { to: "manhuang", mode: "fly" }).save;
    expect(fly.location?.travel?.arriveAt).toBe(T0 + 36 * MIN); // 險路 90 × 0.4
  });
  it("閉關中不能動身", () => {
    const s = saveAt("r0_0");
    s.dwellingSlot = 1;
    expect(applyAction(s, "travel", { to: "jindi", mode: "fly" }).error).toMatch(/閉關/);
  });
});

describe("跨界", () => {
  it("破界珠:靈界 → 人間,穿越 30 分鐘,停留 6 小時後被送回;下界不能突破", () => {
    at(T0);
    let s = saveAt("r7_0");
    s.inventory.pojie_zhu = 1;
    expect(applyAction(structuredClone(s), "descend", { itemId: "pojie_zhu", to: "zhongtu" }).error).toBeTruthy();
    s = applyAction(s, "descend", { itemId: "pojie_zhu", to: "tiannan" }).save;
    expect(s.inventory.pojie_zhu ?? 0).toBe(0);
    at(T0 + CROSS_REALM_MINUTES * MIN);
    s = applyAction(s, "syncLocation").save;
    expect(currentZoneOf(s)).toBe("tiannan");
    expect(applyAction(structuredClone(s), "hunt", { locationId: "caiyaoshan" }).error).toBeUndefined();
    s.exp = 1e12;
    expect(applyAction(structuredClone(s), "breakthrough").error).toMatch(/下界/);
    at(T0 + CROSS_REALM_MINUTES * MIN + VISIT_HOURS * 3_600_000);
    s = applyAction(s, "syncLocation").save;
    expect(currentZoneOf(s)).toBe("fengyuan");
    expect(s.location?.visit).toBeUndefined();
  });
  it("返回上界:30 分鐘後回到出發地", () => {
    at(T0);
    let s = saveAt("r7_0", "fengyuan");
    s.inventory.pojie_zhu = 1;
    s = applyAction(s, "descend", { itemId: "pojie_zhu", to: "jindi" }).save;
    at(T0 + 40 * MIN);
    s = applyAction(s, "returnUp").save;
    expect(s.location?.travel?.kind).toBe("return");
    at(T0 + 70 * MIN);
    s = applyAction(s, "syncLocation").save;
    expect(currentZoneOf(s)).toBe("fengyuan");
    expect(s.location?.visit).toBeUndefined();
  });
  it("只能從降靈臺下界(靈界在風元大陸、仙界在北寒仙域)", () => {
    const s = saveAt("r7_0", "leiming");
    s.inventory.pojie_zhu = 1;
    expect(applyAction(s, "descend", { itemId: "pojie_zhu", to: "tiannan" }).error).toMatch(/降靈臺/);
  });
  it("逆星盤:仙界可直達人間;破界珠在仙界只能到靈界", () => {
    const s = saveAt("feisheng");
    s.inventory.pojie_zhu = 1;
    s.inventory.nixing_pan = 1;
    expect(applyAction(structuredClone(s), "descend", { itemId: "pojie_zhu", to: "tiannan" }).error).toBeTruthy();
    expect(applyAction(structuredClone(s), "descend", { itemId: "pojie_zhu", to: "fengyuan" }).error).toBeUndefined();
    expect(applyAction(structuredClone(s), "descend", { itemId: "nixing_pan", to: "tiannan" }).error).toBeUndefined();
  });
  it("突破合體期飛昇靈界,落在風元大陸", () => {
    const s = saveAt("r5_2", "dajin");
    s.exp = REALMS[s.realmIdx].expNeed;
    restore = mockRandom([0]);
    const r = applyAction(s, "breakthrough");
    expect(REALMS[r.save.realmIdx].stage).toBe(7);
    expect(currentZoneOf(r.save)).toBe("fengyuan");
    expect(r.breakResult?.lines.join("")).toMatch(/飛昇靈界/);
  });
});

describe("跨界道具與坐騎的掉落", () => {
  it("靈界地域王掉破界珠與碧眼雷鵬,金源仙帝掉逆星盤與鯤鵬坐騎", () => {
    const lord = MONSTERS.find((m) => m.id === "lord_lingjie")!;
    expect(geoDropsOf(lord).map((d) => d.id)).toEqual(expect.arrayContaining(["pojie_zhu", "biyan_leipeng"]));
    const jy = MONSTERS.find((m) => m.id === "lord_jinyuan")!;
    expect(geoDropsOf(jy).map((d) => d.id)).toEqual(expect.arrayContaining(["nixing_pan", "kunpeng_zuoqi"]));
    const tiannan = MONSTERS.find((m) => m.id === "lord_tiannan")!;
    expect(geoDropsOf(tiannan)).toEqual([]);
  });
  it("五行材料依妖獸五行與所在界", () => {
    const mon = MONSTERS.find((m) => m.id === "lord_tiannan")!;
    const d = elementDropOf(mon)!;
    expect(d.n).toBe(3);
    expect(d.chance).toBe(1);
    expect(d.id.startsWith("wx_fan_")).toBe(true);
    const xian = MONSTERS.find((m) => m.id === "lord_beihan")!;
    expect(elementDropOf(xian)!.id.startsWith("wx_xian_")).toBe(true);
  });
});

describe("移除補法力道具", () => {
  it("道具表不再有補法力的丹藥/仙草", () => {
    expect(ITEMS.filter((i) => i.mp)).toEqual([]);
  });
  it("舊存檔持有者折回靈石", () => {
    const s = newSave("t", "huangfeng");
    s.stones = 0;
    s.inventory.jiuqulingshen = 2;
    s.inventory.huiyuandan = 5;
    normalizeSave(s);
    expect(s.inventory.jiuqulingshen).toBeUndefined();
    expect(s.inventory.huiyuandan).toBeUndefined();
    expect(s.stones).toBe(1800 * 2 + 5 * 5);
  });
});

describe("地圖可見性(5.4 版)", () => {
  it("低階看不到進不去的地域:練氣只看到天南,結丹多了血色禁地與亂星海(越一階)", () => {
    const s = newSave("t", "huangfeng");
    const vis = (stage: number) => ZONES.filter((z) => z.tier === "renjian" && zoneVisible(s, z, stage)).map((z) => z.id);
    expect(vis(1)).toEqual(["tiannan"]);
    expect(vis(3)).toEqual(["tiannan", "jindi", "luanxinghai"]);
    expect(vis(6)).toEqual(["tiannan", "jindi", "luanxinghai", "dajin"]);
  });
  it("仙界未開通的地域不顯示,派系開通的會顯示", () => {
    const s = saveAt("feisheng");
    s.faction = "tianting"; // 天庭不開通任何隱藏地域
    const vis = () => ZONES.filter((z) => z.tier === "xianjie" && zoneVisible(s, z, 10)).map((z) => z.id);
    expect(vis()).not.toContain("huixian");
    s.faction = "jiuyou";
    expect(vis()).toContain("huixian");
  });
  it("每個地域都有地圖座標", () => {
    for (const z of ZONES) expect(ZONE_MAP_POS[z.id], z.id).toBeTruthy();
  });
});

describe("5.4 版:靈環界與仙界直下靈界", () => {
  it("靈環界是靈界第四個地域,三處渡劫期秘境,只有飛遁航路連到風元、血天大陸", () => {
    const z = zoneById("linghuan")!;
    expect(z.tier).toBe("lingjie");
    const locs = LOCATIONS.filter((l) => zoneOfLocation(l)?.id === "linghuan");
    expect(locs.map((l) => l.id)).toEqual(["lh_suixingdai", "lh_guxu", "lh_tianchi"]);
    expect(locs.every((l) => l.reqStage === 9)).toBe(true);
    const routes = ROUTES.filter((r) => r.a === "linghuan" || r.b === "linghuan");
    expect(routes.map((r) => [r.a, r.b].sort().join("|")).sort()).toEqual(["fengyuan|linghuan", "linghuan|xuetian"]);
    expect(routes.every((r) => !r.portalFee)).toBe(true);
  });
  it("大乘期看得到靈環界(越一階),合體期看不到", () => {
    const z = zoneById("linghuan")!;
    expect(zoneVisible(saveAt("r7_0"), z, 8)).toBe(true);
    expect(zoneVisible(saveAt("r6_0"), z, 7)).toBe(false);
  });
  it("自風元大陸飛遁一小時抵達靈環界,可在環外碎星帶狩獵", () => {
    at(T0);
    let s = saveAt("dujie", "fengyuan");
    s = applyAction(s, "travel", { to: "linghuan", mode: "fly" }).save;
    expect(s.location?.travel?.arriveAt).toBe(T0 + 60 * MIN);
    at(T0 + 61 * MIN);
    s = applyAction(s, "syncLocation").save;
    expect(currentZoneOf(s)).toBe("linghuan");
    restore = mockRandom([0.99, 0.99, 0.99, 0.99, 0.99]);
    const r = applyAction(s, "hunt", { locationId: "lh_suixingdai" });
    expect(r.error).toBeUndefined();
  });
  it("仙界往靈界不必經過降靈臺:中土仙域直接以破界珠下到靈環界,時限到了回到中土", () => {
    at(T0);
    let s = saveAt("feisheng", "zhongtu");
    s.inventory.pojie_zhu = 1;
    const r = applyAction(s, "descend", { itemId: "pojie_zhu", to: "linghuan" });
    expect(r.error).toBeUndefined();
    s = r.save;
    expect(s.location?.visit?.returnZone).toBe("zhongtu");
    at(T0 + 31 * MIN);
    s = applyAction(s, "syncLocation").save;
    expect(currentZoneOf(s)).toBe("linghuan");
  });
  it("仙界往人間仍須先到北寒仙域的降靈臺", () => {
    const s = saveAt("feisheng", "zhongtu");
    s.inventory.nixing_pan = 1;
    expect(applyAction(s, "descend", { itemId: "nixing_pan", to: "tiannan" }).error).toMatch(/降靈臺/);
  });
});
