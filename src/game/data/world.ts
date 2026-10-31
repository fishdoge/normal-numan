import { Monster, Location, Recipe, Region } from "../types";

// ═══ 大陸(遊歷地圖,取材原著):天南 → 亂星海 → 大晉 → 靈界 ═══
export const REGIONS: Region[] = [
  { id: "tiannan", name: "天南 · 越國", reqStage: 1, lordId: "lord_tiannan", desc: "七派共治的修仙小國,韓立仙途的起點。" },
  { id: "jindi", name: "血色禁地", reqStage: 3, lordId: "lord_jindi", desc: "五百年一開的上古禁地,遍地機緣,亦遍地枯骨。" },
  { id: "luanxinghai", name: "亂星海", reqStage: 4, lordId: "lord_luanxinghai", desc: "萬島星羅棋布的汪洋,妖修並立,星宮亂立海中央。" },
  { id: "dajin", name: "大晉皇朝", reqStage: 5, lordId: "lord_dajin", desc: "人界最大修真國度,佛道魔三宗鼎立,臥虎藏龍。" },
  { id: "lingjie", name: "靈界", reqStage: 7, lordId: "lord_lingjie", desc: "飛昇之前的最後一界,真靈遍地,天劫懸頂。" },
  { id: "beihan", name: "北寒仙域", reqStage: 10, lordId: "lord_beihan", color: "fuchsia", desc: "唯有飛昇真仙方能踏足的極北仙域,萬載玄冰之下,先天仙器與天仙機緣長眠。" },
  { id: "jinyuan", name: "金源仙域", reqStage: 10, lordId: "lord_jinyuan", hidden: true, color: "fuchsia", desc: "雲遊探索秘境方能窺見的洪荒仙域,金源之氣沖霄,五重仙關層層設險,妖獸之強遠勝北寒五十倍。" },
  // 蠻荒異界:須集滿五色異星盤(金木水火土,金源仙域怪物掉落)方能開啟,四大領地各有專屬地域王
  { id: "manhuang", name: "蠻荒異界", reqStage: 10, lordChance: [0.03, 0.05], hidden: true, color: "fuchsia", desc: "五色異星盤共鳴開啟的洪荒秘域,妖獸攻勢不烈,卻生命堅韌無匹,四大領地各踞一方地域王。" },
  // 真魔界(3.19 版新增):雲遊探索隨機解鎖,真仙專屬,採集時有機率觸發「洗煞池」清空煞氣
  { id: "zhenmo", name: "真魔界", reqStage: 10, hidden: true, color: "fuchsia", desc: "雲遊探索秘境方能窺見的至暗魔域,魔氣沖霄,深處相傳藏有可滌淨煞氣的洗煞池。" },
  // 灰仙界(3.19 版新增):須集滿五色異星盤 + 極稀有的灰質破界盤方能開啟,怪物完全無視五行相剋
  { id: "huixian", name: "灰仙界", reqStage: 10, lordId: "lord_huixian", hidden: true, color: "fuchsia", desc: "五色異星盤與灰質破界盤共鳴開啟的死寂秘域,妖獸不分五行、皆為煞氣所化,非常強大。" },
];

