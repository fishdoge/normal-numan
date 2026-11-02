// 仙界大擴充(5.4 版):七大仙域各分 2~3 個「區域」,每區 3~6 個關卡(秘境),
// 每區有自己的採集材料與仙草(採集不再空手而歸),每個仙域一整套新裝備,外加一整批妖獸與區域菁英。
//
// 妖獸數值不逐隻手調,由所在仙域「現有一般妖獸」的中位數(TIER_BASE)乘上關卡難度推算:
//   難度 d = 該關在整個仙域的順序 ÷ (關卡數 − 1),0 = 第一關,1 = 最後一關
//   氣血 = 基準氣血 × (0.6 + 0.9d)、攻擊 = 基準攻擊 × (0.85 + 0.35d)
//   修為/靈石 = 基準 × (0.7 + 0.6d)
//   區域菁英(每區最後一關 12% 現身):氣血 ×3.2、攻擊 ×1.8、修為 ×4、靈石 ×3
// 本檔只依賴型別,world.ts / items.ts / tengfu.ts 再把這裡產生的資料併入,避免循環 import。
import type { Element, ItemDef, Location, Monster, Recipe } from "../types";

type ZoneId = "beihan" | "jinyuan" | "manhuang" | "zhenmo" | "huixian" | "lunhui" | "zhongtu";

// 各仙域既有一般妖獸的中位數(5.3 版數值;5.4 版仙界攻擊一律 ×3)
const TIER_BASE: Record<ZoneId, { hp: number; atk: number; exp: number; stones: number }> = {
  beihan: { hp: 1_770_000, atk: 180_000, exp: 200_000, stones: 11_700_000 },
  jinyuan: { hp: 16_400_000, atk: 210_000, exp: 420_000, stones: 8_700_000 },
  manhuang: { hp: 74_000_000, atk: 240_000, exp: 560_000, stones: 13_000_000 },
  zhenmo: { hp: 200_000_000, atk: 270_000, exp: 750_000, stones: 1_280_000 },
  lunhui: { hp: 205_000_000, atk: 267_000, exp: 760_000, stones: 1_280_000 },
  huixian: { hp: 368_000_000, atk: 399_000, exp: 3_600_000, stones: 6_900_000 },
  zhongtu: { hp: 480_000_000, atk: 480_000, exp: 4_100_000, stones: 8_250_000 }, // 攻擊 ×3:道祖坐鎮,傷害須遠高於灰仙界
};
// 各仙域的常駐丹藥掉落(沿用既有道具)
const ZONE_POTION: Record<ZoneId, string> = {
  beihan: "xianyuan_huichun",
  jinyuan: "jiuzhuan_xianlu",
  manhuang: "taiyi_huanhun",
  zhenmo: "taiyi_huanhun",
  lunhui: "taiyi_huanhun",
  huixian: "taiyi_huanhun",
  zhongtu: "zengyuandan",
};
// 材料售價、仙草回復量、配方靈石(依仙域強度)
const ZONE_ECON: Record<ZoneId, { mat: number; herb: number; heal: number; recipe: number }> = {
  beihan: { mat: 800, herb: 600, heal: 300_000, recipe: 40_000_000 },
  jinyuan: { mat: 1_500, herb: 1_000, heal: 400_000, recipe: 90_000_000 },
  manhuang: { mat: 3_000, herb: 2_000, heal: 600_000, recipe: 150_000_000 },
  zhenmo: { mat: 3_000, herb: 2_000, heal: 600_000, recipe: 150_000_000 },
  lunhui: { mat: 3_000, herb: 2_000, heal: 600_000, recipe: 150_000_000 },
  huixian: { mat: 6_000, herb: 4_000, heal: 800_000, recipe: 300_000_000 },
  zhongtu: { mat: 9_000, herb: 6_000, heal: 1_000_000, recipe: 500_000_000 },
};
// 每套裝備的數值:法器(攻/防)、法衣(攻/防)、護身符(攻/防)、符籙(攻)
const ZONE_GEAR_STATS: Record<ZoneId, { art: [number, number]; robe: [number, number]; amulet: [number, number]; tal: number }> = {
  beihan: { art: [20_000, 2_500], robe: [0, 16_000], amulet: [5_000, 6_000], tal: 11_000 },
  jinyuan: { art: [30_000, 4_000], robe: [2_000, 28_000], amulet: [9_000, 9_000], tal: 16_000 },
  manhuang: { art: [45_000, 10_000], robe: [5_000, 38_000], amulet: [14_000, 14_000], tal: 30_000 },
  zhenmo: { art: [47_000, 8_000], robe: [6_000, 36_000], amulet: [15_000, 12_000], tal: 32_000 },
  lunhui: { art: [43_000, 11_000], robe: [4_000, 40_000], amulet: [13_000, 15_000], tal: 29_000 },
  huixian: { art: [70_000, 20_000], robe: [10_000, 60_000], amulet: [30_000, 28_000], tal: 60_000 },
  zhongtu: { art: [100_000, 30_000], robe: [15_000, 80_000], amulet: [45_000, 40_000], tal: 90_000 },
};

// [id, 名稱, 五行, 介紹]
type MonSpec = [string, string, Element, string];
interface StageSpec {
  id: string;
  name: string;
  desc: string;
  monsters: MonSpec[];
}
interface AreaSpec {
  id: string;
  name: string;
  existing?: string[]; // 歸入此區的既有秘境(排在新關卡之前)
  stages: StageSpec[];
  elite?: MonSpec; // 區域菁英,在本區最後一關現身
  mat: [string, string, Element, string]; // 採集材料
  herb: [string, string, string]; // 採集仙草 [id, 名稱, 介紹]
}
interface GearSpec {
  art: [string, string, Element, string];
  robe: [string, string, string];
  amulet: [string, string, string];
  tal: [string, string, string];
}
interface ZoneSpec {
  zone: ZoneId;
  ignoresCounters?: boolean;
  areas: AreaSpec[];
  gear: GearSpec;
}

