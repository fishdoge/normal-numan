"use client";

// 前端薄殼:所有遊戲操作 POST /api/action,由伺服器引擎運算
// 前端不再持有任何遊戲邏輯或 localStorage 存檔
import { create } from "zustand";
import type { SaveData, Modal, DamageEvent } from "./engine";
import { DICT, type Language } from "@/i18n/dict";
import {
  statsOf,
  maxLifeOf,
  learnYears,
  cultCostOf,
  techLevelOf,
  techPowerMult,
  MAX_TECH_LEVEL,
  XIANLI_MULT,
  XIANLI_MULT_CAP,
  breakChanceOf,
  SECT_STAGE_BONUS,
  SECT_MULT_CAP,
  sectDamageMultOfStages,
  energyMaxOf,
  ENERGY_COST,
  MAX_ENERGY_POTION_STACKS,
  ENERGY_REGEN_PER_TICK,
  dwellingEnergyBonusOf,
  HAND_SIZE,
  POUCH_MIN,
  POUCH_MAX_COPIES,
  effectivePouch,
  pouchMinFor,
  ownedCopiesOf,
  monsterHpOf,
  isCardSealed,
  monsterAtkOf,
  NOVICE_GUARD_REALMS,
  BASIC_CARD_MIN,
  canEnterStage,
  monsterExpOf,
} from "./engine";

export type { SaveData, Modal, DamageEvent };
export {
  statsOf,
  maxLifeOf,
  learnYears,
  cultCostOf,
  techLevelOf,
  techPowerMult,
  MAX_TECH_LEVEL,
  XIANLI_MULT,
  XIANLI_MULT_CAP,
  breakChanceOf,
  SECT_STAGE_BONUS,
  SECT_MULT_CAP,
  sectDamageMultOfStages,
  energyMaxOf,
  ENERGY_COST,
  MAX_ENERGY_POTION_STACKS,
  ENERGY_REGEN_PER_TICK,
  dwellingEnergyBonusOf,
  HAND_SIZE,
  POUCH_MIN,
  POUCH_MAX_COPIES,
  effectivePouch,
  pouchMinFor,
  monsterHpOf,
  isCardSealed,
  monsterAtkOf,
  NOVICE_GUARD_REALMS,
  BASIC_CARD_MIN,
  canEnterStage,
  monsterExpOf,
  ownedCopiesOf,
};

// 行動頁籤(ActionTabs)目前分頁,提到 store 讓其他面板(如道籍)也能切換頁籤
export type Tab =
  | "tengfu"
  | "bag"
  | "tech"
  | "craft"
  | "market"
  | "trade"
  | "dex"
  | "wanling"
  | "rank";

// 主畫面切換:遊戲主頁 / 宗門獨立頁面(1.8 版新增,宗門改為全螢幕切換,不再是行動頁籤之一)
export type MainView = "game" | "sect" | "tongtian";

// 秒殺收尾延遲(見 act() 內註解):讓致命一擊的浮動傷害數字/打擊特效有時間播出,才套用戰鬥結束的
// 存檔與戰利品彈窗。刻意抓短一點——夠讓玩家看清這一下傷害就好,不需要等滿整段數字動畫。
const LETHAL_TRANSITION_DELAY_MS = 700;

// 純前端顯示偏好,存於 localStorage,不經過伺服器(伺服器端存檔內容不分語言)
const LANG_KEY = "lang";
const getInitialLanguage = (): Language => {
  if (typeof window === "undefined") return "zh";
  return localStorage.getItem(LANG_KEY) === "en" ? "en" : "zh";
};

interface ClientState {
  save: SaveData | null;
  loot: Modal | null; // 採集/戰利品/任務彈窗
  breakResult: Modal | null; // 突破結果彈窗
  purchaseResult: Modal | null; // 付費復活 / 黑市購買結果彈窗(Polar webhook 回報後顯示)
  busy: boolean;
  activeTab: Tab;
  mainView: MainView;
  revivalUsed: boolean; // 六道輪迴盤(付費復活)是否已終身用過一次
  language: Language; // 介面顯示語言(中文 / English),見 src/i18n
  // 戰鬥浮動傷害數字(3.5 版新增):每次 act() 回傳的 damageEvents 附上前端自產的唯一 id 後累積於此,
  // CombatPanel 依 id 渲染浮動數字動畫,動畫結束呼叫 consumeDamageEvent 移除,避免重複觸發。
  damageEvents: (DamageEvent & { id: string })[];
  // 大陸遊歷的選擇(4.2 版):放在 store,戰鬥畫面切換回來後地圖仍停在原本的區域與秘境
  explore: { region: string; continent: string; selected: string | null; autoPicked: boolean };
  setExplore: (
    patch: Partial<{ region: string; continent: string; selected: string | null; autoPicked: boolean }>,
  ) => void;

