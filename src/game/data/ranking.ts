// 交易員排行榜 NPC(加密圈傳奇人物風格化)
// realmIdx 對應 REALMS 索引:每大境界 3 小階
export interface RankNpc {
  name: string;
  title: string;
  realmIdx: number;
}

export const RANK_NPCS: RankNpc[] = [
  { name: "中本聰", title: "比特幣創世·匿名神話", realmIdx: 24 },
  { name: "V 神", title: "以太坊教主·Vitalik", realmIdx: 21 },
  { name: "CZ", title: "幣安帝國創辦人", realmIdx: 18 },
  { name: "阿兜", title: "LDZ 交易團隊主理人", realmIdx: 15 },
  { name: "鮑魚哥", title: "合約爆倉傳說·反指之王", realmIdx: 12 },
  { name: "巨鯨老王", title: "鏈上巨鯨·砸盤大戶", realmIdx: 10 },
  { name: "科學家 Neo", title: "MEV 套利大師", realmIdx: 9 },
  { name: "定投教主", title: "囤幣佈道者", realmIdx: 6 },
  { name: "槓桿仔阿明", title: "百倍合約亡命徒", realmIdx: 4 },
  { name: "韭菜小張", title: "剛入場的散戶", realmIdx: 1 },
];