const SPECS: ZoneSpec[] = [
  {
    zone: "beihan",
    areas: [
      {
        id: "bh_a1",
        name: "玄冰原",
        existing: ["xuanbing_yuan"],
        stages: [
          { id: "bh_donghun", name: "凍魂谷", desc: "寒風如刀的幽谷,迷途者的魂魄被凍在冰壁之中。", monsters: [["bh_donghunfu", "凍魂蝠", "水", "以凍結魂魄為食的冰蝠,振翅便落下一陣冰霜。"], ["bh_shuanglielang", "霜鬣狼", "金", "鬣毛如冰刺的狼群,成群圍獵落單的仙人。"]] },
          { id: "bh_shuanglang", name: "霜狼嶺", desc: "霜狼一族盤踞的雪嶺,月夜裡狼嘯聲響徹仙原。", monsters: [["bh_langwei", "霜狼王衛", "金", "霜狼王麾下的親衛,體型如虎,牙利如劍。"], ["bh_xueyuan", "雪原巨猿", "土", "力能拔山的白毛巨猿,捶胸便引發雪崩。"]] },
        ],
        elite: ["bh_e_xiaoyue", "霜狼王 · 嘯月", "金", "統御整片霜狼嶺的狼王,一聲嘯月,萬狼俯首。"],
        mat: ["bh_m_langya", "霜狼牙", "金", "霜狼脫落的利牙,寒鋒內斂,煉器上品。"],
        herb: ["bh_h_xuelian", "雪蓮仙草", "生於萬載玄冰縫隙的雪蓮,服之寒氣化為生機。"],
      },
      {
        id: "bh_a2",
        name: "北寒宮",
        existing: ["beihan_dian"],
        stages: [
          { id: "bh_hanyue", name: "寒月宮", desc: "北寒仙尊妃嬪居住的冰宮,月光終年不散。", monsters: [["bh_yuepo", "月魄冰姬", "水", "以月華凝成的冰姬,一曲寒歌令人神魂凍結。"], ["bh_gongwei", "寒宮侍衛", "金", "披冰甲、執寒戟的宮廷侍衛,至死不退。"]] },
          { id: "bh_bingpo", name: "冰魄迴廊", desc: "冰鏡林立的長廊,每一面鏡中都藏著一隻冰魅。", monsters: [["bh_kuilei", "冰魄傀儡", "土", "以冰魄驅動的守廊傀儡,不知疲倦。"], ["bh_jingying", "鏡影冰魅", "水", "藏身冰鏡的妖魅,化作來者的模樣出手偷襲。"]] },
        ],
        elite: ["bh_e_xianfei", "寒月仙妃", "水", "北寒仙尊最寵愛的妃子,冰心如月,出手無情。"],
        mat: ["bh_m_bingpo", "冰魄晶", "水", "冰魄迴廊凝結的晶石,內含一縷寒月精華。"],
        herb: ["bh_h_bingzhi", "月華冰芝", "吸收月華千年的冰芝,入口清寒,傷勢立癒。"],
      },
      {
        id: "bh_a3",
        name: "極北冰海",
        stages: [
          { id: "bh_fudao", name: "冰海浮島", desc: "漂浮在冰海上的孤島,海獸時常破冰而出。", monsters: [["bh_jingsha", "冰海鯨鯊", "水", "半鯨半鯊的冰海巨獸,一口能吞下整座浮冰。"], ["bh_juxie", "浮冰巨蟹", "土", "背負浮冰的巨蟹,蟹螯能夾碎仙器。"]] },
          { id: "bh_bingyuan", name: "萬載冰淵", desc: "深不見底的冰淵,淵底封著上古的冰屍。", monsters: [["bh_mojiao", "冰淵魔蛟", "水", "盤踞冰淵的魔蛟,吐息成冰,凍徹仙骨。"], ["bh_bingshi", "寒骨冰屍", "金", "封凍萬年的上古修士屍骸,寒骨如鐵。"]] },
          { id: "bh_haiyan", name: "極光海眼", desc: "極光垂落的海眼,傳說是北冥寒鯤沉睡之處。", monsters: [["bh_lingfeng", "極光靈鳳", "火", "沐浴極光而生的靈鳳,冰海中唯一的火焰。"], ["bh_shouling", "海眼守靈", "水", "守護海眼的古老水靈,與冰海同壽。"]] },
        ],
        elite: ["bh_e_hankun", "北冥寒鯤", "水", "沉睡於海眼的寒鯤,翻身便掀起冰海狂潮。"],
        mat: ["bh_m_bingsui", "萬載冰髓", "水", "冰淵深處凝結萬年的冰髓,寒氣直透仙軀。"],
        herb: ["bh_h_haizao", "極光海藻", "在極光下搖曳的海藻,泛著七彩微光。"],
      },
    ],
    gear: {
      art: ["bh_g_xiaoyue_ren", "嘯月霜狼刃", "金", "以霜狼王的獠牙打磨而成,揮動時隱約有狼嘯之聲。"],
      robe: ["bh_g_xueyu_yi", "寒月雪羽衣", "寒月宮仙娥以雪羽織成的仙衣,輕若無物。"],
      amulet: ["bh_g_hujing", "冰魄護心鏡", "冰魄迴廊最深處的一面冰鏡,能映出並化解來襲的殺意。"],
      tal: ["bh_g_hanfu", "北冥寒符", "以北冥寒鯤之息繪成的符籙,符成之時滿室結霜。"],
    },
  },
  {
    zone: "jinyuan",
    areas: [
      {
        id: "jy_a1",
        name: "五重仙關",
        existing: ["jy_guan1", "jy_guan2", "jy_guan3", "jy_guan4", "jy_guan5"],
        stages: [],
        mat: ["jy_m_guanjin", "仙關金砂", "金", "五重仙關磚縫間積下的金砂,蘊含護關禁制之力。"],
        herb: ["jy_h_jinlian", "金蕊仙蓮", "仙關前金池中的仙蓮,花蕊如金絲。"],
      },
      {
        id: "jy_a2",
        name: "金源礦脈",
        stages: [
          { id: "jy_kuangdong", name: "赤金礦洞", desc: "金源之氣凝成礦脈的深洞,礦魔在黑暗中游走。", monsters: [["jy_jinyi", "礦脈金蟻", "金", "啃食金礦而生的金蟻,甲殼堅逾仙器。"], ["jy_kuangmo", "赤金礦魔", "土", "礦脈中孕育的礦魔,身軀由赤金礦石堆成。"]] },
          { id: "jy_rongjin", name: "熔金河", desc: "熔化的金汁匯成長河,河面終年翻騰。", monsters: [["jy_huojiao", "熔金火蛟", "火", "在金汁中翻騰的火蛟,鱗片滾燙如烙鐵。"], ["jy_chanwang", "金河蟾王", "水", "蹲踞熔金河畔的巨蟾,吐出的金液能將人封成金像。"]] },
          { id: "jy_jinwu", name: "金烏巢", desc: "礦脈盡頭的火山口,三足金烏在此築巢。", monsters: [["jy_jinwu_chu", "金烏幼雛", "火", "尚未長成的金烏,已能噴吐太陽真火。"], ["jy_hucao", "金烏護巢使", "金", "守護金烏巢的金甲仙禽,寸步不讓。"]] },
        ],
        elite: ["jy_e_jinwu", "三足金烏", "火", "棲息於金源礦脈盡頭的三足金烏,雙翼一展便是一輪烈日。"],
        mat: ["jy_m_chijin", "赤金礦髓", "金", "礦脈最深處的赤金精髓,金源之氣最濃之處。"],
        herb: ["jy_h_huozao", "金烏火棗", "金烏巢邊生長的火棗,入口如飲太陽真火。"],
      },
    ],
    gear: {
      art: ["jy_g_fentian_ji", "金烏焚天戟", "火", "以金烏羽根為纓、赤金礦髓為鋒的長戟,一戟焚天。"],
      robe: ["jy_g_chijin_jia", "赤金鱗甲", "赤金礦魔的甲片串成的重甲,金光內斂。"],
      amulet: ["jy_g_rilun", "金烏日輪", "三足金烏遺落的一枚日輪,佩之如懷烈日。"],
      tal: ["jy_g_liekong_fu", "赤金裂空符", "以赤金礦髓研墨繪成的符籙,可裂空斬敵。"],
    },
  },
  {
    zone: "manhuang",
    areas: [
      {
        id: "mh_a1",
        name: "四大領地",
        existing: ["manhuang_tianhu", "manhuang_zhenlong", "manhuang_baxia", "manhuang_pixiu"],
        stages: [],
        mat: ["mh_m_shoujiao", "蠻荒獸角", "土", "四大領地妖獸脫落的獸角,蘊含洪荒血氣。"],
        herb: ["mh_h_lingcao", "洪荒靈草", "蠻荒大地上野生的靈草,藥力粗獷而猛烈。"],
      },
      {
        id: "mh_a2",
        name: "洪荒古林",
        stages: [
          { id: "mh_gulin", name: "古木巨林", desc: "參天古木遮天蔽日,林中樹人與毒蟒共生。", monsters: [["mh_shuren", "古林樹人", "木", "活了數十萬年的古樹化身,一步便是一片森林。"], ["mh_dumang", "巨林毒蟒", "木", "纏繞古木的毒蟒,毒液能腐蝕仙軀。"]] },
          { id: "mh_wanshou", name: "萬獸峽", desc: "兩壁如削的峽谷,洪荒獸群每日從此奔過。", monsters: [["mh_lieshanxi", "裂山犀", "土", "一角能頂裂山嶽的巨犀,衝鋒時地動山搖。"], ["mh_xiaofengbao", "嘯風豹", "金", "快如狂風的金紋豹,出手時只見殘影。"]] },
          { id: "mh_shougu", name: "獸骨荒原", desc: "洪荒巨獸死後葬身的荒原,白骨堆積如山。", monsters: [["mh_tujiu", "骨原禿鷲", "金", "啄食巨獸殘骸的禿鷲,鐵喙能啄穿仙甲。"], ["mh_shishou", "荒原屍獸", "土", "巨獸殘骸中滋生的屍獸,不死不滅。"]] },
        ],
        elite: ["mh_e_qiongqi", "洪荒獸王 · 窮奇", "金", "上古四凶之一,背生雙翼,專吞忠善之人。"],
        mat: ["mh_m_gumu", "洪荒古木", "木", "古木巨林中自然倒下的古木心材,堅逾精鋼。"],
        herb: ["mh_h_lingzhi", "萬年靈芝", "生於古木根部的萬年靈芝,傘蓋大如車輪。"],
      },
      {
        id: "mh_a3",
        name: "王庭外圍",
        stages: [
          { id: "mh_yungu", name: "隕骨坑", desc: "天外隕石砸出的巨坑,坑底熔岩中藏著巨蠍。", monsters: [["mh_juxie", "隕骨巨蠍", "土", "以隕石為食的巨蠍,尾針帶著天外寒毒。"], ["mh_yanmo", "坑底炎魔", "火", "隕石撞擊點孕育的炎魔,渾身熔岩流淌。"]] },
          { id: "mh_lingsui", name: "靈髓泉", desc: "蠻荒靈髓湧出的泉眼,泉中水蛟與靈龜相守。", monsters: [["mh_shuijiao", "靈髓水蛟", "水", "飲靈髓長大的水蛟,鱗片泛著乳白光澤。"], ["mh_linggui", "泉守靈龜", "水", "守護靈髓泉萬年的靈龜,龜甲上刻滿古紋。"]] },
          { id: "mh_wangting", name: "王庭外圍", desc: "蠻荒王庭的外圍營地,部族勇士與馴獸祭司日夜戒備。", monsters: [["mh_yongshi", "蠻荒部族勇士", "火", "以獸血淬體的部族勇士,赤手便能撕裂妖獸。"], ["mh_jisi", "馴獸祭司", "木", "能以骨笛號令百獸的祭司。"]] },
        ],
        elite: ["mh_e_xingtian", "蠻荒戰神 · 刑天", "土", "斷首猶戰的上古戰神,以乳為目、以臍為口,揮干戚鎮守王庭。"],
        mat: ["mh_m_yungujin", "隕骨精金", "金", "隕骨坑中提煉出的天外精金,沉重異常。"],
        herb: ["mh_h_xianlu", "靈髓仙露", "靈髓泉畔凝結的仙露,一滴便能續命。"],
      },
    ],
    gear: {
      art: ["mh_g_lie_fu", "窮奇裂魂斧", "金", "以窮奇骨鑄成的巨斧,斧刃所過,魂魄俱裂。"],
      robe: ["mh_g_shoupi_jia", "洪荒獸皮甲", "以裂山犀皮與古木心材縫製的戰甲,粗獷而堅固。"],
      amulet: ["mh_g_ganqi", "刑天干戚佩", "刑天干戚上剝落的一角,佩之戰意不滅。"],
      tal: ["mh_g_zhanhun_fu", "蠻荒戰魂符", "以部族戰魂血祭而成的符籙,焚之戰鼓雷鳴。"],
    },
  },
  {
    zone: "zhenmo",
    areas: [
      {
        id: "zm_a1",
        name: "真魔淵",
        existing: ["zhenmo_yuan"],
        stages: [
          { id: "zm_xuechi", name: "血池", desc: "真魔淵旁沸騰的血池,池中魔物以血為生。", monsters: [["zm_mozhi", "血池魔蛭", "水", "附骨吸血的魔蛭,被纏上便血流不止。"], ["zm_moji", "血池魔姬", "火", "沐浴血池的魔姬,一笑傾城,一怒血雨。"]] },
          { id: "zm_mogu", name: "魔骨林", desc: "以魔物骸骨為樹的怪林,枝頭棲滿噬魂鴉。", monsters: [["zm_shuyao", "魔骨樹妖", "木", "骸骨堆成的樹妖,枝條能刺穿神魂。"], ["zm_hunya", "骨林噬魂鴉", "金", "啄食魂魄的黑鴉,鳴聲令人心神動搖。"]] },
        ],
        elite: ["zm_e_mozun", "血池魔尊", "火", "從血池中誕生的魔尊,喝乾過三座血池。"],
        mat: ["zm_m_mogu", "魔骨", "土", "魔骨林中最堅硬的一截骸骨,魔氣浸透。"],
        herb: ["zm_h_molian", "血池魔蓮", "生於血池中央的魔蓮,花瓣殷紅如血。"],
      },
      {
        id: "zm_a2",
        name: "魔城",
        stages: [
          { id: "zm_waiguo", name: "魔城外郭", desc: "真魔聖域魔城的外牆,魔卒與魔犬終日巡邏。", monsters: [["zm_shouzu", "魔城守卒", "金", "披黑鐵重甲的魔卒,死後魂魄仍守在城牆上。"], ["zm_yanquan", "魔焰犬", "火", "口吐魔焰的獵犬,嗅得到千里外的仙氣。"]] },
          { id: "zm_wanmo", name: "萬魔窟", desc: "魔城地底的萬魔窟,密密麻麻的洞窟裡都是魔物。", monsters: [["zm_mofu", "萬魔窟魔蝠", "水", "成群出沒的魔蝠,遮天蔽日。"], ["zm_gumo", "窟中古魔", "土", "被封在窟底萬年的古魔,封印已然鬆動。"]] },
          { id: "zm_jitan", name: "天魔祭壇", desc: "魔城中心的祭壇,祭司日夜以活祭召喚天魔。", monsters: [["zm_jisi", "天魔祭司", "火", "以自身精血召喚天魔的祭司,瘋狂而危險。"], ["zm_moxiang", "祭壇魔像", "土", "守護祭壇的石像,被魔血浸透後甦醒。"]] },
        ],
        elite: ["zm_e_dajisi", "天魔大祭司", "火", "主持天魔祭壇的大祭司,半身已化為天魔。"],
        mat: ["zm_m_tianmojing", "天魔晶", "火", "天魔降臨時凝結的魔晶,魔焰在晶中跳動。"],
        herb: ["zm_h_minghua", "魔域冥花", "只在魔城陰影中綻放的冥花,香氣令人沉醉。"],
      },
    ],
    gear: {
      art: ["zm_g_moyan_ren", "血池魔焰刃", "火", "在血池中淬煉百年的魔刃,刃上魔焰永不熄滅。"],
      robe: ["zm_g_mogu_jia", "魔骨戰甲", "以魔骨串成的戰甲,魔氣護體,刀劍難侵。"],
      amulet: ["zm_g_xueyu", "天魔血玉", "天魔大祭司佩戴的血玉,能吸取敵人精血。"],
      tal: ["zm_g_shixin_fu", "萬魔噬心符", "封入萬魔窟魔氣的符籙,中者心神被萬魔啃噬。"],
    },
  },
  {
    zone: "huixian",
    ignoresCounters: true,
    areas: [
      {
        id: "hx_a1",
        name: "灰仙死域",
        existing: ["huixian_jie"],
        stages: [
          { id: "hx_kuji", name: "枯寂荒原", desc: "寸草不生的灰色荒原,連風都帶著死寂。", monsters: [["hx_shashu", "枯寂煞樹", "木", "被煞氣蝕盡生機的枯樹,枝條如鬼爪。"], ["hx_shalang", "荒原煞狼", "金", "煞氣凝形的灰狼,雙眼空洞無神。"]] },
          { id: "hx_shawu", name: "煞霧沼", desc: "煞霧瀰漫的沼澤,踏錯一步便沉入無底泥淖。", monsters: [["hx_dujiao", "煞霧毒蛟", "水", "潛伏在煞霧中的毒蛟,吐息帶著蝕骨煞毒。"], ["hx_shashi", "沼中煞屍", "土", "沉在沼底的屍骸被煞氣喚醒,爬出泥淖。"]] },
        ],
        elite: ["hx_e_shazun", "枯寂煞尊", "煞", "枯寂荒原的主宰,所到之處萬物凋零。"],
        mat: ["hx_m_shawujing", "煞霧晶", "煞", "煞霧凝結而成的灰晶,觸之寒意入骨。"],
        herb: ["hx_h_huijin", "灰燼靈花", "在灰燼中開出的唯一一朵花,蘊含逆死回生之力。"],
      },
      {
        id: "hx_a2",
        name: "冥獄",
        stages: [
          { id: "hx_wailao", name: "冥獄外牢", desc: "關押煞鬼的外牢,鎖鏈聲與哀嚎聲不絕於耳。", monsters: [["hx_yuzu", "冥獄獄卒", "金", "手執鎖魂鏈的獄卒,本身也是煞鬼。"], ["hx_shagui", "鎖魂煞鬼", "煞", "被鎖鏈束縛萬年的煞鬼,怨氣沖天。"]] },
          { id: "hx_fenchang", name: "煞星墳場", desc: "埋葬隕落煞星的墳場,墓火終夜不熄。", monsters: [["hx_shiwang", "墳場煞屍王", "土", "墳場中最古老的屍王,號令萬屍。"], ["hx_muhuo", "墓火煞靈", "火", "墳頭飄盪的墓火凝成的煞靈。"]] },
          { id: "hx_huangling", name: "灰皇陵", desc: "灰皇為自己預備的陵寢,殉葬魔物守在墓道兩側。", monsters: [["hx_lingwei", "陵寢煞衛", "金", "為灰皇守陵的煞衛,永世不得超生。"], ["hx_xunzang", "灰皇殉葬魔", "煞", "與灰皇一同下葬的魔物,早已與陵寢融為一體。"]] },
        ],
        elite: ["hx_e_jimie", "灰皇陵守 · 寂滅", "煞", "灰皇座下最強的守陵者,寂滅之力能令仙人道心崩塌。"],
        mat: ["hx_m_hantie", "冥獄寒鐵", "金", "鑄造冥獄鎖鏈的寒鐵,浸透煞氣。"],
        herb: ["hx_h_shashen", "墓土煞參", "生於煞星墳土中的煞參,形如嬰孩。"],
      },
    ],
    gear: {
      art: ["hx_g_shahun_dao", "寂滅煞魂刀", "煞", "以寂滅之力鍛成的煞刀,刀光過處,生機盡滅。"],
      robe: ["hx_g_sha_kai", "冥獄煞鎧", "以冥獄寒鐵鍛成的重鎧,煞氣自成屏障。"],
      amulet: ["hx_g_xunzang_zhu", "灰皇殉葬珠", "灰皇陵中的殉葬寶珠,蘊藏一縷灰皇的意志。"],
      tal: ["hx_g_miehun_fu", "枯寂滅魂符", "以枯寂煞尊之血繪成的符籙,專滅神魂。"],
    },
  },
  {
    zone: "lunhui",
    areas: [
      {
        id: "lh_a1",
        name: "忘川",
        existing: ["wangchuan"],
        stages: [
          { id: "lh_naihe", name: "奈何橋", desc: "橫跨忘川的奈何橋,過橋者須飲孟婆湯。", monsters: [["lh_guichai", "奈何橋鬼差", "金", "守在橋頭的鬼差,專拿不肯過橋的魂魄。"], ["lh_shuigui", "橋下水鬼", "水", "墜落忘川的魂魄化成的水鬼,伺機拖人下水。"]] },
          { id: "lh_sansheng", name: "三生石畔", desc: "刻著前世今生來世的三生石,石畔遊蕩著前世殘影。", monsters: [["lh_shiling", "三生石靈", "土", "三生石孕育的石靈,能看穿來者的三世因果。"], ["lh_moying", "前世魔影", "火", "前世執念凝成的魔影,化作你最恐懼的模樣。"]] },
        ],
        elite: ["lh_e_mengpo", "孟婆", "水", "熬煮孟婆湯萬年的老嫗,一勺湯水便抹去一生。"],
        mat: ["lh_m_wangchuan", "忘川水晶", "水", "忘川之水凝結的水晶,握在手中會忘記片刻前的事。"],
        herb: ["lh_h_bianhua", "彼岸花", "開在忘川彼岸的花,花葉永不相見。"],
      },
      {
        id: "lh_a2",
        name: "六道",
        existing: ["lunhui_gudao"],
        stages: [
          { id: "lh_chusheng", name: "畜生道口", desc: "通往畜生道的入口,轉生為獸的魂魄在此徘徊。", monsters: [["lh_chuling", "六道畜靈", "木", "即將轉生為獸的魂靈,保有野獸的本能。"], ["lh_yushou", "畜生道獄獸", "土", "看守畜生道的獄獸,鐵蹄踏碎逃魂。"]] },
          { id: "lh_xiuluo", name: "修羅道口", desc: "通往修羅道的入口,殺伐之氣衝天。", monsters: [["lh_zhangui", "修羅戰鬼", "火", "生前好戰的魂魄,在修羅道口永無止境地廝殺。"], ["lh_axiuluo", "阿修羅女", "金", "修羅道的女戰士,美貌與殺性同樣驚人。"]] },
          { id: "lh_egui", name: "餓鬼道口", desc: "通往餓鬼道的入口,飢餓的哀號此起彼落。", monsters: [["lh_egui_qun", "餓鬼群", "土", "永遠飢餓的鬼魂,見到活物便一擁而上。"], ["lh_jiaokou", "焦口鬼", "火", "口吐火焰、咽喉如針的餓鬼,怨念最深。"]] },
        ],
        elite: ["lh_e_zhuanlun", "轉輪王", "金", "執掌六道輪轉的閻君,判定每一個魂魄的去處。"],
        mat: ["lh_m_lunhuishi", "輪迴石", "土", "六道入口的基石碎片,刻著轉生的符文。"],
        herb: ["lh_h_huanhun", "六道還魂草", "生於六道交界的奇草,能將散去的魂魄拉回軀殼。"],
      },
    ],
    gear: {
      art: ["lh_g_panguan_bi", "轉輪判官筆", "金", "轉輪王案前的判官筆,一筆勾銷,魂飛魄散。"],
      robe: ["lh_g_mingsha", "孟婆冥紗", "孟婆以忘川水氣織成的冥紗,敵人看不清你的身形。"],
      amulet: ["lh_g_sansheng", "三生石佩", "以三生石磨成的玉佩,佩之可窺見敵人的下一步。"],
      tal: ["lh_g_yinhun_fu", "彼岸引魂符", "以彼岸花汁繪成的符籙,能將敵人的魂魄引向彼岸。"],
    },
  },
  {
    zone: "zhongtu",
    areas: [
      {
        id: "zt_a1",
        name: "南天門",
        existing: ["nantianmen"],
        stages: [
          { id: "zt_zhentian", name: "鎮天關", desc: "南天門後的第一道雄關,神將與天犬日夜鎮守。", monsters: [["zt_shenjiang", "鎮天神將", "金", "受道祖冊封的神將,一人當關,萬仙莫開。"], ["zt_tianquan", "守關天犬", "火", "道祖座下的天犬,能嗅出擅闖者的氣息。"]] },
          { id: "zt_zhanxian", name: "斬仙台", desc: "天庭處決叛仙之處,台上殺氣千年不散。", monsters: [["zt_zhanxianjiang", "斬仙天將", "金", "專司行刑的天將,斬過的仙人不計其數。"], ["zt_feidao", "斬仙飛刀靈", "金", "斬仙飛刀孕育的器靈,飛刀一出,仙魂俱滅。"]] },
          { id: "zt_lingxiao", name: "凌霄外廷", desc: "凌霄寶殿的外廷,侍衛與雷部天君輪班值守。", monsters: [["zt_shiwei", "凌霄殿侍衛", "土", "凌霄殿的金甲侍衛,身上每一片甲都有道祖加持。"], ["zt_tianjun", "雷部天君", "火", "掌管天雷的天君,一念之間雷霆萬鈞。"]] },
        ],
        elite: ["zt_e_daozu_zhan", "斬仙道祖化身", "金", "天庭一位執掌殺伐的道祖投下的化身,僅一縷神念便足以斬殺金仙。"],
        mat: ["zt_m_xuanjin", "天庭玄金", "金", "鑄造南天門的玄金,被道祖神念溫養萬年。"],
        herb: ["zt_h_xiangui", "天庭仙桂", "南天門外的仙桂,桂香能安定道心。"],
      },
      {
        id: "zt_a2",
        name: "瑤池",
        existing: ["yaochi_xianlin"],
        stages: [
          { id: "zt_pantao", name: "蟠桃園", desc: "九千年一熟的蟠桃園,力士與靈猴爭奪仙桃。", monsters: [["zt_lishi", "蟠桃守園力士", "土", "看守蟠桃園的力士,力能扛山。"], ["zt_linghou", "蟠桃靈猴", "木", "偷吃蟠桃成精的靈猴,身法快如閃電。"]] },
          { id: "zt_shuifu", name: "瑤池水府", desc: "瑤池底下的水府,天河水兵在此操練。", monsters: [["zt_shuijun", "瑤池水君", "水", "掌管瑤池之水的水君,一念掀起天河巨浪。"], ["zt_shuibing", "天河水兵", "水", "天河水軍的精銳,在水中無人能敵。"]] },
        ],
        elite: ["zt_e_daozu_yao", "瑤池道祖化身", "木", "坐鎮瑤池的道祖化身,一枝桃枝便能定人生死。"],
        mat: ["zt_m_taozhi", "蟠桃仙枝", "木", "蟠桃樹上自然折落的仙枝,生機磅礴。"],
        herb: ["zt_h_pantao", "九千年蟠桃", "九千年一熟的蟠桃,食之與天地同壽。"],
      },
      {
        id: "zt_a3",
        name: "光陰長河",
        stages: [
          { id: "zt_dukou", name: "光陰渡口", desc: "光陰長河的渡口,擺渡靈引渡迷失在時間中的人。", monsters: [["zt_baidu", "光陰擺渡靈", "水", "在光陰長河中擺渡的靈體,看不清它的過去與未來。"], ["zt_duchong", "時痕蠹蟲", "土", "啃食時間痕跡的蠹蟲,被咬一口便少去百年光陰。"]] },
          { id: "zt_guoqu", name: "過去之岸", desc: "光陰長河的此岸,停留著無數過去的殘影。", monsters: [["zt_canying", "往昔殘影", "無", "過去某位大能留下的殘影,仍保有生前的神通。"], ["zt_shouling", "古史守陵獸", "土", "守護歷史的巨獸,不容任何人改寫過去。"]] },
          { id: "zt_weilai", name: "未來之岸", desc: "光陰長河的彼岸,未來的可能性在此交錯。", monsters: [["zt_jianying", "未來劍影", "金", "尚未發生的一劍,卻已能斬傷你。"], ["zt_tuiyan", "天機推演傀儡", "火", "能推演未來的傀儡,你的每一招都被它看穿。"]] },
          { id: "zt_shiyuan", name: "時之源", desc: "光陰長河的源頭,時間道祖古或今悟道之處。", monsters: [["zt_shishou", "時之守衛", "無", "守護時間源頭的守衛,存在於每一個時刻。"], ["zt_tunshi", "歲月吞噬者", "水", "以歲月為食的巨獸,所過之處萬物化為塵土。"]] },
        ],
        elite: ["zt_e_daozu_guang", "光陰道祖化身", "無", "古或今座下一位道祖的化身,在光陰長河中來去自如。"],
        mat: ["zt_m_guangyinsha", "光陰砂", "無", "光陰長河的河砂,每一粒都是一段被沖刷掉的時光。"],
        herb: ["zt_h_shihua", "時之花", "只在時之源綻放一瞬的花,服之可令時光倒流片刻。"],
      },
    ],
    gear: {
      art: ["zt_g_feidao", "斬仙飛刀", "金", "斬仙台上的飛刀,道祖親手祭煉,專斬仙人。"],
      robe: ["zt_g_jiulong_pao", "天庭九龍袍", "天庭道祖賜下的九龍仙袍,九龍護體,萬法不侵。"],
      amulet: ["zt_g_shalou", "光陰沙漏", "以光陰砂填滿的沙漏,能讓時間在你身邊流得慢一些。"],
      tal: ["zt_g_duanliu_fu", "時間斷流符", "以時之花汁繪成的符籙,能讓敵人的時間短暫停滯。"],
    },
  },
];