// 3.14 版:hp/atk 隨符寶威力(techniques.ts)同步下修。原本 hp 從 14 一路指數長到 600 億,
// 疊加符寶舊制 power 同樣指數長到 300,兩條指數曲線相乘,後期戰鬥只剩「數值輾壓」。這次改成單一
// 連續的對數內插壓縮:hp 每提高一個數量級,壓縮倍率平滑增加(池底 1x、頂端約 45x),同時套用在
// hp 與 atk 兩側以維持原有的相對「幾回合能打贏」節奏,不再是舊版那樣只對 hp≤500 萬的怪物打折、
// 其餘上億甚至上百億 hp 的極端怪完全不動的暫時性做法。蠻荒四大地域王之中「霸下」刻意保留遠高於
// 同儕的 hp(其描述本就設定為「尋常妖獸的四十倍」),壓縮後仍維持這個相對倍率,屬於敘事上的刻意
// 例外,不是遺漏。
export const MONSTERS: Monster[] = [
  // ── 天南(一至二階) ──
  { id: "shulang", name: "赤目鼠狼", element: "土", hp: 24, atk: 6, exp: 3, stones: [1, 2], drops: [{ id: "huanglongcao", chance: 0.4 }, { id: "qingyunshi", chance: 0.15 }], desc: "一階最低等妖獸,雙目赤紅,成群出沒。" },
  { id: "qinglang", name: "青背狼", element: "木", hp: 31, atk: 8, exp: 6, stones: [1, 3], drops: [{ id: "qingmu", chance: 0.2 }, { id: "yaodan", chance: 0.1 }], desc: "背生青毛的狼型妖獸,行動迅捷。" },
  { id: "tiejiachong", name: "鐵甲蟲群", element: "金", hp: 35, atk: 8, exp: 8, stones: [1, 4], drops: [{ id: "tiekuang", chance: 0.5 }], desc: "甲殼堅硬如鐵的蟲群,尋常法術難傷。" },
  { id: "hanshuimang", name: "寒水蟒", element: "水", hp: 45, atk: 8, exp: 14, stones: [3, 6], drops: [{ id: "huiyangdan", chance: 0.08 }, { id: "hanjing", chance: 0.3 }, { id: "yaodan", chance: 0.2 }], desc: "潛伏寒潭的巨蟒,吐息成冰。" },
  { id: "huomang", name: "赤炎火蟒", element: "火", hp: 52, atk: 23, exp: 21, stones: [4, 9], drops: [{ id: "qingliangsan", chance: 0.08 }, { id: "huoyu", chance: 0.45 }, { id: "yaodan", chance: 0.25 }], desc: "周身赤鱗燃焰的火蟒,一階頂級妖獸。" },
  { id: "shiyan", name: "石岩傀儡", element: "土", hp: 64, atk: 30, exp: 29, stones: [5, 12], drops: [{ id: "baicao_linglu", chance: 0.05 }, { id: "wenyu", chance: 0.35 }], desc: "上古修士遺留的土石傀儡,力大無窮。" },
  { id: "yinhun", name: "陰魂老怪", element: "水", hp: 73, atk: 30, exp: 42, stones: [8, 16], drops: [{ id: "tishendan", chance: 0.08 }, { id: "yinsha", chance: 0.5 }, { id: "m_hanbing", chance: 0.02 }], desc: "洞窟深處的陰魂,怨氣沖天,懼火克金。" },
  { id: "leizhujing", name: "金雷竹精", element: "金", hp: 85, atk: 39, exp: 62, stones: [10, 23], drops: [{ id: "jinleizhu", chance: 0.6 }, { id: "m_leidun", chance: 0.02 }], desc: "吸收雷霆成精的金雷竹,周身電光繚繞。" },
  { id: "cuiyunyan", name: "翠雲燕", element: "木", hp: 29, atk: 6, exp: 5, stones: [1, 3], drops: [{ id: "baicao_linglu", chance: 0.04 }, { id: "qingmu", chance: 0.25 }, { id: "huanglongcao", chance: 0.2 }], desc: "羽翼翠綠如雲的靈燕,掠地成風,難以捕捉。" },
  { id: "duyanchan", name: "毒眼蟾", element: "水", hp: 59, atk: 30, exp: 25, stones: [4, 10], drops: [{ id: "jiedudan", chance: 0.08 }, { id: "yaodan", chance: 0.3 }, { id: "yinsha", chance: 0.2 }], desc: "獨目巨蟾,口吐毒霧,潛伏於沼澤陰處。" },
  { id: "huoyanju", name: "火鬃巨犀", element: "火", hp: 82, atk: 39, exp: 55, stones: [9, 20], drops: [{ id: "huoyu", chance: 0.4 }, { id: "wenyu", chance: 0.25 }], desc: "鬃毛燃燒不熄的巨犀,一撞裂石開山。" },
  // ── 血色禁地(結丹級) ──
  { id: "xuejiao", name: "血蛟", element: "水", hp: 378, atk: 74, exp: 220, stones: [36, 84], drops: [{ id: "baicao_linglu", chance: 0.05 }, { id: "jiaolin", chance: 0.6 }, { id: "m_qingzhufeng", chance: 0.02 }, { id: "xueyu", chance: 0.15 }], desc: "欲化龍而未成的血色蛟龍,盤踞禁地血河。" },
  { id: "shengui", name: "禁地石龜", element: "土", hp: 546, atk: 74, exp: 310, stones: [48, 110], drops: [{ id: "wenyu", chance: 0.7 }, { id: "qiannianlingru", chance: 0.3 }], desc: "馱著半座山的巨龜,甲上刻滿上古符文。" },
  { id: "guhuolao", name: "古洞樹妖", element: "火", hp: 779, atk: 91, exp: 500, stones: [96, 190], drops: [{ id: "tianlingguo", chance: 0.5 }, { id: "m_jinlei", chance: 0.02 }, { id: "zhujidan", chance: 0.15 }], desc: "盤踞禁地萬年的妖王,結丹圓滿威壓。" },
  { id: "xuewuzhu", name: "血霧蛛", element: "木", hp: 455, atk: 68, exp: 260, stones: [40, 95], drops: [{ id: "jiedudan", chance: 0.08 }, { id: "jiaolin", chance: 0.35 }, { id: "qiannianlingru", chance: 0.2 }], desc: "吐血色蛛絲結網的巨蛛,獵物入網頃刻化血。" },
  { id: "kulouwang", name: "枯骨魔將", element: "金", hp: 648, atk: 91, exp: 400, stones: [70, 150], drops: [{ id: "yinsha", chance: 0.5 }, { id: "m_xuantian", chance: 0.02 }], desc: "禁地枯骨凝聚的魔將,執一柄骨矛,刀槍不入。" },
  { id: "chihuoya", name: "赤火鴉群", element: "火", hp: 506, atk: 91, exp: 340, stones: [55, 130], drops: [{ id: "qingliangsan", chance: 0.08 }, { id: "huoyu", chance: 0.5 }, { id: "tianlingguo", chance: 0.25 }], desc: "遮天蔽日的火鴉群,所過之處林木成炭。" },
  // ── 亂星海(元嬰級) ──
  { id: "haimujing", name: "海母巨鯨", element: "水", hp: 1819, atk: 212, exp: 940, stones: [180, 410], drops: [{ id: "huiyangdan", chance: 0.08 }, { id: "xuantiehan", chance: 0.4 }, { id: "ziyuanhua", chance: 0.3 }, { id: "haixinzhu", chance: 0.15 }], desc: "吞吐海潮的巨鯨,背上寄生著整座珊瑚島。" },
  { id: "xingchenguai", name: "隕星傀儡", element: "金", hp: 2507, atk: 243, exp: 1400, stones: [300, 590], drops: [{ id: "xingchengang", chance: 0.6 }, { id: "m_dageng", chance: 0.02 }], desc: "星宮以隕星之核驅動的戰傀,金光射目。" },
  { id: "wangtianhou", name: "望天吼", element: "木", hp: 3631, atk: 306, exp: 2200, stones: [470, 940], drops: [{ id: "ningyingdan", chance: 0.35 }, { id: "m_aohan", chance: 0.02 }], desc: "仰天長嘯可裂雲海的上古凶獸後裔。" },
  { id: "canghaijiao", name: "滄海蛟龍", element: "水", hp: 2274, atk: 212, exp: 1200, stones: [240, 500], drops: [{ id: "jiaolin", chance: 0.4 }, { id: "xuantiehan", chance: 0.3 }], desc: "亂星海深處的蛟龍,捲起千丈狂濤,吞舟裂島。" },
  { id: "jinyuxie", name: "金羽蠍王", element: "金", hp: 3024, atk: 282, exp: 1800, stones: [380, 760], drops: [{ id: "xingchengang", chance: 0.45 }, { id: "ziyuanhua", chance: 0.25 }], desc: "披金色甲羽的巨蠍,尾刺一擊可洞穿法器。" },
  { id: "youmingzhang", name: "幽冥章魚", element: "水", hp: 3246, atk: 298, exp: 2000, stones: [420, 850], drops: [{ id: "xuantiehan", chance: 0.4 }, { id: "longlinguo", chance: 0.15 }], desc: "萬丈海溝爬出的幽冥巨章,觸手纏繞星辰。" },
  // ── 大晉(化神/煉虛級) ──
  { id: "mohua", name: "魔化修士", element: "火", hp: 9328, atk: 635, exp: 7700, stones: [1400, 3200], drops: [{ id: "xuelingdan", chance: 0.06 }, { id: "mojing", chance: 0.7 }, { id: "m_yuanci", chance: 0.02 }, { id: "m_fentian_liyu", chance: 0.02 }, { id: "moyanjing", chance: 0.15 }, { id: "m_tuhuo_lianxin", chance: 0.02 }, { id: "m_bingjian_shuangsha", chance: 0.02 }, { id: "m_jinlei_zhaji", chance: 0.02 }, { id: "m_muling_huisheng", chance: 0.02 }, { id: "m_jinmu_shuangyi", chance: 0.02 }, { id: "m_shuitu_ningxiang", chance: 0.02 }], desc: "修煉魔功走火入魔的煉虛修士,神智全失,兇性滔天。" },
  { id: "tianlanyao", name: "天嵐妖鳥", element: "火", hp: 15_346, atk: 846, exp: 16_000, stones: [2800, 5600], drops: [{ id: "fenghuolin", chance: 0.5 }, { id: "m_sanyan", chance: 0.02 }, { id: "m_jinwu_zhuori", chance: 0.02 }, { id: "m_liulian_shuizhen", chance: 0.02 }, { id: "m_yinfeng_jian", chance: 0.02 }], desc: "風火雙翼遮天蔽日,大晉妖族的圖騰聖獸。" },
  { id: "guimu", name: "鬼母", element: "水", hp: 23_883, atk: 2620, exp: 22_000, stones: [3800, 7500], drops: [{ id: "yusui_lingquan", chance: 0.05 }, { id: "xuelingdan", chance: 0.06 }, { id: "huangjitiansui", chance: 0.3 }, { id: "dahuandan", chance: 0.5 }, { id: "wanshoudan", chance: 0.08 }, { id: "m_hanyuan_wanli", chance: 0.02 }, { id: "m_yinghuan_shu", chance: 0.02 }, { id: "m_mushui_ronghe", chance: 0.02 }, { id: "m_hanshui_fengyin", chance: 0.02 }, { id: "m_liyan_zhulong", chance: 0.02 }, { id: "m_houtu_yaji", chance: 0.02 }, { id: "m_huojin_liehun", chance: 0.02 }], desc: "陰界裂縫爬出的存在,萬鬼朝拜,煉虛巔峰。" },
  { id: "moxuejun", name: "魔血尊者", element: "火", hp: 12_058, atk: 729, exp: 11_000, stones: [2000, 4200], drops: [{ id: "mojing", chance: 0.6 }, { id: "longlinguo", chance: 0.2 }, { id: "m_wanteng_tianluo", chance: 0.02 }, { id: "m_ningshen_juli", chance: 0.02 }, { id: "m_dinghun_fu", chance: 0.02 }], desc: "以魔血淬體的煉虛魔修,渾身血氣化甲,力可撼山。" },
  { id: "wuxinbagua", name: "無心霸虎", element: "土", hp: 14_046, atk: 947, exp: 14_000, stones: [2500, 5000], drops: [{ id: "fenghuolin", chance: 0.4 }, { id: "huangjitiansui", chance: 0.15 }, { id: "m_jinlei_zhui", chance: 0.02 }], desc: "大晉北荒的太古凶虎,雙目無神,只知殺戮。" },
  { id: "youmingfan", name: "幽冥梵僧", element: "金", hp: 22_740, atk: 2498, exp: 20_000, stones: [3400, 6800], drops: [{ id: "tishendan", chance: 0.08 }, { id: "xuelingdan", chance: 0.06 }, { id: "mojing", chance: 0.5 }, { id: "dahuandan", chance: 0.4 }], desc: "墮入魔道的佛宗高僧,誦動地獄梵音,攝人心魂。" },
  // ── 靈界(合體/大乘級) ──
  { id: "zhenlingwei", name: "真靈衛", element: "金", hp: 135_712, atk: 6508, exp: 64_000, stones: [3000, 6000], drops: [{ id: "xuelingdan", chance: 0.05 }, { id: "longjinggu", chance: 0.4 }, { id: "m_zhenlong", chance: 0.02 }, { id: "m_canghai_niliu", chance: 0.02 }, { id: "zhenlingsha", chance: 0.12 }, { id: "m_jintu_shuangxiu", chance: 0.02 }, { id: "m_wuxing_sanhe", chance: 0.02 }, { id: "m_mingjing_zhi", chance: 0.02 }], desc: "靈界天淵城的傀儡戰衛,真靈血脈驅動。" },
  { id: "gulong", name: "上古真龍殘魂", element: "木", hp: 212_503, atk: 8891, exp: 150_000, stones: [6000, 12_000], drops: [{ id: "longxuedan", chance: 0.06 }, { id: "longjinggu", chance: 0.8 },{id:"nimetanti",chance:0.02}, { id: "pojiedan", chance: 0.25 }, { id: "yanshouguo", chance: 0.1 }, { id: "m_houtu_fengtian", chance: 0.02 }, { id: "m_tianluo_suoshen", chance: 0.02 }], desc: "隕落真龍不滅的殘魂,一聲龍吟,萬里雲海翻覆。" },
  { id: "tianjie", name: "天劫雷靈", element: "金", hp: 517_430, atk: 27_146, exp: 490_000, stones: [12_000, 24_000], drops: [{ id: "pojiedan", chance: 0.5 }, { id: "panlongtao", chance: 0.12 }, { id: "m_tianjie_shafa", chance: 0.02 }, { id: "m_huoshui_ni_xiang", chance: 0.02 }, { id: "m_tianyuan_sancai", chance: 0.02 }, { id: "m_jiuyou_lianzhan", chance: 0.02 }, { id: "m_xuanshui_nixi", chance: 0.02 }, { id: "m_tianhuo_fenying", chance: 0.02 }, { id: "m_wanmu_guiyi", chance: 0.02 }], desc: "天劫之中孕生的雷之精靈——渡過它,便是飛昇之門。" },
  { id: "hunyuanshou", name: "混元凶獸", element: "土", hp: 174_641, atk: 7420, exp: 100_000, stones: [4500, 9000], drops: [{ id: "longxuedan", chance: 0.06 }, { id: "longjinggu", chance: 0.5 }, { id: "huangjitiansui", chance: 0.2 }, { id: "m_shanhe_zhenhun", chance: 0.02 }, { id: "m_wulei_lianji", chance: 0.02 }, { id: "m_xuemai_dazhou", chance: 0.02 }], desc: "靈界洪荒殘留的混元巨獸,一步一頓,山河震顫。" },
  { id: "jiutianfeng", name: "九天玄鳳", element: "火", hp: 285_968, atk: 10_478, exp: 280_000, stones: [9000, 18_000], drops: [{ id: "pojiedan", chance: 0.35 }, { id: "huangjitiansui", chance: 0.2 }, { id: "longjinggu", chance: 0.6 }, { id: "m_xuanbing_ci", chance: 0.02 }], desc: "浴火九天的玄色神鳳,一羽焚城,涅槃不滅。" },
  { id: "taixureng", name: "太虛人仙", element: "木", hp: 435_543, atk: 24_479, exp: 400_000, stones: [11_000, 22_000], drops: [{ id: "pojiedan", chance: 0.45 }, { id: "huangjitiansui", chance: 0.2 }, { id: "yanshouguo", chance: 0.12 }, { id: "m_xuanbing_mieshi", chance: 0.02 }, { id: "m_xuanyin_dun", chance: 0.02 }, { id: "m_poyun_daishi", chance: 0.02 }], desc: "遊走靈界邊緣、拒絕飛昇的太古人仙,一身道行深不可測。" },

  // ── 靈界 · 風元大陸(2.14 版新增,夜叉族夜陽城 / 木靈森林) ──
  { id: "yecha_renwei", name: "夜叉刃衛", element: "木", hp: 145_563, atk: 7025, exp: 70_000, stones: [3200, 6400], drops: [{ id: "fengyuanjing", chance: 0.5 }, { id: "yecha_hunjing", chance: 0.15 }], desc: "夜陽城把守城門的夜叉戰卒,雙刃如風,劈風斬影。" },
  { id: "yehuo_yecha", name: "業火夜叉", element: "火", hp: 184_190, atk: 8496, exp: 95_000, stones: [4000, 8000], drops: [{ id: "qingliangsan", chance: 0.08 }, { id: "fengyuanjing", chance: 0.4 }, { id: "yecha_hunjing", chance: 0.18 }], desc: "渾身業火纏繞的夜叉修士,一觸即焚,性情暴烈。" },
  { id: "yeyang_yaoji", name: "夜陽妖姬", element: "火", hp: 165_018, atk: 8060, exp: 85_000, stones: [3600, 7200], drops: [{ id: "yecha_hunjing", chance: 0.2 }, { id: "fengyuanjing", chance: 0.4 }], desc: "夜陽城中魅惑人心的妖姬,歌聲一出,心神俱迷。" },
  { id: "tengman_yaojing", name: "藤蔓妖精", element: "木", hp: 155_331, atk: 7257, exp: 75_000, stones: [3300, 6600], drops: [{ id: "jiedudan", chance: 0.08 }, { id: "lingmu_xianye", chance: 0.45 }, { id: "fengyuanjing", chance: 0.2 }], desc: "木靈森林深處的藤蔓精怪,枝蔓纏身,難以掙脫。" },
  { id: "gumu_jingpo", name: "古木精魄", element: "木", hp: 203_126, atk: 8945, exp: 110_000, stones: [4600, 9200], drops: [{ id: "yusui_lingquan", chance: 0.05 }, { id: "lingmu_xianye", chance: 0.5 }, { id: "huangjitiansui", chance: 0.05 }], desc: "千年古木孕育而生的精魄,軀幹如鐵,一拳千鈞。" },
  { id: "fengling_die", name: "風靈蝶", element: "木", hp: 140_651, atk: 6767, exp: 65_000, stones: [3000, 6000], drops: [{ id: "fengyuanjing", chance: 0.5 }, { id: "lingmu_xianye", chance: 0.25 }], desc: "森林中成群飛舞的異蝶,振翅間風刃四溢。" },

  // ── 靈界 · 雷鳴大陸(2.14 版新增,飛靈族天霄城 / 角蚩族角蠻獄 / 蜉蝣族冥河之地) ──
  { id: "tianxiao_pengwei", name: "天霄鵬衛", element: "金", hp: 379_957, atk: 20_765, exp: 300_000, stones: [9500, 19_000], drops: [{ id: "longxuedan", chance: 0.05 }, { id: "leimingshi", chance: 0.45 }, { id: "jiaochi_tiesui", chance: 0.1 }], desc: "天霄城巡弋的飛靈族鵬衛,展翼刺破雷雲,俯衝之勢無可阻擋。" },
  { id: "jifeng_lingshi", name: "疾風靈使", element: "金", hp: 357_460, atk: 20_082, exp: 280_000, stones: [9000, 18_000], drops: [{ id: "leimingshi", chance: 0.5 }], desc: "飛靈族修習疾風秘法的靈使,身法快若閃電。" },
  { id: "xiaohan_jianling", name: "霄漢劍靈", element: "金", hp: 424_494, atk: 22_110, exp: 330_000, stones: [10_500, 21_000], drops: [{ id: "leimingshi", chance: 0.4 }, { id: "jinleizhu", chance: 0.1 }], desc: "天霄城仙劍所化的劍靈,劍氣縱橫霄漢之間。" },
  { id: "jiaochi_manbing", name: "角蚩蠻兵", element: "金", hp: 402_294, atk: 21_427, exp: 310_000, stones: [10_000, 20_000], drops: [{ id: "jiaochi_tiesui", chance: 0.45 }, { id: "leimingshi", chance: 0.15 }], desc: "角蠻獄中列陣衝殺的角蚩族蠻兵,頭生雙角,悍不畏死。" },
  { id: "leijiao_mojiang", name: "雷角魔將", element: "金", hp: 479_408, atk: 24_180, exp: 380_000, stones: [12_000, 24_000], drops: [{ id: "jiaochi_tiesui", chance: 0.5 }, { id: "huangjitiansui", chance: 0.05 }], desc: "角蚩族中悍勇善戰的魔將,雙角蘊雷,一角觸敵雷光爆閃。" },
  { id: "manyu_suohunshi", name: "蠻獄鎖魂使", element: "金", hp: 435_543, atk: 22_835, exp: 340_000, stones: [11_000, 22_000], drops: [{ id: "jiaochi_tiesui", chance: 0.4 }, { id: "mojing", chance: 0.1 }], desc: "角蠻獄中掌管刑戮的鎖魂使者,鎖鏈一出,魂魄難逃。" },
  { id: "minghe_fuyou", name: "冥河蜉蝣", element: "水", hp: 368_725, atk: 20_018, exp: 290_000, stones: [9200, 18_400], drops: [{ id: "minghesha", chance: 0.5 }], desc: "冥河之地成群漂浮的蜉蝣妖蟲,朝生暮死,卻怨氣纏身不散。" },
  { id: "youming_chuanfu", name: "幽冥船夫", element: "水", hp: 446_558, atk: 22_793, exp: 350_000, stones: [11_500, 23_000], drops: [{ id: "minghesha", chance: 0.45 }, { id: "yinsha", chance: 0.1 }], desc: "擺渡冥河亡魂的蜉蝣族船夫,篙點之處,河水盡皆凝滯。" },
  { id: "wanghun_shiling", name: "亡魂蝕靈", element: "水", hp: 407_864, atk: 21_384, exp: 320_000, stones: [10_200, 20_400], drops: [{ id: "tishendan", chance: 0.08 }, { id: "minghesha", chance: 0.5 }, { id: "mojing", chance: 0.08 }], desc: "冥河沉積怨氣所化的蝕靈,無形無質,專蝕修士神魂。" },

  // ── 靈界 · 血天大陸(2.14 版新增,地血族血獄 / 九龍獄 / 天鼎宮) ──
  { id: "xueyu_xingtu", name: "血獄刑徒", element: "無", hp: 463_017, atk: 23_476, exp: 360_000, stones: [12_000, 24_000], drops: [{ id: "dixuejing", chance: 0.5 }], desc: "地血族血獄中永世服刑的刑徒,渾身浴血,痛感全無。" },
  { id: "shixue_xiuluo", name: "嗜血修羅", element: "無", hp: 517_430, atk: 26_357, exp: 420_000, stones: [13_500, 27_000], drops: [{ id: "dixuejing", chance: 0.45 }, { id: "mojing", chance: 0.1 }], desc: "地血族中嗜血成性的修羅,見血愈戰愈勇,近乎瘋狂。" },
  { id: "dixue_moling", name: "地血魔靈", element: "無", hp: 490_309, atk: 24_927, exp: 390_000, stones: [12_800, 25_600], drops: [{ id: "dixuejing", chance: 0.5 }, { id: "huangjitiansui", chance: 0.06 }], desc: "地血族煉化地脈精血所化的魔靈,踏地而行,血氣沖天。" },
  { id: "longyu_kanshou", name: "龍獄看守", element: "木", hp: 544_380, atk: 27_765, exp: 460_000, stones: [14_500, 29_000], drops: [{ id: "longxuedan", chance: 0.05 }, { id: "longyu_linjia", chance: 0.5 }, { id: "longjinggu", chance: 0.1 }], desc: "九龍獄外圍看守的鱗甲妖獸,終年鎮壓獄中凶靈,體魄剛猛。" },
  { id: "suolong_shawei", name: "鎖龍煞衛", element: "木", hp: 571_194, atk: 29_174, exp: 480_000, stones: [15_000, 30_000], drops: [{ id: "longyu_linjia", chance: 0.45 }, { id: "dixuejing", chance: 0.15 }], desc: "九龍獄深處持鎖鏈巡守的煞衛,一鏈甩出,可鎖蛟縛龍。" },
  { id: "tianding_shouwei", name: "天鼎守衛", element: "金", hp: 744_924, atk: 25_951, exp: 440_000, stones: [14_000, 28_000], drops: [{ id: "tianding_suipian", chance: 0.5 }, { id: "xutianding", chance: 0.02 }, { id: "jiuding_xiangyun", chance: 0.15 }], desc: "天鼎宮外圍列陣的守衛,渾身鼎紋,鼎氣護體堅不可摧。" },
  { id: "tianding_zhishi", name: "天鼎執事", element: "金", hp: 858_226, atk: 28_512, exp: 500_000, stones: [16_000, 32_000], drops: [{ id: "tianding_suipian", chance: 0.55 }, { id: "xutianding", chance: 0.03 }, { id: "xuhuangding", chance: 0.012 }, { id: "jiuding_xiangyun", chance: 0.18 }], desc: "天鼎宮中位階更高的執事守衛,掌管鼎火,偶得鼎中至寶餽贈。" },

  // ── 地域王(妖獸領主,極稀有,獵殺時 2%~3% 遭遇;掉落豐厚。1.6 版:靈石掉落一律 ×15) ──
  { id: "lord_tiannan", name: "青元蟒王", element: "木", isLord: true, hp: 482, atk: 17, exp: 230, stones: [1200, 3000], drops: [ { id: "zenglingzhu", chance: 0.35 }, { id: "tianlingguo", chance: 0.8 }, { id: "fu_liehuo", chance: 0.4 }], desc: "盤踞天南千年的蟒中之王,雙目如燈,鱗甲泛青,尋常修士見之膽裂。" },
  { id: "lord_jindi", name: "血獄魔君", element: "火", isLord: true, hp: 2282, atk: 199, exp: 3800, stones: [10_500, 24_000], drops: [ { id: "zenglingzhu", chance: 0.4 }, { id: "qiannianlingru", chance: 0.8 }, { id: "jinganghu", chance: 0.3 }], desc: "血色禁地深處自枯骨中重生的魔頭,渾身血焰,踏過之處寸草不生。" },
  { id: "lord_luanxinghai", name: "萬鱗海皇", element: "水", isLord: true, hp: 14_655, atk: 621, exp: 28_000, stones: [60_000, 120_000], drops: [ { id: "zenglingzhu", chance: 0.45 }, { id: "panlongtao", chance: 0.2 }, { id: "ziyuanhua", chance: 0.8 }, { id: "fu_wulei", chance: 0.35 }], desc: "亂星海真正的主宰,一身萬鱗吞吐星光,翻身即掀起滔天巨浪。" },
  { id: "lord_dajin", name: "噬天鬼帝", element: "水", isLord: true, hp: 75_972, atk: 1862, exp: 200_000, stones: [240_000, 480_000], drops: [ { id: "zenglingzhu", chance: 0.5 }, { id: "panlongtao", chance: 0.2 }, { id: "huangjitiansui", chance: 0.8 }, { id: "blueprint_xuanyin", chance: 0.25 }], desc: "陰界萬鬼之主,鬼母亦要俯首,一念之間可令大晉一國化為鬼域。" },
  { id: "lord_lingjie", name: "太古龍祖", element: "木", isLord: true, hp: 286_917, atk: 17_732, exp: 900_000, stones: [600_000, 1_200_000], drops: [{ id: "longjinggu", chance: 0.4 },{id:"nimetanti",chance:0.3},{id:"huangjitiansui",chance:0.3}, { id: "zenglingzhu", chance: 0.6 }, { id: "panlongtao", chance: 0.12 }, { id: "pojiedan", chance: 0.9 }, { id: "fu_xuanyin", chance: 0.3 }, { id: "blueprint_xuanyin", chance: 0.3 }, { id: "zhenxiandan", chance: 0.15 }], desc: "靈界所有真龍血脈的源頭,一聲龍吟,天淵城萬里雲海盡數翻覆。" },
  // 九龍獄專屬地域王:曾為真仙,道基崩碎墮落於此,實力遠超同階妖獸,九龍獄看守/鎖龍煞衛偶爾提及其名皆色變
  { id: "duoluo_zhenxian_maliang", name: "墮落真仙馬良", element: "無", isLord: true, hp: 752_977, atk: 53_196, exp: 2_000_000, stones: [1_200_000, 2_400_000], drops: [{ id: "zhenxiandan", chance: 0.4 }, { id: "xuhuangding", chance: 0.12 }, { id: "xutianding", chance: 0.02 }, { id: "lianshenshu", chance: 0.02 }, { id: "longyu_linjia", chance: 0.6 }, { id: "huangjitiansui", chance: 0.4 }, { id: "zenglingzhu", chance: 0.5 }], desc: "曾位列真仙,卻因心魔入體、道基崩碎而墮落九龍獄的絕世凶靈,一身道行雖已癲狂顛倒,仍遠勝尋常合體大乘妖獸百倍。" },
  // 天劫神靈(2.18 版新增):非探索遭遇,而是渡劫期服下真仙丹嘗試突破時必定召喚的試煉之敵。
  // 不計修為、不掉靈石道具——單純以此戰勝負決定本次飛昇機率翻倍或減半,詳見 engine.ts 的 breakthrough/winCombat/monsterTurn。
  { id: "tianjie_shenling", name: "天劫神靈", element: "金", isLord: true, hp: 654_965, atk: 108_680, exp: 0, stones: [0, 0], drops: [], desc: "真仙丹引動九霄劫雲所凝的至高劫靈,唯有渡劫者服丹嘗試飛昇時方會現身,考驗其是否有資格白日飛昇。" },

  // ── 北寒仙域(真仙專屬,掉落先天仙器,予以仙靈力;靈石掉落已於 1.6 版兩度調整,現為原區間 ×3) ──
  { id: "bh_hanjiao", name: "玄冰仙蛟", element: "水", hp: 1_089_112, atk: 53_970, exp: 0, stones: [6_000_000, 9_000_000], drops: [{ id: "xianyuan_huichun", chance: 0.05 }, { id: "bh_hanshuang_jian", chance: 0.05 }, { id: "bh_bingfeng_fu", chance: 0.04 }, { id: "xiantian_zhong", chance: 0.002 }, { id: "xuanbingjing", chance: 0.1 }], desc: "北寒仙域萬載寒潭孕育的仙蛟,通體晶瑩如玉,一息成冰,已臻仙獸之列。" },
  { id: "bh_binghun", name: "萬載冰魂", element: "水", hp: 1_546_117, atk: 57_017, exp: 0, stones: [7_500_000, 10_800_000], drops: [{ id: "huiyangdan", chance: 0.08 }, { id: "bh_bingcan_yi", chance: 0.05 }, { id: "xiantian_zhong", chance: 0.002 }], desc: "玄冰深處凝聚萬載的寒魂,所觸之物盡成永凍,連仙靈力也能封凍。" },
  { id: "bh_hanpeng", name: "極寒天鵬", element: "金", hp: 1_766_205, atk: 60_000, exp: 0, stones: [9_600_000, 13_800_000], drops: [{ id: "xianyuan_huichun", chance: 0.05 }, { id: "bh_bingpo_ji", chance: 0.04 }, { id: "xiantian_zhong", chance: 0.002 }, { id: "xiantian_qi", chance: 0.0075 }, { id: "xuanbingjing", chance: 0.1 }], desc: "展翅蔽日的仙界鵬鳥,雙翼捲動九天寒風,一擊便是萬里冰封。" },
  { id: "bh_xuanwu", name: "北冥玄武", element: "土", hp: 2_222_073, atk: 65_497, exp: 0, stones: [12_600_000, 17_400_000], drops: [{ id: "jiuzhuan_xianlu", chance: 0.03 }, { id: "bh_xuanwu_jia", chance: 0.04 }, { id: "xiantian_zhong", chance: 0.002 }, { id: "xiantian_qi", chance: 0.0075 }], desc: "背負仙山的太古玄武,龜甲堅逾仙器,鎮壓北寒一方水土。" },
  { id: "bh_hanlong", name: "寒霜仙龍", element: "金", hp: 2_652_098, atk: 78_000, exp: 0, stones: [16_200_000, 21_000_000], drops: [{ id: "jiuzhuan_xianlu", chance: 0.03 }, { id: "bh_hanyu_pei", chance: 0.05 }, { id: "pet_xuehu", chance: 0.03 }, { id: "xiantian_qi", chance: 0.001 },{id:"nimetanti",chance:0.06}, { id: "xiantian_zhong", chance: 0.003 }], desc: "通體覆霜的仙龍,龍息所至冰封千里,乃北寒仙尊麾下的守域仙獸。" },
  // 地域王(北寒仙尊)靈石掉落與其餘六位地域王一併於下方按原始基準 ×15,再套用本次 ×3
  { id: "lord_beihan", name: "北寒仙尊", element: "水", isLord: true, hp: 3_438_362, atk: 132_000, exp: 0, stones: [900_000, 1_800_000], drops: [{ id: "tianxiandan", chance: 0.24 },{ id: "zengyuandan", chance: 0.01 }, { id: "xiantian_qi", chance: 0.125 }, { id: "xiantian_zhong", chance: 0.15 }, { id: "m_beiming", chance: 0.2 }, { id: "m_jinsha_huanying", chance: 0.05 }], desc: "北寒仙域的無上主宰,一身仙靈力深不見底,傳說祂曾是與天同壽的古仙。天仙丹唯祂身隕方出,更有機緣傳下無上仙法。" },

  // ── 一次性秘境地圖道具(廣寒界/鯤鵬遺骸)專屬 boss(3.19 版新增):不掛在任何地點的 monsters[] 底下,
  // 只透過對應地圖道具的 mapEncounter 觸發,寫法比照浮屠塔 huanxiang_taisui ──
  { id: "boss_guanghan", name: "廣寒仙子", element: "無", isLord: true, hp: 230_000, atk: 154_000, exp: 800_000, stones: [1_200_000, 2_400_000], drops: [
    { id: "gh_hanguang_jian", chance: 0.1 }, { id: "gh_shuangyu_pao", chance: 0.1 }, { id: "gh_yupo_zhu", chance: 0.1 }, { id: "gh_lengyue_fu", chance: 0.1 }, { id: "pet_yutu", chance: 0.05 }, { id: "mingqi_guanghan_yuepo", chance: 0.08 },
    { id: "gh_hanyuan_jia", chance: 0.03 }, { id: "gh_ningyue_fu", chance: 0.03 }, { id: "mingqi_gh_tianji", chance: 0.02 },
    { id: "gh_taixu_yuyi", chance: 0.008 }, { id: "gh_tiangang_fu", chance: 0.008 },
    { id: "m_taixu_zhenyuan", chance: 0.03 },
  ], desc: "廣寒界的孤高主宰,月魄凝身,清冷絕塵,一舞廣袖便是漫天霜雪。" },
  { id: "boss_kunpeng", name: "鯤鵬殘魂", element: "無", isLord: true, hp: 245_000, atk: 154_000, exp: 850_000, stones: [1_300_000, 2_600_000], drops: [
    { id: "kp_yuren", chance: 0.1 }, { id: "kp_yujia", chance: 0.1 }, { id: "kp_xinzhu", chance: 0.1 }, { id: "kp_pokong_fu", chance: 0.1 }, { id: "pet_kunpeng_chu", chance: 0.05 }, { id: "mingqi_kunpeng_tunan", chance: 0.08 },
    { id: "kp_guixu_jian", chance: 0.03 }, { id: "kp_xingtu_zhu", chance: 0.03 }, { id: "pet_kunpeng_zhenyu", chance: 0.02 },
    { id: "kp_jiutian_ji", chance: 0.008 }, { id: "kp_hundun_zhu", chance: 0.008 }, { id: "pet_kunpeng_zhenshen", chance: 0.005 },
    { id: "m_jiutian_huoyu", chance: 0.03 },
  ], desc: "鯤鵬遺骸深處未散的殘魂,一化為魚、一化為鳥,殘魂雖淡,神威不減當年。" },

  // ── 金源仙域(雲遊探索秘境解鎖,強度為北寒 50 倍,五重仙關) ──
  { id: "jy_taiyimang", name: "滄瓓金蟒", element: "金", hp: 6_845_070, atk: 52_500, exp: 0, stones: [2_400_000, 4_800_000], drops: [{ id: "xianyuan_huichun", chance: 0.05 }, { id: "jy_duanjin_dao", chance: 0.04 }, { id: "jinyuan_suipian", chance: 0.1 }, { id: "jinyuan_shenglian", chance: 0.12 }, { id: "tianxiandan", chance: 0.06 }, { id: "xiantian_qi", chance: 0.0125 }, { id: "xiantian_zaohuadan", chance: 0.006 }, { id: "blueprint_jishen", chance: 0.04 }, { id: "blueprint_xisui", chance: 0.04 }, { id: "xingpan_jin", chance: 0.08 }], desc: "金源仙域第一重仙關的守關凶獸,通體金鱗,吞吐太乙金光。" },
  { id: "jy_huntianyuan", name: "混天靈猿", element: "土", hp: 12_287_740, atk: 70_000, exp: 0, stones: [3_300_000, 6_600_000], drops: [{ id: "jiuzhuan_xianlu", chance: 0.03 }, { id: "jy_lingzhu", chance: 0.05 }, { id: "jinyuan_suipian", chance: 0.1 }, { id: "jinyuan_shenglian", chance: 0.12 }, { id: "tianxiandan", chance: 0.06 }, { id: "jy_hunyuan", chance: 0.03 }, { id: "xiantian_zaohuadan", chance: 0.006 }, { id: "blueprint_hunyuanjia", chance: 0.04 }, { id: "blueprint_ningxian", chance: 0.04 }, { id: "xingpan_mu", chance: 0.08 }], desc: "第二重仙關的洪荒靈猿,雙臂撼動仙山,一吼震碎虛空。" },
  { id: "jy_bahuang", name: "八荒火麒麟", element: "火", hp: 9_697_633, atk: 91_000, exp: 0, stones: [4_500_000, 9_000_000], drops: [{ id: "xianyuan_huichun", chance: 0.05 }, { id: "jy_chiyan_fu", chance: 0.04 }, { id: "jinyuan_shenglian", chance: 0.12 }, { id: "tianxiandan", chance: 0.065 }, { id: "jy_taiyi", chance: 0.02 }, { id: "xiantian_zaohuadan", chance: 0.006 }, { id: "blueprint_hudao", chance: 0.04 }, { id: "xingpan_huo", chance: 0.08 }, { id: "jinyuan_suipian", chance: 0.1 }], desc: "第三重仙關的火之瑞獸,八荒業火加身,焚盡一切仙靈。" },
  { id: "jy_wujizhu", name: "無極金蛛", element: "金", hp: 16_356_228, atk: 91_000, exp: 0, stones: [6_600_000, 13_200_000], drops: [{ id: "jiuzhuan_xianlu", chance: 0.03 }, { id: "jinyuan_shenglian", chance: 0.12 }, { id: "tianxiandan", chance: 0.07 }, { id: "blueprint_taixu", chance: 0.15 }, { id: "xiantian_zaohuadan", chance: 0.006 }, { id: "xingpan_shui", chance: 0.08 }, { id: "jinyuan_suipian", chance: 0.1 }], desc: "第四重仙關的太古金蛛,無極金絲織天羅,仙人亦難掙脫。" },
  // 第五重仙關:金源仙帝身側的兩名護法仙使,實力較仙帝稍弱,守關時與仙帝一同鎮守
  { id: "jy_suijin", name: "金源仙使 - 歲金", element: "金", hp: 18_974_719, atk: 59_801, exp: 0, stones: [6_000_000, 11_400_000], drops: [{ id: "jinyuan_suipian", chance: 0.1 }, { id: "jinyuan_shenglian", chance: 0.12 }, { id: "tianxiandan", chance: 0.06 }, { id: "xiantian_qi", chance: 0.02 }, { id: "xiantian_zaohuadan", chance: 0.006 }, { id: "blueprint_zhuxian", chance: 0.05 }, { id: "xingpan_tu", chance: 0.08 }], desc: "第五重仙關的護法仙使,執掌歲月金流,金光流轉間可鎮壓一方時序。" },
  { id: "jy_ruijin", name: "金源仙使 - 銳金", element: "金", hp: 19_731_228, atk: 67_288, exp: 0, stones: [7_200_000, 12_600_000], drops: [{ id: "jinyuan_suipian", chance: 0.1 }, { id: "jinyuan_shenglian", chance: 0.12 }, { id: "tianxiandan", chance: 0.06 }, { id: "xiantian_qi", chance: 0.02 }, { id: "xiantian_zaohuadan", chance: 0.006 }, { id: "blueprint_zaohuajian", chance: 0.05 }], desc: "第五重仙關的護法仙使,鋒銳金氣凝形為刃,一擊可裂山斷嶽。" },
  { id: "lord_jinyuan", name: "金源仙帝 - 歐陽白", element: "金", isLord: true, hp: 44_655_165, atk: 154_000, exp: 0, stones: [28_000_000, 56_000_000], drops: [{ id: "jinyuan_suipian", chance: 0.1 }, { id: "jinyuan_shenglian", chance: 0.12 }, { id: "tianxiandan", chance: 0.1 },{ id: "zengyuandan", chance: 0.015 }, { id: "blueprint_xisui", chance: 0.04 },{id:"panlongtaoshu",chance:0.3}, { id: "jinhundan", chance: 0.1 }, { id: "fu_taixu", chance: 0.2 }, { id: "pet_hundun", chance: 0.05 }, { id: "m_hunyuan", chance: 0.05 }, { id: "xiantian_zaohuadan", chance: 0.04 }], desc: "金源仙域的無上仙帝,坐鎮第五重仙關,金源之力冠絕仙庭,一指鎮壓億萬里山河。" },

  // ── 雲遊四海際遇 · 金仙境超級大 BOSS(1% 機率遭遇) ──
  { id: "jinxian", name: "太上金仙 · 無極道君", element: "金", isLord: true, hp: 9_632_067, atk: 132_000, exp: 0, stones: [400_000, 700_000], drops: [{ id: "tianxiandan", chance: 0.3 },{ id: "zengyuandan", chance: 0.05 }, { id: "jinhundan", chance: 0.25 }, { id: "xiantian_qi", chance: 0.125 }, { id: "zenglingzhu", chance: 1 }, { id: "m_taiqing", chance: 0.08 }], desc: "傳說中超脫真仙、位列金仙的道君,一縷神念便可鎮壓一域。雲遊四海時萬中無一得見,斬之者必得無上機緣。" },

  // ── 浮屠塔 · 幻象太歲天尊(每層氣血 ×1.4、攻擊 ×1.1,無盡挑戰;基準為第 1 層) ──
  { id: "huanxiang_taisui", name: "幻象太歲天尊", element: "土", isLord: true, hp: 555_492, atk: 154_000, exp: 0, stones: [0, 0], drops: [], desc: "金源仙域浮屠塔中的幻象化身,層層皆是同一尊,卻一層強似一層——每登一層,其氣血便更加厚重,永無止境。傳說登臨絕頂者,可窺見那真正的太歲天尊。" },

  // ── 蠻荒異界(集滿五色異星盤解鎖):攻擊不烈,生命堅韌無匹(金源仙域平均生命力 15 倍) ──
  // 天狐領地
  { id: "chiwei_huyao", name: "赤尾狐妖", element: "火", hp: 74_338_566, atk: 80_000, exp: 0, stones: [8_000_000, 15_000_000], drops: [{ id: "manhuang_lingsui", chance: 0.12 }, { id: "tianxiandan", chance: 0.045 }, { id: "xiantian_qi", chance: 0.02 }, { id: "poshou_jinhow", chance: 0.05 }, { id: "xuantian_canpian", chance: 0.05 }, { id: "manhuang_yungu", chance: 0.08 }], desc: "天狐領地的尋常妖狐,赤尾生焰,身法飄忽卻不擅強攻。" },
  { id: "baimei_huxian", name: "白眉狐仙", element: "火", hp: 78_933_079, atk: 104_000, exp: 0, stones: [7_500_000, 14_000_000], drops: [{ id: "manhuang_yungu", chance: 0.08 }, { id: "manhuang_lingsui", chance: 0.12 }, { id: "tianxiandan", chance: 0.045 }, { id: "xiantian_qi", chance: 0.02 }, { id: "poshou_jinhow", chance: 0.05 }, { id: "xuantian_canpian", chance: 0.05 }], desc: "天狐領地的修行狐仙,眉生白毫,性狡而不善近戰。" },
  { id: "jiuwei_huxiu", name: "九尾靈狐", element: "木", hp: 88_066_095, atk: 104_000, exp: 0, stones: [8_500_000, 16_000_000], drops: [{ id: "manhuang_yungu", chance: 0.08 }, { id: "manhuang_lingsui", chance: 0.12 }, { id: "tianxiandan", chance: 0.045 }, { id: "xiantian_qi", chance: 0.02 }, { id: "poshou_jinhow", chance: 0.05 }, { id: "xuantian_canpian", chance: 0.05 }], desc: "天狐領地修為較深的狐修,九尾初現,靈氣渾厚。" },
  // 真龍領地
  { id: "chilong_wei", name: "螭龍衛", element: "木", hp: 71_572_109, atk: 82_776, exp: 0, stones: [9_000_000, 17_000_000], drops: [{ id: "taiyi_huanhun", chance: 0.04 }, { id: "manhuang_yungu", chance: 0.08 }, { id: "manhuang_lingsui", chance: 0.12 }, { id: "tianxiandan", chance: 0.045 },{ id: "longjinggu", chance: 0.3 }, { id: "poshou_jinhow", chance: 0.05 },{id:"nimetanti",chance:0.2}, { id: "xiantian_qi", chance: 0.02 },{id:"longlinguo",chance:0.3}, { id: "xuantian_canpian", chance: 0.05 }], desc: "真龍領地巡守的螭龍,鱗甲堅逾玄鐵,防禦遠勝攻伐。" },
  { id: "youlong_shouwei", name: "蚩龍真靈", element: "木", hp: 67_871_418, atk: 104_000, exp: 0, stones: [8_500_000, 16_000_000], drops: [{ id: "manhuang_yungu", chance: 0.08 }, { id: "manhuang_lingsui", chance: 0.12 }, { id: "tianxiandan", chance: 0.045 },{ id: "longjinggu", chance: 0.3 }, { id: "poshou_jinhow", chance: 0.05 },{id:"nimetanti",chance:0.2}, { id: "xiantian_qi", chance: 0.02 },{id:"longlinguo",chance:0.3}, { id: "xuantian_canpian", chance: 0.05 }], desc: "真龍領地初生的幼龍,雖未成年,鱗爪已具龍威。" },
  { id: "longlin_xizu", name: "龍鱗蜥卒", element: "水", hp: 75_259_060, atk: 104_000, exp: 0, stones: [9_500_000, 18_000_000], drops: [{ id: "taiyi_huanhun", chance: 0.04 }, { id: "manhuang_yungu", chance: 0.08 }, { id: "manhuang_lingsui", chance: 0.12 }, { id: "tianxiandan", chance: 0.045 },{ id: "longjinggu", chance: 0.3 }, { id: "poshou_jinhow", chance: 0.05 },{id:"nimetanti",chance:0.2}, { id: "xiantian_qi", chance: 0.02 },{id:"longlinguo",chance:0.3}, { id: "xuantian_canpian", chance: 0.05 }], desc: "真龍領地的蜥形卒兵,渾身龍鱗,列陣巡守龍脈。" },
  // 霸下領地
  { id: "shiling_gui", name: "石靈龜", element: "土", hp: 189_316_095, atk: 60_000, exp: 0, stones: [10_000_000, 19_000_000], drops: [{ id: "manhuang_yungu", chance: 0.08 }, { id: "manhuang_lingsui", chance: 0.12 }, { id: "tianxiandan", chance: 0.045 }, { id: "xiantian_qi", chance: 0.02 }, { id: "poshou_jinhow", chance: 0.05 }, { id: "xuantian_canpian", chance: 0.05 }], desc: "霸下領地的靈龜,通體石甲,行動遲緩卻幾乎不可摧毀。" },
  { id: "wanshi_kuilei", name: "頑石先鋒", element: "土", hp: 19_337_791, atk: 60_000, exp: 0, stones: [10_000_000, 19_000_000], drops: [{ id: "manhuang_yungu", chance: 0.08 }, { id: "manhuang_lingsui", chance: 0.12 }, { id: "tianxiandan", chance: 0.045 }, { id: "xiantian_qi", chance: 0.02 }, { id: "poshou_jinhow", chance: 0.05 }, { id: "xuantian_canpian", chance: 0.05 }], desc: "霸下領地的頑石先鋒,渾身巨岩,行動遲緩、防禦驚人。" },
  { id: "guijia_weishi", name: "厚土玄武", element: "土", hp: 223_468_297, atk: 60_000, exp: 0, stones: [9_500_000, 18_000_000], drops: [{ id: "taiyi_huanhun", chance: 0.04 }, { id: "manhuang_yungu", chance: 0.08 }, { id: "manhuang_lingsui", chance: 0.12 }, { id: "tianxiandan", chance: 0.045 }, { id: "xiantian_qi", chance: 0.02 }, { id: "poshou_jinhow", chance: 0.05 }, { id: "xuantian_canpian", chance: 0.05 }], desc: "霸下領地披甲巡守的衛士,龜甲為胄,刀槍難入。" },
  // 貔貅領地
  { id: "chimu_xiuzai", name: "赤目貅", element: "金", hp: 69_723_534, atk: 60_000, exp: 0, stones: [8_500_000, 16_000_000], drops: [{ id: "manhuang_yungu", chance: 0.08 }, { id: "manhuang_lingsui", chance: 0.12 }, { id: "tianxiandan", chance: 0.045 }, { id: "xiantian_qi", chance: 0.02 }, { id: "poshou_jinhow", chance: 0.05 }, { id: "xuantian_canpian", chance: 0.05 }], desc: "貔貅領地的幼貅,雙目赤紅,貪食靈氣,皮糙肉厚。" },
  { id: "jubao_xiushou", name: "聚寶貅獸", element: "金", hp: 67_871_418, atk: 60_000, exp: 0, stones: [9_000_000, 17_000_000], drops: [{ id: "manhuang_yungu", chance: 0.08 }, { id: "manhuang_lingsui", chance: 0.12 }, { id: "tianxiandan", chance: 0.045 }, { id: "xiantian_qi", chance: 0.02 }, { id: "poshou_jinhow", chance: 0.05 }, { id: "xuantian_canpian", chance: 0.05 }], desc: "貔貅領地嗜財的貅獸,渾身金氣,遇寶必吞。" },
  { id: "yinzhua_xiuwei", name: "銀爪貅衛", element: "金", hp: 72_495_101, atk: 60_000, exp: 0, stones: [9_000_000, 17_000_000], drops: [{ id: "manhuang_yungu", chance: 0.08 }, { id: "manhuang_lingsui", chance: 0.12 }, { id: "tianxiandan", chance: 0.045 }, { id: "xiantian_qi", chance: 0.02 }, { id: "poshou_jinhow", chance: 0.05 }, { id: "xuantian_canpian", chance: 0.05 }], desc: "貔貅領地的護衛貅獸,雙爪泛銀,守衛領地寶藏。" },

  // 蠻荒四大地域王(獵殺時 3%~5% 遭遇),各具專屬異能
  { id: "lord_tianhu", name: "天狐", element: "火", isLord: true, hp: 252_938_360, atk: 176_000, exp: 0, stones: [300_000_000, 600_000_000], drops: [{ id: "huizhi_pojiepan", chance: 0.06 }, { id: "manhuang_lingsui", chance: 0.12 }, { id: "zengyuandan", chance: 0.06 }, { id: "xiantian_qi", chance: 0.2 }, { id: "thantian_lu", chance: 0.0375 }, { id: "poshou_jinhow", chance: 0.5 },{id:"panlongtaoshu",chance:0.3}, { id: "zenglingzhu", chance: 0.5 }, { id: "tianxiandan", chance: 0.09 }, { id: "taiyi_jinghun_tianhu", chance: 0.12 }, { id: "xuantian_canpian", chance: 0.3 }, { id: "m_jiuxiao_leihuo", chance: 0.02 }], desc: "天狐領地之主,身法通神,戰時有三成機率身形一晃、憑空避過攻擊。" },
  { id: "lord_zhenlong", name: "真龍", element: "木", isLord: true, hp: 298_743_685, atk: 176_000, exp: 0, stones: [300_000_000, 600_000_000], drops: [{ id: "huizhi_pojiepan", chance: 0.06 }, { id: "manhuang_lingsui", chance: 0.12 }, { id: "zengyuandan", chance: 0.06 }, { id: "jinhundan", chance: 0.03 }, { id: "thantian_lu", chance: 0.0375 }, { id: "poshou_jinhow", chance: 0.5 },{id:"panlongtaoshu",chance:0.3}, { id: "xiantian_qi", chance: 0.125 }, { id: "zenglingzhu", chance: 0.5 }, { id: "tianxiandan", chance: 0.09 }, { id: "taiyi_jinghun_zhenlong", chance: 0.12 }, { id: "xuantian_canpian", chance: 0.35 }], desc: "真龍領地之主,龍血偶爾狂暴,兩成機率一擊爆發三倍攻擊之力。" },
  { id: "lord_baxia", name: "霸下", element: "土", isLord: true, hp: 3_333_333_332, atk: 176_000, exp: 0, stones: [400_000_000, 800_000_000], drops: [{ id: "huizhi_pojiepan", chance: 0.06 }, { id: "manhuang_lingsui", chance: 0.12 }, { id: "zengyuandan", chance: 0.06 },{id:"nimetanti",chance:0.8}, { id: "thantian_lu", chance: 0.045 }, { id: "xiantian_qi", chance: 0.15 },{id:"panlongtaoshu",chance:0.3}, { id: "zenglingzhu", chance: 0.5 }, { id: "tianxiandan", chance: 0.1 }, { id: "taiyi_jinghun_baxia", chance: 0.12 }, { id: "xuantian_canpian", chance: 0.35 }], desc: "霸下領地之主,龍生九子之一,以馱負洪荒著稱——氣血堅韌至極,乃尋常妖獸的四十倍。" },
  { id: "lord_pixiu", name: "黑眼貔貅", element: "金", isLord: true, hp: 27_155_165, atk: 176_000, exp: 0, stones: [300_000_000, 600_000_000], drops: [{ id: "huizhi_pojiepan", chance: 0.06 }, { id: "qiankun_dai", chance: 0.08 }, { id: "manhuang_lingsui", chance: 0.12 }, { id: "zengyuandan", chance: 0.06 }, { id: "xiantian_qi", chance: 0.2 }, { id: "thantian_lu", chance: 0.0375 }, { id: "poshou_jinhow", chance: 0.5 },{id:"panlongtaoshu",chance:0.3}, { id: "zenglingzhu", chance: 0.5 }, { id: "tianxiandan", chance: 0.09 }, { id: "taiyi_jinghun_pixiu", chance: 0.12 }, { id: "xuantian_canpian", chance: 0.35 }], desc: "貔貅領地之主,雙目幽黑,戰時可封鎖敵人法力波動,令其法術盡數失效,唯有以法器相搏。" },
  // ═══ 4.2 版:大乘期菁英小 BOSS ═══
  // 每處 8 階靈界秘境各一隻,獵殺時 12% 機率取代一般妖獸現身(地域王判定之後)。原始數值約為該地最強一般妖獸的
  // 氣血 ×2.2、攻擊 ×7.7(大乘期玩家氣血極厚,攻擊要夠高才打得痛),修為/靈石 ×4;各有一項特技(閃避或三倍重擊,見 engine.ts 的 MONSTER_DODGE_CHANCE /
  // MONSTER_TRIPLE_ATK_CHANCE)。氣血同樣套用 8 階妖獸的所有倍率。
  { id: "elite_leizun", name: "紫霄雷尊 · 渡劫殘魂", element: "金", elite: true, hp: 1_139_062, atk: 43_524, exp: 1_960_000, stones: [48_000, 96_000], drops: [{ id: "zenglingzhu", chance: 0.3 }], desc: "飛昇台上渡劫失敗的修士殘魂,怨念與天雷相融,化作紫霄雷尊——雷劫重擊兩成機率三倍傷害。" },
  { id: "elite_yujiang", name: "穿雲羽將 · 天霄", element: "金", elite: true, hp: 934_031, atk: 43_524, exp: 1_320_000, stones: [38_000, 76_000], drops: [{ id: "zenglingzhu", chance: 0.3 }], desc: "飛靈族天霄城最年輕的羽將,身法如雲中電光,四分之一的攻擊都會被他閃過。" },
  { id: "elite_zhanzun", name: "裂角戰尊 · 蠻獄", element: "金", elite: true, hp: 1_054_771, atk: 43_524, exp: 1_520_000, stones: [44_000, 88_000], drops: [{ id: "zenglingzhu", chance: 0.3 }], desc: "角蚩族蠻獄的鬥場之王,斷角猶在、凶性不減,兩成機率一擊三倍。" },
  { id: "elite_baidu", name: "無面擺渡人 · 冥河", element: "水", elite: true, hp: 981_871, atk: 43_524, exp: 1_400_000, stones: [40_000, 80_000], drops: [{ id: "zenglingzhu", chance: 0.3 }], desc: "冥河上沒有臉的擺渡人,只渡亡魂,不渡生人——身形飄忽,四分之一的攻擊穿身而過。" },
  { id: "elite_mojun", name: "赤瞳魔君 · 血獄", element: "無", elite: true, hp: 1_139_062, atk: 43_524, exp: 1_680_000, stones: [48_000, 96_000], drops: [{ id: "zenglingzhu", chance: 0.3 }], desc: "地血族血獄深處的魔君,雙瞳赤紅如血池,嗜殺成性,兩成機率三倍血爪。" },
  { id: "elite_longwei", name: "孽鱗龍衛 · 九龍獄", element: "木", elite: true, hp: 1_256_385, atk: 43_524, exp: 1_920_000, stones: [58_000, 116_000], drops: [{ id: "zenglingzhu", chance: 0.35 }], desc: "九龍獄中墮落的龍族守衛,逆鱗倒生,鱗甲滑不留手,兩成攻擊被鱗片偏開。" },
  { id: "elite_luzhu", name: "焚元爐主 · 天鼎宮", element: "金", elite: true, hp: 1_887_426, atk: 43_524, exp: 2_000_000, stones: [64_000, 128_000], drops: [{ id: "zenglingzhu", chance: 0.4 }], desc: "天鼎宮古鼎的爐主,以修士元神為薪柴,鼎火一沸便是一成五機率的三倍焚元。" },

  // ── 真魔界(3.19 版新增):雲遊探索隨機解鎖(比照 jinyuanUnlocked),真仙專屬,採集時有機率
  // 觸發「洗煞池」清空煞氣(見 engine.ts 的 gather case) ──
  { id: "zm_moying", name: "魔影使徒", element: "火", hp: 180_000_000, atk: 90_000, exp: 700_000, stones: [800_000, 1_600_000], drops: [{ id: "taiyi_huanhun", chance: 0.03 }, { id: "jiuzhuan_xianlu", chance: 0.05 }, { id: "zhenmo_jingxue", chance: 0.4 }, { id: "tianxiandan", chance: 0.05 }], desc: "真魔界游蕩的魔影使徒,通體漆黑,唯雙眼赤紅如炬。" },
  { id: "zm_xueyan", name: "血眼魔卒", element: "水", hp: 200_000_000, atk: 100_000, exp: 750_000, stones: [850_000, 1_700_000], drops: [{ id: "jiuzhuan_xianlu", chance: 0.05 }, { id: "zhenmo_jingxue", chance: 0.4 }, { id: "zengyuandan", chance: 0.02 }], desc: "真魔界的血眼魔卒,嗜血成性,見血則狂。" },
  { id: "zm_heilong", name: "黑淵魔獸", element: "土", hp: 230_000_000, atk: 110_000, exp: 800_000, stones: [900_000, 1_800_000], drops: [{ id: "jiuzhuan_xianlu", chance: 0.05 }, { id: "zhenmo_jingxue", chance: 0.45 }, { id: "tianxiandan", chance: 0.06 }], desc: "真魔界深淵爬出的魔獸,渾身漆黑,力大無窮。" },
  // 真魔之門守關 BOSS(5.0 版):雲遊秘境尋得真魔門令後,於儲物袋「進入秘境」挑戰;擊敗才開啟真魔界,
  // 落敗門令保留可再戰,但煞氣 +2500。特性:免疫燒傷/中毒(魔鱗不侵)、閃避、三倍重擊、水屬性冰封、無視五行相剋
  { id: "zm_mingling_gulong", name: "冥翎天魔古龍", element: "水", isLord: true, ignoresCounters: true, hp: 300_000_000, atk: 150_000, exp: 0, stones: [30_000_000, 60_000_000], drops: [{ id: "zhenmo_jingxue", chance: 1 }, { id: "mieshadan", chance: 0.5 }, { id: "tianxiandan", chance: 0.3 }], desc: "盤踞真魔之門的上古魔龍,羽翼如冥夜垂天,鱗甲浸透萬載魔氣,吐息之間寒霜凝結。" },

  // ── 灰仙界(3.19 版新增):集滿五色異星盤 + 灰質破界盤方能開啟,怪物完全無視五行相剋(ignoresCounters),
  // 數值遠高於蠻荒異界,呼應「非常強大」 ──
  { id: "hx_wangling_shazhe", name: "亡靈煞者", element: "木", ignoresCounters: true, hp: 314_887_500, atk: 86_400, exp: 3_000_000, stones: [4_000_000, 8_000_000], drops: [{ id: "taiyi_huanhun", chance: 0.04 }, { id: "hx_lueshi_dao", chance: 0.02 }, { id: "mingqi_hx_shawen", chance: 0.015 }], desc: "灰仙界游蕩的亡靈煞者,通體煞氣繚繞,不分五行,見者皆傷。" },
  { id: "hx_kulou_jiangshi", name: "骷髏煞屍", element: "金", ignoresCounters: true, hp: 315_646_875, atk: 136_200, exp: 3_200_000, stones: [4_200_000, 8_400_000], drops: [{ id: "taiyi_huanhun", chance: 0.04 }, { id: "hx_shaying_pao", chance: 0.02 }, { id: "pet_youling_shou", chance: 0.01 }], desc: "灰仙界的骷髏煞屍,森森白骨浸滿煞氣,刀劍難傷。" },
  { id: "hx_youhun_shazu", name: "幽魂煞祖", element: "水", ignoresCounters: true, hp: 316_406_250, atk: 174_000, exp: 3_400_000, stones: [4_400_000, 8_800_000], drops: [{ id: "taiyi_huanhun", chance: 0.04 }, { id: "hx_shihun_zhu", chance: 0.02 }], desc: "灰仙界的幽魂煞祖,幽冥之氣與煞氣交織,無視生死界線。" },
  { id: "hx_yanmo_shahou", name: "炎魔煞猴", element: "火", ignoresCounters: true, hp: 367_790_625, atk: 175_800, exp: 3_600_000, stones: [4_600_000, 9_200_000], drops: [{ id: "hx_mieshi_fu", chance: 0.02 }], desc: "灰仙界的炎魔煞猴,煞焰纏身,一擊便是灰燼漫天。" },
  { id: "hx_tumo_shaxiang", name: "土魔煞象", element: "土", ignoresCounters: true, hp: 403_987_500, atk: 177_600, exp: 3_800_000, stones: [4_800_000, 9_600_000], drops: [{ id: "m_shaqi_yidao", chance: 0.03 }, { id: "m_shashen_xibo", chance: 0.03 }], desc: "灰仙界的土魔煞象,體型龐大,煞氣凝重如山。" },
  { id: "hx_heiyu_shalong", name: "黑域煞龍", element: "煞", ignoresCounters: true, hp: 663_693_750, atk: 230_400, exp: 4_200_000, stones: [5_200_000, 10_400_000], drops: [{ id: "m_heiyu_shashi", chance: 0.03 }, { id: "m_shahai_wushuang", chance: 0.03 }, { id: "hx_youming_kai", chance: 0.015 }], desc: "灰仙界黑域深處的煞龍,通體漆黑,煞氣凝形為鱗。" },
  { id: "hx_mingyu_shahuang", name: "冥獄煞星", element: "煞", ignoresCounters: true, hp: 822_150_000, atk: 307_200, exp: 4_600_000, stones: [5_600_000, 11_200_000], drops: [{ id: "m_mieshi_shazun", chance: 0.03 }, { id: "hx_miehun_zhu", chance: 0.015 }, { id: "hx_zhongyan_fu", chance: 0.015 }], desc: "灰仙界冥獄之中的煞皇,俯視眾生,煞氣即是其權柄。" },
  { id: "lord_huixian", name: "灰皇", element: "煞", isLord: true, ignoresCounters: true, hp: 4_905_000_000, atk: 441_600, exp: 0, stones: [20_000_000, 40_000_000], drops: [{ id: "hx_mieshi_zhanling_dao", chance: 0.05 }, { id: "pet_hx_shashou", chance: 0.03 }, { id: "mingqi_hx_mieshi", chance: 0.03 }, { id: "kp_hundun_zhu", chance: 0.02 }], desc: "灰仙界的無上主宰,渾身煞氣自成天地,五行於祂而言不過是虛妄的表象。" },
];



