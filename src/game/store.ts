"use client";

// 前端薄殼:所有遊戲操作 POST /api/action,由伺服器引擎運算
// 前端不再持有任何遊戲邏輯或 localStorage 存檔
import { create } from "zustand";
import type { SaveData, Modal } from "./engine";
import { statsOf, maxLifeOf, learnYears, cultCostOf, techLevelOf, techPowerMult, MAX_TECH_LEVEL } from "./engine";

export type { SaveData, Modal };
export { statsOf, maxLifeOf, learnYears, cultCostOf, techLevelOf, techPowerMult, MAX_TECH_LEVEL };

interface ClientState {
  save: SaveData | null;
  loot: Modal | null; // 採集/戰利品/任務彈窗
  breakResult: Modal | null; // 突破結果彈窗
  busy: boolean;

  act: (type: string, payload?: Record<string, unknown>) => Promise<void>;
  setSave: (save: SaveData | null) => void;
  closeLoot: () => void;
  closeBreak: () => void;
  pushLog: (msg: string) => void;
}

export const useGame = create<ClientState>()((set, get) => ({
  save: null,
  loot: null,
  breakResult: null,
  busy: false,

  setSave: (save) => set({ save }),
  closeLoot: () => set({ loot: null }),
  closeBreak: () => set({ breakResult: null }),
  pushLog: (msg) => {
    const s = get().save;
    if (s) set({ save: { ...s, log: [...s.log, msg].slice(-60) } });
  },

  act: async (type, payload = {}) => {
    if (get().busy) return;
    set({ busy: true });
    try {
      const res = await fetch("/api/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, payload }),
      });
      const j = await res.json();
      if (j.save !== undefined) set({ save: j.save });
      if (j.loot) set({ loot: j.loot });
      if (j.breakResult) set({ breakResult: j.breakResult });
      if (j.error && j.save) {
        // 錯誤訊息進見聞錄
        const s = get().save;
        if (s) set({ save: { ...s, log: [...s.log, `【${j.error}】`].slice(-60) } });
      }
    } catch {
      get().pushLog("【無法連線至伺服器,請稍後再試】");
    } finally {
      set({ busy: false });
    }
  },
}));
