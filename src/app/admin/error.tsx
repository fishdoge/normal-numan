"use client";

import Link from "next/link";
import "./admin.css";

export default function AdminError({ reset }: { reset: () => void }) {
  return (
    <main className="admin-shell admin-gate">
      <Link href="/" className="admin-back">
        ← 回到遊戲
      </Link>
      <section className="admin-gate-card">
        <p className="admin-eyebrow">凡人修仙傳 · 管理後臺</p>
        <h1>暫時無法讀取後臺</h1>
        <p role="alert" className="admin-intro">
          資料庫可能暫時無法連線,請稍後重試。
        </p>
        <button className="admin-button admin-primary" onClick={reset}>
          重新讀取
        </button>
      </section>
    </main>
  );
}
