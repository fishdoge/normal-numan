// 仙法英文翻譯對照表(1.21 版新增)——僅收錄英文,中文以 techniques.ts 本身為準。
import { Language } from "./dict";

export const TECH_TEXT_EN: Record<string, { name: string; desc: string }> = {
  mujian: { name: "Verdant Wood Sword Technique", desc: "Condenses wood-spirit qi into an azure sword-edge. The Yellow Maple Valley's entry-level sword technique." },
  shuijian: { name: "Water-Moon Arrow", desc: "Water qi condensed into arrows, endless and unbroken. Shadowmoon Sect's entry-level spell." },
  jinren: { name: "Golden Blade Technique", desc: "Commands golden blades to wound the enemy, razor sharp. Giant Sword Sect's entry-level swordcraft." },
  huoqiu: { name: "Fireball Technique", desc: "Hurls a scorching fireball — the most common and practical attack spell." },
  tudun: { name: "Earth Spike Technique", desc: "Earth erupts into spikes, balancing offense and defense. Heaven Gate Fortress's entry-level spell." },
  qingzhufeng: { name: "Verdant Bamboo Windcloud Sword Technique", desc: "Han Li's signature technique; flying swords forged from Golden Thunderbamboo swarm like bees, blotting out the sun, sword-light sweeping every direction." },
  leidun: { name: "Thunder Escape", desc: "Escapes a thousand feet on borrowed thunder-light, or transmutes into thunder to strike — a marvel of the Metal element." },
  hanbing: { name: "Frost Break", desc: "Extreme-cold qi condenses into an ice cone that bursts, damaging and slowing the enemy." },
  liehuo: { name: "Blazing Fire Array", desc: "Talismans arranged into an array, infernos scorching the heavens — devastating against beasts." },
  dayan: { name: "Great Calculation Technique", desc: "An ancient Earth-element technique; the power of deep earth suppresses all things." },
  jinlei: { name: "True Thunder-Command Technique", desc: "Commands the power of Golden Thunderbamboo to draw down heavenly thunder — castable only from late Foundation Establishment." },
  xuantian: { name: "Vast Heaven Spirit-Severing Swordplay", desc: "The legendary swordplay recorded within the Mystic Heaven treasure — one strike severs the spirit." },
  chiyan_fentian: { name: "Crimson Flame Heaven-Scorching Technique", desc: "An advanced Fire-element technique commonly cultivated by Core Formation cultivators, wreathing the body in flame, both offense and defense." },
  aohan: { name: "Six Techniques of Frost Pride", desc: "Six chained techniques of extreme-cold demonic cultivation; wherever the frost tide passes, all things freeze." },
  dageng: { name: "Great Geng Sword Array", desc: "Seventy-two gold-essence flying swords erupting as one array, sword-light like a waterfall." },
  jingji_jiaohun: { name: "Thornbind Soul-Strangling Curse", desc: "A Wood-element technique commonly cultivated by Nascent Soul cultivators; thorns bind the body, strangling the soul." },
  houtu_suohun: { name: "Deep Earth Soul-Locking Array", desc: "An Earth-element technique commonly cultivated by Nascent Soul cultivators; deep earth forms an array, sealing the enemy's soul." },
  yuanci: { name: "Origin Magnetism Divine Light", desc: "The power of Origin Magnetism condensed into five-colored divine light, suppressing all techniques and flight." },
  jinwu_zhuori: { name: "Golden Crow Sun-Scorching Technique", desc: "A Metal-element technique commonly cultivated by Deity Transformation cultivators; the three-legged golden crow scorches the sun and burns the sky." },
  fentian_liyu: { name: "Heaven-Scorching Purgatory", desc: "A Fire-element technique commonly cultivated by Deity Transformation cultivators; purgatory flame consumes all things." },
  sanyan: { name: "Three Flames as One", desc: "Three colors of spirit flame merge into one, scorching mountains and boiling seas — none below Deity Transformation can withstand its edge." },
  hanyuan_wanli: { name: "Frost Abyss Ten-Thousand-League Freeze", desc: "A Water-element technique commonly cultivated by Void Refinement cultivators; once the frost-abyss qi is unleashed, ten thousand leagues turn to ice." },
  wanteng_tianluo: { name: "Ten-Thousand Vine Heaven Net Array", desc: "A Wood-element technique commonly cultivated by Void Refinement cultivators; ten thousand vines weave a heaven-net, trapping the enemy formless." },
  lusheng_jianjue: { name: "God-Slaying Sword Technique", desc: "A Metal-element technique commonly cultivated by Body Integration cultivators; the sword strikes to slay gods, unmatched in edge." },
  canghai_niliu: { name: "Azure Sea Reverse Current Technique", desc: "A Water-element technique commonly cultivated by Body Integration cultivators; the azure sea inverts, its reverse current devouring the foe." },
  shanhe_zhenhun: { name: "Mountain-River Soul-Suppressing Art", desc: "An Earth-element technique commonly cultivated by Body Integration cultivators; mountains and rivers become a seal, suppressing every soul." },
  zhenlong: { name: "Nine Transformations of the True Dragon", desc: "Transforms into a true dragon through nine forms across nine realms; a single claw shatters mountains and rivers." },
  jiutian_fenyang: { name: "Nine Heavens Sun-Scorching Technique", desc: "A Fire-element technique commonly cultivated by Mahayana cultivators; nine heavens scorch the sun, turning ten thousand leagues to scorched earth." },
  xuanbing_mieshi: { name: "Mystic Ice World-Ending Technique", desc: "A Water-element technique commonly cultivated by Mahayana cultivators; mystic ice spreads without end, freezing and annihilating all things." },
  tianjie_shafa: { name: "Heavenly Tribulation Slaughter Technique", desc: "A slaughter technique realized from the might of the Heavenly Tribulation Thunder Spirit, wieldable only by Tribulation Crossing cultivators — thunderous slaughter that annihilates every technique." },
  houtu_fengtian: { name: "Deep Earth Heaven-Sealing Technique", desc: "A top-tier technique commonly cultivated by Tribulation Crossing cultivators; deep earth seals the heavens, suppressing the tribulation itself." },
  beiming: { name: "North Mystic Heaven Technique", desc: "The supreme immortal technique realized over the North Frost Immortal Venerable's entire lifetime, Water-element taken to its pinnacle — a single thought freezes immortal spirits, ten thousand leagues turned to ice. Cultivable only by true immortals." },
  hunyuan_yiqi: { name: "Primordial Unity Immortal Technique", desc: "The supreme technique of creation itself; one breath becomes the Three Purities, suppressing every technique under heaven. True immortals need centuries of hardship to master it." },
  taiqing_daoyun: { name: "Nine Revolutions of Taiqing Dao-Rhyme", desc: "The nine-revolution Dao-rhyme left by the Taiqing Immortal Venerable; every revolution is a world unto itself — wherever its golden light reaches, immortals and demons alike are annihilated. A top-tier technique for true immortals." },
  zhutian_shenlei: { name: "Heaven-Slaying Divine Thunder Golden Immortal Technique", desc: "The heaven-slaying divine thunder cultivable only by Golden Immortals; one bolt turns a hundred million leagues to scorched earth — the supreme slaughter technique of the Immortal Court used to suppress rebel immortals." },
  taiyi_hunyuan_lu: { name: "North Mystic Six-True Heaven-Earth Technique", desc: "The supreme technique cultivable only in the Taiyi Realm; the gourd swallows and breathes heaven and earth, one incantation returning all techniques to their origin. Only one who reaches the very peak of the Pagoda and glimpses the true Grand Duke of Jupiter may grasp it." },
};

export function techDisplayName(t: { id: string; name: string }, lang: Language): string {
  if (lang !== "en") return t.name;
  return TECH_TEXT_EN[t.id]?.name ?? t.name;
}

export function techDisplayDesc(t: { id: string; desc: string }, lang: Language): string {
  if (lang !== "en") return t.desc;
  return TECH_TEXT_EN[t.id]?.desc ?? t.desc;
}
