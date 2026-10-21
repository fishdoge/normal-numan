"use client";

// 輕量提示框:純 CSS group-hover,不依賴額外套件。包住任何內容,滑鼠移上去時於下方彈出 content 全文。
// 用於道具名稱旁——預設仍顯示單行簡短說明(通常會被 truncate 截斷),內容較長時可靠此看到完整描述。
export default function Tooltip({
  content,
  children,
  block,
}: {
  content: string;
  children: React.ReactNode;
  block?: boolean; // true:外層改用 block 排版(包住整個道具區塊時用),預設 inline-block(包住單一行內元素時用)
}) {
  return (
    <span className={`relative group/tooltip ${block ? "block" : "inline-block"}`}>
      {children}
      <span
        className="pointer-events-none absolute left-0 top-full z-50 mt-1 hidden w-max max-w-xs whitespace-normal rounded-sm border border-gold/40 bg-ink px-2.5 py-1.5 text-xs leading-relaxed text-cream shadow-lg group-hover/tooltip:block"
      >
        {content}
      </span>
    </span>
  );
}
