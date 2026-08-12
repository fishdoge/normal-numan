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
];

export const MONSTERS: Monster[] = [
  // ── 天南(一至二階) ──
  { id: "shulang", name: "赤目鼠狼", element: "土", hp: 14, atk: 2, exp: 3, stones: [1, 2], drops: [{ id: "huanglongcao", chance: 0.4 }], desc: "一階最低等妖獸,雙目赤紅,成群出沒。" },
  { id: "qinglang", name: "青背狼", element: "木", hp: 25, atk: 4, exp: 6, stones: [1, 3], drops: [{ id: "qingmu", chance: 0.2 }, { id: "yaodan", chance: 0.1 }], desc: "背生青毛的狼型妖獸,行動迅捷。" },
  { id: "tiejiachong", name: "鐵甲蟲群", element: "金", hp: 32, atk: 5, exp: 8, stones: [1, 4], drops: [{ id: "tiekuang", chance: 0.5 }], desc: "甲殼堅硬如鐵的蟲群,尋常法術難傷。" },
  { id: "hanshuimang", name: "寒水蟒", element: "水", hp: 58, atk: 7, exp: 14, stones: [3, 6], drops: [{ id: "hanjing", chance: 0.3 }, { id: "yaodan", chance: 0.2 }], desc: "潛伏寒潭的巨蟒,吐息成冰。" },
  { id: "huomang", name: "赤炎火蟒", element: "火", hp: 79, atk: 9, exp: 21, stones: [4, 9], drops: [{ id: "huoyu", chance: 0.45 }, { id: "yaodan", chance: 0.25 }], desc: "周身赤鱗燃焰的火蟒,一階頂級妖獸。" },
  { id: "shiyan", name: "石岩傀儡", element: "土", hp: 110, atk: 11, exp: 29, stones: [5, 12], drops: [{ id: "wenyu", chance: 0.35 }], desc: "上古修士遺留的土石傀儡,力大無窮。" },
  { id: "yinhun", name: "陰魂老怪", element: "水", hp: 140, atk: 14, exp: 42, stones: [8, 16], drops: [{ id: "yinsha", chance: 0.5 }, { id: "m_hanbing", chance: 0.02 }], desc: "洞窟深處的陰魂,怨氣沖天,懼火克金。" },
  { id: "leizhujing", name: "金雷竹精", element: "金", hp: 180, atk: 17, exp: 62, stones: [10, 23], drops: [{ id: "jinleizhu", chance: 0.6 }, { id: "m_leidun", chance: 0.02 }], desc: "吸收雷霆成精的金雷竹,周身電光繚繞。" },
  { id: "cuiyunyan", name: "翠雲燕", element: "木", hp: 20, atk: 3, exp: 5, stones: [1, 3], drops: [{ id: "qingmu", chance: 0.25 }, { id: "huanglongcao", chance: 0.2 }], desc: "羽翼翠綠如雲的靈燕,掠地成風,難以捕捉。" },
  { id: "duyanchan", name: "毒眼蟾", element: "水", hp: 95, atk: 10, exp: 25, stones: [4, 10], drops: [{ id: "yaodan", chance: 0.3 }, { id: "yinsha", chance: 0.2 }], desc: "獨目巨蟾,口吐毒霧,潛伏於沼澤陰處。" },
  { id: "huoyanju", name: "火鬃巨犀", element: "火", hp: 165, atk: 16, exp: 55, stones: [9, 20], drops: [{ id: "huoyu", chance: 0.4 }, { id: "wenyu", chance: 0.25 }], desc: "鬃毛燃燒不熄的巨犀,一撞裂石開山。" },
  // ── 血色禁地(結丹級) ──
  { id: "xuejiao", name: "血蛟", element: "水", hp: 600, atk: 68, exp: 220, stones: [36, 84], drops: [{ id: "jiaolin", chance: 0.6 }, { id: "m_qingzhufeng", chance: 0.02 }], desc: "欲化龍而未成的血色蛟龍,盤踞禁地血河。" },
  { id: "shengui", name: "禁地石龜", element: "土", hp: 1000, atk: 78, exp: 310, stones: [48, 110], drops: [{ id: "wenyu", chance: 0.7 }, { id: "qiannianlingru", chance: 0.3 }], desc: "馱著半座山的巨龜,甲上刻滿上古符文。" },
  { id: "guhuolao", name: "古洞樹妖", element: "火", hp: 1600, atk: 110, exp: 500, stones: [96, 190], drops: [{ id: "tianlingguo", chance: 0.5 }, { id: "m_jinlei", chance: 0.02 }, { id: "zhujidan", chance: 0.15 }], desc: "盤踞禁地萬年的妖王,結丹圓滿威壓。" },
  { id: "xuewuzhu", name: "血霧蛛", element: "木", hp: 780, atk: 72, exp: 260, stones: [40, 95], drops: [{ id: "jiaolin", chance: 0.35 }, { id: "qiannianlingru", chance: 0.2 }], desc: "吐血色蛛絲結網的巨蛛,獵物入網頃刻化血。" },
  { id: "kulouwang", name: "枯骨魔將", element: "金", hp: 1250, atk: 95, exp: 400, stones: [70, 150], drops: [{ id: "yinsha", chance: 0.5 }, { id: "m_xuantian", chance: 0.02 }], desc: "禁地枯骨凝聚的魔將,執一柄骨矛,刀槍不入。" },
  { id: "chihuoya", name: "赤火鴉群", element: "火", hp: 900, atk: 88, exp: 340, stones: [55, 130], drops: [{ id: "huoyu", chance: 0.5 }, { id: "tianlingguo", chance: 0.25 }], desc: "遮天蔽日的火鴉群,所過之處林木成炭。" },
  // ── 亂星海(元嬰級) ──
  { id: "haimujing", name: "海母巨鯨", element: "水", hp: 4700, atk: 300, exp: 940, stones: [180, 410], drops: [{ id: "xuantiehan", chance: 0.4 }, { id: "ziyuanhua", chance: 0.3 }], desc: "吞吐海潮的巨鯨,背上寄生著整座珊瑚島。" },
  { id: "xingchenguai", name: "隕星傀儡", element: "金", hp: 7000, atk: 420, exp: 1400, stones: [300, 590], drops: [{ id: "xingchengang", chance: 0.6 }, { id: "m_dageng", chance: 0.02 }], desc: "星宮以隕星之核驅動的戰傀,金光射目。" },
  { id: "wangtianhou", name: "望天吼", element: "木", hp: 11000, atk: 570, exp: 2200, stones: [470, 940], drops: [{ id: "ningyingdan", chance: 0.35 }, { id: "m_aohan", chance: 0.02 }], desc: "仰天長嘯可裂雲海的上古凶獸後裔。" },
  { id: "canghaijiao", name: "滄海蛟龍", element: "水", hp: 6200, atk: 360, exp: 1200, stones: [240, 500], drops: [{ id: "jiaolin", chance: 0.4 }, { id: "xuantiehan", chance: 0.3 }], desc: "亂星海深處的蛟龍,捲起千丈狂濤,吞舟裂島。" },
  { id: "jinyuxie", name: "金羽蠍王", element: "金", hp: 8800, atk: 500, exp: 1800, stones: [380, 760], drops: [{ id: "xingchengang", chance: 0.45 }, { id: "ziyuanhua", chance: 0.25 }], desc: "披金色甲羽的巨蠍,尾刺一擊可洞穿法器。" },
  { id: "youmingzhang", name: "幽冥章魚", element: "水", hp: 9600, atk: 540, exp: 2000, stones: [420, 850], drops: [{ id: "xuantiehan", chance: 0.4 }, { id: "longlinguo", chance: 0.15 }], desc: "萬丈海溝爬出的幽冥巨章,觸手纏繞星辰。" },
  // ── 大晉(化神/煉虛級) ──
  { id: "mohua", name: "魔化修士", element: "火", hp: 34000, atk: 1800, exp: 7700, stones: [1400, 3200], drops: [{ id: "mojing", chance: 0.7 }, { id: "m_yuanci", chance: 0.02 }, { id: "m_fentian_liyu", chance: 0.02 }], desc: "修煉魔功走火入魔的煉虛修士,神智全失,兇性滔天。" },
  { id: "tianlanyao", name: "天嵐妖鳥", element: "火", hp: 61000, atk: 2900, exp: 16000, stones: [2800, 5600], drops: [{ id: "fenghuolin", chance: 0.5 }, { id: "m_sanyan", chance: 0.02 }, { id: "m_jinwu_zhuori", chance: 0.02 }], desc: "風火雙翼遮天蔽日,大晉妖族的圖騰聖獸。" },
  { id: "guimu", name: "鬼母", element: "水", hp: 72000, atk: 3800, exp: 22000, stones: [3800, 7500], drops: [{ id: "huangjitiansui", chance: 0.3 }, { id: "dahuandan", chance: 0.5 }, { id: "wanshoudan", chance: 0.08 }, { id: "m_hanyuan_wanli", chance: 0.02 }], desc: "陰界裂縫爬出的存在,萬鬼朝拜,煉虛巔峰。" },
  { id: "moxuejun", name: "魔血尊者", element: "火", hp: 46000, atk: 2400, exp: 11000, stones: [2000, 4200], drops: [{ id: "mojing", chance: 0.6 }, { id: "longlinguo", chance: 0.2 }, { id: "m_wanteng_tianluo", chance: 0.02 }], desc: "以魔血淬體的煉虛魔修,渾身血氣化甲,力可撼山。" },
  { id: "wuxinbagua", name: "無心霸虎", element: "土", hp: 55000, atk: 3200, exp: 14000, stones: [2500, 5000], drops: [{ id: "fenghuolin", chance: 0.4 }, { id: "huangjitiansui", chance: 0.15 }], desc: "大晉北荒的太古凶虎,雙目無神,只知殺戮。" },
  { id: "youmingfan", name: "幽冥梵僧", element: "金", hp: 68000, atk: 3600, exp: 20000, stones: [3400, 6800], drops: [{ id: "mojing", chance: 0.5 }, { id: "dahuandan", chance: 0.4 }], desc: "墮入魔道的佛宗高僧,誦動地獄梵音,攝人心魂。" },
  // ── 靈界(合體/大乘級) ──
  { id: "zhenlingwei", name: "真靈衛", element: "金", hp: 240000, atk: 11000, exp: 64000, stones: [3000, 6000], drops: [{ id: "longjinggu", chance: 0.4 }, { id: "m_zhenlong", chance: 0.02 }, { id: "m_canghai_niliu", chance: 0.02 }], desc: "靈界天淵城的傀儡戰衛,真靈血脈驅動。" },
  { id: "gulong", name: "上古真龍殘魂", element: "木", hp: 400000, atk: 16000, exp: 150000, stones: [6000, 12000], drops: [{ id: "longjinggu", chance: 0.8 },{id:"nimetanti",chance:0.02}, { id: "pojiedan", chance: 0.25 }, { id: "yanshouguo", chance: 0.1 }, { id: "m_houtu_fengtian", chance: 0.02 }], desc: "隕落真龍不滅的殘魂,一聲龍吟,萬里雲海翻覆。" },
  { id: "tianjie", name: "天劫雷靈", element: "金", hp: 850000, atk: 34000, exp: 490000, stones: [12000, 24000], drops: [{ id: "pojiedan", chance: 0.5 }, { id: "panlongtao", chance: 0.12 }, { id: "m_tianjie_shafa", chance: 0.02 }], desc: "天劫之中孕生的雷之精靈——渡過它,便是飛昇之門。" },
  { id: "hunyuanshou", name: "混元凶獸", element: "土", hp: 320000, atk: 13000, exp: 100000, stones: [4500, 9000], drops: [{ id: "longjinggu", chance: 0.5 }, { id: "huangjitiansui", chance: 0.2 }, { id: "m_shanhe_zhenhun", chance: 0.02 }], desc: "靈界洪荒殘留的混元巨獸,一步一頓,山河震顫。" },
  { id: "jiutianfeng", name: "九天玄鳳", element: "火", hp: 560000, atk: 24000, exp: 280000, stones: [9000, 18000], drops: [{ id: "pojiedan", chance: 0.35 }, { id: "huangjitiansui", chance: 0.2 }, { id: "longjinggu", chance: 0.6 }], desc: "浴火九天的玄色神鳳,一羽焚城,涅槃不滅。" },
  { id: "taixureng", name: "太虛人仙", element: "木", hp: 700000, atk: 30000, exp: 400000, stones: [11000, 22000], drops: [{ id: "pojiedan", chance: 0.45 }, { id: "huangjitiansui", chance: 0.2 }, { id: "yanshouguo", chance: 0.12 }, { id: "m_xuanbing_mieshi", chance: 0.02 }], desc: "遊走靈界邊緣、拒絕飛昇的太古人仙,一身道行深不可測。" },

  // ── 地域王(妖獸領主,極稀有,獵殺時 2%~3% 遭遇;掉落豐厚。1.6 版:靈石掉落一律 ×15) ──
  { id: "lord_tiannan", name: "青元蟒王", element: "木", isLord: true, hp: 860, atk: 57, exp: 230, stones: [1200, 3000], drops: [ { id: "zenglingzhu", chance: 0.35 }, { id: "tianlingguo", chance: 0.8 }, { id: "fu_liehuo", chance: 0.4 }], desc: "盤踞天南千年的蟒中之王,雙目如燈,鱗甲泛青,尋常修士見之膽裂。" },
  { id: "lord_jindi", name: "血獄魔君", element: "火", isLord: true, hp: 9000, atk: 570, exp: 3800, stones: [10500, 24000], drops: [ { id: "zenglingzhu", chance: 0.4 }, { id: "qiannianlingru", chance: 0.8 }, { id: "jinganghu", chance: 0.3 }], desc: "血色禁地深處自枯骨中重生的魔頭,渾身血焰,踏過之處寸草不生。" },
  { id: "lord_luanxinghai", name: "萬鱗海皇", element: "水", isLord: true, hp: 82000, atk: 5300, exp: 28000, stones: [60000, 120000], drops: [ { id: "zenglingzhu", chance: 0.45 }, { id: "panlongtao", chance: 0.2 }, { id: "ziyuanhua", chance: 0.8 }, { id: "fu_wulei", chance: 0.35 }, { id: "diyunfu", chance: 0.06 }], desc: "亂星海真正的主宰,一身萬鱗吞吐星光,翻身即掀起滔天巨浪。" },
  { id: "lord_dajin", name: "噬天鬼帝", element: "水", isLord: true, hp: 540000, atk: 35000, exp: 200000, stones: [240000, 480000], drops: [ { id: "zenglingzhu", chance: 0.5 }, { id: "panlongtao", chance: 0.2 }, { id: "huangjitiansui", chance: 0.8 }, { id: "blueprint_xuanyin", chance: 0.25 }, { id: "tianmingfu", chance: 0.05 }], desc: "陰界萬鬼之主,鬼母亦要俯首,一念之間可令大晉一國化為鬼域。" },
  { id: "lord_lingjie", name: "太古龍祖", element: "木", isLord: true, hp: 2400000, atk: 130000, exp: 900000, stones: [600000, 1200000], drops: [{ id: "longjinggu", chance: 0.4 },{id:"nimetanti",chance:0.3},{id:"huangjitiansui",chance:0.3}, { id: "zenglingzhu", chance: 0.6 }, { id: "panlongtao", chance: 0.12 }, { id: "pojiedan", chance: 0.9 }, { id: "fu_xuanyin", chance: 0.3 }, { id: "blueprint_xuanyin", chance: 0.3 }, { id: "zhenxiandan", chance: 0.15 }], desc: "靈界所有真龍血脈的源頭,一聲龍吟,天淵城萬里雲海盡數翻覆。" },

  // ── 北寒仙域(真仙專屬,掉落先天仙器,予以仙靈力;靈石掉落已於 1.6 版兩度調整,現為原區間 ×3) ──
  { id: "bh_hanjiao", name: "玄冰仙蛟", element: "水", hp: 200000, atk: 12000, exp: 0, stones: [6000000, 9000000], drops: [{ id: "xiantian_zhong", chance: 0.006 }], desc: "北寒仙域萬載寒潭孕育的仙蛟,通體晶瑩如玉,一息成冰,已臻仙獸之列。" },
  { id: "bh_binghun", name: "萬載冰魂", element: "水", hp: 300000, atk: 16000, exp: 0, stones: [7500000, 10800000], drops: [{ id: "xiantian_zhong", chance: 0.006 }], desc: "玄冰深處凝聚萬載的寒魂,所觸之物盡成永凍,連仙靈力也能封凍。" },
  { id: "bh_hanpeng", name: "極寒天鵬", element: "金", hp: 400000, atk: 20000, exp: 0, stones: [9600000, 13800000], drops: [{ id: "xiantian_zhong", chance: 0.006 }, { id: "xiantian_qi", chance: 0.03 }], desc: "展翅蔽日的仙界鵬鳥,雙翼捲動九天寒風,一擊便是萬里冰封。" },
  { id: "bh_xuanwu", name: "北冥玄武", element: "土", hp: 500000, atk: 22000, exp: 0, stones: [12600000, 17400000], drops: [{ id: "xiantian_zhong", chance: 0.007 }, { id: "xiantian_qi", chance: 0.03 }], desc: "背負仙山的太古玄武,龜甲堅逾仙器,鎮壓北寒一方水土。" },
  { id: "bh_hanlong", name: "寒霜仙龍", element: "金", hp: 650000, atk: 26000, exp: 0, stones: [16200000, 21000000], drops: [{ id: "xiantian_qi", chance: 0.004 },{id:"nimetanti",chance:0.06}, { id: "xiantian_zhong", chance: 0.01 }], desc: "通體覆霜的仙龍,龍息所至冰封千里,乃北寒仙尊麾下的守域仙獸。" },
  // 地域王(北寒仙尊)靈石掉落與其餘六位地域王一併於下方按原始基準 ×15,再套用本次 ×3
  { id: "lord_beihan", name: "北寒仙尊", element: "水", isLord: true, hp: 1500000, atk: 35000, exp: 0, stones: [900000, 1800000], drops: [{ id: "tianxiandan", chance: 0.8 },{ id: "zengyuandan", chance: 0.01 }, { id: "xiantian_qi", chance: 0.5 }, { id: "xiantian_zhong", chance: 0.5 }, { id: "m_beiming", chance: 0.2 }], desc: "北寒仙域的無上主宰,一身仙靈力深不見底,傳說祂曾是與天同壽的古仙。天仙丹唯祂身隕方出,更有機緣傳下無上仙法。" },

  // ── 金源仙域(雲遊探索秘境解鎖,強度為北寒 50 倍,五重仙關) ──
  { id: "jy_taiyimang", name: "滄瓓金蟒", element: "金", hp: 20000000, atk: 600000, exp: 0, stones: [2400000, 4800000], drops: [{ id: "tianxiandan", chance: 0.2 }, { id: "xiantian_qi", chance: 0.05 }, { id: "xiantian_zaohuadan", chance: 0.006 }, { id: "blueprint_jishen", chance: 0.04 }, { id: "xingpan_jin", chance: 0.08 }], desc: "金源仙域第一重仙關的守關凶獸,通體金鱗,吞吐太乙金光。" },
  { id: "jy_huntianyuan", name: "混天靈猿", element: "土", hp: 35000000, atk: 900000, exp: 0, stones: [3300000, 6600000], drops: [{ id: "tianxiandan", chance: 0.2 }, { id: "jy_hunyuan", chance: 0.03 }, { id: "xiantian_zaohuadan", chance: 0.006 }, { id: "blueprint_hunyuanjia", chance: 0.04 }, { id: "xingpan_mu", chance: 0.08 }], desc: "第二重仙關的洪荒靈猿,雙臂撼動仙山,一吼震碎虛空。" },
  { id: "jy_bahuang", name: "八荒火麒麟", element: "火", hp: 42000000, atk: 1300000, exp: 0, stones: [4500000, 9000000], drops: [{ id: "tianxiandan", chance: 0.22 }, { id: "jy_taiyi", chance: 0.02 }, { id: "xiantian_zaohuadan", chance: 0.006 }, { id: "blueprint_hudao", chance: 0.04 }, { id: "xingpan_huo", chance: 0.08 }], desc: "第三重仙關的火之瑞獸,八荒業火加身,焚盡一切仙靈。" },
  { id: "jy_wujizhu", name: "無極金蛛", element: "金", hp: 72000000, atk: 1900000, exp: 0, stones: [6600000, 13200000], drops: [{ id: "tianxiandan", chance: 0.24 }, { id: "blueprint_taixu", chance: 0.15 }, { id: "xiantian_zaohuadan", chance: 0.006 }, { id: "xingpan_shui", chance: 0.08 }], desc: "第四重仙關的太古金蛛,無極金絲織天羅,仙人亦難掙脫。" },
  // 第五重仙關:金源仙帝身側的兩名護法仙使,實力較仙帝稍弱,守關時與仙帝一同鎮守
  { id: "jy_suijin", name: "金源仙使 - 歲金", element: "金", hp: 55000000, atk: 1500000, exp: 0, stones: [6000000, 11400000], drops: [{ id: "tianxiandan", chance: 0.2 }, { id: "xiantian_qi", chance: 0.08 }, { id: "xiantian_zaohuadan", chance: 0.006 }, { id: "blueprint_zhuxian", chance: 0.05 }, { id: "xingpan_tu", chance: 0.08 }], desc: "第五重仙關的護法仙使,執掌歲月金流,金光流轉間可鎮壓一方時序。" },
  { id: "jy_ruijin", name: "金源仙使 - 銳金", element: "金", hp: 62000000, atk: 1700000, exp: 0, stones: [7200000, 12600000], drops: [{ id: "tianxiandan", chance: 0.2 }, { id: "xiantian_qi", chance: 0.08 }, { id: "xiantian_zaohuadan", chance: 0.006 }, { id: "blueprint_zaohuajian", chance: 0.05 }], desc: "第五重仙關的護法仙使,鋒銳金氣凝形為刃,一擊可裂山斷嶽。" },
  { id: "lord_jinyuan", name: "金源仙帝 - 歐陽白", element: "金", isLord: true, hp: 250000000, atk: 4200000, exp: 0, stones: [28000000, 56000000], drops: [{ id: "tianxiandan", chance: 0.35 },{ id: "zengyuandan", chance: 0.015 },{id:"panlongtaoshu",chance:0.3}, { id: "jinhundan", chance: 0.1 }, { id: "fu_taixu", chance: 0.2 }, { id: "pet_hundun", chance: 0.05 }, { id: "m_hunyuan", chance: 0.05 }, { id: "xiantian_zaohuadan", chance: 0.04 }], desc: "金源仙域的無上仙帝,坐鎮第五重仙關,金源之力冠絕仙庭,一指鎮壓億萬里山河。" },

  // ── 雲遊四海際遇 · 金仙境超級大 BOSS(1% 機率遭遇) ──
  { id: "jinxian", name: "太上金仙 · 無極道君", element: "金", isLord: true, hp: 18000000, atk: 160000, exp: 0, stones: [400000, 700000], drops: [{ id: "tianxiandan", chance: 1 },{ id: "zengyuandan", chance: 0.05 }, { id: "jinhundan", chance: 0.2 }, { id: "xiantian_qi", chance: 0.5 }, { id: "zenglingzhu", chance: 1 }, { id: "m_taiqing", chance: 0.08 }], desc: "傳說中超脫真仙、位列金仙的道君,一縷神念便可鎮壓一域。雲遊四海時萬中無一得見,斬之者必得無上機緣。" },

  // ── 浮屠塔 · 幻象太歲天尊(每層 ×2 強度,無盡挑戰;基準為第 1 層) ──
  { id: "huanxiang_taisui", name: "幻象太歲天尊", element: "土", isLord: true, hp: 5000000, atk: 300000, exp: 0, stones: [0, 0], drops: [], desc: "金源仙域浮屠塔中的幻象化身,層層皆是同一尊,卻一層強似一層——每登一層,其力便翻倍,永無止境。傳說登臨絕頂者,可窺見那真正的太歲天尊。" },

  // ── 蠻荒異界(集滿五色異星盤解鎖):攻擊不烈,生命堅韌無匹(金源仙域平均生命力 15 倍) ──
  // 天狐領地
  { id: "chiwei_huyao", name: "赤尾狐妖", element: "火", hp: 650000000, atk: 1000000, exp: 0, stones: [8000000, 15000000], drops: [{ id: "tianxiandan", chance: 0.15 }, { id: "xiantian_qi", chance: 0.08 }, { id: "poshou_jinhow", chance: 0.05 }, { id: "xuantian_canpian", chance: 0.05 }], desc: "天狐領地的尋常妖狐,赤尾生焰,身法飄忽卻不擅強攻。" },
  { id: "baimei_huxian", name: "白眉狐仙", element: "火", hp: 600000000, atk: 950000, exp: 0, stones: [7500000, 14000000], drops: [{ id: "tianxiandan", chance: 0.15 }, { id: "xiantian_qi", chance: 0.08 }, { id: "poshou_jinhow", chance: 0.05 }, { id: "xuantian_canpian", chance: 0.05 }], desc: "天狐領地的修行狐仙,眉生白毫,性狡而不善近戰。" },
  { id: "jiuwei_huxiu", name: "九尾靈狐", element: "木", hp: 700000000, atk: 1050000, exp: 0, stones: [8500000, 16000000], drops: [{ id: "tianxiandan", chance: 0.15 }, { id: "xiantian_qi", chance: 0.08 }, { id: "poshou_jinhow", chance: 0.05 }, { id: "xuantian_canpian", chance: 0.05 }], desc: "天狐領地修為較深的狐修,九尾初現,靈氣渾厚。" },
  // 真龍領地
  { id: "chilong_wei", name: "螭龍衛", element: "木", hp: 720000000, atk: 1200000, exp: 0, stones: [9000000, 17000000], drops: [{ id: "tianxiandan", chance: 0.15 },{ id: "longjinggu", chance: 0.3 }, { id: "poshou_jinhow", chance: 0.05 },{id:"nimetanti",chance:0.2}, { id: "xiantian_qi", chance: 0.08 },{id:"longlinguo",chance:0.3}, { id: "xuantian_canpian", chance: 0.05 }], desc: "真龍領地巡守的螭龍,鱗甲堅逾玄鐵,防禦遠勝攻伐。" },
  { id: "youlong_shouwei", name: "蚩龍真靈", element: "木", hp: 680000000, atk: 1150000, exp: 0, stones: [8500000, 16000000], drops: [{ id: "tianxiandan", chance: 0.15 },{ id: "longjinggu", chance: 0.3 }, { id: "poshou_jinhow", chance: 0.05 },{id:"nimetanti",chance:0.2}, { id: "xiantian_qi", chance: 0.08 },{id:"longlinguo",chance:0.3}, { id: "xuantian_canpian", chance: 0.05 }], desc: "真龍領地初生的幼龍,雖未成年,鱗爪已具龍威。" },
  { id: "longlin_xizu", name: "龍鱗蜥卒", element: "水", hp: 760000000, atk: 1250000, exp: 0, stones: [9500000, 18000000], drops: [{ id: "tianxiandan", chance: 0.15 },{ id: "longjinggu", chance: 0.3 }, { id: "poshou_jinhow", chance: 0.05 },{id:"nimetanti",chance:0.2}, { id: "xiantian_qi", chance: 0.08 },{id:"longlinguo",chance:0.3}, { id: "xuantian_canpian", chance: 0.05 }], desc: "真龍領地的蜥形卒兵,渾身龍鱗,列陣巡守龍脈。" },
  // 霸下領地
  { id: "shiling_gui", name: "石靈龜", element: "土", hp: 800000000, atk: 900000, exp: 0, stones: [10000000, 19000000], drops: [{ id: "tianxiandan", chance: 0.15 }, { id: "xiantian_qi", chance: 0.08 }, { id: "poshou_jinhow", chance: 0.05 }, { id: "xuantian_canpian", chance: 0.05 }], desc: "霸下領地的靈龜,通體石甲,行動遲緩卻幾乎不可摧毀。" },
  { id: "wanshi_kuilei", name: "頑石先鋒", element: "土", hp: 850000000, atk: 800000, exp: 0, stones: [10000000, 19000000], drops: [{ id: "tianxiandan", chance: 0.15 }, { id: "xiantian_qi", chance: 0.08 }, { id: "poshou_jinhow", chance: 0.05 }, { id: "xuantian_canpian", chance: 0.05 }], desc: "霸下領地的頑石先鋒,渾身巨岩,行動遲緩、防禦驚人。" },
  { id: "guijia_weishi", name: "厚土玄武", element: "土", hp: 780000000, atk: 950000, exp: 0, stones: [9500000, 18000000], drops: [{ id: "tianxiandan", chance: 0.15 }, { id: "xiantian_qi", chance: 0.08 }, { id: "poshou_jinhow", chance: 0.05 }, { id: "xuantian_canpian", chance: 0.05 }], desc: "霸下領地披甲巡守的衛士,龜甲為胄,刀槍難入。" },
  // 貔貅領地
  { id: "chimu_xiuzai", name: "赤目貅", element: "金", hp: 700000000, atk: 1100000, exp: 0, stones: [8500000, 16000000], drops: [{ id: "tianxiandan", chance: 0.15 }, { id: "xiantian_qi", chance: 0.08 }, { id: "poshou_jinhow", chance: 0.05 }, { id: "xuantian_canpian", chance: 0.05 }], desc: "貔貅領地的幼貅,雙目赤紅,貪食靈氣,皮糙肉厚。" },
  { id: "jubao_xiushou", name: "聚寶貅獸", element: "金", hp: 680000000, atk: 1050000, exp: 0, stones: [9000000, 17000000], drops: [{ id: "tianxiandan", chance: 0.15 }, { id: "xiantian_qi", chance: 0.08 }, { id: "poshou_jinhow", chance: 0.05 }, { id: "xuantian_canpian", chance: 0.05 }], desc: "貔貅領地嗜財的貅獸,渾身金氣,遇寶必吞。" },
  { id: "yinzhua_xiuwei", name: "銀爪貅衛", element: "金", hp: 730000000, atk: 1150000, exp: 0, stones: [9000000, 17000000], drops: [{ id: "tianxiandan", chance: 0.15 }, { id: "xiantian_qi", chance: 0.08 }, { id: "poshou_jinhow", chance: 0.05 }, { id: "xuantian_canpian", chance: 0.05 }], desc: "貔貅領地的護衛貅獸,雙爪泛銀,守衛領地寶藏。" },

  // 蠻荒四大地域王(獵殺時 3%~5% 遭遇),各具專屬異能
  { id: "lord_tianhu", name: "天狐", element: "火", isLord: true, hp: 3250000000, atk: 1500000, exp: 0, stones: [300000000, 600000000], drops: [{ id: "zengyuandan", chance: 0.06 }, { id: "xiantian_qi", chance: 0.8 }, { id: "thantian_lu", chance: 0.25 }, { id: "poshou_jinhow", chance: 0.5 },{id:"panlongtaoshu",chance:0.3}, { id: "zenglingzhu", chance: 0.5 }, { id: "tianxiandan", chance: 0.3 }, { id: "taiyi_jinghun_tianhu", chance: 0.12 }, { id: "xuantian_canpian", chance: 0.3 }], desc: "天狐領地之主,身法通神,戰時有三成機率身形一晃、憑空避過攻擊。" },
  { id: "lord_zhenlong", name: "真龍", element: "木", isLord: true, hp: 3600000000, atk: 1800000, exp: 0, stones: [300000000, 600000000], drops: [{ id: "zengyuandan", chance: 0.06 }, { id: "jinhundan", chance: 0.03 }, { id: "thantian_lu", chance: 0.25 }, { id: "poshou_jinhow", chance: 0.5 },{id:"panlongtaoshu",chance:0.3}, { id: "xiantian_qi", chance: 0.5 }, { id: "zenglingzhu", chance: 0.5 }, { id: "tianxiandan", chance: 0.3 }, { id: "taiyi_jinghun_zhenlong", chance: 0.12 }, { id: "xuantian_canpian", chance: 0.35 }], desc: "真龍領地之主,龍血偶爾狂暴,兩成機率一擊爆發三倍攻擊之力。" },
  { id: "lord_baxia", name: "霸下", element: "土", isLord: true, hp: 32000000000, atk: 700000, exp: 0, stones: [400000000, 800000000], drops: [{ id: "zengyuandan", chance: 0.06 },{id:"nimetanti",chance:0.8}, { id: "thantian_lu", chance: 0.3 }, { id: "xiantian_qi", chance: 0.6 },{id:"panlongtaoshu",chance:0.3}, { id: "zenglingzhu", chance: 0.5 }, { id: "tianxiandan", chance: 0.35 }, { id: "taiyi_jinghun_baxia", chance: 0.12 }, { id: "xuantian_canpian", chance: 0.35 }], desc: "霸下領地之主,龍生九子之一,以馱負洪荒著稱——氣血堅韌至極,乃尋常妖獸的四十倍。" },
  { id: "lord_pixiu", name: "黑眼貔貅", element: "金", isLord: true, hp: 350000000, atk: 1600000, exp: 0, stones: [300000000, 600000000], drops: [{ id: "zengyuandan", chance: 0.06 }, { id: "xiantian_qi", chance: 0.8 }, { id: "thantian_lu", chance: 0.25 }, { id: "poshou_jinhow", chance: 0.5 },{id:"panlongtaoshu",chance:0.3}, { id: "zenglingzhu", chance: 0.5 }, { id: "tianxiandan", chance: 0.3 }, { id: "taiyi_jinghun_pixiu", chance: 0.12 }, { id: "xuantian_canpian", chance: 0.35 }], desc: "貔貅領地之主,雙目幽黑,戰時可封鎖敵人法力波動,令其法術盡數失效,唯有以法器相搏。" },
];



