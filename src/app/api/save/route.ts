import { NextRequest, NextResponse } from "next/server";
import { sql, userFromToken } from "@/lib/db";
import { applyRealTimeAging, applyEnergyRegen, SaveData } from "@/game/engine";

export const runtime = "nodejs";

// GET:讀取存檔並結算離線壽元(每小時真實時間 = 1 年壽元,與行動本身的耗壽元並存)+ 交易行入帳
// 注意:沒有 PUT——存檔只能透過 /api/action 由伺服器引擎變更
export async function GET(req: NextRequest) {
  const user = await userFromToken(req.cookies.get("session")?.value);
  if (!user) return NextResponse.json({ error: "未登入" }, { status: 401 });

  // 原子:把 pending_stones(交易行貨款)入帳並歸零
  const credited = await sql`
    UPDATE saves SET
      data = jsonb_set(data, '{stones}',
        to_jsonb(COALESCE((data->>'stones')::bigint, 0) + pending_stones)),
      pending_stones = 0
    WHERE user_id = ${user.id} AND pending_stones > 0
    RETURNING pending_stones`;

  const userRows = await sql`SELECT revival_used FROM users WHERE id = ${user.id}`;
  const revivalUsed = !!(userRows[0] as { revival_used: boolean } | undefined)?.revival_used;

  const rows =
    await sql`SELECT data, last_life_at, last_energy_at FROM saves WHERE user_id = ${user.id}`;
  if (!rows.length) return NextResponse.json({ ok: true, save: null, name: user.name, revivalUsed });

  const row = rows[0] as { data: SaveData; last_life_at: string; last_energy_at: string };
  const hours = Math.max(
    0,
    Math.floor((Date.now() - new Date(row.last_life_at).getTime()) / 3600000),
  );
  let ageGained = 0;
  const save = row.data;

  // 精力回復:每 5 分鐘真實時間 1 點,離線期間也照算,只推進已兌現的整數分鐘
  // 停泊宗門仙境閉關潛修時,精力回復速度加倍(每 5 分鐘 2 點)
  const energyMinutesTotal = Math.max(
    0,
    Math.floor((Date.now() - new Date(row.last_energy_at).getTime()) / 60000),
  );
  const energyTicks = Math.floor(energyMinutesTotal / 5);
  const energyPoints = energyTicks * (save?.dwellingSlot != null ? 2 : 1);
  const energyMinutesConsumed = energyTicks * 5;
  if (energyPoints > 0 && save) applyEnergyRegen(save, energyPoints);

  if ((hours > 0 || energyPoints > 0) && save && !save.dead) {
    ageGained = hours;
    if (hours > 0) applyRealTimeAging(save, hours);
    await sql`
      UPDATE saves SET data = ${JSON.stringify(save)}::jsonb,
        last_life_at = last_life_at + make_interval(hours => ${hours}),
        last_energy_at = last_energy_at + make_interval(mins => ${energyMinutesConsumed})
      WHERE user_id = ${user.id}`;
  }

  return NextResponse.json({
    ok: true,
    save,
    name: user.name,
    revivalUsed,
    // 語意變更(1.6 版):此為離線期間流逝的壽元年數,非額外贈與的壽元
    lifeGained: ageGained,
    credited: credited.length > 0,
  });
}
