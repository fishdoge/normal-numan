import { Sect } from "../types";

// 越國七大修仙門派(取其五,依五行配置)
export const SECTS: Sect[] = [
  {
    id: "huangfeng",
    name: "黃楓谷",
    element: "木",
    desc: "越國七派之一,韓立所屬。擅長丹藥、木系法術,底蘊深厚,弟子修煉穩紮穩打。",
    startTech: "mujian",
    bonus: { exp: 15 },
  },
  {
    id: "yanyue",
    name: "掩月宗",
    element: "水",
    desc: "以水月神功聞名,門中多女修,水系法術陰柔綿長,法力雄厚。",
    startTech: "shuijian",
    bonus: { mp: 40 },
  },
  {
    id: "julian",
    name: "巨劍門",
    element: "金",
    desc: "劍修門派,以巨劍術破萬法,攻擊凌厲,金系法器加成極高。",
    startTech: "jinren",
    bonus: { atk: 8 },
  },
  {
    id: "huadao",
    name: "化刀塢",
    element: "火",
    desc: "刀修聚集之地,刀罡如火,近戰兇悍,體魄強橫。",
    startTech: "huoqiu",
    bonus: { hp: 60 },
  },
  {
    id: "tianque",
    name: "天闕堡",
    element: "土",
    desc: "堡壘型門派,土系防禦法術冠絕越國,弟子皮糙肉厚,擅打持久戰。",
    startTech: "tudun",
    bonus: { hp: 30, mp: 20 },
  },
];
