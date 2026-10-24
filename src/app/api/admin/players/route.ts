import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, PRIVATE_HEADERS } from "@/lib/admin-auth";
import { listPlayers, parsePlayerQuery } from "@/lib/admin-queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAdmin(req);
    if ("response" in auth) return auth.response;
    const query = parsePlayerQuery(req.nextUrl.searchParams);
    if (!query)
      return NextResponse.json(
        { error: "搜尋或分頁條件不正確" },
        { status: 400, headers: PRIVATE_HEADERS },
      );
    return NextResponse.json(await listPlayers(query), { headers: PRIVATE_HEADERS });
  } catch (error) {
    console.error("Admin player list failed", error);
    return NextResponse.json(
      { error: "暫時無法讀取玩家資料,請稍後重試" },
      { status: 500, headers: PRIVATE_HEADERS },
    );
  }
}
