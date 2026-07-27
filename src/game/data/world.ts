import { Monster, Location, Recipe, Region } from "../types";

// ═══ 交易世界地圖:現貨 → 合約 → 山寨幣海 → 機構圈 → 鏈上黑森林 ═══
export const REGIONS: Region[] = [
  { id: "tiannan", name: "現貨市場", reqStage: 1, lordId: "lord_tiannan", desc: "所有交易員的起點,人人都是韭菜,散戶追高殺低的新手屠宰場。" },
  { id: "jindi", name: "合約賭場", reqStage: 3, lordId: "lord_jindi", desc: "125 倍槓桿的修羅場,遍地爆倉屍骨,亦遍地一夜暴富的傳說。" },
  { id: "luanxinghai", name: "土狗幣叢林", reqStage: 4, lordId: "lord_luanxinghai", desc: "萬千迷因幣與空氣幣並立的汪洋,rug pull 於無形,進去十個九個歸零。" },
  { id: "dajin", name: "華爾街機構圈", reqStage: 5, lordId: "lord_dajin", desc: "傳統資本與加密巨頭鼎立的戰場,臥虎藏龍,散戶進去只是流動性。" },
  { id: "lingjie", name: "鏈上黑暗森林", reqStage: 7, lordId: "lord_lingjie", desc: "MEV 機器人與巨鯨橫行的 mempool 暗網,獵人與獵物只在一個區塊之間。" },
  { id: "beihan", name: "頂級對沖基金", reqStage: 10, lordId: "lord_beihan", color: "fuchsia", desc: "唯有封神的基金經理人方能踏足的頂級戰場,萬億資金黑池,先天級礦機與傳奇私鑰長眠。" },
  { id: "jinyuan", name: "主力莊家黑池", reqStage: 10, lordId: "lord_jinyuan", hidden: true, color: "fuchsia", desc: "鏈上遊獵才能窺見的洪荒級暗池,主力資金沖霄,五重關卡層層設險,對手之強遠勝對沖基金五十倍。" },
];

