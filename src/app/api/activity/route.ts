import { NextRequest, NextResponse } from "next/server";
import { sql, userFromToken } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const origin = req.headers.get("origin");
  if (
    (origin && origin !== req.nextUrl.origin) ||
    req.headers.get("sec-fetch-site") === "cross-site"
  ) {
    return NextResponse.json({ error: "請求來源不正確" }, { status: 403 });
  }
  const user = await userFromToken(req.cookies.get("session")?.value);
  if (!user) return NextResponse.json({ error: "未登入" }, { status: 401 });
  let event: unknown;
  try {
    event = (await req.json()).event;
  } catch {
    return NextResponse.json({ error: "請求格式不正確" }, { status: 400 });
  }
  if (event !== "heartbeat" && event !== "stop")
    return NextResponse.json({ error: "未知的活動事件" }, { status: 400 });
  const active = event === "heartbeat";
  // 同一帳號共用一列,避免多個頁籤重複累加。過長間隔不回補,且不接受客戶端傳入秒數。
  await sql`INSERT INTO player_activity (user_id,last_heartbeat_at)
    SELECT ${user.id},CASE WHEN ${active} THEN now() ELSE NULL END
    WHERE EXISTS (SELECT 1 FROM saves WHERE user_id=${user.id} AND COALESCE((data->>'started')::boolean,false))
    ON CONFLICT (user_id) DO UPDATE SET
      play_seconds=player_activity.play_seconds+CASE
        WHEN player_activity.last_heartbeat_at >= now()-interval '65 seconds'
        THEN GREATEST(0,FLOOR(EXTRACT(EPOCH FROM now()-player_activity.last_heartbeat_at)))::bigint ELSE 0 END,
      last_heartbeat_at=CASE WHEN ${active} THEN GREATEST(player_activity.last_heartbeat_at,now()) ELSE NULL END,
      last_seen_at=GREATEST(player_activity.last_seen_at,now())`;
  return new NextResponse(null, { status: 204, headers: { "Cache-Control": "no-store" } });
}
