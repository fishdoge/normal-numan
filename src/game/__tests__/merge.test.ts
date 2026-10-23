// 5.0 版合併測試:magic-ui(3.19)與 magic-ui-reimagined(4.0~4.2)合併後,兩邊的數值、內容、存檔都要同時成立。
// fixtures/save-3.19*.json 是用 magic-ui 分支的引擎實際產生的存檔(有煞氣、無滕符陣欄位),
// fixtures/save-4.2.json 是用 4.2 版引擎產生的存檔(有滕符陣、無 3.19 欄位)。
import { describe, it, expect, afterEach } from "vitest";
import { existsSync } from "fs";
import * as E from "../engine";
import type { SaveData } from "../engine";
import { MONSTERS, LOCATIONS } from "../data/world";
import { REALMS } from "../data/realms";
import { TECHNIQUES } from "../data/techniques";
import { TENGFU, TENGFU_DROPS, tengfuBonusOf } from "../data/tengfu";
import { regionArt, sceneOfLocation } from "../data/sceneArt";
import { buildPvpFighter, newMatch, playMove, endTurn, isMatchOver, PVP_DAMAGE_MULT } from "../pvpEngine";
import { techById } from "../data/techniques";
import { mockRandom } from "./testUtils";
import save319 from "./fixtures/save-3.19.json";
import save319Combat from "./fixtures/save-3.19-in-combat.json";
import save42 from "./fixtures/save-4.2.json";

const load = (x: unknown) => JSON.parse(JSON.stringify(x)) as SaveData;
const xianIdx = REALMS.findIndex((r) => r.stage === 10);
let restore: (() => void) | null = null;
afterEach(() => {
  restore?.();
  restore = null;
});

describe("數值:3.19 的削弱 + 4.0 的封頂同時生效", () => {
  it("仙靈力每點 ×0.02(3.19),封頂 ×5 仍在(4.0,需 200 點才碰到)", () => {
    expect(E.XIANLI_MULT).toBe(0.02);
    expect(E.XIANLI_MULT_CAP).toBe(5);
    const s = newXian();
    const atk0 = E.statsOf({ ...s, xianli: 0 }).atk;
    expect(E.statsOf({ ...s, xianli: 50 }).atk).toBe(Math.floor(atk0 * 2));
    expect(E.statsOf({ ...s, xianli: 200 }).atk).toBe(Math.floor(atk0 * 5));
    expect(E.statsOf({ ...s, xianli: 9999 }).atk).toBe(Math.floor(atk0 * 5));
  });

  it("宗門加成為 3.19 數值,總倍率仍封頂 ×2", () => {
    expect(E.SECT_STAGE_BONUS).toEqual({ 4: 0.03, 5: 0.04, 6: 0.05, 7: 0.06, 8: 0.08, 10: 0.12, 11: 0.16, 12: 0.25 });
    expect(E.SECT_MULT_CAP).toBe(2);
    expect(E.sectDamageMultOfStages(Array(50).fill(12))).toBe(2);
  });

  it("4.0 的符寶連攜封頂與妖獸平衡乘數仍在", () => {
    expect(E.SYNERGY_STACK_CAP).toBe(2);
    expect(E.COMBO_SIZE_STACK_CAP).toBe(2);
    expect(E.MONSTER_HP_BALANCE_MULT).toBe(2.5);
    expect(E.MONSTER_ATK_BALANCE_MULT).toBe(1.5);
  });

  it("3.19 的妖獸攻擊力調整寫在資料裡(以 3.18 → 3.19 有改動的兩隻為例)", () => {
    // 3.18 原值:青狼 atk 3 → 3.19 的 2;蠻荒黑眼貔貅 12414 → 8690(-30%)
    expect(MONSTERS.find((m) => m.id === "qinglang")!.atk).toBe(2);
    expect(MONSTERS.find((m) => m.id === "lord_pixiu")!.atk).toBe(8690);
  });

  it("浮屠塔:每層氣血 ×1.4、攻擊 ×1.2,再乘上 4.0 的全域乘數", () => {
    const base = MONSTERS.find((m) => m.id === "huanxiang_taisui")!;
    for (const floor of [1, 5, 12]) {
      const s = newXian();
      s.jinyuanUnlocked = true;
      s.futuFloor = floor - 1;
      const r = E.applyAction(s, "challengeFutu").save;
      expect(r.combat!.bossHpMax).toBe(Math.floor(base.hp * Math.pow(1.4, floor - 1) * E.MONSTER_HP_BALANCE_MULT));
      expect(r.combat!.bossAtk).toBe(Math.floor(base.atk * Math.pow(1.2, floor - 1) * E.MONSTER_ATK_BALANCE_MULT));
    }
  });
});

