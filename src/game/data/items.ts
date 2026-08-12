import { ItemDef } from "../types";

export const ITEMS: ItemDef[] = [
  // ── 材料 ──
  { id: "tiekuang", name: "精鐵礦", kind: "material", desc: "凡鐵中偶含靈性者,煉器基礎材料。", element: "金", price: 4 },
  { id: "hanjing", name: "寒玉精", kind: "material", desc: "萬年寒潭底凝結的玉精,觸手生寒。", element: "水", price: 8 },
  { id: "jinleizhu", name: "金雷竹枝", kind: "material", desc: "受雷擊而不死的異竹,金中帶雷,煉製飛劍的絕佳材料。", element: "金", price: 31 },
  { id: "yaodan", name: "妖獸內丹", kind: "material", desc: "一階妖獸體內凝結的內丹,蘊含精純妖力。", price: 45 },
  { id: "huoyu", name: "火蟒之鱗", kind: "material", desc: "火蟒蛻下的赤鱗,炙熱不熄。", element: "火", price: 12 },
  { id: "wenyu", name: "溫玉", kind: "material", desc: "地脈深處孕育的暖玉,土行至寶之基。", element: "土", price: 10 },
  { id: "qingmu", name: "千年青木心", kind: "material", desc: "千年古木之心,木靈之氣濃郁欲滴。", element: "木", price: 14 },
  { id: "yinsha", name: "陰煞之氣", kind: "material", desc: "洞窟深處聚集的陰煞,以玉瓶封存。", price: 18 },
  { id: "xingchengang", name: "星辰鋼", kind: "material", desc: "隕星之核提煉的神鋼,亂星海特產,煉製頂階法寶必備。", element: "金", price: 47 },
  { id: "xuantiehan", name: "玄天寒鐵", kind: "material", desc: "萬載玄冰包裹的寒鐵,重逾千鈞。", element: "水", price: 56 },
  { id: "jiaolin", name: "蛟龍之鱗", kind: "material", desc: "血蛟蛻下的逆鱗,堅逾精鋼,隱有龍威。", element: "水", price: 83 },
  { id: "mojing", name: "魔道魔晶", kind: "material", desc: "魔修隕落後凝結的晶核,魔氣森然。", price: 42 },
  { id: "fenghuolin", name: "風火之鱗", kind: "material", desc: "天嵐妖鳥的翎鱗,蘊風火二性,煉風雷翅之基。", element: "火", price: 86 },
  { id: "longjinggu", name: "真龍精骨", kind: "material", desc: "上古真龍遺蛻之骨,一寸龍骨一寸金。", price: 99 },
  { id: "jinyuan_lingsha", name: "金源靈砂", kind: "material", desc: "金源仙域特有的靈砂,金光流轉,乃頂階裝備必備爐料。", element: "金", price: 500 },
  { id: "taiyi_jingjin", name: "太乙精金", kind: "material", desc: "金源仙域深處提煉的太乙精金,質地冠絕凡俗礦料。", element: "金", price: 900 },
  { id: "xuantian_canpian", name: "玄天殘片", kind: "material", desc: "蠻荒異界怪物體內殘留的太古仙器碎片,玄光流轉,乃煉化玄天仙器的必備材料。", price: 15000 },
  { id: "poshou_jinhow", name: "破曉精華", kind: "material", desc: "創世之初，天地誕生時第一滴精華。", price: 33000 },

  // ── 仙草 ──
  { id: "huanglongcao", name: "黃龍草", kind: "herb", desc: "常見靈草,煉製黃龍丹主藥。", price: 6, exp: 8 },
  { id: "zhuguo", name: "朱果", kind: "herb", desc: "百年一熟的靈果,服之可增修為。", price: 13, exp: 26 },
  { id: "tianlingguo", name: "地靈果", kind: "herb", desc: "傳說中的靈果,凡人服之可開靈根,修士服之修為大進。", price: 36, exp: 48 },
  { id: "zijinhua", name: "紫金花", kind: "herb", desc: "生於絕壁的奇花,可入丹,微量回復法力。", price: 7, mp: 50 },
  { id: "xuelingzhi", name: "血靈芝", kind: "herb", desc: "赤紅如血的靈芝,生機盎然,可直接服用療傷。", price: 9, heal: 29 },
  { id: "qiannianlingru", name: "千年靈乳", kind: "herb", desc: "石鐘乳萬載凝成,一滴便可洗髓伐骨。", price: 180, exp: 400 },
  { id: "ziyuanhua", name: "紫猿花", kind: "herb", desc: "南疆奇花,煉製凝嬰丹的主藥。", price: 240, exp: 870 },
  { id: "longlinguo", name: "龍鱗果", kind: "herb", desc: "形如龍鱗的靈果,服之肉身堅如蛟龍。", price: 880, exp: 2400 },
  { id: "huangjitiansui", name: "皇極天髓", kind: "herb", desc: "天地開闢時遺留的一縷精髓,化神以上方能承受。", price: 6900, exp: 21000 },
  { id: "nimetanti", name: "古龍真血", kind: "herb", desc: "遠古龍族遺留真血，提供破天修為。", price: 36900, exp: 160000 },

  // ── 延壽極品(坊市不售,可遇不可求) ──
  { id: "wanshoudan", name: "百壽丹", kind: "pill", desc: "以百種靈藥煉成的延壽奇丹,服之增壽百載。", price: 20000, life: 100 },
  { id: "yanshouguo", name: "延壽果", kind: "herb", desc: "萬載一熟的延壽靈果,服之增壽三百載,可遇不可求。", price: 80000, life: 300 },
  { id: "panlongtao", name: "蟠龍壽桃", kind: "herb", desc: "傳說仙界流落的壽桃,龍紋盤繞,一枚增壽千載。", price: 500000, life: 1000 },
  { id: "panlongtaoshu", name: "玄命果", kind: "herb", desc: "逆天改命，延長壽源，源壽無疆。", price: 50000000, life: 20000 },

  // ── 領主獎勵(地域王掉落,坊市不售) ──
  { id: "zengyuandan", name: "增元丹", kind: "pill", desc: "地域王內丹煉成的奇丹,服之壯大本源,壽元上限永久增加 5%。", price: 100000, lifePct: 0.05 },
  { id: "zenglingzhu", name: "增靈珠", kind: "special", desc: "蘊含精純法則之力的靈珠,可於「仙法」欄位強化一門仙法一個等級(法術最高七級)。", price: 150000 },

  // ── 真仙之物(飛昇後,坊市不售,極難獲得) ──
  { id: "tianxiandan", name: "天仙丹", kind: "special", desc: "仙界秘傳,唯真仙可煉化。服之凝練一點仙靈力,攻伐之力倍增。", price: 0, xianli: 1 },
  { id: "xiantian_zhong", name: "先天玄靈鐘", kind: "special", desc: "北寒仙域中孕育的先天仙器,煉化可得二點仙靈力。", price: 0, xianli: 2 },
  { id: "xiantian_qi", name: "破天丹", kind: "special", desc: "開天遺留的至寶,煉化可得三點仙靈力。", price: 0, xianli: 3 },
  { id: "jinhundan", name: "金魂丹", kind: "special", desc: "太上金仙隕落後凝成的金色魂丹,唯真仙可服。服之魂魄蛻變,可自真仙突破至金仙之境!", price: 0 },

  // ── 丹藥 ──
  { id: "huanglongdan", name: "黃龍丹", kind: "pill", desc: "煉氣期修士常用補氣丹藥,增長修為。", price: 30, exp: 40 },
  { id: "huiyuandan", name: "回元丹", kind: "pill", desc: "迅速回復法力的丹藥。", price: 9, mp: 50 },
  { id: "liaoshangdan", name: "療傷丹", kind: "pill", desc: "外敷內服皆可,癒合傷勢。", price: 22, heal: 120 },
  { id: "zhujidan", name: "築基丹", kind: "pill", desc: "傳說服之可大增築基成功率的靈丹,有價無市。", price: 520, exp: 390 },
  { id: "ningyingdan", name: "凝嬰丹", kind: "pill", desc: "結丹修士凝結元嬰的輔藥,紫猿花所煉。", price: 1800, exp: 1500 },
  { id: "dahuandan", name: "大還丹", kind: "pill", desc: "起死回生的靈丹,重傷垂死亦可救回。", price: 5000, heal: 99999 },
  { id: "jiuqulingshen", name: "九曲靈參丹", kind: "pill", desc: "九曲靈參煉製,法力如潮湧回。", price: 3000, mp: 99999 },
  { id: "pojiedan", name: "破界丹", kind: "pill", desc: "衝擊大乘瓶頸的無上靈丹,以皇極天髓為引。", price: 4100, exp: 26000 },

  // ── 仙法秘笈 ──
  { id: "m_qingzhufeng", name: "《青竹蜂雲劍訣》殘卷", kind: "manual", desc: "研讀後可習得青竹蜂雲劍訣。", price: 800, teaches: "qingzhufeng" },
  { id: "m_leidun", name: "《雷遁術》玉簡", kind: "manual", desc: "研讀後可習得雷遁術。", price: 600, teaches: "leidun" },
  { id: "m_hanbing", name: "《寒冰破》秘笈", kind: "manual", desc: "研讀後可習得寒冰破。", price: 550, teaches: "hanbing" },
  { id: "m_liehuo", name: "《烈火符陣》符書", kind: "manual", desc: "研讀後可習得烈火符陣。", price: 650, teaches: "liehuo" },
  { id: "m_dayan", name: "《大衍訣》石碑拓文", kind: "manual", desc: "研讀後可習得大衍訣。", price: 620, teaches: "dayan" },
  { id: "m_jinlei", name: "《金雷竹御雷真訣》", kind: "manual", desc: "研讀後可習得御雷真訣。需築基期。", price: 3000, teaches: "jinlei" },
  { id: "m_xuantian", name: "《昊天斬靈劍法》", kind: "manual", desc: "玄天之寶所載無上劍法。需結丹期。", price: 12000, teaches: "xuantian" },
  { id: "m_aohan", name: "《傲寒六訣》", kind: "manual", desc: "極寒魔功,六訣連環,寒潮滅世。需元嬰期。", price: 60000, teaches: "aohan" },
  { id: "m_dageng", name: "《大庚劍陣圖》", kind: "manual", desc: "古修士遺留的劍陣圖,金精所煉飛劍列陣,鋒銳無匹。需元嬰期。", price: 90000, teaches: "dageng" },
  { id: "m_yuanci", name: "《元磁神光錄》", kind: "manual", desc: "元磁山之力化神光,鎮壓萬法。需化神期。", price: 400000, teaches: "yuanci" },
  { id: "m_sanyan", name: "《三焰化火真經》", kind: "manual", desc: "三色靈焰合一,焚山煮海。需煉虛期。", price: 1500000, teaches: "sanyan" },
  { id: "m_zhenlong", name: "《真龍九變》", kind: "manual", desc: "化身真龍的無上神通,大乘可修。", price: 8000000, teaches: "zhenlong" },

  // ── 法器(煉製所得) ──
  { id: "qingsuo", name: "青索劍", kind: "artifact", desc: "青光如索的木系飛劍。", element: "木", price: 100, atkBonus: 6 },
  { id: "jinjian", name: "金光巨劍", kind: "artifact", desc: "巨劍門制式法器,沉重鋒銳。", element: "金", price: 120, atkBonus: 7 },
  { id: "hanbingzhui", name: "寒冰錐", kind: "artifact", desc: "寒玉精煉成的冰錐法器。", element: "水", price: 110, atkBonus: 5, defBonus: 2 },
  { id: "huolingqi", name: "火靈旗", kind: "artifact", desc: "火蟒鱗煉製的赤色小旗,揮動間烈焰騰空。", element: "火", price: 130, atkBonus: 8 },
  { id: "hutudun", name: "厚土盾", kind: "artifact", desc: "溫玉為心的土黃圓盾,防禦驚人。", element: "土", price: 110, atkBonus: 2, defBonus: 8 },
  { id: "qingzhufengjian", name: "青竹蜂雲劍", kind: "artifact", desc: "以金雷竹煉製的本命飛劍,可一化為多。韓立的成名法寶。", element: "金", price: 600, atkBonus: 16, defBonus: 3 },
  { id: "dagengjian", name: "大庚劍陣", kind: "artifact", desc: "七十二口金色小劍結成的劍陣,青蒙山金精所煉。", element: "金", price: 4700, atkBonus: 170, defBonus: 28 },
  { id: "sanyanshan", name: "三焰扇", kind: "artifact", desc: "三色火鳥翎羽所製寶扇,一扇之威,焚天滅地。", element: "火", price: 12000, atkBonus: 750, defBonus: 75 },
  { id: "yuancishan", name: "元磁神山", kind: "artifact", desc: "萬丈元磁山煉成寸許小山,祭出時鎮壓一切飛遁。", element: "土", price: 60000, atkBonus: 3800, defBonus: 1400 },
  { id: "zhenlongyin", name: "真龍璽", kind: "artifact", desc: "真龍精骨所刻帝璽,蓋落之處,山河俱碎。", price: 360000, atkBonus: 12000, defBonus: 3900 },

  // ── 護身之寶 ──
  { id: "hushenfu", name: "護身符", kind: "amulet", desc: "注入法力後可擋一次致命攻擊的符籙。", price: 110, defBonus: 7 },
  { id: "wuguangyi", name: "烏光甲衣", kind: "robe", desc: "陰煞之氣淬煉的軟甲,烏光流轉。", price: 240, defBonus: 10 },
  { id: "fengleichi", name: "風雷翅", kind: "amulet", desc: "風火之鱗煉製的雙翅,雷光一閃百里之外,兼可護身增速。", price: 6000, defBonus: 560, speedBonus: 40 },
  { id: "jinganghu", name: "金剛璃甲", kind: "robe", desc: "蛟龍之鱗綴玄天寒鐵而成,刀劍難傷。", price: 2400, defBonus: 230 },

  // ── 符籙(攻擊/輔助,符籙槽;高階由妖獸掉落) ──
  { id: "fu_liehuo", name: "烈火焚天符", kind: "talisman", desc: "貼身催動,火靈附刃,攻擊大增。", element: "火", price: 320, atkBonus: 20 },
  { id: "fu_wulei", name: "五雷正法符", kind: "talisman", desc: "五雷轟頂,攻速兼備的雷系符籙。", element: "金", price: 12000, atkBonus: 180, speedBonus: 20 },
  { id: "fu_xuanyin", name: "玄陰噬魂符", kind: "talisman", desc: "陰煞凝符,攻伐凌厲,大乘修士所用。", price: 342000, atkBonus: 2600, dropOnly: true, reqStage: 8 },
  { id: "fu_taixu", name: "太虛混元符", kind: "talisman", desc: "仙家符籙,唯真仙可禦,攻伐之力超凡。", price: 1600000, atkBonus: 18000, dropOnly: true, reqStage: 10 },

  // ── 靈寵(寵物槽,僅探索秘境 5% 獲得;增益靈石收益與攻防) ──
  { id: "pet_linghu", name: "赤煉靈狐", kind: "pet", desc: "元嬰級靈寵,通人性,伴主嗅寶——靈石收益 ×1.2,略增攻防。", price: 0, stoneMult: 1.2, atkBonus: 120, defBonus: 80, reqStage: 4, dropOnly: true },
  { id: "pet_xuangui", name: "玄冰靈龜", kind: "pet", desc: "化神級靈寵,龜甲護主——靈石收益 ×1.2,大增防禦。", price: 0, stoneMult: 1.2, atkBonus: 300, defBonus: 1200, reqStage: 5, dropOnly: true },
  { id: "pet_jinpeng", name: "金翅靈鵬", kind: "pet", desc: "大乘級靈寵,馱主遨遊——靈石收益 ×1.2,大增攻擊與速度。", price: 0, stoneMult: 1.2, atkBonus: 6000, defBonus: 2000, speedBonus: 120, reqStage: 8, dropOnly: true },
  { id: "pet_tianhu", name: "九尾天狐", kind: "pet", desc: "真仙級靈寵,九尾通天——靈石收益 ×1.2,攻防俱強。", price: 0, stoneMult: 1.2, atkBonus: 40000, defBonus: 20000, speedBonus: 200, reqStage: 10, dropOnly: true },
  { id: "pet_hundun", name: "混沌幼獸", kind: "pet", desc: "金仙級靈寵,吞天噬地之姿——靈石收益 ×1.2,攻防冠絕。", price: 0, stoneMult: 1.2, atkBonus: 120000, defBonus: 60000, speedBonus: 400, reqStage: 11, dropOnly: true },

  // ── 煉器圖譜(妖獸掉落,使用後解鎖對應配方;藍框標示) ──
  { id: "blueprint_xuanyin", name: "《玄陰噬魂符》符籙圖譜", kind: "recipe", desc: "記載玄陰噬魂符的煉製之法,參詳後可自行煉製。", price: 0, unlocksRecipe: "r_fu_xuanyin", dropOnly: true },
  { id: "blueprint_taixu", name: "《太虛混元符》仙符圖譜", kind: "recipe", desc: "仙家符籙圖譜,唯真仙可參悟煉製。", price: 0, unlocksRecipe: "r_fu_taixu", dropOnly: true },

  // ── 金源仙域仙器(五關卡妖獸掉落,強度遠超北寒) ──
  { id: "jy_taiyi", name: "太乙金光劍", kind: "artifact", desc: "金源仙域至寶,太乙金光縱橫,無堅不摧。", element: "金", price: 0, atkBonus: 45000, defBonus: 8000, dropOnly: true, reqStage: 10 },
  { id: "jy_hunyuan", name: "混元仙袍", kind: "robe", desc: "金源仙域煉就的仙袍,萬法不侵。", price: 0, defBonus: 40000, dropOnly: true, reqStage: 10 },

  // ── 金源仙域圖譜配方所煉裝備(1.6 版新增,需先由金源仙域怪物掉落對應圖譜) ──
  { id: "jinyuan_ji", name: "金源戮神戟", kind: "artifact", desc: "以太乙精金反覆錘煉的戮神長戟,金源之力貫注戟身,一擊摧城。", element: "金", price: 0, atkBonus: 35000, defBonus: 5000, dropOnly: true, reqStage: 10 },
  { id: "taixu_hunyuanjia", name: "太虛混元甲", kind: "robe", desc: "金源靈砂淬煉的護體重甲,萬法加身,固若金源本源。", price: 0, defBonus: 30000, dropOnly: true, reqStage: 10 },
  { id: "jinyuan_hujing", name: "金源護道鏡", kind: "amulet", desc: "金源靈砂磨製的護道寶鏡,可映萬法、避凶趨吉。", price: 0, defBonus: 25000, speedBonus: 100, dropOnly: true, reqStage: 10 },
  { id: "zhuxian_fu", name: "誅仙滅魂符", kind: "talisman", desc: "太乙精金為引凝成的殺伐仙符,一符出手,誅仙滅魂。", element: "金", price: 0, atkBonus: 20000, dropOnly: true, reqStage: 10 },
  { id: "zaohua_jian", name: "造化戮仙劍", kind: "artifact", desc: "金源靈砂與太乙精金合煉的造化之劍,劍出無雙,戮仙屠魔。", element: "金", price: 0, atkBonus: 30000, defBonus: 8000, dropOnly: true, reqStage: 10 },

  // ── 金源仙域圖譜(妖獸掉落,使用後解鎖上列裝備配方) ──
  { id: "blueprint_jishen", name: "《金源戮神戟》煉器圖譜", kind: "recipe", desc: "記載金源戮神戟的煉製之法,參詳後可自行煉製。", price: 0, unlocksRecipe: "r_jinyuan_ji", dropOnly: true },
  { id: "blueprint_hunyuanjia", name: "《太虛混元甲》煉器圖譜", kind: "recipe", desc: "記載太虛混元甲的煉製之法,參詳後可自行煉製。", price: 0, unlocksRecipe: "r_taixu_hunyuanjia", dropOnly: true },
  { id: "blueprint_hudao", name: "《金源護道鏡》煉器圖譜", kind: "recipe", desc: "記載金源護道鏡的煉製之法,參詳後可自行煉製。", price: 0, unlocksRecipe: "r_jinyuan_hujing", dropOnly: true },
  { id: "blueprint_zhuxian", name: "《誅仙滅魂符》煉器圖譜", kind: "recipe", desc: "記載誅仙滅魂符的煉製之法,參詳後可自行煉製。", price: 0, unlocksRecipe: "r_zhuxian_fu", dropOnly: true },
  { id: "blueprint_zaohuajian", name: "《造化戮仙劍》煉器圖譜", kind: "recipe", desc: "記載造化戮仙劍的煉製之法,參詳後可自行煉製。", price: 0, unlocksRecipe: "r_zaohua_jian", dropOnly: true },

  // ── 命器(天命符 / 地運符,地域王稀有掉落,提升突破成功率,不分境界) ──
  { id: "tianmingfu", name: "天命符", kind: "mingqi", desc: "命格之力凝成的符籙,大晉噬天鬼帝身死方遺,窺得一線天機——不論何種境界,突破成功率 +5%。", price: 0, dropOnly: true, breakBonus: 0.05 },
  { id: "diyunfu", name: "地運符", kind: "mingqi", desc: "地脈氣運匯聚而成的符籙,萬鱗海皇秘藏之物——佩戴後借地氣相助,突破成功率 +3%。", price: 0, dropOnly: true, breakBonus: 0.03 },

  // ── 真仙丹(渡劫飛昇必備,唯太古龍祖掉落;嘗試突破時無論成敗皆消耗) ──
  { id: "zhenxiandan", name: "真仙丹", kind: "special", desc: "太古龍祖精血凝成的無上奇丹,渡劫飛昇的必備之物。嘗試渡劫時,無論突破成敗皆會耗盡藥力。", price: 0 },

  // ── 黑市限定(壽元每過 20~100 年,有機會出現的來路不明商販) ──
  { id: "heishi_wanshoudan", name: "黑市百壽丹", kind: "pill", desc: "來路不明的黑市貨色,藥效遜於正宗百壽丹,服之延壽五十載。", price: 0, life: 50 },

  // ── 獨立黑市(常駐,不受壽元門檻限制) ──
  { id: "changshenghe", name: "長生盒", kind: "special", desc: "獨立黑市常年販售的來路不明木盒,內藏各式延年益壽的丹藥,開啟後隨機得一味。", price: 300000 },

  // ── 北寒仙尊獨有:更強大的仙法秘笈 ──
  { id: "m_beiming", name: "《北冥玄天訣》", kind: "manual", desc: "北寒仙尊畢生所悟的無上仙法,水行之極,凍結仙靈。唯真仙可修。", price: 0, teaches: "beiming", dropOnly: true },

  // ── 先天造化丹(金源仙域怪物稀有掉落,築基期服下直升煉虛期) ──
  { id: "xiantian_zaohuadan", name: "先天造化丹", kind: "special", desc: "金源仙域孕育的造化奇丹,築基期修士服之,可連跨結丹、元嬰、化神三境,直升煉虛!藥性霸道,唯築基期可服。", price: 0 },

  // ── 玄天仙器(玄天殘片 + 太乙精魂煉成,隨機一種,唯太乙境可用,屬性隨煉化品質浮動 100%~300%) ──
  { id: "xuantian_zhanling_jian", name: "玄天斬靈劍", kind: "artifact", desc: "玄天至寶,劍出斬靈,鋒芒所至萬法俱滅。", element: "金", price: 0, atkBonus: 300000, dropOnly: false, reqStage: 12 },
  { id: "xuantian_hulu", name: "玄天葫蘆", kind: "artifact", desc: "玄天至寶,葫蘆納萬法於一體,攻守兼備。", price: 0, atkBonus: 160000, defBonus: 250000, dropOnly: false, reqStage: 12 },
  { id: "potian_chui", name: "破天槌", kind: "artifact", desc: "玄天至寶,一槌落下,天穹為之破碎。", element: "土", price: 0, atkBonus: 450000, defBonus: 50000, dropOnly: false, reqStage: 12 },
  { id: "tianhu_huaxie_ren", name: "天狐化血刃", kind: "artifact", desc: "玄天至寶,刃鋒過處血氣自燃,身法如影隨形。", element: "火", price: 0, atkBonus: 380000, speedBonus: 300, dropOnly: false, reqStage: 12 },
  { id: "xuantian_zhanmo_jian", name: "玄天斬魔劍", kind: "artifact", desc: "玄天至寶,專誅心魔外道,劍意剛猛無儔。", element: "木", price: 0, atkBonus: 420000, defBonus: 80000, dropOnly: false, reqStage: 12 },
  { id: "huantian_jing", name: "幻天鏡", kind: "artifact", desc: "玄天至寶,鏡面幻化萬千身法,虛實難辨。", element: "水", price: 0, atkBonus: 180000, defBonus: 350000, speedBonus: 400, dropOnly: false, reqStage: 12 },

  // ── 太乙精魂(蠻荒異界四大地域王專屬掉落,集滿四枚於太乙殿突破太乙境) ──
  { id: "taiyi_jinghun_tianhu", name: "太乙精魂 - 天狐", kind: "special", desc: "天狐身隕凝成的精魂,赤焰流轉。集滿四枚太乙精魂,可於太乙殿突破太乙境。", element: "火", price: 0 },
  { id: "taiyi_jinghun_zhenlong", name: "太乙精魂 - 真龍", kind: "special", desc: "真龍身隕凝成的精魂,龍威隱現。集滿四枚太乙精魂,可於太乙殿突破太乙境。", element: "木", price: 0 },
  { id: "taiyi_jinghun_baxia", name: "太乙精魂 - 霸下", kind: "special", desc: "霸下身隕凝成的精魂,厚重渾樸。集滿四枚太乙精魂,可於太乙殿突破太乙境。", element: "土", price: 0 },
  { id: "taiyi_jinghun_pixiu", name: "太乙精魂 - 黑眼貔貅", kind: "special", desc: "黑眼貔貅身隕凝成的精魂,幽光流轉。集滿四枚太乙精魂,可於太乙殿突破太乙境。", element: "金", price: 0 },

  // ── 五色異星盤(金源仙域怪物稀有掉落,集滿金木水火土五枚可開啟蠻荒異界) ──
  { id: "xingpan_jin", name: "異星盤(金)", kind: "special", desc: "金源仙域深處淬煉的異星圓盤,金光流轉。集滿五色異星盤,可開啟蠻荒異界之門。", element: "金", price: 0 },
  { id: "xingpan_mu", name: "異星盤(木)", kind: "special", desc: "金源仙域深處淬煉的異星圓盤,木紋暗湧。集滿五色異星盤,可開啟蠻荒異界之門。", element: "木", price: 0 },
  { id: "xingpan_shui", name: "異星盤(水)", kind: "special", desc: "金源仙域深處淬煉的異星圓盤,水波盪漾。集滿五色異星盤,可開啟蠻荒異界之門。", element: "水", price: 0 },
  { id: "xingpan_huo", name: "異星盤(火)", kind: "special", desc: "金源仙域深處淬煉的異星圓盤,火紋灼灼。集滿五色異星盤,可開啟蠻荒異界之門。", element: "火", price: 0 },
  { id: "xingpan_tu", name: "異星盤(土)", kind: "special", desc: "金源仙域深處淬煉的異星圓盤,土色渾厚。集滿五色異星盤,可開啟蠻荒異界之門。", element: "土", price: 0 },

  // ── 真仙 / 金仙頂尖仙法秘笈(極難取得,修煉數十萬載) ──
  { id: "m_hunyuan", name: "《混元一氣仙訣》殘卷", kind: "manual", desc: "開天混元至法,參悟需真仙之境,苦修三十萬載方能大成。金源仙帝身隕方出。", price: 0, teaches: "hunyuan_yiqi", dropOnly: true },
  { id: "m_taiqing", name: "《太清道韻九轉》玉冊", kind: "manual", desc: "太清仙尊遺留的九轉道韻,修習需五十萬載。太上金仙與浮屠塔高層機緣。", price: 0, teaches: "taiqing_daoyun", dropOnly: true },
  { id: "m_zhutian", name: "《誅天神雷金仙法》仙簡", kind: "manual", desc: "唯金仙可修的無上殺伐仙法,修習需百萬載。傳說僅浮屠塔絕頂可得。", price: 0, teaches: "zhutian_shenlei", dropOnly: true },
];

