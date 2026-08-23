"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  useGame,
  statsOf,
  maxLifeOf,
  cultCostOf,
  breakChanceOf,
  ENERGY_COST,
  Modal,
} from "@/game/store";
import { REALMS } from "@/game/data/realms";
import { CHANGELOG } from "@/game/data/changelog";
import { REVIVAL_PRICE_USD } from "@/game/data/blackMarket";
import { currentEraYears, eraLabelText } from "@/game/data/eraTime";
import { renderLootLine } from "./ColoredText";
import { useT } from "@/i18n/useT";
import { realmDisplayName } from "@/i18n/realmText";
import AuthGate from "./AuthGate";
import CharCreate from "./CharCreate";
import ActionTabs from "./ActionTabs";
import SectPage from "./SectPage";
import LogChatPanel from "./LogChatPanel";
import GuideModal from "./GuideModal";
import { StatusPanel, CombatPanel, RealmProgressPanel } from "./panels";

// 更新公告:逐版列出 version/ 目錄的重點內容(精簡為玩家視角)——條列內容(entry.title/highlights)本身仍為中文,尚未翻譯
function ChangelogModal({ onClose }: { onClose: () => void }) {
  const t = useT();
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="panel deco-frame max-w-lg w-full max-h-[80vh] flex flex-col animate-floatUp"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-baseline justify-between mb-2">
          <p className="panel-title mb-0">{t("changelogTitle")}</p>
          <button className="chip hover:text-gold py-1.5 px-2.5" onClick={onClose}>
            {t("btnClose")}
          </button>
        </div>
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {CHANGELOG.map((entry) => (
            <div key={entry.version} className="border border-faded/20 rounded-sm p-3">
              <div className="flex items-baseline justify-between">
                <span className="font-bold text-gold">
                  {t("versionLabel").replace("{v}", entry.version)}
                  <span className="text-cream font-normal ml-2">{entry.title}</span>
                </span>
                <span className="text-xs text-faded font-mono shrink-0 ml-3">{entry.date}</span>
              </div>
              <ul className="mt-2 space-y-1 text-sm text-cream/90 list-disc list-inside">
                {entry.highlights.map((h, i) => (
                  <li key={i}>{h}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// 向仙班祈禱 · 六道輪迴盤:死亡畫面上的付費復活流程(終身限一次)
function PrayForRevival() {
  const setSave = useGame((x) => x.setSave);
  const revivalUsed = useGame((x) => x.revivalUsed);
  const setRevivalUsed = useGame((x) => x.setRevivalUsed);
  const setPurchaseResult = useGame((x) => x.setPurchaseResult);
  const t = useT();
  const [praying, setPraying] = useState(false);
  const [err, setErr] = useState("");
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => {
    if (pollRef.current) clearInterval(pollRef.current);
  }, []);

  const startPray = async () => {
    setErr("");
    try {
      const res = await fetch("/api/revive", { method: "POST" });
      const j = await res.json();
      if (!res.ok) {
        setErr(j.error ?? t("prayFailGeneric"));
        return;
      }
      window.open(j.url, "_blank", "noopener");
      setPraying(true);
      pollRef.current = setInterval(async () => {
        try {
          const r = await (await fetch(`/api/revive?token=${j.token}`)).json();
          if (r.status === "done") {
            if (pollRef.current) clearInterval(pollRef.current);
            const saveRes = await (await fetch("/api/save")).json();
            if (saveRes.save) setSave(saveRes.save);
            setRevivalUsed(true);
            setPraying(false);
            setPurchaseResult({
              success: true,
              title: t("revivalDoneTitle"),
              lines: [t("revivalDoneLine1"), t("revivalDoneLine2")],
            });
          } else if (r.status === "failed") {
            if (pollRef.current) clearInterval(pollRef.current);
            setErr(t("revivalFailErr"));
            setPraying(false);
            setPurchaseResult({
              success: false,
              title: t("revivalFailTitle"),
              lines: [t("revivalFailLine")],
            });
          }
        } catch {
          /* 靜默重試 */
        }
      }, 3000);
    } catch {
      setErr(t("netErr"));
    }
  };

  if (revivalUsed) {
    return <p className="text-xs text-faded mt-4">{t("revivalOnceOnly")}</p>;
  }

  return (
    <div className="mt-6">
      {!praying ? (
        <button
          className="btn border-fuchsia-400/60 text-fuchsia-300 hover:bg-fuchsia-400/15 flex-col !items-start text-left px-5 py-3"
          onClick={startPray}
          title={`USD ${REVIVAL_PRICE_USD}`}
        >
          <span className="text-base font-bold">{t("revivalPrayBtn")}</span>
          <span className="text-xs text-fuchsia-300/70 mt-0.5">
            {t("revivalPrayPrice").replace("{n}", String(REVIVAL_PRICE_USD))}
          </span>
        </button>
      ) : (
        <p className="text-sm text-fuchsia-300 animate-pulse">{t("revivalPraying")}</p>
      )}
      {err && <p className="text-xs text-vermillion mt-2">{err}</p>}
    </div>
  );
}

function DeathScreen() {
  const s = useGame((x) => x.save)!;
  const act = useGame((x) => x.act);
  const t = useT();
  const lang = useGame((x) => x.language);
  const line1 = t("deathLine1")
    .replace("{age}", String(maxLifeOf(s)))
    .replace("{realm}", realmDisplayName(REALMS[s.realmIdx], lang));
  return (
    <main className="max-w-2xl mx-auto px-4 py-24 text-center">
      <p className="font-mono text-xs tracking-[0.5em] text-faded mb-4">HERE LIES A CULTIVATOR</p>
      <h1 className="text-5xl font-black tracking-widest text-vermillion mb-6">{t("deathHeadline")}</h1>
      <div className="panel deco-frame text-left mx-auto max-w-md mb-8">
        <p className="panel-title">{t("deathEpitaphTitle")}</p>
        <p className="leading-loose text-cream">
          {s.name},{line1}
          <br />
          {t("deathLine2").replace("{day}", String(s.day))}
          <br />
          {t("deathLine3")}
        </p>
      </div>
      <button className="btn text-lg px-10 py-3" onClick={() => act("reset")}>
        {t("navReset")}
      </button>
      <PrayForRevival />
    </main>
  );
}

// 通用彈窗(突破結果 / 戰利品 / 採集所得)
function ResultModal({ modal, onClose }: { modal: Modal; onClose: () => void }) {
  const t = useT();
  const ok = modal.success !== false;
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className={`panel deco-frame max-w-md w-full mx-4 text-center animate-floatUp ${
          ok ? "border-gold/60" : "border-vermillion/60"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          className={`text-3xl font-black tracking-[0.3em] my-4 ${ok ? "text-gold" : "text-vermillion"}`}
        >
          {modal.title}
        </h2>
        <div className="space-y-2 text-cream leading-relaxed mb-6 text-left px-2">
          {modal.lines.map((l, i) => (
            <p key={i}>{renderLootLine(l)}</p>
          ))}
        </div>
        <button className="btn px-8 mb-2" onClick={onClose}>
          {t("btnAcknowledge")}
        </button>
      </div>
    </div>
  );
}

// 修煉欄:置頂、醒目
function CultivationBar() {
  const s = useGame((x) => x.save)!;
  const act = useGame((x) => x.act);
  const busy = useGame((x) => x.busy);
  const t = useT();
  const { realm, hpMax } = statsOf(s);
  const inCombat = !!s.combat;
  const inDwelling = s.dwellingSlot != null;
  const expNeed = realm.expNeed;
  const needsZhenxian = realm.id === "dujie";
  const hasZhenxian = (s.inventory["zhenxiandan"] ?? 0) >= 1;
  const expReady = s.exp >= expNeed;
  const canBreak = expReady && (!needsZhenxian || hasZhenxian);
  const cost = cultCostOf(s);
  const chance = breakChanceOf(s);
  const energy = s.energy ?? 0;
  const energyTip = (need: number) =>
    energy < need ? `${t("energyInsufficientTip")} (${need})` : undefined;
  const breakTitle = !expReady
    ? t("breakNeedExp").replace("{n}", String(expNeed))
    : needsZhenxian && !hasZhenxian
      ? t("breakNeedZhenxian")
      : energy < ENERGY_COST.breakthrough
        ? energyTip(ENERGY_COST.breakthrough)
        : t("breakChancePct").replace("{n}", String(Math.round(chance * 100)));
  return (
    <div className={`panel deco-frame ${canBreak ? "border-gold/70" : ""}`}>
      <div className="flex flex-wrap items-center gap-3">
        <p className="panel-title mb-0 mr-2">{t("cultivateTitle")}</p>
        <button
          className="btn text-base px-5 py-2"
          disabled={busy || inCombat || inDwelling || energy < ENERGY_COST.cultivate}
          onClick={() => act("cultivate")}
          title={inDwelling ? t("inDwellingTip") : energyTip(ENERGY_COST.cultivate)}
        >
          {t("btnCultivate")}{" "}
          <span className="ml-1 font-mono text-xs">
            -{cost} {t("lifeCostSuffix")} · -{ENERGY_COST.cultivate} {t("energyCostSuffix")}
          </span>
        </button>
        <button
          className="btn text-base px-5 py-2"
          disabled={busy || inCombat || inDwelling || s.hp >= hpMax || energy < ENERGY_COST.rest}
          onClick={() => act("rest")}
          title={inDwelling ? t("inDwellingTip") : energyTip(ENERGY_COST.rest)}
        >
          {t("btnRest")}{" "}
          <span className="ml-1 font-mono text-xs">
            -{ENERGY_COST.rest} {t("energyCostSuffix")}
          </span>
        </button>
        <button
          className="btn text-base px-5 py-2 border-fuchsia-400/50 text-fuchsia-300 hover:bg-fuchsia-400/15 hover:border-fuchsia-400"
          disabled={
            busy || inCombat || inDwelling || s.stones < 100000000 || energy < ENERGY_COST.wander
          }
          onClick={() => act("wander")}
          title={inDwelling ? t("inDwellingTip") : (energyTip(ENERGY_COST.wander) ?? t("wanderTooltip"))}
        >
          {t("btnWander")}{" "}
          <span className="ml-1 font-mono text-xs">
            -{ENERGY_COST.wander} {t("energyCostSuffix")}
          </span>
        </button>
        <button
          className={`btn text-base px-5 py-2 ${canBreak && !inDwelling ? "border-gold text-gold animate-pulse" : ""}`}
          disabled={busy || inCombat || inDwelling || !canBreak || energy < ENERGY_COST.breakthrough}
          onClick={() => act("breakthrough")}
          title={inDwelling ? t("inDwellingTip") : breakTitle}
        >
          {t("btnBreakthrough")}
          {canBreak && !inDwelling ? ` (${Math.round(chance * 100)}%)` : ""}
        </button>
        <span className="text-xs text-faded ml-auto font-mono">
          {t("cultivationSummaryLine")
            .replace("{exp}", String(s.exp))
            .replace("{need}", String(expNeed))
            .replace("{chance}", String(Math.round(chance * 100)))}
        </span>
      </div>
      {needsZhenxian && !hasZhenxian && (
        <p className="text-xs text-fuchsia-300 mt-2">{t("zhenxianNote")}</p>
      )}
      {inDwelling && <p className="text-xs text-fuchsia-300 mt-2">{t("dwellingActiveNote")}</p>}
    </div>
  );
}

export default function Game() {
  const save = useGame((x) => x.save);
  const setSave = useGame((x) => x.setSave);
  const loot = useGame((x) => x.loot);
  const breakResult = useGame((x) => x.breakResult);
  const purchaseResult = useGame((x) => x.purchaseResult);
  const closeLoot = useGame((x) => x.closeLoot);
  const closeBreak = useGame((x) => x.closeBreak);
  const closePurchaseResult = useGame((x) => x.closePurchaseResult);
  const mainView = useGame((x) => x.mainView);
  const language = useGame((x) => x.language);
  const setLanguage = useGame((x) => x.setLanguage);
  const t = useT();
  const [auth, setAuth] = useState<"checking" | "anon" | "authed">("checking");
  const [userName, setUserName] = useState("");
  const [showChangelog, setShowChangelog] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  const loadSave = useCallback(async () => {
    try {
      const res = await fetch("/api/save");
      if (!res.ok) {
        setAuth("anon");
        return;
      }
      const j = await res.json();
      setSave(j.save ?? null);
      if (j.name) setUserName(j.name);
      useGame.getState().setRevivalUsed(!!j.revivalUsed);
      // 離線期間流逝的壽元(lifeGained)已由伺服器寫入 save.log,無需前端重複提示
      if (j.save && j.credited) {
        useGame.getState().pushLog(t("tradeCredited"));
      }
      setAuth("authed");
    } catch {
      setAuth("anon");
    }
  }, [setSave, t]);

  useEffect(() => {
    loadSave();
  }, [loadSave]);

  if (auth === "checking") {
    return (
      <main className="flex items-center justify-center min-h-screen">
        <p className="font-mono text-faded tracking-[0.4em] animate-pulse">{t("loadingScreen")}</p>
      </main>
    );
  }

  if (auth === "anon") return <AuthGate onAuthed={() => loadSave()} />;

  if (!save || !save.started) return <CharCreate name={userName} />;

  if (save.dead) return <DeathScreen />;

  if (mainView === "sect") return <SectPage />;

  const isXian = REALMS[save.realmIdx]?.stage >= 10;

  return (
    <main className={`max-w-6xl mx-auto px-4 py-6 relative ${isXian ? "xian-aura" : ""}`}>
      {purchaseResult && <ResultModal modal={purchaseResult} onClose={closePurchaseResult} />}
      {!purchaseResult && breakResult && <ResultModal modal={breakResult} onClose={closeBreak} />}
      {!purchaseResult && !breakResult && loot && <ResultModal modal={loot} onClose={closeLoot} />}
      {showChangelog && <ChangelogModal onClose={() => setShowChangelog(false)} />}
      {showGuide && <GuideModal onClose={() => setShowGuide(false)} />}
      <header className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2 mb-5">
        <div>
          <h1
            className={`text-2xl font-black tracking-[0.35em] ${isXian ? "text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-300 via-amber-200 to-cyan-200" : ""}`}
          >
            {t("appTitle")}
          </h1>
          <p className="font-mono text-[10px] tracking-[0.4em] text-faded">
            {isXian ? t("appSubtitleAscended") : t("appSubtitle")}
          </p>
          <p className="font-mono text-[10px] tracking-[0.2em] text-gold/70 mt-0.5">
            {t("worldEraNow").replace("{era}", eraLabelText(currentEraYears()))}
          </p>
        </div>
        <div className="flex flex-wrap gap-4 items-baseline">
          <button
            className="text-xs text-faded/60 hover:text-gold transition-colors border border-faded/30 rounded-sm px-1.5"
            onClick={() => setLanguage(language === "zh" ? "en" : "zh")}
            title={t("langToggleTooltip")}
          >
            {t("langToggle")}
          </button>
          <button
            className="text-xs text-faded/60 hover:text-gold transition-colors"
            onClick={() => setShowGuide(true)}
          >
            {t("navGuide")}
          </button>
          <button
            className="text-xs text-faded/60 hover:text-gold transition-colors"
            onClick={() => setShowChangelog(true)}
          >
            {t("navChangelog")}
          </button>

          <button
            className="text-xs text-faded/60 hover:text-gold transition-colors"
            onClick={async () => {
              await fetch("/api/auth/logout", { method: "POST" });
              location.reload();
            }}
          >
            {t("navLogout")}
          </button>
        </div>
      </header>

      <div className="mb-4">
        <CultivationBar />
      </div>

      <div className="grid gap-4 md:grid-cols-[300px_minmax(0,1fr)] lg:grid-cols-[300px_minmax(0,1fr)_340px]">
        <div className="space-y-4">
          <StatusPanel />
          <RealmProgressPanel />
        </div>
        <div className="space-y-4 md:col-start-2 min-w-0">
          <CombatPanel />
          <ActionTabs />
        </div>
        <div className="md:col-start-2 lg:col-start-3">
          <LogChatPanel />
        </div>
      </div>
    </main>
  );
}
