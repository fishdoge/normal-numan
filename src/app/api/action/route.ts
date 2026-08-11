import { NextRequest, NextResponse } from "next/server";
import { sql, userFromToken } from "@/lib/db";
import { applyAction, applyRealTimeAging, newSave, SaveData } from "@/game/engine";

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

  const rows = await sql`SELECT data, last_life_at FROM saves WHERE user_id = ${user.id}`;
  if (!rows.length) return NextResponse.json({ error: "尚未開始遊戲" }, { status: 400 });

  const row = rows[0] as { data: SaveData; last_life_at: string };
  const save = row.data;

  // 全伺服器統一時間戳:每 1 小時真實時間 = 1 年壽元,與行動本身的耗壽元並存
  const hours = Math.max(
    0,
    Math.floor((Date.now() - new Date(row.last_life_at).getTime()) / 3600000),
  );
  if (hours > 0) applyRealTimeAging(save, hours);

  const result = applyAction(save, type, payload ?? {});

  await sql`
    UPDATE saves SET data = ${JSON.stringify(result.save)}::jsonb, updated_at = now(),
      last_life_at = last_life_at + make_interval(hours => ${hours})
    WHERE user_id = ${user.id}`;

  return NextResponse.json({
    ok: !result.error,
    save: result.save,
    loot: result.loot ?? null,
    breakResult: result.breakResult ?? null,
    error: result.error ?? null,
  });
}
