// 門派/宗門分級/宗門任務英文翻譯對照表(1.21 版新增)。
import { Language } from "./dict";

export const SECT_TEXT_EN: Record<string, { name: string; desc: string }> = {
  huangfeng: { name: "Yellow Maple Valley", desc: "One of Yue Kingdom's seven great sects, Han Li's own. Skilled in pill-refining and Wood-element techniques, with deep foundations — its disciples cultivate steadily and surely." },
  yanyue: { name: "Shadowmoon Sect", desc: "Renowned for its Water-Moon Divine Art; mostly female cultivators, its Water-element techniques gentle and enduring, with abundant mana." },
  julian: { name: "Giant Sword Sect", desc: "A sword-cultivating sect that breaks every technique with the Giant Sword Art — fierce in attack, with exceptional bonuses to Metal-element artifacts." },
  huadao: { name: "Blade Transformation Enclave", desc: "A gathering place for blade cultivators; blade-qi burns like fire, ferocious in close combat, with formidable physiques." },
  tianque: { name: "Heaven Gate Fortress", desc: "A fortress-type sect; its Earth-element defensive techniques are unmatched in Yue Kingdom, its disciples tough and built for attrition warfare." },
};

export const SECT_TIER_NAME_EN: Record<number, string> = {
  1: "Micro Sect",
  2: "Small Sect",
  3: "Medium Sect",
  4: "Large Sect",
  5: "Giant Sect",
  6: "Immortal Sect",
  7: "Immortal Palace",
};

export const SECT_TIER_REQ_LABEL_EN: Record<number, string> = {
  7: "Body Integration",
  8: "Mahayana",
  10: "True Immortal",
  12: "Taiyi Realm",
};

export const MISSION_TEXT_EN: Record<string, { name: string; desc: string }> = {
  ms_shulang: { name: "Cull the Rat Plague", desc: "Red-Eyed Rat Wolves have overrun Rainbow Cloud Mountain, gnawing through the herb fields. Cull three of them." },
  ms_caoyao: { name: "Herb Procurement", desc: "The pill hall is refining Yellow Dragon Pills — hand over five stalks of Yellow Dragon Grass." },
  ms_qinglang: { name: "Hunt Wolves, Guard the Path", desc: "Blue-Back Wolf packs harass the mountain road. Hunt three to make an example." },
  ms_tiekuang: { name: "Ore Collection", desc: "The forging hall is collecting six pieces of Refined Iron Ore for furnace stock." },
  ms_hanjing: { name: "Frost Pool Essence", desc: "An elder in seclusion needs three pieces of Frost Jade Essence — the pool runs deep and its beasts are fierce, proceed with caution." },
  ms_huomang: { name: "Slay the Fire Pythons", desc: "Crimson-Flame Fire Pythons have repeatedly wounded fellow disciples. Slay two — keep the scales for yourself." },
  ms_leizhu: { name: "Rare Thunderbamboo", desc: "The sect offers a bounty for two Golden Thunderbamboo Branches, a supreme material for sword-forging." },
  ms_xuejiao: { name: "Slay the Flood Dragon", desc: "A Blood Flood Dragon stirs up trouble — slay it for a rich sect reward." },
  ms_zhenlingwei: { name: "Sweep the Heaven Abyss", desc: "True Spirit Guards swarm outside Heaven Abyss City — only Body Integration cultivators can sweep them clean. Reward: a secret technique from the Steward Hall." },
  ms_tianjie: { name: "Defy the Heavenly Tribulation", desc: "The Heavenly Tribulation Thunder Spirit at the Ascension Platform overawes all — only Mahayana cultivators dare defy and strike it. Reward: a secret technique from the Steward Hall." },
};

export function sectDisplayName(sect: { id: string; name: string }, lang: Language): string {
  if (lang !== "en") return sect.name;
  return SECT_TEXT_EN[sect.id]?.name ?? sect.name;
}
export function sectDisplayDesc(sect: { id: string; desc: string }, lang: Language): string {
  if (lang !== "en") return sect.desc;
  return SECT_TEXT_EN[sect.id]?.desc ?? sect.desc;
}
export function sectTierDisplayName(tier: { tier: number; name: string }, lang: Language): string {
  if (lang !== "en") return tier.name;
  return SECT_TIER_NAME_EN[tier.tier] ?? tier.name;
}
export function sectTierReqLabel(stage: number, zhLabel: string, lang: Language): string {
  if (lang !== "en") return zhLabel;
  return SECT_TIER_REQ_LABEL_EN[stage] ?? zhLabel;
}
export function missionDisplayName(m: { id: string; name: string }, lang: Language): string {
  if (lang !== "en") return m.name;
  return MISSION_TEXT_EN[m.id]?.name ?? m.name;
}
export function missionDisplayDesc(m: { id: string; desc: string }, lang: Language): string {
  if (lang !== "en") return m.desc;
  return MISSION_TEXT_EN[m.id]?.desc ?? m.desc;
}
