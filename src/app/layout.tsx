import type { Metadata } from "next";
import { Noto_Sans_TC, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const sansTC = Noto_Sans_TC({
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
  variable: "--font-serif-tc",
});
const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "LDZ 交易風雲傳 · 交易員得成神之路",
  description:
    "交易員養成放置遊戲 — 美金、精力、盤性策略、硬體升級、交易團隊、鏈上遊獵。LDZ 出品。",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-Hant">
      <body
        className={`${sansTC.variable} ${mono.variable} bg-ink text-parchment min-h-screen`}
        style={{ fontFamily: "var(--font-serif-tc), var(--font-mono), sans-serif" }}
      >
        {children}
      </body>
    </html>
  );
}
