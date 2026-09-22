"use client";

import { useState } from "react";
import { useT } from "@/i18n/useT";
import { GameBrand } from "./GameShell";
import GameIcon from "./GameIcon";

export default function AuthGate({ onAuthed }: { onAuthed: (name: string) => void }) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const t = useT();

  const submit = async () => {
    if (busy) return;
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
    <main className="auth-screen">
      <section className="auth-landscape" aria-label={t("authTitle")}>
        <GameBrand />
        <div className="auth-story">
          <span className="eyebrow">THE PATH TO IMMORTALITY</span>
          <h2>{t("uiAuthQuote")}</h2>
          <p>{t("uiAuthDescription")}</p>
          <span className="auth-story-line" />
        </div>
        <p className="auth-landscape-note">{t("uiHeroFootnote")}</p>
      </section>
      <section className="auth-form-panel">
        <div className="auth-form-inner">
          <span className="auth-emblem">
            <GameIcon name="mountain" width={36} height={36} />
          </span>
          <p className="eyebrow">{mode === "login" ? "WELCOME BACK" : "A NEW CHAPTER"}</p>
          <h1>{mode === "login" ? t("uiAuthReturn") : t("uiAuthCreate")}</h1>
          <p className="auth-intro">{t("uiAuthHint")}</p>
          <div className="auth-mode-switch" aria-label={t("authTitle")}>
            {(["login", "register"] as const).map((m) => (
              <button
                key={m}
                type="button"
                disabled={busy}
                aria-pressed={mode === m}
                className={mode === m ? "is-active" : ""}
                onClick={() => {
                  setMode(m);
                  setErr("");
                }}
              >
                {m === "login" ? t("authLogin") : t("authRegister")}
              </button>
            ))}
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              submit();
            }}
            className="auth-form"
          >
            {mode === "register" && (
              <div>
                <label htmlFor="dao-name">{t("authDaoName")}</label>
                <input
                  id="dao-name"
                  name="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="韓立"
                  maxLength={12}
                  autoComplete="nickname"
                  required
                  disabled={busy}
                />
              </div>
            )}
            <div>
              <label htmlFor="account">{t("authAccount")}</label>
              <input
                id="account"
                name="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="account"
                maxLength={32}
                autoComplete="username"
                required
                disabled={busy}
              />
            </div>
            <div>
              <label htmlFor="password">{t("authPassword")}</label>
              <input
                id="password"
                name="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t("authPasswordPlaceholder")}
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                required
                disabled={busy}
              />
            </div>
            {err && (
              <p className="auth-error" role="alert">
                {err}
              </p>
            )}
            <button className="btn btn-primary auth-submit" type="submit" disabled={busy}>
              {busy ? "……" : mode === "login" ? t("authSubmitLogin") : t("authSubmitRegister")}
              <GameIcon name="arrow" />
            </button>
          </form>
          <div className="auth-footnote">
            <GameIcon name="spark" />
            <p>{t("authSubtitle")}</p>
          </div>
          <p className="auth-lifetime-note">{t("authFooterNote")}</p>
        </div>
      </section>
    </main>
  );
}
