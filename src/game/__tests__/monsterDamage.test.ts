// 5.0 版妖獸傷害:依階層校準的攻擊 + 比例減傷(攻擊 × K ÷ (K + 防禦))。
// 舊制「攻擊 − 防禦」讓築基以後穿上坊市裝備的玩家幾乎只會被打 1 點,這份測試釘死新制的行為。
import { describe, it, expect } from "vitest";
import {
  ATK_TIERS,
  ATK_ROLE_MULT,
  monsterAtkOf,
  monsterTierOf,
  monsterRefDefOf,
  monsterDamageAfterDef,
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

describe("校準:參考玩家被一般妖獸打一下,掉的氣血約等於目標比例", () => {
  for (const [key, t] of Object.entries(ATK_TIERS)) {
    const mons = normalsOf(key);
    if (mons.length === 0) continue;
    it(`階層 ${key}:目標 ${(t.target * 100).toFixed(1)}%`, () => {
      for (const m of mons) {
        const pct = monsterDamageAfterDef(monsterAtkOf(m), t.refDef, monsterRefDefOf(m)) / t.refHp;
        // 階內相對強度夾在 0.75~1.3,所以每隻落在目標的 0.75~1.3 倍之間
        expect(pct, m.id).toBeGreaterThanOrEqual(t.target * 0.75 - 0.002);
        expect(pct, m.id).toBeLessThanOrEqual(t.target * 1.3 + 0.002);
      }
    });
  }
});

describe("比例減傷", () => {
  it("防禦等於 K 時傷害減半;沒有防禦時是全額", () => {
    expect(monsterDamageAfterDef(1000, 0, 500)).toBe(1000);
    expect(monsterDamageAfterDef(1000, 500, 500)).toBe(500);
  });

  it("防禦越高傷害越低,但遠高於妖獸攻擊時也不會被壓到 1", () => {
    // 舊制:元嬰妖獸攻擊約 50,玩家坊市裝備防禦 818 → 只打 1 點
    const mon = normalsOf("4")[0];
    const atk = monsterAtkOf(mon);
    const k = monsterRefDefOf(mon);
    const d818 = monsterDamageAfterDef(atk, 818, k);
    const d1600 = monsterDamageAfterDef(atk, 1600, k);
    expect(d818).toBeGreaterThan(1);
    expect(d1600).toBeLessThan(d818);
    expect(d1600).toBeGreaterThan(1);
  });

  it("高階玩家回到低階秘境,妖獸幾乎打不痛(防禦遠高於該階參考防禦)", () => {
    const t = ATK_TIERS["2"];
    const mon = normalsOf("2")[0];
    const dmg = monsterDamageAfterDef(monsterAtkOf(mon), 16600, monsterRefDefOf(mon));
    expect(dmg / t.refHp).toBeLessThan(0.01);
  });
});

describe("身分倍率", () => {
  it("菁英 ×1.8、地域王 ×2.2,以該階一般妖獸的基準計算", () => {
    const elite = MONSTERS.find((m) => m.elite)!;
    const lord = MONSTERS.find((m) => m.isLord && monsterTierOf(m.id) === "3")!;
    const te = ATK_TIERS[monsterTierOf(elite.id)!];
    const tl = ATK_TIERS[monsterTierOf(lord.id)!];
    expect(monsterAtkOf(elite)).toBe(Math.round(te.target * te.refHp * 2 * ATK_ROLE_MULT.elite));
    expect(monsterAtkOf(lord)).toBe(Math.round(tl.target * tl.refHp * 2 * ATK_ROLE_MULT.lord));
  });
});
