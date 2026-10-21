import type { Element } from "../types";

// ═══ 滕符陣(4.2 版新增)═══
// 仿 Path of Exile / 暗黑破壞神的背包格:6 寬 × 5 高(共 30 格)的符陣,滕符依形狀佔用格子,安裝後效果常駐。
// 形狀以「高 × 寬」表示(1×5 = 一列橫跨五格、4×1 = 直立四格)。
// 數值不直接寫死,而是「每格基準值 × 佔用格數 × 權重」:大型滕符佔得多、加得也多,
// 整體強度只要調 PER_CELL 一處即可。攻擊/氣血/法力/防禦都用百分比,跨境界依然有感。
export const TENGFU_ROWS = 5;
export const TENGFU_COLS = 6;

export type TengfuStat = "atk" | "def" | "hp" | "mp" | "energy" | "allEl" | Element;

export interface TengfuDef {
  id: string;
  name: string;
  h: number;
  w: number;
  tier: 1 | 2 | 3 | 4 | 5 | 6;
  stats: Partial<Record<TengfuStat, number>>; // 權重,實際數值見 tengfuStatValues()
  desc: string;
}

// 每格基準值,依品階(1 = 天南 … 6 = 仙域)遞增
// atk/hp/mp/元素:百分比;def:以境界攻擊力的百分比換算成護體值;energy:精力上限(點)
export const PER_CELL: Record<TengfuStat, number[]> = {
  atk: [0, 0.006, 0.009, 0.012, 0.016, 0.022, 0.03],
  hp: [0, 0.012, 0.018, 0.024, 0.032, 0.044, 0.06],
  mp: [0, 0.012, 0.018, 0.024, 0.032, 0.044, 0.06],
  def: [0, 0.004, 0.006, 0.008, 0.01, 0.013, 0.016],
  energy: [0, 3, 4, 5, 6, 8, 10],
  allEl: [0, 0.008, 0.012, 0.016, 0.022, 0.03, 0.04],
  金: [0, 0.012, 0.018, 0.024, 0.032, 0.044, 0.06],
  木: [0, 0.012, 0.018, 0.024, 0.032, 0.044, 0.06],
  水: [0, 0.012, 0.018, 0.024, 0.032, 0.044, 0.06],
  火: [0, 0.012, 0.018, 0.024, 0.032, 0.044, 0.06],
  土: [0, 0.012, 0.018, 0.024, 0.032, 0.044, 0.06],
  無: [0, 0, 0, 0, 0, 0, 0],
};

