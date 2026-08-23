import { NextRequest, NextResponse } from "next/server";
import { sql, userFromToken, ensureSchema } from "@/lib/db";
import { REALMS } from "@/game/data/realms";
import { SECTS } from "@/game/data/sects";
import { itemById } from "@/game/data/items";
import { sectDamageMultOfStages, applyDwellingExp, SaveData } from "@/game/engine";
import {
  sectTierOf,
  nextSectTierOf,
  nextDwellingLevelOf,
  DWELLING_MAX_LEVEL,
} from "@/game/data/sectTiers";

export const runtime = "nodejs";

interface MemberRow {
  name: string;
  realm_idx: number;
  exp: number;
  dead: boolean;
  updated_at: string;
  sect_id?: string;
}

async function loadTier(sectId: string) {
  const rows = await sql`SELECT tier, contribution FROM sect_tier WHERE sect_id = ${sectId}`;
  const r = rows[0] as { tier: number; contribution: string | number } | undefined;
  return { tier: r?.tier ?? 1, contribution: Number(r?.contribution ?? 0) };
}

// 結算停泊中位置自上次結算以來累積的修為(供離開/轉換仙境位置前呼叫,避免中間這段時間的修為憑空消失)
async function settleDwelling(userId: number) {
  const rows = await sql`SELECT data, dwelling_since FROM saves WHERE user_id = ${userId}`;
  const row = rows[0] as { data: SaveData; dwelling_since: string | null } | undefined;
  if (!row || row.data.dwellingSlot == null || !row.data.sectId || !row.dwelling_since) return;
  const hours = Math.max(
    0,
    Math.floor((Date.now() - new Date(row.dwelling_since).getTime()) / 3600000),
  );
  if (hours <= 0) return;
  const lvlRows = await sql`
    SELECT level FROM sect_dwelling WHERE sect_id = ${row.data.sectId} AND slot_idx = ${row.data.dwellingSlot}`;
  const level = (lvlRows[0] as { level: number } | undefined)?.level ?? 1;
  applyDwellingExp(row.data, hours, level);
  await sql`UPDATE saves SET data = ${JSON.stringify(row.data)}::jsonb, dwelling_since = now(), updated_at = now()
    WHERE user_id = ${userId}`;
}

// 確保本宗門依目前等級應開放的仙境位置皆已建立(缺的補齊,level 1、無人停泊)
// 以單一 generate_series 查詢一次補齊,避免高階宗門(最多 40 位)逐一 INSERT 造成大量往返延遲
async function ensureDwellingSlots(sectId: string, slotCount: number) {
  if (slotCount <= 0) return;
  await sql`
    INSERT INTO sect_dwelling (sect_id, slot_idx)
    SELECT ${sectId}, gs FROM generate_series(0, ${slotCount - 1}) AS gs
    ON CONFLICT (sect_id, slot_idx) DO NOTHING`;
}

