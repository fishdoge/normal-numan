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
      // 精力系統:每 5 分鐘真實時間回復 1 點,算法同 last_life_at(只推進已消耗的整數份,餘數留到下次結算)
      await sql`ALTER TABLE saves ADD COLUMN IF NOT EXISTS last_energy_at TIMESTAMPTZ DEFAULT now()`;
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
      // 宗門捐獻的素材(2.7 版新增):{ itemId: qty, ... },與 sect_bank.items(可自由提領的倉庫)
      // 是完全分開的兩套資料,只增不減、不可提領,唯一用途是累積宗門升級門檻
      await sql`ALTER TABLE sect_tier ADD COLUMN IF NOT EXISTS donated_items JSONB NOT NULL DEFAULT '{}'::jsonb`;
      // 宗門仙境(1.9 版新增):每個宗門依等級開放固定數量位置,同門可停泊修煉、緩慢增長修為
      await sql`CREATE TABLE IF NOT EXISTS sect_dwelling (
        sect_id TEXT NOT NULL,
        slot_idx INTEGER NOT NULL,
        level INTEGER NOT NULL DEFAULT 1,
        occupant_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        updated_at TIMESTAMPTZ DEFAULT now(),
        PRIMARY KEY (sect_id, slot_idx)
      )`;
      // 全服對話集:所有玩家皆可發言的公開聊天室
      await sql`CREATE TABLE IF NOT EXISTS chat_messages (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        message TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT now()
      )`;
      // 向仙班祈禱 · 六道輪迴盤(付費復活):終身僅可使用一次,用過即永久失效,不因轉世重修而重置
      await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS revival_used BOOLEAN NOT NULL DEFAULT false`;
      // 每次點擊「向仙班祈禱」建立一筆待付款請求,token = Polar checkout session id,貫穿付款流程與 webhook 回呼,
      // pending → processing(webhook 已收到、原子搶佔中)→ done(已成功復活)/ failed(付款成功但無法套用,需人工處理)
      await sql`CREATE TABLE IF NOT EXISTS revival_requests (
        token TEXT PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        status TEXT NOT NULL DEFAULT 'pending',
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now()
      )`;
      // 黑市購買(消耗型命器/玄命果,皆以 USD 透過 Polar 購買):token = Polar checkout session id,
      // 狀態機與 revival_requests 相同(pending → processing → done / failed)
      await sql`CREATE TABLE IF NOT EXISTS item_purchase_requests (
        token TEXT PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        item_id TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now()
      )`;
      // 天算術(雲遊四海機緣觸發的黑市限定購買):token = Polar checkout session id,狀態機同上,
      // 唯一差異是發放的道具由伺服器在 webhook 收到付款成功時隨機抽出(見 engine.ts 的 rollOracleItem)
      await sql`CREATE TABLE IF NOT EXISTS oracle_requests (
        token TEXT PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        status TEXT NOT NULL DEFAULT 'pending',
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now()
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
