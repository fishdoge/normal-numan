"use client";

import { useEffect } from "react";

// 只記錄前景且最近兩分鐘有操作的遊戲時間。既有角色年齡與離線收益不參與計算。
export function usePlaytimeTracking(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    let lastInput = Date.now();
    let tracking = false;
    let inFlight = false;
    const send = (event: "heartbeat" | "stop", beacon = false) => {
      const body = JSON.stringify({ event });
      if (beacon && navigator.sendBeacon) {
        navigator.sendBeacon("/api/activity", new Blob([body], { type: "application/json" }));
      } else {
        inFlight = true;
        void fetch("/api/activity", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body,
          keepalive: event === "stop",
        })
          .catch(() => {})
          .finally(() => {
            inFlight = false;
          });
      }
    };
    const tick = () => {
      if (inFlight) return;
      const active =
        document.visibilityState === "visible" &&
        document.hasFocus() &&
        Date.now() - lastInput < 120000;
      if (active) {
        tracking = true;
        send("heartbeat");
      } else if (tracking) {
        tracking = false;
        send("stop", true);
      }
    };
    const input = () => {
      lastInput = Date.now();
      if (!tracking) tick();
    };
    const stop = () => {
      if (tracking) {
        tracking = false;
        send("stop", true);
      }
    };
    const visibility = () => {
      if (document.visibilityState === "hidden") stop();
      else {
        lastInput = Date.now();
        tick();
      }
    };
    const focus = () => {
      lastInput = Date.now();
      tick();
    };
    const interval = window.setInterval(tick, 30000);
    window.addEventListener("pointerdown", input, { passive: true });
    window.addEventListener("keydown", input);
    window.addEventListener("focus", focus);
    window.addEventListener("blur", stop);
    window.addEventListener("pagehide", stop);
    document.addEventListener("visibilitychange", visibility);
    tick();
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("pointerdown", input);
      window.removeEventListener("keydown", input);
      window.removeEventListener("focus", focus);
      window.removeEventListener("blur", stop);
      window.removeEventListener("pagehide", stop);
      document.removeEventListener("visibilitychange", visibility);
      stop();
    };
  }, [enabled]);
}
