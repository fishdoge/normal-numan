import { NextRequest, NextResponse } from "next/server";
import { sql, userFromToken, ensureSchema } from "@/lib/db";

export const runtime = "nodejs";

const MAX_LEN = 200;

// GET:最近 100 則訊息(依時間正序,供直接渲染);?after=id 可只拉取更新的訊息供輪詢
export async function GET(req: NextRequest) {
  await ensureSchema();
  const user = await userFromToken(req.cookies.get("session")?.value);
  if (!user) return NextResponse.json({ error: "未登入" }, { status: 401 });

  // 名稱依境界配色(見 nameColorOf)需要發言當下對應玩家的目前境界,故 LEFT JOIN saves 撈 realm_idx
  // (訊息本身不存境界快照,顯示時一律採「目前」境界;找不到存檔則以 0 表示煉氣期前期)
  const after = req.nextUrl.searchParams.get("after");
  if (after && /^\d+$/.test(after)) {
    const rows = await sql`
      SELECT c.id, c.name, c.message, c.created_at, COALESCE((s.data->>'realmIdx')::int, 0) AS realm_idx
      FROM chat_messages c LEFT JOIN saves s ON s.user_id = c.user_id
      WHERE c.id > ${Number(after)} ORDER BY c.id ASC LIMIT 200`;
    return NextResponse.json({ ok: true, messages: rows });
  }

  const rows = await sql`
    SELECT c.id, c.name, c.message, c.created_at, COALESCE((s.data->>'realmIdx')::int, 0) AS realm_idx
    FROM chat_messages c LEFT JOIN saves s ON s.user_id = c.user_id
    ORDER BY c.id DESC LIMIT 100`;
  return NextResponse.json({ ok: true, messages: (rows as unknown[]).reverse() });
}

// POST:{ message } —— 發言,所有已登入玩家皆可使用
export async function POST(req: NextRequest) {
  await ensureSchema();
  const user = await userFromToken(req.cookies.get("session")?.value);
  if (!user) return NextResponse.json({ error: "未登入" }, { status: 401 });

  const { message } = await req.json();
  const text = String(message ?? "").trim();
  if (!text) return NextResponse.json({ error: "訊息不可為空" }, { status: 400 });
  if (text.length > MAX_LEN) {
    return NextResponse.json({ error: `訊息過長(上限 ${MAX_LEN} 字)` }, { status: 400 });
  }

  const rows = await sql`
    INSERT INTO chat_messages (user_id, name, message)
    VALUES (${user.id}, ${user.name}, ${text})
    RETURNING id, name, message, created_at`;
  return NextResponse.json({ ok: true, message: rows[0] });
}
