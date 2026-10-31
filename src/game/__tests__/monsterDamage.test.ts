// 5.1 版妖獸傷害:world.ts 原值的攻擊 + 減法(攻擊 − 防禦 × 防禦係數),並有保底。
// 4.0 的純減法讓築基以後穿上坊市裝備的玩家幾乎只會被打 1 點,5.0 的比例減傷則讓裸裝與頂裝的受傷差到近百倍,
// 這份測試釘死新制的行為。
import { describe, it, expect } from "vitest";
import {
  ATK_TIERS,
  MONSTER_MIN_DMG_FRAC,
  monsterAtkOf,
  monsterTierOf,
  monsterDefCoefOf,
  monsterDamageAfterDef,
  tierBaseAtkOf,
} from "../engine";
import { LOCATIONS, MONSTERS, REGIONS, ELITE_SPAWNS } from "../data/world";

const normalsOf = (key: string) => MONSTERS.filter((m) => monsterTierOf(m.id) === key && !m.isLord && !m.elite);

describe("妖獸歸屬階層", () => {
  it("每個秘境的一般妖獸、地域王、菁英,以及特殊戰鬥的 BOSS 都有階層", () => {
    const ids = new Set<string>();
    for (const l of LOCATIONS) {
      l.monsters.forEach((id) => ids.add(id));
      if (l.lordId) ids.add(l.lordId);
      if (ELITE_SPAWNS[l.id]) ids.add(ELITE_SPAWNS[l.id]);
    }
    for (const r of REGIONS) if (r.lordId) ids.add(r.lordId);
    for (const id of ["tianjie_shenling", "jinxian", "huanxiang_taisui", "boss_guanghan", "boss_kunpeng"]) ids.add(id);
    for (const id of ids) expect(monsterTierOf(id), id).toBeDefined();
  });

  it("出沒於多個秘境的妖獸,歸屬最低的那一階", () => {
    // 魔化同時出沒於 5 階魔淵與 6 階陰界裂隙
    expect(monsterTierOf("mohua")).toBe("5");
  });
});

describe("減法 + 防禦係數", () => {
  it("沒有防禦時是全額;防禦每多一點,傷害就少「防禦係數」點", () => {
    expect(monsterDamageAfterDef(1000, 0, 0.5)).toBe(1000);
    expect(monsterDamageAfterDef(1000, 600, 0.5)).toBe(700);
    expect(monsterDamageAfterDef(1000, 601, 0.5)).toBe(699);
  });

  it("防禦再高也有保底,不會被壓到 1", () => {
    expect(monsterDamageAfterDef(1000, 1e9, 0.5)).toBe(Math.floor(1000 * MONSTER_MIN_DMG_FRAC));
    expect(monsterDamageAfterDef(3, 1e9, 0.5)).toBe(1);
  });

  it("每一階:裸裝約兩倍目標、參考防禦剛好目標、參考防禦兩倍以上落到保底", () => {
    for (const [key, t] of Object.entries(ATK_TIERS)) {
      const mon = normalsOf(key)[0];
      if (!mon) continue;
      const atk = tierBaseAtkOf(key);
      const coef = monsterDefCoefOf(mon);
      const pct = (def: number) => monsterDamageAfterDef(atk, def, coef) / t.refHp;
      expect(pct(0), key).toBeCloseTo(t.target * 2, 2);
      expect(pct(t.refDef), key).toBeCloseTo(t.target, 2);
      expect(pct(t.refDef * 2), key).toBeCloseTo(t.target * 2 * MONSTER_MIN_DMG_FRAC, 2);
      expect(pct(t.refDef * 100), key).toBeCloseTo(t.target * 2 * MONSTER_MIN_DMG_FRAC, 2);
    }
  });

  it("舊制的問題不再發生:元嬰坊市裝備防禦 818 時,一般妖獸仍打掉約目標比例", () => {
    const t = ATK_TIERS["4"];
    for (const m of normalsOf("4")) {
      const pct = monsterDamageAfterDef(monsterAtkOf(m), 818, monsterDefCoefOf(m)) / t.refHp;
      expect(pct, m.id).toBeGreaterThan(0.04);
    }
  });

  it("高階玩家回到低階秘境只吃保底:約為目標比例的 30%", () => {
    const t = ATK_TIERS["2"];
    const mon = normalsOf("2")[0];
    const dmg = monsterDamageAfterDef(monsterAtkOf(mon), 16600, monsterDefCoefOf(mon));
    expect(dmg).toBe(Math.max(1, Math.floor(monsterAtkOf(mon) * MONSTER_MIN_DMG_FRAC)));
    expect(dmg / t.refHp).toBeLessThan(t.target * 1.3 * 2 * MONSTER_MIN_DMG_FRAC + 0.01);
  });
});

describe("妖獸攻擊力取 world.ts 原值", () => {
  it("一般妖獸、菁英、地域王的攻擊力都是資料裡寫的數字,不再另外換算", () => {
    for (const m of MONSTERS) expect(monsterAtkOf(m), m.id).toBe(Math.max(1, m.atk));
  });
});