// ═══ 產生器 ═══
const sig3 = (n: number) => {
  if (n < 1000) return Math.round(n);
  const p = Math.pow(10, Math.floor(Math.log10(n)) - 2);
  return Math.round(n / p) * p;
};

export interface XianArea {
  id: string;
  zone: ZoneId;
  name: string;
  locations: string[]; // 依關卡順序(既有秘境在前)
}

export const XIAN_AREAS: XianArea[] = [];
export const XIAN_MONSTERS: Monster[] = [];
export const XIAN_LOCATIONS: Location[] = [];
export const XIAN_ELITE_SPAWNS: Record<string, string> = {};
export const XIAN_ITEMS: ItemDef[] = [];
export const XIAN_RECIPES: Recipe[] = [];
export const RECIPE_ZONE: Record<string, string> = {}; // 配方 id → 所屬仙域(十階器具的煉製時間依仙域推算)
// 既有秘境補上的採集物(world.ts 併入時追加到該秘境的 materials/herbs)
export const XIAN_EXISTING_GATHER: Record<string, { materials: string[]; herbs: string[] }> = {};

for (const spec of SPECS) {
  const base = TIER_BASE[spec.zone];
  const econ = ZONE_ECON[spec.zone];
  const g = ZONE_GEAR_STATS[spec.zone];
  const potion = ZONE_POTION[spec.zone];
  const amuletId = spec.gear.amulet[0];
  const talId = spec.gear.tal[0];
  const artId = spec.gear.art[0];
  const robeId = spec.gear.robe[0];
  const totalStages = spec.areas.reduce((a, ar) => a + ar.stages.length, 0);
  let idx = 0;
  const zoneMats: string[] = [];

  for (const area of spec.areas) {
    const [matId, matName, matEl, matDesc] = area.mat;
    const [herbId, herbName, herbDesc] = area.herb;
    zoneMats.push(matId);
    XIAN_ITEMS.push(
      { id: matId, name: matName, kind: "material", element: matEl, desc: matDesc, price: econ.mat, reqStage: 10 },
      { id: herbId, name: herbName, kind: "herb", desc: herbDesc, price: econ.herb, heal: econ.heal, reqStage: 10 },
    );
    for (const ex of area.existing ?? []) XIAN_EXISTING_GATHER[ex] = { materials: [matId], herbs: [herbId] };

    const areaLocs = [...(area.existing ?? [])];
    let prevMon: string | null = null;
    area.stages.forEach((st, si) => {
      const d = totalStages > 1 ? idx / (totalStages - 1) : 0.5;
      idx++;
      const ids: string[] = [];
      st.monsters.forEach(([id, name, element, desc], mi) => {
        const dd = Math.min(1, d + mi * 0.03);
        const stones = base.stones * (0.7 + 0.6 * dd);
        XIAN_MONSTERS.push({
          id,
          name,
          element,
          hp: sig3(base.hp * (0.6 + 0.9 * dd)),
          atk: sig3(base.atk * (0.85 + 0.35 * dd)),
          exp: sig3(base.exp * (0.7 + 0.6 * dd)),
          stones: [sig3(stones * 0.8), sig3(stones * 1.2)],
          drops: [
            { id: matId, chance: 0.15 },
            { id: herbId, chance: 0.1 },
            { id: potion, chance: 0.04 },
            { id: mi === 0 ? amuletId : talId, chance: 0.008 },
          ],
          desc,
          ...(spec.ignoresCounters ? { ignoresCounters: true } : {}),
        });
        ids.push(id);
      });
      // 每關兩隻新妖獸,再沿用上一關的一隻,關卡之間有延續感
      const monsters = prevMon ? [...ids, prevMon] : ids;
      prevMon = ids[ids.length - 1];
      XIAN_LOCATIONS.push({
        id: st.id,
        name: st.name,
        desc: st.desc,
        region: spec.zone,
        reqStage: 10,
        monsters,
        materials: [matId],
        herbs: [herbId],
        manualChance: 0,
        manuals: [],
      });
      areaLocs.push(st.id);
      // 區域菁英:本區最後一關
      if (area.elite && si === area.stages.length - 1) {
        const [eid, ename, eel, edesc] = area.elite;
        const s = base.stones * (0.7 + 0.6 * d) * 3;
        XIAN_MONSTERS.push({
          id: eid,
          name: ename,
          element: eel,
          elite: true,
          hp: sig3(base.hp * (0.6 + 0.9 * d) * 3.2),
          atk: sig3(base.atk * 1.8),
          exp: sig3(base.exp * (0.7 + 0.6 * d) * 4),
          stones: [sig3(s * 0.8), sig3(s * 1.2)],
          drops: [
            { id: matId, chance: 1 },
            { id: herbId, chance: 0.5 },
            { id: potion, chance: 0.2 },
            { id: amuletId, chance: 0.08 },
            { id: talId, chance: 0.08 },
            { id: artId, chance: 0.04 },
            { id: robeId, chance: 0.04 },
          ],
          desc: edesc,
          ...(spec.ignoresCounters ? { ignoresCounters: true } : {}),
        });
        XIAN_ELITE_SPAWNS[st.id] = eid;
      }
    });
    XIAN_AREAS.push({ id: area.id, zone: spec.zone, name: area.name, locations: areaLocs });
  }

  // 一整套裝備:法器、法衣可煉製(本仙域各區材料),護身符、符籙只能從妖獸/菁英掉落
  const [aId, aName, aEl, aDesc] = spec.gear.art;
  const [rId, rName, rDesc] = spec.gear.robe;
  const [mId, mName, mDesc] = spec.gear.amulet;
  const [tId, tName, tDesc] = spec.gear.tal;
  XIAN_ITEMS.push(
    { id: aId, name: aName, kind: "artifact", element: aEl, desc: aDesc, price: 0, atkBonus: g.art[0], defBonus: g.art[1], reqStage: 10 },
    { id: rId, name: rName, kind: "robe", desc: rDesc, price: 0, atkBonus: g.robe[0] || undefined, defBonus: g.robe[1], reqStage: 10 },
    { id: mId, name: mName, kind: "amulet", desc: mDesc, price: 0, atkBonus: g.amulet[0], defBonus: g.amulet[1], reqStage: 10, dropOnly: true },
    { id: tId, name: tName, kind: "talisman", desc: tDesc, price: 0, atkBonus: g.tal, reqStage: 10, dropOnly: true },
  );
  const m0 = zoneMats[0];
  const m1 = zoneMats[1] ?? zoneMats[0];
  const m2 = zoneMats[2] ?? zoneMats[0];
  XIAN_RECIPES.push(
    { id: `r_${aId}`, result: aId, name: aName, stones: econ.recipe, desc: aDesc, reqStage: 10, materials: [{ id: m1, n: 4 }, { id: m0, n: 3 }] },
    {
      id: `r_${rId}`,
      result: rId,
      name: rName,
      stones: econ.recipe,
      desc: rDesc,
      reqStage: 10,
      materials: m2 === m1 ? [{ id: m0, n: 4 }, { id: m1, n: 3 }] : [{ id: m2, n: 4 }, { id: m1, n: 3 }],
    },
  );
  RECIPE_ZONE[`r_${aId}`] = spec.zone;
  RECIPE_ZONE[`r_${rId}`] = spec.zone;
}

