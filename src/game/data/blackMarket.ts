// 黑市商品目錄(純資料,前後端共用):消耗型命器(地命符/天運符/天極符)+ 玄命果,皆以 USD 透過 Polar 購買。
// 對應的 Polar Product ID 屬於伺服器端設定,見 src/lib/payments.ts(該檔引入 Polar SDK,僅能在伺服器端使用,
// 前端元件一律從這裡取得商品清單,避免把付款用的 access token 打包進前端 bundle)。
export interface BlackMarketEntry {
  itemId: string; // 對應 items.ts 的道具 id
  priceUsd: number;
}

// 向仙班祈禱 · 六道輪迴盤付費復活價格(USD),與黑市共用此純資料檔,理由同上(避免前端引入 Polar SDK)
export const REVIVAL_PRICE_USD = 15;

export const BLACK_MARKET_CATALOG: BlackMarketEntry[] = [
  { itemId: "diminfu", priceUsd: 5 },
  { itemId: "tianyunfu", priceUsd: 10 },
  { itemId: "tianjifu", priceUsd: 20 },
  { itemId: "panlongtaoshu", priceUsd: 30 },
  { itemId: "beilidan", priceUsd: 10 },
];
