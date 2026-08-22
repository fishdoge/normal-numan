import { NextRequest, NextResponse } from "next/server";
import { sql, ensureSchema } from "@/lib/db";

export const runtime = "nodejs";

// 排行榜(整合為四榜):
//   ?type=exp   —— 修為榜:按修為(exp)高低
//   ?type=xiu   —— 修仙榜:按境界(realmIdx)→ 仙靈力 → 修為(綜合修仙成就)
//   ?type=futu  —— 浮屠塔榜:按浮屠塔通關層數(futuFloor)
//   ?type=kill  —— 獵殺榜:按累計妖獸擊殺總數(kills 物件所有值加總)
//   ?player=名  —— 查詢單一玩家公開資訊
export async function GET(req: NextRequest) {
  await ensureSchema();
  const type = req.nextUrl.searchParams.get("type") ?? "xiu";
  const player = req.nextUrl.searchParams.get("player");

  // 查詢單一玩家公開資訊(排行榜點擊 → 中間框顯示)
  if (player) {
    const rows = await sql`
      SELECT u.name, s.data
      FROM saves s JOIN users u ON u.id = s.user_id
      WHERE u.name = ${player}
        AND COALESCE((s.data->>'started')::boolean, false) = true
      LIMIT 1`;
    if (!rows.length) return NextResponse.json({ ok: false, error: "查無此修士" }, { status: 404 });
    const r = rows[0] as { name: string; data: Record<string, unknown> };
    const d = r.data;
    // 僅回傳公開欄位(不外洩靈石數量等)
    const equip = (k: string) => (typeof d[k] === "string" ? (d[k] as string) : null);
    return NextResponse.json({
      ok: true,
      profile: {
        name: r.name,
        realmIdx: (d.realmIdx as number) ?? 0,
        exp: (d.exp as number) ?? 0,
        xianli: (d.xianli as number) ?? 0,
        futuFloor: (d.futuFloor as number) ?? 0,
        sectId: (d.sectId as string) ?? null,
        age: (d.age as number) ?? 0,
        day: (d.day as number) ?? 0,
        dead: (d.dead as boolean) ?? false,
        kills: (d.kills as Record<string, number>) ?? {},
        seenCount: Array.isArray(d.seen) ? (d.seen as string[]).length : 0,
        lordsSeenCount: Array.isArray(d.lordsSeen) ? (d.lordsSeen as string[]).length : 0,
        learnedCount: Array.isArray(d.learned) ? (d.learned as string[]).length : 0,
        equippedWeapon: equip("equippedWeapon"),
        equippedRobe: equip("equippedRobe") ?? equip("equippedArmor"),
        equippedAmulet: equip("equippedAmulet"),
        equippedTalisman: equip("equippedTalisman"),
        equippedPet: equip("equippedPet"),
        equippedMing: equip("equippedMing"),
      },
    });
  }

  // 共用 SELECT 欄位
  if (type === "futu") {
    const rows = await sql`
      SELECT u.name,
        COALESCE((s.data->>'realmIdx')::int, 0) AS realm_idx,
        COALESCE((s.data->>'exp')::bigint, 0) AS exp,
        COALESCE((s.data->>'xianli')::bigint, 0) AS xianli,
        COALESCE((s.data->>'futuFloor')::int, 0) AS futu_floor,
        COALESCE((s.data->>'dead')::boolean, false) AS dead
      FROM saves s JOIN users u ON u.id = s.user_id
      WHERE COALESCE((s.data->>'started')::boolean, false) = true
        AND COALESCE((s.data->>'futuFloor')::int, 0) > 0
      ORDER BY futu_floor DESC
      LIMIT 100`;
    return NextResponse.json({ ok: true, players: rows });
  }

  if (type === "kill") {
    // JSONB 的 kills 物件(monsterId → 擊殺數)無法直接 SUM,需靠 jsonb_each_text 展開後加總
    const rows = await sql`
      SELECT u.name,
        COALESCE((s.data->>'realmIdx')::int, 0) AS realm_idx,
        COALESCE((s.data->>'dead')::boolean, false) AS dead,
        COALESCE((
          SELECT SUM(value::bigint) FROM jsonb_each_text(s.data->'kills')
        ), 0) AS total_kills
      FROM saves s JOIN users u ON u.id = s.user_id
      WHERE COALESCE((s.data->>'started')::boolean, false) = true
      ORDER BY total_kills DESC
      LIMIT 100`;
    return NextResponse.json({ ok: true, players: rows });
  }

  if (type === "exp") {
    const rows = await sql`
      SELECT u.name,
        COALESCE((s.data->>'realmIdx')::int, 0) AS realm_idx,
        COALESCE((s.data->>'exp')::bigint, 0) AS exp,
        COALESCE((s.data->>'xianli')::bigint, 0) AS xianli,
        COALESCE((s.data->>'futuFloor')::int, 0) AS futu_floor,
        COALESCE((s.data->>'dead')::boolean, false) AS dead
      FROM saves s JOIN users u ON u.id = s.user_id
      WHERE COALESCE((s.data->>'started')::boolean, false) = true
      ORDER BY exp DESC
      LIMIT 100`;
    return NextResponse.json({ ok: true, players: rows });
  }

  // 預設:修仙榜(境界 → 仙靈力 → 修為)
  const rows = await sql`
    SELECT u.name,
      COALESCE((s.data->>'realmIdx')::int, 0) AS realm_idx,
      COALESCE((s.data->>'exp')::bigint, 0) AS exp,
      COALESCE((s.data->>'xianli')::bigint, 0) AS xianli,
      COALESCE((s.data->>'futuFloor')::int, 0) AS futu_floor,
      COALESCE((s.data->>'dead')::boolean, false) AS dead
    FROM saves s JOIN users u ON u.id = s.user_id
    WHERE COALESCE((s.data->>'started')::boolean, false) = true
    ORDER BY realm_idx DESC, xianli DESC, exp DESC
    LIMIT 100`;
  return NextResponse.json({ ok: true, players: rows });
}