// GET:
//   無參數 → 自己所屬宗門的成員清單 + 倉庫 + 等級/貢獻 + 仙境位置
//   ?all=1 → 全部五大宗門總覽(等級、人數、傷害倍率、成員名錄)
export async function GET(req: NextRequest) {
  await ensureSchema();
  const user = await userFromToken(req.cookies.get("session")?.value);
  if (!user) return NextResponse.json({ error: "未登入" }, { status: 401 });

  const all = req.nextUrl.searchParams.get("all");
  if (all) {
    const rows = await sql`
      SELECT data->>'sectId' AS sect_id, u.name,
        COALESCE((s.data->>'realmIdx')::int, 0) AS realm_idx
      FROM saves s JOIN users u ON u.id = s.user_id
      WHERE COALESCE((s.data->>'started')::boolean, false) = true
        AND COALESCE((s.data->>'dead')::boolean, false) = false
        AND s.data->>'sectId' IS NOT NULL AND s.data->>'sectId' != ''`;
    const tierRows = await sql`SELECT sect_id, tier, contribution FROM sect_tier`;
    const tierMap = new Map(
      (tierRows as { sect_id: string; tier: number; contribution: string | number }[]).map((r) => [
        r.sect_id,
        { tier: r.tier, contribution: Number(r.contribution) },
      ]),
    );
    const bySect = new Map<string, MemberRow[]>();
    for (const r of rows as MemberRow[]) {
      const list = bySect.get(r.sect_id!) ?? [];
      list.push(r);
      bySect.set(r.sect_id!, list);
    }
    const sects = SECTS.map((sect) => {
      const members = (bySect.get(sect.id) ?? []).sort((a, b) => b.realm_idx - a.realm_idx);
      const mult = sectDamageMultOfStages(members.map((m) => REALMS[m.realm_idx]?.stage));
      const t = tierMap.get(sect.id) ?? { tier: 1, contribution: 0 };
      return {
        id: sect.id,
        name: sect.name,
        element: sect.element,
        tier: t.tier,
        tierName: sectTierOf(t.tier).name,
        memberCap: sectTierOf(t.tier).memberCap,
        memberCount: members.length,
        mult,
        members: members.map((m) => ({ name: m.name, realm_idx: m.realm_idx })),
      };
    });
    return NextResponse.json({ ok: true, sects });
  }

  const meRows =
    await sql`SELECT data->>'sectId' AS sect_id, (data->>'dwellingSlot')::int AS dwelling_slot, dwelling_since
      FROM saves WHERE user_id = ${user.id}`;
  const meRow = meRows[0] as
    | { sect_id: string | null; dwelling_slot: number | null; dwelling_since: string | null }
    | undefined;
  const sectId = meRow?.sect_id;
  if (!sectId) return NextResponse.json({ ok: false, error: "尚未拜入宗門" }, { status: 400 });

  const members = await sql`
    SELECT u.name,
      COALESCE((s.data->>'realmIdx')::int, 0) AS realm_idx,
      COALESCE((s.data->>'exp')::bigint, 0) AS exp,
      COALESCE((s.data->>'dead')::boolean, false) AS dead,
      s.updated_at
    FROM saves s JOIN users u ON u.id = s.user_id
    WHERE s.data->>'sectId' = ${sectId}
      AND COALESCE((s.data->>'started')::boolean, false) = true
    ORDER BY realm_idx DESC, exp DESC
    LIMIT 2000`;

  const bankRows = await sql`SELECT items FROM sect_bank WHERE sect_id = ${sectId}`;
  const items = (bankRows[0] as { items: Record<string, number> } | undefined)?.items ?? {};

  const { tier, contribution } = await loadTier(sectId);
  const cur = sectTierOf(tier);
  const next = nextSectTierOf(tier);
  const blockedBy: string[] = [];
  let missingMaterials: { id: string; name: string; need: number; have: number }[] = [];
  if (next) {
    if (contribution < next.contribution) blockedBy.push("貢獻靈石不足");
    if (next.materials) {
      missingMaterials = next.materials
        .map((m) => ({
          id: m.id,
          name: itemById(m.id)?.name ?? m.id,
          need: m.n,
          have: items[m.id] ?? 0,
        }))
        .filter((m) => m.have < m.need);
      if (missingMaterials.length > 0) blockedBy.push("宗門倉庫素材不足");
    }
    if (next.requireStage && next.requireCount) {
      const n = (members as MemberRow[]).filter(
        (m) => (REALMS[m.realm_idx]?.stage ?? 0) >= next.requireStage!,
      ).length;
      if (n < next.requireCount) blockedBy.push("同門境界人數不足");
    }
  }

  await ensureDwellingSlots(sectId, cur.dwellingSlots);
  const dwellingRows = await sql`
    SELECT d.slot_idx, d.level, u.name AS occupant_name, d.occupant_user_id
    FROM sect_dwelling d LEFT JOIN users u ON u.id = d.occupant_user_id
    WHERE d.sect_id = ${sectId} AND d.slot_idx < ${cur.dwellingSlots}
    ORDER BY d.slot_idx`;
  const dwellingRowsTyped = dwellingRows as {
    slot_idx: number;
    level: number;
    occupant_name: string | null;
    occupant_user_id: number | null;
  }[];
  const dwellings = dwellingRowsTyped.map((d) => ({
    slotIdx: d.slot_idx,
    level: d.level,
    occupantName: d.occupant_name,
    nextLevel: nextDwellingLevelOf(d.level),
  }));
  // 以 sect_dwelling 佔用紀錄本身為準(而非 saves.dwellingSlot 快取欄位),避免兩者不同步時「離開」按鈕失效
  const myDwellingSlot =
    dwellingRowsTyped.find((d) => d.occupant_user_id === user.id)?.slot_idx ?? null;

  // 校正 saves.dwellingSlot 快取(例如測試資料直接改過 sect_dwelling 造成不同步),
  // 順便補上 dwelling_since,讓 /api/action 的仙境修為累算能重新抓到正確位置,而不只是這次查詢顯示正確
  if (meRow && meRow.dwelling_slot !== myDwellingSlot) {
    if (myDwellingSlot != null) {
      await sql`UPDATE saves SET data = jsonb_set(data, '{dwellingSlot}', to_jsonb(${myDwellingSlot}::int)),
        dwelling_since = COALESCE(dwelling_since, now()) WHERE user_id = ${user.id}`;
    } else {
      await sql`UPDATE saves SET data = jsonb_set(data, '{dwellingSlot}', 'null'::jsonb),
        dwelling_since = NULL WHERE user_id = ${user.id}`;
    }
  }

  return NextResponse.json({
    ok: true,
    sectId,
    members,
    items,
    tier,
    tierName: cur.name,
    memberCap: cur.memberCap,
    dwellingSlots: cur.dwellingSlots,
    contribution,
    myDwellingSlot,
    dwellings,
    nextTier: next
      ? { ...next, ready: blockedBy.length === 0, blockedBy, missingMaterials }
      : null,
  });
}