export const LOCATIONS: Location[] = [
  // 天南
  {
    id: "caiyaoshan", name: "彩霞山", region: "tiannan", reqStage: 1,
    desc: "黃楓谷外圍靈山,雲霞繚繞,是低階弟子採藥練手之地。",
    monsters: ["shulang", "qinglang", "cuiyunyan"],
    materials: ["tiekuang"], herbs: ["huanglongcao", "zijinhua"],
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
    materials: ["jiaolin", "yinsha"], herbs: ["qiannianlingru", "tianlingguo"],
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
    materials: ["xuantiehan", "xingchengang"], herbs: ["ziyuanhua", "qiannianlingru"],
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
    materials: ["mojing", "fenghuolin"], herbs: ["longlinguo", "ziyuanhua"],
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
    id: "tianyuancheng", name: "天淵城外圍", region: "lingjie", reqStage: 7,
    desc: "靈界人族第一雄城之外的莽荒,真靈衛日夜巡弋。",
    monsters: ["zhenlingwei", "gulong", "hunyuanshou", "jiutianfeng"],
    materials: ["longjinggu", "xingchengang"], herbs: ["huangjitiansui", "longlinguo"],
    manualChance: 0.06, manuals: ["m_zhenlong"],
  },
  {
    id: "feishengtai", name: "飛昇台", region: "lingjie", reqStage: 8,
    desc: "傳說中溝通仙界之地。天劫雷靈盤踞於此——渡過它,肉身成聖,白日飛昇。",
    monsters: ["tianjie", "gulong", "taixureng"],
    materials: ["longjinggu"], herbs: ["huangjitiansui"],
    manualChance: 0.1, manuals: ["m_zhenlong"],
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
    materials: ["jinyuan_lingsha"], herbs: [],
    manualChance: 0, manuals: [],
  },
  {
    id: "jy_guan2", name: "金源仙關 · 第二重", region: "jinyuan", reqStage: 10,
    desc: "洪荒靈猿鎮守的第二重仙關,力撼仙山。",
    monsters: ["jy_huntianyuan"],
    materials: ["jinyuan_lingsha", "taiyi_jingjin"], herbs: [],
    manualChance: 0, manuals: [],
  },
  {
    id: "jy_guan3", name: "金源仙關 · 第三重", region: "jinyuan", reqStage: 10,
    desc: "八荒業火燃遍的第三重仙關,火麒麟橫亙其中。",
    monsters: ["jy_bahuang"],
    materials: ["taiyi_jingjin"], herbs: [],
    manualChance: 0, manuals: [],
  },
  {
    id: "jy_guan4", name: "金源仙關 · 第四重", region: "jinyuan", reqStage: 10,
    desc: "無極金絲織成的第四重天羅,金蛛藏於其中。",
    monsters: ["jy_wujizhu"],
    materials: ["jinyuan_lingsha", "taiyi_jingjin"], herbs: [],
    manualChance: 0, manuals: [],
  },
  {
    id: "jy_guan5", name: "金源仙關 · 第五重", region: "jinyuan", reqStage: 10,
    desc: "金源仙域最深的第五重仙關,金源仙帝坐鎮於此,睥睨萬古,兩名護法仙使巡弋左右。",
    monsters: ["jy_suijin", "jy_ruijin"],
    materials: ["jinyuan_lingsha", "taiyi_jingjin"], herbs: [],
    manualChance: 0, manuals: [],
  },
  // 蠻荒異界(集滿五色異星盤解鎖,四大領地各有專屬地域王)
  {
    id: "manhuang_tianhu", name: "天狐領地", region: "manhuang", reqStage: 10,
    desc: "赤焰漫野的荒原,狐影穿梭其間,天狐坐鎮此地。",
    monsters: ["chiwei_huyao", "baimei_huxian", "jiuwei_huxiu"], lordId: "lord_tianhu",
    materials: [], herbs: [],
    manualChance: 0, manuals: [],
  },
  {
    id: "manhuang_zhenlong", name: "真龍領地", region: "manhuang", reqStage: 10,
    desc: "雲霧繚繞的龍脈之地,螭龍巡弋守衛,真龍盤踞於此。",
    monsters: ["chilong_wei", "youlong_shouwei", "longlin_xizu"], lordId: "lord_zhenlong",
    materials: [], herbs: [],
    manualChance: 0, manuals: [],
  },
  {
    id: "manhuang_baxia", name: "霸下領地", region: "manhuang", reqStage: 10,
    desc: "巨石遍布的荒丘,靈龜緩行其上,霸下馱負此方大地。",
    monsters: ["shiling_gui", "wanshi_kuilei", "guijia_weishi"], lordId: "lord_baxia",
    materials: [], herbs: [],
    manualChance: 0, manuals: [],
  },
  {
    id: "manhuang_pixiu", name: "貔貅領地", region: "manhuang", reqStage: 10,
    desc: "靈氣氤氳的聚寶荒野,貅仔成群覓食,黑眼貔貅坐鎮於此。",
    monsters: ["chimu_xiuzai", "jubao_xiushou", "yinzhua_xiuwei"], lordId: "lord_pixiu",
    materials: [], herbs: [],
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
  { id: "r_jinganghu", result: "jinganghu", name: "金剛璃甲", stones: 21200, desc: "蛟龍逆鱗綴以玄天寒鐵,水火不侵。", materials: [{ id: "jiaolin", n: 4 }, { id: "xuantiehan", n: 2 }] },
  { id: "r_dagengjian", result: "dagengjian", name: "大庚劍陣", stones: 33000, desc: "七十二枚星辰鋼鑄七十二口小劍,以劍陣圖統御。", materials: [{ id: "xingchengang", n: 6 }, { id: "jinleizhu", n: 2 }] },
  { id: "r_fengleichi", result: "fengleichi", name: "風雷翅", stones: 130000, desc: "天嵐妖鳥翎鱗為骨,魔晶為芯,雷光一閃即百里。", materials: [{ id: "fenghuolin", n: 3 }, { id: "mojing", n: 2 }] },
  { id: "r_sanyanshan", result: "sanyanshan", name: "三焰扇", stones: 280000, desc: "三色火鳥翎羽合璧,扇骨以星辰鋼鍛成。", materials: [{ id: "fenghuolin", n: 5 }, { id: "xingchengang", n: 3 }, { id: "mojing", n: 3 }] },
  { id: "r_yuancishan", result: "yuancishan", name: "元磁神山", stones: 2400000, desc: "以皇極天髓溫養魔晶百日,凝聚元磁之力成山。", materials: [{ id: "mojing", n: 8 }, { id: "huangjitiansui", n: 1 }] },
  { id: "r_zhenlongyin", result: "zhenlongyin", name: "真龍璽", stones: 1820000, desc: "真龍精骨刻璽,天髓開光——靈界至寶,渡劫倚仗。", materials: [{ id: "longjinggu", n: 5 }, { id: "huangjitiansui", n: 2 }] },
  // 圖譜解鎖的高階符籙(需妖獸掉落圖譜)
  { id: "r_fu_xuanyin", result: "fu_xuanyin", name: "玄陰噬魂符", stones: 4000000, desc: "以魔晶為引,陰煞凝符,大乘修士的攻伐符籙。", dropOnly: true, reqStage: 8, materials: [{ id: "mojing", n: 5 }, { id: "yinsha", n: 8 }] },
  { id: "r_fu_taixu", result: "fu_taixu", name: "太虛混元符", stones: 3200000, desc: "仙家符籙,以真龍精骨與皇極天髓為引,唯真仙可煉。", dropOnly: true, reqStage: 10, materials: [{ id: "longjinggu", n: 10 }, { id: "huangjitiansui", n: 5 }] },
  // 金源仙域圖譜解鎖的頂階裝備(1.6 版新增,需先由金源仙域怪物掉落對應圖譜)
  { id: "r_jinyuan_ji", result: "jinyuan_ji", name: "金源戮神戟", stones: 500000000, desc: "太乙精金反覆錘煉的戮神長戟,金源之力貫注戟身。", dropOnly: true, reqStage: 10, materials: [{ id: "taiyi_jingjin", n: 4 }, { id: "longjinggu", n: 2 }, { id: "huangjitiansui", n: 1 }] },
  { id: "r_taixu_hunyuanjia", result: "taixu_hunyuanjia", name: "太虛混元甲", stones: 200000000, desc: "金源靈砂淬煉的護體重甲,萬法加身。", dropOnly: true, reqStage: 10, materials: [{ id: "jinyuan_lingsha", n: 5 }, { id: "xingchengang", n: 3 }] },
  { id: "r_jinyuan_hujing", result: "jinyuan_hujing", name: "金源護道鏡", stones: 300000000, desc: "金源靈砂磨製的護道寶鏡,可映萬法、避凶趨吉。", dropOnly: true, reqStage: 10, materials: [{ id: "jinyuan_lingsha", n: 4 }, { id: "mojing", n: 3 }] },
  { id: "r_zhuxian_fu", result: "zhuxian_fu", name: "誅仙滅魂符", stones: 250000000, desc: "太乙精金為引凝成的殺伐仙符,一符出手,誅仙滅魂。", dropOnly: true, reqStage: 10, materials: [{ id: "taiyi_jingjin", n: 3 }, { id: "huangjitiansui", n: 1 }] },
  { id: "r_zaohua_jian", result: "zaohua_jian", name: "造化戮仙劍", stones: 350000000, desc: "金源靈砂與太乙精金合煉的造化之劍,劍出無雙。", dropOnly: true, reqStage: 10, materials: [{ id: "taiyi_jingjin", n: 3 }, { id: "jinyuan_lingsha", n: 3 }, { id: "longjinggu", n: 2 }] },
];
