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

export const GAME_NAV: { tab: Tab; label: DictKey; icon: GameIconName; caption: string }[] = [
  { tab: "explore", label: "tabExplore", icon: "explore", caption: "THE WORLD" },
  { tab: "bag", label: "tabBag", icon: "bag", caption: "INVENTORY" },
  { tab: "tech", label: "tabTech", icon: "tech", caption: "SPIRIT ARTS" },
  { tab: "craft", label: "tabCraft", icon: "craft", caption: "ALCHEMY & FORGING" },
  { tab: "market", label: "tabMarket", icon: "market", caption: "THE BAZAAR" },
  { tab: "trade", label: "tabTrade", icon: "trade", caption: "TRADING HOUSE" },
  { tab: "dex", label: "tabDex", icon: "dex", caption: "BESTIARY" },
  { tab: "wanling", label: "tabWanling", icon: "wanling", caption: "ANCIENT RELICS" },
  { tab: "rank", label: "tabRank", icon: "rank", caption: "IMMORTAL RANKINGS" },
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

export function JourneyHero() {
  const s = useGame((x) => x.save)!;
  const lang = useGame((x) => x.language);
  const t = useT();
  const { realm } = statsOf(s);
  return (
    <section className="journey-hero" aria-labelledby="journey-title">
      <div className="journey-hero-copy">
        <p className="eyebrow">
          <span className="status-dot" />
          {t("uiWelcome").replace("{name}", s.name)}
        </p>
        <h1 id="journey-title">{t("uiHeroTitle")}</h1>
        <p className="journey-hero-description">{t("uiHeroDescription")}</p>
        <button
          className="btn btn-primary"
          onClick={() =>
            document.getElementById("journey-actions")?.scrollIntoView({ block: "start" })
          }
        >
          {t("uiExplore")}
          <GameIcon name="arrow" />
        </button>
      </div>
      <div className="journey-hero-seal" aria-hidden="true">
        山<br />海<br />有<br />靈
      </div>
      <div className="journey-hero-foot">
        <span>
          <GameIcon name="moon" />
          {realmDisplayName(realm, lang)}
        </span>
        <span>
          {t("statDay")}
          <strong>{s.day}</strong>
          {t("yearsSuffix")}
        </span>
        <span className="journey-poem">{t("uiHeroFootnote")}</span>
      </div>
    </section>
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
  }, []);
  const logout = async () => {
    const res = await fetch("/api/auth/logout", { method: "POST" });
    if (res.ok) location.reload();
  };
  const current = GAME_NAV.find((item) => item.tab === tab)!;
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
      <aside className="game-sidebar">
        <GameBrand />
        {nav}
        {sidebarFoot}
      </aside>
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
          <div className="game-breadcrumb">
            <button
              className="icon-button mobile-menu-trigger"
              aria-label={t("uiOpenMenu")}
              onClick={() => menu.current?.showModal()}
            >
              <GameIcon name="menu" />
            </button>
            <span>{t("uiJourney")}</span>
            <i>/</i>
            <strong>{view === "sect" ? t("sectHall") : t(current.label)}</strong>
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
            {view === "game" && (
              <button
                className="mobile-character-link"
                title={t("statusTitle")}
                aria-label={t("statusTitle")}
                onClick={() => {
                  const panel = document.getElementById("character-sheet");
                  panel?.scrollIntoView({ block: "start" });
                  panel?.focus({ preventScroll: true });
                }}
              >
                <Image
                  src="/images/world/wandering-cultivator.webp"
                  alt=""
                  width={32}
                  height={32}
                />
              </button>
            )}
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
      <nav className="game-bottom-nav" aria-label={t("uiQuickNavigation")}>
        {GAME_NAV.slice(0, 3).map((item) => (
          <button
            key={item.tab}
            className={tab === item.tab && view === "game" ? "is-active" : ""}
            aria-current={tab === item.tab && view === "game" ? "page" : undefined}
            onClick={() => navigate(item.tab)}
          >
            <GameIcon name={item.icon} />
            <span>{t(item.label)}</span>
          </button>
        ))}
        <button onClick={() => menu.current?.showModal()}>
          <GameIcon name="menu" />
          <span>{t("uiMore")}</span>
        </button>
      </nav>
    </div>
  );
}
