import { sql } from "./db";
import {
  describePlayer,
  summarizePlayer,
  type PlayerRow,
  type AdminListResult,
} from "./admin-data";

export const ADMIN_PAGE_SIZE = 25;
export const ADMIN_SORTS = ["recent", "realm", "kills", "stones", "playtime"] as const;
export const ADMIN_STATUSES = ["all", "alive", "dead", "unstarted"] as const;
export type PlayerSort = (typeof ADMIN_SORTS)[number];
export type PlayerStatus = (typeof ADMIN_STATUSES)[number];

export function parsePlayerQuery(params: URLSearchParams) {
  const search = (params.get("q") ?? "").trim();
  const sort = params.get("sort") ?? "recent";
  const status = params.get("status") ?? "all";
  const pageText = params.get("page") ?? "1";
  if (search.length > 100 || !/^\d+$/.test(pageText)) return null;
  const page = Number(pageText);
  if (!Number.isSafeInteger(page) || page < 1 || page > 100000) return null;
  if (
    !(ADMIN_SORTS as readonly string[]).includes(sort) ||
    !(ADMIN_STATUSES as readonly string[]).includes(status)
  )
    return null;
  return { search, sort: sort as PlayerSort, status: status as PlayerStatus, page };
}

export async function listPlayers(
  query: NonNullable<ReturnType<typeof parsePlayerQuery>>,
): Promise<AdminListResult> {
  const pattern = `%${query.search.replace(/[\\%_]/g, "\\$&")}%`;
  const offset = (query.page - 1) * ADMIN_PAGE_SIZE;
  const [rows, totals, overviewRows] = await sql.transaction(
    [
      sql`WITH candidates AS (
      SELECT u.id, u.username, u.name, u.is_admin, u.created_at,
        COALESCE((s.data->>'started')::boolean,false) AS has_save, s.updated_at, s.pending_stones::text,
        jsonb_build_object('name',s.data->'name','realmIdx',s.data->'realmIdx',
          'exp',s.data->>'exp','dead',s.data->'dead','inventory',s.data->'inventory',
          'learned',s.data->'learned','kills',s.data->'kills',
          'stones',s.data->>'stones','pouchStones',s.data->>'pouchStones') AS data,
        a.play_seconds::text, a.tracking_started_at, a.last_seen_at,
        COALESCE((s.data->>'realmIdx')::int,-1) AS realm_sort,
        COALESCE((SELECT SUM(value::numeric) FROM jsonb_each_text(COALESCE(s.data->'kills','{}'::jsonb))),0) AS kill_sort,
        COALESCE((s.data->>'stones')::numeric,0)+COALESCE((s.data->>'pouchStones')::numeric,0)+COALESCE(s.pending_stones,0) AS stone_sort
      FROM users u LEFT JOIN saves s ON s.user_id=u.id
      LEFT JOIN player_activity a ON a.user_id=u.id
      WHERE (${query.search}='' OR u.username ILIKE ${pattern} OR u.name ILIKE ${pattern} OR s.data->>'name' ILIKE ${pattern})
        AND (${query.status}='all'
          OR (${query.status}='unstarted' AND (s.user_id IS NULL OR NOT COALESCE((s.data->>'started')::boolean,false)))
          OR (${query.status}='alive' AND COALESCE((s.data->>'started')::boolean,false) AND NOT COALESCE((s.data->>'dead')::boolean,false))
          OR (${query.status}='dead' AND COALESCE((s.data->>'dead')::boolean,false)))
    ) SELECT id,username,name,is_admin,created_at,has_save,updated_at,pending_stones,data,
        play_seconds,tracking_started_at,last_seen_at
      FROM candidates ORDER BY
        CASE WHEN ${query.sort}='realm' THEN realm_sort END DESC NULLS LAST,
        CASE WHEN ${query.sort}='kills' THEN kill_sort END DESC NULLS LAST,
        CASE WHEN ${query.sort}='stones' THEN stone_sort END DESC NULLS LAST,
        CASE WHEN ${query.sort}='playtime' THEN play_seconds::bigint END DESC NULLS LAST,
        CASE WHEN ${query.sort}='recent' THEN updated_at END DESC NULLS LAST,
        id DESC LIMIT ${ADMIN_PAGE_SIZE} OFFSET ${offset}`,
      sql`SELECT count(*)::int AS total FROM users u LEFT JOIN saves s ON s.user_id=u.id
      WHERE (${query.search}='' OR u.username ILIKE ${pattern} OR u.name ILIKE ${pattern} OR s.data->>'name' ILIKE ${pattern})
        AND (${query.status}='all'
          OR (${query.status}='unstarted' AND (s.user_id IS NULL OR NOT COALESCE((s.data->>'started')::boolean,false)))
          OR (${query.status}='alive' AND COALESCE((s.data->>'started')::boolean,false) AND NOT COALESCE((s.data->>'dead')::boolean,false))
          OR (${query.status}='dead' AND COALESCE((s.data->>'dead')::boolean,false)))`,
      sql`SELECT count(*)::int AS accounts,
      count(*) FILTER (WHERE COALESCE((s.data->>'started')::boolean,false))::int AS characters,
      COALESCE(sum((SELECT SUM(value::numeric) FROM jsonb_each_text(COALESCE(s.data->'kills','{}'::jsonb)))),0)::text AS kills,
      sum(a.play_seconds)::text AS play_seconds, count(a.user_id)::int AS tracked_accounts
      FROM users u LEFT JOIN saves s ON s.user_id=u.id LEFT JOIN player_activity a ON a.user_id=u.id`,
    ],
    { readOnly: true, isolationLevel: "RepeatableRead" },
  );
  const overview = overviewRows[0];
  return {
    players: (rows as unknown as PlayerRow[]).map(summarizePlayer),
    total: Number(totals[0].total),
    page: query.page,
    pageSize: ADMIN_PAGE_SIZE,
    overview: {
      accounts: Number(overview.accounts),
      characters: Number(overview.characters),
      kills: String(overview.kills),
      playSeconds: overview.play_seconds == null ? null : String(overview.play_seconds),
      trackedAccounts: Number(overview.tracked_accounts),
    },
  };
}

