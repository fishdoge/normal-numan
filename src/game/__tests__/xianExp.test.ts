// 5.0 版真仙修為:真仙以上打坐(含打坐時的頓悟、手談奇遇)不給修為,修為唯有斬妖獲得,只會一路累積,
// 讓修為榜可以比較;仙域妖獸補上修為。
import { describe, it, expect, afterEach } from "vitest";
import { applyAction, newSave, statsOf } from "../engine";
import { REALMS } from "../data/realms";
import { MONSTERS, LOCATIONS } from "../data/world";
import { mockRandom, freshCombatSave } from "./testUtils";

let restore: (() => void) | null = null;
afterEach(() => {
  restore?.();
  restore = null;
});

const xianIdx = REALMS.findIndex((r) => r.id === "feisheng");

describe("真仙以上的修為", () => {
  it("真仙打坐不增長修為,但照常回血", () => {
    const s = newSave("測試員", "huadao");
    s.realmIdx = xianIdx;
    s.exp = 1000;
    s.hp = 1;
    s.energy = 999;
    restore = mockRandom([0.5, 0.5, 0.99]); // 最後一個亂數讓奇遇不觸發
    const r = applyAction(s, "cultivate");
    expect(r.save.exp).toBe(1000);
    expect(r.save.hp).toBe(statsOf(r.save).hpMax);
  });

  it("真仙打坐遇到頓悟奇遇也不給修為", () => {
    const s = newSave("測試員", "huadao");
    s.realmIdx = xianIdx;
    s.exp = 0;
    s.energy = 999;
    restore = mockRandom([0.5, 0.01]); // 第二個亂數 < 0.03 = 頓悟
    expect(applyAction(s, "cultivate").save.exp).toBe(0);
  });

  it("真仙以下打坐照常增長修為", () => {
    const s = newSave("測試員", "huadao");
    s.energy = 999;
    restore = mockRandom([0.5, 0.99]);
    expect(applyAction(s, "cultivate").save.exp).toBeGreaterThan(0);
  });

  it("真仙斬殺北寒妖獸獲得修為,修為一路累積", () => {
    const s = freshCombatSave("huadao", "bh_hanjiao");
    s.realmIdx = xianIdx;
    s.exp = 5_000_000;
    s.combat!.monsterHp = 1;
    s.combat!.hand = ["spell_attack"];
    restore = mockRandom([0.5, 0.5, 0.5, 0.5, 0.5]);
    const r = applyAction(s, "castBatch", { techIds: ["spell_attack"] });
    expect(r.save.combat).toBeNull();
    expect(r.save.exp).toBe(5_000_000 + 150_000);
  });

  it("所有仙域秘境的妖獸都有修為", () => {
    const xianLocs = LOCATIONS.filter((l) => l.reqStage >= 10);
    for (const l of xianLocs) {
      for (const id of [...l.monsters, ...(l.lordId ? [l.lordId] : [])]) {
        expect(MONSTERS.find((m) => m.id === id)!.exp, id).toBeGreaterThan(0);
      }
    }
  });
});
