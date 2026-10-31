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
  { id: "poshou_jinhow", name: "破曉精華", kind: "material", desc: "創世之初，天地誕生時第一滴精華。", price: 533000 },

  // ── 各區域特產材料(1.23 版新增,每區一種,獵殺妖獸或採集靈材皆有機會取得) ──
  { id: "qingyunshi", name: "青雲石", kind: "material", desc: "天南越國隨處可見的青色雲紋石,靈氣稀薄卻取用便利。", element: "木", price: 5 },
  { id: "xueyu", name: "血玉", kind: "material", desc: "血色禁地土壤中凝結的赤玉,隱有血煞之氣。", price: 90 },
  { id: "haixinzhu", name: "海心珠", kind: "material", desc: "亂星海深處蚌類孕育的奇珠,珠心映海,靈氣內斂。", element: "水", price: 50 },
  { id: "moyanjing", name: "魔炎晶", kind: "material", desc: "大晉魔修淬煉魔火時遺落的晶粒,魔焰不熄。", element: "火", price: 90 },
  { id: "zhenlingsha", name: "真靈砂", kind: "material", desc: "靈界特有的砂礫,真靈氣息滲入其中,飛昇前修士煉器多倚重此物。", price: 100 },
  { id: "xuanbingjing", name: "玄冰晶", kind: "material", desc: "北寒仙域萬載玄冰凝聚而成的晶石,寒氣直透仙軀。", element: "水", price: 600 },
  { id: "jinyuan_suipian", name: "金源碎晶", kind: "material", desc: "金源仙關崩落的碎晶,金光內蘊,較靈砂略遜一籌卻更易採得。", element: "金", price: 700 },
  { id: "manhuang_yungu", name: "蠻荒隕骨", kind: "material", desc: "蠻荒異界怪物體內殘留的隕骨,堅逾玄鐵,乃太乙境爐火的珍稀輔料。", price: 950 },

  // ── 金源仙域 / 蠻荒異界回復類丹藥主材(1.24 版新增) ──
  { id: "jinyuan_shenglian", name: "金源聖蓮", kind: "material", desc: "金源仙域深處綻放的聖蓮,蘊藏磅礴生機,乃煉製迴天丹藥的絕佳藥引。", element: "木", price: 3000 },
  { id: "manhuang_lingsui", name: "蠻荒靈髓", kind: "material", desc: "蠻荒異界妖獸體內凝結的靈髓,法力氣息醇厚。", effect: "煉丹材料:混沌真元丹、太乙回氣丹", element: "水", price: 3500 },

  // ── 真魔界特產材料(3.19 版新增,妖獸掉落/採集皆可取得,乃調配滅煞丹的關鍵藥引) ──
  { id: "zhenmo_jingxue", name: "真魔精血", kind: "material", desc: "真魔界妖獸體內凝聚的精血,浸透煞氣。", effect: "煉丹材料:滅煞丹", price: 5000 },

  // ── 靈界三大陸特產材料(2.14 版新增:風元/雷鳴/血天,各有採集與妖獸掉落兩種來源) ──
  { id: "fengyuanjing", name: "風元晶", kind: "material", desc: "風元大陸元氣凝結而成的晶石,風靈之氣充盈,煉器上品。", element: "木", price: 4200 },
  { id: "yecha_hunjing", name: "夜叉魂晶", kind: "material", desc: "夜叉族妖體凝聚的魂晶,陰戾之氣濃烈,獵殺夜陽城妖獸方能取得。", price: 4800 },
  { id: "leimingshi", name: "雷鳴石", kind: "material", desc: "雷鳴大陸雷雲終年轟鳴、凝結而成的靈石,觸之隱有雷光竄動。", element: "金", price: 8600 },
  { id: "jiaochi_tiesui", name: "角蚩鐵髓", kind: "material", desc: "角蚩族妖體中淬鍊的鐵髓,堅逾玄鐵,角蠻獄妖獸體內方有。", element: "金", price: 9200 },
  { id: "minghesha", name: "冥河沙", kind: "material", desc: "冥河之地的幽沙,浸潤亡魂怨氣,蜉蝣族妖獸出沒之處遍地皆是。", element: "水", price: 8000 },
  { id: "dixuejing", name: "地血晶", kind: "material", desc: "地血族煉化地脈精血凝成的晶石,色赤如血,血獄特產。", price: 13000 },
  { id: "longyu_linjia", name: "龍獄鱗", kind: "material", desc: "九龍獄看守妖獸蛻下的鱗甲,堅韌無匹,隱有龍屬威壓。", price: 21000 },
  { id: "tianding_suipian", name: "天鼎碎片", kind: "material", desc: "天鼎宮守衛體內殘留的鼎器碎片,靈光隱現,乃虛天鼎、虛皇鼎的爐火之源。", element: "金", price: 26000 },

  // ── 靈界十處秘境補充素材(2.17 版新增,每處秘境至少湊齊 2~3 種可採/可掉落素材) ──
  { id: "zhenling_suipian", name: "真靈碎晶", kind: "material", desc: "天淵城外圍地脈中滲出的真靈碎晶,靈氣稀薄卻俯拾即是。", price: 4000 },
  { id: "tianyuan_yaogu", name: "天淵妖骨", kind: "material", desc: "天淵城外圍妖獸遺骸風化而成的骨渣,質地堅脆。", price: 4300 },
  { id: "leiling_suixie", name: "雷靈碎屑", kind: "material", desc: "飛昇台天劫雷靈掠過後遺落的碎屑,雷光殘留不散。", element: "金", price: 9800 },
  { id: "feisheng_yunwu", name: "飛昇雲霧", kind: "herb", desc: "飛昇台終年繚繞的奇異雲霧,吸納一口便覺神清氣爽。", price: 5000, dropOnly: true },
  { id: "yeyang_yankuang", name: "夜陽岩礦", kind: "material", desc: "夜陽城地底赤紅岩層鑿出的礦石,觸手灼熱。", element: "火", price: 4500 },
  { id: "fengren_yeye", name: "風刃夜葉", kind: "herb", desc: "夜陽城外圍風刃樹所生的夜葉,葉緣鋒利如刃。", element: "木", price: 4600, dropOnly: true },
  { id: "gumu_shupi", name: "古木樹皮", kind: "material", desc: "木靈森林千年古木剝落的樹皮,質地輕韌。", element: "木", price: 4400 },
  { id: "senlin_lulu", name: "森林露珠", kind: "herb", desc: "木靈森林清晨凝結的露珠,靈氣清冽,略能提神。", price: 4700, dropOnly: true },
  { id: "feiling_yumao", name: "飛靈羽毛", kind: "material", desc: "天霄城飛靈族妖獸蛻落的羽毛,輕若無物卻堅韌異常。", element: "金", price: 9000 },
  { id: "tianxiao_yunqi", name: "天霄雲氣", kind: "herb", desc: "天霄城終年不散的雲氣,吸納後精神為之一振。", price: 9200, dropOnly: true },
  { id: "jiaoman_suolian", name: "角蠻鎖鏈", kind: "material", desc: "角蠻獄看守用以鎖魂的鏈環殘段,寒鐵所鑄。", element: "金", price: 9500 },
  { id: "manyu_xueshi", name: "蠻獄血石", kind: "material", desc: "角蠻獄地底浸血的岩石,隱有戾氣。", price: 9600 },
  { id: "minghe_shuizao", name: "冥河水藻", kind: "herb", desc: "冥河之地水面漂浮的幽藻,亡魂怨氣浸潤卻無害於人。", element: "水", price: 8200, dropOnly: true },
  { id: "fuyou_chibang", name: "蜉蝣翅膀", kind: "material", desc: "冥河蜉蝣蛻落的薄翼,輕透如紙,隱有幽光。", element: "水", price: 8300 },
  { id: "xueyu_yansha", name: "血獄岩沙", kind: "material", desc: "血獄地表終年浸血的岩沙,色赤如凝血。", price: 13200 },
  { id: "dixue_caogen", name: "地血草根", kind: "herb", desc: "血獄縫隙中頑強生長的草根,吸食地脈精血而生。", price: 13400, dropOnly: true },
  { id: "jiulong_suoshi", name: "九龍鎖石", kind: "material", desc: "九龍獄鎖柱基座崩落的石塊,隱有龍屬威壓封印其中。", price: 21500 },
  { id: "longyu_yinhuo", name: "龍獄陰火", kind: "material", desc: "九龍獄深處終年不熄的陰火,凝而不散,冷冽刺骨。", price: 21800 },
  { id: "tianding_linghuo", name: "天鼎靈火", kind: "material", desc: "天鼎宮九鼎爐心外溢的靈火,溫潤而不灼人。", element: "金", price: 26500 },
  { id: "jiuding_xiangyun", name: "九鼎祥雲", kind: "herb", desc: "天鼎宮九鼎交輝所化的祥雲,隱隱透著清氣。", effect: "煉丹材料:血天回氣丹;天鼎守衛、天鼎執事掉落", price: 26800, dropOnly: true },

  // ── 仙草 ──
  { id: "huanglongcao", name: "黃龍草", kind: "herb", desc: "常見靈草,煉製黃龍丹主藥。", price: 6, exp: 8 },
  { id: "zhuguo", name: "朱果", kind: "herb", desc: "百年一熟的靈果。", price: 13, exp: 26 },
  { id: "tianlingguo", name: "地靈果", kind: "herb", desc: "傳說中的靈果,凡人食之可開靈根。", price: 36, exp: 48 },
  { id: "zijinhua", name: "紫金花", kind: "herb", desc: "生於絕壁的奇花,可入丹。", price: 7, mp: 50 },
  { id: "xuelingzhi", name: "血靈芝", kind: "herb", desc: "赤紅如血的靈芝,生機盎然,可直接服用療傷。", price: 9, heal: 29 },
  { id: "qiannianlingru", name: "千年靈乳", kind: "herb", desc: "石鐘乳萬載凝成,一滴便可洗髓伐骨。", price: 180, exp: 400 },
  { id: "ziyuanhua", name: "紫猿花", kind: "herb", desc: "南疆奇花,煉製凝嬰丹的主藥。", price: 240, exp: 870 },
  { id: "longlinguo", name: "龍鱗果", kind: "herb", desc: "形如龍鱗的靈果,果皮堅硬如甲。", price: 880, exp: 2400 },
  { id: "huangjitiansui", name: "皇極天髓", kind: "herb", desc: "天地開闢時遺留的一縷精髓,化神以上方能承受。", price: 6900, exp: 21000 },
  { id: "nimetanti", name: "古龍真血", kind: "herb", desc: "遠古龍族遺留的真血,至今猶帶龍威。", price: 36900, exp: 160000 },
  { id: "lingmu_xianye", name: "靈木仙葉", kind: "herb", desc: "木靈森林千年古木所生的仙葉,靈氣充盈。", element: "木", price: 5200, exp: 6000 },

  // ── 延壽極品(坊市不售,可遇不可求) ──
  { id: "wanshoudan", name: "百壽丹", kind: "pill", desc: "以百種靈藥煉成的延壽奇丹。", price: 20000, life: 100 },
  { id: "yanshouguo", name: "延壽果", kind: "herb", desc: "萬載一熟的延壽靈果,可遇不可求。", price: 80000, life: 300 },
  { id: "panlongtao", name: "蟠龍壽桃", kind: "herb", desc: "傳說自仙界流落的壽桃,龍紋盤繞。", price: 500000, life: 1000 },
  { id: "panlongtaoshu", name: "玄命果", kind: "herb", desc: "逆天改命，延長壽源，源壽無疆。", price: 50000000, life: 20000 },

  // ── 領主獎勵(地域王掉落,坊市不售) ──
  { id: "zengyuandan", name: "增元丹", kind: "pill", desc: "地域王內丹煉成的奇丹,屬天地造化之物。", price: 100000, lifePct: 0.05 },
  { id: "zenglingzhu", name: "增靈珠", kind: "special", desc: "蘊含精純法則之力的靈珠。", effect: "於「仙法」欄位使用,指定仙法升一級(最高 7 級,每級威力 +30%)", price: 150000 },

  // ── 真仙之物(飛昇後,坊市不售,極難獲得) ──
  { id: "tianxiandan", name: "天仙丹", kind: "special", desc: "仙界秘傳的丹藥。", effect: "真仙以上方能煉化", price: 0, xianli: 1 },
  { id: "xiantian_zhong", name: "先天靈鐘", kind: "special", desc: "北寒仙域中孕育的先天仙器。", effect: "真仙以上方能煉化", price: 0, xianli: 2 },
  { id: "xiantian_qi", name: "破天丹", kind: "special", desc: "開天遺留的至寶。", effect: "真仙以上方能煉化", price: 0, xianli: 3 },
  { id: "thantian_lu", name: "參天造化露", kind: "special", desc: "掌天瓶凝聚的露水,蘊含法則具象之力。", effect: "真仙以上方能煉化", price: 0, xianli: 15 },
  { id: "jinhundan", name: "金魂丹", kind: "special", desc: "太上金仙隕落後凝成的金色魂丹。", effect: "真仙服下直接晉入金仙境", price: 0 },

  // ── 黑市限定(美利堅靈石購入,不可煉製/坊市不售) ──
  { id: "beilidan", name: "倍力丹", kind: "special", desc: "西域秘法煉成的奇丹。", effect: "精力立即全滿,精力上限永久 +10%(最多疊加 5 顆)", price: 0 },

  // ── 丹藥 ──
  { id: "huanglongdan", name: "黃龍丹", kind: "pill", desc: "煉氣期修士常用的補氣丹藥。", price: 30, exp: 40 },
  { id: "huiyuandan", name: "回元丹", kind: "pill", desc: "修士隨身常備的回元丹藥。", price: 9, mp: 50 },
  { id: "liaoshangdan", name: "療傷丹", kind: "pill", desc: "外敷內服皆可,癒合傷勢。", price: 22, heal: 120 },
  { id: "zhujidan", name: "築基丹", kind: "pill", desc: "傳說中的築基靈丹,有價無市。", price: 520, exp: 390 },
  { id: "ningyingdan", name: "凝嬰丹", kind: "pill", desc: "結丹修士凝結元嬰的輔藥,紫猿花所煉。", price: 1800, exp: 1500 },
  { id: "dahuandan", name: "大還丹", kind: "pill", desc: "起死回生的靈丹,重傷垂死亦可救回。", price: 5000, heal: 99999 },
  // ── 5.0 版:戰鬥中服用的解狀態丹藥與回血丹藥(手牌下方的丹藥欄可直接服用),一律妖獸掉落 ──
  { id: "jiedudan", name: "解毒丹", kind: "pill", desc: "以七葉一枝花為主藥煉成的解毒丹。", price: 40, cureStatus: ["poison"], dropOnly: true },
  { id: "qingliangsan", name: "清涼散", kind: "pill", desc: "冰片薄荷研成的藥散,入口沁涼。", price: 40, cureStatus: ["burn"], dropOnly: true },
  { id: "huiyangdan", name: "回陽丹", kind: "pill", desc: "純陽之火溫養的丹藥,一粒入腹遍體生暖。", price: 60, cureStatus: ["freeze"], dropOnly: true },
  { id: "tishendan", name: "提神丹", kind: "pill", desc: "清心醒神的小丹,修士鏖戰時常含一粒。", price: 50, cureStatus: ["weaken"], dropOnly: true },
  { id: "baicao_linglu", name: "百草靈露", kind: "pill", desc: "百種靈草晨露收集而成的藥水,清香撲鼻。", price: 300, heal: 3000, reqStage: 2, dropOnly: true },
  { id: "yusui_lingquan", name: "玉髓靈泉", kind: "pill", desc: "地脈玉髓滲出的靈泉,盛於玉瓶之中。", price: 3000, heal: 10000, cureStatus: ["burn", "poison", "freeze", "weaken"], reqStage: 6, dropOnly: true },
  { id: "xuelingdan", name: "血靈丹", kind: "pill", desc: "以妖獸精血為引煉成的補血丹,丹色殷紅。", price: 8000, heal: 30000, reqStage: 6, dropOnly: true },
  { id: "longxuedan", name: "龍血丹", kind: "pill", desc: "摻入一縷真龍血氣的丹藥,服之血氣奔湧。", price: 15000, heal: 50000, reqStage: 7, dropOnly: true },
  { id: "xianyuan_huichun", name: "仙元回春丹", kind: "pill", desc: "北寒、金源仙獸內丹煉成的回春仙丹。", price: 60000, heal: 200000, reqStage: 10, dropOnly: true },
  { id: "jiuzhuan_xianlu", name: "九轉清心仙露", kind: "pill", desc: "仙界九轉凝成的清心仙露,一滴可洗百脈。", price: 90000, heal: 300000, cureStatus: ["burn", "poison", "freeze", "weaken"], reqStage: 10, dropOnly: true },
  { id: "taiyi_huanhun", name: "太乙還魂丹", kind: "pill", desc: "蠻荒與灰仙界凶獸殘魂凝成的還魂奇丹,霸道無匹。", price: 240000, heal: 800000, reqStage: 10, dropOnly: true },
  { id: "jiuqulingshen", name: "九曲靈參丹", kind: "pill", desc: "以九曲靈參煉製的丹藥。", price: 3000, mp: 99999 },
  { id: "pojiedan", name: "破界丹", kind: "pill", desc: "衝擊大乘瓶頸的無上靈丹,以皇極天髓為引。", price: 4100, exp: 26000 },

  // ── 真仙專屬丹藥(煉丹堂,需圖譜解鎖) ──
  { id: "xisuidan", name: "洗髓丹", kind: "pill", desc: "洗髓伐骨的真仙至藥。", effect: "需研讀洗髓丹圖譜方能煉製", price: 0, exp: 8000000, reqStage: 10 },
  { id: "ningxiandan", name: "凝仙丹", kind: "special", desc: "凝練仙靈力的真仙至藥。", effect: "真仙以上方能煉化;需研讀凝仙丹圖譜方能煉製", price: 0, xianli: 1, reqStage: 10 },

  // ── 金源仙域 / 蠻荒異界回復丹藥(1.24 版新增,真仙以上煉器＆煉丹可直接煉製,毋須圖譜) ──
  { id: "jinyuan_shengtidan", name: "金源聖體丹", kind: "pill", desc: "金源聖蓮反覆淬煉的聖體奇丹。", price: 0, heal: 5000000, reqStage: 10 },
  { id: "manhuang_zhenyuandan", name: "混沌真元丹", kind: "pill", desc: "蠻荒靈髓合煉的真元奇丹。", price: 0, mp: 3000000, reqStage: 10 },
  { id: "taiyi_huiqidan", name: "太乙回氣丹", kind: "pill", desc: "金源聖蓮與蠻荒靈髓合煉的回氣奇丹。", price: 0, energy: 80, reqStage: 10 },

  // ── 靈界三大陸回氣丹(2.17 版新增,以各大陸補充素材煉成,回復少量精力) ──
  { id: "fengyuan_huiqidan", name: "風元回氣丹", kind: "pill", desc: "飛昇雲霧、風刃夜葉與森林露珠合煉的回氣小丹,一口氣清神明。", price: 0, energy: 10, dropOnly: true },
  { id: "leiming_huiqidan", name: "雷鳴回氣丹", kind: "pill", desc: "天霄雲氣佐冥河水藻煉成的回氣小丹,雷氣醒神。", price: 0, energy: 10, dropOnly: true },
  { id: "xuetian_huiqidan", name: "血天回氣丹", kind: "pill", desc: "地血草根佐九鼎祥雲煉成的回氣小丹,血氣調和。", price: 0, energy: 10, dropOnly: true },

  // ── 乾坤袋(黑眼貔貅專屬掉落,1.24 版新增) ──
  { id: "qiankun_dai", name: "乾坤袋", kind: "special", desc: "黑眼貔貅隕落後遺留的奇物,袋中自成天地。", effect: "持有即可於儲物袋存取靈石;袋中靈石在戰敗遁走時不會遺失", price: 0, dropOnly: true },

  // ── 仙法秘笈 ──
  { id: "m_qingzhufeng", name: "《青竹風雲劍訣》殘卷", kind: "manual", desc: "研讀後可習得青竹風雲劍訣。", price: 800, teaches: "qingzhufeng" },
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

  // ── 1.8 版新增 15 門仙法秘笈,取得管道各異(坊市購買/妖獸掉落/宗門任務/太乙殿饋贈) ──
  // 坊市直售(唯此三部秘笈坊市有售,其餘一律不販售)
  { id: "m_chiyan_fentian", name: "《赤炎焚天訣》抄本", kind: "manual", desc: "結丹修士常修的火系進階秘法,坊市有售。", price: 700, teaches: "chiyan_fentian", shopSellable: true },
  { id: "m_jingji_jiaohun", name: "《荊棘絞魂咒》抄本", kind: "manual", desc: "元嬰修士常修的木系秘法,坊市有售。需元嬰期。", price: 3200, teaches: "jingji_jiaohun", shopSellable: true },
  { id: "m_houtu_suohun", name: "《厚土鎖魂陣》圖譜", kind: "manual", desc: "元嬰修士常修的土系秘法,坊市有售。需元嬰期。", price: 3200, teaches: "houtu_suohun", shopSellable: true },
  // 妖獸掉落
  { id: "m_jinwu_zhuori", name: "《金烏灼日訣》殘卷", kind: "manual", desc: "化神修士常修的金系秘法,天嵐妖鳥藏書。需化神期。", price: 420000, teaches: "jinwu_zhuori", dropOnly: true },
  { id: "m_fentian_liyu", name: "《焚天煉獄》秘卷", kind: "manual", desc: "化神修士常修的火系秘法,魔化修士殘留。需化神期。", price: 420000, teaches: "fentian_liyu", dropOnly: true },
  { id: "m_hanyuan_wanli", name: "《寒淵萬里凍》玉冊", kind: "manual", desc: "煉虛修士常修的水系秘法,鬼母藏珍。需煉虛期。", price: 1600000, teaches: "hanyuan_wanli", dropOnly: true },
  { id: "m_wanteng_tianluo", name: "《萬藤天羅陣》圖譜", kind: "manual", desc: "煉虛修士常修的木系秘法,魔血尊者遺物。需煉虛期。", price: 1600000, teaches: "wanteng_tianluo", dropOnly: true },
  { id: "m_canghai_niliu", name: "《滄海逆流訣》秘笈", kind: "manual", desc: "合體修士常修的水系秘法,真靈衛守護。需合體期。", price: 8500000, teaches: "canghai_niliu", dropOnly: true },
  { id: "m_shanhe_zhenhun", name: "《山河鎮魂術》古卷", kind: "manual", desc: "合體修士常修的土系秘法,混元凶獸藏書。需合體期。", price: 8500000, teaches: "shanhe_zhenhun", dropOnly: true },
  { id: "m_xuanbing_mieshi", name: "《玄冰滅世訣》仙冊", kind: "manual", desc: "大乘修士常修的水系秘法,太虛人仙傳承。需大乘期。", price: 8500000, teaches: "xuanbing_mieshi", dropOnly: true },
  { id: "m_tianjie_shafa", name: "《天劫殺伐訣》雷卷", kind: "manual", desc: "借天劫雷靈之威悟出的殺伐秘法,唯天劫雷靈掉落。需渡劫期。", price: 30000000, teaches: "tianjie_shafa", dropOnly: true },
  { id: "m_houtu_fengtian", name: "《厚土封天訣》龍冊", kind: "manual", desc: "渡劫修士常修的頂尖秘法,上古真龍殘魂藏珍。需渡劫期。", price: 30000000, teaches: "houtu_fengtian", dropOnly: true },
  // 宗門任務獎勵
  { id: "m_lusheng_jianjue", name: "《戮神劍訣》執事密傳", kind: "manual", desc: "合體修士常修的金系秘法,執事堂高階任務獎勵。需合體期。", price: 8500000, teaches: "lusheng_jianjue", dropOnly: true },
  { id: "m_jiutian_fenyang", name: "《九天焚陽訣》執事密傳", kind: "manual", desc: "大乘修士常修的火系秘法,執事堂高階任務獎勵。需大乘期。", price: 8500000, teaches: "jiutian_fenyang", dropOnly: true },
  // 2.14 版起改為九龍獄墮落真仙馬良的極稀有掉落,不再是突破太乙境的直接饋贈
  { id: "m_taiyi_hunyuan_lu", name: "《北冥六真天地訣》仙簡", kind: "manual", desc: "相傳唯有登臨浮屠塔絕頂、窺見真正太歲天尊者,方能悟得此簡。", price: 0, teaches: "taiyi_hunyuan_lu", dropOnly: true },

  // ── 法器(煉製所得) ──
  { id: "qingsuo", name: "青索劍", kind: "artifact", desc: "青光如索的木系飛劍。", element: "木", price: 100, atkBonus: 6 },
  { id: "jinjian", name: "金光巨劍", kind: "artifact", desc: "巨劍門制式法器,沉重鋒銳。", element: "金", price: 120, atkBonus: 7 },
  { id: "hanbingzhui", name: "寒冰錐", kind: "artifact", desc: "寒玉精煉成的冰錐法器。", element: "水", price: 110, atkBonus: 5, defBonus: 2 },
  { id: "huolingqi", name: "火靈旗", kind: "artifact", desc: "火蟒鱗煉製的赤色小旗,揮動間烈焰騰空。", element: "火", price: 130, atkBonus: 8 },
  { id: "hutudun", name: "厚土盾", kind: "artifact", desc: "溫玉為心的土黃圓盾。", element: "土", price: 110, atkBonus: 2, defBonus: 8 },
  { id: "qingzhufengjian", name: "青竹風雲劍", kind: "artifact", desc: "以金雷竹煉製的本命飛劍,可一化為多。韓立的成名法寶。", element: "金", price: 600, atkBonus: 16, defBonus: 3 },
  { id: "dagengjian", name: "大庚劍陣", kind: "artifact", desc: "七十二口金色小劍結成的劍陣,青蒙山金精所煉。", element: "金", price: 4700, atkBonus: 170, defBonus: 28 },
  { id: "sanyanshan", name: "三焰扇", kind: "artifact", desc: "三色火鳥翎羽所製寶扇,一扇之威,焚天滅地。", element: "火", price: 12000, atkBonus: 750, defBonus: 75 },
  { id: "yuancishan", name: "元磁神山", kind: "artifact", desc: "萬丈元磁山煉成寸許小山,祭出時鎮壓一切飛遁。", element: "土", price: 60000, atkBonus: 3800, defBonus: 1400 },
  { id: "zhenlongyin", name: "真龍璽", kind: "artifact", desc: "真龍精骨所刻帝璽,蓋落之處,山河俱碎。", price: 360000, atkBonus: 12000, defBonus: 3900 },

  // ── 靈界三大陸煉器(2.14 版新增,以風元/雷鳴/血天特產材料煉成) ──
  { id: "fengling_ren", name: "風靈刃", kind: "artifact", desc: "風元晶引動夜叉魂晶淬煉而成的飛刃,迅疾如風,一閃奪魂。", element: "木", price: 45000, atkBonus: 2800, defBonus: 300 },

  // ── 靈界十處秘境補充煉器(2.17 版新增,消耗補充素材煉成) ──
  { id: "gumu_zhanren", name: "古木戰刃", kind: "artifact", desc: "古木樹皮裹天淵妖骨為胎,佐真靈碎晶淬煉而成的戰刃,厚重沉穩。", element: "木", price: 40000, atkBonus: 2200, defBonus: 400 },
  { id: "feiling_manxuejian", name: "飛靈蠻血劍", kind: "artifact", desc: "飛靈羽毛引動蠻獄血石與雷靈碎屑,鑄成的凌厲飛劍,劍風如刃。", element: "金", price: 85000, atkBonus: 4200 },
  { id: "xueyu_yinhuoren", name: "血獄陰火刃", kind: "artifact", desc: "血獄岩沙淬體、龍獄陰火為引,佐角蠻鎖鏈定魄,煉成的陰寒戰刃。", price: 150000, atkBonus: 7000, defBonus: 500 },
  { id: "tianding_zhenlingchui", name: "天鼎鎮靈鎚", kind: "artifact", desc: "天鼎靈火淬鍊、蜉蝣翅膀輕身,佐天鼎碎片鎮魂,煉成的沉穩巨鎚。", element: "金", price: 160000, atkBonus: 6500, defBonus: 2500 },

  // ── 護身之寶 ──
  { id: "hushenfu", name: "鐵護身符", kind: "amulet", desc: "注入法力即可護身的鐵製符牌。", price: 110, defBonus: 7 },
  { id: "wuguangyi", name: "烏光甲衣", kind: "robe", desc: "陰煞之氣淬煉的軟甲,烏光流轉。", price: 240, defBonus: 10 },
  { id: "fengleichi", name: "風雷翅", kind: "amulet", desc: "風火之鱗煉製的雙翅,雷光一閃百里之外,兼可護身增速。", price: 6000, defBonus: 560, speedBonus: 40 },
  { id: "jinganghu", name: "金剛璃甲", kind: "robe", desc: "蛟龍之鱗綴玄天寒鐵而成,刀劍難傷。", price: 2400, defBonus: 230 },
  { id: "mulingjia", name: "木靈藤甲", kind: "robe", desc: "靈木仙葉與風元晶交織而成的藤甲,輕盈堅韌,自行療補靈氣。", price: 42000, defBonus: 3200, atkBonus: 200 },
  { id: "leiming_zhanjia", name: "雷鳴戰甲", kind: "robe", desc: "雷鳴石淬體、角蚩鐵髓為甲,戰時雷光纏身,身法愈戰愈速。", price: 95000, defBonus: 5200, speedBonus: 40 },
  { id: "tianding_hufu", name: "天鼎護心鏡", kind: "amulet", desc: "天鼎碎片與地血晶合煉的護心至寶,鼎氣護體,近乎不可摧。", element: "金", price: 170000, defBonus: 7500, speedBonus: 50 },

  // ── 天鼎宮至寶(2.14 版新增,唯天鼎守衛掉落,坊市不售) ──
  { id: "xutianding", name: "虛天鼎", kind: "amulet", desc: "天鼎宮尋常一脈鼎器,鼎身雖小,卻能引動些許虛空之力護體。", price: 220000, atkBonus: 3000, defBonus: 8500, dropOnly: true },
  { id: "xuhuangding", name: "虛皇鼎", kind: "amulet", desc: "天鼎宮鎮宮至寶,九鼎之首,鼎中虛空自成天地,攻守速三者俱臻化境。", price: 500000, atkBonus: 25500, defBonus: 11000, speedBonus: 80, dropOnly: true },

  // ── 符籙(攻擊/輔助,符籙槽;高階由妖獸掉落) ──
  { id: "fu_liehuo", name: "烈火符", kind: "talisman", desc: "貼身催動,火靈附刃。", element: "火", price: 320, atkBonus: 20 },
  { id: "fu_wulei", name: "雷電法符", kind: "talisman", desc: "五雷轟頂,攻速兼備的雷系符籙。", element: "金", price: 12000, atkBonus: 180, speedBonus: 20 },
  { id: "fu_xuanyin", name: "玄陰噬魂符", kind: "talisman", desc: "陰煞凝成的符籙,大乘修士所用。", price: 342000, atkBonus: 2600, dropOnly: true, reqStage: 8 },
  { id: "minghe_lingfu", name: "冥河靈符", kind: "talisman", desc: "冥河沙攜雷鳴石之力凝成的符籙,亡魂怨氣附刃,速攻俱增。", price: 90000, atkBonus: 5000, speedBonus: 30 },
  { id: "xuesha_suohunfu", name: "血煞鎖魂符", kind: "talisman", desc: "地血晶淬煉、龍獄鱗為引,鎖魂攝魄,殺伐之氣濃烈至極。", price: 180000, atkBonus: 8000 },
  { id: "fengling_suohunfu", name: "風靈鎖魂符", kind: "talisman", desc: "風元晶、夜叉魂晶與夜陽岩礦三者合煉的鎖魂符籙,風刃裹魂,一觸即碎。", element: "木", price: 50000, atkBonus: 4500 },
  { id: "fu_taixu", name: "太虛混元符", kind: "talisman", desc: "仙家符籙,符紋玄奧。", price: 1600000, atkBonus: 18000, dropOnly: true, reqStage: 10 },

  // ── 靈寵(寵物槽,僅探索秘境 5% 獲得;增益靈石收益與攻防) ──
  { id: "pet_linghu", name: "赤煉靈狐", kind: "pet", desc: "通人性的赤煉靈狐,常伴主人嗅尋寶物。", price: 0, stoneMult: 1.2, atkBonus: 120, defBonus: 80, reqStage: 4, dropOnly: true },
  { id: "pet_xuangui", name: "玄冰靈龜", kind: "pet", desc: "龜甲堅厚的玄冰靈龜,以甲護主。", price: 0, stoneMult: 1.2, atkBonus: 300, defBonus: 1200, reqStage: 5, dropOnly: true },
  { id: "pet_jinpeng", name: "金翅靈鵬", kind: "pet", desc: "金翅靈鵬,能馱主遨遊天際。", price: 0, stoneMult: 1.2, atkBonus: 6000, defBonus: 2000, speedBonus: 120, reqStage: 8, dropOnly: true },
  { id: "pet_tianhu", name: "九尾天狐", kind: "pet", desc: "九尾通天的天狐。", price: 0, stoneMult: 1.2, atkBonus: 40000, defBonus: 20000, speedBonus: 200, reqStage: 10, dropOnly: true },
  { id: "pet_hundun", name: "混沌幼獸", kind: "pet", desc: "混沌幼獸,已有吞天噬地之姿。", price: 0, stoneMult: 1.2, atkBonus: 120000, defBonus: 60000, speedBonus: 400, reqStage: 11, dropOnly: true },

  // ── 煉器圖譜(妖獸掉落,使用後解鎖對應配方;藍框標示) ──
  { id: "blueprint_xuanyin", name: "《玄陰噬魂符》符籙圖譜", kind: "recipe", desc: "記載玄陰噬魂符煉製之法的圖譜。", price: 0, unlocksRecipe: "r_fu_xuanyin", dropOnly: true },
  { id: "blueprint_taixu", name: "《太虛混元符》仙符圖譜", kind: "recipe", desc: "仙家符籙圖譜,符紋玄奧。", price: 0, unlocksRecipe: "r_fu_taixu", dropOnly: true },

  // ── 金源仙域仙器(五關卡妖獸掉落,強度遠超北寒) ──
  { id: "jy_taiyi", name: "太乙金光劍", kind: "artifact", desc: "金源仙域至寶,太乙金光縱橫,無堅不摧。", element: "金", price: 0, atkBonus: 45000, defBonus: 8000, dropOnly: true, reqStage: 10 },
  { id: "jy_hunyuan", name: "混元仙袍", kind: "robe", desc: "金源仙域煉就的仙袍,萬法不侵。", price: 0, defBonus: 40000, dropOnly: true, reqStage: 10 },

  // ── 金源仙域圖譜配方所煉裝備(1.6 版新增,需先由金源仙域怪物掉落對應圖譜) ──
  { id: "jinyuan_ji", name: "金源戮神戟", kind: "artifact", desc: "以太乙精金反覆錘煉的戮神長戟,金源之力貫注戟身,一擊摧城。", element: "金", price: 0, atkBonus: 35000, defBonus: 5000, dropOnly: true, reqStage: 10 },
  { id: "taixu_hunyuanjia", name: "太虛混元甲", kind: "robe", desc: "金源靈砂淬煉的護體重甲,萬法加身,固若金源本源。", price: 0, defBonus: 30000, dropOnly: true, reqStage: 10 },
  { id: "jinyuan_hujing", name: "金源護道鏡", kind: "amulet", desc: "金源靈砂磨製的護道寶鏡,可映萬法、避凶趨吉。", price: 0, defBonus: 25000, speedBonus: 100, dropOnly: true, reqStage: 10 },
  { id: "zhuxian_fu", name: "誅仙滅魂符", kind: "talisman", desc: "太乙精金為引凝成的殺伐仙符,一符出手,誅仙滅魂。", element: "金", price: 0, atkBonus: 20000, dropOnly: true, reqStage: 10 },
  { id: "zaohua_jian", name: "造化戮仙劍", kind: "artifact", desc: "金源靈砂與太乙精金合煉的造化之劍,劍出無雙,戮仙屠魔。", element: "金", price: 0, atkBonus: 30000, defBonus: 8000, dropOnly: true, reqStage: 10 },

  // ── 5.0 版:北寒/金源一般妖獸的常見仙器(屬性低於上列仙器,但掉率較高,讓真仙初期的裝備有些變化) ──
  { id: "bh_hanshuang_jian", name: "寒霜仙劍", kind: "artifact", desc: "玄冰仙蛟寒鱗淬成的仙劍,劍身常凝一層薄霜。", element: "水", price: 300000, atkBonus: 18000, defBonus: 3000, dropOnly: true, reqStage: 10 },
  { id: "bh_bingpo_ji", name: "冰魄長戟", kind: "artifact", desc: "極寒天鵬翎骨所製的長戟,揮動時寒氣四溢。", element: "金", price: 350000, atkBonus: 22000, defBonus: 2000, dropOnly: true, reqStage: 10 },
  { id: "jy_duanjin_dao", name: "斷金仙刀", kind: "artifact", desc: "金源仙關常見的制式仙刀,刀鋒能斷精金。", element: "金", price: 400000, atkBonus: 26000, defBonus: 4000, dropOnly: true, reqStage: 10 },
  { id: "bh_bingcan_yi", name: "冰蠶仙衣", kind: "robe", desc: "萬載冰魂身上剝落的冰蠶絲織成,輕若無物。", price: 280000, defBonus: 14000, dropOnly: true, reqStage: 10 },
  { id: "bh_xuanwu_jia", name: "玄武鱗甲", kind: "robe", desc: "北冥玄武背甲碎片綴成的鱗甲,厚重堅實。", price: 350000, defBonus: 18000, dropOnly: true, reqStage: 10 },
  { id: "bh_hanyu_pei", name: "寒玉護心佩", kind: "amulet", desc: "北寒寒玉雕成的護心佩,貼身佩戴可凝神護體。", price: 250000, atkBonus: 4000, defBonus: 6000, dropOnly: true, reqStage: 10 },
  { id: "jy_lingzhu", name: "金源靈珠", kind: "amulet", desc: "混天靈猿珍藏的靈珠,蘊含一縷金源之氣。", price: 300000, atkBonus: 7000, defBonus: 5000, dropOnly: true, reqStage: 10 },
  { id: "bh_bingfeng_fu", name: "冰封仙符", kind: "talisman", desc: "以北寒玄冰為引繪成的仙符。", price: 250000, atkBonus: 10000, dropOnly: true, reqStage: 10 },
  { id: "jy_chiyan_fu", name: "赤焰仙符", kind: "talisman", desc: "八荒火麒麟火鬃所繪的仙符,符紋灼熱。", price: 300000, atkBonus: 13000, dropOnly: true, reqStage: 10 },
  { id: "pet_xuehu", name: "雪狐幼崽", kind: "pet", desc: "北寒仙域的雪狐幼崽,靈性初開。", price: 0, stoneMult: 1.1, atkBonus: 14000, defBonus: 6000, speedBonus: 100, reqStage: 10, dropOnly: true },

  // ── 金源仙域圖譜(妖獸掉落,使用後解鎖上列裝備配方) ──
  { id: "blueprint_jishen", name: "《金源戮神戟》煉器圖譜", kind: "recipe", desc: "記載金源戮神戟煉製之法的圖譜。", price: 0, unlocksRecipe: "r_jinyuan_ji", dropOnly: true },
  { id: "blueprint_hunyuanjia", name: "《太虛混元甲》煉器圖譜", kind: "recipe", desc: "記載太虛混元甲煉製之法的圖譜。", price: 0, unlocksRecipe: "r_taixu_hunyuanjia", dropOnly: true },
  { id: "blueprint_hudao", name: "《金源護道鏡》煉器圖譜", kind: "recipe", desc: "記載金源護道鏡煉製之法的圖譜。", price: 0, unlocksRecipe: "r_jinyuan_hujing", dropOnly: true },
  { id: "blueprint_zhuxian", name: "《誅仙滅魂符》煉器圖譜", kind: "recipe", desc: "記載誅仙滅魂符煉製之法的圖譜。", price: 0, unlocksRecipe: "r_zhuxian_fu", dropOnly: true },
  { id: "blueprint_zaohuajian", name: "《造化戮仙劍》煉器圖譜", kind: "recipe", desc: "記載造化戮仙劍煉製之法的圖譜。", price: 0, unlocksRecipe: "r_zaohua_jian", dropOnly: true },
  { id: "blueprint_xisui", name: "《洗髓丹》煉丹圖譜", kind: "recipe", desc: "記載洗髓丹煉製之法的丹方。", price: 0, unlocksRecipe: "r_xisuidan", dropOnly: true },
  { id: "blueprint_ningxian", name: "《凝仙丹》煉丹圖譜", kind: "recipe", desc: "記載凝仙丹煉製之法的丹方。", price: 0, unlocksRecipe: "r_ningxiandan", dropOnly: true },

  // ── 命器(舊·天命符 / 地運符,已停止由妖獸掉落,僅為相容既有存檔保留定義,不會再有新玩家取得) ──
  { id: "tianmingfu", name: "天命符", kind: "mingqi", desc: "命格之力凝成的符籙,大晉噬天鬼帝身死方遺,窺得一線天機。", price: 0, dropOnly: true, breakBonus: 0.05 },
  { id: "diyunfu", name: "地運符", kind: "mingqi", desc: "地脈氣運匯聚而成的符籙,萬鱗海皇秘藏之物。", price: 0, dropOnly: true, breakBonus: 0.03 },

  // ── 命器(黑市限定,消耗型:裝備後,下一次嘗試突破無論成敗皆會自動消耗一枚) ──
  { id: "diminfu", name: "地命符", kind: "mingqi", desc: "黑市秘傳的命符,符紋淺淡。", price: 0, dropOnly: true, breakBonus: 0.03, consumable: true },
  { id: "tianyunfu", name: "天運符", kind: "mingqi", desc: "黑市秘傳的命符,符紋流轉。", price: 0, dropOnly: true, breakBonus: 0.05, consumable: true },
  { id: "tianjifu", name: "天極符", kind: "mingqi", desc: "黑市秘傳的命符,符紋隱有天機。", price: 0, dropOnly: true, breakBonus: 0.08, consumable: true },

  // ── 真仙丹(渡劫飛昇必備,唯太古龍祖、九龍獄墮落真仙馬良掉落;嘗試突破時無論成敗皆消耗) ──
  { id: "zhenxiandan", name: "真仙丹", kind: "special", desc: "太古龍祖精血凝成的無上奇丹。", effect: "渡劫期飛昇必備;服下引來天劫神靈試煉,勝則飛昇機率翻倍、敗則減半,無論成敗皆會耗盡", price: 0 },

  // ── 煉神術(2.14 版新增,九龍獄墮落真仙馬良極稀有掉落,終身限用一次) ──
  { id: "lianshenshu", name: "煉神術", kind: "special", desc: "墮落真仙馬良殞落前留下的殘卷,記載脫胎換骨的煉神秘法。", effect: "精力上限永久 ×2(終身限用一次)", price: 0 },


  // ── 北寒仙尊獨有:更強大的仙法秘笈 ──
  { id: "m_beiming", name: "《北冥玄天訣》", kind: "manual", desc: "北寒仙尊畢生所悟的無上仙法,水行之極,凍結仙靈。", price: 0, teaches: "beiming", dropOnly: true },

  // ── 先天造化丹(金源仙域怪物稀有掉落,築基期服下直升煉虛期) ──
  { id: "xiantian_zaohuadan", name: "先天造化丹", kind: "special", desc: "金源仙域孕育的造化奇丹,藥性霸道。", effect: "築基期服下直升煉虛期(僅限築基期服用)", price: 0 },

  // ── 玄天仙器(玄天殘片 + 太乙精魂煉成,隨機一種,唯太乙境可用,屬性隨煉化品質浮動 100%~300%) ──
  { id: "xuantian_zhanling_jian", name: "玄天斬靈劍", kind: "artifact", desc: "玄天至寶,劍出斬靈,鋒芒所至萬法俱滅。", element: "金", price: 0, atkBonus: 300000, dropOnly: false, reqStage: 12 },
  { id: "xuantian_hulu", name: "玄天葫蘆", kind: "artifact", desc: "玄天至寶,葫蘆納萬法於一體,攻守兼備。", price: 0, atkBonus: 160000, defBonus: 250000, dropOnly: false, reqStage: 12 },
  { id: "potian_chui", name: "破天槌", kind: "artifact", desc: "玄天至寶,一槌落下,天穹為之破碎。", element: "土", price: 0, atkBonus: 450000, defBonus: 50000, dropOnly: false, reqStage: 12 },
  { id: "tianhu_huaxie_ren", name: "天狐化血刃", kind: "artifact", desc: "玄天至寶,刃鋒過處血氣自燃,身法如影隨形。", element: "火", price: 0, atkBonus: 380000, speedBonus: 300, dropOnly: false, reqStage: 12 },
  { id: "xuantian_zhanmo_jian", name: "玄天斬魔劍", kind: "artifact", desc: "玄天至寶,專誅心魔外道,劍意剛猛無儔。", element: "木", price: 0, atkBonus: 420000, defBonus: 80000, dropOnly: false, reqStage: 12 },
  { id: "huantian_jing", name: "幻天鏡", kind: "artifact", desc: "玄天至寶,鏡面幻化萬千身法,虛實難辨。", element: "水", price: 0, atkBonus: 180000, defBonus: 350000, speedBonus: 400, dropOnly: false, reqStage: 12 },

  // ── 太乙精魂(蠻荒異界四大地域王專屬掉落,集滿四枚於太乙殿突破太乙境) ──
  { id: "taiyi_jinghun_tianhu", name: "太乙精魂 - 天狐", kind: "special", desc: "天狐身隕凝成的精魂,赤焰流轉。", effect: "集滿四枚太乙精魂(天狐、真龍、霸下、黑眼貔貅)且登上浮屠塔第 20 層,可於太乙殿自金仙突破太乙境", element: "火", price: 0 },
  { id: "taiyi_jinghun_zhenlong", name: "太乙精魂 - 真龍", kind: "special", desc: "真龍身隕凝成的精魂,龍威隱現。", effect: "集滿四枚太乙精魂(天狐、真龍、霸下、黑眼貔貅)且登上浮屠塔第 20 層,可於太乙殿自金仙突破太乙境", element: "木", price: 0 },
  { id: "taiyi_jinghun_baxia", name: "太乙精魂 - 霸下", kind: "special", desc: "霸下身隕凝成的精魂,厚重渾樸。", effect: "集滿四枚太乙精魂(天狐、真龍、霸下、黑眼貔貅)且登上浮屠塔第 20 層,可於太乙殿自金仙突破太乙境", element: "土", price: 0 },
  { id: "taiyi_jinghun_pixiu", name: "太乙精魂 - 黑眼貔貅", kind: "special", desc: "黑眼貔貅身隕凝成的精魂,幽光流轉。", effect: "集滿四枚太乙精魂(天狐、真龍、霸下、黑眼貔貅)且登上浮屠塔第 20 層,可於太乙殿自金仙突破太乙境", element: "金", price: 0 },

  // ── 五色異星盤(金源仙域怪物稀有掉落,集滿金木水火土五枚可開啟蠻荒異界) ──
  { id: "xingpan_jin", name: "異星盤(金)", kind: "special", desc: "金源仙域深處淬煉的異星圓盤,金光流轉。", effect: "集滿五色異星盤可開啟蠻荒異界;再集一套並加上灰質破界盤,可開啟灰仙界", element: "金", price: 0 },
  { id: "xingpan_mu", name: "異星盤(木)", kind: "special", desc: "金源仙域深處淬煉的異星圓盤,木紋暗湧。", effect: "集滿五色異星盤可開啟蠻荒異界;再集一套並加上灰質破界盤,可開啟灰仙界", element: "木", price: 0 },
  { id: "xingpan_shui", name: "異星盤(水)", kind: "special", desc: "金源仙域深處淬煉的異星圓盤,水波盪漾。", effect: "集滿五色異星盤可開啟蠻荒異界;再集一套並加上灰質破界盤,可開啟灰仙界", element: "水", price: 0 },
  { id: "xingpan_huo", name: "異星盤(火)", kind: "special", desc: "金源仙域深處淬煉的異星圓盤,火紋灼灼。", effect: "集滿五色異星盤可開啟蠻荒異界;再集一套並加上灰質破界盤,可開啟灰仙界", element: "火", price: 0 },
  { id: "xingpan_tu", name: "異星盤(土)", kind: "special", desc: "金源仙域深處淬煉的異星圓盤,土色渾厚。", effect: "集滿五色異星盤可開啟蠻荒異界;再集一套並加上灰質破界盤,可開啟灰仙界", element: "土", price: 0 },

  // ── 真仙 / 金仙頂尖仙法秘笈(極難取得,修煉數十萬載) ──
  { id: "m_hunyuan", name: "《混元一氣仙訣》殘卷", kind: "manual", desc: "開天混元至法,金源仙帝身隕方出。", price: 0, teaches: "hunyuan_yiqi", dropOnly: true },
  { id: "m_taiqing", name: "《太清道韻九轉》玉冊", kind: "manual", desc: "太清仙尊遺留的九轉道韻,修習需五十萬載。太上金仙與浮屠塔高層機緣。", price: 0, teaches: "taiqing_daoyun", dropOnly: true },
  { id: "m_zhutian", name: "《誅天神雷金仙法》仙簡", kind: "manual", desc: "仙庭鎮壓叛仙的無上殺伐仙法,傳說僅浮屠塔絕頂可得。", price: 0, teaches: "zhutian_shenlei", dropOnly: true },

  // ── 3.14 版新增 36 張符寶對應的修習秘笈:reqStage 1~4 沿用既有慣例坊市有售,reqStage 5 以上
  // 沿用既有慣例改為特定妖獸掉落(dropOnly,見 world.ts 對應妖獸的 drops),不直接販售 ──
  { id: "m_jiandao_yiji", name: "《簡道一擊》口訣", kind: "manual", desc: "大道至簡的入門口訣,坊市有售。", price: 400, teaches: "jiandao_yiji", shopSellable: true },
  { id: "m_lieyan_yizhi", name: "《烈焰一指》抄本", kind: "manual", desc: "一指點火的簡易法門,坊市有售。", price: 700, teaches: "lieyan_yizhi", shopSellable: true },
  { id: "m_piaomiao_bu", name: "《縹緲步》身法圖", kind: "manual", desc: "水霧化形的保命身法,坊市有售。", price: 700, teaches: "piaomiao_bu", shopSellable: true },
  { id: "m_shuangfeng_hebi", name: "《雙鋒合璧》劍譜", kind: "manual", desc: "雙劍合璧的基礎連攜劍訣,坊市有售。", price: 700, teaches: "shuangfeng_hebi", shopSellable: true },
  { id: "m_yunqi_daizhao", name: "《運氣待招》心法", kind: "manual", desc: "屏息凝神的蓄力心法,坊市有售。", price: 700, teaches: "yunqi_daizhao", shopSellable: true },
  { id: "m_lianhuan_sanji", name: "《連環三擊》劍譜", kind: "manual", desc: "三連擊的基礎劍法,坊市有售。", price: 900, teaches: "lianhuan_sanji", shopSellable: true },
  { id: "m_hanshui_yidi", name: "《寒水一滴》口訣", kind: "manual", desc: "一滴凝氣的簡易水系口訣,坊市有售。", price: 1200, teaches: "hanshui_yidi", shopSellable: true },
  { id: "m_shuihuo_jiaorong", name: "《水火交融訣》秘卷", kind: "manual", desc: "水火同修的雙屬性秘法,坊市有售。", price: 1500, teaches: "shuihuo_jiaorong", shopSellable: true },
  { id: "m_lianzhao_jue", name: "《連招訣》拳譜", kind: "manual", desc: "結丹修士人人會修的連攜心法,坊市有售。", price: 1200, teaches: "lianzhao_jue", shopSellable: true },
  { id: "m_sanlian_huoqiu", name: "《三連火球》符書", kind: "manual", desc: "接連拋出三枚火球的基礎連擊法術,坊市有售。", price: 1200, teaches: "sanlian_huoqiu", shopSellable: true },
  { id: "m_qingxin_jue", name: "《清心訣》療傷心法", kind: "manual", desc: "清心止水的療傷心法,坊市有售。", price: 1200, teaches: "qingxin_jue", shopSellable: true },
  { id: "m_muti_xiangke_jue", name: "《木金同源訣》秘卷", kind: "manual", desc: "以木御金的雙屬性秘法,坊市有售。需元嬰期。", price: 4000, teaches: "muti_xiangke_jue", shopSellable: true },
  { id: "m_fengxing_shu", name: "《風行術》輕功譜", kind: "manual", desc: "御風而行的保命輕功,坊市有售。需元嬰期。", price: 4000, teaches: "fengxing_shu", shopSellable: true },
  { id: "m_xieli_zhen", name: "《協力陣》陣圖", kind: "manual", desc: "眾法齊發的協同秘法,坊市有售。需元嬰期。", price: 4000, teaches: "xieli_zhen", shopSellable: true },
  { id: "m_bishi_taishi", name: "《蓄勢待發訣》心法", kind: "manual", desc: "引而不發的蓄力心法,坊市有售。需元嬰期。", price: 4000, teaches: "bishi_taishi", shopSellable: true },
  { id: "m_shishen_zhu", name: "《噬神術》邪典", kind: "manual", desc: "以血祭法噬敵化己的邪異秘法,坊市有售。需元嬰期。", price: 4500, teaches: "shishen_zhu", shopSellable: true },
  { id: "m_tuhuo_lianxin", name: "《土火連心訣》秘卷", kind: "manual", desc: "化神修士常修的土火雙屬性秘法,魔化修士殘留。需化神期。", price: 420000, teaches: "tuhuo_lianxin", dropOnly: true },
  { id: "m_bingjian_shuangsha", name: "《冰劍雙殺》劍譜", kind: "manual", desc: "化神修士常修的水系連攜劍訣,魔化修士殘留。需化神期。", price: 420000, teaches: "bingjian_shuangsha", dropOnly: true },
  { id: "m_liulian_shuizhen", name: "《流連水針》秘笈", kind: "manual", desc: "化神修士常修的水系連擊秘法,天嵐妖鳥藏書。需化神期。", price: 420000, teaches: "liulian_shuizhen", dropOnly: true },
  { id: "m_yinfeng_jian", name: "《陰風劍》劍譜", kind: "manual", desc: "化神修士常修的木系基礎劍訣,天嵐妖鳥藏書。需化神期。", price: 420000, teaches: "yinfeng_jian", dropOnly: true },
  { id: "m_yinghuan_shu", name: "《影幻術》幻術譜", kind: "manual", desc: "煉虛修士常修的迷蹤秘法,鬼母藏珍。需煉虛期。", price: 1600000, teaches: "yinghuan_shu", dropOnly: true },
  { id: "m_mushui_ronghe", name: "《木水融合術》秘笈", kind: "manual", desc: "煉虛修士常修的雙屬性秘法,鬼母藏珍。需煉虛期。", price: 1600000, teaches: "mushui_ronghe", dropOnly: true },
  { id: "m_ningshen_juli", name: "《凝神聚氣訣》心法", kind: "manual", desc: "煉虛修士常修的蓄力心法,魔血尊者遺物。需煉虛期。", price: 1600000, teaches: "ningshen_juli", dropOnly: true },
  { id: "m_dinghun_fu", name: "《定魂符》護體秘符", kind: "manual", desc: "煉虛修士常修的護體秘符,魔血尊者遺物。需煉虛期。", price: 1600000, teaches: "dinghun_fu", dropOnly: true },
  { id: "m_jinlei_zhui", name: "《金雷錐》法器譜", kind: "manual", desc: "煉虛修士常修的金系基礎法器,無心霸虎藏珍。需煉虛期。", price: 1600000, teaches: "jinlei_zhui", dropOnly: true },
  { id: "m_jintu_shuangxiu", name: "《金土雙修訣》秘卷", kind: "manual", desc: "合體修士常修的雙屬性秘法,真靈衛守護。需合體期。", price: 8500000, teaches: "jintu_shuangxiu", dropOnly: true },
  { id: "m_wuxing_sanhe", name: "《五行三合訣》秘笈", kind: "manual", desc: "合體修士方能悟得的三屬性稀有秘法,真靈衛守護。需合體期。", price: 8500000, teaches: "wuxing_sanhe", dropOnly: true },
  { id: "m_wulei_lianji", name: "《五雷連擊》雷卷", kind: "manual", desc: "合體修士方能駕馭的頂尖連擊秘法,混元凶獸藏書。需合體期。", price: 8500000, teaches: "wulei_lianji", dropOnly: true },
  { id: "m_xuemai_dazhou", name: "《血脈大咒》邪典", kind: "manual", desc: "合體修士常修的頂尖邪異秘法,混元凶獸藏書。需合體期。", price: 8500000, teaches: "xuemai_dazhou", dropOnly: true },
  { id: "m_xuanyin_dun", name: "《玄影遁》遁法譜", kind: "manual", desc: "大乘修士常修的頂尖遁法,太虛人仙傳承。需大乘期。", price: 8500000, teaches: "xuanyin_dun", dropOnly: true },
  { id: "m_poyun_daishi", name: "《破雲蓄勢訣》心法", kind: "manual", desc: "大乘修士常修的爆發蓄力秘法,太虛人仙傳承。需大乘期。", price: 8500000, teaches: "poyun_daishi", dropOnly: true },
  { id: "m_xuanbing_ci", name: "《玄冰刺》仙冊", kind: "manual", desc: "大乘修士常修的水系基礎法術,九天玄鳳藏珍。需大乘期。", price: 8500000, teaches: "xuanbing_ci", dropOnly: true },
  { id: "m_huoshui_ni_xiang", name: "《火水逆象訣》雷卷", kind: "manual", desc: "渡劫修士方能駕馭的逆象秘法,唯天劫雷靈掉落。需渡劫期。", price: 30000000, teaches: "huoshui_ni_xiang", dropOnly: true },
  { id: "m_tianyuan_sancai", name: "《天元三才印》雷卷", kind: "manual", desc: "渡劫修士窮盡一生方能大成的三才秘法,唯天劫雷靈掉落。需渡劫期。", price: 30000000, teaches: "tianyuan_sancai", dropOnly: true },
  { id: "m_jiuyou_lianzhan", name: "《九幽連斬》雷卷", kind: "manual", desc: "渡劫修士方能駕馭的頂尖連擊劍訣,唯天劫雷靈掉落。需渡劫期。", price: 30000000, teaches: "jiuyou_lianzhan", dropOnly: true },
  { id: "m_jiuxiao_leihuo", name: "《九霄雷火訣》仙簡", kind: "manual", desc: "真仙方能駕馭的雙屬性連擊秘法,天狐領地之主藏珍。", price: 0, teaches: "jiuxiao_leihuo", dropOnly: true },

  // ── 戰術卡(3.1 版新增):戰鬥中消耗型策略卡,效果依氣血上限百分比或固定機制運作,不隨境界過時 ──
  { id: "hufu_fu", name: "護體法箓", kind: "tactic", desc: "貼身一符,符光護體。", price: 60, shieldPct: 0.2 },
  { id: "xishen_fu", name: "洗髓符", kind: "tactic", desc: "以符籙滌蕩經脈。", price: 55, cleanse: true },
  { id: "shuairuo_zhen", name: "衰運針", kind: "tactic", desc: "暗渡陰針,擾亂敵手氣機。", price: 70, enemyWeaken: true },
  { id: "liehuo_yin", name: "烈焰印", kind: "tactic", desc: "掌心烈焰印,烙於敵身。", element: "火", price: 65, forceStatus: "burn" },
  { id: "shizhen_zhi", name: "蝕毒針", kind: "tactic", desc: "淬毒銀針,一擊即中。", element: "木", price: 65, forceStatus: "poison" },
  { id: "bingfeng_jian", name: "冰封箋", kind: "tactic", desc: "寒氣封箋,一觸即發。", element: "水", price: 80, forceStatus: "freeze" },

  // ══════════════════════════ 3.19 版新增內容 ══════════════════════════

  // ── 30+ 件真仙/金仙/太乙裝備(廣寒界·鯤鵬遺骸·灰仙界掉落,見對應怪物 drops[]) ──
  // 真仙(reqStage 10)
  { id: "gh_hanguang_jian", name: "廣寒寒光劍", kind: "artifact", desc: "廣寒界月魄凝成的寒光飛劍,劍氣如霜。", element: "水", price: 0, atkBonus: 22000, defBonus: 6000, dropOnly: true, reqStage: 10 },
  { id: "kp_yuren", name: "鯤鵬羽刃", kind: "artifact", desc: "鯤鵬遺羽淬煉的鋒刃,一揮裂空。", element: "金", price: 0, atkBonus: 25000, defBonus: 5000, dropOnly: true, reqStage: 10 },
  { id: "gh_shuangyu_pao", name: "廣寒霜羽袍", kind: "robe", desc: "廣寒界霜羽織就的仙袍,寒氣護體。", element: "水", price: 0, atkBonus: 4000, defBonus: 11000, dropOnly: true, reqStage: 10 },
  { id: "kp_yujia", name: "鯤鵬羽甲", kind: "robe", desc: "鯤鵬殘羽拼合而成的輕甲,乘風而動。", element: "木", price: 0, defBonus: 10000, speedBonus: 60, dropOnly: true, reqStage: 10 },
  { id: "gh_yupo_zhu", name: "廣寒玉魄珠", kind: "amulet", desc: "廣寒界月魄凝成的玉珠,護體養神。", price: 0, atkBonus: 8000, defBonus: 9000, dropOnly: true, reqStage: 10 },
  { id: "kp_xinzhu", name: "鯤鵬心珠", kind: "amulet", desc: "鯤鵬心血所化的靈珠,攻守速三者兼備。", price: 0, atkBonus: 9000, defBonus: 8000, speedBonus: 40, dropOnly: true, reqStage: 10 },
  { id: "gh_lengyue_fu", name: "廣寒冷月符", kind: "talisman", desc: "廣寒界冷月之力凝成的符籙,寒芒噬骨。", element: "水", price: 0, atkBonus: 18000, dropOnly: true, reqStage: 10 },
  { id: "kp_pokong_fu", name: "鯤鵬破空符", kind: "talisman", desc: "鯤鵬遺骸淬煉的破空符,一符出手,直破九霄。", element: "金", price: 0, atkBonus: 20000, speedBonus: 50, dropOnly: true, reqStage: 10 },
  { id: "pet_yutu", name: "廣寒玉兔", kind: "pet", desc: "廣寒界月魄所化的玉兔,身法輕靈。", price: 0, stoneMult: 1.2, atkBonus: 9000, defBonus: 6000, speedBonus: 80, reqStage: 10, dropOnly: true },
  { id: "pet_kunpeng_chu", name: "鯤鵬幼雛", kind: "pet", desc: "自鯤鵬遺骸中孵化而出的幼雛。", price: 0, stoneMult: 1.2, atkBonus: 12000, defBonus: 4000, speedBonus: 150, reqStage: 10, dropOnly: true },
  { id: "mingqi_guanghan_yuepo", name: "廣寒月魄符", kind: "mingqi", desc: "廣寒界月魄凝成的命符,借月之力。", price: 0, dropOnly: true, breakBonus: 0.1, reqStage: 10 },
  { id: "mingqi_kunpeng_tunan", name: "鯤鵬圖南令", kind: "mingqi", desc: "鯤鵬遺骸所化的令符,寓意圖南萬里。", price: 0, dropOnly: true, breakBonus: 0.11, reqStage: 10 },
  // 金仙(reqStage 11)
  { id: "hx_lueshi_dao", name: "灰仙戮世刀", kind: "artifact", desc: "灰仙界煞氣鑄成的戮世刀,刀鋒過處萬法俱滅。", price: 0, atkBonus: 55000, defBonus: 18000, dropOnly: true, reqStage: 11 },
  { id: "kp_guixu_jian", name: "鯤鵬歸墟劍", kind: "artifact", desc: "鯤鵬遺骸深處淬煉的歸墟劍,劍出如鯤化鵬。", element: "金", price: 0, atkBonus: 60000, defBonus: 16000, dropOnly: true, reqStage: 11 },
  { id: "hx_shaying_pao", name: "灰仙煞影袍", kind: "robe", desc: "灰仙界煞氣織就的煞影袍,身形隱於煞霧之中。", price: 0, atkBonus: 15000, defBonus: 22000, dropOnly: true, reqStage: 11 },
  { id: "gh_hanyuan_jia", name: "廣寒寒淵甲", kind: "robe", desc: "廣寒界寒淵之氣煉成的重甲,寒徹入骨。", element: "水", price: 0, defBonus: 24000, speedBonus: 70, dropOnly: true, reqStage: 11 },
  { id: "hx_shihun_zhu", name: "灰仙噬魂珠", kind: "amulet", desc: "灰仙界煞氣凝成的噬魂珠。", price: 0, atkBonus: 20000, defBonus: 20000, dropOnly: true, reqStage: 11 },
  { id: "kp_xingtu_zhu", name: "鯤鵬星圖珠", kind: "amulet", desc: "鯤鵬遺骸所遺的星圖珠,指引方向,兼護己身。", price: 0, atkBonus: 18000, defBonus: 19000, speedBonus: 60, dropOnly: true, reqStage: 11 },
  { id: "hx_mieshi_fu", name: "灰仙滅世符", kind: "talisman", desc: "灰仙界煞氣凝成的滅世符,一符出手,天地變色。", price: 0, atkBonus: 50000, dropOnly: true, reqStage: 11 },
  { id: "gh_ningyue_fu", name: "廣寒凝月符", kind: "talisman", desc: "廣寒界凝月之力煉成的符籙,月光所至,萬法俱寒。", element: "水", price: 0, atkBonus: 45000, speedBonus: 50, dropOnly: true, reqStage: 11 },
  { id: "pet_youling_shou", name: "灰仙幽靈獸", kind: "pet", desc: "灰仙界煞氣所化的幽靈獸。", price: 0, stoneMult: 1.2, atkBonus: 30000, defBonus: 15000, speedBonus: 200, reqStage: 11, dropOnly: true },
  { id: "pet_kunpeng_zhenyu", name: "鯤鵬真羽", kind: "pet", desc: "鯤鵬遺骸淬煉真羽而生的靈寵。", price: 0, stoneMult: 1.2, atkBonus: 35000, defBonus: 12000, speedBonus: 250, reqStage: 11, dropOnly: true },
  { id: "mingqi_hx_shawen", name: "灰仙煞紋符", kind: "mingqi", desc: "灰仙界煞氣烙印而成的命符。", price: 0, dropOnly: true, breakBonus: 0.14, reqStage: 11 },
  { id: "mingqi_gh_tianji", name: "廣寒天機符", kind: "mingqi", desc: "廣寒界天機演算所化的命符。", price: 0, dropOnly: true, breakBonus: 0.13, reqStage: 11 },
  // 太乙(reqStage 12)
  { id: "hx_mieshi_zhanling_dao", name: "灰仙滅世斬靈刀", kind: "artifact", desc: "灰仙界煞氣所鑄的斬靈至寶,一刀滅世,萬靈俱寂。", price: 0, atkBonus: 130000, defBonus: 40000, dropOnly: true, reqStage: 12 },
  { id: "kp_jiutian_ji", name: "鯤鵬九天戟", kind: "artifact", desc: "鯤鵬遺骸深處的九天神戟,一擊貫穿九霄。", element: "金", price: 0, atkBonus: 140000, defBonus: 35000, dropOnly: true, reqStage: 12 },
  { id: "gh_taixu_yuyi", name: "廣寒太虛羽衣", kind: "robe", desc: "廣寒界太虛之氣織就的羽衣,萬法不侵。", element: "水", price: 0, atkBonus: 30000, defBonus: 55000, dropOnly: true, reqStage: 12 },
  { id: "hx_youming_kai", name: "灰仙幽冥鎧", kind: "robe", desc: "灰仙界幽冥煞氣凝成的重鎧,固若幽冥本源。", price: 0, defBonus: 58000, speedBonus: 100, dropOnly: true, reqStage: 12 },
  { id: "kp_hundun_zhu", name: "鯤鵬混沌珠", kind: "amulet", desc: "鯤鵬遺骸中孕育的混沌珠,吞吐天地之力。", price: 0, atkBonus: 80000, defBonus: 50000, dropOnly: true, reqStage: 12 },
  { id: "hx_miehun_zhu", name: "灰仙滅魂珠", kind: "amulet", desc: "灰仙界煞氣凝聚的滅魂珠。", price: 0, atkBonus: 90000, defBonus: 45000, speedBonus: 80, dropOnly: true, reqStage: 12 },
  { id: "gh_tiangang_fu", name: "廣寒天罡符", kind: "talisman", desc: "廣寒界天罡之力凝成的符籙,罡風所至,萬法俱裂。", element: "水", price: 0, atkBonus: 110000, dropOnly: true, reqStage: 12 },
  { id: "hx_zhongyan_fu", name: "灰仙終焉符", kind: "talisman", desc: "灰仙界煞氣淬煉的終焉符,一符出手,終焉降臨。", price: 0, atkBonus: 120000, speedBonus: 60, dropOnly: true, reqStage: 12 },
  { id: "pet_kunpeng_zhenshen", name: "鯤鵬真身", kind: "pet", desc: "自鯤鵬遺骸中復甦的鯤鵬真身。", price: 0, stoneMult: 1.2, atkBonus: 100000, defBonus: 40000, speedBonus: 400, reqStage: 12, dropOnly: true },
  { id: "pet_hx_shashou", name: "灰仙煞獸", kind: "pet", desc: "灰仙界煞氣孕育而生的煞獸。", price: 0, stoneMult: 1.2, atkBonus: 110000, defBonus: 35000, speedBonus: 350, reqStage: 12, dropOnly: true },
  { id: "mingqi_taiyi_guiyuan", name: "太乙歸元符", kind: "mingqi", desc: "太乙至理凝成的歸元符。", price: 0, dropOnly: true, breakBonus: 0.18, reqStage: 12 },
  { id: "mingqi_hx_mieshi", name: "灰仙滅世符(命)", kind: "mingqi", desc: "灰仙界煞氣所鑄的命符。", price: 0, dropOnly: true, breakBonus: 0.2, reqStage: 12 },

  // ── 3.19 版新增 22 張符寶對應秘笈:reqStage 2~4 坊市有售,5 以上沿用既有慣例改由妖獸掉落 ──
  { id: "m_jingang_liesan", name: "《金剛裂閃》劍譜", kind: "manual", desc: "金剛之力裂空的連擊劍法,坊市有售。", price: 900, teaches: "jingang_liesan", shopSellable: true },
  { id: "m_qingfeng_ganlu", name: "《青風甘露》心法", kind: "manual", desc: "青風拂體的療傷心法,坊市有售。", price: 700, teaches: "qingfeng_ganlu", shopSellable: true },
  { id: "m_hanyu_bu", name: "《寒羽步》身法圖", kind: "manual", desc: "寒羽披身的保命身法,坊市有售。", price: 1200, teaches: "hanyu_bu", shopSellable: true },
  { id: "m_yanmang_yizhi", name: "《炎芒一指》口訣", kind: "manual", desc: "一指點火的簡易法門,坊市有售。", price: 500, teaches: "yanmang_yizhi", shopSellable: true },
  { id: "m_tuyan_zhen", name: "《土衍陣》陣圖", kind: "manual", desc: "厚土衍陣的護體秘法,坊市有售。需元嬰期。", price: 4000, teaches: "tuyan_zhen", shopSellable: true },
  { id: "m_yunqi_zaiqi", name: "《運氣再起》心法", kind: "manual", desc: "屏息再運的蓄力心法,坊市有售。", price: 900, teaches: "yunqi_zaiqi", shopSellable: true },
  { id: "m_jinlei_zhaji", name: "《金雷炸擊》雷譜", kind: "manual", desc: "化神修士常修的金系連擊秘法,魔化修士殘留。需化神期。", price: 420000, teaches: "jinlei_zhaji", dropOnly: true },
  { id: "m_muling_huisheng", name: "《木靈回生》秘卷", kind: "manual", desc: "化神修士常修的木系吸血秘法,魔化修士殘留。需化神期。", price: 420000, teaches: "muling_huisheng", dropOnly: true },
  { id: "m_jinmu_shuangyi", name: "《金木雙翼》秘笈", kind: "manual", desc: "化神修士常修的雙屬性秘法,魔化修士殘留。需化神期。", price: 420000, teaches: "jinmu_shuangyi", dropOnly: true },
  { id: "m_shuitu_ningxiang", name: "《水土凝香》秘笈", kind: "manual", desc: "化神修士常修的雙屬性秘法,魔化修士殘留。需化神期。", price: 420000, teaches: "shuitu_ningxiang", dropOnly: true },
  { id: "m_hanshui_fengyin", name: "《寒水封印》秘卷", kind: "manual", desc: "煉虛修士常修的水系封印秘法,鬼母藏珍。需煉虛期。", price: 1600000, teaches: "hanshui_fengyin", dropOnly: true },
  { id: "m_liyan_zhulong", name: "《離焰逐龍》火譜", kind: "manual", desc: "煉虛修士常修的火系秘法,鬼母藏珍。需煉虛期。", price: 1600000, teaches: "liyan_zhulong", dropOnly: true },
  { id: "m_houtu_yaji", name: "《厚土壓寂》陣圖", kind: "manual", desc: "煉虛修士常修的土系連攜秘法,鬼母藏珍。需煉虛期。", price: 1600000, teaches: "houtu_yaji", dropOnly: true },
  { id: "m_huojin_liehun", name: "《火金裂魂》秘卷", kind: "manual", desc: "煉虛修士常修的雙屬性秘法,鬼母藏珍。需煉虛期。", price: 1600000, teaches: "huojin_liehun", dropOnly: true },
  { id: "m_mingjing_zhi", name: "《明鏡止水訣》心法", kind: "manual", desc: "合體修士常修的回氣心法,真靈衛守護。需合體期。", price: 8500000, teaches: "mingjing_zhi", dropOnly: true },
  { id: "m_tianluo_suoshen", name: "《天羅鎖神陣》陣圖", kind: "manual", desc: "大乘修士常修的雙屬性陣法,上古真龍殘魂守護。需大乘期。", price: 8500000, teaches: "tianluo_suoshen", dropOnly: true },
  { id: "m_xuanshui_nixi", name: "《玄水逆息訣》秘卷", kind: "manual", desc: "渡劫修士方能駕馭的水系吸血秘法,唯天劫雷靈掉落。需渡劫期。", price: 30000000, teaches: "xuanshui_nixi", dropOnly: true },
  { id: "m_tianhuo_fenying", name: "《天火焚影》火譜", kind: "manual", desc: "渡劫修士方能駕馭的頂尖連擊秘法,唯天劫雷靈掉落。需渡劫期。", price: 30000000, teaches: "tianhuo_fenying", dropOnly: true },
  { id: "m_wanmu_guiyi", name: "《萬木歸一訣》秘笈", kind: "manual", desc: "渡劫修士窮盡一生方能大成的連攜秘法,唯天劫雷靈掉落。需渡劫期。", price: 30000000, teaches: "wanmu_guiyi", dropOnly: true },
  { id: "m_jinsha_huanying", name: "《金煞幻影》仙簡", kind: "manual", desc: "真仙方能駕馭的遁法秘笈,北寒仙尊藏珍。", price: 0, teaches: "jinsha_huanying", dropOnly: true },
  { id: "m_taixu_zhenyuan", name: "《太虛真元印》仙簡", kind: "manual", desc: "真仙方能駕馭的護體仙法,廣寒界秘藏。", price: 0, teaches: "taixu_zhenyuan", dropOnly: true },
  { id: "m_jiutian_huoyu", name: "《九天火獄陣》仙簡", kind: "manual", desc: "真仙方能駕馭的雙屬性仙陣,鯤鵬遺骸秘藏。", price: 0, teaches: "jiutian_huoyu", dropOnly: true },

  // ── 煞屬性符寶秘笈(5 張,唯灰仙界怪物掉落,見對應怪物 drops[]) ──
  { id: "m_shaqi_yidao", name: "《煞氣一刀》煞典", kind: "manual", desc: "灰仙界煞氣凝成的殺伐一刀。", price: 0, teaches: "shaqi_yidao", dropOnly: true },
  { id: "m_shashen_xibo", name: "《煞神噬魄》煞典", kind: "manual", desc: "灰仙界煞神噬魄之法,以血養煞。", price: 0, teaches: "shashen_xibo", dropOnly: true },
  { id: "m_heiyu_shashi", name: "《黑域煞噬》煞典", kind: "manual", desc: "灰仙界黑域煞氣噬體之法。", price: 0, teaches: "heiyu_shashi", dropOnly: true },
  { id: "m_shahai_wushuang", name: "《煞海無雙》煞典", kind: "manual", desc: "灰仙界煞海翻湧之法,一往無前。", price: 0, teaches: "shahai_wushuang", dropOnly: true },
  { id: "m_mieshi_shazun", name: "《滅世煞尊》煞典", kind: "manual", desc: "灰仙界滅世煞尊臨世之法,焚盡蒼生。", price: 0, teaches: "mieshi_shazun", dropOnly: true },

  // ── 一次性秘境地圖道具(3.19 版新增):使用後直接開啟對應一次性戰鬥,見 engine.ts useItem ──
  { id: "guanghanjie", name: "廣寒界", kind: "special", desc: "月魄凝成的秘境地圖,廣寒界機緣非凡,亦有絕世妖魔盤踞。", effect: "使用後消耗,開啟一場廣寒仙子首領戰(真仙以上)", price: 0, dropOnly: true, reqStage: 10, mapEncounter: "boss_guanghan" },
  { id: "kunpeng_yihai", name: "鯤鵬遺骸", kind: "special", desc: "上古鯤鵬殞落之地的殘存氣息所化地圖,機緣與凶險並存。", effect: "使用後消耗,開啟一場鯤鵬殘魂首領戰(真仙以上)", price: 0, dropOnly: true, reqStage: 10, mapEncounter: "boss_kunpeng" },
  { id: "zhenmo_menling", name: "真魔門令", kind: "special", desc: "秘境深處魔門前拾得的漆黑令牌,令上龍紋隱隱蠕動。", effect: "於儲物袋挑戰守門的冥翎天魔古龍(真仙以上);擊敗後開啟真魔界並消耗此令,落敗則令牌保留,但煞氣 +2500;可於玩家市集轉賣", price: 0, mapEncounter: "zm_mingling_gulong", reqStage: 10 },

  // ── 煞氣解法(3.19 版新增) ──
  { id: "mieshadan", name: "滅煞丹", kind: "pill", desc: "以真魔精血調配的奇丹。", price: 0, dropOnly: true, reqStage: 10, cureShaqi: true },

  // ── 灰仙界開界道具(3.19 版新增) ──
  { id: "huizhi_pojiepan", name: "灰質破界盤", kind: "special", desc: "極其稀有的灰質圓盤,隱隱與五色異星盤共鳴。", effect: "搭配一套五色異星盤,可開啟灰仙界", price: 0, dropOnly: true },

  // ── 通天閣進場道具(3.19 版新增) ──
  { id: "tongtian_ling", name: "通天令", kind: "special", desc: "唯真仙以上方能感應的令牌。", effect: "使用後永久開啟通天閣(真仙以上)", price: 0, dropOnly: true, reqStage: 10 },
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

// 依「顯示名稱」反查道具(用於 engine.ts 動態組出的敘事文字,如「你煉製出【青索劍(+13%)】!」)。
// 先試完全比對,再嘗試剝掉煉器品質浮動附註的「(+13%)」尾綴後比對——找不到就回傳 undefined。
export function itemDefByDisplayName(name: string): ItemDef | undefined {
  const exact = ITEMS.find((i) => i.name === name);
  if (exact) return exact;
  const stripped = name.replace(/\([+-]?\d+%\)$/, "");
  if (stripped === name) return undefined;
  return ITEMS.find((i) => i.name === stripped);
}
