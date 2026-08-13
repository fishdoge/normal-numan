// Polar 付款設定(向仙班祈禱 · 六道輪迴盤付費復活 + 黑市消耗型命器/玄命果購買)
// 伺服器端專用:引入 Polar SDK 並持有 POLAR_KEY(存取權杖),切勿被前端元件("use client")引入。
// POLAR_KEY、POLAR_WEBHOOK_SECRET 一律只從環境變數讀取,見 .env。
import { Polar } from "@polar-sh/sdk";
import { BLACK_MARKET_CATALOG } from "@/game/data/blackMarket";

export const POLAR_PRODUCT_ID = process.env.POLAR_PRODUCT_ID ?? "";

export const polar = new Polar({
  accessToken: process.env.POLAR_KEY,
  server: process.env.POLAR_SERVER === "sandbox" ? "sandbox" : "production",
});

export interface BlackMarketItem {
  itemId: string; // 對應 items.ts 的道具 id
  productId: string; // Polar Product ID
  priceUsd: number;
}

// 各商品 Polar Product ID 非機密,直接寫死於此(皆以 POLAR_KEY 透過 API 建立,詳見對應 version/*.md)
const BLACK_MARKET_PRODUCT_IDS: Record<string, string> = {
  diminfu: "fac374a0-cf92-4cb6-b31b-bf9162c1ccfa",
  tianyunfu: "8bcff9de-e98b-4747-9635-6c8c8d165222",
  tianjifu: "7a7d3b6c-7e09-4945-a7f2-42183261d0e4",
  panlongtaoshu: "42e7f9ee-4b05-4521-9453-e3ed9c50d829",
};

export const BLACK_MARKET_ITEMS: BlackMarketItem[] = BLACK_MARKET_CATALOG.map((e) => ({
  ...e,
  productId: BLACK_MARKET_PRODUCT_IDS[e.itemId],
}));

export const blackMarketItemOf = (itemId: string) =>
  BLACK_MARKET_ITEMS.find((i) => i.itemId === itemId);
