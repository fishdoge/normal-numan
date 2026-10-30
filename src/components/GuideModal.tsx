"use client";

// 修仙入門錄(5.0 版改寫):分成「玩法指南」與「計算公式」兩頁。凡是數值,一律直接引用遊戲裡的常數,
// 調整平衡時這裡會自動跟著變,不會再出現說明與實際數值對不上的情況。
import { useState, type ReactNode } from "react";
import {
  XIANLI_MULT,
  XIANLI_MULT_CAP,
  SECT_STAGE_BONUS,
  SECT_MULT_CAP,
  SYNERGY_STACK_CAP,
  COMBO_SIZE_STACK_CAP,
  ATK_TIERS,
  ATK_ROLE_MULT,
  ATK_REL_RANGE,
  MONSTER_MIN_DMG_FRAC,
  ENERGY_COST,
  ENERGY_REGEN_PER_TICK,
  HAND_SIZE,
  POUCH_MIN,
  BASIC_CARD_MIN,
  STATUS_PROC_CHANCE,
  STATUS_DURATION,
  FREEZE_DURATION,
  MONSTER_HP_BALANCE_MULT,
  MONSTER_HP_NORMAL_MULT,
  MONSTER_HP_EARLY_MULT,
  MONSTER_HP_LATE_MULT,
  MONSTER_HP_STAGE_EXTRA,
  MONSTER_EXP_STAGE_MULT,
  LOCATION_STAGE_LEEWAY,
  SHAQI_DECAY_PER_HOUR,
  NOVICE_GUARD_REALMS,
} from "@/game/engine";
import { TENGFU_DROP_CHANCE, TENGFU_DROP_CHANCE_LORD, TENGFU_DROP_CHANCE_ELITE } from "@/game/data/tengfu";
import { ELITE_SPAWN_CHANCE } from "@/game/data/world";
import { PVP_DAMAGE_MULT } from "@/game/pvpEngine";

const pct = (x: number, d = 0) => `${(x * 100).toFixed(d)}%`;
const STAGE_NAME: Record<number, string> = {
  1: "練氣",
  2: "築基",
  3: "結丹",
  4: "元嬰",
  5: "化神",
  6: "煉虛",
  7: "合體",
  8: "大乘",
  9: "渡劫",
  10: "真仙",
  11: "金仙",
  12: "太乙",
};
const TIER_NAME: Record<string, string> = {
  "x-beihan": "北寒仙域",
  "x-jinyuan": "金源仙域",
  "x-manhuang": "蠻荒異界",
  "x-zhenmo": "真魔界",
  "x-huixian": "灰仙界",
};
const tierName = (k: string) => TIER_NAME[k] ?? `${STAGE_NAME[Number(k)]}期`;

