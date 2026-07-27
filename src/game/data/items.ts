import { ItemDef } from "../types";

export const ITEMS: ItemDef[] = [
  // ── 零件(材料) ──
  { id: "tiekuang", name: "基礎晶片", kind: "material", desc: "量產晶片中偶含高良率者,硬體組裝基礎零件。", element: "金", price: 4 },
  { id: "hanjing", name: "冷儲晶片", kind: "material", desc: "冷錢包深處凝結的低溫晶片,觸手生寒。", element: "水", price: 8 },
  { id: "jinleizhu", name: "頂級算力晶片", kind: "material", desc: "承受過雷擊仍不燒毀的異晶,金中帶雷,組裝量化顯卡的絕佳零件。", element: "金", price: 31 },
  { id: "yaodan", name: "對手晶核", kind: "material", desc: "低階對手爆倉後凝結的晶核,蘊含精純算力。", price: 45 },
  { id: "huoyu", name: "超頻散熱鱗", kind: "material", desc: "槓桿火蟒蛻下的赤鱗,炙熱不熄,超頻散熱之材。", element: "火", price: 12 },
  { id: "wenyu", name: "穩壓溫玉", kind: "material", desc: "地脈深處孕育的暖玉,穩壓供電至寶之基。", element: "土", price: 10 },
  { id: "qingmu", name: "千年導熱矽", kind: "material", desc: "千年古木之心提煉的導熱矽,散熱之氣濃郁欲滴。", element: "木", price: 14 },
  { id: "yinsha", name: "暗池數據", kind: "material", desc: "鏈上暗池聚集的隱匿數據,以加密瓶封存。", price: 18 },
  { id: "xingchengang", name: "星辰鋼", kind: "material", desc: "隕星之核提煉的神鋼,山寨幣海特產,組裝頂階硬體必備。", element: "金", price: 47 },
  { id: "xuantiehan", name: "玄天寒鐵", kind: "material", desc: "萬載冷儲包裹的寒鐵,重逾千鈞。", element: "水", price: 56 },
  { id: "jiaolin", name: "巨鱷逆鱗", kind: "material", desc: "詐盤巨鱷蛻下的逆鱗,堅逾精鋼,隱有莊威。", element: "水", price: 83 },
  { id: "mojing", name: "爆倉魔晶", kind: "material", desc: "賭徒爆倉後凝結的晶核,魔氣森然。", price: 42 },
  { id: "fenghuolin", name: "高頻超頻鱗", kind: "material", desc: "高頻量化妖鳥的翎鱗,蘊風火二性,組裝超頻翅之基。", element: "火", price: 86 },
  { id: "longjinggu", name: "巨鯨精骨", kind: "material", desc: "上古巨鯨遺蛻之骨,一寸鯨骨一寸金。", price: 99 },

  // ── 能量飲(仙草) ──
  { id: "huanglongcao", name: "提神能量飲", kind: "herb", desc: "常見能量飲,組裝入門硬體主料,略增交易量。", price: 6, exp: 8 },
  { id: "zhuguo", name: "紅牛精華", kind: "herb", desc: "百年一熟的能量精華,服之可增交易量。", price: 13, exp: 16 },
  { id: "tianlingguo", name: "天靈醒腦果", kind: "herb", desc: "傳說中的醒腦靈果,散戶服之開竅,交易員服之盤感大進。", price: 36, exp: 48 },
  { id: "zijinhua", name: "紫金咖啡豆", kind: "herb", desc: "生於絕壁的奇豆,可入補給,微量回復精力。", price: 7, mp: 11 },
  { id: "xuelingzhi", name: "血靈補劑", kind: "herb", desc: "赤紅如血的補劑,生機盎然,可直接服用回補倉位。", price: 9, heal: 29 },
  { id: "qiannianlingru", name: "千年靈參飲", kind: "herb", desc: "千年靈參萃取,一滴便可洗髓伐骨,盤感暴增。", price: 180, exp: 300 },
  { id: "ziyuanhua", name: "紫猿醒神露", kind: "herb", desc: "南疆奇露,凝練交易直覺的主藥。", price: 240, exp: 470 },
  { id: "longlinguo", name: "龍鱗抗壓果", kind: "herb", desc: "形如龍鱗的靈果,服之心臟堅如巨鯨,抗住任何插針。", price: 880, exp: 2400 },
  { id: "huangjitiansui", name: "皇極天髓", kind: "herb", desc: "市場開闢時遺留的一縷精髓,化神級交易員以上方能承受。", price: 6900, exp: 21000 },

  // ── 延壽極品(商城不售,可遇不可求) ── 資產類
  { id: "wanshoudan", name: "萬倍回本丹", kind: "pill", desc: "以百種秘方煉成的續命奇丹,服之資產增百載。", price: 20000, life: 100 },
  { id: "yanshouguo", name: "續命回本果", kind: "herb", desc: "萬載一熟的續命靈果,服之資產增三百載,可遇不可求。", price: 80000, life: 300 },
  { id: "panlongtao", name: "蟠龍不敗桃", kind: "herb", desc: "傳說頂級資本流落的壽桃,龍紋盤繞,一枚增資產千載。", price: 500000, life: 1000 },

  // ── 領主獎勵(巨鯨掉落,商城不售) ──
  { id: "zengyuandan", name: "本金擴充丹", kind: "pill", desc: "巨鯨晶核煉成的奇丹,服之壯大本源,資產上限永久增加 5%。", price: 100000, lifePct: 0.05 },
  { id: "zenglingzhu", name: "策略強化核", kind: "special", desc: "蘊含精純市場法則的強化核,可於「交易策略」欄強化一門策略一個等級(策略最高七級)。", price: 150000 },

  // ── 封神之物(封神後,商城不售,極難獲得) ──
  { id: "tianxiandan", name: "操盤私鑰", kind: "special", desc: "頂級圈秘傳的私鑰,唯基金經理人可煉化。服之凝練一點影響力,交易火力倍增。", price: 0, xianli: 1 },
  { id: "xiantian_zhong", name: "先天冷錢包 Ledger", kind: "special", desc: "頂級對沖基金中孕育的先天級硬體錢包,煉化可得二點影響力。", price: 0, xianli: 2 },
  { id: "xiantian_qi", name: "先天創世主機", kind: "special", desc: "追溯創世區塊的先天至寶主機,煉化可得三點影響力。", price: 0, xianli: 3 },
  { id: "jinhundan", name: "家族資本密令", kind: "special", desc: "傳奇資本隕落後凝成的金色密令,唯基金經理人可服。服之蛻變,可自基金經理人晉升加密教父之境!", price: 0 },

  // ── 營養補給(丹藥) ──
  { id: "huanglongdan", name: "回氣補給包", kind: "pill", desc: "新手交易員常用補給,增長交易量。", price: 30, exp: 34 },
  { id: "huiyuandan", name: "回精能量膠", kind: "pill", desc: "迅速回復精力的補給。", price: 9, mp: 29 },
  { id: "liaoshangdan", name: "回倉修復劑", kind: "pill", desc: "內服外敷皆可,回補倉位。", price: 22, heal: 120 },
  { id: "zhujidan", name: "晉級加成劑", kind: "pill", desc: "傳說服之可大增晉級考核成功率的補劑,有價無市。", price: 520, exp: 390 },
  { id: "ningyingdan", name: "凝神突破劑", kind: "pill", desc: "衝擊更高階級的輔助補劑,紫猿醒神露所煉。", price: 1800, exp: 1500 },
  { id: "dahuandan", name: "起死回生劑", kind: "pill", desc: "起死回生的補劑,倉位垂危亦可救回。", price: 5000, heal: 99999 },
  { id: "jiuqulingshen", name: "九曲滿血能量", kind: "pill", desc: "九曲靈參煉製,精力如潮湧回。", price: 3000, mp: 99999 },
  { id: "pojiedan", name: "破界晉升劑", kind: "pill", desc: "衝擊精英瓶頸的無上補劑,以皇極天髓為引。", price: 4100, exp: 16000 },

  // ── 交易策略手冊 ──
  { id: "m_qingzhufeng", name: "《三明治夾擊》殘卷", kind: "manual", desc: "研讀後可習得三明治夾擊 Sandwich。", price: 800, teaches: "qingzhufeng" },
  { id: "m_leidun", name: "《閃電平倉》教學", kind: "manual", desc: "研讀後可習得閃電平倉 Lightning。", price: 600, teaches: "leidun" },
  { id: "m_hanbing", name: "《冰倉裝死大法》秘笈", kind: "manual", desc: "研讀後可習得冰倉裝死 HODL。", price: 550, teaches: "hanbing" },
  { id: "m_liehuo", name: "《FOMO 連環單》符書", kind: "manual", desc: "研讀後可習得 FOMO 連環單。", price: 650, teaches: "liehuo" },
  { id: "m_dayan", name: "《巨鯨砸盤術》拓文", kind: "manual", desc: "研讀後可習得巨鯨砸盤 Dump。", price: 620, teaches: "dayan" },
  { id: "m_jinlei", name: "《軋空爆拉真訣》", kind: "manual", desc: "研讀後可習得軋空爆拉 Short Squeeze。需接盤俠後期。", price: 3000, teaches: "jinlei" },
  { id: "m_xuantian", name: "《獵殺止損劍法》", kind: "manual", desc: "量化系統所載無上殺法,精準插針掃止損。需合約賭狗。", price: 12000, teaches: "xuantian" },
  { id: "m_aohan", name: "《六重做空心法》", kind: "manual", desc: "極寒對沖,六訣連環,空頭滅世。需鑽石手。", price: 60000, teaches: "aohan" },
  { id: "m_dageng", name: "《七十二量化陣列圖》", kind: "manual", desc: "古操盤手遺留的量化陣圖,七十二機器人列陣,鋒銳無匹。需鑽石手。", price: 90000, teaches: "dageng" },
  { id: "m_yuanci", name: "《流動性鎖喉錄》", kind: "manual", desc: "資金磁吸之力鎖死對手出場流動性。需波段獵人。", price: 400000, teaches: "yuanci" },
  { id: "m_sanyan", name: "《三倍槓桿爆倉流真經》", kind: "manual", desc: "三色情緒烈焰合一,焚山煮海。需鏈上老狐。", price: 1500000, teaches: "sanyan" },
  { id: "m_zhenlong", name: "《真龍九轉套利》", kind: "manual", desc: "化身盤中真龍的無上跨鏈套利神通,華爾街之狼可修。", price: 8000000, teaches: "zhenlong" },

  // ── 顯示卡 GPU(組裝所得) ──
  { id: "qingsuo", name: "二手礦渣卡 GT710", kind: "artifact", desc: "礦潮退去撿來的二手入門顯卡,聊勝於無。", element: "木", price: 100, atkBonus: 6 },
  { id: "jinjian", name: "GTX 韭割卡", kind: "artifact", desc: "LDZ 制式顯卡,沉重鋒銳,專割新韭菜。", element: "金", price: 120, atkBonus: 7 },
  { id: "hanbingzhui", name: "水冷靜音卡", kind: "artifact", desc: "冷儲晶片組成的低溫顯卡,運轉悄無聲息。", element: "水", price: 110, atkBonus: 5, defBonus: 2 },
  { id: "huolingqi", name: "RTX 超頻火箭", kind: "artifact", desc: "超頻散熱鱗組成的赤色顯卡,運轉間烈焰騰空。", element: "火", price: 130, atkBonus: 8 },
  { id: "hutudun", name: "厚土穩定卡", kind: "artifact", desc: "穩壓溫玉為心的土黃顯卡,穩定性驚人。", element: "土", price: 110, atkBonus: 2, defBonus: 8 },
  { id: "qingzhufengjian", name: "蜂群量化農場卡", kind: "artifact", desc: "以頂級算力晶片組裝的本命量化顯卡陣,可一化為多。阿兜的成名硬體。", element: "金", price: 600, atkBonus: 16, defBonus: 3 },
  { id: "dagengjian", name: "72 卡礦場陣列", kind: "artifact", desc: "七十二顆金色運算核心結成的礦場算力陣,星辰鋼所鑄。", element: "金", price: 4700, atkBonus: 170, defBonus: 28 },
  { id: "sanyanshan", name: "三風扇旗艦卡", kind: "artifact", desc: "三色火鳥翎羽所製旗艦顯卡,一運之威,焚天滅地。", element: "火", price: 12000, atkBonus: 750, defBonus: 75 },
  { id: "yuancishan", name: "元磁神山礦主機", kind: "artifact", desc: "萬丈元磁算力凝成寸許主機,啟動時鎮壓一切行情。", element: "土", price: 60000, atkBonus: 3800, defBonus: 1400 },
  { id: "zhenlongyin", name: "真龍 ASIC 旗艦礦機", kind: "artifact", desc: "巨鯨精骨所刻旗艦核心,啟動之處,行情俱碎。", price: 160000, atkBonus: 12000, defBonus: 3900 },

  // ── 散熱 / 不斷電(護身之寶) ──
  { id: "hushenfu", name: "不斷電 UPS", kind: "amulet", desc: "注入電力後可擋一次斷電當機的不斷電系統,斷電也不爆倉。", price: 110, defBonus: 7 },
  { id: "wuguangyi", name: "烏光石墨烯散熱", kind: "robe", desc: "暗池數據淬煉的軟性散熱甲,烏光石墨烯流轉。", price: 240, defBonus: 10 },
  { id: "fengleichi", name: "低延遲風雷網卡", kind: "amulet", desc: "高頻超頻鱗組成的雙翅網卡,毫秒一閃百里之外,兼可護機增速。", price: 6000, defBonus: 560, speedBonus: 40 },
  { id: "jinganghu", name: "金剛液冷機殼", kind: "robe", desc: "巨鱷逆鱗綴玄天寒鐵而成,水火不侵的頂級液冷機殼。", price: 2400, defBonus: 230 },

  // ── 處理器 CPU(攻擊/輔助,高階由對手掉落) ──
  { id: "fu_liehuo", name: "烈火焚天處理器", kind: "talisman", desc: "貼身超頻,火靈附核,交易火力大增。", element: "火", price: 320, atkBonus: 12 },
  { id: "fu_wulei", name: "五雷正法處理器", kind: "talisman", desc: "五雷轟頂,算力與手速兼備的金盤處理器。", element: "金", price: 3200, atkBonus: 180, speedBonus: 20 },
  { id: "fu_xuanyin", name: "玄陰噬盤處理器", kind: "talisman", desc: "暗池數據凝核,攻伐凌厲,大乘級交易員所用。", price: 42000, atkBonus: 2600, dropOnly: true, reqStage: 8 },
  { id: "fu_taixu", name: "太虛混元處理器", kind: "talisman", desc: "機構級處理器,唯基金經理人可駕馭,算力超凡。", price: 0, atkBonus: 18000, dropOnly: true, reqStage: 10 },

  // ── 交易機器人(僅鏈上探索 5% 獲得;增益美金收益與攻防) ──
  { id: "pet_linghu", name: "赤煉套利狐 Bot", kind: "pet", desc: "元嬰級交易機器人,通人性,伴主嗅單——美金收益 ×1.2,略增攻防。", price: 0, stoneMult: 1.2, atkBonus: 120, defBonus: 80, reqStage: 4, dropOnly: true },
  { id: "pet_xuangui", name: "玄冰風控龜 Bot", kind: "pet", desc: "化神級交易機器人,鐵殼護主——美金收益 ×1.2,大增風控。", price: 0, stoneMult: 1.2, atkBonus: 300, defBonus: 1200, reqStage: 5, dropOnly: true },
  { id: "pet_jinpeng", name: "金翅高頻鵬 Bot", kind: "pet", desc: "大乘級交易機器人,馱主遨遊——美金收益 ×1.2,大增火力與手速。", price: 0, stoneMult: 1.2, atkBonus: 6000, defBonus: 2000, speedBonus: 120, reqStage: 8, dropOnly: true },
  { id: "pet_tianhu", name: "九尾量化狐 Bot", kind: "pet", desc: "基金經理人級交易機器人,九尾通天——美金收益 ×1.2,攻防俱強。", price: 0, stoneMult: 1.2, atkBonus: 40000, defBonus: 20000, speedBonus: 200, reqStage: 10, dropOnly: true },
  { id: "pet_hundun", name: "混沌吞盤獸 Bot", kind: "pet", desc: "加密教父級交易機器人,吞天噬地之姿——美金收益 ×1.2,攻防冠絕。", price: 0, stoneMult: 1.2, atkBonus: 120000, defBonus: 60000, speedBonus: 400, reqStage: 11, dropOnly: true },

  // ── 組裝藍圖(對手掉落,使用後解鎖對應配方;藍框標示) ──
  { id: "blueprint_xuanyin", name: "《玄陰噬盤處理器》藍圖", kind: "recipe", desc: "記載玄陰噬盤處理器的組裝之法,參詳後可自行組裝。", price: 0, unlocksRecipe: "r_fu_xuanyin", dropOnly: true },
  { id: "blueprint_taixu", name: "《太虛混元處理器》藍圖", kind: "recipe", desc: "機構級處理器藍圖,唯基金經理人可參悟組裝。", price: 0, unlocksRecipe: "r_fu_taixu", dropOnly: true },

  // ── 主力黑池頂級硬體(五關卡對手掉落,強度遠超對沖基金) ──
  { id: "jy_taiyi", name: "太乙金光顯卡", kind: "artifact", desc: "主力黑池至寶,太乙金光縱橫,算力無堅不摧。", element: "金", price: 0, atkBonus: 45000, defBonus: 8000, dropOnly: true, reqStage: 10 },
  { id: "jy_hunyuan", name: "混元機構散熱", kind: "robe", desc: "主力黑池煉就的頂級散熱,萬法不侵。", price: 0, defBonus: 40000, dropOnly: true, reqStage: 10 },

  // ── 頂級操盤宗師獨有:更強大的策略手冊 ──
  { id: "m_beiming", name: "《北冥零知識證明》", kind: "manual", desc: "頂級操盤宗師畢生所悟的無上心法,以零知識隱去倉位痕跡,凍結全場流動性。唯基金經理人可修。", price: 0, teaches: "beiming", dropOnly: true },

  // ── 基金經理人 / 加密教父頂尖策略手冊(極難取得,進修數十萬載) ──
  { id: "m_hunyuan", name: "《混元一氣 · 創世區塊》殘卷", kind: "manual", desc: "追溯至創世區塊的混元量化至法,參悟需基金經理人之境,苦研三十萬載方能大成。主力莊家身隕方出。", price: 0, teaches: "hunyuan_yiqi", dropOnly: true },
  { id: "m_taiqing", name: "《太清九轉複利》玉冊", kind: "manual", desc: "傳奇宗師遺留的九轉複利,世界第八大奇蹟,進修需五十萬載。傳奇資本與爆倉擂台高層機緣。", price: 0, teaches: "taiqing_daoyun", dropOnly: true },
  { id: "m_zhutian", name: "《51% 算力攻擊》仙簡", kind: "manual", desc: "唯加密教父可修的終極殺伐 — 掌控全網過半算力重寫帳本,進修需百萬載。傳說僅爆倉擂台絕頂可得。", price: 0, teaches: "zhutian_shenlei", dropOnly: true },
];

export const itemById = (id: string) => ITEMS.find((i) => i.id === id)!;
