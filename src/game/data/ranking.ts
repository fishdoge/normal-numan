// 修仙排行榜 NPC(取材原著人物)
// realmIdx 對應 REALMS 索引:每大境界 3 小階,煉氣0-2 築基3-5 結丹6-8 元嬰9-11
// 化神12-14 煉虛15-17 合體18-20 大乘21-23 渡劫24 真仙25
export interface RankNpc {
  name: string;
  title: string;
  realmIdx: number;
}

export const RANK_NPCS: RankNpc[] = [
  { name: "韓立", title: "掌天瓶主·人界第一人", realmIdx: 24 },
  { name: "玄骨老怪", title: "大晉魔道巨擘", realmIdx: 21 },
  { name: "銀月", title: "天狐一族·嵐仙傳承", realmIdx: 18 },
  { name: "南宮婉", title: "掩月宗聖女", realmIdx: 15 },
  { name: "紫靈仙子", title: "亂星海散修雙驕之一", realmIdx: 12 },
  { name: "董萱兒", title: "天南第一美修", realmIdx: 10 },
  { name: "陳巧倩", title: "星宮傳人", realmIdx: 9 },
  { name: "墨大夫", title: "七玄門供奉", realmIdx: 6 },
  { name: "厲飛雨", title: "七玄門天才", realmIdx: 4 },
  { name: "張鐵", title: "神手谷藥童", realmIdx: 1 },
];
