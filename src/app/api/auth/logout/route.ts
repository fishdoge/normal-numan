import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const token = req.cookies.get("session")?.value;
  if (token) await sql`DELETE FROM sessions WHERE token = ${token}`;
  const res = NextResponse.json({ ok: true });
  res.cookies.delete("session");
  return res;
}