// 區域所屬仙域與名稱查詢(介面用)
export const areasOfZone = (zone: string) => XIAN_AREAS.filter((a) => a.zone === zone);
export const areaOfLocation = (locId: string) => XIAN_AREAS.find((a) => a.locations.includes(locId));

// ═══ 5.4 版第二批:各仙域加料(材料/仙草/圖譜)、四位道祖與神兵 ═══
// 每個仙域:3 種新材料 + 1 種新仙草(全仙域都採得到,妖獸也會掉),3 張煉器圖譜(研讀後解鎖配方,
// 煉出該仙域的進階裝備),蠻荒/真魔/灰仙/輪迴各一位道祖(各坐鎮一處道場,掉落神兵利器)。
type XMat = [string, string, Element, string];
type XGear = [string, string, "artifact" | "robe" | "talisman", Element | undefined, string];
interface ZoneExtra {
  zone: ZoneId;
  mats: [XMat, XMat, XMat];
  herb: [string, string, string];
  blueprints: [XGear, XGear, XGear]; // 法器、法衣、符籙各一
  daozu?: {
    area: string; // 道場所在區域
    stage: [string, string, string]; // [id, 名稱, 介紹]
    mon: [string, string, Element, string];
    hp: number;
    atk: number;
    ignoresCounters?: boolean;
    treasures: [string, string, "artifact" | "robe" | "amulet" | "talisman", Element | undefined, string, number, number][]; // [id, 名稱, 種類, 五行, 介紹, 攻, 防]
  };
}

