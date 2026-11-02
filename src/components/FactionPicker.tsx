"use client";

// 擇定派系(5.4 版):飛昇仙界後(或舊存檔的真仙)尚未擇定派系時跳出,選定前無法離開飛昇台。
// 也用於改投他派(onClose 有值時可關閉)。
import { useState, type CSSProperties } from "react";
import { useGame } from "@/game/store";
import { FACTIONS, RELATION_LABEL, relationOf, type FactionId } from "@/game/data/factions";
import { zoneById } from "@/game/data/geography";
import { useT } from "@/i18n/useT";
import { zoneDisplayName } from "@/i18n/worldText";

// 卡片頂部橫幅:暫借各派領地的地域插畫(專屬派系插畫待 Figma AI 點數重置後補上)
const FACTION_ART: Record<FactionId, string> = {
  tianting: "/images/world/regions/guanghan.webp",
  lunhui: "/images/world/regions/kunpeng.webp",
  manhuang: "/images/world/regions/manhuang.webp",
  jiuyou: "/images/world/regions/huixian.webp",
  zhenmo: "/images/world/regions/zhenmo.webp",
};

export default function FactionPicker({ onClose }: { onClose?: () => void }) {
  const s = useGame((x) => x.save)!;
  const act = useGame((x) => x.act);
  const busy = useGame((x) => x.busy);
  const lang = useGame((x) => x.language);
  const t = useT();
  const [picked, setPicked] = useState<FactionId | null>(null);
  const choice = FACTIONS.find((f) => f.id === picked);
  const switching = !!s.faction;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/80 backdrop-blur-sm p-4">
      <div className="panel deco-frame max-w-3xl w-full max-h-[88vh] flex flex-col animate-floatUp">
        <div className="flex items-baseline justify-between mb-1 gap-2">
          <p className="panel-title mb-0">{t(switching ? "facSwitchTitle" : "facPickTitle")}</p>
          {onClose && (
            <button className="chip hover:text-gold py-1.5 px-2.5" onClick={onClose}>
              {t("btnClose")}
            </button>
          )}
        </div>
        <p className="text-xs text-faded mb-3">{t(switching ? "facSwitchNote" : "facPickNote")}</p>
        <div className="flex-1 min-h-0 overflow-y-auto grid auto-rows-max content-start gap-2 sm:grid-cols-2 pr-1">
          {FACTIONS.filter((f) => f.id !== s.faction).map((f, i, list) => {
            const home = zoneById(f.homeZone)!;
            const foes = FACTIONS.filter(
              (o) => o.id !== f.id && relationOf(f.id, o.id) !== "neutral",
            );
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => setPicked(f.id)}
                aria-pressed={picked === f.id}
                // 按鈕內容預設垂直置中,改為由上往下排列,同一列的卡片才會對齊;
                // 張數為奇數時最後一張橫跨兩欄,不會單獨留下半個空格
                className={`flex flex-col items-stretch text-left border rounded-sm overflow-hidden transition-colors ${
                  list.length % 2 === 1 && i === list.length - 1 ? "sm:col-span-2" : ""
                } ${picked === f.id ? "border-gold bg-gold/10" : "border-faded/25 hover:border-gold/50"}`}
              >
                <div
                  className="relative h-20 shrink-0 bg-cover bg-center"
                  style={{ backgroundImage: `url(${FACTION_ART[f.id]})` } as CSSProperties}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/50 to-transparent" />
                  <div className="absolute inset-x-3 bottom-2 flex items-end justify-between gap-2">
                    <span className={`text-lg font-black tracking-[0.2em] drop-shadow ${f.color}`}>
                      {f.name}
                    </span>
                    <span className="chip text-cream/80 border-cream/30 bg-ink/40">{f.stance}</span>
                  </div>
                </div>
                <div className="p-3 pt-2 flex-1">
                  <p className="text-xs text-faded">
                    {t("facHome")}:{zoneDisplayName(home, lang)} · {f.city}
                  </p>
                  <p className="text-sm text-cream/90 mt-1.5">{f.desc}</p>
                  <ul className="text-xs text-jade mt-1.5 space-y-0.5">
                    {f.perks.map((p) => (
                      <li key={p}>◆ {p}</li>
                    ))}
                    {f.opensZones.length > 0 && (
                      <li>
                        ◆ {t("facOpens")}:
                        {f.opensZones.map((z) => zoneDisplayName(zoneById(z)!, lang)).join("、")}
                      </li>
                    )}
                  </ul>
                  <p className="text-xs text-faded mt-1.5">
                    {foes.length
                      ? foes
                          .map((o) => `${RELATION_LABEL[relationOf(f.id, o.id)]}:${o.name}`)
                          .join(" · ")
                      : t("facNoFoes")}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
        <div className="mt-3 flex items-center justify-between gap-2">
          <p className="text-xs text-faded">
            {choice ? t("facConfirmHint").replace("{name}", choice.name) : t("facPickHint")}
          </p>
          <button
            className="btn shrink-0"
            disabled={!choice || busy}
            onClick={async () => {
              if (!choice) return;
              await act("chooseFaction", { factionId: choice.id });
              onClose?.();
            }}
          >
            {choice ? t("facConfirmBtn").replace("{name}", choice.name) : t("facConfirmBtnEmpty")}
          </button>
        </div>
      </div>
    </div>
  );
}