export const LOCATIONS: Location[] = [
  // 天南
  {
    id: "caiyaoshan", name: "彩霞山", region: "tiannan", reqStage: 1,
    desc: "黃楓谷外圍靈山,雲霞繚繞,是低階弟子採藥練手之地。",
    monsters: ["shulang", "qinglang", "cuiyunyan"],
    materials: ["tiekuang", "qingyunshi"], herbs: ["huanglongcao", "zijinhua"],
    manualChance: 0.02, manuals: ["m_hanbing"],
  },
  {
    id: "heifengling", name: "黑風嶺", region: "tiannan", reqStage: 1,
    desc: "妖獸出沒的荒嶺,黑風終年不歇,常有修士在此隕落。",
    monsters: ["qinglang", "tiejiachong", "hanshuimang", "cuiyunyan"],
    materials: ["tiekuang", "qingmu"], herbs: ["huanglongcao", "xuelingzhi"],
    manualChance: 0.03, manuals: ["m_liehuo"],
  },
  {
    id: "hantan", name: "萬年寒潭", region: "tiannan", reqStage: 2,
    desc: "深不見底的寒潭,潭底藏有寒玉精,亦有寒水蟒盤踞。",
    monsters: ["hanshuimang", "yinhun", "duyanchan"],
    materials: ["hanjing", "yinsha"], herbs: ["zijinhua", "zhuguo"],
    manualChance: 0.04, manuals: ["m_hanbing", "m_dayan"],
  },
  {
    id: "yanhuogu", name: "炎火谷", region: "tiannan", reqStage: 2,
    desc: "地火奔湧的山谷,赤炎火蟒的巢穴,煉器師嚮往的天然火源。",
    monsters: ["huomang", "shiyan", "huoyanju"],
    materials: ["huoyu", "wenyu"], herbs: ["zhuguo", "xuelingzhi"],
    manualChance: 0.04, manuals: ["m_liehuo", "m_qingzhufeng"],
  },
  {
    id: "leizhulin", name: "雷鳴竹林", region: "tiannan", reqStage: 2,
    desc: "雷霆終年劈落的異竹林,金雷竹的唯一產地,兇險異常。",
    monsters: ["leizhujing", "shiyan", "huoyanju"],
    materials: ["jinleizhu", "tiekuang"], herbs: ["zhuguo", "tianlingguo"],
    manualChance: 0.05, manuals: ["m_leidun", "m_jinlei"],
  },
  // 血色禁地
  {
    id: "xuesehe", name: "血色河谷", region: "jindi", reqStage: 3,
    desc: "赤紅河水奔流的裂谷,血蛟出沒,河底沉著歷代闖禁者的儲物袋。",
    monsters: ["xuejiao", "shengui", "xuewuzhu"],
    materials: ["jiaolin", "yinsha", "xueyu"], herbs: ["qiannianlingru", "tianlingguo"],
    manualChance: 0.06, manuals: ["m_qingzhufeng", "m_xuantian"],
  },
  {
    id: "jinshoushan", name: "禁獸山古洞", region: "jindi", reqStage: 3,
    desc: "上古禁地深處的古洞,妖王沉眠之所,亦藏無上機緣。",
    monsters: ["guhuolao", "shengui", "kulouwang", "chihuoya"],
    materials: ["yinsha", "jinleizhu"], herbs: ["tianlingguo", "qiannianlingru"],
    manualChance: 0.08, manuals: ["m_jinlei", "m_xuantian"],
  },
  // 亂星海
  {
    id: "waihaidao", name: "外海群島", region: "luanxinghai", reqStage: 4,
    desc: "亂星海外圍的萬千小島,海獸橫行,島上靈藥無人採擷。",
    monsters: ["haimujing", "xingchenguai", "canghaijiao"],
    materials: ["xuantiehan", "xingchengang", "haixinzhu"], herbs: ["ziyuanhua", "qiannianlingru"],
    manualChance: 0.05, manuals: ["m_aohan", "m_dageng"],
  },
  {
    id: "xinggong", name: "星宮遺跡", region: "luanxinghai", reqStage: 4,
    desc: "亂星海之主星宮的廢棄別院,傀儡戰衛仍在巡邏,寶庫無人開啟。",
    monsters: ["xingchenguai", "wangtianhou", "jinyuxie", "youmingzhang"],
    materials: ["xingchengang", "jiaolin"], herbs: ["ziyuanhua", "longlinguo"],
    manualChance: 0.07, manuals: ["m_dageng", "m_aohan"],
  },
  // 大晉
  {
    id: "moyuan", name: "魔淵", region: "dajin", reqStage: 5,
    desc: "大晉北疆的無底深淵,魔氣沖天,魔化修士在淵口徘徊。",
    monsters: ["mohua", "tianlanyao", "moxuejun", "wuxinbagua"],
    materials: ["mojing", "fenghuolin", "moyanjing"], herbs: ["longlinguo", "ziyuanhua"],
    manualChance: 0.06, manuals: ["m_yuanci", "m_sanyan"],
  },
  {
    id: "yinjieliexi", name: "陰界裂隙", region: "dajin", reqStage: 6,
    desc: "陰陽兩界的裂縫,鬼氣如潮。鬼母在此坐鎮,等閒煉虛不敢近前。",
    monsters: ["guimu", "mohua", "youmingfan"],
    materials: ["mojing", "fenghuolin"], herbs: ["huangjitiansui", "longlinguo"],
    manualChance: 0.08, manuals: ["m_sanyan", "m_yuanci"],
  },
  // 靈界
  {
    id: "tianyuancheng", name: "天淵城外圍", region: "lingjie", reqStage: 7, continent: "fengyuan",
    desc: "靈界人族第一雄城之外的莽荒,真靈衛日夜巡弋。",
    monsters: ["zhenlingwei", "gulong", "hunyuanshou", "jiutianfeng"],
    materials: ["longjinggu", "xingchengang", "zhenlingsha", "zhenling_suipian", "tianyuan_yaogu"], herbs: ["huangjitiansui", "longlinguo"],
    manualChance: 0.06, manuals: ["m_zhenlong"],
  },
  {
    id: "feishengtai", name: "飛昇台", region: "lingjie", reqStage: 8, continent: "fengyuan",
    desc: "傳說中溝通仙界之地。天劫雷靈盤踞於此——渡過它,肉身成聖,白日飛昇。",
    monsters: ["tianjie", "gulong", "taixureng"],
    materials: ["longjinggu", "leiling_suixie"], herbs: ["huangjitiansui", "feisheng_yunwu"],
    manualChance: 0.1, manuals: ["m_zhenlong"],
  },
  // 靈界 · 風元大陸(2.14 版新增)
  {
    id: "yeyangcheng", name: "夜叉族夜陽城", region: "lingjie", reqStage: 7, continent: "fengyuan",
    desc: "風元大陸夜叉一族的雄城,城牆赤紅如血,終年風聲呼嘯不絕。",
    monsters: ["yecha_renwei", "yehuo_yecha", "yeyang_yaoji"],
    materials: ["fengyuanjing", "yecha_hunjing", "yeyang_yankuang"], herbs: ["fengren_yeye"],
    manualChance: 0, manuals: [],
  },
  {
    id: "mulingsenlin", name: "木靈森林", region: "lingjie", reqStage: 7, continent: "fengyuan",
    desc: "風元大陸腹地的無盡古林,千年古木參天蔽日,靈氣自成一方天地。",
    monsters: ["tengman_yaojing", "gumu_jingpo", "fengling_die"],
    materials: ["fengyuanjing", "gumu_shupi"], herbs: ["lingmu_xianye", "senlin_lulu"],
    manualChance: 0, manuals: [],
  },
  // 靈界 · 雷鳴大陸(2.14 版新增)
  {
    id: "tianxiaocheng", name: "飛靈族天霄城", region: "lingjie", reqStage: 8, continent: "leiming",
    desc: "雷鳴大陸雲霄之上的飛靈族城池,終年雷雲環繞,城樓隱於九霄雷海之中。",
    monsters: ["tianxiao_pengwei", "jifeng_lingshi", "xiaohan_jianling"],
    materials: ["leimingshi", "feiling_yumao"], herbs: ["tianxiao_yunqi"],
    manualChance: 0, manuals: [],
  },
  {
    id: "jiaomanyu", name: "角蚩族角蠻獄", region: "lingjie", reqStage: 8, continent: "leiming",
    desc: "雷鳴大陸地底的角蚩一族刑獄,雷角妖獸列陣看守,鎖鏈聲不絕於耳。",
    monsters: ["jiaochi_manbing", "leijiao_mojiang", "manyu_suohunshi"],
    materials: ["leimingshi", "jiaochi_tiesui", "jiaoman_suolian", "manyu_xueshi"], herbs: [],
    manualChance: 0, manuals: [],
  },
  {
    id: "minghezhidi", name: "蜉蝣族冥河之地", region: "lingjie", reqStage: 8, continent: "leiming",
    desc: "雷鳴大陸邊境的幽冥之河,蜉蝣一族世代擺渡亡魂,河水終年不見天日。",
    monsters: ["minghe_fuyou", "youming_chuanfu", "wanghun_shiling"],
    materials: ["minghesha", "fuyou_chibang"], herbs: ["minghe_shuizao"],
    manualChance: 0, manuals: [],
  },
  // 靈界 · 血天大陸(2.14 版新增,九龍獄/天鼎宮尤為兇險特殊)
  {
    id: "dixue_xueyu", name: "地血族血獄", region: "lingjie", reqStage: 8, continent: "xuetian",
    desc: "血天大陸地血一族的煉獄之地,終年血雨,大地赤紅如染。",
    monsters: ["xueyu_xingtu", "shixue_xiuluo", "dixue_moling"],
    materials: ["dixuejing", "xueyu_yansha"], herbs: ["dixue_caogen"],
    manualChance: 0, manuals: [],
  },
  {
    id: "jiulongyu", name: "九龍獄", region: "lingjie", reqStage: 8, continent: "xuetian",
    desc: "血天大陸深處鎮壓歷代凶靈的無底獄淵,九龍鎖柱矗立獄中,偶有墮落真仙馬良現身,兇險莫測。",
    monsters: ["longyu_kanshou", "suolong_shawei"], lordId: "duoluo_zhenxian_maliang",
    materials: ["longyu_linjia", "jiulong_suoshi", "longyu_yinhuo"], herbs: [],
    manualChance: 0, manuals: [],
  },
  {
    id: "tiandinggong", name: "天鼎宮", region: "lingjie", reqStage: 8, continent: "xuetian",
    desc: "血天大陸最深處的上古宮闕,九座巨鼎鎮守其中,虛天鼎、虛皇鼎皆藏於此。",
    monsters: ["tianding_shouwei", "tianding_zhishi"],
    materials: ["tianding_suipian", "tianding_linghuo"], herbs: [],
    manualChance: 0, manuals: [],
  },
  // 北寒仙域(真仙專屬)
  {
    id: "xuanbing_yuan", name: "玄冰仙原", region: "beihan", reqStage: 10,
    desc: "萬載玄冰鋪成的無垠雪原,仙獸出沒,先天之氣氤氳。唯真仙可久留。",
    monsters: ["bh_hanjiao", "bh_hanpeng", "bh_binghun"],
    materials: [], herbs: [],
    manualChance: 0, manuals: [],
  },
  {
    id: "beihan_dian", name: "北寒仙殿", region: "beihan", reqStage: 10,
    desc: "仙域最深處的巍峨冰殿,北寒仙尊端坐其中,先天仙器懸於九霄。",
    monsters: ["bh_hanpeng", "bh_hanjiao", "bh_xuanwu", "bh_hanlong"],
    materials: [], herbs: [],
    manualChance: 0, manuals: [],
  },
  // 金源仙域(五重仙關,雲遊探索秘境解鎖;1.6 版起每重皆可採得高階材料)
  {
    id: "jy_guan1", name: "金源仙關 · 第一重", region: "jinyuan", reqStage: 10,
    desc: "金源仙域的第一道仙關,滄瓓金蟒盤踞關前,金光耀目。",
    monsters: ["jy_taiyimang"],
    materials: ["jinyuan_lingsha", "jinyuan_shenglian"], herbs: [],
    manualChance: 0, manuals: [],
  },
  {
    id: "jy_guan2", name: "金源仙關 · 第二重", region: "jinyuan", reqStage: 10,
    desc: "洪荒靈猿鎮守的第二重仙關,力撼仙山。",
    monsters: ["jy_huntianyuan"],
    materials: ["jinyuan_lingsha", "taiyi_jingjin", "jinyuan_shenglian"], herbs: [],
    manualChance: 0, manuals: [],
  },
  {
    id: "jy_guan3", name: "金源仙關 · 第三重", region: "jinyuan", reqStage: 10,
    desc: "八荒業火燃遍的第三重仙關,火麒麟橫亙其中。",
    monsters: ["jy_bahuang"],
    materials: ["taiyi_jingjin", "jinyuan_shenglian"], herbs: [],
    manualChance: 0, manuals: [],
  },
  {
    id: "jy_guan4", name: "金源仙關 · 第四重", region: "jinyuan", reqStage: 10,
    desc: "無極金絲織成的第四重天羅,金蛛藏於其中。",
    monsters: ["jy_wujizhu"],
    materials: ["jinyuan_lingsha", "taiyi_jingjin", "jinyuan_shenglian"], herbs: [],
    manualChance: 0, manuals: [],
  },
  {
    id: "jy_guan5", name: "金源仙關 · 第五重", region: "jinyuan", reqStage: 10,
    desc: "金源仙域最深的第五重仙關,金源仙帝坐鎮於此,睥睨萬古,兩名護法仙使巡弋左右。",
    monsters: ["jy_suijin", "jy_ruijin"],
    materials: ["jinyuan_lingsha", "taiyi_jingjin", "jinyuan_shenglian"], herbs: [],
    manualChance: 0, manuals: [],
  },
  // 蠻荒異界(集滿五色異星盤解鎖,四大領地各有專屬地域王)
  {
    id: "manhuang_tianhu", name: "天狐領地", region: "manhuang", reqStage: 10,
    desc: "赤焰漫野的荒原,狐影穿梭其間,天狐坐鎮此地。",
    monsters: ["chiwei_huyao", "baimei_huxian", "jiuwei_huxiu"], lordId: "lord_tianhu",
    materials: ["manhuang_lingsui"], herbs: [],
    manualChance: 0, manuals: [],
  },
  {
    id: "manhuang_zhenlong", name: "真龍領地", region: "manhuang", reqStage: 10,
    desc: "雲霧繚繞的龍脈之地,螭龍巡弋守衛,真龍盤踞於此。",
    monsters: ["chilong_wei", "youlong_shouwei", "longlin_xizu"], lordId: "lord_zhenlong",
    materials: ["manhuang_lingsui"], herbs: [],
    manualChance: 0, manuals: [],
  },
  {
    id: "manhuang_baxia", name: "霸下領地", region: "manhuang", reqStage: 10,
    desc: "巨石遍布的荒丘,靈龜緩行其上,霸下馱負此方大地。",
    monsters: ["shiling_gui", "wanshi_kuilei", "guijia_weishi"], lordId: "lord_baxia",
    materials: ["manhuang_lingsui"], herbs: [],
    manualChance: 0, manuals: [],
  },
  {
    id: "manhuang_pixiu", name: "貔貅領地", region: "manhuang", reqStage: 10,
    desc: "靈氣氤氳的聚寶荒野,貅仔成群覓食,黑眼貔貅坐鎮於此。",
    monsters: ["chimu_xiuzai", "jubao_xiushou", "yinzhua_xiuwei"], lordId: "lord_pixiu",
    materials: ["manhuang_lingsui"], herbs: [],
    manualChance: 0, manuals: [],
  },
  // 真魔界(3.19 版新增,雲遊探索隨機解鎖):採集時額外有機率觸發「洗煞池」清空煞氣,見 engine.ts 的 gather case
  {
    id: "zhenmo_yuan", name: "真魔淵", region: "zhenmo", reqStage: 10,
    desc: "至暗魔域的核心深淵,魔氣濃烈至極,相傳深處藏有一池能滌淨煞氣的幽泉。",
    monsters: ["zm_moying", "zm_xueyan", "zm_heilong"],
    materials: ["zhenmo_jingxue"], herbs: [],
    manualChance: 0, manuals: [],
  },
  // 灰仙界(3.19 版新增,須集滿五色異星盤+灰質破界盤解鎖)
  {
    id: "huixian_jie", name: "灰仙死域", region: "huixian", reqStage: 10,
    desc: "死寂一片的灰仙界腹地,煞氣瀰漫不散,妖獸皆為煞氣所化,不分五行。",
    monsters: ["hx_wangling_shazhe", "hx_kulou_jiangshi", "hx_youhun_shazu", "hx_yanmo_shahou", "hx_tumo_shaxiang", "hx_heiyu_shalong", "hx_mingyu_shahuang"],
    lordId: "lord_huixian",
    materials: ["taiyi_jingjin"], herbs: [],
    manualChance: 0, manuals: [],
  },
];