describe("存檔相容:3.19 存檔 → 5.0", () => {
  it("補上滕符陣欄位,保留煞氣、解鎖旗標、煞屬性符寶與背包", () => {
    const s = load(save319);
    expect(s.tengfuGrid).toBeUndefined();
    E.normalizeSave(s);
    expect(s.tengfuGrid).toEqual([]);
    expect(s.tengfuBag).toEqual({});
    expect(s.shaqi).toBe(4200);
    expect(s.zhenmoUnlocked && s.huixianUnlocked && s.tongtianUnlocked).toBe(true);
    expect(s.learned).toContain("shaqi_yidao");
    expect(s.inventory.guanghanjie).toBe(1);
    // 4.2 的基礎卡片下限也一併補上
    const pouch = E.effectivePouch(s);
    expect(pouch.filter((id) => id === "artifact_attack").length).toBeGreaterThanOrEqual(E.BASIC_CARD_MIN);
    expect(pouch.filter((id) => id === "spell_attack").length).toBeGreaterThanOrEqual(E.BASIC_CARD_MIN);
    expect(() => E.statsOf(s)).not.toThrow();
  });

  it("遷移可重複執行、結果不變", () => {
    const s = load(save319Combat);
    E.normalizeSave(s);
    const once = JSON.stringify(s);
    E.normalizeSave(s);
    expect(JSON.stringify(s)).toBe(once);
  });

  it("3.19 在灰仙界打到一半的存檔,讀進 5.0 後可以繼續出牌打完", () => {
    let s = load(save319Combat);
    E.normalizeSave(s);
    expect(s.combat!.monsterId).toMatch(/^hx_/);
    for (let i = 0; i < 80 && s.combat; i++) {
      const hand = s.combat.hand ?? [];
      const pick = hand.find((id) => techById(id).mpCost <= s.mp);
      s = (pick ? E.applyAction(s, "castBatch", { techIds: [pick] }) : E.applyAction(s, "endTurn")).save;
      if (s.combat && pick) s = E.applyAction(s, "endTurn").save;
      if (s.hp <= 0) break;
    }
    expect(s.combat === null || s.hp <= 0).toBe(true);
  });
});

describe("存檔相容:4.2 存檔 → 5.0", () => {
  it("補上 3.19 欄位(煞氣 0、新區域未解鎖),保留滕符陣與其加成", () => {
    const s = load(save42);
    expect(s.shaqi).toBeUndefined();
    E.normalizeSave(s);
    expect(s.shaqi).toBe(0);
    expect(s.zhenmoUnlocked).toBe(false);
    expect(s.huixianUnlocked).toBe(false);
    expect(s.tongtianUnlocked).toBe(false);
    expect(s.tengfuGrid.length).toBe(3);
    expect(s.tengfuBag.tf_feisheng).toBe(2);
    const withGrid = E.statsOf(s);
    const noGrid = E.statsOf({ ...s, tengfuGrid: [] });
    expect(withGrid.atk).toBeGreaterThan(noGrid.atk);
  });
});

