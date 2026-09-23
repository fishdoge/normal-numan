"use client";

import { useEffect, useRef, type ReactNode } from "react";
import Image from "next/image";
import { useGame, statsOf, type Tab } from "@/game/store";
import { formatStones } from "@/game/types";
import { currentEraYears, eraLabelText } from "@/game/data/eraTime";
import { realmDisplayName } from "@/i18n/realmText";
import { useT } from "@/i18n/useT";
import type { DictKey } from "@/i18n/dict";
import GameIcon, { type GameIconName } from "./GameIcon";

export const GAME_NAV: { tab: Tab; label: DictKey; icon: GameIconName }[] = [
  { tab: "explore", label: "tabExplore", icon: "explore" },
  { tab: "bag", label: "tabBag", icon: "bag" },
  { tab: "tech", label: "tabTech", icon: "tech" },
  { tab: "craft", label: "tabCraft", icon: "craft" },
  { tab: "market", label: "tabMarket", icon: "market" },
  { tab: "trade", label: "tabTrade", icon: "trade" },
  { tab: "dex", label: "tabDex", icon: "dex" },
  { tab: "wanling", label: "tabWanling", icon: "wanling" },
  { tab: "rank", label: "tabRank", icon: "rank" },
];

export function GameBrand() {
  const t = useT();
  return (
    <div className="game-brand">
      <span className="game-brand-seal">
        <GameIcon name="mountain" />
      </span>
      <div>
        <strong>{t("appTitle")}</strong>
        <span>A MORTAL’S JOURNEY</span>
      </div>
    </div>
  );
}

