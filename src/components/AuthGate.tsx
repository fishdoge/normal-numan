"use client";

import { useState } from "react";

export default function AuthGate({ onAuthed }: { onAuthed: (name: string) => void }) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    setErr("");
    try {
      const res = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          mode === "register" ? { username, password, name } : { username, password },
        ),
      });
      const j = await res.json();
      if (!res.ok) {
        setErr(j.error ?? "發生錯誤");
        return;
      }
      onAuthed(j.name);
    } catch {
      setErr("無法連線至伺服器");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="max-w-md mx-auto px-4 py-20">
      <header className="text-center mb-10">
        <div className="flex justify-center mb-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/ldz/ldz-logo.jpg"
            alt="LDZ"
            className="h-16 w-16 rounded object-cover border border-emerald-400/40"
          />
        </div>
        <p className="font-mono text-xs tracking-[0.5em] text-emerald-400/70 mb-3">
          A TRADER&apos;S ROAD TO GODHOOD
        </p>
        <h1 className="text-4xl font-black tracking-widest text-parchment">LDZ 交易風雲傳</h1>
        <p className="mt-4 text-faded text-sm">交易檔案存於雲端,天涯海角,登入即續前緣。</p>
      </header>

      <section className="panel deco-frame">
        <div className="flex gap-1 mb-4 border-b border-faded/20 pb-2">
          {(["login", "register"] as const).map((m) => (
            <button
              key={m}
              onClick={() => {
                setMode(m);
                setErr("");
              }}
              className={`px-3 py-1 text-sm rounded-sm transition-colors ${
                mode === m
                  ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/40"
                  : "text-faded hover:text-cream"
              }`}
            >
              {m === "login" ? "登入" : "註冊帳戶"}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {mode === "register" && (
            <div>
              <p className="text-xs text-faded mb-1">交易員代號(遊戲中顯示的名字)</p>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="阿兜"
                maxLength={12}
                className="w-full bg-smoke border border-faded/30 rounded-sm px-3 py-2 text-parchment placeholder-faded/40 focus:outline-none focus:border-emerald-400/60"
              />
            </div>
          )}
          <div>
            <p className="text-xs text-faded mb-1">帳號</p>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="account"
              maxLength={32}
              className="w-full bg-smoke border border-faded/30 rounded-sm px-3 py-2 text-parchment placeholder-faded/40 focus:outline-none focus:border-emerald-400/60"
            />
          </div>
          <div>
            <p className="text-xs text-faded mb-1">密碼</p>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="至少 4 位"
              onKeyDown={(e) => e.key === "Enter" && submit()}
              className="w-full bg-smoke border border-faded/30 rounded-sm px-3 py-2 text-parchment placeholder-faded/40 focus:outline-none focus:border-emerald-400/60"
            />
          </div>
          {err && <p className="text-sm text-vermillion">{err}</p>}
          <button className="btn w-full py-2.5 text-base" disabled={busy} onClick={submit}>
            {busy ? "……" : mode === "login" ? "登 入" : "註 冊 並 入 場"}
          </button>
        </div>
      </section>

      <p className="text-center text-xs text-faded/60 mt-6">
        註冊後,資產每一小時自然增值一載(離線亦然)。
      </p>
    </main>
  );
}