export const TENGFU: TengfuDef[] = [
  // ── 一品 · 天南 ──
  { id: "tf_qingmu", name: "青木符", h: 1, w: 1, tier: 1, stats: { 木: 1 }, desc: "以青木汁液繪成的入門滕符,木行之力微微流轉。" },
  { id: "tf_ruijin", name: "銳金符", h: 1, w: 1, tier: 1, stats: { 金: 1 }, desc: "符紋如刃,金行鋒芒內斂其中。" },
  { id: "tf_hanshui", name: "寒水符", h: 1, w: 1, tier: 1, stats: { 水: 1 }, desc: "寒潭水氣凝於符上,觸手生涼。" },
  { id: "tf_huodan", name: "火彈符紋", h: 1, w: 1, tier: 1, stats: { 火: 1 }, desc: "炎火谷修士常用的火行符紋,隱有灼熱。" },
  { id: "tf_juqi", name: "聚氣符", h: 1, w: 1, tier: 1, stats: { mp: 1 }, desc: "引天地靈氣入丹田,法力略增。" },
  { id: "tf_huanyang", name: "小還陽符", h: 2, w: 1, tier: 1, stats: { hp: 1 }, desc: "黃楓谷弟子人手一張的護命符,可固本培元。" },
  { id: "tf_jingang", name: "金剛符", h: 2, w: 1, tier: 1, stats: { def: 1 }, desc: "佛門外傳的護體符,一層淡金光膜覆身。" },
  { id: "tf_qingshen", name: "輕身符", h: 2, w: 1, tier: 1, stats: { energy: 1 }, desc: "身輕如燕,奔走終日不覺疲累。" },
  { id: "tf_leizhu", name: "雷竹符", h: 2, w: 2, tier: 1, stats: { atk: 0.6, 金: 0.5 }, desc: "以雷鳴竹林的金雷竹削片製成,攻勢凌厲。" },
  // ── 二品 · 血色禁地 ──
  { id: "tf_xuesha", name: "血煞符", h: 2, w: 2, tier: 2, stats: { atk: 1 }, desc: "沾染禁地血氣的兇符,殺意自生。" },
  { id: "tf_houtu", name: "厚土符", h: 2, w: 1, tier: 2, stats: { 土: 1 }, desc: "禁地古洞的土靈之精所化。" },
  { id: "tf_kugu", name: "枯骨鎮魂符", h: 3, w: 2, tier: 2, stats: { hp: 0.6, def: 0.5 }, desc: "以歷代闖禁者遺骨鎮壓怨魂,反成護身之寶。" },
  { id: "tf_canfu", name: "禁地殘符", h: 1, w: 1, tier: 2, stats: { allEl: 1 }, desc: "上古修士遺落的殘缺符紙,五行皆有一絲感應。" },
  // ── 三品 · 亂星海 ──
  { id: "tf_xingchen", name: "星辰符", h: 2, w: 2, tier: 3, stats: { mp: 0.6, atk: 0.5 }, desc: "星宮外門所傳,引星力入體。" },
  { id: "tf_chaoxi", name: "潮汐符", h: 4, w: 1, tier: 3, stats: { 水: 1 }, desc: "隨潮起潮落而明滅的長條水符。" },
  { id: "tf_zhenhai", name: "星宮鎮海符", h: 2, w: 3, tier: 3, stats: { def: 0.6, hp: 0.5 }, desc: "星宮用以鎮壓海眼的大符,厚重如山。" },
  { id: "tf_xunhai", name: "巡海符", h: 2, w: 1, tier: 3, stats: { energy: 1 }, desc: "外海巡守修士隨身之物,千里奔波不倦。" },
  { id: "tf_luoxing", name: "落星符", h: 1, w: 5, tier: 3, stats: { atk: 1 }, desc: "符長五格,一道星光橫貫其上,出手如流星墜地。" },
  { id: "tf_dimai", name: "地脈符", h: 4, w: 1, tier: 3, stats: { 土: 1 }, desc: "沉入海底礁岩的地脈之氣,凝成直立長符。" },
  // ── 四品 · 大晉皇朝 ──
  { id: "tf_foguang", name: "佛光護體符", h: 2, w: 2, tier: 4, stats: { def: 1 }, desc: "大晉佛宗高僧親手加持,佛光不散。" },
  { id: "tf_xuanmen", name: "道門玄符", h: 3, w: 2, tier: 4, stats: { mp: 1 }, desc: "道宗秘傳,法力綿綿若江河。" },
  { id: "tf_moyan", name: "魔焰符", h: 2, w: 1, tier: 4, stats: { 火: 0.7, atk: 0.4 }, desc: "魔淵魔修所煉,黑焰繞符而燃。" },
  { id: "tf_tianlei", name: "天雷符", h: 4, w: 1, tier: 4, stats: { 金: 1 }, desc: "引九天雷霆封入符中,金行雷力爆裂。" },
  { id: "tf_jiuyou", name: "九幽符", h: 1, w: 5, tier: 4, stats: { allEl: 1 }, desc: "陰界裂隙中拾得,五行之力於此混沌交融。" },
  { id: "tf_longwen", name: "大晉龍紋符", h: 2, w: 3, tier: 4, stats: { atk: 0.6, hp: 0.5 }, desc: "皇朝供奉的龍紋大符,攻守兼備。" },
  { id: "tf_huangsha", name: "黃沙符", h: 2, w: 1, tier: 4, stats: { 土: 1 }, desc: "魔淵邊緣黃沙所凝,土行沉厚。" },
  // ── 五品 · 靈界 ──
  { id: "tf_tianyuan", name: "天淵符", h: 1, w: 1, tier: 5, stats: { atk: 1 }, desc: "天淵城守將佩於甲內的小符,方寸之間殺機凜然。" },
  { id: "tf_feisheng", name: "飛昇符", h: 2, w: 1, tier: 5, stats: { allEl: 1 }, desc: "飛昇台上殘留的天地法則碎片。" },
  { id: "tf_fengyuan", name: "風元符", h: 2, w: 1, tier: 5, stats: { energy: 1 }, desc: "風元大陸的長風封入符中,御風而行。" },
  { id: "tf_muling", name: "木靈符", h: 2, w: 2, tier: 5, stats: { 木: 1 }, desc: "木靈森林古樹之心,生機盎然。" },
  { id: "tf_yecha", name: "夜叉戰符", h: 3, w: 2, tier: 5, stats: { atk: 1 }, desc: "夜叉族勇士出征必佩的血紋戰符。" },
  { id: "tf_feiling", name: "飛靈符", h: 4, w: 1, tier: 5, stats: { energy: 0.6, mp: 0.5 }, desc: "飛靈族羽翼紋路所化,輕盈而靈動。" },
  { id: "tf_jiaochi", name: "角蚩戰符", h: 2, w: 3, tier: 5, stats: { atk: 0.6, def: 0.5 }, desc: "角蚩族蠻勇之力封存其中,攻防俱強。" },
  { id: "tf_minghe", name: "冥河符", h: 1, w: 5, tier: 5, stats: { mp: 1 }, desc: "冥河之水靜靜流過符面,法力深不見底。" },
  { id: "tf_xueyu", name: "血獄符", h: 2, w: 2, tier: 5, stats: { hp: 1 }, desc: "地血族以精血煉成,氣血奔湧如潮。" },
  { id: "tf_jiulong", name: "九龍符", h: 3, w: 2, tier: 5, stats: { allEl: 0.6, atk: 0.5 }, desc: "九龍獄中九條龍魂環繞,五行皆受其威。" },
  { id: "tf_tianding", name: "天鼎符", h: 2, w: 3, tier: 5, stats: { hp: 0.6, mp: 0.5 }, desc: "天鼎宮古鼎拓印而成,鼎納百川。" },
  // ── 六品 · 仙域 ──
  { id: "tf_xuanbing", name: "玄冰仙符", h: 2, w: 2, tier: 6, stats: { 水: 0.7, def: 0.4 }, desc: "萬載玄冰封凍的仙符,寒氣徹骨。" },
  { id: "tf_beihan", name: "北寒仙尊符", h: 3, w: 2, tier: 6, stats: { hp: 1 }, desc: "北寒仙尊遺留的護命仙符,生生不息。" },
  { id: "tf_jinyuan", name: "金源仙符", h: 4, w: 1, tier: 6, stats: { 金: 1 }, desc: "金源之氣沖霄而成的直立仙符。" },
  { id: "tf_wuchong", name: "五重仙關符", h: 1, w: 5, tier: 6, stats: { atk: 1 }, desc: "闖過五重仙關者方得一見,一符橫貫,勢不可擋。" },
  { id: "tf_jindi", name: "金源帝符", h: 2, w: 3, tier: 6, stats: { atk: 0.6, allEl: 0.5 }, desc: "金源仙帝親手所書,帝威浩蕩。" },
  { id: "tf_tianhu", name: "天狐符", h: 2, w: 1, tier: 6, stats: { 火: 0.7, energy: 0.4 }, desc: "天狐領地的狐火封於符中,靈動狡黠。" },
  { id: "tf_zhenlong", name: "真龍符", h: 3, w: 2, tier: 6, stats: { atk: 0.6, hp: 0.5 }, desc: "真龍一片逆鱗化成的仙符,威壓蠻荒。" },
  { id: "tf_baxia", name: "霸下符", h: 2, w: 3, tier: 6, stats: { def: 0.6, hp: 0.5 }, desc: "霸下負碑之力,堅不可摧。" },
  { id: "tf_pixiu", name: "貔貅符", h: 2, w: 2, tier: 6, stats: { energy: 0.6, mp: 0.5 }, desc: "黑眼貔貅吞納萬物的靈性所凝。" },
  { id: "tf_hundun", name: "混沌五行符", h: 1, w: 1, tier: 6, stats: { allEl: 1 }, desc: "五色異星盤共鳴時偶然凝出的一點混沌,方寸之中五行俱全。" },
];