export const RECIPES: Recipe[] = [
  { id: "r_qingsuo", result: "qingsuo", name: "青索劍", stones: 60, desc: "千年青木心為胎,精鐵為刃。", materials: [{ id: "qingmu", n: 2 }, { id: "tiekuang", n: 3 }] },
  { id: "r_jinjian", result: "jinjian", name: "金光巨劍", stones: 220, desc: "五塊精鐵反覆錘煉,佐以妖丹淬鋒。", materials: [{ id: "tiekuang", n: 5 }, { id: "yaodan", n: 1 }] },
  { id: "r_hanbingzhui", result: "hanbingzhui", name: "寒冰錐", stones: 631, desc: "寒玉精凝形,陰煞定魄。", materials: [{ id: "hanjing", n: 2 }, { id: "yinsha", n: 1 }] },
  { id: "r_huolingqi", result: "huolingqi", name: "火靈旗", stones: 390, desc: "火蟒鱗織旗,妖丹為引。", materials: [{ id: "huoyu", n: 3 }, { id: "yaodan", n: 1 }] },
  { id: "r_hutudun", result: "hutudun", name: "厚土盾", stones: 340, desc: "溫玉為心,精鐵鑲邊。", materials: [{ id: "wenyu", n: 3 }, { id: "tiekuang", n: 2 }] },
  { id: "r_wuguangyi", result: "wuguangyi", name: "烏光甲衣", stones: 1790, desc: "三道陰煞淬鍊軟甲,烏光護體。", materials: [{ id: "yinsha", n: 3 }, { id: "hanjing", n: 1 }] },
  { id: "r_qingzhufengjian", result: "qingzhufengjian", name: "青竹風雲劍", stones: 4180, desc: "以金雷竹為本命劍胎,輔以寒玉、妖丹,煉成可一化為多的絕世飛劍。", materials: [{ id: "jinleizhu", n: 3 }, { id: "hanjing", n: 2 }, { id: "yaodan", n: 3 }] },
  { id: "r_jinganghu", result: "jinganghu", name: "金剛璃甲", stones: 21_200, desc: "蛟龍逆鱗綴以玄天寒鐵,水火不侵。", materials: [{ id: "jiaolin", n: 4 }, { id: "xuantiehan", n: 2 }] },
  { id: "r_dagengjian", result: "dagengjian", name: "大庚劍陣", stones: 33_000, desc: "七十二枚星辰鋼鑄七十二口小劍,以劍陣圖統御。", materials: [{ id: "xingchengang", n: 6 }, { id: "jinleizhu", n: 2 }] },
  { id: "r_fengleichi", result: "fengleichi", name: "風雷翅", stones: 130_000, desc: "天嵐妖鳥翎鱗為骨,魔晶為芯,雷光一閃即百里。", materials: [{ id: "fenghuolin", n: 3 }, { id: "mojing", n: 2 }] },
  { id: "r_sanyanshan", result: "sanyanshan", name: "三焰扇", stones: 280_000, desc: "三色火鳥翎羽合璧,扇骨以星辰鋼鍛成。", materials: [{ id: "fenghuolin", n: 5 }, { id: "xingchengang", n: 3 }, { id: "mojing", n: 3 }] },
  { id: "r_yuancishan", result: "yuancishan", name: "元磁神山", stones: 2_400_000, desc: "以皇極天髓溫養魔晶百日,凝聚元磁之力成山。", materials: [{ id: "mojing", n: 8 }, { id: "huangjitiansui", n: 1 }] },
  { id: "r_zhenlongyin", result: "zhenlongyin", name: "真龍璽", stones: 1_820_000, desc: "真龍精骨刻璽,天髓開光——靈界至寶,渡劫倚仗。", materials: [{ id: "longjinggu", n: 5 }, { id: "huangjitiansui", n: 2 }] },
  // 靈界三大陸配方(2.14 版新增,以風元/雷鳴/血天特產材料煉成)
  { id: "r_fengling_ren", result: "fengling_ren", name: "風靈刃", stones: 45_000, desc: "風元晶引動夜叉魂晶,淬煉成迅疾奪魂的飛刃。", materials: [{ id: "fengyuanjing", n: 4 }, { id: "yecha_hunjing", n: 2 }] },
  { id: "r_mulingjia", result: "mulingjia", name: "木靈藤甲", stones: 42_000, desc: "靈木仙葉與風元晶交織煉成的輕盈藤甲。", materials: [{ id: "lingmu_xianye", n: 4 }, { id: "fengyuanjing", n: 2 }] },
  { id: "r_leiming_zhanjia", result: "leiming_zhanjia", name: "雷鳴戰甲", stones: 95_000, desc: "雷鳴石淬體、角蚩鐵髓為甲,戰時雷光纏身。", materials: [{ id: "leimingshi", n: 5 }, { id: "jiaochi_tiesui", n: 3 }] },
  { id: "r_minghe_lingfu", result: "minghe_lingfu", name: "冥河靈符", stones: 90_000, desc: "冥河沙攜雷鳴石、冥河水藻之力凝成的符籙,亡魂怨氣附刃。", failChance: 0.28, materials: [{ id: "minghesha", n: 4 }, { id: "leimingshi", n: 3 }, { id: "minghe_shuizao", n: 2 }] },
  { id: "r_xuesha_suohunfu", result: "xuesha_suohunfu", name: "血煞鎖魂符", stones: 180_000, desc: "地血晶淬煉、龍獄鱗與九龍鎖石為引,鎖魂攝魄。", reqStage: 8, failChance: 0.32, materials: [{ id: "dixuejing", n: 5 }, { id: "longyu_linjia", n: 2 }, { id: "jiulong_suoshi", n: 2 }] },
  { id: "r_tianding_hufu", result: "tianding_hufu", name: "天鼎護心鏡", stones: 170_000, desc: "天鼎碎片與地血晶合煉的護心至寶,鼎氣護體。", reqStage: 8, materials: [{ id: "tianding_suipian", n: 4 }, { id: "dixuejing", n: 3 }] },
  { id: "r_fengling_suohunfu", result: "fengling_suohunfu", name: "風靈鎖魂符", stones: 50_000, desc: "風元晶、夜叉魂晶與夜陽岩礦三者合煉的鎖魂符籙,風刃裹魂。", failChance: 0.25, materials: [{ id: "fengyuanjing", n: 3 }, { id: "yecha_hunjing", n: 2 }, { id: "yeyang_yankuang", n: 2 }] },
  // 靈界十處秘境補充配方(2.17 版新增,每處秘境至少 2~3 種補充素材,可煉法器/符籙/回氣丹)
  { id: "r_gumu_zhanren", result: "gumu_zhanren", name: "古木戰刃", stones: 40_000, desc: "古木樹皮裹天淵妖骨為胎,佐真靈碎晶淬煉而成的戰刃。", materials: [{ id: "gumu_shupi", n: 4 }, { id: "tianyuan_yaogu", n: 3 }, { id: "zhenling_suipian", n: 2 }] },
  { id: "r_feiling_manxuejian", result: "feiling_manxuejian", name: "飛靈蠻血劍", stones: 85_000, desc: "飛靈羽毛引動蠻獄血石與雷靈碎屑,鑄成的凌厲飛劍。", materials: [{ id: "feiling_yumao", n: 4 }, { id: "manyu_xueshi", n: 3 }, { id: "leiling_suixie", n: 2 }] },
  { id: "r_xueyu_yinhuoren", result: "xueyu_yinhuoren", name: "血獄陰火刃", stones: 150_000, desc: "血獄岩沙淬體、龍獄陰火為引,佐角蠻鎖鏈定魄,煉成的陰寒戰刃。", materials: [{ id: "xueyu_yansha", n: 4 }, { id: "longyu_yinhuo", n: 3 }, { id: "jiaoman_suolian", n: 2 }] },
  { id: "r_tianding_zhenlingchui", result: "tianding_zhenlingchui", name: "天鼎鎮靈鎚", stones: 160_000, desc: "天鼎靈火淬鍊、蜉蝣翅膀輕身,佐天鼎碎片鎮魂,煉成的沉穩巨鎚。", materials: [{ id: "tianding_linghuo", n: 4 }, { id: "fuyou_chibang", n: 3 }, { id: "tianding_suipian", n: 2 }] },
  { id: "r_fengyuan_huiqidan", result: "fengyuan_huiqidan", name: "風元回氣丹", stones: 3000, desc: "飛昇雲霧、風刃夜葉與森林露珠合煉的回氣小丹。", materials: [{ id: "feisheng_yunwu", n: 2 }, { id: "fengren_yeye", n: 2 }, { id: "senlin_lulu", n: 2 }] },
  { id: "r_leiming_huiqidan", result: "leiming_huiqidan", name: "雷鳴回氣丹", stones: 5000, desc: "天霄雲氣佐冥河水藻煉成的回氣小丹。", materials: [{ id: "tianxiao_yunqi", n: 3 }, { id: "minghe_shuizao", n: 2 }] },
  { id: "r_xuetian_huiqidan", result: "xuetian_huiqidan", name: "血天回氣丹", stones: 7000, desc: "地血草根佐九鼎祥雲煉成的回氣小丹。", materials: [{ id: "dixue_caogen", n: 3 }, { id: "jiuding_xiangyun", n: 2 }] },
  // 圖譜解鎖的高階符籙(需妖獸掉落圖譜)
  { id: "r_fu_xuanyin", result: "fu_xuanyin", name: "玄陰噬魂符", stones: 4_000_000, desc: "以魔晶為引,陰煞凝符,大乘修士的攻伐符籙。", dropOnly: true, reqStage: 8, materials: [{ id: "mojing", n: 5 }, { id: "yinsha", n: 8 }] },
  { id: "r_fu_taixu", result: "fu_taixu", name: "太虛混元符", stones: 3_200_000, desc: "仙家符籙,以真龍精骨與皇極天髓為引。", dropOnly: true, reqStage: 10, materials: [{ id: "longjinggu", n: 10 }, { id: "huangjitiansui", n: 5 }] },
  // 金源仙域圖譜解鎖的頂階裝備(1.6 版新增,需先由金源仙域怪物掉落對應圖譜)
  { id: "r_jinyuan_ji", result: "jinyuan_ji", name: "金源戮神戟", stones: 500_000_000, desc: "太乙精金反覆錘煉的戮神長戟,金源之力貫注戟身。", dropOnly: true, reqStage: 10, materials: [{ id: "taiyi_jingjin", n: 4 }, { id: "longjinggu", n: 2 }, { id: "huangjitiansui", n: 1 }] },
  { id: "r_taixu_hunyuanjia", result: "taixu_hunyuanjia", name: "太虛混元甲", stones: 200_000_000, desc: "金源靈砂淬煉的護體重甲,萬法加身。", dropOnly: true, reqStage: 10, materials: [{ id: "jinyuan_lingsha", n: 5 }, { id: "xingchengang", n: 3 }] },
  { id: "r_jinyuan_hujing", result: "jinyuan_hujing", name: "金源護道鏡", stones: 300_000_000, desc: "金源靈砂磨製的護道寶鏡,可映萬法、避凶趨吉。", dropOnly: true, reqStage: 10, materials: [{ id: "jinyuan_lingsha", n: 4 }, { id: "mojing", n: 3 }] },
  { id: "r_zhuxian_fu", result: "zhuxian_fu", name: "誅仙滅魂符", stones: 250_000_000, desc: "太乙精金為引凝成的殺伐仙符,一符出手,誅仙滅魂。", dropOnly: true, reqStage: 10, materials: [{ id: "taiyi_jingjin", n: 3 }, { id: "huangjitiansui", n: 1 }] },
  { id: "r_zaohua_jian", result: "zaohua_jian", name: "造化戮仙劍", stones: 350_000_000, desc: "金源靈砂與太乙精金合煉的造化之劍,劍出無雙。", dropOnly: true, reqStage: 10, materials: [{ id: "taiyi_jingjin", n: 3 }, { id: "jinyuan_lingsha", n: 3 }, { id: "longjinggu", n: 2 }] },
  // 煉丹配方(1.23 版新增,煉器堂併入「煉器＆煉丹」):以靈材 + 靈石 + 壽元煉成丹藥,各境界皆有
  { id: "r_huanglongdan", result: "huanglongdan", name: "黃龍丹", stones: 20, desc: "黃龍草晒乾研磨,加水靈石慢火煉成的補氣丹藥。", lifeCost: 2, materials: [{ id: "huanglongcao", n: 3 }] },
  { id: "r_liaoshangdan", result: "liaoshangdan", name: "療傷丹", stones: 40, desc: "血靈芝搗碎入爐,外敷內服皆可。", lifeCost: 5, materials: [{ id: "xuelingzhi", n: 2 }] },
  { id: "r_huiyuandan", result: "huiyuandan", name: "回元丹", stones: 80, desc: "紫金花萃取靈氣凝丹。", lifeCost: 10, materials: [{ id: "zijinhua", n: 3 }] },
  { id: "r_zhujidan", result: "zhujidan", name: "築基丹", stones: 300, desc: "朱果佐以天靈果溫養而成。", lifeCost: 20, materials: [{ id: "zhuguo", n: 2 }, { id: "tianlingguo", n: 1 }] },
  { id: "r_ningyingdan", result: "ningyingdan", name: "凝嬰丹", stones: 1200, desc: "千年靈乳凝煉,助結丹修士凝結元嬰。", lifeCost: 40, materials: [{ id: "qiannianlingru", n: 2 }] },
  { id: "r_dahuandan", result: "dahuandan", name: "大還丹", stones: 5000, desc: "紫猿花與龍鱗果合煉,起死回生之效。", lifeCost: 80, materials: [{ id: "ziyuanhua", n: 2 }, { id: "longlinguo", n: 1 }] },
  { id: "r_jiuqulingshen", result: "jiuqulingshen", name: "九曲靈參丹", stones: 40_000, desc: "皇極天髓溫養九曲靈參而成。", lifeCost: 160, materials: [{ id: "huangjitiansui", n: 2 }] },
  { id: "r_pojiedan", result: "pojiedan", name: "破界丹", stones: 90_000, desc: "龍鱗果與皇極天髓為引,衝擊大乘瓶頸的無上靈丹。", lifeCost: 320, materials: [{ id: "longlinguo", n: 3 }, { id: "huangjitiansui", n: 1 }] },
  // 真仙專屬煉丹(圖譜解鎖,需金源仙域怪物掉落對應圖譜)
  { id: "r_xisuidan", result: "xisuidan", name: "洗髓丹", stones: 400_000_000, desc: "太乙精金與金源靈砂共煉的洗髓至藥。", dropOnly: true, reqStage: 10, materials: [{ id: "taiyi_jingjin", n: 4 }, { id: "jinyuan_lingsha", n: 4 }] },
  { id: "r_ningxiandan", result: "ningxiandan", name: "凝仙丹", stones: 450_000_000, desc: "金源靈砂反覆淬煉凝成的仙丹。", dropOnly: true, reqStage: 10, materials: [{ id: "jinyuan_lingsha", n: 5 }, { id: "taiyi_jingjin", n: 3 }] },
  // 金源仙域 / 蠻荒異界回復丹藥(1.24 版新增,不需圖譜,真仙以上煉器＆煉丹可直接煉製)
  { id: "r_jinyuan_shengtidan", result: "jinyuan_shengtidan", name: "金源聖體丹", stones: 8_000_000, desc: "金源聖蓮反覆淬煉的聖體奇丹。", lifeCost: 500, reqStage: 10, materials: [{ id: "jinyuan_shenglian", n: 3 }, { id: "jinyuan_lingsha", n: 2 }] },
  { id: "r_manhuang_zhenyuandan", result: "manhuang_zhenyuandan", name: "混沌真元丹", stones: 8_000_000, desc: "蠻荒靈髓合煉的真元奇丹。", lifeCost: 500, reqStage: 10, materials: [{ id: "manhuang_lingsui", n: 3 }, { id: "manhuang_yungu", n: 2 }] },
  { id: "r_taiyi_huiqidan", result: "taiyi_huiqidan", name: "太乙回氣丹", stones: 5_000_000, desc: "金源聖蓮與蠻荒靈髓合煉的回氣奇丹。", lifeCost: 300, reqStage: 10, materials: [{ id: "jinyuan_shenglian", n: 1 }, { id: "manhuang_lingsui", n: 1 }, { id: "taiyi_jingjin", n: 1 }] },
  // 滅煞丹(3.19 版新增):真魔精血調配而成,服下可清空煞氣,無需圖譜,真仙以上可直接煉製
  { id: "r_mieshadan", result: "mieshadan", name: "滅煞丹", stones: 6_000_000, desc: "真魔精血佐以皇極天髓調配的奇丹。", lifeCost: 400, reqStage: 10, materials: [{ id: "zhenmo_jingxue", n: 5 }, { id: "huangjitiansui", n: 2 }] },
];

// 4.2 版:大乘期(8 階)靈界秘境的菁英小 BOSS 出沒表(秘境 id → 菁英妖獸 id)
export const ELITE_SPAWNS: Record<string, string> = {
  feishengtai: "elite_leizun",
  tianxiaocheng: "elite_yujiang",
  jiaomanyu: "elite_zhanzun",
  minghezhidi: "elite_baidu",
  dixue_xueyu: "elite_mojun",
  jiulongyu: "elite_longwei",
  tiandinggong: "elite_luzhu",
};
export const ELITE_SPAWN_CHANCE = 0.12;
