"use client";

// 天地靈氣(5.4 版):全服天氣,現實每 12 小時換一次。頁首與戰鬥畫面顯示目前天氣、影響與剩餘時間。
import { useEffect, useState } from "react";
import { weatherAt, WEATHER_INFO, weatherEffectText } from "@/game/data/weather";

const COLOR: Record<string, string> = {
  金: "text-amber-200 border-amber-200/50",
  木: "text-emerald-300 border-emerald-300/50",
  水: "text-sky-300 border-sky-300/50",
  火: "text-orange-400 border-orange-400/50",
  土: "text-yellow-600 border-yellow-600/50",
  雷: "text-violet-300 border-violet-300/60",
  煞: "text-rose-400 border-rose-400/60",
};
const left = (ms: number) => {
  const m = Math.max(0, Math.ceil(ms / 60_000));
  return `${Math.floor(m / 60)}:${String(m % 60).padStart(2, "0")}`;
};

export default function WeatherBadge({ compact = false }: { compact?: boolean }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(id);
  }, []);
  const w = weatherAt(now);
  if (!w.kind) return null;
  const info = WEATHER_INFO[w.kind];
  return (
    <span
      className={`weather-badge chip ${COLOR[w.kind]}`}
      title={`${info.desc}\n${weatherEffectText(w.kind)}\n${left(w.endsAt - now)} 後轉換`}
    >
      天地靈氣 · {info.name}
      {!compact && <span className="weather-badge-effect"> — {weatherEffectText(w.kind)}</span>}
      <span className="weather-badge-left"> · {left(w.endsAt - now)}</span>
    </span>
  );
}
