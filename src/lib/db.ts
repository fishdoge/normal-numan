import { neon } from "@neondatabase/serverless";

export const sql = neon(process.env.DATABASE_URL!);

let ready: Promise<void> | null = null;

// 首次呼叫時自動建表
export function ensureSchema() {
  if (!ready) {
    ready = (async () => {
      await sql`CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        pass_hash TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT now()
      )`;
      await sql`CREATE TABLE IF NOT EXISTS sessions (
        token TEXT PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ DEFAULT now()
      )`;
      await sql`CREATE TABLE IF NOT EXISTS saves (
        user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        data JSONB NOT NULL,
        last_life_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now()
      )`;
      await sql`ALTER TABLE saves ADD COLUMN IF NOT EXISTS pending_stones BIGINT NOT NULL DEFAULT 0`;
      // 宗門仙境(1.9 版):停泊中的位置自何時起算修為累積,由 /api/action 每次請求依現在時間結算
      await sql`ALTER TABLE saves ADD COLUMN IF NOT EXISTS dwelling_since TIMESTAMPTZ`;
      await sql`CREATE TABLE IF NOT EXISTS listings (
        id SERIAL PRIMARY KEY,
        seller_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        item_id TEXT NOT NULL,
        qty INTEGER NOT NULL CHECK (qty > 0),
        price INTEGER NOT NULL CHECK (price > 0),
        created_at TIMESTAMPTZ DEFAULT now()
      )`;
      // 宗門共享資源池(1.6 版):每個宗門一筆,存放全宗門共用靈石
      await sql`CREATE TABLE IF NOT EXISTS sect_bank (
        sect_id TEXT PRIMARY KEY,
        stones BIGINT NOT NULL DEFAULT 0 CHECK (stones >= 0),
        updated_at TIMESTAMPTZ DEFAULT now()
      )`;
      // 宗門共享物品倉庫(1.8 版新增):{ itemId: qty, ... }
      await sql`ALTER TABLE sect_bank ADD COLUMN IF NOT EXISTS items JSONB NOT NULL DEFAULT '{}'::jsonb`;
      // 宗門分級(1.8 版新增):等級 + 累積貢獻靈石(只增不減,不可提領)
      await sql`CREATE TABLE IF NOT EXISTS sect_tier (
        sect_id TEXT PRIMARY KEY,
        tier INTEGER NOT NULL DEFAULT 1,
        contribution BIGINT NOT NULL DEFAULT 0,
        updated_at TIMESTAMPTZ DEFAULT now()
      )`;
      // 宗門仙境(1.9 版新增):每個宗門依等級開放固定數量位置,同門可停泊修煉、緩慢增長修為
      await sql`CREATE TABLE IF NOT EXISTS sect_dwelling (
        sect_id TEXT NOT NULL,
        slot_idx INTEGER NOT NULL,
        level INTEGER NOT NULL DEFAULT 1,
        occupant_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        updated_at TIMESTAMPTZ DEFAULT now(),
        PRIMARY KEY (sect_id, slot_idx)
      )`;
    })();
  }
  return ready;
}

export async function userFromToken(token: string | undefined) {
  if (!token) return null;
  await ensureSchema();
  const rows = await sql`
    SELECT u.id, u.username, u.name FROM sessions s
    JOIN users u ON u.id = s.user_id WHERE s.token = ${token}`;
  return (rows[0] as { id: number; username: string; name: string } | undefined) ?? null;
}
