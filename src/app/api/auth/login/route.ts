import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";
import { sql, ensureSchema } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const { username, password } = await req.json();
  await ensureSchema();
  const rows = await sql`SELECT id, name, pass_hash FROM users WHERE username = ${username?.trim() ?? ""}`;
  const user = rows[0] as { id: number; name: string; pass_hash: string } | undefined;
  if (!user || !(await bcrypt.compare(password ?? "", user.pass_hash))) {
    return NextResponse.json({ error: "帳號或密碼有誤" }, { status: 401 });
  }
  const token = randomUUID();
  await sql`INSERT INTO sessions (token, user_id) VALUES (${token}, ${user.id})`;
  const res = NextResponse.json({ ok: true, name: user.name });
  res.cookies.set("session", token, { httpOnly: true, sameSite: "lax", maxAge: 60 * 60 * 24 * 365 });
  return res;
}
