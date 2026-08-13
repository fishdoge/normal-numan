// 大陸地圖(區域/秘境)與煉器配方英文翻譯對照表(1.21 版新增)。
// 配方(RECIPES)的 name 與對應物品同名,直接沿用 itemText.ts 的翻譯,此處只收錄 desc。
import { Language } from "./dict";

export const REGION_TEXT_EN: Record<string, { name: string; desc: string }> = {
  tiannan: { name: "Tiannan · Yue Kingdom", desc: "A small cultivation kingdom jointly ruled by seven sects, the starting point of Han Li's path to immortality." },
  jindi: { name: "Blood-Colored Forbidden Land", desc: "An ancient forbidden ground that opens once every five hundred years, filled with fortune — and with bones." },
  luanxinghai: { name: "Chaotic Star Sea", desc: "A vast ocean scattered with ten thousand islands, demon cultivators and mortal cultivators alike, with the Star Palace rising from its heart." },
  dajin: { name: "Great Jin Dynasty", desc: "The largest cultivation nation in the mortal realm, where Buddhist, Daoist, and demonic sects stand in three-way rivalry, full of hidden talent." },
  lingjie: { name: "Spirit Realm", desc: "The final realm before ascension, true spirits everywhere, the Heavenly Tribulation looming overhead." },
  beihan: { name: "North Frost Immortal Realm", desc: "A far-northern immortal realm only ascended true immortals may set foot in; beneath ten-thousand-year mystic ice, innate immortal artifacts and celestial fortune lie dormant." },
  jinyuan: { name: "Golden-Source Immortal Realm", desc: "A primordial immortal realm glimpsed only by wandering deep into hidden realms; Golden-Source energy soars skyward, five immortal passes stand in succession, its beasts far stronger than North Frost's." },
  manhuang: { name: "Wildlands", desc: "A primordial hidden realm opened by the resonance of the five elemental Strange Star Discs; its beasts attack weakly but possess unmatched vitality, each of the four domains ruled by its own regional lord." },
};

export const LOCATION_TEXT_EN: Record<string, { name: string; desc: string }> = {
  caiyaoshan: { name: "Rainbow Cloud Mountain", desc: "An outer spirit mountain of Yellow Maple Valley, wreathed in cloud and mist, where low-level disciples gather herbs and hone their skills." },
  heifengling: { name: "Black Wind Ridge", desc: "A beast-infested wild ridge where black winds never cease; many cultivators have fallen here." },
  hantan: { name: "Ten-Thousand-Year Frost Pool", desc: "A bottomless frozen pool hiding Frost Jade Essence at its depths, and Frost-Water Pythons coiled within." },
  yanhuogu: { name: "Flame Valley", desc: "A valley where earth-fire surges, nest of the Crimson-Flame Fire Python, a natural source of flame coveted by artificers." },
  leizhulin: { name: "Thunderclap Bamboo Grove", desc: "A strange bamboo grove struck by thunder year-round, the sole source of Golden Thunderbamboo, exceedingly dangerous." },
  xuesehe: { name: "Blood-Colored River Valley", desc: "A crimson ravine where blood-colored water flows, home to Blood Flood Dragons; the riverbed holds storage pouches of countless who dared the Forbidden Land." },
  jinshoushan: { name: "Forbidden Beast Mountain Ancient Cave", desc: "An ancient cave deep within the Forbidden Land, resting place of a beast king, hiding supreme fortune." },
  waihaidao: { name: "Outer Sea Archipelago", desc: "Countless small islands scattered around the Chaotic Star Sea's edge, sea beasts roam freely, spirit herbs go ungathered." },
  xinggong: { name: "Star Palace Ruins", desc: "The abandoned outer estate of the Star Palace, ruler of the Chaotic Star Sea; puppet war-guards still patrol, its treasury yet unopened." },
  moyuan: { name: "Demon Abyss", desc: "A bottomless abyss in Great Jin's northern frontier, demonic energy soaring skyward, demonized cultivators lingering at its mouth." },
  yinjieliexi: { name: "Underworld Rift", desc: "A crack between the yin and yang realms, ghost-qi surging like tides. The Ghost Mother holds court here — even peak Void Refinement cultivators dare not approach." },
  tianyuancheng: { name: "Outskirts of Heaven Abyss City", desc: "The wilderness beyond the Spirit Realm's foremost human city, patrolled day and night by True Spirit Guards." },
  feishengtai: { name: "Ascension Platform", desc: "The legendary place said to connect with the immortal realms. The Heavenly Tribulation Thunder Spirit dwells here — cross it, and the mortal shell becomes sacred, ascending in broad daylight." },
  xuanbing_yuan: { name: "Mystic Ice Immortal Plain", desc: "A boundless snow plain of ten-thousand-year mystic ice, immortal beasts roam, innate qi hangs thick in the air. Only true immortals may linger long." },
  beihan_dian: { name: "North Frost Immortal Hall", desc: "The deepest, towering ice hall of the immortal realm, where the North Frost Immortal Venerable sits enthroned, innate immortal artifacts suspended in the nine heavens above." },
  jy_guan1: { name: "Golden-Source Immortal Pass · First", desc: "The first immortal pass of the Golden-Source Immortal Realm, the Canglan Golden Python coiled before it, golden light dazzling." },
  jy_guan2: { name: "Golden-Source Immortal Pass · Second", desc: "The second immortal pass, guarded by the primordial Heaven-Mixing Spirit Ape, its strength shaking immortal mountains." },
  jy_guan3: { name: "Golden-Source Immortal Pass · Third", desc: "The third immortal pass, ablaze with eight-wilds infernal fire, the Fire Qilin coiled within." },
  jy_guan4: { name: "Golden-Source Immortal Pass · Fourth", desc: "The fourth immortal pass, its heaven-net woven of boundless golden thread, the Golden Spider hidden within." },
  jy_guan5: { name: "Golden-Source Immortal Pass · Fifth", desc: "The deepest, fifth immortal pass of the Golden-Source Immortal Realm, where the Golden-Source Immortal Emperor sits enthroned, gazing down upon eternity, two guardian envoys patrolling at its sides." },
  manhuang_tianhu: { name: "Heaven Fox Domain", desc: "A wilderness swept with crimson flame, fox-shadows darting between, the Heaven Fox presiding over this land." },
  manhuang_zhenlong: { name: "True Dragon Domain", desc: "A dragon-vein land wreathed in cloud and mist, hornless dragons patrolling in guard, the True Dragon coiled within." },
  manhuang_baxia: { name: "Baxia's Domain", desc: "A hilly wasteland strewn with boulders, spirit turtles moving slowly across it, Baxia bearing this land upon its back." },
  manhuang_pixiu: { name: "Pixiu Domain", desc: "A treasure-rich wilderness thick with spirit energy, pixiu cubs foraging in herds, the Black-Eyed Pixiu presiding over this land." },
};

