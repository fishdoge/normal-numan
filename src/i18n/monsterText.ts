// 妖獸英文翻譯對照表(1.21 版新增)——僅收錄英文,中文以 world.ts 本身為準。
import { Language } from "./dict";

export const MONSTER_TEXT_EN: Record<string, { name: string; desc: string }> = {
  // ── 天南 ──
  shulang: { name: "Red-Eyed Rat Wolf", desc: "The lowest Tier-1 beast, red-eyed and pack-hunting." },
  qinglang: { name: "Blue-Back Wolf", desc: "A wolf-type beast with a blue-furred back, swift and agile." },
  tiejiachong: { name: "Iron-Shell Beetle Swarm", desc: "A swarm of beetles with shells hard as iron, resistant to ordinary techniques." },
  hanshuimang: { name: "Frost-Water Python", desc: "A giant python lurking in frozen pools, its breath turns to ice." },
  huomang: { name: "Crimson-Flame Fire Python", desc: "A fire python wreathed in burning scarlet scales, the finest Tier-1 beast." },
  shiyan: { name: "Stone Golem", desc: "A stone puppet left by ancient cultivators, immensely powerful." },
  yinhun: { name: "Old Yin Ghost", desc: "A vengeful ghost dwelling deep in caves, resentment soaring to the sky, fears fire, weak to metal." },
  leizhujing: { name: "Golden Thunderbamboo Spirit", desc: "Golden Thunderbamboo that absorbed lightning and became sentient, crackling with electric light all over." },
  cuiyunyan: { name: "Jade-Cloud Swallow", desc: "A spirit swallow with jade-green wings, skimming the ground like wind, hard to catch." },
  duyanchan: { name: "Venom-Eye Toad", desc: "A one-eyed giant toad that spits poison mist, lurking in marshy shadows." },
  huoyanju: { name: "Fire-Mane Rhino", desc: "A giant rhino with an ever-burning mane, one charge splits stone and cracks mountains." },
  // ── 血色禁地 ──
  xuejiao: { name: "Blood Flood Dragon", desc: "A blood-colored flood dragon that longed to become a true dragon but never did, coiling in the Forbidden Land's river of blood." },
  shengui: { name: "Forbidden Land Stone Turtle", desc: "A giant turtle bearing half a mountain on its back, its shell carved with ancient runes." },
  guhuolao: { name: "Ancient Cave Tree Demon", desc: "A beast king that has dwelt in the Forbidden Land for ten thousand years, radiating Core Formation-peak pressure." },
  xuewuzhu: { name: "Blood-Mist Spider", desc: "A giant spider spinning blood-colored webs; prey caught in the net turns to blood in an instant." },
  kulouwang: { name: "Bone Demon General", desc: "A demon general condensed from the Forbidden Land's dry bones, wielding a bone spear impervious to blade or sword." },
  chihuoya: { name: "Crimson Fire Crow Swarm", desc: "A sky-blotting swarm of fire crows, leaving scorched forests wherever they pass." },
  // ── 亂星海 ──
  haimujing: { name: "Sea-Mother Leviathan", desc: "A giant whale that breathes the tides, an entire coral island living parasitically on its back." },
  xingchenguai: { name: "Meteor Puppet", desc: "A war-puppet driven by a meteor's core, built by the Star Palace, golden light piercing the eyes." },
  wangtianhou: { name: "Sky-Roaring Beast", desc: "A descendant of an ancient fierce beast, its roar to the heavens can split the sea-clouds." },
  canghaijiao: { name: "Azure Sea Flood Dragon", desc: "A flood dragon of the Chaotic Star Sea's depths, stirring thousand-foot waves that swallow ships and split islands." },
  jinyuxie: { name: "Golden-Plume Scorpion King", desc: "A giant scorpion clad in golden plumed armor, its tail-stinger can pierce artifacts in one strike." },
  youmingzhang: { name: "Netherworld Octopus", desc: "A colossal octopus crawling from a mile-deep sea trench, tentacles entwining the stars." },
  // ── 大晉 ──
  mohua: { name: "Demonized Cultivator", desc: "A Void Refinement cultivator consumed by demonic cultivation, mind gone, savagery boundless." },
  tianlanyao: { name: "Sky Mist Demon Bird", desc: "Wind and fire wings blotting out the sky, the totem beast of Great Jin's demon clans." },
  guimu: { name: "Ghost Mother", desc: "A being that crawled out from a crack in the underworld, worshipped by countless ghosts — peak Void Refinement." },
  moxuejun: { name: "Demon Blood Venerable", desc: "A Void Refinement demonic cultivator tempered in demon blood, his body armored in blood-qi, strength enough to shake mountains." },
  wuxinbagua: { name: "Heartless Tyrant Tiger", desc: "An ancient fierce tiger of Great Jin's northern wilds, eyes vacant, knowing only slaughter." },
  youmingfan: { name: "Netherworld Sanskrit Monk", desc: "A Buddhist high monk fallen to the demonic path, chanting hellish Sanskrit that seizes the soul." },
  // ── 靈界 ──
  zhenlingwei: { name: "True Spirit Guard", desc: "A puppet war-guard of the Spirit Realm's Heaven Abyss City, driven by true spirit bloodline." },
  gulong: { name: "Ancient True Dragon Remnant Soul", desc: "The undying remnant soul of a fallen ancient true dragon; one dragon roar overturns ten thousand leagues of cloud-sea." },
  tianjie: { name: "Heavenly Tribulation Thunder Spirit", desc: "A thunder spirit born within the Heavenly Tribulation itself — cross it, and the gate to ascension opens." },
  hunyuanshou: { name: "Primordial Fiend Beast", desc: "A primordial giant beast surviving from the Spirit Realm's chaos, each step shaking mountains and rivers." },
  jiutianfeng: { name: "Nine Heavens Mystic Phoenix", desc: "A mystic-colored divine phoenix bathed in the fire of nine heavens, undying through rebirth." },
  taixureng: { name: "Void Human Immortal", desc: "An ancient human immortal wandering the Spirit Realm's edge, refusing ascension, its cultivation unfathomably deep." },
  // ── 地域王 ──
  lord_tiannan: { name: "Azure-Origin Python King", desc: "The king of pythons that has dominated Tiannan for a thousand years, eyes like lanterns, scales tinged blue — ordinary cultivators break out in cold sweat at the sight." },
  lord_jindi: { name: "Blood-Prison Demon Lord", desc: "A demon reborn from dry bones deep within the Forbidden Land, wreathed in blood-flame; nothing grows where it treads." },
  lord_luanxinghai: { name: "Ten-Thousand-Scale Sea Emperor", desc: "The true ruler of the Chaotic Star Sea, its scales breathing starlight; a single turn raises tsunami waves." },
  lord_dajin: { name: "Heaven-Devouring Ghost Emperor", desc: "Lord of ten thousand ghosts in the underworld, before whom even the Ghost Mother bows; a single thought can turn all of Great Jin into a ghost realm." },
  lord_lingjie: { name: "Primordial Dragon Ancestor", desc: "The source of every true dragon bloodline in the Spirit Realm; one roar overturns Heaven Abyss City's ten-thousand-league cloud-sea." },
  // ── 北寒仙域 ──
  bh_hanjiao: { name: "Mystic Ice Immortal Flood Dragon", desc: "An immortal flood dragon nurtured in the North Frost Realm's ten-thousand-year frozen pool, crystalline as jade, freezing with a breath — already ranked among immortal beasts." },
  bh_binghun: { name: "Ten-Thousand-Year Ice Soul", desc: "A frost soul condensed over ten thousand years deep within mystic ice; whatever it touches turns to permafrost, even Immortal Power can be frozen." },
  bh_hanpeng: { name: "Extreme-Frost Heaven Roc", desc: "A sky-blotting immortal roc; its wings stir nine-heaven frost winds, one strike freezes ten thousand leagues." },
  bh_xuanwu: { name: "North Mystic Black Tortoise", desc: "A primordial black tortoise bearing an immortal mountain on its back, its shell harder than any artifact, guarding the North Frost Realm." },
  bh_hanlong: { name: "Frost Immortal Dragon", desc: "An immortal dragon covered in frost, its breath freezing a thousand leagues — a guardian beast under the North Frost Immortal Venerable." },
  lord_beihan: { name: "North Frost Immortal Venerable", desc: "The supreme ruler of the North Frost Immortal Realm, its Immortal Power unfathomably deep — said to be an ancient immortal as old as heaven itself. The Celestial Immortal Pill drops only from its fall, and it may bestow supreme techniques." },
  // ── 金源仙域 ──
  jy_taiyimang: { name: "Canglan Golden Python", desc: "The guardian fiend of the Golden-Source Immortal Realm's first pass, scaled in gold, breathing Taiyi golden light." },
  jy_huntianyuan: { name: "Heaven-Mixing Spirit Ape", desc: "The primordial spirit ape of the second pass, its arms shaking immortal mountains, a roar cracking the void." },
  jy_bahuang: { name: "Eight Wilds Fire Qilin", desc: "The fire auspicious beast of the third pass, wreathed in eight-wilds infernal flame, burning through all immortal spirit." },
  jy_wujizhu: { name: "Boundless Golden Spider", desc: "The primordial golden spider of the fourth pass, its boundless golden thread weaving heaven-nets even immortals struggle to escape." },
  jy_suijin: { name: "Golden-Source Immortal Envoy – Suijin", desc: "A guardian immortal envoy of the fifth pass, master of the flow of years; its golden light can suppress an entire era." },
  jy_ruijin: { name: "Golden-Source Immortal Envoy – Ruijin", desc: "A guardian immortal envoy of the fifth pass, its razor-sharp metal qi condensed into a blade that can split mountains." },
  lord_jinyuan: { name: "Golden-Source Immortal Emperor – Ouyang Bai", desc: "The supreme immortal emperor of the Golden-Source Immortal Realm, seated at the fifth pass, its Golden-Source power unrivaled in the immortal court, a single finger suppressing a hundred million leagues of mountains and rivers." },
  // ── 雲遊四海際遇超級大 BOSS ──
  jinxian: { name: "Grand Supreme Golden Immortal · Boundless Dao Lord", desc: "Legend says this Dao Lord transcends even true immortals, ranked among Golden Immortals; a single thought can suppress an entire realm. Rarely encountered while wandering the world — whoever slays it gains supreme fortune." },
  // ── 浮屠塔 ──
  huanxiang_taisui: { name: "Illusory Taisui Celestial Venerable", desc: "An illusory incarnation within the Golden-Source Immortal Realm's Pagoda; every floor is the same being, yet stronger with each ascent — its power doubles floor by floor, without end. Legend says whoever reaches the summit glimpses the true Taisui Celestial Venerable." },
  // ── 蠻荒異界:天狐領地 ──
  chiwei_huyao: { name: "Crimson-Tail Fox Demon", desc: "A common fox spirit of the Heaven Fox's domain, its crimson tail wreathed in flame, elusive but not built for raw power." },
  baimei_huxian: { name: "White-Brow Fox Immortal", desc: "A cultivating fox immortal of the Heaven Fox's domain, white-browed and cunning, ill-suited to close combat." },
  jiuwei_huxiu: { name: "Nine-Tail Spirit Fox", desc: "A deeper-cultivating fox of the Heaven Fox's domain, nine tails just emerging, its spirit energy thick." },
  // ── 真龍領地 ──
  chilong_wei: { name: "Hornless Dragon Guard", desc: "A hornless dragon patrolling the True Dragon's domain, scales harder than mystic iron, far stronger in defense than offense." },
  youlong_shouwei: { name: "Chi Dragon True Spirit", desc: "A newborn dragon of the True Dragon's domain; though not yet grown, its scales and claws already carry draconic majesty." },
  longlin_xizu: { name: "Dragon-Scale Lizard Soldier", desc: "A lizard-form soldier of the True Dragon's domain, clad head to toe in dragon scale, patrolling the dragon veins in formation." },
  // ── 霸下領地 ──
  shiling_gui: { name: "Stone Spirit Turtle", desc: "A spirit turtle of Baxia's domain, encased in stone armor, slow-moving but nearly indestructible." },
  wanshi_kuilei: { name: "Stubborn Stone Vanguard", desc: "A vanguard of Baxia's domain made of solid boulder, slow but astonishingly defensive." },
  guijia_weishi: { name: "Deep Earth Black Tortoise", desc: "An armored guard of Baxia's domain, shell as armor, impervious to blade or spear." },
  // ── 貔貅領地 ──
  chimu_xiuzai: { name: "Red-Eyed Pixiu Cub", desc: "A young pixiu of the black-eyed pixiu's domain, red-eyed and gluttonous for spirit energy, thick-skinned and hardy." },
  jubao_xiushou: { name: "Treasure-Hoarding Pixiu Beast", desc: "A treasure-hungry pixiu beast of the domain, wreathed in golden qi, swallowing any treasure it finds." },
  yinzhua_xiuwei: { name: "Silver-Claw Pixiu Guard", desc: "A guardian pixiu beast of the domain, silver-clawed, protecting the domain's hoarded treasures." },
  // ── 蠻荒四大地域王 ──
  lord_tianhu: { name: "Heaven Fox", desc: "Lord of the Heaven Fox's domain, its movement uncanny — a 30% chance each battle to flicker and dodge an attack entirely." },
  lord_zhenlong: { name: "True Dragon", desc: "Lord of the True Dragon's domain; its dragon blood occasionally rages, a 20% chance to unleash a triple-damage strike." },
  lord_baxia: { name: "Baxia", desc: "Lord of Baxia's domain, one of the Dragon's nine sons, famed for bearing the primordial world — its vitality is extraordinarily tough, forty times that of an ordinary beast." },
  lord_pixiu: { name: "Black-Eyed Pixiu", desc: "Lord of the pixiu domain, its eyes dark and deep; in battle it can lock down an enemy's mana flow, nullifying all techniques — only artifacts remain effective." },
};

export function monsterDisplayName(m: { id: string; name: string }, lang: Language): string {
  if (lang !== "en") return m.name;
  return MONSTER_TEXT_EN[m.id]?.name ?? m.name;
}

export function monsterDisplayDesc(m: { id: string; desc: string }, lang: Language): string {
  if (lang !== "en") return m.desc;
  return MONSTER_TEXT_EN[m.id]?.desc ?? m.desc;
}
