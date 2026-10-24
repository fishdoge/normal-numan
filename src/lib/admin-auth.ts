import { NextRequest, NextResponse } from "next/server";
import { userFromToken, type SessionUser } from "./db";

export const PRIVATE_HEADERS = { "Cache-Control": "private, no-store" };

export async function requireAdmin(
  req: NextRequest,
): Promise<{ user: SessionUser } | { response: NextResponse }> {
  const user = await userFromToken(req.cookies.get("session")?.value);
  if (!user) {
    return {
      response: NextResponse.json(
        { error: "請先登入帳號" },
        { status: 401, headers: PRIVATE_HEADERS },
      ),
    };
  }
  if (user.is_admin !== true) {
    return {
      response: NextResponse.json(
        { error: "此帳號沒有管理員權限" },
        { status: 403, headers: PRIVATE_HEADERS },
      ),
    };
  }
  return { user };
}