export const MONSTERS: Monster[] = [
  // ── 現貨市場(一至二階) ──
  { id: "shulang", name: "FOMO 散戶", element: "土", hp: 14, atk: 2, exp: 3, stones: [1, 2], drops: [{ id: "huanglongcao", chance: 0.4 }], desc: "最低階的追高散戶,雙眼血紅,成群無腦進場。" },
  { id: "qinglang", name: "跟風韭菜", element: "木", hp: 25, atk: 4, exp: 6, stones: [1, 3], drops: [{ id: "qingmu", chance: 0.2 }, { id: "yaodan", chance: 0.1 }], desc: "看到別人賺就衝的韭菜群,行動迅捷卻毫無主見。" },
  { id: "tiejiachong", name: "鑽石手", element: "金", hp: 32, atk: 5, exp: 8, stones: [1, 4], drops: [{ id: "tiekuang", chance: 0.5 }], desc: "死抱不放的鑽石手,套牢再深也不砍,尋常策略難傷。" },
  { id: "hanshuimang", name: "冷錢包巨蟒", element: "水", hp: 58, atk: 7, exp: 14, stones: [3, 6], drops: [{ id: "hanjing", chance: 0.3 }, { id: "yaodan", chance: 0.2 }], desc: "潛伏冷錢包的巨鯨蟒,吐息成冰,長線沉默不動。" },
  { id: "huomang", name: "槓桿火蟒", element: "火", hp: 79, atk: 9, exp: 21, stones: [4, 9], drops: [{ id: "huoyu", chance: 0.45 }, { id: "yaodan", chance: 0.25 }], desc: "周身燃燒高槓桿烈焰的火蟒,現貨區頂級對手。" },
  { id: "shiyan", name: "巍巍套牢盤", element: "土", hp: 110, atk: 11, exp: 29, stones: [5, 12], drops: [{ id: "wenyu", chance: 0.35 }], desc: "老莊留下的巨型套牢盤,量能沉重如山,力大無窮。" },
  { id: "yinhun", name: "陰跌老盤", element: "水", hp: 140, atk: 14, exp: 42, stones: [8, 16], drops: [{ id: "yinsha", chance: 0.5 }, { id: "m_hanbing", chance: 0.02 }], desc: "陰跌不止的老盤,怨氣沖天,懼暴力拉抬。" },
  { id: "leizhujing", name: "閃電暴漲精", element: "金", hp: 180, atk: 17, exp: 62, stones: [10, 23], drops: [{ id: "jinleizhu", chance: 0.6 }, { id: "m_leidun", chance: 0.02 }], desc: "吸收市場雷霆成精的暴漲行情,周身電光繚繞。" },
  { id: "cuiyunyan", name: "短線快燕", element: "木", hp: 20, atk: 3, exp: 5, stones: [1, 3], drops: [{ id: "qingmu", chance: 0.25 }, { id: "huanglongcao", chance: 0.2 }], desc: "快進快出的短線燕子,掠地成風,難以捕捉。" },
  { id: "duyanchan", name: "老鼠倉毒蟾", element: "水", hp: 95, atk: 10, exp: 25, stones: [4, 10], drops: [{ id: "yaodan", chance: 0.3 }, { id: "yinsha", chance: 0.2 }], desc: "獨眼老鼠倉巨蟾,口吐內線毒霧,潛伏陰暗掛單處。" },
  { id: "huoyanju", name: "暴力拉盤犀", element: "火", hp: 165, atk: 16, exp: 55, stones: [9, 20], drops: [{ id: "huoyu", chance: 0.4 }, { id: "wenyu", chance: 0.25 }], desc: "鬃毛燃燒不熄的拉盤巨犀,一撞就是漲停開山。" },
  // ── 合約血海(結丹級) ──
  { id: "xuejiao", name: "詐盤巨鱷", element: "水", hp: 600, atk: 68, exp: 220, stones: [36, 84], drops: [{ id: "jiaolin", chance: 0.6 }, { id: "m_qingzhufeng", chance: 0.02 }], desc: "欲成莊而未成的血色巨鱷,盤踞合約血海,專咬爆倉盤。" },
  { id: "shengui", name: "插針石龜", element: "土", hp: 1000, atk: 78, exp: 310, stones: [48, 110], drops: [{ id: "wenyu", chance: 0.7 }, { id: "qiannianlingru", chance: 0.3 }], desc: "馱著半座套牢山的插針巨龜,甲上刻滿爆倉符文。" },
  { id: "guhuolao", name: "古洞老莊", element: "火", hp: 1600, atk: 110, exp: 500, stones: [96, 190], drops: [{ id: "tianlingguo", chance: 0.5 }, { id: "m_jinlei", chance: 0.02 }, { id: "zhujidan", chance: 0.15 }], desc: "盤踞合約血海萬年的老莊主,結丹圓滿級的收割威壓。" },
  { id: "xuewuzhu", name: "血霧套利蛛", element: "木", hp: 780, atk: 72, exp: 260, stones: [40, 95], drops: [{ id: "jiaolin", chance: 0.35 }, { id: "qiannianlingru", chance: 0.2 }], desc: "吐血色掛單網的巨型套利蛛,獵物入網頃刻爆倉。" },
  { id: "kulouwang", name: "爆倉枯骨將", element: "金", hp: 1250, atk: 95, exp: 400, stones: [70, 150], drops: [{ id: "yinsha", chance: 0.5 }, { id: "m_xuantian", chance: 0.02 }], desc: "無數爆倉單凝聚的枯骨魔將,執一柄清算骨矛,刀槍不入。" },
  { id: "chihuoya", name: "多殺多鴉群", element: "火", hp: 900, atk: 88, exp: 340, stones: [55, 130], drops: [{ id: "huoyu", chance: 0.5 }, { id: "tianlingguo", chance: 0.25 }], desc: "遮天蔽日的多殺多火鴉群,所過之處多頭成灰。" },
  // ── 山寨幣叢林(元嬰級) ──
  { id: "haimujing", name: "迷因幣巨鯨", element: "水", hp: 4700, atk: 300, exp: 940, stones: [180, 410], drops: [{ id: "xuantiehan", chance: 0.4 }, { id: "ziyuanhua", chance: 0.3 }], desc: "吞吐流動性的迷因巨鯨,背上寄生著整條空氣幣鏈。" },
  { id: "xingchenguai", name: "空投傀儡", element: "金", hp: 7000, atk: 420, exp: 1400, stones: [300, 590], drops: [{ id: "xingchengang", chance: 0.6 }, { id: "m_dageng", chance: 0.02 }], desc: "項目方用空投糖果驅動的女巫戰傀,金光射目。" },
  { id: "wangtianhou", name: "喊單天吼", element: "木", hp: 11000, atk: 570, exp: 2200, stones: [470, 940], drops: [{ id: "ningyingdan", chance: 0.35 }, { id: "m_aohan", chance: 0.02 }], desc: "仰天喊單即能拉爆行情的上古 KOL 後裔。" },
  { id: "canghaijiao", name: "拉高砸盤龍", element: "水", hp: 6200, atk: 360, exp: 1200, stones: [240, 500], drops: [{ id: "jiaolin", chance: 0.4 }, { id: "xuantiehan", chance: 0.3 }], desc: "山寨幣海深處的拉砸巨龍,捲起千丈狂潮,吞舟裂島。" },
  { id: "jinyuxie", name: "金羽貔貅蠍", element: "金", hp: 8800, atk: 500, exp: 1800, stones: [380, 760], drops: [{ id: "xingchengang", chance: 0.45 }, { id: "ziyuanhua", chance: 0.25 }], desc: "披金甲的只進不出貔貅蠍,尾刺一擊可洞穿硬體。" },
  { id: "youmingzhang", name: "幽冥老鼠倉章", element: "水", hp: 9600, atk: 540, exp: 2000, stones: [420, 850], drops: [{ id: "xuantiehan", chance: 0.4 }, { id: "longlinguo", chance: 0.15 }], desc: "萬丈黑池爬出的幽冥巨章,觸手纏繞每一筆掛單。" },
  // ── 華爾街機構圈(化神/煉虛級) ──
  { id: "mohua", name: "走火入魔賭徒", element: "火", hp: 34000, atk: 1800, exp: 7700, stones: [1400, 3200], drops: [{ id: "mojing", chance: 0.7 }, { id: "m_yuanci", chance: 0.02 }], desc: "重倉爆倉後走火入魔的賭徒,神智全失,梭哈成性。" },
  { id: "tianlanyao", name: "高頻量化妖鳥", element: "火", hp: 61000, atk: 2900, exp: 16000, stones: [2800, 5600], drops: [{ id: "fenghuolin", chance: 0.5 }, { id: "m_sanyan", chance: 0.02 }], desc: "毫秒級高頻雙翼遮天蔽日,機構量化的圖騰聖獸。" },
  { id: "guimu", name: "黑天鵝鬼母", element: "水", hp: 72000, atk: 3800, exp: 22000, stones: [3800, 7500], drops: [{ id: "huangjitiansui", chance: 0.3 }, { id: "dahuandan", chance: 0.5 }, { id: "wanshoudan", chance: 0.08 }], desc: "黑天鵝裂縫爬出的存在,萬盤崩塌時降臨,煉虛巔峰。" },
  { id: "moxuejun", name: "血洗多頭尊者", element: "火", hp: 46000, atk: 2400, exp: 11000, stones: [2000, 4200], drops: [{ id: "mojing", chance: 0.6 }, { id: "longlinguo", chance: 0.2 }], desc: "以爆倉血淬體的煉虛級空頭,渾身血氣化甲,力可撼盤。" },
  { id: "wuxinbagua", name: "無情演算法虎", element: "土", hp: 55000, atk: 3200, exp: 14000, stones: [2500, 5000], drops: [{ id: "fenghuolin", chance: 0.4 }, { id: "huangjitiansui", chance: 0.15 }], desc: "華爾街北荒的太古演算法凶虎,雙目無神,只知清算。" },
  { id: "youmingfan", name: "墮落基金梵僧", element: "金", hp: 68000, atk: 3600, exp: 20000, stones: [3400, 6800], drops: [{ id: "mojing", chance: 0.5 }, { id: "dahuandan", chance: 0.4 }], desc: "墮入內線交易的機構高僧,誦動割韭梵音,攝人心魂。" },
  // ── 鏈上黑暗森林(合體/大乘級) ──
  { id: "zhenlingwei", name: "MEV 機器人衛", element: "金", hp: 240000, atk: 11000, exp: 64000, stones: [3000, 6000], drops: [{ id: "longjinggu", chance: 0.4 }, { id: "m_zhenlong", chance: 0.02 }], desc: "鏈上暗網的 MEV 傀儡戰衛,搶跑交易的血脈驅動。" },
  { id: "gulong", name: "上古巨鯨殘魂", element: "木", hp: 400000, atk: 16000, exp: 150000, stones: [6000, 12000], drops: [{ id: "longjinggu", chance: 0.8 }, { id: "pojiedan", chance: 0.25 }, { id: "yanshouguo", chance: 0.1 }], desc: "隕落巨鯨不滅的殘魂,一聲砸盤,萬里流動性翻覆。" },
  { id: "tianjie", name: "監管黑天鵝雷", element: "金", hp: 850000, atk: 34000, exp: 490000, stones: [12000, 24000], drops: [{ id: "pojiedan", chance: 0.5 }, { id: "panlongtao", chance: 0.12 }], desc: "監管風暴中孕生的雷之精靈——渡過它,便是封神之門。" },
  { id: "hunyuanshou", name: "混元巨鯨獸", element: "土", hp: 320000, atk: 13000, exp: 100000, stones: [4500, 9000], drops: [{ id: "longjinggu", chance: 0.5 }, { id: "huangjitiansui", chance: 0.2 }], desc: "鏈上洪荒殘留的混元巨鯨,一步一頓,盤面震顫。" },
  { id: "jiutianfeng", name: "浴火重生鳳", element: "火", hp: 560000, atk: 24000, exp: 280000, stones: [9000, 18000], drops: [{ id: "pojiedan", chance: 0.35 }, { id: "longjinggu", chance: 0.6 }], desc: "腰斬後浴火重生的玄色神鳳,一羽焚盤,涅槃不滅。" },
  { id: "taixureng", name: "隱退操盤仙", element: "木", hp: 700000, atk: 30000, exp: 400000, stones: [11000, 22000], drops: [{ id: "pojiedan", chance: 0.45 }, { id: "yanshouguo", chance: 0.12 }], desc: "遊走黑森林邊緣、拒絕封神的太古操盤宗師,一身道行深不可測。" },

  // ── 巨鯨領主(極稀有,挑戰對手時 2%~3% 遭遇;掉落豐厚) ──
  { id: "lord_tiannan", name: "青元韭菜王", element: "木", isLord: true, hp: 860, atk: 57, exp: 230, stones: [80, 200], drops: [{ id: "zengyuandan", chance: 0.5 }, { id: "zenglingzhu", chance: 0.35 }, { id: "tianlingguo", chance: 0.8 }, { id: "fu_liehuo", chance: 0.4 }], desc: "盤踞現貨市場千年的韭菜之王,雙目如燈,養活一代代莊家,尋常散戶見之膽裂。" },
  { id: "lord_jindi", name: "血獄爆倉魔君", element: "火", isLord: true, hp: 9000, atk: 570, exp: 3800, stones: [700, 1600], drops: [{ id: "zengyuandan", chance: 0.55 }, { id: "zenglingzhu", chance: 0.4 }, { id: "qiannianlingru", chance: 0.8 }, { id: "jinganghu", chance: 0.3 }], desc: "合約血海深處自爆倉屍骨中重生的魔頭,渾身血焰,踏過之處爆倉一片。" },
  { id: "lord_luanxinghai", name: "萬鱗莊家海皇", element: "水", isLord: true, hp: 82000, atk: 5300, exp: 28000, stones: [4000, 8000], drops: [{ id: "zengyuandan", chance: 0.55 }, { id: "zenglingzhu", chance: 0.45 }, { id: "ziyuanhua", chance: 0.8 }, { id: "fu_wulei", chance: 0.35 }], desc: "山寨幣海真正的主宰,一身萬鱗吞吐流動性,翻身即掀起插針巨浪。" },
  { id: "lord_dajin", name: "噬盤黑天鵝帝", element: "水", isLord: true, hp: 540000, atk: 35000, exp: 200000, stones: [16000, 32000], drops: [{ id: "zengyuandan", chance: 0.6 }, { id: "zenglingzhu", chance: 0.5 }, { id: "huangjitiansui", chance: 0.8 }, { id: "blueprint_xuanyin", chance: 0.25 }], desc: "機構圈萬盤之主,黑天鵝鬼母亦要俯首,一念之間可令整個華爾街化為焦土。" },
  { id: "lord_lingjie", name: "太古巨鯨祖", element: "木", isLord: true, hp: 2400000, atk: 130000, exp: 900000, stones: [40000, 80000], drops: [{ id: "zengyuandan", chance: 0.7 }, { id: "zenglingzhu", chance: 0.6 }, { id: "pojiedan", chance: 0.9 }, { id: "fu_xuanyin", chance: 0.3 }, { id: "blueprint_xuanyin", chance: 0.3 }], desc: "鏈上所有巨鯨血脈的源頭,一聲砸盤,黑暗森林萬里流動性盡數翻覆。" },

  // ── 頂級對沖基金(封神專屬,掉落先天級硬體,予以影響力) ──
  { id: "bh_hanjiao", name: "玄冰對沖蛟", element: "水", hp: 200000, atk: 12000, exp: 0, stones: [4000, 8000], drops: [{ id: "xiantian_zhong", chance: 0.006 }], desc: "頂級對沖基金萬億冷資孕育的量化蛟,通體晶瑩如玉,一息鎖倉,已臻機構之列。" },
  { id: "bh_hanpeng", name: "極寒空頭鵬", element: "金", hp: 400000, atk: 20000, exp: 0, stones: [7000, 14000], drops: [{ id: "xiantian_zhong", chance: 0.006 }, { id: "xiantian_qi", chance: 0.03 }], desc: "展翅蔽日的機構級空頭鵬,雙翼捲動九天寒風,一擊便是萬里冰封。" },
  { id: "bh_binghun", name: "萬載沉倉魂", element: "水", hp: 300000, atk: 16000, exp: 0, stones: [6000, 12000], drops: [{ id: "xiantian_zhong", chance: 0.006 }], desc: "冷錢包深處凝聚萬載的沉倉寒魂,所觸之物盡成永凍,連影響力也能封凍。" },
  { id: "bh_xuanwu", name: "北冥風控玄武", element: "土", hp: 500000, atk: 22000, exp: 0, stones: [9000, 18000], drops: [{ id: "xiantian_zhong", chance: 0.007 }, { id: "xiantian_qi", chance: 0.03 }], desc: "背負資金山的太古風控玄武,龜甲堅逾機構硬體,鎮壓一方黑池。" },
  { id: "bh_hanlong", name: "寒霜量化龍", element: "金", hp: 650000, atk: 26000, exp: 0, stones: [11000, 22000], drops: [{ id: "xiantian_qi", chance: 0.004 }, { id: "xiantian_zhong", chance: 0.01 }], desc: "通體覆霜的量化龍,一息所至鎖倉千里,乃頂級操盤手麾下的守域機構獸。" },
  { id: "lord_beihan", name: "頂級操盤宗師", element: "水", isLord: true, hp: 1500000, atk: 35000, exp: 0, stones: [20000, 40000], drops: [{ id: "tianxiandan", chance: 0.8 }, { id: "xiantian_qi", chance: 0.5 }, { id: "xiantian_zhong", chance: 0.5 }, { id: "m_beiming", chance: 0.2 }], desc: "頂級對沖基金的無上主宰,一身影響力深不見底,傳說祂是與市場同壽的古老巨頭。操盤私鑰唯祂身隕方出,更有機緣傳下無上策略。" },

  // ── 主力莊家黑池(鏈上遊獵解鎖,強度為對沖基金 50 倍,五重關卡) ──
  { id: "jy_taiyimang", name: "太乙主力金蟒", element: "金", hp: 20000000, atk: 600000, exp: 0, stones: [80000, 160000], drops: [{ id: "tianxiandan", chance: 0.2 }, { id: "xiantian_qi", chance: 0.15 }], desc: "主力黑池第一關的守關凶獸,通體金鱗,吞吐太乙主力資金。" },
  { id: "jy_huntianyuan", name: "混天砸盤靈猿", element: "土", hp: 35000000, atk: 900000, exp: 0, stones: [110000, 220000], drops: [{ id: "tianxiandan", chance: 0.2 }, { id: "jy_hunyuan", chance: 0.05 }], desc: "第二關的洪荒砸盤靈猿,雙臂撼動資金山,一吼震碎流動性。" },
  { id: "jy_bahuang", name: "八荒拉盤麒麟", element: "火", hp: 42000000, atk: 1300000, exp: 0, stones: [150000, 300000], drops: [{ id: "tianxiandan", chance: 0.22 }, { id: "jy_taiyi", chance: 0.05 }], desc: "第三關的火之瑞獸,八荒拉盤業火加身,焚盡一切空單。" },
  { id: "jy_wujizhu", name: "無極插針金蛛", element: "金", hp: 72000000, atk: 1900000, exp: 0, stones: [220000, 440000], drops: [{ id: "tianxiandan", chance: 0.24 }, { id: "blueprint_taixu", chance: 0.15 }], desc: "第四關的太古插針金蛛,無極金絲織天羅,對手亦難掙脫。" },
  { id: "lord_jinyuan", name: "主力莊家 - 歐陽白", element: "金", isLord: true, hp: 250000000, atk: 9800000, exp: 0, stones: [400000, 800000], drops: [{ id: "tianxiandan", chance: 0.35 }, { id: "jinhundan", chance: 0.1 }, { id: "fu_taixu", chance: 0.2 }, { id: "pet_hundun", chance: 0.05 }, { id: "m_hunyuan", chance: 0.05 }], desc: "主力莊家黑池的無上莊主,坐鎮第五關,主力之力冠絕全場,一指鎮壓億萬市值。" },

  // ── 鏈上遊獵際遇 · 家族基金超級大 BOSS(1% 機率遭遇) ──
  { id: "jinxian", name: "傳奇資本 · 無極道君", element: "金", isLord: true, hp: 18000000, atk: 160000, exp: 0, stones: [200000, 400000], drops: [{ id: "tianxiandan", chance: 1 }, { id: "jinhundan", chance: 0.15 }, { id: "xiantian_qi", chance: 0.5 }, { id: "zenglingzhu", chance: 1 }, { id: "m_taiqing", chance: 0.08 }], desc: "傳說中超脫基金經理人、位列家族資本的道君,一縷資金便可鎮壓一域。鏈上遊獵時萬中無一得見,斬之者必得無上機緣。" },

  // ── 爆倉擂台 · 幻象莊家天尊(每層強度遞增,無盡挑戰) ──
  { id: "huanxiang_taisui", name: "幻象莊家天尊", element: "土", isLord: true, hp: 5000000, atk: 300000, exp: 0, stones: [0, 0], drops: [], desc: "主力黑池爆倉擂台中的幻象化身,層層皆是同一尊,卻一層強似一層——每登一層,其力便增長,永無止境。傳說登臨絕頂者,可窺見那真正的莊家天尊。" },
];

