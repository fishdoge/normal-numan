import type { Metadata } from "next";
import { Noto_Serif_TC, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const serifTC = Noto_Serif_TC({
  subsets: ["latin"],
  weight: ["400", "600", "700", "900"],
  variable: "--font-serif-tc",
});
const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "凡人修仙傳 · 文字修仙",
  description: "凡人流文字修仙遊戲 — 靈石、法力、五行法術、煉器、門派、探索洞窟。",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-Hant">
      <body className={`${serifTC.variable} ${mono.variable} font-serif bg-ink text-parchment min-h-screen`}>
        {children}
      </body>
    </html>
  );
}
