"use client";

import { useState } from "react";
import { useT } from "@/i18n/useT";

export default function AuthGate({ onAuthed }: { onAuthed: (name: string) => void }) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const t = useT();

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
        setErr(j.error ?? t("authErrGeneric"));
        return;
      }
      onAuthed(j.name);
    } catch {
      setErr(t("authErrNet"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="max-w-md mx-auto px-4 py-20">
      <header className="text-center mb-10">
        <p className="font-mono text-xs tracking-[0.5em] text-gold/70 mb-3">{t("authTagline")}</p>
        <h1 className="text-5xl font-black tracking-widest text-parchment">{t("authTitle")}</h1>
        <p className="mt-4 text-faded text-sm">{t("authSubtitle")}</p>
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
                  ? "bg-gold/15 text-gold border border-gold/40"
                  : "text-faded hover:text-cream"
              }`}
            >
              {m === "login" ? t("authLogin") : t("authRegister")}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {mode === "register" && (
            <div>
              <p className="text-xs text-faded mb-1">{t("authDaoName")}</p>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="韓立"
                maxLength={12}
                className="w-full bg-smoke border border-faded/30 rounded-sm px-3 py-2 text-parchment placeholder-faded/40 focus:outline-none focus:border-gold/60"
              />
            </div>
          )}
          <div>
            <p className="text-xs text-faded mb-1">{t("authAccount")}</p>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="account"
              maxLength={32}
              className="w-full bg-smoke border border-faded/30 rounded-sm px-3 py-2 text-parchment placeholder-faded/40 focus:outline-none focus:border-gold/60"
            />
          </div>
          <div>
            <p className="text-xs text-faded mb-1">{t("authPassword")}</p>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t("authPasswordPlaceholder")}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              className="w-full bg-smoke border border-faded/30 rounded-sm px-3 py-2 text-parchment placeholder-faded/40 focus:outline-none focus:border-gold/60"
            />
          </div>
          {err && <p className="text-sm text-vermillion">{err}</p>}
          <button className="btn w-full py-2.5 text-base" disabled={busy} onClick={submit}>
            {busy ? "……" : mode === "login" ? t("authSubmitLogin") : t("authSubmitRegister")}
          </button>
        </div>
      </section>

      <p className="text-center text-xs text-faded/60 mt-6">{t("authFooterNote")}</p>
    </main>
  );
}
