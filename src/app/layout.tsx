import type { Metadata } from "next";
import Script from "next/script";
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
import Footer from "@/components/Footer";

const SITE_URL = "https://www.immortality.website";
const SITE_TITLE = "凡人修仙傳 · 文字修仙 RPG";
const SITE_DESCRIPTION =
  "以《凡人修仙傳》韓立的修仙之路為藍本的免費線上文字修仙冒險遊戲。從煉氣期一路修煉至金仙、太乙境,習得青竹風雲劍等仙法秘笈,煉丹煉器、遊歷天南亂星海、加入宗門並肩闖蕩——支援繁體中文與英文雙語介面。";
const KEYWORDS = [
  "修仙",
  "修仙遊戲",
  "文字冒險",
  "文字遊戲",
  "凡人修仙傳",
  "青竹風雲劍",
  "韓立",
  "仙俠",
  "線上遊戲",
  "煉氣期",
  "文字RPG",
  "immortal cultivation game",
  "text-based RPG",
];

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: SITE_TITLE, template: `%s · ${SITE_TITLE}` },
  description: SITE_DESCRIPTION,
  keywords: KEYWORDS,
  authors: [{ name: "閎旺科技" }],
  creator: "閎旺科技",
  alternates: { canonical: "/" },
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    locale: "zh_TW",
    url: SITE_URL,
    siteName: SITE_TITLE,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
};

const JSON_LD = {
  "@context": "https://schema.org",
  "@type": "Game",
  name: "凡人修仙傳",
  alternateName: "A Mortal's Journey to Immortality",
  description: SITE_DESCRIPTION,
  url: SITE_URL,
  applicationCategory: "Game",
  genre: ["文字冒險", "修仙", "RPG"],
  inLanguage: ["zh-Hant", "en"],
  author: { "@type": "Organization", name: "閎旺科技" },
};

// Google Analytics(GA4)追蹤 ID
const GA_MEASUREMENT_ID = "G-1XN7D5199D";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-Hant">
      <body className="font-serif bg-ink text-parchment min-h-screen flex flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }}
        />
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
          strategy="afterInteractive"
        />
        <Script id="ga4-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_MEASUREMENT_ID}');
          `}
        </Script>
        <div className="flex-1">{children}</div>
        <Footer />
      </body>
    </html>
  );
}
