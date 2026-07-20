import { Monster, Location, Recipe, Region } from "../types";

// ═══ 大陸(遊歷地圖,取材原著):天南 → 亂星海 → 大晉 → 靈界 ═══
export const REGIONS: Region[] = [
  { id: "tiannan", name: "天南 · 越國", reqStage: 1, desc: "七派共治的修仙小國,韓立仙途的起點。" },
  { id: "jindi", name: "血色禁地", reqStage: 3, desc: "五百年一開的上古禁地,遍地機緣,亦遍地枯骨。" },
  { id: "luanxinghai", name: "亂星海", reqStage: 4, desc: "萬島星羅棋布的汪洋,妖修並立,星宮亂立海中央。" },
  { id: "dajin", name: "大晉皇朝", reqStage: 5, desc: "人界最大修真國度,佛道魔三宗鼎立,臥虎藏龍。" },
  { id: "lingjie", name: "靈界", reqStage: 7, desc: "飛昇之前的最後一界,真靈遍地,天劫懸頂。" },
];

export const MONSTERS: Monster[] = [
  // ── 天南(一至二階) ──
  { id: "shulang", name: "赤目鼠狼", element: "土", hp: 40, atk: 6, exp: 12, stones: [2, 6], drops: [{ id: "huanglongcao", chance: 0.4 }], desc: "一階最低等妖獸,雙目赤紅,成群出沒。" },
  { id: "qinglang", name: "青背狼", element: "木", hp: 70, atk: 10, exp: 22, stones: [4, 10], drops: [{ id: "qingmu", chance: 0.2 }, { id: "yaodan", chance: 0.1 }], desc: "背生青毛的狼型妖獸,行動迅捷。" },
  { id: "tiejiachong", name: "鐵甲蟲群", element: "金", hp: 90, atk: 12, exp: 30, stones: [5, 14], drops: [{ id: "tiekuang", chance: 0.5 }], desc: "甲殼堅硬如鐵的蟲群,尋常法術難傷。" },
  { id: "hanshuimang", name: "寒水蟒", element: "水", hp: 160, atk: 18, exp: 55, stones: [10, 25], drops: [{ id: "hanjing", chance: 0.3 }, { id: "yaodan", chance: 0.2 }], desc: "潛伏寒潭的巨蟒,吐息成冰。" },
  { id: "huomang", name: "赤炎火蟒", element: "火", hp: 220, atk: 24, exp: 80, stones: [15, 35], drops: [{ id: "huoyu", chance: 0.45 }, { id: "yaodan", chance: 0.25 }], desc: "周身赤鱗燃焰的火蟒,一階頂級妖獸。" },
  { id: "shiyan", name: "石岩傀儡", element: "土", hp: 300, atk: 28, exp: 110, stones: [20, 45], drops: [{ id: "wenyu", chance: 0.35 }], desc: "上古修士遺留的土石傀儡,力大無窮。" },
  { id: "yinhun", name: "陰魂老怪", element: "水", hp: 380, atk: 36, exp: 160, stones: [30, 60], drops: [{ id: "yinsha", chance: 0.5 }, { id: "m_hanbing", chance: 0.05 }], desc: "洞窟深處的陰魂,怨氣沖天,懼火克金。" },
  { id: "leizhujing", name: "金雷竹精", element: "金", hp: 500, atk: 45, exp: 240, stones: [40, 90], drops: [{ id: "jinleizhu", chance: 0.6 }, { id: "m_leidun", chance: 0.08 }], desc: "吸收雷霆成精的金雷竹,周身電光繚繞。" },
  // ── 血色禁地(結丹級) ──
  { id: "xuejiao", name: "血蛟", element: "水", hp: 3000, atk: 260, exp: 1800, stones: [300, 700], drops: [{ id: "jiaolin", chance: 0.6 }, { id: "m_qingzhufeng", chance: 0.1 }], desc: "欲化龍而未成的血色蛟龍,盤踞禁地血河。" },
  { id: "shengui", name: "禁地石龜", element: "土", hp: 5000, atk: 300, exp: 2600, stones: [400, 900], drops: [{ id: "wenyu", chance: 0.7 }, { id: "qiannianlingru", chance: 0.3 }], desc: "馱著半座山的巨龜,甲上刻滿上古符文。" },
  { id: "guhuolao", name: "古洞妖王", element: "火", hp: 8000, atk: 420, exp: 4200, stones: [800, 1600], drops: [{ id: "tianlingguo", chance: 0.5 }, { id: "m_jinlei", chance: 0.12 }, { id: "zhujidan", chance: 0.15 }], desc: "盤踞禁地萬年的妖王,結丹圓滿威壓。" },
  // ── 亂星海(元嬰級) ──
  { id: "haimujing", name: "海母巨鯨", element: "水", hp: 40000, atk: 1600, exp: 16000, stones: [3000, 7000], drops: [{ id: "xuantiehan", chance: 0.4 }, { id: "ziyuanhua", chance: 0.3 }], desc: "吞吐海潮的巨鯨,背上寄生著整座珊瑚島。" },
  { id: "xingchenguai", name: "隕星傀儡", element: "金", hp: 60000, atk: 2200, exp: 24000, stones: [5000, 10000], drops: [{ id: "xingchengang", chance: 0.6 }, { id: "m_dageng", chance: 0.08 }], desc: "星宮以隕星之核驅動的戰傀,金光射目。" },
  { id: "wangtianhou", name: "望天吼", element: "木", hp: 90000, atk: 3000, exp: 38000, stones: [8000, 16000], drops: [{ id: "ningyingdan", chance: 0.35 }, { id: "m_aohan", chance: 0.1 }], desc: "仰天長嘯可裂雲海的上古凶獸後裔。" },
  // ── 大晉(化神/煉虛級) ──
  { id: "mohua", name: "魔化修士", element: "火", hp: 500000, atk: 14000, exp: 220000, stones: [40000, 90000], drops: [{ id: "mojing", chance: 0.7 }, { id: "m_yuanci", chance: 0.06 }], desc: "修煉魔功走火入魔的煉虛修士,神智全失,兇性滔天。" },
  { id: "tianlanyao", name: "天嵐妖鳥", element: "火", hp: 900000, atk: 22000, exp: 450000, stones: [80000, 160000], drops: [{ id: "fenghuolin", chance: 0.5 }, { id: "m_sanyan", chance: 0.08 }], desc: "風火雙翼遮天蔽日,大晉妖族的圖騰聖獸。" },
  { id: "guimu", name: "鬼母", element: "水", hp: 1600000, atk: 35000, exp: 900000, stones: [150000, 300000], drops: [{ id: "huangjitiansui", chance: 0.3 }, { id: "dahuandan", chance: 0.5 }, { id: "wanshoudan", chance: 0.08 }], desc: "陰界裂縫爬出的存在,萬鬼朝拜,煉虛巔峰。" },
  // ── 靈界(合體/大乘級) ──
  { id: "zhenlingwei", name: "真靈衛", element: "金", hp: 9000000, atk: 160000, exp: 5200000, stones: [800000, 1600000], drops: [{ id: "longjinggu", chance: 0.4 }, { id: "m_zhenlong", chance: 0.05 }], desc: "靈界天淵城的傀儡戰衛,真靈血脈驅動。" },
  { id: "gulong", name: "上古真龍殘魂", element: "木", hp: 20000000, atk: 300000, exp: 15000000, stones: [2000000, 4000000], drops: [{ id: "longjinggu", chance: 0.8 }, { id: "pojiedan", chance: 0.25 }, { id: "yanshouguo", chance: 0.1 }], desc: "隕落真龍不滅的殘魂,一聲龍吟,萬里雲海翻覆。" },
  { id: "tianjie", name: "天劫雷靈", element: "金", hp: 50000000, atk: 700000, exp: 60000000, stones: [5000000, 10000000], drops: [{ id: "pojiedan", chance: 0.5 }, { id: "panlongtao", chance: 0.12 }], desc: "天劫之中孕生的雷之精靈——渡過它,便是飛昇之門。" },
];