export const tengfuById = (id: string) => TENGFU.find((t) => t.id === id);

// 各秘境可掉落的滕符(擊殺該秘境妖獸後判定;地域王機率更高)
export const TENGFU_DROPS: Record<string, string[]> = {
  caiyaoshan: ["tf_qingmu", "tf_juqi", "tf_huanyang"],
  heifengling: ["tf_jingang", "tf_qingshen"],
  hantan: ["tf_hanshui", "tf_huanyang"],
  yanhuogu: ["tf_huodan", "tf_jingang"],
  leizhulin: ["tf_ruijin", "tf_leizhu"],
  xuesehe: ["tf_xuesha", "tf_canfu"],
  jinshoushan: ["tf_houtu", "tf_kugu"],
  waihaidao: ["tf_chaoxi", "tf_xunhai", "tf_dimai"],
  xinggong: ["tf_xingchen", "tf_zhenhai", "tf_luoxing"],
  moyuan: ["tf_moyan", "tf_foguang", "tf_huangsha"],
  yinjieliexi: ["tf_jiuyou", "tf_tianlei", "tf_xuanmen", "tf_longwen"],
  tianyuancheng: ["tf_tianyuan"],
  feishengtai: ["tf_feisheng"],
  yeyangcheng: ["tf_yecha"],
  mulingsenlin: ["tf_muling", "tf_fengyuan"],
  tianxiaocheng: ["tf_feiling"],
  jiaomanyu: ["tf_jiaochi"],
  minghezhidi: ["tf_minghe"],
  dixue_xueyu: ["tf_xueyu"],
  jiulongyu: ["tf_jiulong"],
  tiandinggong: ["tf_tianding"],
  xuanbing_yuan: ["tf_xuanbing"],
  beihan_dian: ["tf_beihan"],
  jy_guan1: ["tf_jinyuan"],
  jy_guan2: ["tf_jinyuan"],
  jy_guan3: ["tf_wuchong"],
  jy_guan4: ["tf_wuchong"],
  jy_guan5: ["tf_jindi"],
  manhuang_tianhu: ["tf_tianhu", "tf_hundun"],
  manhuang_zhenlong: ["tf_zhenlong", "tf_hundun"],
  manhuang_baxia: ["tf_baxia", "tf_hundun"],
  manhuang_pixiu: ["tf_pixiu", "tf_hundun"],
};
export const TENGFU_DROP_CHANCE = 0.05; // 一般妖獸
export const TENGFU_DROP_CHANCE_LORD = 0.3; // 地域王
export const TENGFU_DROP_CHANCE_ELITE = 0.5; // 大乘期菁英(4.2 版)