function Formula({ children }: { children: ReactNode }) {
  return (
    <div className="my-2 rounded-lg border border-jade/25 bg-jade/5 px-3 py-2 text-[13px] leading-relaxed text-parchment">
      {children}
    </div>
  );
}
function Table({ head, rows }: { head: string[]; rows: (string | number)[][] }) {
  return (
    <div className="my-2 overflow-x-auto rounded-lg border border-faded/20">
      <table className="w-full text-[13px]">
        <thead>
          <tr className="bg-faded/10 text-faded">
            {head.map((h) => (
              <th key={h} className="px-2.5 py-1.5 text-left font-medium whitespace-nowrap">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-t border-faded/15">
              {r.map((c, j) => (
                <td key={j} className="px-2.5 py-1.5 font-mono whitespace-nowrap">
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-lg border border-faded/20 p-3.5">
      <p className="font-bold text-gold mb-1.5">{title}</p>
      <div className="space-y-1.5 text-sm text-cream/90 leading-relaxed">{children}</div>
    </div>
  );
}

function PlayGuide() {
  return (
    <>
      <Section title="① 每天在做什麼">
        <p>
          修仙的主線是「累積修為 → 突破境界」。修為主要來自兩件事:<b>打坐修煉</b>(消耗壽元換修為,同時回滿氣血)與
          <b>獵殺妖獸</b>(到大陸遊歷選一處秘境狩獵,打贏得修為、靈石與掉落物)。
        </p>
        <p>
          每個行動都要花<b>精力</b>:打坐 {ENERGY_COST.cultivate}、採集 {ENERGY_COST.gather}、獵殺 {ENERGY_COST.hunt}、
          突破 {ENERGY_COST.breakthrough}、雲遊 {ENERGY_COST.wander}、煉器 {ENERGY_COST.craft}。精力每 5 分鐘真實時間回復{" "}
          {ENERGY_REGEN_PER_TICK} 點,停泊宗門仙境時回復更快。
        </p>
        <p>
          前期最快的方法是斬妖:新手先在天南的彩霞山、黑風嶺狩獵,氣血低於一半就打坐回滿再出發。
        </p>
      </Section>

      <Section title="② 境界與突破">
        <p>
          境界由低到高:練氣、築基、結丹、元嬰、化神、煉虛、合體、大乘、渡劫,飛昇後為真仙、金仙、太乙。每個大境界分前期、中期、後期。
        </p>
        <p>
          修為攢滿當前小階的需求後即可嘗試突破。前期 → 中期 → 後期成功率 95%;衝擊下一個大境界時成功率逐階下降(道籍面板顯示的百分比已含命器加成)。
        </p>
        <p>
          突破失敗:修為歸零,最大壽元折損 15%。新手護體:練氣期(前 {NOVICE_GUARD_REALMS}{" "}
          個小階)失敗時只散去一半修為、不折損壽元。大境界突破成功時,壽元上限提升到新境界的數值並額外贈送 10%。
        </p>
      </Section>

      <Section title="③ 壽元:修練的隱藏成本">
        <p>
          打坐、雲遊都會消耗壽元,而且每 1 小時真實時間,不論在不在線都會再流逝 1 年。壽元歸零即道隕,只能轉世重修。
        </p>
        <p>壽元剩不到上限的 20% 時數字會轉紅。看到紅字時,優先考慮突破大境界或服用延壽丹藥,不要再繼續打坐。</p>
      </Section>

      <Section title="④ 大陸遊歷:秘境、越階與隱藏區域">
        <p>
          秘境依需求境界由易到難排列。你可以進入比自身境界高 {LOCATION_STAGE_LEEWAY} 階的秘境(標示「越階」):妖獸依高一階的玩家校準,一擊大約是同階的 3
          倍,收穫也更豐厚,出發前請確保氣血全滿。仙域秘境必須真正飛昇才能踏入。
        </p>
        <p>
          隱藏區域需先解鎖:<b>金源仙域</b>(雲遊時隨機發現)、<b>蠻荒異界</b>(集齊五色異星盤)、<b>真魔界</b>
          (雲遊時隨機發現)、<b>灰仙界</b>(五色異星盤 + 灰質破界盤)。
        </p>
        <p>
          每次狩獵有機率遇上<b>地域王</b>(一般區域約 2~3%,蠻荒異界 3~5%);大乘期秘境另有 {pct(ELITE_SPAWN_CHANCE)}{" "}
          機率出現<b>菁英小 BOSS</b>,各有閃避或三倍重擊特技。
        </p>
        <p>戰敗時氣血剩三成,並遺失身上一半靈石,狩獵前請衡量身上的靈石。</p>
      </Section>

      <Section title="⑤ 符寶戰鬥">
        <p>
          戰鬥是回合制出牌:每回合從符寶袋抽 {HAND_SIZE} 張手牌,用法力打出,可一次打出多張(同回合連攜),打完按「施法結束」換妖獸出手。你的法力每回合都會回滿。
        </p>
        <p>
          符寶袋至少要放 {POUCH_MIN} 張;基礎卡「法器攻擊」「法術攻擊」各至少 {BASIC_CARD_MIN} 張。同一門仙法要多學幾次(參悟同門秘笈)才能放入多張。
        </p>
        <p>
          五行相剋:金剋木、木剋土、土剋水、水剋火、火剋金。剋制對方傷害 ×1.5,被剋 ×0.75。火、木、水屬性符寶命中時有{" "}
          {pct(STATUS_PROC_CHANCE)} 機率附加燒傷、中毒、冰封(見「計算公式」)。
        </p>
      </Section>

      <Section title="⑥ 滕符陣">
        <p>
          一個 5 × 6 格的符陣,把撿到的滕符依形狀放進去,效果常駐:攻擊、護體、氣血、法力、精力或屬性傷害加成。形狀越大、品階越高,加成越多。
        </p>
        <p>
          滕符散佈在每個秘境:一般妖獸 {pct(TENGFU_DROP_CHANCE)}、地域王 {pct(TENGFU_DROP_CHANCE_LORD)}、大乘菁英{" "}
          {pct(TENGFU_DROP_CHANCE_ELITE)} 機率掉落。滕符圖錄列出每一種的形狀、數值與掉落秘境。
        </p>
      </Section>

      <Section title="⑦ 宗門">
        <p>
          同宗門(含自己)在世的高境界修士越多,全宗門的戰鬥傷害越高(比例見「計算公式」),總倍率最高 ×{SECT_MULT_CAP}。宗門可累積貢獻靈石與素材晉升等級,等級越高同門上限與仙境位置越多。
        </p>
        <p>
          宗門仙境:把角色停泊在仙境,每小時自動增長修為,下線也持續累積;停泊期間無法採集、獵殺、雲遊、打坐或突破。宗門倉庫可讓同門共用道具與素材。
        </p>
      </Section>

      <Section title="⑧ 飛昇之後">
        <p>
          <b>仙靈力</b>:真仙以上專屬,每點讓攻擊力 +{pct(XIANLI_MULT)}(上限 ×{XIANLI_MULT_CAP})。
        </p>
        <p>
          <b>煞氣</b>:真仙以上每擊殺一隻妖獸 +1(上限 10000),每小時自然消退 {SHAQI_DECAY_PER_HOUR} 點。每點煞氣讓傷害 −0.01%,滿
          10000 時傷害歸零、畫面變灰(灰仙)。可服用滅煞丹,或在真魔界採集時有機率找到洗煞池清空。煞屬性符寶反而會因煞氣變強。
        </p>
        <p>
          <b>浮屠塔</b>:金源仙域深處的連續挑戰,每層 BOSS 都更強。登上第 20 層會開啟太乙殿,金仙集齊蠻荒四大地域王的太乙精魂,即可在此突破太乙境。
        </p>
        <p>
          <b>通天閣</b>:持有通天令的真仙可與在線道友即時對戰。PvP 傷害為一般戰鬥的 {pct(PVP_DAMAGE_MULT)},雙方輪流出手,每回合 20 秒,輪到你時法力回滿。
        </p>
      </Section>

      <Section title="⑨ 靈石">
        <p>
          面額由小到大:下品 → 中品 → 上品 → 極品 → 仙元石,每級 100 倍(1 仙元石 = 100 極品 = 10,000 上品 = 1,000,000 中品 = 100,000,000 下品)。介面會自動折算顯示。
        </p>
        <p>
          來源:擊殺妖獸(10% 機率靈石雙倍)、出售物品(六折)、宗門任務、奇遇。去處:坊市、煉器、雲遊、宗門貢獻。
        </p>
      </Section>
    </>
  );
}

function FormulaGuide() {
  const sectRows = Object.entries(SECT_STAGE_BONUS).map(([st, v]) => [STAGE_NAME[Number(st)], `+${pct(v)}`]);
  const tierRows = Object.entries(ATK_TIERS).map(([k, t]) => [
    tierName(k),
    t.refHp.toLocaleString(),
    t.refDef.toLocaleString(),
    pct(t.target, 1),
    Math.round(t.target * t.refHp * 2).toLocaleString(),
    `${((t.target * t.refHp) / t.refDef).toPrecision(2)}`,
  ]);
  return (
    <>
      <Section title="① 玩家屬性">
        <Formula>
          基礎攻擊 = 境界攻擊 + 門派加成 + 六件裝備的攻擊 + 雲遊永久加成
          <br />
          攻擊力 = 基礎攻擊 × min(×{XIANLI_MULT_CAP}, 1 + 仙靈力 × {XIANLI_MULT}) × (1 + 滕符攻擊%)
        </Formula>
        <Formula>
          防禦 = 裝備防禦 + 雲遊永久加成 + 境界攻擊 × 滕符護體%
          <br />
          氣血上限 = (境界氣血 + 門派加成 + 雲遊加成) × (1 + 滕符氣血%)
          <br />
          速度 = 境界攻擊 + 裝備速度 + 境界階數 × 5 + 雲遊加成
        </Formula>
      </Section>

      <Section title="② 你對妖獸造成的傷害">
        <Formula>
          傷害 = 攻擊力 × 本次出牌總威力 × 宗門倍率 × 中毒/虛弱折扣 × 隨機 0.9~1.1
        </Formula>
        <p>每一張符寶的威力依序乘上:</p>
        <Formula>
          威力 × 仙法等級(每級 +30%)
          <br />× 同屬性連攜(1 + 加成 × 同屬張數,最多算 {SYNERGY_STACK_CAP} 張)
          <br />× 張數連攜(1 + 加成 × (張數 − 1),最多算 {COMBO_SIZE_STACK_CAP} 張)
          <br />× 混屬連攜(1 + 加成 × (屬性種類 − 1))
          <br />× 上一張延續加成 × (1 + 滕符屬性%)× 五行相剋(×1.5 / ×1 / ×0.75)
          <br />× 蓄力加成 × 煞氣修正
        </Formula>
        <p>
          法器攻擊的屬性跟著裝備的法器走;雙屬性符寶取相剋倍率最高的屬性。灰仙界妖獸無視五行相剋。
        </p>
      </Section>

      <Section title="③ 妖獸對你造成的傷害(5.1 版)">
        <Formula>
          傷害 = max(保底, 妖獸攻擊 − 你的防禦 × 防禦係數) × 隨機 0.8~1.2
          <br />
          保底 = 妖獸攻擊 × {pct(MONSTER_MIN_DMG_FRAC)}
        </Formula>
        <p>
          防禦係數 = 標準傷害 ÷ 參考防禦。裝備防禦動輒上萬,比同階妖獸一下的傷害大得多,所以先依妖獸所屬階層換算:防禦等於參考防禦時,剛好擋掉一份標準傷害。防禦達到參考防禦的兩倍以後就只吃保底,但不會被壓到 1 點。
        </p>
        <Formula>
          標準傷害 = 目標比例 × 參考氣血
          <br />
          妖獸攻擊 = 標準傷害 × (1 + 階內相對強度({ATK_REL_RANGE[0]}~{ATK_REL_RANGE[1]})× 身分倍率)
          <br />
          身分倍率:一般 ×{ATK_ROLE_MULT.normal}、菁英 ×{ATK_ROLE_MULT.elite}、地域王 ×{ATK_ROLE_MULT.lord}
        </Formula>
        <p>
          參考氣血為該境界中期的氣血上限,參考防禦為該階中期玩家的典型防禦。目標比例是「參考玩家被一般妖獸打一下掉多少氣血」,約 11~20 下倒地;不穿裝備約為兩倍:
        </p>
        <Table head={["階層", "參考氣血", "參考防禦", "目標比例", "一般妖獸基準攻擊", "防禦係數"]} rows={tierRows} />
        <Formula>
          閃避率 = 速度 ÷ (速度 + 妖獸攻擊 × 1.2) × 0.5,介於 5%~35%
        </Formula>
      </Section>

      <Section title="④ 妖獸氣血與修為">
        <Formula>
          一般妖獸氣血 = 原始氣血 × {MONSTER_HP_BALANCE_MULT} × 地區倍率
          <br />
          地區倍率:天南 ×{MONSTER_HP_EARLY_MULT};其他 ×{MONSTER_HP_NORMAL_MULT};煉虛~大乘再 ×{MONSTER_HP_LATE_MULT};
          {Object.entries(MONSTER_HP_STAGE_EXTRA)
            .map(([st, v]) => `${STAGE_NAME[Number(st)]}再 ×${v}`)
            .join("、")}
          <br />
          地域王氣血 = 原始氣血 × {MONSTER_HP_BALANCE_MULT}
        </Formula>
        <Formula>
          一般妖獸修為 = 原始修為 ×{" "}
          {Object.entries(MONSTER_EXP_STAGE_MULT)
            .map(([st, v]) => `${STAGE_NAME[Number(st)]} ${v}`)
            .join("、")}
          (其他境界 ×1;地域王與菁英不打折)
        </Formula>
        <Formula>
          浮屠塔第 N 層:氣血 = 幻象太歲原始氣血 × 1.4^(N−1) × {MONSTER_HP_BALANCE_MULT};攻擊 = 金源仙域一般妖獸基準 × 1.2^(N−1)
        </Formula>
      </Section>

      <Section title="⑤ 狀態效果">
        <Table
          head={["狀態", "來源", "效果", "持續"]}
          rows={[
            ["燒傷", `火屬性命中,${pct(STATUS_PROC_CHANCE)} 機率`, "每回合扣氣血上限 4%", `${STATUS_DURATION} 回合`],
            ["中毒", `木屬性命中,${pct(STATUS_PROC_CHANCE)} 機率`, "每回合扣氣血上限 2.5%,攻擊 ×0.8", `${STATUS_DURATION} 回合`],
            ["冰封", `水屬性命中,${pct(STATUS_PROC_CHANCE)} 機率`, "跳過一次行動", `${FREEZE_DURATION} 回合`],
            ["虛弱", "戰術卡「衰運針」", "攻擊 ×0.7", "2 回合"],
            ["縹緲", "部分符寶", "必定閃過下一次攻擊", "1 次"],
          ]}
        />
      </Section>

      <Section title="⑥ 修煉與突破">
        <Formula>
          打坐修為 = 該小階所需修為 × 隨機 4%~7% × (1 + 門派修煉加成)
          <br />
          仙域境界改以「氣血上限 × 2%」為基準
        </Formula>
        <Formula>
          突破成功率 = 境界基礎成功率 + 命器加成,最高 99%
          <br />
          失敗:修為歸零、最大壽元 −15%(練氣期:修為減半、壽元不變)
        </Formula>
      </Section>

      <Section title="⑦ 宗門、仙靈力、煞氣">
        <Formula>宗門倍率 = 1 + 每位在世同門依境界的加成總和,最高 ×{SECT_MULT_CAP}</Formula>
        <Table head={["同門境界", "每位加成"]} rows={sectRows} />
        <Formula>
          仙靈力倍率 = min(×{XIANLI_MULT_CAP}, 1 + 仙靈力 × {XIANLI_MULT})——{Math.round((XIANLI_MULT_CAP - 1) / XIANLI_MULT)} 點達上限
        </Formula>
        <Formula>
          煞氣修正:一般符寶 × (1 − 煞氣 ÷ 10000);煞屬性符寶 × (1 + 煞氣 ÷ 10000 × 該符寶的煞氣加成)
          <br />
          煞氣每小時 −{SHAQI_DECAY_PER_HOUR}
        </Formula>
      </Section>

      <Section title="⑧ 通天閣 PvP">
        <Formula>
          PvP 傷害 = 攻擊力 × 本次出牌總威力 × {PVP_DAMAGE_MULT} × 隨機 0.9~1.1
        </Formula>
        <p>
          符寶連攜、五行相剋、狀態效果都與一般戰鬥相同;防守方以其法器或符籙的屬性計算相剋。每回合 20 秒,輪到的一方法力回滿。
        </p>
      </Section>
    </>
  );
}

export default function GuideModal({ onClose }: { onClose: () => void }) {
  const [tab, setTab] = useState<"play" | "formula">("play");
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="panel deco-frame max-w-3xl w-full max-h-[88vh] flex flex-col animate-floatUp"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-baseline justify-between mb-2">
          <p className="panel-title mb-0">修 仙 入 門 錄</p>
          <button className="chip hover:text-gold py-1.5 px-2.5" onClick={onClose}>
            關閉
          </button>
        </div>
        <div className="seg-tabs shrink-0" role="tablist">
          <button
            role="tab"
            aria-selected={tab === "play"}
            className={`seg-tab ${tab === "play" ? "seg-tab-on" : ""}`}
            onClick={() => setTab("play")}
          >
            玩法指南
          </button>
          <button
            role="tab"
            aria-selected={tab === "formula"}
            className={`seg-tab ${tab === "formula" ? "seg-tab-on" : ""}`}
            onClick={() => setTab("formula")}
          >
            計算公式
          </button>
        </div>
        <p className="text-xs text-faded mb-3">
          {tab === "play"
            ? "初入仙途,萬事懵懂?先讀這一頁,知道每天該做什麼、各系統怎麼運作。"
            : "所有數值都直接取自遊戲設定,平衡調整後會自動更新。"}
        </p>
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {tab === "play" ? <PlayGuide /> : <FormulaGuide />}
        </div>
      </div>
    </div>
  );
}
