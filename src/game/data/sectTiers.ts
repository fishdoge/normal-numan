// 宗門分級制度(1.8 版新增,1.9 版調高門檻並改為素材/貢獻並行,2.7 版起素材改走獨立的「宗門捐獻」)
// 五大門派各自累積「宗門捐獻」:貢獻靈石與捐獻的各地素材(採集靈材、獵殺妖獸取得)皆存入即歸宗門所有、
// 不可取回,與可自由存取提領的「宗門倉庫」是完全分開的兩套資料,兩者皆達標方可晉升,
// 部分高階晉升額外要求同門中須有一定人數達到指定境界。

export interface SectTierDef {
  tier: number;
  name: string;
  memberCap: number; // 該階可容納的在世同門上限
  dwellingSlots: number; // 宗門仙境位置數(僅與宗門等級有關,與各仙境自身等級無關)
  contribution: number; // 累積貢獻靈石達此值方可由上一階晉升至本階(貢獻只增不減,不可提領)
  materials?: { id: string; n: number }[]; // 晉升本階需累積捐獻(宗門捐獻,只增不減,不可提領)的各地素材
  requireStage?: number; // 晉升本階額外需要:同門中至少 requireCount 人境界達到此 stage
  requireCount?: number;
}

export const SECT_TIERS: SectTierDef[] = [
  { tier: 1, name: "微型宗門", memberCap: 50, dwellingSlots: 3, contribution: 0 },
  {
    tier: 2,
    name: "小型宗門",
    memberCap: 100,
    dwellingSlots: 5,
    contribution: 2_000_000,
    materials: [
      { id: "tiekuang", n: 100 },
      { id: "qingmu", n: 100 },
    ],
  },
  {
    tier: 3,
    name: "中型宗門",
    memberCap: 180,
    dwellingSlots: 8,
    contribution: 20_000_000,
    materials: [
      { id: "hanjing", n: 120 },
      { id: "yinsha", n: 120 },
      { id: "huoyu", n: 120 },
      { id: "wenyu", n: 120 },
    ],
  },
  {
    tier: 4,
    name: "大型宗門",
    memberCap: 300,
    dwellingSlots: 12,
    contribution: 200_000_000,
    materials: [
      { id: "jiaolin", n: 150 },
      { id: "xuantiehan", n: 150 },
      { id: "xingchengang", n: 150 },
    ],
    requireStage: 7,
    requireCount: 1,
  },
  {
    tier: 5,
    name: "巨型宗門",
    memberCap: 500,
    dwellingSlots: 18,
    contribution: 2_000_000_000,
    materials: [
      { id: "mojing", n: 200 },
      { id: "fenghuolin", n: 200 },
      { id: "longjinggu", n: 150 },
    ],
    requireStage: 8,
    requireCount: 3,
  },
  {
    tier: 6,
    name: "仙宗",
    memberCap: 800,
    dwellingSlots: 25,
    contribution: 20_000_000_000,
    materials: [
      { id: "huangjitiansui", n: 100 },
      { id: "longjinggu", n: 250 },
    ],
    requireStage: 10,
    requireCount: 1,
  },
  {
    tier: 7,
    name: "仙宮",
    memberCap: 1500,
    dwellingSlots: 40,
    contribution: 200_000_000_000,
    materials: [
      { id: "jinyuan_lingsha", n: 150 },
      { id: "taiyi_jingjin", n: 100 },
    ],
    requireStage: 12,
    requireCount: 1,
  },
];

export const sectTierOf = (tier: number): SectTierDef =>
  SECT_TIERS.find((t) => t.tier === tier) ?? SECT_TIERS[0];

export const nextSectTierOf = (tier: number): SectTierDef | null =>
  SECT_TIERS.find((t) => t.tier === tier + 1) ?? null;

// 晉升本階前一階所需的成員境界人數描述文字
export const SECT_TIER_REQ_LABEL: Record<number, string> = {
  7: "合體期",
  8: "大乘期",
  10: "真仙",
  12: "太乙境",
};

// ── 宗門仙境(1.9 版新增) ──
// 每個宗門依等級開放固定數量的「仙境位置」(見上方 dwellingSlots),同門可停泊修煉,
// 每小時真實時間緩慢增長修為;每個位置各自獨立升級(消耗宗門倉庫素材,不限宗門等級)。
export interface DwellingLevelDef {
  level: number;
  expPerHour: number; // 停泊期間,每小時真實時間可得的修為
  materials: { id: string; n: number }[]; // 升至本級所需消耗的宗門倉庫素材(由本級位置自身負擔)
}

export const DWELLING_MAX_LEVEL = 10;

export const DWELLING_LEVELS: DwellingLevelDef[] = [
  { level: 1, expPerHour: 30, materials: [] },
  { level: 2, expPerHour: 80, materials: [{ id: "tiekuang", n: 20 }, { id: "huanglongcao", n: 20 }] },
  { level: 3, expPerHour: 170, materials: [{ id: "hanjing", n: 20 }, { id: "yinsha", n: 20 }] },
  { level: 4, expPerHour: 350, materials: [{ id: "jinleizhu", n: 15 }, { id: "zhuguo", n: 20 }] },
  { level: 5, expPerHour: 700, materials: [{ id: "jiaolin", n: 15 }, { id: "xingchengang", n: 15 }] },
  { level: 6, expPerHour: 1400, materials: [{ id: "mojing", n: 15 }, { id: "fenghuolin", n: 15 }] },
  { level: 7, expPerHour: 2800, materials: [{ id: "longjinggu", n: 15 }, { id: "huangjitiansui", n: 3 }] },
  { level: 8, expPerHour: 5600, materials: [{ id: "huangjitiansui", n: 12 }] },
  { level: 9, expPerHour: 11000, materials: [{ id: "jinyuan_lingsha", n: 15 }] },
  { level: 10, expPerHour: 22000, materials: [{ id: "taiyi_jingjin", n: 15 }, { id: "jinyuan_lingsha", n: 15 }] },
];

export const dwellingLevelOf = (level: number): DwellingLevelDef =>
  DWELLING_LEVELS.find((d) => d.level === level) ?? DWELLING_LEVELS[0];

export const nextDwellingLevelOf = (level: number): DwellingLevelDef | null =>
  DWELLING_LEVELS.find((d) => d.level === level + 1) ?? null;