export const tengfuLocationsOf = (id: string) =>
  Object.entries(TENGFU_DROPS)
    .filter(([, ids]) => ids.includes(id))
    .map(([loc]) => loc);

// 單張滕符的實際數值
export function tengfuStatValues(def: TengfuDef): Partial<Record<TengfuStat, number>> {
  const cells = def.h * def.w;
  const out: Partial<Record<TengfuStat, number>> = {};
  for (const [k, weight] of Object.entries(def.stats) as [TengfuStat, number][]) {
    const v = PER_CELL[k][def.tier] * cells * weight;
    out[k] = k === "energy" ? Math.round(v) : Math.round(v * 1000) / 1000;
  }
  return out;
}

export interface TengfuPlacement {
  id: string;
  r: number; // 左上角列(0 起算)
  c: number; // 左上角欄(0 起算)
}

// 檢查放置是否合法:不出界、不與其他滕符重疊(ignoreIndex 用於移動時略過自己)
export function canPlaceTengfu(grid: TengfuPlacement[], def: TengfuDef, r: number, c: number, ignoreIndex = -1) {
  if (r < 0 || c < 0 || r + def.h > TENGFU_ROWS || c + def.w > TENGFU_COLS) return false;
  return grid.every((p, i) => {
    if (i === ignoreIndex) return true;
    const o = tengfuById(p.id);
    if (!o) return true;
    return r + def.h <= p.r || p.r + o.h <= r || c + def.w <= p.c || p.c + o.w <= c;
  });
}

export interface TengfuBonus {
  atk: number;
  def: number;
  hp: number;
  mp: number;
  energy: number;
  allEl: number;
  el: Record<Element, number>;
}

// 匯總符陣上所有滕符的加成
export function tengfuBonusOf(grid: TengfuPlacement[] | undefined): TengfuBonus {
  const b: TengfuBonus = {
    atk: 0,
    def: 0,
    hp: 0,
    mp: 0,
    energy: 0,
    allEl: 0,
    el: { 金: 0, 木: 0, 水: 0, 火: 0, 土: 0, 無: 0 },
  };
  for (const p of grid ?? []) {
    const def = tengfuById(p.id);
    if (!def) continue;
    for (const [k, v] of Object.entries(tengfuStatValues(def)) as [TengfuStat, number][]) {
      if (k === "atk" || k === "def" || k === "hp" || k === "mp" || k === "energy" || k === "allEl") b[k] += v;
      else b.el[k] += v;
    }
  }
  return b;
}
