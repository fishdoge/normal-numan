"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AdminLogin({ username }: { username?: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: form.get("username"), password: form.get("password") }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "登入失敗");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "暫時無法登入,請稍後重試");
    } finally {
      setBusy(false);
    }
  }
  async function switchAccount() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/auth/logout", { method: "POST" });
      if (!res.ok) throw new Error("登出失敗,請重試");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "暫時無法登出");
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="admin-shell admin-gate">
      <Link href="/" className="admin-back">
        ← 回到遊戲
      </Link>
      <div className="admin-gate-card">
        <p className="admin-eyebrow">凡人修仙傳 · 管理後臺</p>
        <h1>玩家數據</h1>
        {username ? (
          <>
            <p className="admin-intro">
              帳號 <strong>{username}</strong> 尚未取得管理員權限。
            </p>
            <p className="admin-note">請使用已授權的遊戲帳號登入。</p>
            <button className="admin-button admin-primary" onClick={switchAccount} disabled={busy}>
              {busy ? "正在切換…" : "切換帳號"}
            </button>
          </>
        ) : (
          <>
            <p className="admin-intro">以管理員的遊戲帳號登入,查閱玩家仙籍與修行紀錄。</p>
            <form
              onSubmit={submit}
              className="admin-login-form"
              aria-busy={busy}
              aria-describedby={error ? "admin-login-error" : undefined}
            >
              <label htmlFor="admin-username">遊戲登入帳號</label>
              <input
                id="admin-username"
                name="username"
                autoComplete="username"
                required
                maxLength={100}
                autoCapitalize="none"
                spellCheck={false}
              />
              <label htmlFor="admin-password">密碼</label>
              <input
                id="admin-password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
              />
              <button className="admin-button admin-primary" disabled={busy}>
                {busy ? "登入中…" : "登入後臺 →"}
              </button>
            </form>
          </>
        )}
        {error && (
          <p id="admin-login-error" className="admin-error" role="alert">
            {error}
          </p>
        )}
        <p className="admin-gate-foot">僅限管理員查閱</p>
      </div>
    </main>
  );
}
