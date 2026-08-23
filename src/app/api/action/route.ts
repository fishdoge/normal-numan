import { NextRequest, NextResponse } from "next/server";
import { sql, userFromToken } from "@/lib/db";
import {
  applyAction,
  applyRealTimeAging,
  applyDwellingExp,
  applyEnergyRegen,
  newSave,
  sectDamageMultOfStages,
  SaveData,
} from "@/game/engine";
import { REALMS } from "@/game/data/realms";
import { sectTierOf } from "@/game/data/sectTiers";

export const runtime = "nodejs";

// 依宗門內(含自己)各成員境界,計算戰鬥傷害倍率(公式定義於 engine.ts,前端顯示用同一份)
async function sectDamageMultOf(sectId: string): Promise<number> {
  const rows = await sql`
    SELECT (data->>'realmIdx')::int AS realm_idx
    FROM saves
    WHERE data->>'sectId' = ${sectId}
      AND COALESCE((data->>'started')::boolean, false) = true
      AND COALESCE((data->>'dead')::boolean, false) = false
  `;
  const stages = (rows as { realm_idx: number | null }[]).map((r) =>
    r.realm_idx != null ? REALMS[r.realm_idx]?.stage : undefined,
  );
  return sectDamageMultOfStages(stages);
}

// 所有遊戲操作的唯一入口:伺服器讀檔 → 引擎運算 → 寫回 → 回傳
export async function POST(req: NextRequest) {
  const user = await userFromToken(req.cookies.get("session")?.value);
  if (!user) return NextResponse.json({ error: "未登入" }, { status: 401 });

  const { type, payload } = await req.json();

  if (type === "start") {
    const name = String(payload?.name ?? "").trim() || user.name;
    const sectId = String(payload?.sectId ?? "");
    if (sectId) {
      // 已隕落、尚未轉世重修的舊角色不佔用名額,避免宗門被無法再活動的殭屍帳號軟鎖滿員
      const [{ n }] = (await sql`
        SELECT count(*)::int AS n FROM saves
        WHERE data->>'sectId' = ${sectId}
          AND COALESCE((data->>'started')::boolean, false) = true
          AND COALESCE((data->>'dead')::boolean, false) = false
          AND user_id != ${user.id}`) as { n: number }[];
      const [tierRow] = (await sql`SELECT tier FROM sect_tier WHERE sect_id = ${sectId}`) as {
        tier: number;
      }[];
      const cap = sectTierOf(tierRow?.tier ?? 1).memberCap;
      if (n >= cap) {
        return NextResponse.json(
          { error: `該宗門已滿員(上限 ${cap} 人),請選擇其他宗門` },
          { status: 400 },
        );
      }
    }
    const save = newSave(name, sectId);
    await sql`
      INSERT INTO saves (user_id, data) VALUES (${user.id}, ${JSON.stringify(save)}::jsonb)
      ON CONFLICT (user_id) DO UPDATE SET data = EXCLUDED.data, updated_at = now(), last_life_at = now()`;
    return NextResponse.json({ ok: true, save });
  }

  if (type === "reset") {
    // 轉世重修前先騰出宗門仙境位置,避免留下永遠無人能收回的殭屍佔位(舊帳號 user_id 不會變、但舊存檔即將刪除)
    await sql`UPDATE sect_dwelling SET occupant_user_id = NULL, updated_at = now() WHERE occupant_user_id = ${user.id}`;
    await sql`DELETE FROM saves WHERE user_id = ${user.id}`;
    await sql`DELETE FROM listings WHERE seller_id = ${user.id}`;
    return NextResponse.json({ ok: true, save: null });
  }

  const rows =
    await sql`SELECT data, last_life_at, last_energy_at, dwelling_since FROM saves WHERE user_id = ${user.id}`;
  if (!rows.length) return NextResponse.json({ error: "尚未開始遊戲" }, { status: 400 });

  const row = rows[0] as {
    data: SaveData;
    last_life_at: string;
    last_energy_at: string;
    dwelling_since: string | null;
  };
  const save = row.data;

  // 全伺服器統一時間戳:每 1 小時真實時間 = 1 年壽元,與行動本身的耗壽元並存
  const hours = Math.max(
    0,
    Math.floor((Date.now() - new Date(row.last_life_at).getTime()) / 3600000),
  );
  if (hours > 0) applyRealTimeAging(save, hours);

  // 精力回復:每 5 分鐘真實時間 1 點,只推進「已兌現成點數」的整數分鐘,餘數留到下次結算
  // 停泊宗門仙境閉關潛修時,精力回復速度加倍(每 5 分鐘 2 點)
  const energyMinutesTotal = Math.max(
    0,
    Math.floor((Date.now() - new Date(row.last_energy_at).getTime()) / 60000),
  );
  const energyTicks = Math.floor(energyMinutesTotal / 5);
  const energyPoints = energyTicks * (save.dwellingSlot != null ? 2 : 1);
  const energyMinutesConsumed = energyTicks * 5;
  if (energyPoints > 0) applyEnergyRegen(save, energyPoints);

  // 宗門仙境:停泊中的位置每小時真實時間緩慢增長修為
  let dwellingHours = 0;
  if (save.dwellingSlot != null && save.sectId && row.dwelling_since) {
    dwellingHours = Math.max(
      0,
      Math.floor((Date.now() - new Date(row.dwelling_since).getTime()) / 3600000),
    );
    if (dwellingHours > 0) {
      const lvlRows = await sql`
        SELECT level FROM sect_dwelling WHERE sect_id = ${save.sectId} AND slot_idx = ${save.dwellingSlot}`;
      const level = (lvlRows[0] as { level: number } | undefined)?.level ?? 1;
      applyDwellingExp(save, dwellingHours, level);
    }
  }

  // 宗門傷害加成:僅在實際造成傷害的行動時查詢,避免每次操作都打宗門聚合查詢
  const finalPayload: Record<string, unknown> = { ...(payload ?? {}) };
  if ((type === "attack" || type === "cast") && save.sectId) {
    finalPayload.sectDamageMult = await sectDamageMultOf(save.sectId);
  }

  const result = applyAction(save, type, finalPayload);

  await sql`
    UPDATE saves SET data = ${JSON.stringify(result.save)}::jsonb, updated_at = now(),
      last_life_at = last_life_at + make_interval(hours => ${hours}),
      last_energy_at = last_energy_at + make_interval(mins => ${energyMinutesConsumed}),
      dwelling_since = CASE WHEN dwelling_since IS NOT NULL
        THEN dwelling_since + make_interval(hours => ${dwellingHours}) ELSE dwelling_since END
    WHERE user_id = ${user.id}`;

  return NextResponse.json({
    ok: !result.error,
    save: result.save,
    loot: result.loot ?? null,
    breakResult: result.breakResult ?? null,
    error: result.error ?? null,
  });
}
