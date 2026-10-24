import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, PRIVATE_HEADERS } from "@/lib/admin-auth";
import { getPlayerDetail } from "@/lib/admin-queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAdmin(req);
    if ("response" in auth) return auth.response;
    const { id } = await context.params;
    if (!/^\d+$/.test(id) || !Number.isSafeInteger(Number(id)) || Number(id) < 1) {
      return NextResponse.json(
        { error: "玩家編號不正確" },
        { status: 400, headers: PRIVATE_HEADERS },
      );
    }
    const detail = await getPlayerDetail(Number(id));
    return detail
      ? NextResponse.json(detail, { headers: PRIVATE_HEADERS })
      : NextResponse.json({ error: "找不到這位玩家" }, { status: 404, headers: PRIVATE_HEADERS });
  } catch (error) {
    console.error("Admin player detail failed", error);
    return NextResponse.json(
      { error: "暫時無法讀取玩家明細,請稍後重試" },
      { status: 500, headers: PRIVATE_HEADERS },
    );
  }
}