export const LOCATIONS: Location[] = [
  // 天南
  {
    id: "caiyaoshan", name: "彩霞山", region: "tiannan", reqStage: 1,
    desc: "黃楓谷外圍靈山,雲霞繚繞,是低階弟子採藥練手之地。",
    monsters: ["shulang", "qinglang"],
    materials: ["tiekuang"], herbs: ["huanglongcao", "zijinhua"],
    manualChance: 0.02, manuals: ["m_hanbing"],
  },
  {
    id: "heifengling", name: "黑風嶺", region: "tiannan", reqStage: 1,
    desc: "妖獸出沒的荒嶺,黑風終年不歇,常有修士在此隕落。",
    monsters: ["qinglang", "tiejiachong", "hanshuimang"],
    materials: ["tiekuang", "qingmu"], herbs: ["huanglongcao", "xuelingzhi"],
    manualChance: 0.03, manuals: ["m_liehuo"],
  },
  {
    id: "hantan", name: "萬年寒潭", region: "tiannan", reqStage: 2,
    desc: "深不見底的寒潭,潭底藏有寒玉精,亦有寒水蟒盤踞。",
    monsters: ["hanshuimang", "yinhun"],
    materials: ["hanjing", "yinsha"], herbs: ["zijinhua", "zhuguo"],
    manualChance: 0.04, manuals: ["m_hanbing", "m_dayan"],
  },
  {
    id: "yanhuogu", name: "炎火谷", region: "tiannan", reqStage: 2,
    desc: "地火奔湧的山谷,赤炎火蟒的巢穴,煉器師嚮往的天然火源。",
    monsters: ["huomang", "shiyan"],
    materials: ["huoyu", "wenyu"], herbs: ["zhuguo", "xuelingzhi"],
    manualChance: 0.04, manuals: ["m_liehuo", "m_qingzhufeng"],
  },
  {
    id: "leizhulin", name: "雷鳴竹林", region: "tiannan", reqStage: 2,
    desc: "雷霆終年劈落的異竹林,金雷竹的唯一產地,兇險異常。",
    monsters: ["leizhujing", "shiyan"],
    materials: ["jinleizhu", "tiekuang"], herbs: ["zhuguo", "tianlingguo"],
    manualChance: 0.05, manuals: ["m_leidun", "m_jinlei"],
  },
  // 血色禁地
  {
    id: "xuesehe", name: "血色河谷", region: "jindi", reqStage: 3,
    desc: "赤紅河水奔流的裂谷,血蛟出沒,河底沉著歷代闖禁者的儲物袋。",
    monsters: ["xuejiao", "shengui"],
    materials: ["jiaolin", "yinsha"], herbs: ["qiannianlingru", "tianlingguo"],
    manualChance: 0.06, manuals: ["m_qingzhufeng", "m_xuantian"],
  },
  {
    id: "jinshoushan", name: "禁獸山古洞", region: "jindi", reqStage: 3,
    desc: "上古禁地深處的古洞,妖王沉眠之所,亦藏無上機緣。",
    monsters: ["guhuolao", "shengui"],
    materials: ["yinsha", "jinleizhu"], herbs: ["tianlingguo", "qiannianlingru"],
    manualChance: 0.08, manuals: ["m_jinlei", "m_xuantian"],
  },
  // 亂星海
  {
    id: "waihaidao", name: "外海群島", region: "luanxinghai", reqStage: 4,
    desc: "亂星海外圍的萬千小島,海獸橫行,島上靈藥無人採擷。",
    monsters: ["haimujing", "xingchenguai"],
    materials: ["xuantiehan", "xingchengang"], herbs: ["ziyuanhua", "qiannianlingru"],
    manualChance: 0.05, manuals: ["m_aohan", "m_dageng"],
  },
  {
    id: "xinggong", name: "星宮遺跡", region: "luanxinghai", reqStage: 4,
    desc: "亂星海之主星宮的廢棄別院,傀儡戰衛仍在巡邏,寶庫無人開啟。",
    monsters: ["xingchenguai", "wangtianhou"],
    materials: ["xingchengang", "jiaolin"], herbs: ["ziyuanhua", "longlinguo"],
    manualChance: 0.07, manuals: ["m_dageng", "m_aohan"],
  },
  // 大晉
  {
    id: "moyuan", name: "魔淵", region: "dajin", reqStage: 5,
    desc: "大晉北疆的無底深淵,魔氣沖天,魔化修士在淵口徘徊。",
    monsters: ["mohua", "tianlanyao"],
    materials: ["mojing", "fenghuolin"], herbs: ["longlinguo", "ziyuanhua"],
    manualChance: 0.06, manuals: ["m_yuanci", "m_sanyan"],
  },
  {
    id: "yinjieliexi", name: "陰界裂隙", region: "dajin", reqStage: 6,
    desc: "陰陽兩界的裂縫,鬼氣如潮。鬼母在此坐鎮,等閒煉虛不敢近前。",
    monsters: ["guimu", "mohua"],
    materials: ["mojing", "fenghuolin"], herbs: ["huangjitiansui", "longlinguo"],
    manualChance: 0.08, manuals: ["m_sanyan", "m_yuanci"],
  },
  // 靈界
  {
    id: "tianyuancheng", name: "天淵城外圍", region: "lingjie", reqStage: 7,
    desc: "靈界人族第一雄城之外的莽荒,真靈衛日夜巡弋。",
    monsters: ["zhenlingwei", "gulong"],
    materials: ["longjinggu", "xingchengang"], herbs: ["huangjitiansui", "longlinguo"],
    manualChance: 0.06, manuals: ["m_zhenlong"],
  },
  {
    id: "feishengtai", name: "飛昇台", region: "lingjie", reqStage: 8,
    desc: "傳說中溝通仙界之地。天劫雷靈盤踞於此——渡過它,肉身成聖,白日飛昇。",
    monsters: ["tianjie", "gulong"],
    materials: ["longjinggu"], herbs: ["huangjitiansui"],
    manualChance: 0.1, manuals: ["m_zhenlong"],
  },
];

