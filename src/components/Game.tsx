"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  useGame,
  statsOf,
  maxLifeOf,
  cultCostOf,
  breakChanceOf,
  ENERGY_COST,
  NOVICE_GUARD_REALMS,
  Modal,
} from "@/game/store";
import { formatStones } from "@/game/types";
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
import ExploreStrip from "./ExploreStrip";
import SectPage from "./SectPage";
import LogChatPanel from "./LogChatPanel";
import GuideModal from "./GuideModal";
import { StatusPanel, CombatPanel, RealmProgressPanel } from "./panels";
import { ActionFx, ActionFxKind, BreakFailFx, BreakthroughCelebration, GainFloat, LootBurst } from "./fx";

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

  useEffect(
    () => () => {
      if (pollRef.current) clearInterval(pollRef.current);
    },
    [],
  );

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
      <h1 className="text-5xl font-black tracking-widest text-vermillion mb-6">
        {t("deathHeadline")}
      </h1>
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
function CultivationBar({
  exploreOpen,
  onToggleExplore,
}: {
  exploreOpen: boolean;
  onToggleExplore: () => void;
}) {
  const s = useGame((x) => x.save)!;
  const act = useGame((x) => x.act);
  const busy = useGame((x) => x.busy);
  const t = useT();
  const { realm } = statsOf(s);
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
  // 4.1 版:按下打坐 / 調息 / 雲遊 / 突破立刻播放特效(不等伺服器回應),回應後再浮出實際增長的數值
  const [fx, setFx] = useState<{ id: number; kind: ActionFxKind } | null>(null);
  const [gain, setGain] = useState<{
    id: number;
    kind: ActionFxKind;
    text: string;
    tone: string;
  } | null>(null);
  const [traveling, setTraveling] = useState(false);
  const clearFx = useCallback(() => setFx(null), []);
  const run = async (kind: ActionFxKind, type: string) => {
    const id = Date.now();
    setFx({ id, kind });
    if (kind === "wander") {
      setTraveling(true);
      await new Promise((r) => window.setTimeout(r, 900));
      setTraveling(false);
    }
    const before = useGame.getState().save;
    await act(type);
    const after = useGame.getState().save;
    if (!before || !after) return;
    if (kind === "cultivate" && after.exp > before.exp) {
      const healed = after.hp - before.hp;
      const text = [
        t("fxGainExp").replace("{n}", String(after.exp - before.exp)),
        ...(healed > 0 ? [t("fxGainHp").replace("{n}", String(healed))] : []),
      ].join(" · ");
      setGain({ id, kind, text, tone: "text-jade" });
    } else if (kind === "rest" && after.hp > before.hp) {
      setGain({
        id,
        kind,
        text: t("fxGainHp").replace("{n}", String(after.hp - before.hp)),
        tone: "text-azure",
      });
    }
  };
  const fxFor = (kind: ActionFxKind) => (
    <>
      {fx?.kind === kind && <ActionFx key={`fx-${fx.id}`} kind={kind} onDone={clearFx} />}
      {gain?.kind === kind && (
        <GainFloat key={`gain-${gain.id}`} text={gain.text} tone={gain.tone} onDone={() => setGain(null)} />
      )}
    </>
  );
  const breakTitle = !expReady
    ? t("breakNeedExp").replace("{n}", String(expNeed))
    : needsZhenxian && !hasZhenxian
      ? t("breakNeedZhenxian")
      : energy < ENERGY_COST.breakthrough
        ? energyTip(ENERGY_COST.breakthrough)
        : t("breakChancePct").replace("{n}", String(Math.round(chance * 100)));
  const costLine = "text-[10px] text-faded/80 font-mono leading-tight";
  return (
    <div className={`panel deco-frame !py-3 ${canBreak ? "border-gold/70" : ""}`}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 mb-2">
        <p className="panel-title mb-0">{t("cultivateTitle")}</p>
        <p className="text-xs text-faded font-mono">
          {t(s.realmIdx < NOVICE_GUARD_REALMS ? "cultivationSummaryNovice" : "cultivationSummaryLine")
            .replace("{exp}", String(s.exp))
            .replace("{need}", String(expNeed))
            .replace("{chance}", String(Math.round(chance * 100)))}
        </p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-faded/15 border border-faded/20 rounded-sm">
        <div className="fx-cell bg-coal/90 px-2 py-2 flex flex-col items-center gap-1 text-center">
          <button
            className="btn w-full py-1.5"
            disabled={busy || traveling || inCombat || inDwelling || energy < ENERGY_COST.cultivate}
            onClick={() => run("cultivate", "cultivate")}
            title={inDwelling ? t("inDwellingTip") : (energyTip(ENERGY_COST.cultivate) ?? t("cultivateHealTip"))}
          >
            {t("btnCultivate")}
          </button>
          <span className={costLine}>
            -{cost} {t("lifeCostSuffix")} · -{ENERGY_COST.cultivate} {t("energyCostSuffix")} · {t("cultivateHealNote")}
          </span>
          {fxFor("cultivate")}
        </div>
        <div className="fx-cell bg-coal/90 px-2 py-2 flex flex-col items-center gap-1 text-center">
          <button
            className={`btn w-full py-1.5 ${exploreOpen ? "border-gold text-gold bg-gold/10" : ""}`}
            onClick={onToggleExplore}
            aria-expanded={exploreOpen}
          >
            {t("exploreTitle")} {exploreOpen ? "▴" : "▾"}
          </button>
          <span className={costLine}>{exploreOpen ? t("exploreCollapse") : t("exploreExpand")}</span>
        </div>
        <div className="fx-cell bg-coal/90 px-2 py-2 flex flex-col items-center gap-1 text-center">
          <button
            className="btn w-full py-1.5 border-fuchsia-400/50 text-fuchsia-300 hover:bg-fuchsia-400/15 hover:border-fuchsia-400"
            disabled={
              busy || traveling || inCombat || inDwelling || s.stones < 100000000 || energy < ENERGY_COST.wander
            }
            onClick={() => run("wander", "wander")}
            title={
              inDwelling
                ? t("inDwellingTip")
                : (energyTip(ENERGY_COST.wander) ?? t("wanderTooltip"))
            }
          >
            {t("btnWander")}
          </button>
          <span className={costLine}>
            -5000 {t("lifeCostSuffix")} · {formatStones(100000000)} · -{ENERGY_COST.wander}{" "}
            {t("energyCostSuffix")}
          </span>
          {fxFor("wander")}
        </div>
        <div className="fx-cell bg-coal/90 px-2 py-2 flex flex-col items-center gap-1 text-center">
          <button
            className={`btn w-full py-1.5 ${canBreak && !inDwelling ? "btn-primary" : ""}`}
            disabled={
              busy || traveling || inCombat || inDwelling || !canBreak || energy < ENERGY_COST.breakthrough
            }
            onClick={() => run("break", "breakthrough")}
            title={inDwelling ? t("inDwellingTip") : breakTitle}
          >
            {t("btnBreakthrough")}
            {canBreak && !inDwelling ? ` (${Math.round(chance * 100)}%)` : ""}
          </button>
          <span className={costLine}>
            -{ENERGY_COST.breakthrough} {t("energyCostSuffix")}
          </span>
          {fxFor("break")}
        </div>
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
  // 4.2 版:大陸遊歷地圖預設收起,由修煉欄的「大陸遊歷」按鈕展開,讓道籍/符陣/見聞錄一進來就在同一個畫面內
  const [exploreOpen, setExploreOpen] = useState(false);
  // 新手(尚未斬殺任何妖獸)進入遊戲時地圖預設展開,直接看到下一步
  const exploreAutoOpened = useRef(false);
  useEffect(() => {
    if (exploreAutoOpened.current || !save?.started) return;
    exploreAutoOpened.current = true;
    if (Object.keys(save.kills ?? {}).length === 0) setExploreOpen(true);
  }, [save]);
  // 4.1 版:境界提升(突破 / 飛昇 / 丹藥連越數境皆適用)就播放「天降鴻運」慶典,播完才顯示結果彈窗
  const [celebration, setCelebration] = useState<{
    id: number;
    realmName: string;
    major: boolean;
    xian: boolean;
  } | null>(null);
  const prevRealmRef = useRef<number | null>(null);
  const realmIdx = save?.started && !save.dead ? save.realmIdx : null;
  useEffect(() => {
    const prev = prevRealmRef.current;
    prevRealmRef.current = realmIdx;
    if (prev == null || realmIdx == null || realmIdx <= prev) return;
    const from = REALMS[prev];
    const to = REALMS[realmIdx];
    if (!to) return;
    setCelebration({
      id: Date.now(),
      realmName: realmDisplayName(to, language),
      major: !from || to.stage > from.stage,
      xian: to.stage >= 10,
    });
  }, [realmIdx, language]);
  // 慶典結束:成功的突破/飛昇結果文字已在慶典中呈現,一併關掉同內容的彈窗,不必再按一次「知曉」
  const endCelebration = useCallback(() => {
    setCelebration(null);
    const st = useGame.getState();
    if (st.breakResult?.success) st.closeBreak();
    if (st.loot?.success && st.loot.title === "白 日 飛 昇") st.closeLoot();
  }, []);
  const celebrationLines = breakResult?.success
    ? breakResult.lines
    : loot?.success && loot.title === "白 日 飛 昇"
      ? loot.lines
      : [];
  // 突破失敗:先播一段靈氣暴走的失敗演出,再顯示明細彈窗
  const [failShownFor, setFailShownFor] = useState<Modal | null>(null);
  const failNeedsFx = !!breakResult && breakResult.success === false && failShownFor !== breakResult;
  const endFailFx = useCallback(() => setFailShownFor(useGame.getState().breakResult), []);
  // 斬妖戰利品:帶有 rewards 的戰利品彈窗先播一段噴發動畫,再顯示文字明細
  const [burstShownFor, setBurstShownFor] = useState<Modal | null>(null);
  const lootNeedsBurst = !!loot?.rewards && burstShownFor !== loot;
  const endLootBurst = useCallback(() => setBurstShownFor(useGame.getState().loot), []);

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

  if (mainView === "sect" && !save.combat) return <SectPage />;

  const isXian = REALMS[save.realmIdx]?.stage >= 10;

  return (
    <main
      className={`${save.combat ? "combat-screen" : "max-w-[1600px] mx-auto px-4 lg:px-8 pb-8 relative"} ${isXian ? "xian-aura" : ""}`}
    >
      {celebration && (
        <BreakthroughCelebration
          key={celebration.id}
          realmName={celebration.realmName}
          major={celebration.major}
          xian={celebration.xian}
          lines={celebrationLines}
          onDone={endCelebration}
        />
      )}
      {!celebration && purchaseResult && (
        <ResultModal modal={purchaseResult} onClose={closePurchaseResult} />
      )}
      {!celebration && !purchaseResult && breakResult && failNeedsFx && <BreakFailFx onDone={endFailFx} />}
      {!celebration && !purchaseResult && breakResult && !failNeedsFx && (
        <ResultModal modal={breakResult} onClose={closeBreak} />
      )}
      {!celebration && !purchaseResult && !breakResult && loot && lootNeedsBurst && (
        <LootBurst
          rewards={loot.rewards!}
          lord={loot.title.includes("地 域 王") || loot.title.includes("菁 英")}
          title={loot.title.includes("菁 英") ? loot.title : undefined}
          lang={language}
          onDone={endLootBurst}
        />
      )}
      {!celebration && !purchaseResult && !breakResult && loot && !lootNeedsBurst && (
        <ResultModal modal={loot} onClose={closeLoot} />
      )}
      {showChangelog && <ChangelogModal onClose={() => setShowChangelog(false)} />}
      {showGuide && <GuideModal onClose={() => setShowGuide(false)} />}
      {save.combat ? (
        <CombatPanel />
      ) : (
        <>
          {/* 5.0 版:遊戲 HUD 頁首——標題、目前境界與修為進度、選單,捲動時固定在頂端 */}
          <header className="hud">
            <div className="hud-brand">
              <h1>{t("appTitle")}</h1>
              <p>{t("worldEraNow").replace("{era}", eraLabelText(currentEraYears()))}</p>
            </div>
            <div className="hud-realm">
              <span className={`hud-realm-name ${isXian ? "text-fuchsia-300" : ""}`}>
                {realmDisplayName(REALMS[save.realmIdx], language)}
              </span>
              <span className="hud-exp" aria-hidden="true">
                <span style={{ width: `${Math.min(100, (save.exp / REALMS[save.realmIdx].expNeed) * 100)}%` }} />
              </span>
              <span className="hud-exp-num">
                {save.exp}/{REALMS[save.realmIdx].expNeed}
              </span>
            </div>
            <nav className="hud-nav">
              <button onClick={() => setLanguage(language === "zh" ? "en" : "zh")} title={t("langToggleTooltip")}>
                {t("langToggle")}
              </button>
              <button onClick={() => setShowGuide(true)}>{t("navGuide")}</button>
              <button onClick={() => setShowChangelog(true)}>{t("navChangelog")}</button>
              <button
                onClick={async () => {
                  await fetch("/api/auth/logout", { method: "POST" });
                  location.reload();
                }}
              >
                {t("navLogout")}
              </button>
            </nav>
          </header>

          <div className="mb-4">
            <CultivationBar exploreOpen={exploreOpen} onToggleExplore={() => setExploreOpen((v) => !v)} />
          </div>
          {exploreOpen && (
            <div className="mb-4">
              <ExploreStrip />
            </div>
          )}

          {/* 4.2 版:道籍 / 戰況+行動頁籤 / 見聞錄三欄等高——列高由左欄(道籍)決定,中、右兩欄以絕對定位
              填滿同一高度,內容超出時各自在面板內捲動,不會把整列撐高 */}
          <div className="game-columns grid gap-4 md:grid-cols-[300px_minmax(0,1fr)] lg:grid-cols-[300px_minmax(0,1fr)_340px] 2xl:grid-cols-[340px_minmax(0,1fr)_400px]">
            <div className="game-col-left flex flex-col gap-4 md:min-h-[38rem]">
              <StatusPanel />
              <RealmProgressPanel />
            </div>
            <div className="game-col-mid relative md:col-start-2 min-w-0 h-[44rem] md:h-auto">
              <div className="flex flex-col gap-4 h-full md:absolute md:inset-0">
                <div className="shrink-0">
                  <CombatPanel />
                </div>
                <div className="flex-1 min-h-0">
                  <ActionTabs />
                </div>
              </div>
            </div>
            <div className="game-col-right relative md:col-start-2 lg:col-start-3 h-[22rem] lg:h-auto">
              <div className="h-full lg:absolute lg:inset-0">
                <LogChatPanel />
              </div>
            </div>
          </div>
        </>
      )}
    </main>
  );
}