export const LOCATIONS: Location[] = [
  // 現貨市場
  {
    id: "caiyaoshan", name: "新手交易區", region: "tiannan", reqStage: 1,
    desc: "現貨交易所的入門區,雲霞繚繞,是新韭菜練手的第一站。",
    monsters: ["shulang", "qinglang", "cuiyunyan"],
    materials: ["tiekuang"], herbs: ["huanglongcao", "zijinhua"],
    manualChance: 0.02, manuals: ["m_hanbing"],
  },
  {
    id: "heifengling", name: "黑天鵝嶺", region: "tiannan", reqStage: 1,
    desc: "行情詭譎的荒嶺,黑天鵝終年不歇,常有散戶在此爆倉出局。",
    monsters: ["qinglang", "tiejiachong", "hanshuimang", "cuiyunyan"],
    materials: ["tiekuang", "qingmu"], herbs: ["huanglongcao", "xuelingzhi"],
    manualChance: 0.03, manuals: ["m_liehuo"],
  },
  {
    id: "hantan", name: "深水冷錢包", region: "tiannan", reqStage: 2,
    desc: "深不見底的冷儲資金池,底層藏有冷儲晶片,亦有冷錢包巨蟒盤踞。",
    monsters: ["hanshuimang", "yinhun", "duyanchan"],
    materials: ["hanjing", "yinsha"], herbs: ["zijinhua", "zhuguo"],
    manualChance: 0.04, manuals: ["m_hanbing", "m_dayan"],
  },
  {
    id: "yanhuogu", name: "槓桿火谷", region: "tiannan", reqStage: 2,
    desc: "地火奔湧的高槓桿山谷,槓桿火蟒的巢穴,礦工嚮往的天然算力源。",
    monsters: ["huomang", "shiyan", "huoyanju"],
    materials: ["huoyu", "wenyu"], herbs: ["zhuguo", "xuelingzhi"],
    manualChance: 0.04, manuals: ["m_liehuo", "m_qingzhufeng"],
  },
  {
    id: "leizhulin", name: "暴漲竹林", region: "tiannan", reqStage: 2,
    desc: "雷霆終年劈落的暴漲行情林,頂級算力晶片的唯一產地,兇險異常。",
    monsters: ["leizhujing", "shiyan", "huoyanju"],
    materials: ["jinleizhu", "tiekuang"], herbs: ["zhuguo", "tianlingguo"],
    manualChance: 0.05, manuals: ["m_leidun", "m_jinlei"],
  },
  // 合約血海
  {
    id: "xuesehe", name: "血色爆倉谷", region: "jindi", reqStage: 3,
    desc: "赤紅資金奔流的裂谷,詐盤巨鱷出沒,谷底沉著歷代爆倉者的資產庫。",
    monsters: ["xuejiao", "shengui", "xuewuzhu"],
    materials: ["jiaolin", "yinsha"], herbs: ["qiannianlingru", "tianlingguo"],
    manualChance: 0.06, manuals: ["m_qingzhufeng", "m_xuantian"],
  },
  {
    id: "jinshoushan", name: "禁區莊家古洞", region: "jindi", reqStage: 3,
    desc: "合約血海深處的古洞,老莊沉眠之所,亦藏無上機緣。",
    monsters: ["guhuolao", "shengui", "kulouwang", "chihuoya"],
    materials: ["yinsha", "jinleizhu"], herbs: ["tianlingguo", "qiannianlingru"],
    manualChance: 0.08, manuals: ["m_jinlei", "m_xuantian"],
  },
  // 山寨幣叢林
  {
    id: "waihaidao", name: "空氣幣群島", region: "luanxinghai", reqStage: 4,
    desc: "山寨幣海外圍的萬千小幣島,莊家橫行,島上機緣無人採擷。",
    monsters: ["haimujing", "xingchenguai", "canghaijiao"],
    materials: ["xuantiehan", "xingchengang"], herbs: ["ziyuanhua", "qiannianlingru"],
    manualChance: 0.05, manuals: ["m_aohan", "m_dageng"],
  },
  {
    id: "xinggong", name: "跑路項目遺跡", region: "luanxinghai", reqStage: 4,
    desc: "山寨幣海之主項目方的跑路廢墟,女巫傀儡仍在巡邏,金庫無人開啟。",
    monsters: ["xingchenguai", "wangtianhou", "jinyuxie", "youmingzhang"],
    materials: ["xingchengang", "jiaolin"], herbs: ["ziyuanhua", "longlinguo"],
    manualChance: 0.07, manuals: ["m_dageng", "m_aohan"],
  },
  // 華爾街機構圈
  {
    id: "moyuan", name: "爆倉深淵", region: "dajin", reqStage: 5,
    desc: "華爾街北疆的無底深淵,魔氣沖天,走火入魔賭徒在淵口徘徊。",
    monsters: ["mohua", "tianlanyao", "moxuejun", "wuxinbagua"],
    materials: ["mojing", "fenghuolin"], herbs: ["longlinguo", "ziyuanhua"],
    manualChance: 0.06, manuals: ["m_yuanci", "m_sanyan"],
  },
  {
    id: "yinjieliexi", name: "黑天鵝裂隙", region: "dajin", reqStage: 6,
    desc: "牛熊兩界的裂縫,恐慌如潮。黑天鵝鬼母在此坐鎮,等閒煉虛不敢近前。",
    monsters: ["guimu", "mohua", "youmingfan"],
    materials: ["mojing", "fenghuolin"], herbs: ["huangjitiansui", "longlinguo"],
    manualChance: 0.08, manuals: ["m_sanyan", "m_yuanci"],
  },
  // 鏈上黑暗森林
  {
    id: "tianyuancheng", name: "鏈上暗網外圍", region: "lingjie", reqStage: 7,
    desc: "鏈上第一大暗池之外的莽荒,MEV 機器人日夜巡弋。",
    monsters: ["zhenlingwei", "gulong", "hunyuanshou", "jiutianfeng"],
    materials: ["longjinggu", "xingchengang"], herbs: ["huangjitiansui", "longlinguo"],
    manualChance: 0.06, manuals: ["m_zhenlong"],
  },
  {
    id: "feishengtai", name: "封神台", region: "lingjie", reqStage: 8,
    desc: "傳說中晉升機構之地。監管黑天鵝雷盤踞於此——渡過它,肉身成聖,白日封神。",
    monsters: ["tianjie", "gulong", "taixureng"],
    materials: ["longjinggu"], herbs: ["huangjitiansui"],
    manualChance: 0.1, manuals: ["m_zhenlong"],
  },
  // 頂級對沖基金(封神專屬)
  {
    id: "xuanbing_yuan", name: "玄冰資金原", region: "beihan", reqStage: 10,
    desc: "萬億冷資鋪成的無垠雪原,機構獸出沒,先天資金氤氳。唯基金經理人可久留。",
    monsters: ["bh_hanjiao", "bh_hanpeng", "bh_binghun"],
    materials: [], herbs: [],
    manualChance: 0, manuals: [],
  },
  {
    id: "beihan_dian", name: "頂級操盤密殿", region: "beihan", reqStage: 10,
    desc: "對沖基金最深處的巍峨冰殿,頂級操盤宗師端坐其中,先天級硬體懸於九霄。",
    monsters: ["bh_hanpeng", "bh_hanjiao", "bh_xuanwu", "bh_hanlong"],
    materials: [], herbs: [],
    manualChance: 0, manuals: [],
  },
  // 主力莊家黑池(五重關卡,鏈上遊獵解鎖)
  {
    id: "jy_guan1", name: "主力黑池 · 第一關", region: "jinyuan", reqStage: 10,
    desc: "主力莊家黑池的第一道關卡,太乙主力金蟒盤踞關前,金光耀目。",
    monsters: ["jy_taiyimang"],
    materials: [], herbs: [],
    manualChance: 0, manuals: [],
  },
  {
    id: "jy_guan2", name: "主力黑池 · 第二關", region: "jinyuan", reqStage: 10,
    desc: "洪荒砸盤靈猿鎮守的第二關,力撼資金山。",
    monsters: ["jy_huntianyuan"],
    materials: [], herbs: [],
    manualChance: 0, manuals: [],
  },
  {
    id: "jy_guan3", name: "主力黑池 · 第三關", region: "jinyuan", reqStage: 10,
    desc: "八荒拉盤業火燃遍的第三關,拉盤麒麟橫亙其中。",
    monsters: ["jy_bahuang"],
    materials: [], herbs: [],
    manualChance: 0, manuals: [],
  },
  {
    id: "jy_guan4", name: "主力黑池 · 第四關", region: "jinyuan", reqStage: 10,
    desc: "無極金絲織成的第四重天羅,插針金蛛藏於其中。",
    monsters: ["jy_wujizhu"],
    materials: [], herbs: [],
    manualChance: 0, manuals: [],
  },
  {
    id: "jy_guan5", name: "主力黑池 · 第五關", region: "jinyuan", reqStage: 10,
    desc: "主力黑池最深的第五關,主力莊家坐鎮於此,睥睨萬古。",
    monsters: ["lord_jinyuan"],
    materials: [], herbs: [],
    manualChance: 0, manuals: [],
  },
];

