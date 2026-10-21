// 符寶袋「擁有份數制」(3.15/3.16 版):學會仙法只代表擁有 1 份,要放更多張須額外取得副本;
// 基礎卡片(法器攻擊/法術攻擊)不受限制;舊存檔的回溯修正(pouchTrimmed)只執行一次。
import { describe, it, expect } from "vitest";
import {
  newSave,
  applyAction,
  ownedCopiesOf,
  defaultPouch,
  effectivePouch,
  pouchMinFor,
  POUCH_MAX_COPIES,
  BASIC_CARD_MIN,
  withBasicMinimum,
} from "../engine";
import { SECTS } from "../data/sects";

describe("ownedCopiesOf", () => {
  it("基礎卡片(法器攻擊/法術攻擊)恆常視為擁有上限份數", () => {
    const s = newSave("t", "huadao");
    expect(ownedCopiesOf(s, "artifact_attack")).toBe(POUCH_MAX_COPIES);
    expect(ownedCopiesOf(s, "spell_attack")).toBe(POUCH_MAX_COPIES);
  });

  it("一般仙法預設只擁有 1 份(學會本身即代表擁有第一份)", () => {
    const s = newSave("t", "huadao");
    s.learned = [...s.learned, "leidun"];
    expect(ownedCopiesOf(s, "leidun")).toBe(1);
  });

  it("techCopies 疊加在「1 份」之上,封頂於 POUCH_MAX_COPIES", () => {
    const s = newSave("t", "huadao");
    s.learned = [...s.learned, "leidun"];
    s.techCopies = { leidun: 2 };
    expect(ownedCopiesOf(s, "leidun")).toBe(3);
    s.techCopies = { leidun: 99 };
    expect(ownedCopiesOf(s, "leidun")).toBe(POUCH_MAX_COPIES);
  });

  it("起手仙法(huoqiu)在化刀塢的起手符寶袋裡放了 3 張,擁有份數對齊為 3", () => {
    const s = newSave("t", "huadao");
    expect(ownedCopiesOf(s, "huoqiu")).toBe(3);
  });
});

describe("defaultPouch / effectivePouch / pouchMinFor", () => {
  it("defaultPouch 不會讓任何一門仙法的張數超過其擁有份數", () => {
    const s = newSave("t", "huadao");
    s.learned = [...s.learned, "leidun"]; // 只擁有 1 份
    const pouch = defaultPouch(s);
    expect(pouch.filter((id) => id === "leidun").length).toBeLessThanOrEqual(1);
  });

  it("effectivePouch 的張數不會低於 pouchMinFor 算出的門檻", () => {
    const s = newSave("t", "huadao");
    s.learned = [...s.learned, "leidun"];
    s.pouch = undefined;
    const pouch = effectivePouch(s);
    expect(pouch.length).toBeGreaterThanOrEqual(pouchMinFor(s));
  });

  it("舊存檔(pouch 已設定、但內容超過目前擁有份數)effectivePouch 不會強制砍掉——不溯及既往", () => {
    const s = newSave("t", "huadao");
    s.learned = [...s.learned, "leidun"];
    s.pouch = [...(s.pouch ?? []), "leidun", "leidun", "leidun"]; // 手動塞 3 張,模擬舊制殘留
    expect(effectivePouch(s).filter((id) => id === "leidun").length).toBe(3);
  });
});

describe("pouchAdjust action", () => {
  it("擁有份數不足時,無法放入超過擁有份數的張數", () => {
    const s = newSave("t", "huadao");
    s.learned = [...s.learned, "leidun"];
    s.pouch = [...(s.pouch ?? []), "leidun"]; // 已持有唯一的 1 份
    const r = applyAction(s, "pouchAdjust", { techId: "leidun", delta: 1 });
    expect(r.error).toBeTruthy();
    expect(r.save.pouch?.filter((id) => id === "leidun").length).toBe(1);
  });

  it("擁有份數足夠時可以放入,移除時不得低於 pouchMinFor 門檻", () => {
    const s = newSave("t", "huadao");
    s.learned = [...s.learned, "leidun"];
    s.techCopies = { leidun: 1 }; // 擁有 2 份
    s.pouch = [...(s.pouch ?? []), "leidun"];
    const added = applyAction(s, "pouchAdjust", { techId: "leidun", delta: 1 });
    expect(added.error).toBeUndefined();
    expect(added.save.pouch?.filter((id) => id === "leidun").length).toBe(2);
  });

  it("戰鬥中無法調整符寶袋", () => {
    const s = newSave("t", "huadao");
    s.combat = {
      monsterId: "shulang",
      monsterHp: 14,
      locationId: "test",
      hand: [],
      deck: [],
      discard: [],
      monsterStatus: [],
      playerStatus: [],
    };
    const r = applyAction(s, "pouchAdjust", { techId: "huoqiu", delta: -1 });
    expect(r.error).toBeTruthy();
  });
});

