import { REALMS } from "../game/data/realms";
import { itemById } from "../game/data/items";
import { TECHNIQUES } from "../game/data/techniques";
import { MONSTERS } from "../game/data/world";
import { SECTS } from "../game/data/sects";
import {
  factionById,
  LUNHUI_ATK_PCT,
  MANHUANG_HP_PCT,
  TIANTING_DEF_PCT,
} from "../game/data/factions";
import {
  tengfuById,
  tengfuStatValues,
  type TengfuPlacement,
  type TengfuStat,
} from "../game/data/tengfu";
import { KIND_LABEL } from "../game/types";
import {
  statsOf,
  XIANLI_MULT,
  XIANLI_MULT_CAP,
  type SaveData,
} from "../game/engine";

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

const equipmentSlots = [
  ["equippedWeapon", "法器"],
  ["equippedRobe", "法衣"],
  ["equippedAmulet", "護身符"],
  ["equippedTalisman", "符籙"],
  ["equippedPet", "靈寵"],
  ["equippedMing", "命器"],
] as const;

export interface AdminCombatStats {
  atk: number;
  def: number;
  hpMax: number;
  mpMax: number;
  speed: number;
  xianli: number;
}

// 戰鬥屬性:沿用遊戲的 statsOf,與玩家道籍面板同一份算法;statsOf 只讀不寫。
// 存檔含未知境界或其他分支的裝備時算不出來,回傳 null,不影響其他欄位。
export function combatStatsOf(data: RecordData): AdminCombatStats | null {
  try {
    const { atk, def, hpMax, mpMax, speed, xianli } = statsOf(data as unknown as SaveData);
    return { atk, def, hpMax, mpMax, speed, xianli };
  } catch {
    return null;
  }
}

export interface AdminStatPart {
  name: string;
  count: number;
  pct: number;
}
export interface AdminStatAdd {
  source: string;
  name?: string;
  value: number;
  parts?: AdminStatPart[];
}
export interface AdminStatMult {
  source: string;
  name?: string;
  mult: number;
  parts?: AdminStatPart[];
}
export interface AdminStatBreakdown {
  key: keyof AdminCombatStats;
  label: string;
  total: number;
  adds: AdminStatAdd[];
  mults: AdminStatMult[];
  note?: string;
}

// 每一件滕符對某項屬性的百分比,同名合併
function tengfuPartsOf(grid: TengfuPlacement[] | undefined, stat: TengfuStat): AdminStatPart[] {
  const parts = new Map<string, AdminStatPart>();
  for (const p of grid ?? []) {
    const def = tengfuById(p.id);
    const pct = def ? (tengfuStatValues(def)[stat] ?? 0) : 0;
    if (!def || !pct) continue;
    const part = parts.get(def.id) ?? { name: def.name, count: 0, pct: 0 };
    parts.set(def.id, { ...part, count: part.count + 1, pct: part.pct + pct });
  }
  return [...parts.values()];
}