// 玄天仙器(蠻荒異界玄天殘片 + 太乙精魂煉成,唯太乙境可用,屬性極強且浮動 100%~300%)
export const XUANTIAN_ARTIFACT_IDS = new Set<string>([
  "xuantian_zhanling_jian",
  "xuantian_hulu",
  "potian_chui",
  "tianhu_huaxie_ren",
  "xuantian_zhanmo_jian",
  "huantian_jing",
]);
export const isXuantianArtifact = (id: string) => XUANTIAN_ARTIFACT_IDS.has(id.split("@")[0]);

// 品質浮動道具:id 格式為 "基底id@品質百分比"(如 "qingsuo@113" = 113% 品質)。
// 煉器(±30%)與玄天仙器煉化(100%~300%)皆透過此機制動態產生獨立的強化/減弱版本,
// 而不需要為每個品質預先建立實體道具。攻/防/速依品質等比例縮放,名稱附註百分比。
export function itemById(id: string): ItemDef {
  const at = id.indexOf("@");
  if (at === -1) return ITEMS.find((i) => i.id === id)!;
  const baseId = id.slice(0, at);
  const quality = Number(id.slice(at + 1));
  const base = ITEMS.find((i) => i.id === baseId)!;
  const scale = (v: number | undefined) =>
    v === undefined ? undefined : Math.max(1, Math.round((v * quality) / 100));
  const pct = quality - 100;
  return {
    ...base,
    id,
    name: `${base.name}(${pct >= 0 ? "+" : ""}${pct}%)`,
    atkBonus: scale(base.atkBonus),
    defBonus: scale(base.defBonus),
    speedBonus: scale(base.speedBonus),
  };
}