describe("舊存檔回溯修正(pouchTrimmed,3.16 版)", () => {
  it("第一次行動時,超過擁有份數的符寶袋殘留張數會被砍到剛好符合擁有份數", () => {
    const s = newSave("t", "huadao");
    s.learned = [...s.learned, "leidun"];
    s.pouch = [...(s.pouch ?? []), "leidun", "leidun", "leidun"];
    const r = applyAction(s, "endTurn", {}); // 任何動作皆會觸發向後相容 hydration
    expect(r.save.pouch?.filter((id) => id === "leidun").length).toBe(1);
    expect(r.save.pouchTrimmed).toBe(true);
  });

  it("基礎卡片不受回溯修正影響", () => {
    const s = newSave("t", "huadao");
    const r = applyAction(s, "endTurn", {});
    expect(r.save.pouch?.filter((id) => id === "artifact_attack").length).toBe(3);
  });

  it("只執行一次:標記後即使份數事後被改變,也不會再次修剪", () => {
    const s = newSave("t", "huadao");
    s.learned = [...s.learned, "leidun"];
    s.techCopies = { leidun: 1 };
    s.pouch = [...(s.pouch ?? []), "leidun", "leidun"];
    const r1 = applyAction(s, "endTurn", {});
    expect(r1.save.pouchTrimmed).toBe(true);
    r1.save.techCopies = { leidun: 0 };
    const r2 = applyAction(r1.save, "endTurn", {});
    expect(r2.save.pouch?.filter((id) => id === "leidun").length).toBe(2);
  });
});

describe("useItem 複製符寶(3.15 版):重新參悟已學會的仙法", () => {
  it("消耗一本秘笈、擁有份數 +1,且不進入修習狀態(無需年限)", () => {
    const s = newSave("t", "huadao");
    s.learned = [...s.learned, "leidun"];
    s.inventory["m_leidun"] = 2;
    const before = ownedCopiesOf(s, "leidun");
    const r = applyAction(s, "useItem", { itemId: "m_leidun" });
    expect(r.save.inventory["m_leidun"]).toBe(1);
    expect(ownedCopiesOf(r.save, "leidun")).toBe(before + 1);
    expect(r.save.learning).toBeNull();
  });

  it("已達擁有上限時,不會消耗秘笈", () => {
    const s = newSave("t", "huadao");
    s.learned = [...s.learned, "leidun"];
    s.techCopies = { leidun: POUCH_MAX_COPIES - 1 }; // 已達上限(1+4=5)
    s.inventory["m_leidun"] = 1;
    const r = applyAction(s, "useItem", { itemId: "m_leidun" });
    expect(r.save.inventory["m_leidun"]).toBe(1);
    expect(ownedCopiesOf(r.save, "leidun")).toBe(POUCH_MAX_COPIES);
  });
});

describe("基礎卡片最低張數(4.2 版):法器攻擊/法術攻擊各至少 3 張", () => {
  it("新角色符寶袋中兩張基礎卡片各至少 3 張", () => {
    const s = newSave("測試員", SECTS[0].id);
    const pouch = effectivePouch(s);
    expect(pouch.filter((id) => id === "artifact_attack").length).toBeGreaterThanOrEqual(BASIC_CARD_MIN);
    expect(pouch.filter((id) => id === "spell_attack").length).toBeGreaterThanOrEqual(BASIC_CARD_MIN);
  });
  it("基礎卡片剩 3 張時不可再減少", () => {
    const s = newSave("測試員", SECTS[0].id);
    s.pouch = withBasicMinimum([s.learned[2], s.learned[2], s.learned[3], s.learned[3]]);
    const r = applyAction(s, "pouchAdjust", { techId: "spell_attack", delta: -1 });
    expect(r.error).toBeTruthy();
    expect(r.save.pouch!.filter((id) => id === "spell_attack").length).toBe(BASIC_CARD_MIN);
  });
  it("舊存檔符寶袋不足 3 張基礎卡片時,開戰用的有效符寶袋會自動補足", () => {
    const s = newSave("測試員", SECTS[0].id);
    s.pouch = ["artifact_attack", s.learned[2], s.learned[3]];
    const pouch = effectivePouch(s);
    expect(pouch.filter((id) => id === "artifact_attack").length).toBe(BASIC_CARD_MIN);
    expect(pouch.filter((id) => id === "spell_attack").length).toBe(BASIC_CARD_MIN);
  });
});