export const RECIPE_DESC_EN: Record<string, string> = {
  r_qingsuo: "Millennium wood-heart as its core, refined iron as its blade.",
  r_jinjian: "Five pieces of refined iron hammered repeatedly, tempered to a keen edge with a beast core.",
  r_hanbingzhui: "Frost Jade Essence given form, Yin-Ill energy anchoring its spirit.",
  r_huolingqi: "Fire python scales woven into a banner, guided by a beast core.",
  r_hutudun: "Warm Jade at its heart, rimmed with refined iron.",
  r_wuguangyi: "Three strands of Yin-Ill energy tempered into soft armor, dark light warding the body.",
  r_qingzhufengjian: "Golden Thunderbamboo as the life-bound sword's core, aided by Frost Jade Essence and a beast core — forged into a peerless flying sword that splits into many.",
  r_jinganghu: "Flood dragon reverse-scales set with Mystic Heaven Frost Iron, impervious to water or fire.",
  r_dagengjian: "Seventy-two Starfall Steel ingots forged into seventy-two small swords, commanded by the sword array diagram.",
  r_fengleichi: "Sky Mist Demon Bird plume-scales as its frame, a demonic crystal as its core — a flash of thunder-light carries a hundred leagues.",
  r_sanyanshan: "Three colors of fire-bird plumes united, its ribs forged from Starfall Steel.",
  r_yuancishan: "A demonic crystal nurtured for a hundred days with Sovereign Heaven Marrow, condensing Origin Magnetism power into a mountain.",
  r_zhenlongyin: "A seal carved from true dragon essence-bone, consecrated with Sovereign Heaven Marrow — a supreme Spirit Realm treasure, relied upon through the Tribulation.",
  r_fu_xuanyin: "Guided by a demonic crystal, Yin-Ill energy condensed into a talisman — an offensive talisman for Mahayana cultivators.",
  r_fu_taixu: "An immortal talisman guided by true dragon essence-bone and Sovereign Heaven Marrow, forgeable only by true immortals.",
  r_jinyuan_ji: "A god-slaying halberd hammered repeatedly from Taiyi Refined Gold, infused throughout with Golden-Source power.",
  r_taixu_hunyuanjia: "Heavy protective armor tempered from Golden-Source Spirit Sand, warded by every technique.",
  r_jinyuan_hujing: "A treasured mirror ground from Golden-Source Spirit Sand, reflecting all techniques and warding off misfortune.",
  r_zhuxian_fu: "A slaughter talisman guided by and condensed from Taiyi Refined Gold — one talisman slays immortals and souls alike.",
  r_zaohua_jian: "A sword of creation co-forged from Golden-Source Spirit Sand and Taiyi Refined Gold, unmatched when drawn.",
};

export function regionDisplayName(r: { id: string; name: string }, lang: Language): string {
  if (lang !== "en") return r.name;
  return REGION_TEXT_EN[r.id]?.name ?? r.name;
}
export function regionDisplayDesc(r: { id: string; desc: string }, lang: Language): string {
  if (lang !== "en") return r.desc;
  return REGION_TEXT_EN[r.id]?.desc ?? r.desc;
}
export function locationDisplayName(l: { id: string; name: string }, lang: Language): string {
  if (lang !== "en") return l.name;
  return LOCATION_TEXT_EN[l.id]?.name ?? l.name;
}
export function locationDisplayDesc(l: { id: string; desc: string }, lang: Language): string {
  if (lang !== "en") return l.desc;
  return LOCATION_TEXT_EN[l.id]?.desc ?? l.desc;
}
export function recipeDisplayDesc(r: { id: string; desc: string }, lang: Language): string {
  if (lang !== "en") return r.desc;
  return RECIPE_DESC_EN[r.id] ?? r.desc;
}