const EXTRAS: ZoneExtra[] = [
  {
    zone: "beihan",
    mats: [
      ["bh_x_kunlin", "寒鯤鱗", "水", "北冥寒鯤褪下的鱗片,薄如蟬翼卻刀劍難傷。"],
      ["bh_x_hunyu", "冰魂玉", "水", "封著一縷冰魂的寒玉,入手便覺神魂清明。"],
      ["bh_x_jingtie", "霜凌精鐵", "金", "玄冰下埋藏萬年的精鐵,寒鋒天成。"],
    ],
    herb: ["bh_xh_zishen", "寒潭紫參", "生於寒潭底的紫參,藥力溫和綿長。"],
    blueprints: [
      ["bh_b_kunlin_jian", "北冥鯤鱗劍", "artifact", "水", "以寒鯤鱗層層疊鍛而成的仙劍,劍身流轉北冥寒光。"],
      ["bh_b_hunyu_jia", "冰魂玉甲", "robe", undefined, "以冰魂玉片綴成的寶甲,寒氣自成護罩。"],
      ["bh_b_hanpo_fu", "霜凌寒魄符", "talisman", undefined, "以霜凌精鐵粉調墨繪成,符成之時寒魄四溢。"],
    ],
  },
  {
    zone: "jinyuan",
    mats: [
      ["jy_x_wuling", "金烏翎", "火", "三足金烏脫落的翎羽,餘溫千年不散。"],
      ["jy_x_jinsha", "太陽金砂", "金", "熔金河底沉積的金砂,曬過太陽真火。"],
      ["jy_x_lingyu", "礦脈靈玉", "土", "金源礦脈深處孕育的靈玉,溫潤厚重。"],
    ],
    herb: ["jy_xh_jinzhi", "金芝", "生於金礦之上的靈芝,傘面如鍍金箔。"],
    blueprints: [
      ["jy_b_jinwu_gong", "太陽金烏弓", "artifact", "火", "以金烏翎為弦、太陽金砂為身的神弓,箭出如日墜。"],
      ["jy_b_lingyu_kai", "礦脈靈玉鎧", "robe", undefined, "以礦脈靈玉雕成的重鎧,厚重如山。"],
      ["jy_b_fenshi_fu", "金砂焚世符", "talisman", undefined, "以太陽金砂繪成的符籙,焚之如烈日當空。"],
    ],
  },
  {
    zone: "manhuang",
    mats: [
      ["mh_x_qiongqigu", "窮奇骨", "金", "上古凶獸窮奇的骸骨,凶戾之氣猶存。"],
      ["mh_x_xijiao", "巨犀角", "土", "裂山犀的獨角,堅不可摧。"],
      ["mh_x_tengxin", "古林藤心", "木", "古木巨林中萬年古藤的藤心,韌如龍筋。"],
    ],
    herb: ["mh_xh_xueshen", "洪荒血參", "以洪荒巨獸之血滋養的血參,藥力霸道。"],
    blueprints: [
      ["mh_b_qiongqi_ren", "窮奇骨刃", "artifact", "金", "以窮奇骨磨成的短刃,刃上凶氣噬主亦噬敵。"],
      ["mh_b_xi_kai", "巨犀戰鎧", "robe", undefined, "以巨犀角與古林藤心編成的戰鎧,衝鋒時無人能擋。"],
      ["mh_b_xueji_fu", "洪荒血祭符", "talisman", undefined, "以洪荒血參汁繪成的血符,焚之獸吼震天。"],
    ],
    daozu: {
      area: "mh_a3",
      stage: ["mh_daochang", "盤岳道場", "力之道祖盤岳開闢的道場,群山皆是祂隨手堆起的石塊。"],
      mon: ["daozu_panyue", "力之道祖 · 盤岳", "土", "以肉身證道的力之道祖,一拳可碎一界,蠻荒萬族皆奉為始祖。"],
      hp: 20_000_000_000,
      atk: 1_000_000, // 每回合攻擊兩次(見 engine.ts PANYUE_ATTACKS)
      treasures: [
        ["dz_kaitian_fu", "開天巨斧", "artifact", "土", "盤岳道祖開闢蠻荒時所用的巨斧,斧刃上還沾著混沌初開時的塵埃。", 560_000, 120_000],
        ["dz_shanhe_yin", "盤岳山河印", "amulet", "土", "封存整片蠻荒山河的道祖印璽,佩之如身負萬嶽。", 150_000, 150_000],
      ],
    },
  },
  {
    zone: "zhenmo",
    mats: [
      ["zm_x_jinghe", "魔焰晶核", "火", "天魔體內凝結的晶核,魔焰在其中翻騰。"],
      ["zm_x_xuesha", "血神砂", "水", "血池底沉澱的砂礫,吸飽了萬魔之血。"],
      ["zm_x_wengang", "魔紋鋼", "金", "魔城鍛造坊以魔血淬火的鋼材,表面浮現魔紋。"],
    ],
    herb: ["zm_xh_dugu", "魔淵毒菇", "生於真魔淵壁的毒菇,以毒攻毒可療重傷。"],
    blueprints: [
      ["zm_b_xueshen_qiang", "血神魔槍", "artifact", "火", "以血神砂淬鍊的魔槍,槍出必飲血而歸。"],
      ["zm_b_wen_jia", "魔紋重甲", "robe", undefined, "以魔紋鋼鍛成的重甲,魔紋會吞噬來襲的仙力。"],
      ["zm_b_fenxin_fu", "魔焰焚心符", "talisman", undefined, "封入魔焰晶核之力的符籙,專焚敵人道心。"],
    ],
    daozu: {
      area: "zm_a2",
      stage: ["zm_daochang", "魔羅道場", "真魔道祖魔羅的道場,萬魔朝拜之地,天空終年血紅。"],
      mon: ["daozu_moluo", "真魔道祖 · 魔羅", "火", "真魔界的開創者,以殺證道,傳說仙界一半的劫難都出自祂的手筆。"],
      hp: 14_000_000_000,
      atk: 2_200_000,
      treasures: [
        ["dz_tianmo_ren", "魔羅天魔刃", "artifact", "火", "魔羅道祖的本命魔刃,刃下亡魂化作刃上魔焰。", 620_000, 60_000],
        ["dz_xueshen_pao", "魔羅血神袍", "robe", undefined, "以萬魔精血染成的道袍,穿上它的人不死不滅。", 80_000, 220_000],
      ],
    },
  },
  {
    zone: "huixian",
    mats: [
      ["hx_x_huijin", "寂滅灰燼", "煞", "萬物寂滅後殘留的灰燼,觸之生機流逝。"],
      ["hx_x_hunyu", "煞魂玉", "煞", "封著煞魂的灰玉,夜裡會傳出低語。"],
      ["hx_x_lingshi", "灰皇陵石", "土", "灰皇陵的基石碎片,浸透萬年煞氣。"],
    ],
    herb: ["hx_xh_lingzhi", "枯骨靈芝", "生於枯骨之上的灰色靈芝,死中求生之藥。"],
    blueprints: [
      ["hx_b_huijin_ren", "寂滅灰燼刃", "artifact", "煞", "以寂滅灰燼凝成的刀刃,揮過之處萬物歸灰。"],
      ["hx_b_hunyu_jia", "煞魂玉甲", "robe", undefined, "以煞魂玉綴成的寶甲,煞魂替主人承受傷害。"],
      ["hx_b_lingzhou_fu", "灰皇陵咒符", "talisman", undefined, "以灰皇陵石粉繪成的咒符,帶著灰皇的詛咒。"],
    ],
    daozu: {
      area: "hx_a2",
      stage: ["hx_daochang", "歸墟道場", "死寂道祖歸墟的道場,一切光與聲在此消散。"],
      mon: ["daozu_guixu", "死寂道祖 · 歸墟", "煞", "灰界真正的主人,連灰皇也只是祂座前的守陵人。祂所在之處,五行皆歸於虛無。"],
      hp: 16_000_000_000,
      atk: 2_400_000,
      ignoresCounters: true,
      treasures: [
        ["dz_guixu_qiang", "歸墟寂滅槍", "artifact", "煞", "歸墟道祖的長槍,槍尖所指,萬物歸墟。", 650_000, 80_000],
        ["dz_shayuan_fu", "歸墟煞源符", "talisman", undefined, "灰界煞氣的源頭封在這張符中,焚之天地同寂。", 300_000, 0],
      ],
    },
  },
  {
    zone: "lunhui",
    mats: [
      ["lh_x_tangzha", "孟婆湯渣", "水", "孟婆熬湯剩下的湯渣,仍帶著忘卻之力。"],
      ["lh_x_mo", "判官墨", "木", "判官批閱生死簿所用的墨,一滴可定一魂去處。"],
      ["lh_x_lunpian", "六道輪片", "金", "六道輪盤崩落的碎片,刻著轉生的軌跡。"],
    ],
    herb: ["lh_xh_wangsheng", "往生蓮", "開在輪迴古道旁的白蓮,能引魂往生。"],
    blueprints: [
      ["lh_b_gouhun_suo", "判官勾魂鎖", "artifact", "金", "以六道輪片鍛成的鎖鏈,勾魂攝魄。"],
      ["lh_b_liudao_pao", "輪迴六道袍", "robe", undefined, "繡著六道輪迴圖的法袍,傷勢會流轉到其他五道。"],
      ["lh_b_wangyou_fu", "孟婆忘憂符", "talisman", undefined, "以孟婆湯渣調墨繪成,中者忘卻自己的神通。"],
    ],
    daozu: {
      area: "lh_a2",
      stage: ["lh_daochang", "往生道場", "輪迴道祖往生的道場,六道輪盤在此緩緩轉動。"],
      mon: ["daozu_wangsheng", "輪迴道祖 · 往生", "無", "執掌輪迴的道祖,輪迴殿真正的主人。每殺一人,便看盡那人的千世輪迴。"],
      hp: 15_000_000_000,
      atk: 2_000_000,
      treasures: [
        ["dz_lunhui_jing", "往生輪迴鏡", "artifact", undefined, "照見前世今生的道祖寶鏡,鏡光所照,敵人的修為倒退一世。", 520_000, 180_000],
        ["dz_liudao_zhu", "往生六道珠", "amulet", undefined, "六顆串起的輪迴珠,每一顆都是一道輪迴。", 180_000, 160_000],
      ],
    },
  },
  {
    zone: "zhongtu",
    mats: [
      ["zt_x_shennian", "道祖神念晶", "無", "道祖神念凝結的晶體,握在手中彷彿有人在耳邊講道。"],
      ["zt_x_xingsha", "天河星砂", "水", "天河中流淌的星砂,每一粒都是一顆墜落的星辰。"],
      ["zt_x_jinwa", "南天門金瓦", "金", "南天門檐上的金瓦,被道祖神念溫養萬年。"],
    ],
    herb: ["zt_xh_taoye", "王母仙桃葉", "蟠桃樹上的仙葉,泡水飲之百病不侵。"],
    blueprints: [
      ["zt_b_jinque_jian", "南天門金闕劍", "artifact", "金", "以南天門金瓦熔鑄的仙劍,劍光如天門洞開。"],
      ["zt_b_xing_pao", "天河星袍", "robe", undefined, "以天河星砂織成的星袍,身披滿天星辰。"],
      ["zt_b_shennian_fu", "道祖神念符", "talisman", undefined, "封入道祖神念的符籙,焚之如道祖親臨。煉製需另耗太乙精魂一枚,與玄天仙器同列神器。"],
    ],
  },
];

