// Polar 付款設定(向仙班祈禱 · 六道輪迴盤付費復活)
// POLAR_KEY(Organization Access Token)、POLAR_PRODUCT_ID、POLAR_WEBHOOK_SECRET 一律只從環境變數讀取,見 .env。
import { Polar } from "@polar-sh/sdk";

export const REVIVAL_PRICE_USD = 15;

export const POLAR_PRODUCT_ID = process.env.POLAR_PRODUCT_ID ?? "";

export const polar = new Polar({
  accessToken: process.env.POLAR_KEY,
  server: process.env.POLAR_SERVER === "sandbox" ? "sandbox" : "production",
});
