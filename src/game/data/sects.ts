import { Sect } from "../types";

// LDZ 交易風雲傳 — 四大交易團隊(沿用五行作為「交易屬性」相剋)
export const SECTS: Sect[] = [
  {
    id: "ldz",
    name: "LDZ",
    element: "金",
    desc: "阿兜領軍的頂級交易團隊,主打趨勢與指標實戰,報單績效冠絕社群。攻擊凌厲,出手即斬倉。",
    startTech: "jinren",
    bonus: { atk: 8 },
  },
  {
    id: "bishengke",
    name: "幣勝客",
    element: "火",
    desc: "高槓桿、高風險的爆倉流猛將集散地,順勢重倉,一波帶走。體魄(倉位)強橫。",
    startTech: "huoqiu",
    bonus: { hp: 60 },
  },
  {
    id: "onepct",
    name: "1%交易者聯盟",
    element: "水",
    desc: "只做金字塔頂端 1% 的穩健派,資金控管綿密,精力(交易能量)雄厚,擅長打持久盤。",
    startTech: "shuijian",
    bonus: { mp: 40 },
  },
  {
    id: "biai",
    name: "幣癌",
    element: "木",
    desc: "全天候高頻套利的狂熱團隊,鏈上鏈下不眠不休,進修效率冠絕全場。",
    startTech: "mujian",
    bonus: { exp: 15 },
  },
];
