import { REALMS } from "../game/data/realms";
import { itemById } from "../game/data/items";
import { TECHNIQUES } from "../game/data/techniques";
import { MONSTERS } from "../game/data/world";
import { tengfuById } from "../game/data/tengfu";
import { KIND_LABEL } from "../game/types";

type RecordData = Record<string, unknown>;
const recordOf = (value: unknown): RecordData =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as RecordData) : {};
const stringsOf = (value: unknown): string[] =>
  Array.isArray(value) ? [...new Set(value.filter((v): v is string => typeof v === "string"))] : [];
export const countOf = (value: unknown): number => {
  if (typeof value !== "number" && typeof value !== "string") return 0;
  const n = Number(value);
  return Number.isSafeInteger(n) && n > 0 ? n : 0;
};

// 金額以十進位字串傳輸,避免 BIGINT 在 JSON/瀏覽器中失去精度。
export function amountOf(value: unknown): bigint {
  if (typeof value === "bigint") return value > BigInt(0) ? value : BigInt(0);
  if (typeof value === "number")
    return Number.isInteger(value) && value > 0 ? BigInt(value) : BigInt(0);
  if (typeof value === "string" && /^\d+$/.test(value)) return BigInt(value);
  return BigInt(0);
}

export function resolveItem(id: string) {
  try {
    const item = itemById(id);
    if (item) return { id, name: item.name, kind: KIND_LABEL[item.kind] ?? item.kind, known: true };
  } catch {
    // 不同分支或舊存檔的道具仍顯示原 ID,不丟棄數量。
  }
  return { id, name: id, kind: "未收錄道具", known: false };
}

export interface AdminPlayer {
  id: number;
  username: string;
  name: string;
  characterName: string | null;
  isAdmin: boolean;
  hasSave: boolean;
  dead: boolean;
  realm: string;
  exp: string;
  kills: string;
  inventoryCount: number;
  learnedCount: number;
  stones: string;
  playSeconds: string | null;
  trackingStartedAt: string | null;
  lastSeenAt: string | null;
  createdAt: string;
  updatedAt: string | null;
}

export interface AdminOverview {
  accounts: number;
  characters: number;
  kills: string;
  playSeconds: string | null;
  trackedAccounts: number;
}

export interface AdminListResult {
  players: AdminPlayer[];
  total: number;
  page: number;
  pageSize: number;
  overview: AdminOverview;
}

export interface PlayerRow {
  id: number;
  username: string;
  name: string;
  is_admin: boolean;
  created_at: string;
  updated_at: string | null;
  has_save: boolean;
  data: unknown;
  pending_stones: unknown;
  play_seconds: string | null;
  tracking_started_at: string | null;
  last_seen_at: string | null;
}

export function summarizePlayer(row: PlayerRow): AdminPlayer {
  const d = recordOf(row.data);
  const inventory = recordOf(d.inventory);
  const kills = Object.values(recordOf(d.kills)).reduce<bigint>(
    (sum, n) => sum + amountOf(n),
    BigInt(0),
  );
  const realmIdx = typeof d.realmIdx === "number" ? d.realmIdx : -1;
  return {
    id: row.id,
    username: row.username,
    name: row.name,
    characterName: typeof d.name === "string" ? d.name : null,
    isAdmin: row.is_admin === true,
    hasSave: row.has_save,
    dead: d.dead === true,
    realm: row.has_save ? (REALMS[realmIdx]?.name ?? "未知境界") : "尚未創角",
    exp: amountOf(d.exp).toString(),
    kills: kills.toString(),
    inventoryCount: Object.values(inventory).filter((n) => countOf(n) > 0).length,
    learnedCount: stringsOf(d.learned).length,
    stones: (
      amountOf(d.stones) +
      amountOf(d.pouchStones) +
      amountOf(row.pending_stones)
    ).toString(),
    playSeconds: row.play_seconds == null ? null : amountOf(row.play_seconds).toString(),
    trackingStartedAt: row.tracking_started_at,
    lastSeenAt: row.last_seen_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const equipmentSlots = [
  ["equippedWeapon", "法器"],
  ["equippedRobe", "法衣"],
  ["equippedAmulet", "護身符"],
  ["equippedTalisman", "符籙"],
  ["equippedPet", "靈寵"],
  ["equippedMing", "命器"],
] as const;
const techniques = new Map(TECHNIQUES.map((t) => [t.id, t]));
const monsters = new Map(MONSTERS.map((m) => [m.id, m]));

export function describePlayer(
  row: PlayerRow,
  listings: { id: number; item_id: string; qty: number; price: string }[],
) {
  const d = recordOf(row.data);
  const equipment = equipmentSlots.map(([key, slot]) => {
    const id = key === "equippedRobe" ? (d[key] ?? d.equippedArmor) : d[key];
    return { slot, item: typeof id === "string" ? resolveItem(id) : null };
  });
  const equipped = new Set(equipment.flatMap((e) => (e.item ? [e.item.id] : [])));
  const levels = recordOf(d.techLevels);
  const copies = recordOf(d.techCopies);
  return {
    player: summarizePlayer(row),
    stones: {
      onHand: amountOf(d.stones).toString(),
      pouch: amountOf(d.pouchStones).toString(),
      pending: amountOf(row.pending_stones).toString(),
    },
    inventory: Object.entries(recordOf(d.inventory))
      .filter(([, n]) => countOf(n) > 0)
      .map(([id, n]) => ({ ...resolveItem(id), quantity: countOf(n), equipped: equipped.has(id) })),
    equipment,
    spells: stringsOf(d.learned).map((id) => {
      const t = techniques.get(id);
      return {
        id,
        name: t?.name ?? id,
        known: !!t,
        innate: t?.innate ?? false,
        element: t?.element ?? "未收錄",
        level: countOf(levels[id]) || 1,
        extraCopies: countOf(copies[id]),
      };
    }),
    kills: Object.entries(recordOf(d.kills))
      .filter(([, n]) => amountOf(n) > BigInt(0))
      .map(([id, n]) => ({
        id,
        name: monsters.get(id)?.name ?? id,
        known: monsters.has(id),
        count: amountOf(n).toString(),
      }))
      .sort((a, b) =>
        amountOf(a.count) > amountOf(b.count) ? -1 : amountOf(a.count) < amountOf(b.count) ? 1 : 0,
      ),
    listings: listings.map((l) => ({
      ...resolveItem(l.item_id),
      listingId: l.id,
      quantity: l.qty,
      price: String(l.price),
    })),
    tengfu: [
      ...Object.entries(recordOf(d.tengfuBag))
        .filter(([, n]) => countOf(n) > 0)
        .map(([id, n]) => ({
          id,
          name: tengfuById(id)?.name ?? id,
          quantity: countOf(n),
          location: "未安裝",
        })),
      ...(Array.isArray(d.tengfuGrid) ? d.tengfuGrid : []).flatMap((value) => {
        const p = recordOf(value);
        return typeof p.id === "string"
          ? [
              {
                id: p.id,
                name: tengfuById(p.id)?.name ?? p.id,
                quantity: 1,
                location: `已安裝 · 第 ${countOf(p.r) + 1} 列 / ${countOf(p.c) + 1} 欄`,
              },
            ]
          : [];
      }),
    ],
  };
}

export type AdminPlayerDetail = ReturnType<typeof describePlayer>;
