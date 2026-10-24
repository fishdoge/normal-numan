import { describe, expect, it } from "vitest";
import {
  amountOf,
  describePlayer,
  summarizePlayer,
  resolveItem,
  type PlayerRow,
} from "../admin-data";
import { ITEMS } from "../../game/data/items";

const row = (data: unknown = {}): PlayerRow => ({
  id: 10,
  username: "example",
  name: "蘭斯",
  is_admin: false,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: null,
  has_save: true,
  data,
  pending_stones: "0",
  play_seconds: null,
  tracking_started_at: null,
  last_seen_at: null,
});

describe("玩家後臺資料轉換", () => {
  it("保留跨分支的未知道具、法術、怪物,且不改寫原存檔", () => {
    const original = row({
      inventory: { legacy_item: 7, empty: 0, invalid: -1 },
      learned: ["legacy_spell", "legacy_spell"],
      kills: { legacy_monster: 12 },
    });
    const before = JSON.stringify(original);
    const detail = describePlayer(original, []);
    expect(detail.inventory).toEqual([
      {
        id: "legacy_item",
        name: "legacy_item",
        kind: "未收錄道具",
        known: false,
        quantity: 7,
        equipped: false,
      },
    ]);
    expect(detail.spells).toHaveLength(1);
    expect(detail.spells[0]).toMatchObject({
      id: "legacy_spell",
      name: "legacy_spell",
      level: 1,
      extraCopies: 0,
      known: false,
    });
    expect(detail.kills[0]).toMatchObject({ id: "legacy_monster", count: "12", known: false });
    expect(JSON.stringify(original)).toBe(before);
  });

  it("以精確字串加總靈石,包含靈石袋與待入帳", () => {
    const original = {
      ...row({ stones: "9007199254740993", pouchStones: "8" }),
      pending_stones: "9",
    };
    const detail = describePlayer(original, [
      { id: 2, item_id: "legacy", qty: 1, price: "999999999999999999" },
    ]);
    expect(detail.player.stones).toBe("9007199254741010");
    expect(detail.stones).toEqual({ onHand: "9007199254740993", pouch: "8", pending: "9" });
    expect(detail.listings[0].price).toBe("999999999999999999");
  });

  it("不將未開始追蹤的時間顯示為零;缺少舊欄位仍可讀取", () => {
    expect(summarizePlayer(row(null))).toMatchObject({
      playSeconds: null,
      inventoryCount: 0,
      kills: "0",
      stones: "0",
    });
    expect(summarizePlayer({ ...row(), has_save: false }).realm).toBe("尚未創角");
    expect(summarizePlayer({ ...row(), play_seconds: "0" }).playSeconds).toBe("0");
  });

  it("辨識品質道具與舊法衣欄位,裝備不重複加進背包", () => {
    const weapon = ITEMS.find((i) => i.kind === "artifact")!;
    const id = `${weapon.id}@262`;
    const detail = describePlayer(
      row({
        inventory: { [id]: 1, legacy_robe: 2 },
        equippedWeapon: id,
        equippedArmor: "legacy_robe",
      }),
      [],
    );
    expect(resolveItem(id).known).toBe(true);
    expect(detail.inventory.find((i) => i.id === id)).toMatchObject({
      equipped: true,
      quantity: 1,
    });
    expect(detail.inventory).toHaveLength(2);
    expect(detail.equipment.find((e) => e.slot === "法衣")?.item?.id).toBe("legacy_robe");
  });

  it("顯示法術等級、副本及未安裝/已安裝滕符", () => {
    const detail = describePlayer(
      row({
        learned: ["old"],
        techLevels: { old: 4 },
        techCopies: { old: 2 },
        tengfuBag: { old_tf: 2 },
        tengfuGrid: [{ id: "old_tf", r: 0, c: 3 }],
      }),
      [],
    );
    expect(detail.spells[0]).toMatchObject({ level: 4, extraCopies: 2 });
    expect(detail.tengfu).toEqual([
      { id: "old_tf", name: "old_tf", quantity: 2, location: "未安裝" },
      { id: "old_tf", name: "old_tf", quantity: 1, location: "已安裝 · 第 1 列 / 4 欄" },
    ]);
  });

  it("擊殺依數量排序;無效金額不造成整頁失敗", () => {
    expect(
      describePlayer(row({ kills: { a: 2, b: 10, c: 0 } }), []).kills.map((k) => k.id),
    ).toEqual(["b", "a"]);
    for (const invalid of [null, -3, "bad", 1.5, Infinity, {}, true])
      expect(amountOf(invalid)).toBe(BigInt(0));
  });
});
