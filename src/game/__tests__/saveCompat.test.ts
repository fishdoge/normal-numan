// 存檔相容性(4.2 版):線上正式站目前跑 2.20 版,資料庫裡全是 2.x 格式的存檔(沒有符寶袋、手牌、
// 滕符陣……)。fixtures/ 下兩份是用 2.20 版引擎實際產生的存檔(一份閒置、一份停在戰鬥中、combat 只有
// monsterId/monsterHp/locationId 三個欄位),確保新版引擎讀得動、遷移結果穩定、遷移後可正常遊玩。
import { describe, it, expect } from "vitest";
import { applyAction, normalizeSave, statsOf, energyMaxOf, BASIC_CARD_MIN } from "../engine";
import type { SaveData } from "../engine";
import idle from "./fixtures/save-2.20.json";
import inCombat from "./fixtures/save-2.20-in-combat.json";

const load = (x: unknown) => JSON.parse(JSON.stringify(x)) as SaveData;

describe("2.20 存檔 → 目前版本", () => {
  it("遷移後補齊基礎卡片與滕符陣欄位", () => {
    const s = load(idle);
    normalizeSave(s);
    expect(s.learned).toContain("artifact_attack");
    expect(s.learned).toContain("spell_attack");
    expect(s.tengfuGrid).toEqual([]);
    expect(s.tengfuBag).toEqual({});
    expect(() => statsOf(s)).not.toThrow();
    expect(() => energyMaxOf(s)).not.toThrow();
  });

  it("遷移可重複執行、結果不變(讀檔時與行動時各跑一次不會互相衝突)", () => {
    const a = load(inCombat);
    normalizeSave(a);
    const once = JSON.stringify(a);
    normalizeSave(a);
    expect(JSON.stringify(a)).toBe(once);
  });

  it("舊格式戰鬥中的存檔:遷移後有手牌,出牌與結束回合都正常", () => {
    let s = load(inCombat);
    normalizeSave(s);
    expect(s.combat?.hand?.length).toBeGreaterThan(0);
    const hand = s.combat!.hand!;
    const firstSpell = hand.find((id) => id !== "artifact_attack");
    if (firstSpell) {
      const r = applyAction(s, "castBatch", { techIds: [firstSpell] });
      expect(r.error).toBeFalsy();
      s = r.save;
    }
    if (s.combat) {
      const r = applyAction(s, "endTurn");
      expect(r.error).toBeFalsy();
    }
  });

  it("閒置存檔可直接打坐、獵殺,開戰時基礎卡片各至少 BASIC_CARD_MIN 張進牌庫", () => {
    let s = load(idle);
    s.energy = 999;
    s = applyAction(s, "cultivate").save;
    const r = applyAction(s, "hunt", { locationId: "caiyaoshan" });
    expect(r.error).toBeFalsy();
    const all = [...(r.save.combat?.hand ?? []), ...(r.save.combat?.deck ?? [])];
    expect(all.filter((id) => id === "spell_attack").length).toBeGreaterThanOrEqual(BASIC_CARD_MIN);
  });
});
