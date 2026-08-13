"use client";

import { useEffect, useState } from "react";
import { useGame } from "@/game/store";
import { SECTS } from "@/game/data/sects";
import { techById } from "@/game/data/techniques";
import { ELEMENT_COLOR } from "@/game/types";
import { sectDisplayName, sectDisplayDesc } from "@/i18n/sectText";
import { techDisplayName } from "@/i18n/techText";
import { elementLabel } from "@/i18n/labelText";
import { useT } from "@/i18n/useT";

interface SectSummary {
  id: string;
  tierName: string;
  memberCap: number;
  memberCount: number;
}

export default function CharCreate({ name }: { name?: string }) {
  const act = useGame((s) => s.act);
  const busy = useGame((s) => s.busy);
  const lang = useGame((s) => s.language);
  const t = useT();
  const [sectId, setSectId] = useState<string | null>(null);
  const [summary, setSummary] = useState<Record<string, SectSummary>>({});

  useEffect(() => {
    (async () => {
      try {
        const j = await (await fetch("/api/sect?all=1")).json();
        if (j.ok) {
          const map: Record<string, SectSummary> = {};
          for (const s of j.sects ?? []) {
            map[s.id] = {
              id: s.id,
              tierName: s.tierName,
              memberCap: s.memberCap,
              memberCount: s.memberCount,
            };
          }
          setSummary(map);
        }
      } catch {
        /* 名額資訊僅供參考,取得失敗不影響選擇門派 */
      }
    })();
  }, []);

  return (
    <main className="max-w-3xl mx-auto px-4 py-12">
      <header className="text-center mb-10">
        <p className="font-mono text-xs tracking-[0.5em] text-gold/70 mb-3">
          A MORTAL&apos;S JOURNEY
        </p>
        <h1 className="text-5xl font-black tracking-widest text-parchment">{t("appTitle")}</h1>
        <p className="mt-4 text-faded">
          {t("charTagline")}
          <br />
          {t("charTagline2")}
        </p>
      </header>

      <section className="panel deco-frame mb-6 text-center">
        <p className="panel-title">{t("charDaoName")}</p>
        <p className="text-2xl font-bold text-gold">{name || t("charDaoNameFallback")}</p>
        <p className="text-xs text-faded mt-2">{t("charDaoNameNote")}</p>
      </section>

      <section className="panel deco-frame mb-8">
        <p className="panel-title">{t("charJoinSect")}</p>
        <div className="grid gap-3 sm:grid-cols-2">
          {SECTS.map((sect) => {
            const tech = techById(sect.startTech);
            const active = sectId === sect.id;
            const sum = summary[sect.id];
            const full = !!sum && sum.memberCount >= sum.memberCap;
            return (
              <button
                key={sect.id}
                disabled={full}
                onClick={() => !full && setSectId(sect.id)}
                className={`text-left border rounded-sm p-3 transition-colors ${
                  full
                    ? "border-faded/15 opacity-50 cursor-not-allowed"
                    : active
                      ? "border-gold bg-gold/10"
                      : "border-faded/25 hover:border-faded/60"
                }`}
              >
                <div className="flex items-baseline justify-between">
                  <span className="text-lg font-bold">{sectDisplayName(sect, lang)}</span>
                  <span className={`chip ${ELEMENT_COLOR[sect.element]}`}>
                    {elementLabel(sect.element, lang)}
                    {lang !== "en" && "行"}
                  </span>
                </div>
                <p className="text-sm text-faded mt-1 leading-relaxed">{sectDisplayDesc(sect, lang)}</p>
                <p className="text-xs mt-2 text-cream/80">
                  {t("charStartTech")}:{techDisplayName(tech, lang)} ·{" "}
                  {sect.bonus.exp ? (lang === "en" ? `Cultivation Rate +${sect.bonus.exp}% ` : `修煉效率 +${sect.bonus.exp}%`) : ""}
                  {sect.bonus.atk ? (lang === "en" ? `ATK +${sect.bonus.atk} ` : `攻擊 +${sect.bonus.atk}`) : ""}
                  {sect.bonus.hp ? (lang === "en" ? `HP +${sect.bonus.hp} ` : `氣血 +${sect.bonus.hp} `) : ""}
                  {sect.bonus.mp ? (lang === "en" ? `MP +${sect.bonus.mp}` : `法力 +${sect.bonus.mp}`) : ""}
                </p>
                {sum && (
                  <p className={`text-xs mt-1.5 ${full ? "text-vermillion" : "text-faded/70"}`}>
                    {sum.tierName} · {sum.memberCount}/{sum.memberCap}
                    {lang !== "en" && " 人"}
                    {full ? t("charFull") : ""}
                  </p>
                )}
              </button>
            );
          })}
        </div>
      </section>

      <div className="text-center">
        <button
          className="btn text-lg px-10 py-3"
          disabled={!sectId || busy}
          onClick={() => sectId && act("start", { sectId })}
        >
          {t("charBegin")}
        </button>
      </div>
    </main>
  );
}
