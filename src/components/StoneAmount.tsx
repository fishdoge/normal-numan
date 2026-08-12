"use client";

import { stoneParts } from "@/game/types";

// 靈石數量顯示:仙元石(100 極品自動兌換而成,原著設定)一律以紫色標註,與其餘面額區別
export default function StoneAmount({ n, className }: { n: number; className?: string }) {
  const parts = stoneParts(n);
  return (
    <span className={className}>
      {parts.map((p, i) => (
        <span key={p.label}>
          {i > 0 && " "}
          {p.label === "仙元石" ? (
            <span className="text-fuchsia-300 font-bold">
              {p.qty} {p.label}
            </span>
          ) : (
            `${p.qty} ${p.label}`
          )}
        </span>
      ))}
    </span>
  );
}
