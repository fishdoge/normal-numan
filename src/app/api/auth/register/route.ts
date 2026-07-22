import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";
import { sql, ensureSchema } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const { username, password, name } = await req.json();
  if (!username?.trim() || !password || password.length < 4 || !name?.trim()) {
    return NextResponse.json({ error: "道號、帳號必填,密碼至少 4 位" }, { status: 400 });
  }
  await ensureSchema();
  const exists = await sql`SELECT 1 FROM users WHERE username = ${username.trim()}`;
  if (exists.length) return NextResponse.json({ error: "此帳號已有人使用" }, { status: 409 });

  const hash = await bcrypt.hash(password, 10);
  const rows = await sql`
    INSERT INTO users (username, name, pass_hash)
    VALUES (${username.trim()}, ${name.trim()}, ${hash}) RETURNING id`;
  const userId = (rows[0] as { id: number }).id;

  const token = randomUUID();
  await sql`INSERT INTO sessions (token, user_id) VALUES (${token}, ${userId})`;

  const res = NextResponse.json({ ok: true, name: name.trim() });
  res.cookies.set("session", token, { httpOnly: true, sameSite: "lax", maxAge: 60 * 60 * 24 * 365 });
  return res;
}