export default function GameShell({
  children,
  onGuide,
  onChangelog,
}: {
  children: ReactNode;
  onGuide: () => void;
  onChangelog: () => void;
}) {
  const s = useGame((x) => x.save)!;
  const tab = useGame((x) => x.activeTab);
  const view = useGame((x) => x.mainView);
  const setTab = useGame((x) => x.setActiveTab);
  const setView = useGame((x) => x.setMainView);
  const lang = useGame((x) => x.language);
  const setLanguage = useGame((x) => x.setLanguage);
  const t = useT();
  const menu = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [tab, view]);
  const logout = async () => {
    const res = await fetch("/api/auth/logout", { method: "POST" });
    if (res.ok) location.reload();
  };
  const { realm, hpMax, mpMax } = statsOf(s);
  const navigate = (next: Tab) => {
    setTab(next);
    setView("game");
    menu.current?.close();
    window.scrollTo({ top: 0 });
  };
  const nav = (
    <nav className="game-nav" aria-label={t("uiNavigation")}>
      <p className="nav-group-label">{t("uiJourney")}</p>
      {GAME_NAV.map((item, i) => (
        <div key={item.tab}>
          {i === 4 && <p className="nav-group-label">{t("uiWorld")}</p>}
          <button
            className={`game-nav-item ${tab === item.tab && view === "game" ? "is-active" : ""}`}
            aria-current={tab === item.tab && view === "game" ? "page" : undefined}
            onClick={() => navigate(item.tab)}
          >
            <GameIcon name={item.icon} />
            <span>{t(item.label)}</span>
            <span className="nav-active-dot" />
          </button>
        </div>
      ))}
      <button
        className={`game-nav-item ${view === "sect" ? "is-active" : ""}`}
        aria-current={view === "sect" ? "page" : undefined}
        onClick={() => {
          setView("sect");
          menu.current?.close();
          window.scrollTo({ top: 0 });
        }}
      >
        <GameIcon name="sect" />
        <span>{t("sectHall")}</span>
        <span className="nav-active-dot" />
      </button>
    </nav>
  );
  const sidebarFoot = (
    <div className="sidebar-foot">
      <div className="sidebar-mobile-tools">
        <button
          className="sidebar-announcement"
          onClick={() => {
            menu.current?.close();
            onGuide();
          }}
        >
          <GameIcon name="help" />
          {t("navGuide")}
        </button>
        <button className="sidebar-announcement" onClick={logout}>
          <GameIcon name="logout" />
          {t("navLogout")}
        </button>
      </div>
      <button
        onClick={() => {
          menu.current?.close();
          onChangelog();
        }}
        className="sidebar-announcement"
      >
        <GameIcon name="spark" />
        {t("navChangelog")}
        <span>↗</span>
      </button>
      <div className="sidebar-player">
        <Image src="/images/world/wandering-cultivator.webp" alt="" width={40} height={40} />
        <div>
          <strong>{s.name}</strong>
          <span>{realmDisplayName(statsOf(s).realm, lang)}</span>
        </div>
      </div>
    </div>
  );
  return (
    <div className="game-shell">
      <a className="skip-link" href="#game-main">
        {t("uiSkip")}
      </a>
      <dialog
        ref={menu}
        className="game-menu-dialog"
        aria-label={t("uiNavigation")}
        onClick={(e) => {
          if (e.target === e.currentTarget) menu.current?.close();
        }}
      >
        <div className="game-menu-content">
          <div className="menu-brand-row">
            <GameBrand />
            <button
              className="icon-button"
              aria-label={t("uiCloseMenu")}
              onClick={() => menu.current?.close()}
            >
              <GameIcon name="close" />
            </button>
          </div>
          {nav}
          {sidebarFoot}
        </div>
      </dialog>
      <div className="game-workspace">
        <header className="game-topbar">
          <div className="player-hud">
            <button
              className="hud-portrait"
              aria-label={t("statusTitle")}
              onClick={() => {
                setView("game");
                requestAnimationFrame(() => {
                  const panel = document.getElementById("character-sheet");
                  panel?.scrollIntoView({ block: "start" });
                  panel?.focus({ preventScroll: true });
                });
              }}
            >
              <Image src="/images/world/wandering-cultivator.webp" alt="" width={68} height={68} />
            </button>
            <div className="hud-identity">
              <strong>{s.name}</strong>
              <span>{realmDisplayName(realm, lang)}</span>
            </div>
            <div className="hud-vitals">
              {(
                [
                  { label: "statHp", value: s.hp, max: hpMax, tone: "health" },
                  { label: "statMp", value: s.mp, max: mpMax, tone: "mana" },
                ] as const
              ).map((stat) => (
                <div key={stat.tone} className={`hud-vital hud-${stat.tone}`}>
                  <span>
                    {t(stat.label)}{" "}
                    <b>
                      {stat.value}/{stat.max}
                    </b>
                  </span>
                  <i aria-hidden="true">
                    <i
                      style={{
                        width: `${Math.max(0, Math.min(100, (stat.value / stat.max) * 100))}%`,
                      }}
                    />
                  </i>
                </div>
              ))}
            </div>
          </div>
          <div className="game-topbar-tools">
            <span className="topbar-stones">
              <GameIcon name="gem" />
              <span>{formatStones(s.stones)}</span>
            </span>
            <button
              className="icon-button desktop-tool"
              onClick={onGuide}
              title={t("navGuide")}
              aria-label={t("navGuide")}
            >
              <GameIcon name="help" />
            </button>
            <button
              className="icon-button language-button"
              onClick={() => setLanguage(lang === "zh" ? "en" : "zh")}
              title={t("langToggleTooltip")}
            >
              {t("langToggle")}
            </button>
            <button
              className="icon-button desktop-tool"
              aria-label={t("navLogout")}
              title={t("navLogout")}
              onClick={logout}
            >
              <GameIcon name="logout" />
            </button>
          </div>
        </header>
        <main className="game-main" id="game-main" tabIndex={-1}>
          <div className="world-caption">
            <span>
              <span className="status-dot" />
              {t("uiWorldCaption")}
            </span>
            <span>{t("worldEraNow").replace("{era}", eraLabelText(currentEraYears()))}</span>
          </div>
          {children}
        </main>
      </div>
      <nav className="game-bottom-nav world-dock" aria-label={t("uiQuickNavigation")}>
        {GAME_NAV.map((item, index) => (
          <button
            key={item.tab}
            className={`${index > 2 ? "dock-secondary" : ""} ${tab === item.tab && view === "game" ? "is-active" : ""}`}
            aria-current={tab === item.tab && view === "game" ? "page" : undefined}
            onClick={() => navigate(item.tab)}
          >
            <span className="dock-seal">
              <GameIcon name={item.icon} />
            </span>
            <span>{t(item.label)}</span>
          </button>
        ))}
        <button
          className={`dock-secondary ${view === "sect" ? "is-active" : ""}`}
          aria-current={view === "sect" ? "page" : undefined}
          onClick={() => {
            setView("sect");
            window.scrollTo({ top: 0 });
          }}
        >
          <span className="dock-seal">
            <GameIcon name="sect" />
          </span>
          <span>{t("sectHall")}</span>
        </button>
        <button onClick={() => menu.current?.showModal()}>
          <span className="dock-seal">
            <GameIcon name="menu" />
          </span>
          <span>{t("uiMore")}</span>
        </button>
      </nav>
    </div>
  );
}