// 屬性組成:逐項列出 statsOf 的加項與乘數,順序與 statsOf 相同,總值直接取自 statsOf。
// 兩邊是否對得起來由 admin-data.test.ts 重算驗證,statsOf 改公式時這裡要跟著改。
export function combatBreakdownOf(data: RecordData): AdminStatBreakdown[] | null {
  try {
    const s = data as unknown as SaveData;
    const stats = statsOf(s);
    const { realm, tengfu: tf } = stats;
    const sect = SECTS.find((x) => x.id === s.sectId);
    const faction = factionById(s.faction)?.name;
    const gear = equipmentSlots.flatMap(([key, slot]) => {
      const id = key === "equippedRobe" ? (s.equippedRobe ?? s.equippedArmor) : s[key];
      const item = id ? itemById(id) : null;
      return item ? [{ slot, item }] : [];
    });
    const gearLines = (pick: (g: (typeof gear)[number]["item"]) => number | undefined) =>
      gear.map(({ slot, item }) => ({ source: slot, name: item.name, value: pick(item) ?? 0 }));
    const adds = (lines: AdminStatAdd[]) => lines.filter((l) => l.value);
    const mults = (lines: AdminStatMult[]) => lines.filter((l) => l.mult !== 1);
    const tfMult = (mult: number, stat: TengfuStat): AdminStatMult => ({
      source: "滕符陣",
      mult,
      parts: tengfuPartsOf(s.tengfuGrid, stat),
    });
    const xianliMult = Math.min(XIANLI_MULT_CAP, 1 + stats.xianli * XIANLI_MULT);
    return [
      {
        key: "atk",
        label: "攻擊",
        total: stats.atk,
        adds: adds([
          { source: "境界", name: realm.name, value: realm.atk },
          { source: "門派", name: sect?.name, value: sect?.bonus.atk ?? 0 },
          ...gearLines((i) => i.atkBonus),
          { source: "雲遊所得", value: s.boonAtk ?? 0 },
        ]),
        mults: mults([
          { source: "仙靈力", name: `${stats.xianli} 點`, mult: xianliMult },
          tfMult(1 + tf.atk, "atk"),
          {
            source: "派系",
            name: faction,
            mult: s.faction === "lunhui" ? 1 + LUNHUI_ATK_PCT : 1,
          },
        ]),
      },
      {
        key: "def",
        label: "防禦",
        total: stats.def,
        adds: adds([
          ...gearLines((i) => i.defBonus),
          { source: "雲遊所得", value: s.boonDef ?? 0 },
          {
            source: "滕符護體",
            name: `境界攻擊 × ${(tf.def * 100).toFixed(1)}%`,
            value: Math.floor(realm.atk * tf.def),
            parts: tengfuPartsOf(s.tengfuGrid, "def"),
          },
        ]),
        mults: mults([
          {
            source: "派系",
            name: faction,
            mult: s.faction === "tianting" ? 1 + TIANTING_DEF_PCT : 1,
          },
        ]),
      },
      {
        key: "hpMax",
        label: "氣血上限",
        total: stats.hpMax,
        adds: adds([
          { source: "境界", name: realm.name, value: realm.hpMax },
          { source: "門派", name: sect?.name, value: sect?.bonus.hp ?? 0 },
          { source: "雲遊所得", value: s.boonHp ?? 0 },
        ]),
        mults: mults([
          tfMult(1 + tf.hp, "hp"),
          {
            source: "派系",
            name: faction,
            mult: s.faction === "manhuang" ? 1 + MANHUANG_HP_PCT : 1,
          },
        ]),
      },
      {
        key: "mpMax",
        label: "法力上限",
        total: stats.mpMax,
        adds: adds([
          { source: "境界", name: realm.name, value: realm.mpMax },
          { source: "門派", name: sect?.name, value: sect?.bonus.mp ?? 0 },
        ]),
        mults: mults([tfMult(1 + tf.mp, "mp")]),
      },
      {
        key: "speed",
        label: "速度",
        total: stats.speed,
        adds: adds([
          { source: "境界攻擊", name: realm.name, value: realm.atk },
          { source: "境界階數", name: `第 ${realm.stage} 階 × 5`, value: realm.stage * 5 },
          ...gearLines((i) => i.speedBonus),
          { source: "雲遊所得", value: s.boonSpeed ?? 0 },
        ]),
        mults: [],
      },
      {
        key: "xianli",
        label: "仙靈力",
        total: stats.xianli,
        adds: adds([{ source: "服用累積", value: stats.xianli }]),
        mults: [],
        note:
          xianliMult >= XIANLI_MULT_CAP
            ? `攻擊倍率 × ${xianliMult.toFixed(2)}(已達上限)`
            : `攻擊倍率 × ${xianliMult.toFixed(2)}`,
      },
    ];
  } catch {
    return null;
  }
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
  combat: AdminCombatStats | null;
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
    combat: row.has_save ? combatStatsOf(d) : null,
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

// 依攻擊力由高到低;算不出來或尚未創角的排最後,同分維持原順序
export function sortByAttack(players: AdminPlayer[]): AdminPlayer[] {
  return [...players].sort((a, b) => (b.combat?.atk ?? -1) - (a.combat?.atk ?? -1));
}

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
    combatBreakdown: row.has_save ? combatBreakdownOf(d) : null,
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
