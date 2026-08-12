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

// 宗門任務(執事堂發布)
export const MISSIONS: MissionDef[] = [
  { id: "ms_shulang", name: "清剿鼠患", kind: "kill", targetId: "shulang", n: 3, reqStage: 1, stones: 19, exp: 22, desc: "彩霞山赤目鼠狼成災,啃食藥田,清剿三隻。" },
  { id: "ms_caoyao", name: "採辦藥材", kind: "gather", targetId: "huanglongcao", n: 5, reqStage: 1, stones: 30, exp: 15, desc: "丹房煉製黃龍丹,繳納黃龍草五株。", item: "huanglongdan" },
  { id: "ms_qinglang", name: "獵狼護道", kind: "kill", targetId: "qinglang", n: 3, reqStage: 1, stones: 45, exp: 60, desc: "青背狼群襲擾山道,獵殺三頭以儆效尤。" },
  { id: "ms_tiekuang", name: "礦石徵集", kind: "gather", targetId: "tiekuang", n: 6, reqStage: 1, stones: 52, exp: 30, desc: "煉器堂徵集精鐵礦六塊,以充爐料。", item: "hushenfu" },
  { id: "ms_hanjing", name: "寒潭取精", kind: "gather", targetId: "hanjing", n: 3, reqStage: 2, stones: 39, exp: 31, desc: "長老閉關需寒玉精三塊,潭深妖兇,量力而行。" },
  { id: "ms_huomang", name: "誅殺火蟒", kind: "kill", targetId: "huomang", n: 2, reqStage: 2, stones: 52, exp: 68, desc: "赤炎火蟒屢傷同門,誅殺兩條,鱗甲自留。", item: "huiyuandan" },
  { id: "ms_leizhu", name: "雷竹難求", kind: "gather", targetId: "jinleizhu", n: 2, reqStage: 3, stones: 60, exp: 71, desc: "宗門懸賞金雷竹枝兩根,此物煉劍聖品。" },
  { id: "ms_xuejiao", name: "斬蛟除害", kind: "kill", targetId: "xuejiao", n: 1, reqStage: 3, stones: 95, exp: 120, desc: "血蛟興風作浪,斬之,宗門重賞。", item: "zhujidan" },
  // ── 執事堂高階任務(1.8 版新增,合體/大乘專屬) ──
  { id: "ms_zhenlingwei", name: "掃蕩天淵", kind: "kill", targetId: "zhenlingwei", n: 3, reqStage: 7, stones: 80000, exp: 60000, desc: "天淵城外真靈衛成群為患,合體修士方可掃蕩,執事堂密傳一部秘笈為賞。", item: "m_lusheng_jianjue" },
  { id: "ms_tianjie", name: "逆天劫", kind: "kill", targetId: "tianjie", n: 1, reqStage: 8, stones: 500000, exp: 400000, desc: "飛昇台天劫雷靈威壓四方,唯大乘修士敢於逆而伐之,執事堂密傳一部秘笈為賞。", item: "m_jiutian_fenyang" },
];