// 古或今(中土地域王)也補上一件神兵,與四位道祖並列
export const GUHUOJIN_TREASURE: ItemDef = {
  id: "dz_guangyin_jian",
  name: "光陰斬道劍",
  kind: "artifact",
  desc: "時間道祖古或今的佩劍,一劍斬下,過去現在未來同時斷絕。",
  price: 0,
  atkBonus: 700_000,
  defBonus: 100_000,
  reqStage: 10,
  dropOnly: true,
};
XIAN_ITEMS.push(GUHUOJIN_TREASURE);

// 依仙域整理的加料掉落(world.ts 併入時套用到該仙域的所有妖獸,含既有的)
export interface ZoneDropBonus {
  normal: { id: string; chance: number }[];
  boss: { id: string; chance: number }[]; // 地域王 / 菁英
}
export const XIAN_ZONE_DROPS: Record<string, ZoneDropBonus> = {};
export const XIAN_ZONE_GATHER: Record<string, { materials: string[]; herbs: string[] }> = {}; // 仙域 → 全區都採得到的材料/仙草

for (const ex of EXTRAS) {
  const econ = ZONE_ECON[ex.zone];
  const g = ZONE_GEAR_STATS[ex.zone];
  const areaMats = XIAN_AREAS.filter((a) => a.zone === ex.zone).map((a) => {
    const spec = SPECS.find((sp) => sp.zone === ex.zone)!.areas.find((ar) => ar.id === a.id)!;
    return spec.mat[0];
  });
  for (const [id, name, el, desc] of ex.mats) {
    XIAN_ITEMS.push({ id, name, kind: "material", element: el, desc, price: Math.round(econ.mat * 1.5), reqStage: 10 });
  }
  const [hid, hname, hdesc] = ex.herb;
  XIAN_ITEMS.push({ id: hid, name: hname, kind: "herb", desc: hdesc, price: econ.herb, heal: Math.round(econ.heal * 1.2), reqStage: 10 });
  XIAN_ZONE_GATHER[ex.zone] = { materials: ex.mats.map((m) => m[0]), herbs: [hid] };

  // 圖譜裝備:比該仙域的基本套裝強約兩成,只能研讀圖譜後煉製
  const [x1, x2, x3] = ex.mats.map((m) => m[0]);
  const blueprintIds: string[] = [];
  ex.blueprints.forEach(([id, name, kind, el, desc], i) => {
    const stats =
      kind === "artifact"
        ? { atkBonus: Math.round(g.art[0] * 1.2), defBonus: Math.round(g.art[1] * 1.2) }
        : kind === "robe"
          ? { atkBonus: Math.round(Math.max(g.robe[0], g.art[0] * 0.1) * 1.2), defBonus: Math.round(g.robe[1] * 1.2) }
          : { atkBonus: Math.round(g.tal * 1.25) };
    XIAN_ITEMS.push({ id, name, kind, element: el, desc, price: 0, reqStage: 10, dropOnly: true, ...stats });
    const recipeId = `r_${id}`;
    const mats =
      i === 0
        ? [{ id: x1, n: 4 }, { id: x3, n: 3 }, { id: areaMats[0], n: 2 }]
        : i === 1
          ? [{ id: x2, n: 4 }, { id: x1, n: 2 }, { id: areaMats[1] ?? areaMats[0], n: 2 }]
          : [{ id: x3, n: 3 }, { id: x2, n: 2 }, { id: areaMats[areaMats.length - 1], n: 2 }];
    // 道祖神念符(神器):另需太乙精魂一枚
    const taiyiSoul = id === "zt_b_shennian_fu" ? true : undefined;
    XIAN_RECIPES.push({ id: recipeId, result: id, name, stones: Math.round(econ.recipe * 1.5), desc, reqStage: 10, dropOnly: true, materials: mats, taiyiSoul });
    RECIPE_ZONE[recipeId] = ex.zone;
    const bpId = `bp_${id}`;
    blueprintIds.push(bpId);
    XIAN_ITEMS.push({ id: bpId, name: `《${name}》圖譜`, kind: "recipe", desc: `記載${name}煉製之法的圖譜,研讀後可於煉器堂煉製。`, price: 0, unlocksRecipe: recipeId, dropOnly: true, reqStage: 10 });
  });

  XIAN_ZONE_DROPS[ex.zone] = {
    normal: [...ex.mats.map((m) => ({ id: m[0], chance: 0.08 })), { id: hid, chance: 0.06 }, ...blueprintIds.map((id) => ({ id, chance: 0.004 }))],
    boss: [...ex.mats.map((m) => ({ id: m[0], chance: 0.35 })), { id: hid, chance: 0.3 }, ...blueprintIds.map((id) => ({ id, chance: 0.05 }))],
  };

  // 道祖:道場只有道祖一位,狩獵必定與祂交手
  if (ex.daozu) {
    const dz = ex.daozu;
    const [sid, sname, sdesc] = dz.stage;
    const [mid, mname, mel, mdesc] = dz.mon;
    for (const [tid, tname, tkind, tel, tdesc, tatk, tdef] of dz.treasures) {
      XIAN_ITEMS.push({ id: tid, name: tname, kind: tkind, element: tel, desc: tdesc, price: 0, atkBonus: tatk || undefined, defBonus: tdef || undefined, reqStage: 10, dropOnly: true });
    }
    XIAN_MONSTERS.push({
      id: mid,
      name: mname,
      element: mel,
      isLord: true,
      hp: dz.hp,
      atk: dz.atk,
      exp: 50_000_000,
      stones: [100_000_000, 200_000_000],
      drops: [
        ...dz.treasures.map((t) => ({ id: t[0], chance: 0.1 })),
        { id: "jinhundan", chance: 0.2 },
        { id: "zengyuandan", chance: 0.2 },
        { id: "xiantian_zaohuadan", chance: 0.05 },
        ...ex.mats.map((m) => ({ id: m[0], chance: 1 })),
        ...blueprintIds.map((id) => ({ id, chance: 0.3 })),
      ],
      desc: mdesc,
      ...(dz.ignoresCounters ? { ignoresCounters: true } : {}),
    });
    XIAN_LOCATIONS.push({
      id: sid,
      name: sname,
      desc: sdesc,
      region: ex.zone,
      reqStage: 10,
      monsters: [mid],
      materials: [...ex.mats.map((m) => m[0])],
      herbs: [hid],
      manualChance: 0,
      manuals: [],
    });
    XIAN_AREAS.find((a) => a.id === dz.area)!.locations.push(sid);
  }
}