describe("新區域與伺服器端檢查", () => {
  it("真魔界、灰仙界未解鎖時無法狩獵或採集;解鎖後可以", () => {
    const s = newXian();
    expect(E.applyAction(structuredClone(s), "hunt", { locationId: "huixian_jie" }).error).toBe("此地尚未開啟");
    expect(E.applyAction(structuredClone(s), "gather", { locationId: "zhenmo_yuan" }).error).toBe("此地尚未開啟");
    s.huixianUnlocked = true;
    const r = E.applyAction(structuredClone(s), "hunt", { locationId: "huixian_jie" });
    expect(r.error).toBeUndefined();
    expect(r.save.combat).toBeTruthy();
  });

  it("金源仙域、蠻荒異界同樣需要解鎖(舊版只在前端隱藏)", () => {
    const s = newXian();
    expect(E.applyAction(structuredClone(s), "hunt", { locationId: "jy_guan1" }).error).toBe("此地尚未開啟");
    expect(E.applyAction(structuredClone(s), "hunt", { locationId: "manhuang_tianhu" }).error).toBe("此地尚未開啟");
    s.jinyuanUnlocked = true;
    expect(E.applyAction(structuredClone(s), "hunt", { locationId: "jy_guan1" }).error).toBeUndefined();
  });

  it("一般區域不受解鎖檢查影響", () => {
    const s = E.newSave("t", "huangfeng");
    expect(E.applyAction(s, "hunt", { locationId: "caiyaoshan" }).error).toBeUndefined();
  });

  it("灰仙界妖獸無視五行相剋", () => {
    const hx = MONSTERS.filter((m) => m.id.startsWith("hx_") || m.id === "lord_huixian");
    expect(hx.length).toBeGreaterThan(0);
    for (const m of hx) {
      expect(m.ignoresCounters).toBe(true);
      for (const el of ["金", "木", "水", "火", "土"] as const) expect(E.elementMult(el, m.element, m.ignoresCounters)).toBe(1);
    }
  });

  it("每個秘境(含真魔界、灰仙界)都有滕符可掉落,新增的兩張六品滕符各有出處", () => {
    for (const l of LOCATIONS) expect(TENGFU_DROPS[l.id]?.length ?? 0, l.id).toBeGreaterThan(0);
    expect(TENGFU_DROPS.zhenmo_yuan).toContain("tf_zhenmo");
    expect(TENGFU_DROPS.huixian_jie).toContain("tf_huixian");
    expect(TENGFU.find((t) => t.id === "tf_zhenmo")!.tier).toBe(6);
  });

  it("新區域與一次性秘境都有場景插畫", () => {
    for (const p of [regionArt("zhenmo"), regionArt("huixian"), sceneOfLocation("__map_guanghanjie__").src, sceneOfLocation("__map_kunpeng_yihai__").src]) {
      expect(p).toMatch(/^\/images\/world\/regions\//);
      expect(existsSync(`public${p}`), p).toBe(true);
    }
  });
});

describe("煞氣(3.19)在合併後的戰鬥中照常運作", () => {
  it("真仙擊殺妖獸煞氣 +1", () => {
    let s = newXian();
    s.shaqi = 10;
    s = E.applyAction(s, "hunt", { locationId: "xuanbing_yuan" }).save;
    s.combat!.monsterHp = 1;
    s = E.applyAction(s, "castBatch", { techIds: [s.combat!.hand!.find((id) => techById(id).mpCost <= s.mp)!] }).save;
    expect(s.combat).toBeNull();
    expect(s.shaqi).toBe(11);
  });

  it("煞氣 5000 時一般符寶傷害減半;煞屬性符寶反而提升", () => {
    const dmgOf = (shaqi: number, techId: string) => {
      const s = newXian();
      s.shaqi = shaqi;
      s.learned = [...s.learned, techId];
      s.mp = 99999;
      const mon = MONSTERS.find((m) => m.id === "bh_hanpeng")!;
      s.combat = { monsterId: mon.id, monsterHp: 1e15, locationId: "xuanbing_yuan", hand: [techId], deck: [], discard: [], monsterStatus: [], playerStatus: [] };
      restore = mockRandom([0.5, 0.99, 0.99, 0.99]);
      const r = E.applyAction(s, "castBatch", { techIds: [techId] });
      restore();
      restore = null;
      return r.damageEvents!.find((e) => e.target === "monster")!.amount;
    };
    const normal0 = dmgOf(0, "spell_attack");
    const normal5k = dmgOf(5000, "spell_attack");
    expect(normal5k / normal0).toBeCloseTo(0.5, 1);
    const sha0 = dmgOf(0, "shaqi_yidao");
    const sha5k = dmgOf(5000, "shaqi_yidao");
    expect(sha5k).toBeGreaterThan(sha0);
  });
});

describe("一次性秘境地圖(3.19)", () => {
  it("使用廣寒界:開啟 BOSS 戰,氣血套用 4.0 倍率(與前端血條上限一致)", () => {
    let s = newXian();
    s.inventory = { ...s.inventory, guanghanjie: 1 };
    s = E.applyAction(s, "useItem", { itemId: "guanghanjie" }).save;
    const boss = MONSTERS.find((m) => m.id === s.combat!.monsterId)!;
    expect(s.combat!.locationId).toBe("__map_guanghanjie__");
    expect(s.combat!.monsterHp).toBe(E.monsterHpOf(boss));
    expect(s.inventory.guanghanjie ?? 0).toBe(0);
  });
});

describe("通天閣 PvP(3.19)", () => {
  it("兩位真仙可完整打完一場,傷害為 1/20,滕符陣加成計入 PvP 攻擊力", () => {
    const a = load(save319);
    E.normalizeSave(a);
    const b = load(save319);
    E.normalizeSave(b);
    b.tengfuGrid = [{ id: "tf_zhenmo", r: 0, c: 0 }];
    const fa = buildPvpFighter(1, "甲", a);
    const fb = buildPvpFighter(2, "乙", b);
    expect(fb.atk).toBeGreaterThan(fa.atk);
    expect(fb.atk).toBe(E.statsOf(b).atk);
    expect(tengfuBonusOf(b.tengfuGrid).atk).toBeGreaterThan(0);
    expect(PVP_DAMAGE_MULT).toBe(0.05);

    let st = newMatch(fa, fb);
    for (let i = 0; i < 2000 && !isMatchOver(st); i++) {
      const me = st.fighters.find((f) => f.userId === st.turnUserId)!;
      // 每回合把法力用完:一張一張打出負擔得起的符寶,打不出時結束回合
      const pick = me.hand.find((id) => techById(id).mpCost <= me.mp);
      st = pick ? playMove(st, me.userId, [pick]) : endTurn(st);
      for (const f of st.fighters) expect(f.hp).toBeGreaterThanOrEqual(0);
    }
    expect(isMatchOver(st)).toBe(true);
  });

  it("每回合開始時法力回滿(5.0 修正:3.19 原版不會回復,對戰會卡死)", () => {
    const a = load(save319);
    E.normalizeSave(a);
    let st = newMatch(buildPvpFighter(1, "甲", a), buildPvpFighter(2, "乙", load(save319)));
    const first = st.fighters[0];
    const card = first.hand.find((id) => techById(id).mpCost > 0 && techById(id).mpCost <= first.mp)!;
    st = playMove(st, 1, [card]);
    if (st.turnUserId === 1) st = endTurn(st);
    st = endTurn(st); // 乙不出牌,換回甲
    expect(st.turnUserId).toBe(1);
    expect(st.fighters[0].mp).toBe(st.fighters[0].mpMax);
  });
});

describe("內容總數", () => {
  it("符寶 106 張(含 5 張煞屬性)、滕符 49 種", () => {
    expect(TECHNIQUES.length).toBe(106);
    expect(TECHNIQUES.filter((t) => t.element === "煞").length).toBe(5);
    expect(TENGFU.length).toBe(49);
  });
});

function newXian(): SaveData {
  const s = E.newSave("真仙", "huangfeng");
  s.realmIdx = xianIdx;
  const { hpMax, mpMax } = E.statsOf(s);
  s.hp = hpMax;
  s.mp = mpMax;
  s.energy = 99999;
  return s;
}
