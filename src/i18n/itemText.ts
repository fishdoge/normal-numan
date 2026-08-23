// 物品英文翻譯對照表(1.21 版新增)——僅收錄英文,中文以 items.ts 本身為準。
// 依「基底 id」查詢(品質浮動道具的 "id@113" 會先拆除 @ 後綴)。
import { Language, DictKey } from "./dict";
import { ItemDef, formatStones } from "@/game/types";

export const ITEM_TEXT_EN: Record<string, { name: string; desc: string }> = {
  // ── 材料 ──
  tiekuang: { name: "Refined Iron Ore", desc: "Ordinary iron rarely touched by spirit energy; the basic material for artifact forging." },
  hanjing: { name: "Frost Jade Essence", desc: "Jade essence condensed at the bottom of a ten-thousand-year frozen pool, cold to the touch." },
  jinleizhu: { name: "Golden Thunderbamboo Branch", desc: "Strange bamboo that survives lightning strikes, gold laced with thunder — prime material for flying swords." },
  yaodan: { name: "Beast Core", desc: "The inner core condensed within a Tier-1 beast, holding pure demonic energy." },
  huoyu: { name: "Fire Python Scale", desc: "A scarlet scale shed by a fire python, forever scorching hot." },
  wenyu: { name: "Warm Jade", desc: "Warm jade nurtured deep within the earth's veins, the foundation of top-grade Earth treasures." },
  qingmu: { name: "Millennium Green Wood Heart", desc: "The heart of an ancient tree a thousand years old, rich with dripping wood-spirit energy." },
  yinsha: { name: "Yin-Ill Energy", desc: "Yin energy gathered deep within caverns, sealed inside a jade vial." },
  xingchengang: { name: "Starfall Steel", desc: "Divine steel refined from a meteor's core, a specialty of the Chaotic Star Sea, essential for top-tier artifact forging." },
  xuantiehan: { name: "Mystic Heaven Frost Iron", desc: "Frost iron wrapped in ten-thousand-year mystic ice, weighing over a thousand jun." },
  jiaolin: { name: "Flood Dragon Scale", desc: "A reverse scale shed by a blood flood dragon, harder than refined steel and faintly majestic." },
  mojing: { name: "Demonic Crystal", desc: "A crystal core condensed after a demonic cultivator's fall, thick with demonic energy." },
  fenghuolin: { name: "Wind-Fire Plume Scale", desc: "A plume-scale from the Sky Mist Demon Bird, holding both wind and fire — the base for forging Wind-Thunder Wings." },
  longjinggu: { name: "True Dragon Essence Bone", desc: "A bone remnant from an ancient true dragon; an inch of dragon bone is worth an inch of gold." },
  jinyuan_lingsha: { name: "Golden-Source Spirit Sand", desc: "Spirit sand unique to the Golden-Source Immortal Realm, aglow with golden light — an essential furnace material for top-tier gear." },
  taiyi_jingjin: { name: "Taiyi Refined Gold", desc: "Refined gold smelted deep within the Golden-Source Immortal Realm, its quality far surpassing any mortal ore." },
  xuantian_canpian: { name: "Mystic Heaven Shard", desc: "A shard of an ancient immortal artifact left within the bodies of Wildlands beasts, glowing with mystic light — essential for forging Mystic Heaven artifacts." },
  poshou_jinhow: { name: "Dawnbreak Essence", desc: "The very first drop of essence from the birth of heaven and earth, at the dawn of creation." },

  // ── 仙草 ──
  huanglongcao: { name: "Yellow Dragon Grass", desc: "A common spirit herb, the main ingredient for Yellow Dragon Pills." },
  zhuguo: { name: "Vermilion Fruit", desc: "A spirit fruit that ripens once a century; consuming it boosts cultivation." },
  tianlingguo: { name: "Earth-Spirit Fruit", desc: "A legendary spirit fruit — mortals who eat it may open a spirit root, cultivators gain great progress." },
  zijinhua: { name: "Purple-Gold Blossom", desc: "A rare flower growing on sheer cliffs, usable in pills; restores a small amount of mana." },
  xuelingzhi: { name: "Blood Ganoderma", desc: "A blood-red ganoderma brimming with vitality, can be eaten raw to heal wounds." },
  qiannianlingru: { name: "Millennium Spirit Stalactite", desc: "A stalactite formed over a thousand years; one drop can cleanse marrow and reshape bone." },
  ziyuanhua: { name: "Purple Ape Blossom", desc: "A rare flower of the southern wilds, the main ingredient for Nascent Soul Condensing Pills." },
  longlinguo: { name: "Dragon-Scale Fruit", desc: "A spirit fruit shaped like dragon scales; consuming it hardens the flesh like a flood dragon's." },
  huangjitiansui: { name: "Sovereign Heaven Marrow", desc: "A strand of primordial marrow left over from the opening of heaven and earth; only Deity Transformation and above can bear it." },
  nimetanti: { name: "Ancient Dragon True Blood", desc: "True blood left behind by an ancient dragon clan, granting cultivation to breach the heavens." },

  // ── 延壽極品 ──
  wanshoudan: { name: "Hundred-Longevity Pill", desc: "A longevity elixir refined from a hundred spirit herbs; consuming it extends life by a century." },
  yanshouguo: { name: "Life-Extending Fruit", desc: "A life-extending spirit fruit that ripens once in ten thousand years; grants three hundred years of life, nearly impossible to find." },
  panlongtao: { name: "Coiled-Dragon Peach", desc: "A legendary peach said to have drifted down from the immortal realms, wreathed in dragon patterns; grants a thousand years of life." },
  panlongtaoshu: { name: "Mystic-Fate Fruit", desc: "Defies fate itself, extending the wellspring of life without limit." },

  // ── 領主獎勵 ──
  zengyuandan: { name: "Origin-Boosting Pill", desc: "An elixir refined from a Regional Lord's inner core; consuming it strengthens one's origin — a blessing of heaven and earth, permanently raising max lifespan by 5%." },
  zenglingzhu: { name: "Spirit-Boosting Bead", desc: "A bead brimming with pure Dao-law power; can strengthen one learned technique by one level in the Techniques tab (spells cap at level seven)." },

  // ── 真仙之物 ──
  tianxiandan: { name: "Celestial Immortal Pill", desc: "A secret of the immortal realms, refinable only by true immortals. Consuming it condenses one point of Immortal Power, doubling combat strength." },
  xiantian_zhong: { name: "Innate Spirit Bell", desc: "An innate immortal artifact nurtured within the North Frost Immortal Realm; refining it grants two points of Immortal Power." },
  xiantian_qi: { name: "Heaven-Breaking Pill", desc: "A supreme treasure left over from the opening of the heavens; refining it grants three points of Immortal Power." },
  thantian_lu: { name: "Heaven-Piercing Creation Dew", desc: "Dew condensed within the Heaven-Holding Vase, embodying the power of the Dao made manifest; refining it grants fifteen points of Immortal Power." },
  jinhundan: { name: "Golden Soul Pill", desc: "A golden soul-pill condensed after a Grand Supreme Golden Immortal's fall, consumable only by true immortals. Consuming it transmutes the soul, allowing a breakthrough from True Immortal to Golden Immortal!" },

  // ── 丹藥 ──
  huanglongdan: { name: "Yellow Dragon Pill", desc: "A common qi-nourishing pill for Qi Refining cultivators, boosts cultivation." },
  huiyuandan: { name: "Origin-Return Pill", desc: "A pill that swiftly restores mana." },
  liaoshangdan: { name: "Wound-Healing Pill", desc: "Usable both externally and internally; heals injuries." },
  zhujidan: { name: "Foundation Establishment Pill", desc: "Legendary pill said to greatly raise the success rate of Foundation Establishment; priceless and rarely available." },
  ningyingdan: { name: "Nascent Soul Condensing Pill", desc: "An aid for Core Formation cultivators condensing their Nascent Soul, refined from Purple Ape Blossoms." },
  dahuandan: { name: "Great Revival Pill", desc: "A miracle pill said to bring the dying back from the brink of death." },
  jiuqulingshen: { name: "Nine-Bend Spirit Ginseng Pill", desc: "Refined from nine-bend spirit ginseng; mana surges back like the tide." },
  pojiedan: { name: "Boundary-Breaking Pill", desc: "A supreme pill for breaching the Mahayana bottleneck, guided by Sovereign Heaven Marrow." },

  // ── 仙法秘笈 ──
  m_qingzhufeng: { name: "Fragment: Verdant Bamboo Windcloud Sword Manual", desc: "Studying this teaches the Verdant Bamboo Windcloud Sword technique." },
  m_leidun: { name: "Jade Slip: Thunder Escape", desc: "Studying this teaches Thunder Escape." },
  m_hanbing: { name: "Manual: Frost Break", desc: "Studying this teaches Frost Break." },
  m_liehuo: { name: "Talisman Book: Blazing Fire Array", desc: "Studying this teaches Blazing Fire Array." },
  m_dayan: { name: "Stone Rubbing: Great Calculation Technique", desc: "Studying this teaches the Great Calculation Technique." },
  m_jinlei: { name: "True Thunder-Command Technique of the Golden Thunderbamboo", desc: "Studying this teaches True Thunder Command. Requires Foundation Establishment." },
  m_xuantian: { name: "Vast Heaven Spirit-Severing Swordplay", desc: "The supreme swordplay recorded within the Mystic Heaven treasure. Requires Core Formation." },
  m_aohan: { name: "Six Techniques of Frost Pride", desc: "An extreme-cold demonic art, six techniques chained in sequence, a frost tide that seals the world. Requires Nascent Soul." },
  m_dageng: { name: "Great Geng Sword Array Diagram", desc: "A sword array diagram left by ancient cultivators; gold-essence flying swords form an unmatched, razor-sharp array. Requires Nascent Soul." },
  m_yuanci: { name: "Record of the Origin Magnetism Divine Light", desc: "The power of the Origin Magnetism Mountain made into divine light, suppressing all techniques. Requires Deity Transformation." },
  m_sanyan: { name: "True Scripture of the Three Flames", desc: "Three colors of spirit flame united as one, scorching mountains and boiling seas. Requires Void Refinement." },
  m_zhenlong: { name: "Nine Transformations of the True Dragon", desc: "The supreme divine ability to transform into a true dragon; cultivable from Body Integration onward." },

  m_chiyan_fentian: { name: "Transcript: Crimson Flame Heaven-Scorching Technique", desc: "An advanced Fire-element technique commonly cultivated by Core Formation cultivators, sold in the market." },
  m_jingji_jiaohun: { name: "Transcript: Thornbind Soul-Strangling Curse", desc: "A Wood-element technique commonly cultivated by Nascent Soul cultivators, sold in the market. Requires Nascent Soul." },
  m_houtu_suohun: { name: "Diagram: Deep Earth Soul-Locking Array", desc: "An Earth-element technique commonly cultivated by Nascent Soul cultivators, sold in the market. Requires Nascent Soul." },
  m_jinwu_zhuori: { name: "Fragment: Golden Crow Sun-Scorching Technique", desc: "A Metal-element technique commonly cultivated by Deity Transformation cultivators; from the Sky Mist Demon Bird's hoard. Requires Deity Transformation." },
  m_fentian_liyu: { name: "Secret Scroll: Heaven-Scorching Purgatory", desc: "A Fire-element technique commonly cultivated by Deity Transformation cultivators, left behind by a demonized cultivator. Requires Deity Transformation." },
  m_hanyuan_wanli: { name: "Jade Book: Frost Abyss Ten-Thousand-League Freeze", desc: "A Water-element technique commonly cultivated by Void Refinement cultivators, treasured by the Ghost Mother. Requires Void Refinement." },
  m_wanteng_tianluo: { name: "Diagram: Ten-Thousand Vine Heaven Net Array", desc: "A Wood-element technique commonly cultivated by Void Refinement cultivators, a relic of the Demon Blood Venerable. Requires Void Refinement." },
  m_canghai_niliu: { name: "Manual: Azure Sea Reverse Current Technique", desc: "A Water-element technique commonly cultivated by Body Integration cultivators, guarded by the True Spirit Guards. Requires Body Integration." },
  m_shanhe_zhenhun: { name: "Ancient Scroll: Mountain-River Soul-Suppressing Art", desc: "An Earth-element technique commonly cultivated by Body Integration cultivators, from the Chaos Fiend Beast's hoard. Requires Body Integration." },
  m_xuanbing_mieshi: { name: "Immortal Book: Mystic Ice World-Ending Technique", desc: "A Water-element technique commonly cultivated by Mahayana cultivators, passed down by the Void Human Immortal. Requires Mahayana." },
  m_tianjie_shafa: { name: "Thunder Scroll: Heavenly Tribulation Slaughter Technique", desc: "A slaughter technique born from the might of the Heavenly Tribulation Thunder Spirit, dropped only by it. Requires Tribulation Crossing." },
  m_houtu_fengtian: { name: "Dragon Book: Deep Earth Heaven-Sealing Technique", desc: "A top-tier technique commonly cultivated by Tribulation Crossing cultivators, treasured by an ancient true dragon's remnant soul." },
  m_lusheng_jianjue: { name: "Steward's Secret Transmission: God-Slaying Sword Technique", desc: "A Metal-element technique commonly cultivated by Body Integration cultivators, a reward from advanced Steward Hall missions. Requires Body Integration." },
  m_jiutian_fenyang: { name: "Steward's Secret Transmission: Nine Heavens Sun-Scorching Technique", desc: "A Fire-element technique commonly cultivated by Mahayana cultivators, a reward from advanced Steward Hall missions. Requires Mahayana." },
  m_taiyi_hunyuan_lu: { name: "Immortal Tablet: North Mystic Six-True Heaven-Earth Technique", desc: "The supreme technique cultivable only in the Taiyi Realm, a gift bestowed upon breaking through to the Taiyi Realm." },

  // ── 法器 ──
  qingsuo: { name: "Verdant Cord Sword", desc: "A Wood-element flying sword, its azure light like a coiling cord." },
  jinjian: { name: "Golden Light Greatsword", desc: "The standard artifact of the Giant Sword Sect, heavy and razor sharp." },
  hanbingzhui: { name: "Frost Cone", desc: "An ice-cone artifact forged from Frost Jade Essence." },
  huolingqi: { name: "Fire Spirit Banner", desc: "A small crimson banner forged from fire python scales; flames erupt with every wave." },
  hutudun: { name: "Deep Earth Shield", desc: "A yellow round shield centered on Warm Jade, astonishingly defensive." },
  qingzhufengjian: { name: "Verdant Bamboo Windcloud Sword", desc: "A life-bound flying sword forged from Golden Thunderbamboo, capable of splitting into many. Han Li's signature treasure." },
  dagengjian: { name: "Great Geng Sword Array", desc: "An array of seventy-two golden swords, forged from the gold essence of Azure Haze Mountain." },
  sanyanshan: { name: "Three-Flame Fan", desc: "A treasured fan made from the plumes of three-colored fire birds; one sweep scorches heaven and earth." },
  yuancishan: { name: "Origin Magnetism Divine Mountain", desc: "A towering Origin Magnetism Mountain refined down to an inch-tall miniature; suppresses all flight and escape when unleashed." },
  zhenlongyin: { name: "True Dragon Seal", desc: "An imperial seal carved from true dragon essence-bone; wherever it falls, mountains and rivers shatter." },

  // ── 護身之寶 ──
  hushenfu: { name: "Iron Guardian Talisman", desc: "A talisman that, once charged with mana, can block one fatal blow." },
  wuguangyi: { name: "Dark-Light Armor", desc: "Soft armor refined from Yin-Ill Energy, shimmering with dark light." },
  fengleichi: { name: "Wind-Thunder Wings", desc: "Wings forged from Wind-Fire Plume Scales; a flash of thunder-light carries you a hundred leagues, and shields and speeds the wearer." },
  jinganghu: { name: "Vajra Glaze Armor", desc: "Flood dragon scales set with Mystic Heaven Frost Iron, near-impervious to blade or sword." },

  // ── 符籙 ──
  fu_liehuo: { name: "Blazing Fire Talisman", desc: "Worn close to the body, it channels fire spirit into the blade, greatly boosting attack." },
  fu_wulei: { name: "Thunderbolt Talisman", desc: "Five thunders strike as one — a Thunder-element talisman balancing attack and speed." },
  fu_xuanyin: { name: "Mystic Yin Soul-Devouring Talisman", desc: "A talisman condensed from Yin-Ill energy, ferociously offensive, used by Mahayana cultivators." },
  fu_taixu: { name: "Void Primordial Talisman", desc: "An immortal talisman wieldable only by true immortals, its offensive power beyond mortal reckoning." },

  // ── 靈寵 ──
  pet_linghu: { name: "Crimson-Chain Spirit Fox", desc: "A Nascent Soul-tier spirit pet, sensible and treasure-scenting — multiplies spirit stone gains ×1.2 and slightly boosts attack and defense." },
  pet_xuangui: { name: "Mystic Ice Spirit Turtle", desc: "A Deity Transformation-tier spirit pet, its shell guards its master — multiplies spirit stone gains ×1.2 and greatly boosts defense." },
  pet_jinpeng: { name: "Golden-Wing Spirit Roc", desc: "A Body Integration-tier spirit pet that bears its master across the skies — multiplies spirit stone gains ×1.2 and greatly boosts attack and speed." },
  pet_tianhu: { name: "Nine-Tailed Heaven Fox", desc: "A True Immortal-tier spirit pet, its nine tails reaching the heavens — multiplies spirit stone gains ×1.2, strong in both attack and defense." },
  pet_hundun: { name: "Chaos Hatchling", desc: "A Golden Immortal-tier spirit pet with a world-devouring bearing — multiplies spirit stone gains ×1.2, peerless in attack and defense." },

  // ── 煉器圖譜 ──
  blueprint_xuanyin: { name: "Talisman Diagram: Mystic Yin Soul-Devouring Talisman", desc: "Records the forging method for the Mystic Yin Soul-Devouring Talisman; study it to craft your own." },
  blueprint_taixu: { name: "Immortal Talisman Diagram: Void Primordial Talisman", desc: "An immortal talisman diagram comprehensible only to true immortals." },

  // ── 金源仙域仙器 ──
  jy_taiyi: { name: "Taiyi Golden Light Sword", desc: "A supreme treasure of the Golden-Source Immortal Realm; Taiyi golden light sweeps all before it, unstoppable." },
  jy_hunyuan: { name: "Primordial Immortal Robe", desc: "An immortal robe forged within the Golden-Source Immortal Realm, impervious to all techniques." },

  // ── 金源仙域圖譜配方所煉裝備 ──
  jinyuan_ji: { name: "Golden-Source God-Slaying Halberd", desc: "A god-slaying halberd forged repeatedly from Taiyi Refined Gold, infused with Golden-Source power — one strike shatters cities." },
  taixu_hunyuanjia: { name: "Void Primordial Armor", desc: "Heavy protective armor refined from Golden-Source Spirit Sand, warded by every technique, as solid as the Golden-Source itself." },
  jinyuan_hujing: { name: "Golden-Source Dao-Guardian Mirror", desc: "A treasured mirror ground from Golden-Source Spirit Sand, reflecting all techniques and warding off misfortune." },
  zhuxian_fu: { name: "Immortal-Slaying Soul-Extinguishing Talisman", desc: "A slaughter talisman condensed with Taiyi Refined Gold as its guide — one talisman, and immortals and souls alike are slain." },
  zaohua_jian: { name: "Creation God-Slaying Sword", desc: "A sword of creation forged from Golden-Source Spirit Sand and Taiyi Refined Gold, unmatched when drawn, slaying immortals and demons alike." },

  // ── 金源仙域圖譜 ──
  blueprint_jishen: { name: "Forging Diagram: Golden-Source God-Slaying Halberd", desc: "Records the forging method for the Golden-Source God-Slaying Halberd; study it to craft your own." },
  blueprint_hunyuanjia: { name: "Forging Diagram: Void Primordial Armor", desc: "Records the forging method for the Void Primordial Armor; study it to craft your own." },
  blueprint_hudao: { name: "Forging Diagram: Golden-Source Dao-Guardian Mirror", desc: "Records the forging method for the Golden-Source Dao-Guardian Mirror; study it to craft your own." },
  blueprint_zhuxian: { name: "Forging Diagram: Immortal-Slaying Soul-Extinguishing Talisman", desc: "Records the forging method for the Immortal-Slaying Soul-Extinguishing Talisman; study it to craft your own." },
  blueprint_zaohuajian: { name: "Forging Diagram: Creation God-Slaying Sword", desc: "Records the forging method for the Creation God-Slaying Sword; study it to craft your own." },

  // ── 命器(舊) ──
  tianmingfu: { name: "Heaven-Destiny Talisman", desc: "A talisman condensed from the power of fate, left only after the Devourer Ghost Emperor of Great Jin fell — a glimpse of heaven's secret. +5% breakthrough success rate at any realm." },
  diyunfu: { name: "Earth-Fortune Talisman", desc: "A talisman formed from the convergence of earth's fortune, a secret treasure of the Ten-Thousand-Scale Sea Emperor — wearing it draws on the earth's aid, +3% breakthrough success rate." },

  // ── 命器(黑市限定,消耗型) ──
  diminfu: { name: "Earth-Fate Talisman", desc: "A consumable Mingqi item from the black market; once equipped, the next breakthrough attempt gains +3% success rate — win or lose, it turns to ash afterward." },
  tianyunfu: { name: "Heaven-Fortune Talisman", desc: "A consumable Mingqi item from the black market; once equipped, the next breakthrough attempt gains +5% success rate — win or lose, it turns to ash afterward." },
  tianjifu: { name: "Heaven-Apex Talisman", desc: "A consumable Mingqi item from the black market; once equipped, the next breakthrough attempt gains +8% success rate — win or lose, it turns to ash afterward." },

  // ── 真仙丹 ──
  zhenxiandan: { name: "True Immortal Pill", desc: "A supreme pill condensed from an ancient dragon ancestor's essence blood, essential for crossing the Tribulation and ascending. Whether the attempt succeeds or fails, its power is consumed either way." },

  // ── 北寒仙尊獨有仙法秘笈 ──
  m_beiming: { name: "North Mystic Heaven Technique", desc: "The supreme immortal technique realized over the North Frost Immortal Venerable's entire lifetime, Water-element taken to its pinnacle. Cultivable only by true immortals." },

  // ── 先天造化丹 ──
  xiantian_zaohuadan: { name: "Innate Creation Pill", desc: "A wondrous creation pill nurtured within the Golden-Source Immortal Realm; a Foundation Establishment cultivator who consumes it can leap across Core Formation, Nascent Soul, and Deity Transformation straight to Void Refinement! Its power is overwhelming — only Foundation Establishment cultivators may take it." },

  // ── 玄天仙器 ──
  xuantian_zhanling_jian: { name: "Mystic Heaven Spirit-Severing Sword", desc: "A Mystic Heaven treasure; wherever its blade passes, all techniques are annihilated." },
  xuantian_hulu: { name: "Mystic Heaven Gourd", desc: "A Mystic Heaven treasure; the gourd holds all techniques within, balancing offense and defense." },
  potian_chui: { name: "Heaven-Breaking Hammer", desc: "A Mystic Heaven treasure; one swing and the very sky shatters." },
  tianhu_huaxie_ren: { name: "Heaven Fox Blood-Transmuting Blade", desc: "A Mystic Heaven treasure; wherever the blade passes, blood ignites of its own accord, its wielder moving like a shadow." },
  xuantian_zhanmo_jian: { name: "Mystic Heaven Demon-Severing Sword", desc: "A Mystic Heaven treasure devoted to slaying inner demons and heretics, its sword-intent fierce beyond compare." },
  huantian_jing: { name: "Illusion-Heaven Mirror", desc: "A Mystic Heaven treasure; its mirrored surface conjures countless forms, real and illusion indistinguishable." },

  // ── 太乙精魂 ──
  taiyi_jinghun_tianhu: { name: "Taiyi Essence Soul – Heaven Fox", desc: "The essence soul condensed from the Heaven Fox's fall, crimson flame swirling. Collect all four Taiyi Essence Souls to break through to the Taiyi Realm at the Taiyi Hall." },
  taiyi_jinghun_zhenlong: { name: "Taiyi Essence Soul – True Dragon", desc: "The essence soul condensed from the True Dragon's fall, dragon-majesty faintly visible. Collect all four Taiyi Essence Souls to break through to the Taiyi Realm at the Taiyi Hall." },
  taiyi_jinghun_baxia: { name: "Taiyi Essence Soul – Baxia", desc: "The essence soul condensed from Baxia's fall, heavy and unadorned. Collect all four Taiyi Essence Souls to break through to the Taiyi Realm at the Taiyi Hall." },
  taiyi_jinghun_pixiu: { name: "Taiyi Essence Soul – Black-Eyed Pixiu", desc: "The essence soul condensed from the Black-Eyed Pixiu's fall, dim light swirling. Collect all four Taiyi Essence Souls to break through to the Taiyi Realm at the Taiyi Hall." },

  // ── 五色異星盤 ──
  xingpan_jin: { name: "Strange Star Disc (Metal)", desc: "A strange star disc refined deep within the Golden-Source Immortal Realm, aglow with golden light. Collect all five elemental discs to open the gate to the Wildlands." },
  xingpan_mu: { name: "Strange Star Disc (Wood)", desc: "A strange star disc refined deep within the Golden-Source Immortal Realm, wood-grain surging beneath its surface. Collect all five elemental discs to open the gate to the Wildlands." },
  xingpan_shui: { name: "Strange Star Disc (Water)", desc: "A strange star disc refined deep within the Golden-Source Immortal Realm, water ripples shimmering. Collect all five elemental discs to open the gate to the Wildlands." },
  xingpan_huo: { name: "Strange Star Disc (Fire)", desc: "A strange star disc refined deep within the Golden-Source Immortal Realm, fire-patterns blazing. Collect all five elemental discs to open the gate to the Wildlands." },
  xingpan_tu: { name: "Strange Star Disc (Earth)", desc: "A strange star disc refined deep within the Golden-Source Immortal Realm, earthen and thick. Collect all five elemental discs to open the gate to the Wildlands." },

  // ── 真仙 / 金仙頂尖仙法秘笈 ──
  m_hunyuan: { name: "Fragment: Primordial Unity Immortal Technique", desc: "The supreme technique of primordial creation; true immortals need centuries of hardship to master it. Appears only after a Golden-Source Immortal Emperor's fall." },
  m_taiqing: { name: "Jade Book: Nine Revolutions of Taiqing Dao-Rhyme", desc: "The nine-revolution Dao-rhyme left by the Taiqing Immortal Venerable; needs five hundred thousand years to cultivate. A rare chance encounter for Grand Supreme Golden Immortals and Pagoda elites." },
  m_zhutian: { name: "Immortal Tablet: Heaven-Slaying Divine Thunder Golden Immortal Technique", desc: "The supreme slaughter technique cultivable only by Golden Immortals; needs a million years to master. Said to be found only atop the Pagoda's peak." },
};

