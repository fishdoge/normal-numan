// 角色數值函式的單元測試:statsOf(攻防氣血法力速度)、仙靈力乘數、突破成功率、修習成本/年限。
import { describe, it, expect } from "vitest";
import {
  newSave,
  statsOf,
  breakChanceOf,
  cultCostOf,
  learnYears,
  maxLifeOf,
  energyMaxOf,
} from "../engine";
import { REALMS } from "../data/realms";
import { SECTS } from "../data/sects";

describe("statsOf", () => {
  it("baseAtk = 境界攻擊 + 宗門加成 + 裝備加成 + 雲遊永久加成", () => {
    const sect = SECTS.find((x) => x.id === "julian")!; // 巨劍門 bonus.atk = 8
    expect(sect.bonus.atk).toBe(8);
    const s = newSave("t", "julian");
    const { atk, baseAtk } = statsOf(s);
    expect(baseAtk).toBe(REALMS[0].atk + 8);
    expect(atk).toBe(baseAtk); // 仙靈力為 0,乘數應為 1,atk 應等於 baseAtk
  });

  it("仙靈力每點 +20% 攻擊力,且直接乘在 baseAtk 上(含裝備/宗門加成)", () => {
    const s = newSave("t", "julian");
    s.xianli = 10;
    const { atk, baseAtk } = statsOf(s);
    expect(atk).toBe(Math.floor(baseAtk * (1 + 10 * 0.2)));
    expect(atk).toBe(baseAtk * 3);
  });

  it("防禦完全不隨境界成長,裸裝玩家無論境界高低 def 恆為 0(+雲遊累積)", () => {
    const low = newSave("t", "julian");
    const high = newSave("t", "julian");
    high.realmIdx = REALMS.length - 1; // 太乙境
    expect(statsOf(low).def).toBe(0);
    expect(statsOf(high).def).toBe(0);
    high.boonDef = 50;
    expect(statsOf(high).def).toBe(50);
  });

  it("hpMax/mpMax 疊加宗門固定加成(不隨境界等比放大)", () => {
    const s = newSave("t", "huadao"); // 化刀塢 bonus.hp = 60
    const { hpMax } = statsOf(s);
    expect(hpMax).toBe(REALMS[0].hpMax + 60);
  });
});

describe("breakChanceOf", () => {
  it("突破成功率 = 境界基礎值 + 命器加成,上限 99%", () => {
    const s = newSave("t", "julian");
    expect(breakChanceOf(s)).toBe(REALMS[0].breakChance);
  });

  it("境界基礎突破率為 0(如已飛昇真仙)時,一律鎖死為 0,命器加成不生效", () => {
    const s = newSave("t", "julian");
    const feishengIdx = REALMS.findIndex((r) => r.id === "feisheng");
    expect(feishengIdx).toBeGreaterThan(0);
    s.realmIdx = feishengIdx;
    expect(REALMS[feishengIdx].breakChance).toBe(0);
    expect(breakChanceOf(s)).toBe(0);
  });
});

describe("cultCostOf / learnYears", () => {
  it("打坐消耗修為隨境界指數翻倍:5 × 2^(stage-1)", () => {
    const s = newSave("t", "julian");
    expect(cultCostOf(s)).toBe(5); // stage 1
    s.realmIdx = REALMS.findIndex((r) => r.stage === 2 && r.name.includes("前期"));
    expect(cultCostOf(s)).toBe(10); // stage 2
  });

  it("一般仙法的修習年限 = cultCostForStage(reqStage) × reqStage × 3", () => {
    // reqStage 1:5×2^0×1×3 = 15 年(對應 2.20 版 changelog 宣稱的「練氣期 15 年」)
    expect(learnYears("mujian")).toBe(15);
    // reqStage 2:5×2^1×2×3 = 60 年
    expect(learnYears("leidun")).toBe(60);
  });

  it("真仙/金仙/太乙頂尖仙法有手動設定的天文數字年限,不套用一般公式", () => {
    expect(learnYears("zhutian_shenlei")).toBe(1000000);
    expect(learnYears("taiyi_hunyuan_lu")).toBe(2000000);
  });
});

describe("maxLifeOf / energyMaxOf", () => {
  it("壽元上限 = 當前境界壽元上限 + 累積延壽", () => {
    const s = newSave("t", "julian");
    expect(maxLifeOf(s)).toBe(REALMS[0].lifespan);
    s.lifeBonus = 100;
    expect(maxLifeOf(s)).toBe(REALMS[0].lifespan + 100);
  });

  it("精力上限隨大境界緩步遞增(基礎 300,每大境界 +50),倍力丹疊加 +10%/疊", () => {
    const s = newSave("t", "julian"); // stage 1
    expect(energyMaxOf(s)).toBe(300);
    s.energyPotionStacks = 2;
    expect(energyMaxOf(s)).toBe(Math.floor(300 * 1.2));
  });

  it("煉神術(energyDoubled)令精力上限永久翻倍,疊加在倍力丹之上", () => {
    const s = newSave("t", "julian");
    s.energyPotionStacks = 2;
    s.energyDoubled = true;
    expect(energyMaxOf(s)).toBe(Math.floor(300 * 1.2) * 2);
  });
});
