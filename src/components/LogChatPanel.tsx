"use client";

import { useEffect, useRef, useState } from "react";
import { useGame } from "@/game/store";
import { useT } from "@/i18n/useT";
import { renderLootLine } from "./ColoredText";

interface ChatMessage {
  id: number;
  name: string;
  message: string;
  created_at: string;
}

const fmtTime = (iso: string) => {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};

// 見聞錄 / 對話集 合併面板:共用同一個可拖曳調整高度的面板,以按鈕切換顯示內容
export default function LogChatPanel() {
  const [tab, setTab] = useState<"log" | "chat">("log");
  const log = useGame((x) => x.save?.log ?? []);
  const myName = useGame((x) => x.save?.name ?? "");
  const tt = useT();

  const logBoxRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = logBoxRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [log]);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [chatErr, setChatErr] = useState("");
  const chatBoxRef = useRef<HTMLDivElement>(null);
  const lastIdRef = useRef(0);

  const poll = async (initial = false) => {
    try {
      const url = initial ? "/api/chat" : `/api/chat?after=${lastIdRef.current}`;
      const j = await (await fetch(url)).json();
      if (j.ok && j.messages?.length) {
        setMessages((prev) => (initial ? j.messages : [...prev, ...j.messages]).slice(-200));
        lastIdRef.current = j.messages[j.messages.length - 1].id;
      }
    } catch {
      /* 靜默重試,不干擾遊戲操作 */
    }
  };

  // 對話集持續在背景輪詢,即使目前顯示的是見聞錄,切換過去時訊息也是最新的
  useEffect(() => {
    poll(true);
    const timer = setInterval(() => poll(false), 5000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (tab !== "chat") return;
    const el = chatBoxRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, tab]);

  const send = async () => {
    const t = text.trim();
    if (!t || sending) return;
    setSending(true);
    setChatErr("");
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: t }),
      });
      const j = await res.json();
      if (!res.ok) {
        setChatErr(j.error ?? tt("sendFailGeneric"));
      } else {
        setText("");
        await poll(false);
      }
    } catch {
      setChatErr(tt("sendFailRetry"));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="panel flex flex-col resize-y overflow-hidden h-[22rem] lg:h-[50rem] min-h-[12rem] max-h-[85vh]">
      <div className="flex gap-1.5 mb-2 shrink-0">
        {(
          [
            ["log", tt("logTitle")],
            ["chat", tt("chatTitle")],
          ] as [typeof tab, string][]
        ).map(([t, label]) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-1 text-sm rounded-sm border transition-colors ${
              tab === t
                ? "border-gold/50 bg-gold/15 text-gold"
                : "border-faded/25 text-faded hover:text-cream"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "log" && (
        <div ref={logBoxRef} className="flex-1 overflow-y-auto space-y-1.5 pr-1 text-sm leading-relaxed">
          {log.length === 0 && <p className="text-faded/50">{tt("logEmptyMsg")}</p>}
          {log.map((l, i) => (
            <p key={i} className="animate-floatUp">
              <span className="text-faded/50 font-mono text-xs mr-1">▸</span>
              {renderLootLine(l)}
            </p>
          ))}
        </div>
      )}

      {tab === "chat" && (
        <div className="flex-1 flex flex-col min-h-0">
          <div ref={chatBoxRef} className="flex-1 overflow-y-auto space-y-1.5 pr-1 text-sm leading-relaxed">
            {messages.length === 0 && <p className="text-faded/50">{tt("chatEmptyMsg")}</p>}
            {messages.map((m) => (
              <p key={m.id}>
                <span className="text-faded/50 font-mono text-xs mr-1">{fmtTime(m.created_at)}</span>
                <span className={`font-bold mr-1 ${m.name === myName ? "text-gold" : "text-fuchsia-300"}`}>
                  {m.name}:
                </span>
                <span className="text-cream/90 break-words">{m.message}</span>
              </p>
            ))}
          </div>
          {chatErr && <p className="text-xs text-vermillion mt-1 shrink-0">{chatErr}</p>}
          <div className="mt-2 flex gap-2 shrink-0">
            <input
              type="text"
              value={text}
              maxLength={200}
              placeholder={tt("chatPlaceholder")}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") send();
              }}
              className="flex-1 min-w-0 bg-smoke border border-faded/30 rounded-sm px-2 py-1.5 text-sm text-parchment"
            />
            <button className="btn shrink-0" disabled={sending || !text.trim()} onClick={send}>
              {tt("btnSend")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
