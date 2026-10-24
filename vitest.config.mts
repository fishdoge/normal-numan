import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

// 規則、資料轉換與 API 權限測試。資料庫相依項目使用 mock,不連線正式資料庫。
export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  test: {
    environment: "node",
    include: ["src/game/__tests__/**/*.test.ts", "src/lib/__tests__/**/*.test.ts"],
    pool: "forks", // 每個測試檔案各自的 process:全域 Math.random 覆寫(見 testUtils.ts)不會互相污染
  },
});
