"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import type { AdminListResult, AdminPlayer, AdminPlayerDetail } from "@/lib/admin-data";

const number = (value: string | number) => {
  try {
    return BigInt(value).toLocaleString("zh-TW");
  } catch {
    return String(value);
  }
};
const date = (value: string | null) =>
  value ? new Date(value).toLocaleString("zh-TW", { timeZone: "Asia/Taipei", hour12: false }) : "—";
const duration = (value: string | null) => {
  if (value === null) return "尚未開始記錄";
  const seconds = BigInt(value);
  if (seconds < BigInt(60)) return `${seconds} 秒`;
  return `${number((seconds / BigInt(3600)).toString())} 時 ${(seconds / BigInt(60)) % BigInt(60)} 分`;
};
const stateName = (p: AdminPlayer) => (!p.hasSave ? "尚未創角" : p.dead ? "已隕落" : "修行中");
const ELEMENTS: Record<string, string> = {
  metal: "金",
  wood: "木",
  water: "水",
  fire: "火",
  earth: "土",
  none: "無",
};

async function readJson<T>(url: string, signal: AbortSignal): Promise<T> {
  const response = await fetch(url, { signal, cache: "no-store" });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error ?? "暫時無法讀取資料");
  return data as T;
}

function PlayerDetail({ detail }: { detail: AdminPlayerDetail }) {
  const p = detail.player;
  return (
    <>
      <div className="admin-profile-head">
        <div className="admin-profile-top">
          <span className="admin-eyebrow">仙籍編號 / {String(p.id).padStart(4, "0")}</span>
          <span className={`admin-tag ${p.dead ? "admin-tag-dead" : ""}`}>{stateName(p)}</span>
        </div>
        <h2 id="player-detail-title">{p.characterName ?? p.name}</h2>
        <p className="admin-account">
          {p.username} {p.isAdmin && <span className="admin-tag">管理員</span>}
        </p>
        <dl className="admin-profile-stats">
          <div>
            <dt>等級 / 境界</dt>
            <dd>{p.realm}</dd>
          </div>
          <div>
            <dt>本世打怪數</dt>
            <dd>{number(p.kills)}</dd>
          </div>
        </dl>
        <dl className="admin-profile-meta">
          <div>
            <dt>目前修為</dt>
            <dd>{number(p.exp)}</dd>
          </div>
          <div>
            <dt>有效遊玩時間</dt>
            <dd>{duration(p.playSeconds)}</dd>
          </div>
          <div>
            <dt>時間起算日</dt>
            <dd>{date(p.trackingStartedAt)}</dd>
          </div>
          <div>
            <dt>最近遊玩</dt>
            <dd>{date(p.lastSeenAt)}</dd>
          </div>
          <div>
            <dt>存檔更新</dt>
            <dd>{date(p.updatedAt)}</dd>
          </div>
          <div>
            <dt>帳號建立</dt>
            <dd>{date(p.createdAt)}</dd>
          </div>
        </dl>
      </div>
      <section className="admin-detail-section" aria-labelledby="stones-title">
        <div className="admin-section-heading">
          <h3 id="stones-title">靈石資產</h3>
          <span className="admin-unit">單位 / 下品靈石</span>
        </div>
        <p className="admin-stones-total">{number(p.stones)}</p>
        <dl className="admin-assets">
          <div>
            <dt>隨身</dt>
            <dd>{number(detail.stones.onHand)}</dd>
          </div>
          <div>
            <dt>靈石袋</dt>
            <dd>{number(detail.stones.pouch)}</dd>
          </div>
          <div>
            <dt>交易待入帳</dt>
            <dd>{number(detail.stones.pending)}</dd>
          </div>
        </dl>
      </section>
      <details className="admin-detail-section" open>
        <summary>
          擁有道具 <span>{detail.inventory.length} 種</span>
        </summary>
        <p className="admin-note">包含已裝備道具;掛賣中的物品另列於下方。</p>
        <div className="admin-detail-scroll" tabIndex={0} role="region" aria-label="道具明細">
          {detail.inventory.length ? (
            <table className="admin-mini-table">
              <caption className="sr-only">背包道具與持有數量</caption>
              <thead>
                <tr>
                  <th scope="col">道具 / 類型</th>
                  <th scope="col">數量</th>
                </tr>
              </thead>
              <tbody>
                {detail.inventory.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <span>{item.name}</span>{" "}
                      {item.equipped && <span className="admin-tag">已裝備</span>}
                      <small>
                        {item.kind} · {item.id}
                      </small>
                    </td>
                    <td>{number(item.quantity)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="admin-empty-small">尚無持有道具</p>
          )}
        </div>
      </details>
      <details className="admin-detail-section" open>
        <summary>
          擁有法術{" "}
          <span>
            {detail.spells.filter((s) => !s.innate).length} 種 · 基礎招式{" "}
            {detail.spells.filter((s) => s.innate).length} 種
          </span>
        </summary>
        <div className="admin-detail-scroll" tabIndex={0} role="region" aria-label="法術明細">
          {detail.spells.length ? (
            <table className="admin-mini-table">
              <caption className="sr-only">已習得法術、等級與額外副本</caption>
              <thead>
                <tr>
                  <th scope="col">法術</th>
                  <th scope="col">等級 / 副本</th>
                </tr>
              </thead>
              <tbody>
                {detail.spells.map((spell) => (
                  <tr key={spell.id}>
                    <td>
                      {spell.name} {spell.innate && <span className="admin-tag">基礎</span>}
                      <small>
                        {ELEMENTS[spell.element] ?? spell.element} · {spell.id}
                      </small>
                    </td>
                    <td>
                      Lv.{spell.level}
                      <small>額外 {spell.extraCopies} 本</small>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="admin-empty-small">尚無已習得法術</p>
          )}
        </div>
      </details>
      <details className="admin-detail-section">
        <summary>
          裝備欄{" "}
          <span>
            {detail.equipment.filter((e) => e.item).length} / {detail.equipment.length}
          </span>
        </summary>
        <dl className="admin-equipment">
          {detail.equipment.map((e) => (
            <div key={e.slot}>
              <dt>{e.slot}</dt>
              <dd>
                {e.item?.name ?? "未裝備"}
                {e.item && <small>{e.item.id}</small>}
              </dd>
            </div>
          ))}
        </dl>
      </details>
      <details className="admin-detail-section">
        <summary>
          打怪明細 <span>{detail.kills.length} 種</span>
        </summary>
        <p className="admin-note">本世存檔的擊殺紀錄,不含浮屠塔與天劫。</p>
        <div className="admin-detail-scroll" tabIndex={0} role="region" aria-label="擊殺明細">
          <dl className="admin-equipment">
            {detail.kills.length ? (
              detail.kills.map((k) => (
                <div key={k.id}>
                  <dt>
                    {k.name}
                    <small>{k.id}</small>
                  </dt>
                  <dd>{number(k.count)}</dd>
                </div>
              ))
            ) : (
              <p className="admin-empty-small">尚無擊殺紀錄</p>
            )}
          </dl>
        </div>
      </details>
      <details className="admin-detail-section">
        <summary>
          滕符 <span>{detail.tengfu.length} 筆</span>
        </summary>
        <div className="admin-detail-scroll" tabIndex={0} role="region" aria-label="滕符明細">
          {detail.tengfu.length ? (
            <ul className="admin-item-list">
              {detail.tengfu.map((t, index) => (
                <li key={`${t.id}-${index}`}>
                  <div>
                    {t.name}
                    <small>
                      {t.location} · {t.id}
                    </small>
                  </div>
                  <span>× {number(t.quantity)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="admin-empty-small">尚無持有滕符</p>
          )}
        </div>
      </details>
      <details className="admin-detail-section">
        <summary>
          交易掛賣 <span>{detail.listings.length} 筆</span>
        </summary>
        <div className="admin-detail-scroll" tabIndex={0} role="region" aria-label="掛賣明細">
          {detail.listings.length ? (
            <ul className="admin-item-list">
              {detail.listings.map((l) => (
                <li key={l.listingId}>
                  <div>
                    {l.name}
                    <small>
                      {l.id} · 每件 {number(l.price)} 靈石
                    </small>
                  </div>
                  <span>× {number(l.quantity)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="admin-empty-small">沒有掛賣中的道具</p>
          )}
        </div>
      </details>
    </>
  );
}

export default function AdminDashboard({ adminName }: { adminName: string }) {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("recent");
  const [status, setStatus] = useState("all");
  const [query, setQuery] = useState({ q: "", sort: "recent", status: "all", page: 1 });
  const [refresh, setRefresh] = useState(0);
  const [result, setResult] = useState<AdminListResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<number | null>(null);
  const [detail, setDetail] = useState<AdminPlayerDetail | null>(null);
  const [detailError, setDetailError] = useState("");
  const [updated, setUpdated] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    const params = new URLSearchParams({ ...query, page: String(query.page) });
    void readJson<AdminListResult>(`/api/admin/players?${params}`, controller.signal)
      .then((data) => {
        setResult(data);
        setSelected((id) =>
          data.players.some((p) => p.id === id) ? id : (data.players[0]?.id ?? null),
        );
        setUpdated(new Date().toISOString());
      })
      .catch((err) => {
        if (!controller.signal.aborted) {
          setError(err.message);
          setResult(null);
          setSelected(null);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [query, refresh]);

  useEffect(() => {
    setDetail(null);
    setDetailError("");
    if (selected === null) return;
    const controller = new AbortController();
    void readJson<AdminPlayerDetail>(`/api/admin/players/${selected}`, controller.signal)
      .then(setDetail)
      .catch((err) => {
        if (!controller.signal.aborted) setDetailError(err.message);
      });
    return () => controller.abort();
  }, [selected, refresh, query]);

  function applySearch(event: FormEvent) {
    event.preventDefault();
    setQuery({ q: search.trim(), sort, status, page: 1 });
  }
  const pages = result ? Math.max(1, Math.ceil(result.total / result.pageSize)) : 1;
  return (
    <main className="admin-shell">
      <a className="admin-skip" href="#player-detail">
        前往玩家明細
      </a>
      <header className="hud admin-header">
        <div className="admin-brand">
          <div>
            <p className="admin-eyebrow">凡人修仙傳 · 管理後臺</p>
            <h1>玩家數據</h1>
          </div>
        </div>
        <nav className="admin-nav" aria-label="後臺導覽">
          <span className="admin-identity">
            <i aria-hidden="true" />
            {adminName}
            <span>管理員</span>
          </span>
          <Link href="/" className="admin-button">
            ← 回到遊戲
          </Link>
          <button
            className="admin-button"
            disabled={loading}
            onClick={() => setRefresh((v) => v + 1)}
          >
            重新整理
          </button>
        </nav>
      </header>
      <section className="admin-overview" aria-label="全服數據總覽" aria-busy={loading}>
        <div>
          <span className="admin-overview-label">全服帳號</span>
          <p>
            {result ? number(result.overview.accounts) : "—"}
            <small>個帳號</small>
          </p>
          <span>已創角色 {result?.overview.characters ?? "—"} 位</span>
        </div>
        <div>
          <span className="admin-overview-label">本世擊殺總數</span>
          <p>
            {result ? number(result.overview.kills) : "—"}
            <small>隻</small>
          </p>
          <span>全服目前各角色本世累計</span>
        </div>
        <div>
          <span className="admin-overview-label">有效遊玩時間</span>
          <p className="admin-overview-time">
            {result ? duration(result.overview.playSeconds) : "—"}
          </p>
          <span>已開始記錄 {result?.overview.trackedAccounts ?? "—"} 個帳號</span>
        </div>
      </section>
      <div className="admin-ledger-heading">
        <div>
          <h2>玩家名冊</h2>
          <p>查閱修行進度、持有資產與遊玩紀錄</p>
        </div>
        <span className="admin-sync">最近讀取 / {date(updated)}</span>
      </div>
      <form className="admin-filters" onSubmit={applySearch} role="search" aria-label="搜尋玩家">
        <div className="admin-search">
          <label htmlFor="player-search">玩家 / 帳號</label>
          <input
            id="player-search"
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            maxLength={100}
            placeholder="搜尋角色名稱或登入帳號"
          />
        </div>
        <div>
          <label htmlFor="player-status">角色狀態</label>
          <select id="player-status" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="all">全部狀態</option>
            <option value="alive">修行中</option>
            <option value="dead">已隕落</option>
            <option value="unstarted">尚未創角</option>
          </select>
        </div>
        <div>
          <label htmlFor="player-sort">排序</label>
          <select id="player-sort" value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="recent">最近更新</option>
            <option value="realm">境界由高到低</option>
            <option value="kills">打怪數由多到少</option>
            <option value="stones">靈石由多到少</option>
            <option value="playtime">遊玩時間由長到短</option>
          </select>
        </div>
        <button className="admin-button admin-primary" disabled={loading}>
          查詢 →
        </button>
      </form>
      <div className="admin-workspace">
        <section className="admin-ledger" aria-label="玩家查詢結果" aria-busy={loading}>
          <div className="admin-table-note" role="status">
            {loading
              ? "正在讀取玩家資料…"
              : `共 ${result?.total ?? 0} 位玩家 · 第 ${query.page} 頁`}
          </div>
          {error ? (
            <div className="admin-empty">
              <p className="admin-error" role="alert">
                {error}
              </p>
              <button className="admin-button" onClick={() => setRefresh((v) => v + 1)}>
                重試
              </button>
            </div>
          ) : loading ? (
            <div className="admin-empty">
              <span className="admin-loading-mark" aria-hidden="true">
                籍
              </span>
              <p>正在展開仙籍…</p>
            </div>
          ) : result?.players.length ? (
            <>
              <div
                className="admin-table-scroll"
                tabIndex={0}
                role="region"
                aria-label="玩家列表,可水平捲動"
              >
                <table className="admin-player-table">
                  <caption className="sr-only">
                    玩家的等級、打怪數、靈石與遊玩時間。選取玩家可檢視持有物品與法術。
                  </caption>
                  <thead>
                    <tr>
                      <th scope="col">玩家 / 帳號</th>
                      <th scope="col">等級 · 境界</th>
                      <th scope="col">打怪數</th>
                      <th scope="col">靈石總額</th>
                      <th scope="col">遊玩時間</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.players.map((p) => (
                      <tr key={p.id} className={selected === p.id ? "admin-selected" : ""}>
                        <td>
                          <button
                            className="admin-player-select"
                            onClick={() => setSelected(p.id)}
                            aria-pressed={selected === p.id}
                            aria-controls="player-detail"
                            aria-label={`檢視 ${p.characterName ?? p.name} 的資料`}
                          >
                            <strong>{p.characterName ?? p.name}</strong>
                            <span>{p.username}</span>
                          </button>
                        </td>
                        <td>
                          <span>{p.realm}</span>
                          <small className={p.dead ? "admin-dead" : ""}>{stateName(p)}</small>
                        </td>
                        <td className="admin-numeric">{number(p.kills)}</td>
                        <td className="admin-numeric admin-gold">{number(p.stones)}</td>
                        <td className="admin-numeric admin-time-cell">{duration(p.playSeconds)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <nav className="admin-pagination" aria-label="玩家列表分頁">
                <span>
                  第 {query.page} / {pages} 頁
                </span>
                <div>
                  <button
                    className="admin-button"
                    disabled={query.page <= 1}
                    onClick={() => setQuery((q) => ({ ...q, page: q.page - 1 }))}
                  >
                    ← 上一頁
                  </button>
                  <button
                    className="admin-button"
                    disabled={query.page >= pages}
                    onClick={() => setQuery((q) => ({ ...q, page: q.page + 1 }))}
                  >
                    下一頁 →
                  </button>
                </div>
              </nav>
            </>
          ) : (
            <div className="admin-empty">
              <span className="admin-loading-mark" aria-hidden="true">
                尋
              </span>
              <p>找不到符合條件的玩家</p>
              <span>試試其他名稱,或將狀態設為「全部狀態」。</span>
            </div>
          )}
          <div className="admin-data-notes">
            <h3>數據口徑</h3>
            <p>
              遊玩時間從此功能啟用後開始累積,只計入遊戲在前景且最近兩分鐘內有操作的時間;歷史時間無法回補。
            </p>
            <p>
              打怪數沿用角色本世紀錄,轉世後重計,不含浮屠塔與天劫。靈石總額包含隨身、靈石袋及交易待入帳。
            </p>
            <p>未收錄的舊版道具與法術仍顯示原始編號及數量。</p>
          </div>
        </section>
        <aside
          id="player-detail"
          className="admin-detail"
          tabIndex={-1}
          aria-label="選取玩家的詳細資料"
          aria-busy={selected !== null && detail === null && !detailError}
        >
          {detailError ? (
            <div className="admin-empty">
              <p className="admin-error" role="alert">
                {detailError}
              </p>
              <button className="admin-button" onClick={() => setRefresh((v) => v + 1)}>
                重試
              </button>
            </div>
          ) : detail && detail.player.id === selected ? (
            <PlayerDetail key={detail.player.id} detail={detail} />
          ) : (
            <div className="admin-empty" role="status">
              <span className="admin-loading-mark" aria-hidden="true">
                錄
              </span>
              <p>{selected === null ? "選取一位玩家,查閱完整仙籍" : "正在讀取玩家明細…"}</p>
            </div>
          )}
        </aside>
      </div>
      <footer className="admin-footer">
        仙籍僅供管理員查閱<span>時間以台北時區顯示 · UTC+8</span>
      </footer>
    </main>
  );
}
