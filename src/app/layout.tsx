import type { Metadata } from "next";
// 自架字型(1.6 版):改用 @fontsource 自架,取代 next/font/google——
// next/font/google 會在「建置當下」連線 Google Fonts 下載字型檔,Vercel 建置機偶發連不上時整個 build 會失敗
// (NextFontError: Failed to fetch ... from Google Fonts)。@fontsource 把字型檔案打包在 npm 套件裡,
// npm install 時就已經到位,建置階段不再需要對外連線,徹底解決這個間歇性建置失敗問題。
import "@fontsource/noto-serif-tc/400.css";
import "@fontsource/noto-serif-tc/600.css";
import "@fontsource/noto-serif-tc/700.css";
import "@fontsource/noto-serif-tc/900.css";
import "@fontsource/jetbrains-mono/400.css";
import "@fontsource/jetbrains-mono/500.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "凡人修仙傳 · 文字修仙",
  description: "凡人流文字修仙遊戲 — 靈石、法力、五行法術、煉器、門派、探索洞窟。",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-Hant">
      <body className="font-serif bg-ink text-parchment min-h-screen">{children}</body>
    </html>
  );
}
