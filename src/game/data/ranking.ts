// 交易員排行榜 NPC(加密圈傳奇人物 + 迷因風格化)
// realmIdx 對應 REALMS 索引:每大境界 3 小階
export interface RankNpc {
  name: string;
  title: string;
  realmIdx: number;
}

export const RANK_NPCS: RankNpc[] = [
  { name: "中本聰", title: "創世區塊 · 從未賣出一枚 BTC", realmIdx: 24 },
  { name: "V 神", title: "以太坊教主 · 白皮書寫在課本上", realmIdx: 21 },
  { name: "CZ", title: "幣安帝國創辦人 · Funds are SAFU", realmIdx: 18 },
  { name: "阿兜", title: "LDZ 主理人 · 報單準到發指", realmIdx: 15 },
  { name: "鮑魚哥", title: "反指之王 · 他做多你就空", realmIdx: 12 },
  { name: "巨鯨老王", title: "鏈上砸盤大戶 · 一鍵歸零製造機", realmIdx: 10 },
  { name: "科學家 Neo", title: "MEV 三明治大師 · gas 燒到冒煙", realmIdx: 9 },
  { name: "鑽石手大衛", title: "-90% 照樣 HODL · 從不看盤", realmIdx: 6 },
  { name: "槓桿仔阿明", title: "125x 合約亡命徒 · 天台常客", realmIdx: 4 },
  { name: "韭菜小張", title: "剛下載交易所 App 的散戶", realmIdx: 1 },
];
