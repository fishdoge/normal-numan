"use client";

import { useCallback } from "react";
import { useGame } from "@/game/store";
import { DICT, DictKey } from "./dict";

// t("key") 依目前語言(zh/en)回傳對應字串;見 src/i18n/dict.ts 的收錄範圍說明
// 用 useCallback 固定函式參考(僅隨 language 改變才變動),避免元件每次 render 都拿到新的
// t 函式參考——曾導致 Game.tsx 的 loadSave(useCallback 依賴 t)跟著每次 render 換一個新參考,
// 使 useEffect(() => loadSave(), [loadSave]) 每個 render 都重新觸發,形成每秒狂打 /api/save 的無限迴圈。
export function useT() {
  const language = useGame((x) => x.language);
  return useCallback((key: DictKey): string => DICT[language][key], [language]);
}