  act: (type: string, payload?: Record<string, unknown>) => Promise<void>;
  consumeDamageEvent: (id: string) => void;
  setSave: (save: SaveData | null) => void;
  closeLoot: () => void;
  closeBreak: () => void;
  closePurchaseResult: () => void;
  setPurchaseResult: (modal: Modal | null) => void;
  pushLog: (msg: string) => void;
  setActiveTab: (tab: Tab) => void;
  setMainView: (view: MainView) => void;
  setRevivalUsed: (used: boolean) => void;
  setLanguage: (lang: Language) => void;
}

export const useGame = create<ClientState>()((set, get) => ({
  save: null,
  loot: null,
  breakResult: null,
  purchaseResult: null,
  busy: false,
  activeTab: "bag",
  mainView: "game",
  revivalUsed: false,
  language: getInitialLanguage(),
  damageEvents: [],
  explore: { region: "tiannan", continent: "all", selected: null, autoPicked: false },
  setExplore: (patch) => set((st) => ({ explore: { ...st.explore, ...patch } })),

  setSave: (save) => set({ save }),
  consumeDamageEvent: (id) =>
    set((st) => ({ damageEvents: st.damageEvents.filter((e) => e.id !== id) })),
  closeLoot: () => set({ loot: null }),
  closeBreak: () => set({ breakResult: null }),
  closePurchaseResult: () => set({ purchaseResult: null }),
  setPurchaseResult: (modal) => set({ purchaseResult: modal }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  setMainView: (view) => set({ mainView: view }),
  setRevivalUsed: (used) => set({ revivalUsed: used }),
  setLanguage: (lang) => {
    if (typeof window !== "undefined") localStorage.setItem(LANG_KEY, lang);
    set({ language: lang });
  },
  pushLog: (msg) => {
    const s = get().save;
    if (!s) return;
    const log = [...s.log, msg].slice(-60);
    const combat = s.combat
      ? { ...s.combat, battleLog: [...(s.combat.battleLog ?? []), msg].slice(-60) }
      : s.combat;
    set({ save: { ...s, log, combat } });
  },

  act: async (type, payload = {}) => {
    if (get().busy) return;
    set({ busy: true });
    try {
      const prevCombat = get().save?.combat ?? null;
      const res = await fetch("/api/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, payload }),
      });
      const j = await res.json();
      const hasDamage = Array.isArray(j.damageEvents) && j.damageEvents.length > 0;
      if (hasDamage) {
        const stamped = (j.damageEvents as DamageEvent[]).map((e, i) => ({
          ...e,
          id: `${Date.now()}-${i}-${Math.random().toString(36).slice(2, 8)}`,
        }));
        set((st) => ({ damageEvents: [...st.damageEvents, ...stamped] }));
      }
      // 秒殺/一擊帶走怪物時的收尾修正:戰鬥結束當下 save.combat 立刻變成 null,CombatPanel 會馬上
      // 切回非戰鬥畫面,若跟傷害數字/戰利品彈窗同時套用,這一下傷害會完全來不及顯示,反而在「下一場
      // 戰鬥」開打時才顯示出來(殘留的舊 damageEvents)。這裡延後套用 save/loot/breakResult,讓浮動
      // 數字與打擊特效先播完一小段再切換畫面與跳出戰利品彈窗,busy 在等待期間維持 true,避免搶跑。
      const isLethalTransition = !!prevCombat && !j.save?.combat && hasDamage;
      if (isLethalTransition) {
        await new Promise((resolve) => window.setTimeout(resolve, LETHAL_TRANSITION_DELAY_MS));
      }
      // 清空殘留傷害事件:戰鬥面板(DamageFloats/HitImpact)只在 combat 存在時掛載,一旦 combat 變
      // null 就整個卸載,動畫播到一半也會被打斷、onAnimationEnd 不會觸發,事件永遠留在 damageEvents
      // 裡消不掉——下一場戰鬥面板重新掛載時,這些殘留事件會被當成「這場」的傷害重新播一次,就是
      // 玩家回報「下一場戰鬥開頭又跳出上一場的傷害」的成因。這裡在 combat 真的變成 null 的當下一併
      // 清空,不論是否經過秒殺延遲都適用(飛升遁走成功等 combat 變 null 但沒有傷害事件的情況,
      // 陣列本來就是空的,清空也不會有副作用)。
      if (j.save !== undefined) {
        set((st) => ({ save: j.save, damageEvents: j.save.combat ? st.damageEvents : [] }));
      }
      if (j.loot) set({ loot: j.loot });
      if (j.breakResult) set({ breakResult: j.breakResult });
      if (j.error && j.save) {
        // 錯誤訊息進見聞錄(戰鬥中同時進戰鬥見聞錄,見 CombatState.battleLog)
        const s = get().save;
        if (s) {
          const msg = `【${j.error}】`;
          const log = [...s.log, msg].slice(-60);
          const combat = s.combat
            ? { ...s.combat, battleLog: [...(s.combat.battleLog ?? []), msg].slice(-60) }
            : s.combat;
          set({ save: { ...s, log, combat } });
        }
      }
    } catch {
      get().pushLog(DICT[get().language].actionNetErr);
    } finally {
      set({ busy: false });
    }
  },
}));