/** 依品質後綴("id@113")取出基底 id 與百分比後綴文字(如 "(+13%)")。 */
function splitQualityId(id: string): { baseId: string; suffix: string } {
  const at = id.indexOf("@");
  if (at === -1) return { baseId: id, suffix: "" };
  const baseId = id.slice(0, at);
  const quality = Number(id.slice(at + 1));
  const pct = quality - 100;
  return { baseId, suffix: `(${pct >= 0 ? "+" : ""}${pct}%)` };
}

export function itemDisplayName(item: { id: string; name: string }, lang: Language): string {
  if (lang !== "en") return item.name;
  const { baseId, suffix } = splitQualityId(item.id);
  const en = ITEM_TEXT_EN[baseId];
  if (!en) return item.name;
  return suffix ? `${en.name} ${suffix}` : en.name;
}

export function itemDisplayDesc(item: { id: string; desc: string }, lang: Language): string {
  if (lang !== "en") return item.desc;
  const { baseId } = splitQualityId(item.id);
  return ITEM_TEXT_EN[baseId]?.desc ?? item.desc;
}

// 物品數值一覽(售價/效果/裝備加成),供混沌萬靈榜與裝備欄提示框共用同一份文字
export function itemStatLine(item: ItemDef, t: (k: DictKey) => string): string {
  const parts: string[] = [];
  if (item.price) parts.push(t("statLinePrice").replace("{n}", formatStones(item.price)));
  if (item.heal) parts.push(t("statLineHeal").replace("{n}", String(item.heal)));
  if (item.mp) parts.push(t("statLineMp").replace("{n}", String(item.mp)));
  if (item.exp) parts.push(t("statLineExp").replace("{n}", String(item.exp)));
  if (item.life) parts.push(t("statLineLife").replace("{n}", String(item.life)));
  if (item.lifePct) parts.push(t("statLineLifePct").replace("{n}", String(Math.round(item.lifePct * 100))));
  if (item.xianli) parts.push(t("statLineXianli").replace("{n}", String(item.xianli)));
  if (item.atkBonus) parts.push(t("statLineAtk").replace("{n}", String(item.atkBonus)));
  if (item.defBonus) parts.push(t("statLineDef").replace("{n}", String(item.defBonus)));
  if (item.speedBonus) parts.push(t("statLineSpeed").replace("{n}", String(item.speedBonus)));
  if (item.stoneMult) parts.push(t("statLineStoneMult").replace("{n}", String(item.stoneMult)));
  if (item.breakBonus) parts.push(t("statLineBreakBonus").replace("{n}", String(Math.round(item.breakBonus * 100))));
  if (item.reqStage) parts.push(t("statLineReqStage").replace("{n}", String(item.reqStage)));
  if (item.dropOnly) parts.push(t("statLineDropOnly"));
  return parts.join(" · ");
}
