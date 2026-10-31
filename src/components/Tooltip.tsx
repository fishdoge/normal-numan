"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

// 輕量提示框:包住任何內容,滑鼠移上去時於下方彈出 content 全文。
// 用於道具名稱旁——預設仍顯示單行簡短說明(通常會被 truncate 截斷),內容較長時可靠此看到完整描述。
// 5.0 版:提示框改以 portal 掛到 document.body、fixed 定位,不再被所在面板的圖層(backdrop-blur 等
// 形成的 stacking context)困住——原本道籍面板的提示框往右延伸時會被中間欄的儲物袋蓋住。
// 定位時會避開視窗邊緣:右側放不下就靠右對齊,下方放不下就改往上彈出。
export default function Tooltip({
  content,
  children,
  block,
}: {
  content: string;
  children: React.ReactNode;
  block?: boolean; // true:外層改用 block 排版(包住整個道具區塊時用),預設 inline-block(包住單一行內元素時用)
}) {
  const anchorRef = useRef<HTMLSpanElement>(null);
  const tipRef = useRef<HTMLSpanElement>(null);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);

  useLayoutEffect(() => {
    if (!open || !anchorRef.current || !tipRef.current) return;
    const a = anchorRef.current.getBoundingClientRect();
    const tip = tipRef.current.getBoundingClientRect();
    const margin = 8;
    let left = a.left;
    if (left + tip.width > window.innerWidth - margin) left = Math.max(margin, a.right - tip.width);
    let top = a.bottom + 4;
    if (top + tip.height > window.innerHeight - margin) top = Math.max(margin, a.top - tip.height - 4);
    setPos({ left, top });
  }, [open, content]);

  return (
    <span
      ref={anchorRef}
      className={block ? "block" : "inline-block"}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => {
        setOpen(false);
        setPos(null);
      }}
    >
      {children}
      {open &&
        typeof document !== "undefined" &&
        createPortal(
          <span
            ref={tipRef}
            style={{ left: pos?.left ?? 0, top: pos?.top ?? 0, visibility: pos ? "visible" : "hidden" }}
            className="pointer-events-none fixed z-[200] block w-max max-w-xs whitespace-normal rounded-sm border border-gold/40 bg-ink px-2.5 py-1.5 text-xs leading-relaxed text-cream shadow-lg"
          >
            {content}
          </span>,
          document.body,
        )}
    </span>
  );
}
