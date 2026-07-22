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
      await sql`CREATE TABLE IF NOT EXISTS listings (
        id SERIAL PRIMARY KEY,
        seller_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        item_id TEXT NOT NULL,
        qty INTEGER NOT NULL CHECK (qty > 0),
        price INTEGER NOT NULL CHECK (price > 0),
        created_at TIMESTAMPTZ DEFAULT now()
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