export const RECIPES: Recipe[] = [
  { id: "r_qingsuo", result: "qingsuo", name: "青索劍", stones: 80, desc: "千年青木心為胎,精鐵為刃。", materials: [{ id: "qingmu", n: 2 }, { id: "tiekuang", n: 3 }] },
  { id: "r_jinjian", result: "jinjian", name: "金光巨劍", stones: 100, desc: "五塊精鐵反覆錘煉,佐以妖丹淬鋒。", materials: [{ id: "tiekuang", n: 5 }, { id: "yaodan", n: 1 }] },
  { id: "r_hanbingzhui", result: "hanbingzhui", name: "寒冰錐", stones: 120, desc: "寒玉精凝形,陰煞定魄。", materials: [{ id: "hanjing", n: 2 }, { id: "yinsha", n: 1 }] },
  { id: "r_huolingqi", result: "huolingqi", name: "火靈旗", stones: 150, desc: "火蟒鱗織旗,妖丹為引。", materials: [{ id: "huoyu", n: 3 }, { id: "yaodan", n: 1 }] },
  { id: "r_hutudun", result: "hutudun", name: "厚土盾", stones: 130, desc: "溫玉為心,精鐵鑲邊。", materials: [{ id: "wenyu", n: 3 }, { id: "tiekuang", n: 2 }] },
  { id: "r_wuguangyi", result: "wuguangyi", name: "烏光甲衣", stones: 300, desc: "三道陰煞淬鍊軟甲,烏光護體。", materials: [{ id: "yinsha", n: 3 }, { id: "hanjing", n: 1 }] },
  { id: "r_qingzhufengjian", result: "qingzhufengjian", name: "青竹蜂雲劍", stones: 1500, desc: "以金雷竹為本命劍胎,輔以寒玉、妖丹,煉成可一化為多的絕世飛劍。", materials: [{ id: "jinleizhu", n: 3 }, { id: "hanjing", n: 2 }, { id: "yaodan", n: 3 }] },
  { id: "r_jinganghu", result: "jinganghu", name: "金剛璃甲", stones: 20000, desc: "蛟龍逆鱗綴以玄天寒鐵,水火不侵。", materials: [{ id: "jiaolin", n: 4 }, { id: "xuantiehan", n: 2 }] },
  { id: "r_dagengjian", result: "dagengjian", name: "大庚劍陣", stones: 50000, desc: "七十二枚星辰鋼鑄七十二口小劍,以劍陣圖統御。", materials: [{ id: "xingchengang", n: 6 }, { id: "jinleizhu", n: 2 }] },
  { id: "r_fengleichi", result: "fengleichi", name: "風雷翅", stones: 150000, desc: "天嵐妖鳥翎鱗為骨,魔晶為芯,雷光一閃即百里。", materials: [{ id: "fenghuolin", n: 3 }, { id: "mojing", n: 2 }] },
  { id: "r_sanyanshan", result: "sanyanshan", name: "三焰扇", stones: 400000, desc: "三色火鳥翎羽合璧,扇骨以星辰鋼鍛成。", materials: [{ id: "fenghuolin", n: 5 }, { id: "xingchengang", n: 3 }, { id: "mojing", n: 3 }] },
  { id: "r_yuancishan", result: "yuancishan", name: "元磁神山", stones: 2000000, desc: "以皇極天髓溫養魔晶百日,凝聚元磁之力成山。", materials: [{ id: "mojing", n: 8 }, { id: "huangjitiansui", n: 1 }] },
  { id: "r_zhenlongyin", result: "zhenlongyin", name: "真龍璽", stones: 10000000, desc: "真龍精骨刻璽,天髓開光——靈界至寶,渡劫倚仗。", materials: [{ id: "longjinggu", n: 5 }, { id: "huangjitiansui", n: 2 }] },
];
