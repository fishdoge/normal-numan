import { NextRequest, NextResponse } from "next/server";
import { sql, userFromToken } from "@/lib/db";
import { applyAction, newSave, SaveData } from "@/game/engine";

export const runtime = "nodejs";

// 所有遊戲操作的唯一入口:伺服器讀檔 → 引擎運算 → 寫回 → 回傳
export async function POST(req: NextRequest) {
  const user = await userFromToken(req.cookies.get("session")?.value);
  if (!user) return NextResponse.json({ error: "未登入" }, { status: 401 });

  const { type, payload } = await req.json();

  if (type === "start") {
    const name = String(payload?.name ?? "").trim() || user.name;
    const sectId = String(payload?.sectId ?? "");
    const save = newSave(name, sectId);
    await sql`
      INSERT INTO saves (user_id, data) VALUES (${user.id}, ${JSON.stringify(save)}::jsonb)
      ON CONFLICT (user_id) DO UPDATE SET data = EXCLUDED.data, updated_at = now(), last_life_at = now()`;
    return NextResponse.json({ ok: true, save });
  }

  if (type === "reset") {
    await sql`DELETE FROM saves WHERE user_id = ${user.id}`;
    await sql`DELETE FROM listings WHERE seller_id = ${user.id}`;
    return NextResponse.json({ ok: true, save: null });
  }

  const rows = await sql`SELECT data FROM saves WHERE user_id = ${user.id}`;
  if (!rows.length) return NextResponse.json({ error: "尚未開始遊戲" }, { status: 400 });

  const save = (rows[0] as { data: SaveData }).data;
  const result = applyAction(save, type, payload ?? {});

  await sql`UPDATE saves SET data = ${JSON.stringify(result.save)}::jsonb, updated_at = now() WHERE user_id = ${user.id}`;

  return NextResponse.json({
    ok: !result.error,
    save: result.save,
    loot: result.loot ?? null,
    breakResult: result.breakResult ?? null,
    error: result.error ?? null,
  });
}