export const RECIPES: Recipe[] = [
  { id: "r_qingsuo", result: "qingsuo", name: "二手礦渣卡 GT710", stones: 21, desc: "礦潮退去後撿來的二手顯卡,導熱矽加精鐵基板,聊勝於無的入門算力。", materials: [{ id: "qingmu", n: 2 }, { id: "tiekuang", n: 3 }] },
  { id: "r_jinjian", result: "jinjian", name: "GTX 韭割卡", stones: 26, desc: "五塊晶片反覆疊加,佐以對手晶核淬鋒,專割新韭菜。", materials: [{ id: "tiekuang", n: 5 }, { id: "yaodan", n: 1 }] },
  { id: "r_hanbingzhui", result: "hanbingzhui", name: "水冷靜音卡", stones: 31, desc: "冷儲晶片凝形,暗池數據定溫,運轉悄無聲息。", materials: [{ id: "hanjing", n: 2 }, { id: "yinsha", n: 1 }] },
  { id: "r_huolingqi", result: "huolingqi", name: "RTX 超頻火箭", stones: 39, desc: "超頻散熱鱗織旗,對手晶核為引,超頻拉滿也不燒卡。", materials: [{ id: "huoyu", n: 3 }, { id: "yaodan", n: 1 }] },
  { id: "r_hutudun", result: "hutudun", name: "厚土 UPS 不斷電", stones: 34, desc: "穩壓溫玉為心,精鐵鑲邊的不斷電護盾,斷電也不爆倉。", materials: [{ id: "wenyu", n: 3 }, { id: "tiekuang", n: 2 }] },
  { id: "r_wuguangyi", result: "wuguangyi", name: "烏光石墨烯散熱", stones: 79, desc: "三道暗池數據淬鍊軟甲,烏光石墨烯貼滿全機。", materials: [{ id: "yinsha", n: 3 }, { id: "hanjing", n: 1 }] },
  { id: "r_qingzhufengjian", result: "qingzhufengjian", name: "蜂群量化農場卡", stones: 180, desc: "以頂級算力晶片為核,輔以冷儲、對手晶核,組成可一化為多的絕世量化顯卡陣。", materials: [{ id: "jinleizhu", n: 3 }, { id: "hanjing", n: 2 }, { id: "yaodan", n: 3 }] },
  { id: "r_jinganghu", result: "jinganghu", name: "金剛液冷機殼", stones: 1200, desc: "巨鱷逆鱗綴以玄天寒鐵,水火不侵的頂級液冷散熱機殼。", materials: [{ id: "jiaolin", n: 4 }, { id: "xuantiehan", n: 2 }] },
  { id: "r_dagengjian", result: "dagengjian", name: "72 卡礦場陣列", stones: 3000, desc: "七十二枚星辰鋼鑄七十二顆運算核心,以量化陣圖統御的礦場級算力陣。", materials: [{ id: "xingchengang", n: 6 }, { id: "jinleizhu", n: 2 }] },
  { id: "r_fengleichi", result: "fengleichi", name: "低延遲風雷網卡", stones: 3000, desc: "高頻超頻鱗為骨,爆倉魔晶為芯,毫秒一閃即成交百里外。", materials: [{ id: "fenghuolin", n: 3 }, { id: "mojing", n: 2 }] },
  { id: "r_sanyanshan", result: "sanyanshan", name: "三風扇旗艦散熱", stones: 8000, desc: "三色火鳥翎羽合璧,扇骨以星辰鋼鍛成的頂級三風扇散熱。", materials: [{ id: "fenghuolin", n: 5 }, { id: "xingchengang", n: 3 }, { id: "mojing", n: 3 }] },
  { id: "r_yuancishan", result: "yuancishan", name: "元磁神山礦主機", stones: 40000, desc: "以皇極天髓溫養爆倉魔晶百日,凝聚元磁算力成山的礦場主機。", materials: [{ id: "mojing", n: 8 }, { id: "huangjitiansui", n: 1 }] },
  { id: "r_zhenlongyin", result: "zhenlongyin", name: "真龍 ASIC 旗艦礦機", stones: 82000, desc: "巨鯨精骨刻核,皇極天髓開光——黑森林至寶,封神倚仗的 ASIC 礦機。", materials: [{ id: "longjinggu", n: 5 }, { id: "huangjitiansui", n: 2 }] },
  // 藍圖解鎖的高階處理器(需對手掉落藍圖)
  { id: "r_fu_xuanyin", result: "fu_xuanyin", name: "玄陰噬盤處理器", stones: 40000, desc: "以爆倉魔晶為引,暗池數據凝核,大乘級交易員的攻伐處理器。", dropOnly: true, reqStage: 8, materials: [{ id: "mojing", n: 5 }, { id: "yinsha", n: 8 }] },
  { id: "r_fu_taixu", result: "fu_taixu", name: "太虛混元處理器", stones: 200000, desc: "機構級處理器,以巨鯨精骨與皇極天髓為引,唯基金經理人可組。", dropOnly: true, reqStage: 10, materials: [{ id: "longjinggu", n: 10 }, { id: "huangjitiansui", n: 5 }] },
];
