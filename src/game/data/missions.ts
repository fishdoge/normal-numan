export interface MissionDef {
  id: string;
  name: string;
  desc: string;
  kind: "kill" | "gather";
  targetId: string; // monster id 或 item id
  n: number;
  reqStage: number;
  stones: number;
  exp: number;
  item?: string; // 額外獎勵物品
}

// 團隊任務(LDZ 執事發布)
export const MISSIONS: MissionDef[] = [
  { id: "ms_shulang", name: "清剿 FOMO 散戶", kind: "kill", targetId: "shulang", n: 3, reqStage: 1, stones: 19, exp: 22, desc: "新手村的 FOMO 散戶亂追高擾亂盤面,清算三名。" },
  { id: "ms_caoyao", name: "採辦交易零件", kind: "gather", targetId: "huanglongcao", n: 5, reqStage: 1, stones: 30, exp: 15, desc: "團隊組裝機台需入門能量飲原料五份。", item: "huanglongdan" },
  { id: "ms_qinglang", name: "獵殺跟單狼群", kind: "kill", targetId: "qinglang", n: 3, reqStage: 1, stones: 45, exp: 60, desc: "無腦跟單狼群襲擾行情,獵殺三頭以儆效尤。" },
  { id: "ms_tiekuang", name: "零件徵集", kind: "gather", targetId: "tiekuang", n: 6, reqStage: 1, stones: 52, exp: 30, desc: "組裝堂徵集基礎晶片六塊,以充機料。", item: "hushenfu" },
  { id: "ms_hanjing", name: "冷錢包取鑰", kind: "gather", targetId: "hanjing", n: 3, reqStage: 2, stones: 39, exp: 31, desc: "操盤手閉關需冷儲晶片三塊,盤深對手兇,量力而行。" },
  { id: "ms_huomang", name: "誅殺插針莊家", kind: "kill", targetId: "huomang", n: 2, reqStage: 2, stones: 52, exp: 68, desc: "插針莊家屢傷同門,誅殺兩名,爆料自留。", item: "huiyuandan" },
  { id: "ms_leizhu", name: "稀有晶片難求", kind: "gather", targetId: "jinleizhu", n: 2, reqStage: 3, stones: 60, exp: 71, desc: "團隊懸賞頂級運算晶片兩片,此物組裝聖品。" },
  { id: "ms_xuejiao", name: "斬殺詐盤巨鱷", kind: "kill", targetId: "xuejiao", n: 1, reqStage: 3, stones: 95, exp: 120, desc: "詐盤巨鱷興風作浪割韭菜,斬之,團隊重賞。", item: "zhujidan" },
];