// POST:
//   { action: "contribute", amount }                          —— 貢獻靈石(不可取回,計入宗門貢獻)
//   { action: "depositItem" | "withdrawItem", itemId, qty }   —— 宗門倉庫物品存取
//   { action: "upgradeTier" }                                 —— 晉升宗門等級
//   { action: "assignDwelling" | "leaveDwelling", slotIdx? }  —— 停泊 / 離開宗門仙境
//   { action: "upgradeDwelling", slotIdx }                    —— 升級指定仙境位置
export async function POST(req: NextRequest) {
  await ensureSchema();
  const user = await userFromToken(req.cookies.get("session")?.value);
  if (!user) return NextResponse.json({ error: "未登入" }, { status: 401 });

  const body = await req.json();
  const action = body.action;

  const meRows = await sql`SELECT data->>'sectId' AS sect_id FROM saves WHERE user_id = ${user.id}`;
  const sectId = (meRows[0] as { sect_id: string | null } | undefined)?.sect_id;
  if (!sectId) return NextResponse.json({ error: "尚未拜入宗門" }, { status: 400 });

  if (action === "upgradeTier") {
    const { tier, contribution } = await loadTier(sectId);
    const next = nextSectTierOf(tier);
    if (!next) return NextResponse.json({ error: "已是宗門最高等級" }, { status: 400 });
    if (contribution < next.contribution) {
      return NextResponse.json({ error: "宗門貢獻靈石不足,無法晉升" }, { status: 400 });
    }
    if (next.requireStage && next.requireCount) {
      const members = await sql`
        SELECT COALESCE((data->>'realmIdx')::int, 0) AS realm_idx
        FROM saves WHERE data->>'sectId' = ${sectId}
          AND COALESCE((data->>'started')::boolean, false) = true
          AND COALESCE((data->>'dead')::boolean, false) = false`;
      const n = (members as { realm_idx: number }[]).filter(
        (m) => (REALMS[m.realm_idx]?.stage ?? 0) >= next.requireStage!,
      ).length;
      if (n < next.requireCount) {
        return NextResponse.json(
          { error: `晉升【${next.name}】尚需至少 ${next.requireCount} 位同門達到指定境界` },
          { status: 400 },
        );
      }
    }
    if (next.materials && next.materials.length > 0) {
      const bankRows = await sql`SELECT items FROM sect_bank WHERE sect_id = ${sectId}`;
      const items = (bankRows[0] as { items: Record<string, number> } | undefined)?.items ?? {};
      const short = next.materials.find((m) => (items[m.id] ?? 0) < m.n);
      if (short) {
        return NextResponse.json(
          { error: `晉升【${next.name}】尚缺宗門倉庫素材【${itemById(short.id)?.name ?? short.id}】` },
          { status: 400 },
        );
      }
    }
    // 樂觀併發鎖:僅在目前等級仍為 tier 時才寫入,避免重複點擊重複晉升。
    // 務必先搶佔等級變更、成功後才消耗素材——若順序相反,兩個同門同時點擊晉升時,
    // 只有一方能真正晉升,但兩邊都會各自扣一次素材,倉庫平白損失且晉升未必成功。
    const rows = await sql`
      INSERT INTO sect_tier (sect_id, tier, contribution) VALUES (${sectId}, ${next.tier}, ${contribution})
      ON CONFLICT (sect_id) DO UPDATE SET tier = ${next.tier}, updated_at = now()
      WHERE sect_tier.tier = ${tier}
      RETURNING tier`;
    if (!rows.length) return NextResponse.json({ error: "晉升失敗,請重試" }, { status: 400 });
    if (next.materials && next.materials.length > 0) {
      // 依序扣除倉庫素材(逐一 jsonb_set,數量不多,單一宗門晉升次數稀少,效能無虞)
      for (const m of next.materials) {
        await sql`UPDATE sect_bank SET items = jsonb_set(
          items, ARRAY[${m.id}], to_jsonb(GREATEST(0, COALESCE((items->>${m.id})::int, 0) - ${m.n}))
        ), updated_at = now() WHERE sect_id = ${sectId}`;
      }
    }
    return NextResponse.json({ ok: true, tier: next.tier, tierName: next.name });
  }

  if (action === "contribute") {
    const amount = body.amount;
    if (!Number.isInteger(amount) || amount < 1) {
      return NextResponse.json({ error: "數量須為正整數" }, { status: 400 });
    }
    const rows = await sql`
      WITH upd AS (
        UPDATE saves SET data = jsonb_set(data, '{stones}',
          to_jsonb(COALESCE((data->>'stones')::bigint, 0) - ${amount}))
        WHERE user_id = ${user.id} AND COALESCE((data->>'stones')::bigint, 0) >= ${amount}
        RETURNING (data->>'stones')::bigint AS remaining
      ),
      tier AS (
        INSERT INTO sect_tier (sect_id, contribution)
        SELECT ${sectId}, ${amount} WHERE EXISTS (SELECT 1 FROM upd)
        ON CONFLICT (sect_id) DO UPDATE SET contribution = sect_tier.contribution + EXCLUDED.contribution
        RETURNING contribution
      )
      SELECT (SELECT count(*) FROM upd) AS n,
             (SELECT contribution FROM tier) AS contribution,
             (SELECT remaining FROM upd) AS remaining`;
    const r = rows[0] as { n: string; contribution: string | null; remaining: string | null };
    if (Number(r.n) === 0) return NextResponse.json({ error: "靈石不足" }, { status: 400 });
    return NextResponse.json({
      ok: true,
      stones: Number(r.remaining),
      contribution: Number(r.contribution),
    });
  }

  if (action === "depositItem" || action === "withdrawItem") {
    const itemId = String(body.itemId ?? "");
    const qty = body.qty;
    const item = itemById(itemId);
    if (!item) return NextResponse.json({ error: "無此物品" }, { status: 400 });
    if (!Number.isInteger(qty) || qty < 1) {
      return NextResponse.json({ error: "數量須為正整數" }, { status: 400 });
    }

    if (action === "depositItem") {
      // 已裝備之物須先卸下方可存入宗門倉庫——否則裝備欄仍持續生效,卻同時被另一位同門提領裝備,等同憑空複製一件裝備的效果
      const saveRows = await sql`SELECT data FROM saves WHERE user_id = ${user.id}`;
      const saveData = (saveRows[0] as { data: SaveData } | undefined)?.data;
      const equippedIds = saveData
        ? [
            saveData.equippedWeapon,
            saveData.equippedRobe ?? saveData.equippedArmor,
            saveData.equippedAmulet,
            saveData.equippedTalisman,
            saveData.equippedPet,
            saveData.equippedMing,
          ]
        : [];
      if (equippedIds.includes(itemId)) {
        return NextResponse.json(
          { error: "此物尚裝備於身,須先卸下(裝備其他物品替換)方可存入宗門倉庫。" },
          { status: 400 },
        );
      }

      const rows = await sql`
        WITH upd AS (
          UPDATE saves SET data = jsonb_set(
            data, ARRAY['inventory', ${itemId}],
            to_jsonb(GREATEST(0, COALESCE((data->'inventory'->>${itemId})::int, 0) - ${qty}))
          )
          WHERE user_id = ${user.id} AND COALESCE((data->'inventory'->>${itemId})::int, 0) >= ${qty}
          RETURNING 1
        ),
        bank AS (
          INSERT INTO sect_bank (sect_id, items)
          SELECT ${sectId}, jsonb_build_object(${itemId}, ${qty})
          WHERE EXISTS (SELECT 1 FROM upd)
          ON CONFLICT (sect_id) DO UPDATE SET
            items = jsonb_set(
              COALESCE(sect_bank.items, '{}'::jsonb), ARRAY[${itemId}],
              to_jsonb(COALESCE((sect_bank.items->>${itemId})::int, 0) + ${qty})
            ),
            updated_at = now()
          RETURNING items
        )
        SELECT (SELECT count(*) FROM upd) AS n, (SELECT items FROM bank) AS items`;
      const r = rows[0] as { n: string; items: Record<string, number> | null };
      if (Number(r.n) === 0) return NextResponse.json({ error: "物品數量不足" }, { status: 400 });
      return NextResponse.json({ ok: true, items: r.items });
    }

    // withdrawItem
    const rows = await sql`
      WITH bank AS (
        UPDATE sect_bank SET items = jsonb_set(
          COALESCE(items, '{}'::jsonb), ARRAY[${itemId}],
          to_jsonb(GREATEST(0, COALESCE((items->>${itemId})::int, 0) - ${qty}))
        ), updated_at = now()
        WHERE sect_id = ${sectId} AND COALESCE((items->>${itemId})::int, 0) >= ${qty}
        RETURNING items
      ),
      upd AS (
        UPDATE saves SET data = jsonb_set(
          data, ARRAY['inventory', ${itemId}],
          to_jsonb(COALESCE((data->'inventory'->>${itemId})::int, 0) + ${qty})
        )
        WHERE user_id = ${user.id} AND EXISTS (SELECT 1 FROM bank)
        RETURNING 1
      )
      SELECT (SELECT count(*) FROM bank) AS n, (SELECT items FROM bank) AS items`;
    const r = rows[0] as { n: string; items: Record<string, number> | null };
    if (Number(r.n) === 0) return NextResponse.json({ error: "宗門倉庫物品不足" }, { status: 400 });
    return NextResponse.json({ ok: true, items: r.items });
  }

  if (action === "assignDwelling" || action === "leaveDwelling" || action === "upgradeDwelling") {
    const { tier } = await loadTier(sectId);
    const cur = sectTierOf(tier);
    await ensureDwellingSlots(sectId, cur.dwellingSlots);

    if (action === "leaveDwelling" || action === "assignDwelling") {
      // 結算離開/轉換前尚未入帳的仙境修為,避免這段時間憑空消失
      await settleDwelling(user.id);
    }

    if (action === "leaveDwelling") {
      await sql`UPDATE sect_dwelling SET occupant_user_id = NULL, updated_at = now()
        WHERE sect_id = ${sectId} AND occupant_user_id = ${user.id}`;
      await sql`UPDATE saves SET data = jsonb_set(data, '{dwellingSlot}', 'null'::jsonb),
        dwelling_since = NULL WHERE user_id = ${user.id}`;
      return NextResponse.json({ ok: true });
    }

    const slotIdx = body.slotIdx;
    if (!Number.isInteger(slotIdx) || slotIdx < 0 || slotIdx >= cur.dwellingSlots) {
      return NextResponse.json({ error: "無此仙境位置" }, { status: 400 });
    }

    if (action === "assignDwelling") {
      // 先確保自己未停泊他處(同宗僅能佔一位),再原子搶佔目標空位
      await sql`UPDATE sect_dwelling SET occupant_user_id = NULL, updated_at = now()
        WHERE sect_id = ${sectId} AND occupant_user_id = ${user.id}`;
      const rows = await sql`
        UPDATE sect_dwelling SET occupant_user_id = ${user.id}, updated_at = now()
        WHERE sect_id = ${sectId} AND slot_idx = ${slotIdx} AND occupant_user_id IS NULL
        RETURNING slot_idx`;
      if (!rows.length) return NextResponse.json({ error: "此位置已有同門停泊" }, { status: 400 });
      await sql`UPDATE saves SET data = jsonb_set(data, '{dwellingSlot}', to_jsonb(${slotIdx}::int)),
        dwelling_since = now() WHERE user_id = ${user.id}`;
      return NextResponse.json({ ok: true, slotIdx });
    }

    // upgradeDwelling:任何同門皆可出資升級(消耗宗門倉庫素材),不限本人是否停泊該位
    const rows = await sql`SELECT level FROM sect_dwelling WHERE sect_id = ${sectId} AND slot_idx = ${slotIdx}`;
    const level = (rows[0] as { level: number } | undefined)?.level ?? 1;
    if (level >= DWELLING_MAX_LEVEL) {
      return NextResponse.json({ error: "此仙境位置已臻最高等級" }, { status: 400 });
    }
    const next = nextDwellingLevelOf(level)!;
    const bankRows = await sql`SELECT items FROM sect_bank WHERE sect_id = ${sectId}`;
    const items = (bankRows[0] as { items: Record<string, number> } | undefined)?.items ?? {};
    const short = next.materials.find((m) => (items[m.id] ?? 0) < m.n);
    if (short) {
      return NextResponse.json(
        { error: `升級尚缺宗門倉庫素材【${itemById(short.id)?.name ?? short.id}】` },
        { status: 400 },
      );
    }
    // 樂觀併發鎖:先搶佔等級變更、成功後才消耗素材(理由同宗門等級晉升,避免併發重複扣料卻升級失敗)
    const upd = await sql`UPDATE sect_dwelling SET level = ${next.level}, updated_at = now()
      WHERE sect_id = ${sectId} AND slot_idx = ${slotIdx} AND level = ${level}
      RETURNING level`;
    if (!upd.length) return NextResponse.json({ error: "升級失敗,請重試" }, { status: 400 });
    for (const m of next.materials) {
      await sql`UPDATE sect_bank SET items = jsonb_set(
        items, ARRAY[${m.id}], to_jsonb(GREATEST(0, COALESCE((items->>${m.id})::int, 0) - ${m.n}))
      ), updated_at = now() WHERE sect_id = ${sectId}`;
    }
    return NextResponse.json({ ok: true, level: next.level });
  }

  return NextResponse.json({ error: "未知操作" }, { status: 400 });
}