export async function getPlayerDetail(id: number) {
  const [players, listings] = await sql.transaction(
    [
      sql`SELECT u.id,u.username,u.name,u.is_admin,u.created_at,
      COALESCE((s.data->>'started')::boolean,false) AS has_save,s.updated_at,s.pending_stones::text,
      jsonb_build_object('name',s.data->'name','realmIdx',s.data->'realmIdx','exp',s.data->>'exp',
        'dead',s.data->'dead','stones',s.data->>'stones','pouchStones',s.data->>'pouchStones',
        'inventory',s.data->'inventory','learned',s.data->'learned','techLevels',s.data->'techLevels',
        'techCopies',s.data->'techCopies','kills',s.data->'kills',
        'equippedWeapon',s.data->'equippedWeapon','equippedArmor',s.data->'equippedArmor',
        'equippedRobe',s.data->'equippedRobe','equippedAmulet',s.data->'equippedAmulet',
        'equippedTalisman',s.data->'equippedTalisman','equippedPet',s.data->'equippedPet',
        'equippedMing',s.data->'equippedMing','tengfuBag',s.data->'tengfuBag','tengfuGrid',s.data->'tengfuGrid') AS data,
      a.play_seconds::text,a.tracking_started_at,a.last_seen_at
      FROM users u LEFT JOIN saves s ON s.user_id=u.id LEFT JOIN player_activity a ON a.user_id=u.id
      WHERE u.id=${id}`,
      sql`SELECT id,item_id,qty,price::text FROM listings WHERE seller_id=${id} ORDER BY created_at DESC,id DESC`,
    ],
    { readOnly: true, isolationLevel: "RepeatableRead" },
  );
  if (!players[0]) return null;
  return describePlayer(
    players[0] as unknown as PlayerRow,
    listings as unknown as Parameters<typeof describePlayer>[1],
  );
}
