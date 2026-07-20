import { ItemDef } from "../types";

export const ITEMS: ItemDef[] = [
  // ── 材料 ──
  { id: "tiekuang", name: "精鐵礦", kind: "material", desc: "凡鐵中偶含靈性者,煉器基礎材料。", element: "金", price: 5 },
  { id: "hanjing", name: "寒玉精", kind: "material", desc: "萬年寒潭底凝結的玉精,觸手生寒。", element: "水", price: 30 },
  { id: "jinleizhu", name: "金雷竹枝", kind: "material", desc: "受雷擊而不死的異竹,金中帶雷,煉製飛劍的絕佳材料。", element: "金", price: 120 },
  { id: "yaodan", name: "妖獸內丹", kind: "material", desc: "一階妖獸體內凝結的內丹,蘊含精純妖力。", price: 60 },
  { id: "huoyu", name: "火蟒之鱗", kind: "material", desc: "火蟒蛻下的赤鱗,炙熱不熄。", element: "火", price: 45 },
  { id: "wenyu", name: "溫玉", kind: "material", desc: "地脈深處孕育的暖玉,土行至寶之基。", element: "土", price: 40 },
  { id: "qingmu", name: "千年青木心", kind: "material", desc: "千年古木之心,木靈之氣濃郁欲滴。", element: "木", price: 55 },
  { id: "yinsha", name: "陰煞之氣", kind: "material", desc: "洞窟深處聚集的陰煞,以玉瓶封存。", price: 70 },
  { id: "xingchengang", name: "星辰鋼", kind: "material", desc: "隕星之核提煉的神鋼,亂星海特產,煉製頂階法寶必備。", element: "金", price: 800 },
  { id: "xuantiehan", name: "玄天寒鐵", kind: "material", desc: "萬載玄冰包裹的寒鐵,重逾千鈞。", element: "水", price: 950 },
  { id: "jiaolin", name: "蛟龍之鱗", kind: "material", desc: "血蛟蛻下的逆鱗,堅逾精鋼,隱有龍威。", element: "水", price: 700 },
  { id: "mojing", name: "魔道魔晶", kind: "material", desc: "魔修隕落後凝結的晶核,魔氣森然。", price: 1200 },
  { id: "fenghuolin", name: "風火之鱗", kind: "material", desc: "天嵐妖鳥的翎鱗,蘊風火二性,煉風雷翅之基。", element: "火", price: 2500 },
  { id: "longjinggu", name: "真龍精骨", kind: "material", desc: "上古真龍遺蛻之骨,一寸龍骨一寸金。", price: 8000 },

  // ── 仙草 ──
  { id: "huanglongcao", name: "黃龍草", kind: "herb", desc: "常見靈草,煉製黃龍丹主藥。", price: 8, exp: 10 },
  { id: "zhuguo", name: "朱果", kind: "herb", desc: "百年一熟的靈果,服之可增修為。", price: 50, exp: 60 },
  { id: "tianlingguo", name: "天靈果", kind: "herb", desc: "傳說中的靈果,凡人服之可開靈根,修士服之修為大進。", price: 300, exp: 400 },
  { id: "zijinhua", name: "紫金花", kind: "herb", desc: "生於絕壁的奇花,可入丹,微量回復仙靈力。", price: 25, mp: 30 },
  { id: "xuelingzhi", name: "血靈芝", kind: "herb", desc: "赤紅如血的靈芝,生機盎然,可直接服用療傷。", price: 35, heal: 80 },
  { id: "qiannianlingru", name: "千年靈乳", kind: "herb", desc: "石鐘乳萬載凝成,一滴便可洗髓伐骨。", price: 1500, exp: 2500 },
  { id: "ziyuanhua", name: "紫猿花", kind: "herb", desc: "南疆奇花,煉製凝嬰丹的主藥。", price: 4000, exp: 8000 },
  { id: "longlinguo", name: "龍鱗果", kind: "herb", desc: "形如龍鱗的靈果,服之肉身堅如蛟龍。", price: 15000, exp: 40000 },
  { id: "huangjitiansui", name: "皇極天髓", kind: "herb", desc: "天地開闢時遺留的一縷精髓,化神以上方能承受。", price: 200000, exp: 600000 },

  // ── 延壽極品(坊市不售,可遇不可求) ──
  { id: "wanshoudan", name: "萬壽丹", kind: "pill", desc: "以百種靈藥煉成的延壽奇丹,服之增壽百載。", price: 20000, life: 100 },
  { id: "yanshouguo", name: "延壽果", kind: "herb", desc: "萬載一熟的延壽靈果,服之增壽三百載,可遇不可求。", price: 80000, life: 300 },
  { id: "panlongtao", name: "蟠龍壽桃", kind: "herb", desc: "傳說仙界流落的壽桃,龍紋盤繞,一枚增壽千載。", price: 500000, life: 1000 },

  // ── 丹藥 ──
  { id: "huanglongdan", name: "黃龍丹", kind: "pill", desc: "煉氣期修士常用補氣丹藥,增長修為。", price: 40, exp: 45 },
  { id: "huiyuandan", name: "回元丹", kind: "pill", desc: "迅速回復仙靈力的丹藥。", price: 35, mp: 80 },
  { id: "liaoshangdan", name: "療傷丹", kind: "pill", desc: "外敷內服皆可,癒合傷勢。", price: 30, heal: 150 },
  { id: "zhujidan", name: "築基丹", kind: "pill", desc: "傳說服之可大增築基成功率的靈丹,有價無市。", price: 2000, exp: 1500 },
  { id: "ningyingdan", name: "凝嬰丹", kind: "pill", desc: "結丹修士凝結元嬰的輔藥,紫猿花所煉。", price: 30000, exp: 25000 },
  { id: "dahuandan", name: "大還丹", kind: "pill", desc: "起死回生的靈丹,重傷垂死亦可救回。", price: 5000, heal: 99999 },
  { id: "jiuqulingshen", name: "九曲靈參丹", kind: "pill", desc: "九曲靈參煉製,仙靈力如潮湧回。", price: 3000, mp: 99999 },
  { id: "pojiedan", name: "破界丹", kind: "pill", desc: "衝擊大乘瓶頸的無上靈丹,以皇極天髓為引。", price: 500000, exp: 2000000 },

  // ── 仙法秘笈 ──
  { id: "m_qingzhufeng", name: "《青竹蜂雲劍訣》殘卷", kind: "manual", desc: "研讀後可習得青竹蜂雲劍訣。", price: 800, teaches: "qingzhufeng" },
  { id: "m_leidun", name: "《雷遁術》玉簡", kind: "manual", desc: "研讀後可習得雷遁術。", price: 600, teaches: "leidun" },
  { id: "m_hanbing", name: "《寒冰破》秘笈", kind: "manual", desc: "研讀後可習得寒冰破。", price: 550, teaches: "hanbing" },
  { id: "m_liehuo", name: "《烈火符陣》符書", kind: "manual", desc: "研讀後可習得烈火符陣。", price: 650, teaches: "liehuo" },
  { id: "m_dayan", name: "《大衍訣》石碑拓文", kind: "manual", desc: "研讀後可習得大衍訣。", price: 620, teaches: "dayan" },
  { id: "m_jinlei", name: "《金雷竹御雷真訣》", kind: "manual", desc: "研讀後可習得御雷真訣。需築基期。", price: 3000, teaches: "jinlei" },
  { id: "m_xuantian", name: "《玄天斬靈劍法》", kind: "manual", desc: "玄天之寶所載無上劍法。需結丹期。", price: 12000, teaches: "xuantian" },
  { id: "m_aohan", name: "《傲寒六訣》", kind: "manual", desc: "極寒魔功,六訣連環,寒潮滅世。需元嬰期。", price: 60000, teaches: "aohan" },
  { id: "m_dageng", name: "《大庚劍陣圖》", kind: "manual", desc: "古修士遺留的劍陣圖,金精所煉飛劍列陣,鋒銳無匹。需元嬰期。", price: 90000, teaches: "dageng" },
  { id: "m_yuanci", name: "《元磁神光錄》", kind: "manual", desc: "元磁山之力化神光,鎮壓萬法。需化神期。", price: 400000, teaches: "yuanci" },
  { id: "m_sanyan", name: "《三焰化火真經》", kind: "manual", desc: "三色靈焰合一,焚山煮海。需煉虛期。", price: 1500000, teaches: "sanyan" },
  { id: "m_zhenlong", name: "《真龍九變》", kind: "manual", desc: "化身真龍的無上神通,大乘可修。", price: 8000000, teaches: "zhenlong" },

  // ── 法器(煉製所得) ──
  { id: "qingsuo", name: "青索劍", kind: "artifact", desc: "青光如索的木系飛劍。", element: "木", price: 400, atkBonus: 15 },
  { id: "jinjian", name: "金光巨劍", kind: "artifact", desc: "巨劍門制式法器,沉重鋒銳。", element: "金", price: 450, atkBonus: 18 },
  { id: "hanbingzhui", name: "寒冰錐", kind: "artifact", desc: "寒玉精煉成的冰錐法器。", element: "水", price: 420, atkBonus: 14, defBonus: 4 },
  { id: "huolingqi", name: "火靈旗", kind: "artifact", desc: "火蟒鱗煉製的赤色小旗,揮動間烈焰騰空。", element: "火", price: 480, atkBonus: 20 },
  { id: "hutudun", name: "厚土盾", kind: "artifact", desc: "溫玉為心的土黃圓盾,防禦驚人。", element: "土", price: 430, atkBonus: 5, defBonus: 20 },
  { id: "qingzhufengjian", name: "青竹蜂雲劍", kind: "artifact", desc: "以金雷竹煉製的本命飛劍,可一化為多。韓立的成名法寶。", element: "金", price: 5000, atkBonus: 60, defBonus: 10 },
  { id: "dagengjian", name: "大庚劍陣", kind: "artifact", desc: "七十二口金色小劍結成的劍陣,青蒙山金精所煉。", element: "金", price: 80000, atkBonus: 900, defBonus: 150 },
  { id: "sanyanshan", name: "三焰扇", kind: "artifact", desc: "三色火鳥翎羽所製寶扇,一扇之威,焚天滅地。", element: "火", price: 600000, atkBonus: 8000, defBonus: 800 },
  { id: "yuancishan", name: "元磁神山", kind: "artifact", desc: "萬丈元磁山煉成寸許小山,祭出時鎮壓一切飛遁。", element: "土", price: 3000000, atkBonus: 40000, defBonus: 15000 },
  { id: "zhenlongyin", name: "真龍璽", kind: "artifact", desc: "真龍精骨所刻帝璽,蓋落之處,山河俱碎。", price: 20000000, atkBonus: 250000, defBonus: 80000 },

  // ── 護身之寶 ──
  { id: "hushenfu", name: "護身符", kind: "treasure", desc: "注入仙靈力後可擋一次致命攻擊的符籙。", price: 150, defBonus: 8 },
  { id: "wuguangyi", name: "烏光甲衣", kind: "treasure", desc: "陰煞之氣淬煉的軟甲,烏光流轉。", price: 900, defBonus: 25 },
  { id: "fengleichi", name: "風雷翅", kind: "treasure", desc: "風火之鱗煉製的雙翅,雷光一閃百里之外,兼可護身。", price: 300000, defBonus: 6000 },
  { id: "jinganghu", name: "金剛璃甲", kind: "treasure", desc: "蛟龍之鱗綴玄天寒鐵而成,刀劍難傷。", price: 40000, defBonus: 1200 },
];

export const itemById = (id: string) => ITEMS.find((i) => i.id === id)!;
