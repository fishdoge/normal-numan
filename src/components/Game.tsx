"use client";

import { useCallback, useEffect, useState } from "react";
import { useGame, statsOf, maxLifeOf, cultCostOf, breakChanceOf, Modal } from "@/game/store";
import { REALMS } from "@/game/data/realms";
import { CHANGELOG } from "@/game/data/changelog";
import AuthGate from "./AuthGate";
import CharCreate from "./CharCreate";
import ActionTabs from "./ActionTabs";
import SectPage from "./SectPage";
import { StatusPanel, LogPanel, CombatPanel, RealmProgressPanel } from "./panels";

// 更新公告:逐版列出 version/ 目錄的重點內容(精簡為玩家視角)
function ChangelogModal({ onClose }: { onClose: () => void }) {
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
          <p className="panel-title mb-0">更 新 公 告</p>
          <button className="chip hover:text-gold" onClick={onClose}>
            關閉 ✕
          </button>
        </div>
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {CHANGELOG.map((entry) => (
            <div key={entry.version} className="border border-faded/20 rounded-sm p-3">
              <div className="flex items-baseline justify-between">
                <span className="font-bold text-gold">
                  版本 {entry.version}
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

function DeathScreen() {
  const s = useGame((x) => x.save)!;
  const act = useGame((x) => x.act);
  return (
    <main className="max-w-2xl mx-auto px-4 py-24 text-center">
      <p className="font-mono text-xs tracking-[0.5em] text-faded mb-4">HERE LIES A CULTIVATOR</p>
      <h1 className="text-5xl font-black tracking-widest text-vermillion mb-6">壽 元 已 盡</h1>
      <div className="panel deco-frame text-left mx-auto max-w-md mb-8">
        <p className="panel-title">墓 誌 銘</p>
        <p className="leading-loose text-cream">
          {s.name},享年 {maxLifeOf(s)} 年,道隕於【{REALMS[s.realmIdx].name}】。
          <br />
          修行 {s.day} 年,終究未能問鼎大道。
          <br />
          仙路盡頭誰為峰?一見無始道成空。
        </p>
      </div>
      <button className="btn text-lg px-10 py-3" onClick={() => act("reset")}>
        轉 世 重 修
      </button>
    </main>
  );
}

// 通用彈窗(突破結果 / 戰利品 / 採集所得)
function ResultModal({ modal, onClose }: { modal: Modal; onClose: () => void }) {
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
            <p key={i}>{l}</p>
          ))}
        </div>
        <button className="btn px-8 mb-2" onClick={onClose}>
          知 曉
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
  const breakTitle = !expReady
    ? `需修為 ${expNeed}`
    : needsZhenxian && !hasZhenxian
      ? "渡劫飛昇需先集得【真仙丹】(唯太古龍祖掉落)"
      : `成功率 ${Math.round(chance * 100)}%`;
  return (
    <div className={`panel deco-frame ${canBreak ? "border-gold/70" : ""}`}>
      <div className="flex flex-wrap items-center gap-3">
        <p className="panel-title mb-0 mr-2">修 煉</p>
        <button
          className="btn text-base px-5 py-2"
          disabled={busy || inCombat || inDwelling}
          onClick={() => act("cultivate")}
          title={inDwelling ? "正於宗門仙境閉關潛修,須先離開仙境方可行動" : undefined}
        >
          打坐修煉 <span className="ml-1 font-mono text-xs">-{cost} 年壽元</span>
        </button>
        <button
          className="btn text-base px-5 py-2"
          disabled={busy || inCombat || inDwelling || s.hp >= hpMax}
          onClick={() => act("rest")}
          title={inDwelling ? "正於宗門仙境閉關潛修,須先離開仙境方可行動" : undefined}
        >
          調息(回復氣血)
        </button>
        <button
          className="btn text-base px-5 py-2 border-fuchsia-400/50 text-fuchsia-300 hover:bg-fuchsia-400/15 hover:border-fuchsia-400"
          disabled={busy || inCombat || inDwelling || s.stones < 100000000}
          onClick={() => act("wander")}
          title={
            inDwelling
              ? "正於宗門仙境閉關潛修,須先離開仙境方可行動"
              : "消耗 5000 年壽元 + 100 極品靈石。約 5% 觸發探索秘境(紫色機緣),約 2.5% 直接得天仙丹,30% 得永久屬性,3% 遇金仙大 BOSS,餘則一無所獲。"
          }
        >
          雲遊四海
        </button>
        <button
          className={`btn text-base px-5 py-2 ${canBreak ? "border-gold text-gold animate-pulse" : ""}`}
          disabled={busy || inCombat || !canBreak}
          onClick={() => act("breakthrough")}
          title={breakTitle}
        >
          嘗試突破{canBreak ? ` (${Math.round(chance * 100)}%)` : ""}
        </button>
        <span className="text-xs text-faded ml-auto font-mono">
          修為 {s.exp}/{expNeed} · 突破成功率 {Math.round(chance * 100)}% · 失敗折損最大壽元 15%
        </span>
      </div>
      {needsZhenxian && !hasZhenxian && (
        <p className="text-xs text-fuchsia-300 mt-2">
          渡劫飛昇需集得【真仙丹】——唯靈界地域王「太古龍祖」掉落,無論突破成敗皆會耗盡藥力。
        </p>
      )}
      {inDwelling && (
        <p className="text-xs text-fuchsia-300 mt-2">
          你正停泊於宗門仙境中閉關潛修,無法採集靈材、獵殺妖獸、雲遊四海、打坐修煉或調息——須先於宗門頁面離開仙境方可行動。
        </p>
      )}
    </div>
  );
}

export default function Game() {
  const save = useGame((x) => x.save);
  const setSave = useGame((x) => x.setSave);
  const loot = useGame((x) => x.loot);
  const breakResult = useGame((x) => x.breakResult);
  const closeLoot = useGame((x) => x.closeLoot);
  const closeBreak = useGame((x) => x.closeBreak);
  const act = useGame((x) => x.act);
  const mainView = useGame((x) => x.mainView);
  const [auth, setAuth] = useState<"checking" | "anon" | "authed">("checking");
  const [userName, setUserName] = useState("");
  const [showChangelog, setShowChangelog] = useState(false);

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
      // 離線期間流逝的壽元(lifeGained)已由伺服器寫入 save.log,無需前端重複提示
      if (j.save && j.credited) {
        useGame.getState().pushLog("交易行貨款已入帳。");
      }
      setAuth("authed");
    } catch {
      setAuth("anon");
    }
  }, [setSave]);

  useEffect(() => {
    loadSave();
  }, [loadSave]);

  if (auth === "checking") {
    return (
      <main className="flex items-center justify-center min-h-screen">
        <p className="font-mono text-faded tracking-[0.4em] animate-pulse">道 藏 開 啟 中 …</p>
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
      {breakResult && <ResultModal modal={breakResult} onClose={closeBreak} />}
      {!breakResult && loot && <ResultModal modal={loot} onClose={closeLoot} />}
      {showChangelog && <ChangelogModal onClose={() => setShowChangelog(false)} />}
      <header className="flex items-baseline justify-between mb-5">
        <div>
          <h1
            className={`text-2xl font-black tracking-[0.35em] ${isXian ? "text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-300 via-amber-200 to-cyan-200" : ""}`}
          >
            凡人修仙傳
          </h1>
          <p className="font-mono text-[10px] tracking-[0.4em] text-faded">
            {isXian ? "ASCENDED · 得 道 成 仙" : "A MORTAL\u2019S JOURNEY TO IMMORTALITY"}
          </p>
        </div>
        <div className="flex gap-4 items-baseline">
          <button
            className="text-xs text-faded/60 hover:text-gold transition-colors"
            onClick={() => setShowChangelog(true)}
          >
            更新公告
          </button>
          <button
            className="text-xs text-faded/60 hover:text-vermillion transition-colors"
            onClick={() => {
              if (confirm("兵解重修將抹去一切進度,確定?")) act("reset");
            }}
          >
            兵解重修
          </button>
          <button
            className="text-xs text-faded/60 hover:text-gold transition-colors"
            onClick={async () => {
              await fetch("/api/auth/logout", { method: "POST" });
              location.reload();
            }}
          >
            登出
          </button>
        </div>
      </header>

      <div className="mb-4">
        <CultivationBar />
      </div>

      <div className="grid gap-4 lg:grid-cols-[300px_1fr_340px]">
        <div className="space-y-4">
          <StatusPanel />
          <RealmProgressPanel />
        </div>
        <div className="space-y-4">
          <CombatPanel />
          <ActionTabs />
        </div>
        <LogPanel />
      </div>
    </main>
  );
}
