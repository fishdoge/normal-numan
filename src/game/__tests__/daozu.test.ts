// 5.4 版道祖特技:輪迴復活、死寂減傷與同歸寂滅、真魔攻擊浮動與反擊、力之道祖回血雙擊、時間道祖凍結與封法、暴擊。
import { describe, it, expect, afterEach } from "vitest";
import {
  applyAction,
  monsterTraitsOf,
  isCardSealed,
  WANGSHENG_REVIVES,
  GUIXU_DEATH_BLAST,
  PANYUE_REGEN_PCT,
} from "../engine";
import type { SaveData } from "../engine";
import { MONSTERS } from "../data/world";
import { freshCombatSave, mockRandom } from "./testUtils";

let restore: (() => void) | null = null;
afterEach(() => {
  restore?.();
  restore = null;
});
const hpOf = (id: string) => MONSTERS.find((m) => m.id === id)!.hp;
function fight(monId: string, monsterHp = 1): SaveData {
  const s = freshCombatSave("huadao", monId, { hand: ["spell_attack", "spell_attack"], monsterHp });
  s.realmIdx = 27;
  s.hp = 1e12; // 測試只看特技,不讓玩家先倒下
  return s;
}
const hit = (s: SaveData) => applyAction(s, "castBatch", { techIds: ["spell_attack"] });

describe("輪迴道祖 · 往生", () => {
  it("死後復活兩次,第三次才真正擊敗", () => {
    let s = fight("daozu_wangsheng");
    restore = mockRandom(Array(50).fill(0.99));
    for (let i = 1; i <= WANGSHENG_REVIVES; i++) {
      const r = hit(s);
      expect(r.save.combat, `第 ${i} 次`).toBeTruthy();
      expect(r.save.combat!.revivesUsed).toBe(i);
      expect(r.save.combat!.monsterHp).toBe(hpOf("daozu_wangsheng"));
      s = r.save;
      s.combat!.monsterHp = 1;
      s.combat!.hand = ["spell_attack", "spell_attack"];
      s.mp = 999;
    }
    expect(hit(s).save.combat).toBeNull();
  });
});

describe("死寂道祖 · 歸墟", () => {
  it("受到的傷害減半", () => {
    const a = fight("daozu_guixu", 1e15);
    const b = fight("lord_huixian", 1e15);
    restore = mockRandom(Array(20).fill(0.99));
    const da = 1e15 - hit(a).save.combat!.monsterHp;
    restore();
    restore = mockRandom(Array(20).fill(0.99));
    const db = 1e15 - hit(b).save.combat!.monsterHp;
    expect(da).toBeCloseTo(db / 2, -2);
  });
  it("隕落時爆發 50 萬傷害;玩家因此倒下算戰敗、沒有戰利品", () => {
    const s = fight("daozu_guixu");
    s.hp = GUIXU_DEATH_BLAST - 1;
    s.stones = 1000;
    restore = mockRandom(Array(20).fill(0.99));
    const r = hit(s);
    expect(r.loot?.success).toBe(false);
    expect(r.save.stones).toBe(500);
    const s2 = fight("daozu_guixu");
    s2.hp = GUIXU_DEATH_BLAST + 100;
    const r2 = hit(s2);
    expect(r2.loot?.success).toBe(true);
    expect(r2.save.hp).toBe(100);
  });
});

describe("真魔道祖 · 魔羅", () => {
  it("被擊中後可能當場反擊(每次出牌各擲一次)", () => {
    const s = fight("daozu_moluo", 1e15);
    const hp0 = s.hp;
    // 傷害浮動、反擊判定(0 = 觸發)、魔性擲骰、閃避、傷害、暴擊……
    restore = mockRandom([0.5, 0, 0.1, 0.99, 0.5, 0.99, 0.99]);
    const r = hit(s);
    expect(r.save.hp).toBeLessThan(hp0);
    expect(r.save.log.some((l) => l.includes("以殺止殺"))).toBe(true);
  });
});

describe("力之道祖 · 盤岳", () => {
  it("每回合攻擊兩次,並回復 5% 氣血", () => {
    const max = hpOf("daozu_panyue");
    const s = fight("daozu_panyue", max / 2);
    restore = mockRandom(Array(30).fill(0.99));
    const r = applyAction(s, "endTurn").save;
    const attacks = r.log.filter((l) => l.includes("盤岳") && l.includes("你受到")).length;
    expect(attacks).toBe(2);
    expect(r.combat!.monsterHp).toBe(max / 2 + Math.floor(max * PANYUE_REGEN_PCT));
  });
});

describe("時間道祖 · 古或今", () => {
  it("血條凍結的回合不受傷害;封法的回合只能出法器攻擊", () => {
    const s = fight("lord_zhongtu", 1e15);
    s.combat!.timeFrozen = true;
    s.combat!.spellSealed = true;
    expect(isCardSealed(s.combat!, "spell_attack")).toBe(true);
    expect(isCardSealed(s.combat!, "artifact_attack")).toBe(false);
    expect(hit(structuredClone(s)).error).toMatch(/法器/);
    s.combat!.spellSealed = false;
    restore = mockRandom(Array(20).fill(0.5));
    expect(hit(s).save.combat!.monsterHp).toBe(1e15);
  });
  it("回合結束時擲骰決定下一回合的凍結與封法", () => {
    const s = fight("lord_zhongtu", 1e15);
    restore = mockRandom(Array(60).fill(0)); // 全部擲 0:玩家閃過攻擊,凍結與封法都觸發
    const r = applyAction(s, "endTurn").save;
    expect(r.combat!.timeFrozen).toBe(true);
    expect(r.combat!.spellSealed).toBe(true);
  });
});

describe("特性顯示", () => {
  it("每位道祖都有特性說明,且都包含暴擊", () => {
    for (const id of ["daozu_wangsheng", "daozu_guixu", "daozu_moluo", "daozu_panyue", "lord_zhongtu"]) {
      const traits = monsterTraitsOf(id);
      expect(traits.length, id).toBeGreaterThanOrEqual(2);
      expect(traits.some((t) => t.includes("暴擊")), id).toBe(true);
    }
    expect(monsterTraitsOf("lord_pixiu").some((t) => t.includes("法器"))).toBe(true);
    expect(monsterTraitsOf("lord_tianhu").some((t) => t.includes("避過"))).toBe(true);
  });
});

describe("煞屬性妖獸擊中累積煞氣", () => {
  it("一般 30、地域王/道祖 150;非煞屬性不加", async () => {
    const { SHAQI_ON_SHA_HIT } = await import("../engine");
    const run = (monId: string) => {
      const s = fight(monId, 1e15);
      s.shaqi = 0;
      restore?.();
      restore = mockRandom([0.99, 0.99, 0.5, 0.99, 0.99, 0.99, 0.99, 0.99]); // 不閃避、命中
      return applyAction(s, "endTurn").save.shaqi;
    };
    expect(run("hx_heiyu_shalong")).toBe(SHAQI_ON_SHA_HIT.normal);
    expect(run("daozu_guixu")).toBe(SHAQI_ON_SHA_HIT.lord);
    expect(run("hx_wangling_shazhe")).toBe(0); // 木屬性(灰仙界但非煞)
  });
});
