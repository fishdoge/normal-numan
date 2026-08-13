"use client";

import { useGame } from "@/game/store";
import { DICT, DictKey } from "./dict";

// t("key") 依目前語言(zh/en)回傳對應字串;見 src/i18n/dict.ts 的收錄範圍說明
export function useT() {
  const language = useGame((x) => x.language);
  return (key: DictKey): string => DICT[language][key];
}
