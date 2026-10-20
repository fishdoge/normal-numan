import { defineConfig } from "vitest/config";

// 遊戲引擎的單元/整合測試設定。只測 src/game 底下的純規則邏輯(見 src/game/__tests__),
// 不涉及 React 元件或資料庫——那些需要瀏覽器/連線環境,不適合塞進這套快速回歸測試。
export default defineConfig({
  test: {
    environment: "node",
    include: ["src/game/__tests__/**/*.test.ts"],
    pool: "forks", // 每個測試檔案各自的 process:全域 Math.random 覆寫(見 testUtils.ts)不會互相污染
  },
});
