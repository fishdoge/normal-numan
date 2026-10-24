#!/usr/bin/env node
import { neon } from "@neondatabase/serverless";
import nextEnv from "@next/env";

nextEnv.loadEnvConfig(process.cwd());
const args = process.argv.slice(2);
const username = args[0]?.trim();
if (!username || args.slice(1).some((a) => a !== "--revoke" && a !== "--dry-run")) {
  console.error("Usage: node scripts/set-admin.mjs <game-username> [--revoke] [--dry-run]");
  process.exit(1);
}
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");
// DDL 使用直接連線;不將連線字串或密碼輸出至日誌。
const url = new URL(process.env.DATABASE_URL);
url.hostname = url.hostname.replace(/-pooler(?=\.)/, "");
const sql = neon(url.toString());
const users = await sql`SELECT id,username FROM users WHERE username=${username}`;
if (users.length !== 1) {
  console.error("找不到此遊戲登入帳號,未變更任何權限。");
  process.exit(1);
}
const isAdmin = !args.includes("--revoke");
if (args.includes("--dry-run")) {
  console.log(JSON.stringify({ ...users[0], is_admin: isAdmin, dry_run: true }));
} else {
  const results = await sql.transaction([
    sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT false`,
    sql`UPDATE users SET is_admin=${isAdmin} WHERE id=${users[0].id} AND username=${username} RETURNING id,username,is_admin`,
  ]);
  if (results[1].length !== 1) throw new Error("帳號資料已變動,未完成綁定");
  console.log(JSON.stringify(results[1][0]));
}
