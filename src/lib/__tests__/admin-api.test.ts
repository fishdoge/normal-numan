import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("../db", () => ({ userFromToken: vi.fn(), sql: vi.fn() }));
vi.mock("../admin-queries", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../admin-queries")>()),
  listPlayers: vi.fn(),
  getPlayerDetail: vi.fn(),
}));
import { userFromToken, sql } from "../db";
import { listPlayers, getPlayerDetail, parsePlayerQuery } from "../admin-queries";
import { GET as list } from "../../app/api/admin/players/route";
import { GET as detail } from "../../app/api/admin/players/[id]/route";
import { POST as activity } from "../../app/api/activity/route";

const user = { id: 1, username: "admin", name: "範例", is_admin: true };
const req = (path = "/api/admin/players") => new NextRequest(`http://localhost${path}`);
const context = (id: string) => ({ params: Promise.resolve({ id }) });
beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(userFromToken).mockResolvedValue(user);
});

describe("後臺 API 權限與輸入邊界", () => {
  it("資料庫驗證失敗時回傳無快取的通用錯誤,不暴露內部訊息", async () => {
    const logger = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      vi.mocked(userFromToken).mockRejectedValue(new Error("private-db-details"));
      for (const response of [await list(req()), await detail(req(), context("10"))]) {
        expect(response.status).toBe(500);
        expect(response.headers.get("cache-control")).toBe("private, no-store");
        expect(await response.text()).not.toContain("private-db-details");
      }
      expect(listPlayers).not.toHaveBeenCalled();
      expect(getPlayerDetail).not.toHaveBeenCalled();
    } finally {
      logger.mockRestore();
    }
  });
  it.each([401, 403])("%s 回應不讀取玩家資料,且禁止快取", async (status) => {
    vi.mocked(userFromToken).mockResolvedValue(
      status === 401 ? null : { ...user, is_admin: false },
    );
    for (const response of [await list(req()), await detail(req(), context("10"))]) {
      expect(response.status).toBe(status);
      expect(response.headers.get("cache-control")).toBe("private, no-store");
    }
    expect(listPlayers).not.toHaveBeenCalled();
    expect(getPlayerDetail).not.toHaveBeenCalled();
  });
  it("管理員可查詢,搜尋字串完整交給參數化查詢", async () => {
    vi.mocked(listPlayers).mockResolvedValue({ players: [], total: 0 } as never);
    const response = await list(req("/api/admin/players?q=%27%3Bdrop&sort=stones&page=2"));
    expect(response.status).toBe(200);
    expect(listPlayers).toHaveBeenCalledWith({
      search: "';drop",
      sort: "stones",
      status: "all",
      page: 2,
    });
  });
  it("拒絕無效分頁/排序/狀態,沒有動態 SQL 識別字", async () => {
    for (const query of [
      "page=0",
      "page=-1",
      "page=1.5",
      "page=999999999999999999",
      "sort=DROP",
      "status=xxx",
      `q=${"a".repeat(101)}`,
    ]) {
      expect(parsePlayerQuery(new URLSearchParams(query))).toBeNull();
      expect((await list(req(`/api/admin/players?${query}`))).status).toBe(400);
    }
    expect(listPlayers).not.toHaveBeenCalled();
  });
  it("玩家 ID 有效才進資料層;不存在回傳 404", async () => {
    expect((await detail(req(), context("bad"))).status).toBe(400);
    expect(getPlayerDetail).not.toHaveBeenCalled();
    vi.mocked(getPlayerDetail).mockResolvedValue(null);
    expect((await detail(req(), context("10"))).status).toBe(404);
    vi.mocked(getPlayerDetail).mockResolvedValue({ player: { id: 10 } } as never);
    expect((await detail(req(), context("10"))).status).toBe(200);
  });
});

describe("遊玩時間心跳", () => {
  const post = (body: unknown, origin?: string) =>
    new NextRequest("http://localhost/api/activity", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(origin ? { origin } : {}) },
      body: JSON.stringify(body),
    });
  it("拒絕跨站、匿名與無效事件,不寫入時間", async () => {
    expect((await activity(post({ event: "heartbeat" }, "https://other.example"))).status).toBe(
      403,
    );
    vi.mocked(userFromToken).mockResolvedValue(null);
    expect((await activity(post({ event: "heartbeat" }))).status).toBe(401);
    vi.mocked(userFromToken).mockResolvedValue(user);
    expect((await activity(post({ event: "other" }))).status).toBe(400);
    expect(sql).not.toHaveBeenCalled();
  });
  it("只接受事件,忽略客戶端指定的秒數與帳號", async () => {
    vi.mocked(sql).mockResolvedValue([]);
    expect(
      (await activity(post({ event: "heartbeat", seconds: 999999, userId: 999 }))).status,
    ).toBe(204);
    const values = vi.mocked(sql).mock.calls[0].slice(1);
    expect(values).toContain(user.id);
    expect(values).not.toContain(999999);
    expect(values).not.toContain(999);
  });
});
