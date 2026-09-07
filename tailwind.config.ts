import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0d0b08",
        coal: "#161310",
        smoke: "#211d18",
        parchment: "#ecdcb8",
        cream: "#d8c69a",
        faded: "#9a8a68",
        vermillion: "#c03a2b",
        cinnabar: "#e05a3a",
        jade: "#4d9970",
        gold: "#c9a227",
        azure: "#4a7fa5",
        // 五行(3.12 版校正:金屬性原本是近乎灰白的 #d9d2c0,不夠像「金色」,改為明確的金色)
        metal: "#d4af37",
        wood: "#5aa860",
        water: "#5a8fd0",
        fire: "#e0603a",
        earth: "#b08040",
        // 3.12 版新增:預留給未來稀有/特殊主題符寶的卡面色,目前尚無實際符寶使用
        electric: "#f5d442", // 超稀有「電」屬性符寶的閃電金色外框
        curse: "#5c1f3d", // 預留給未來詛咒類符寶
      },
      fontFamily: {
        // 1.6 版:改用 @fontsource 自架(見 src/app/layout.tsx),直接引用字型家族名稱,
        // 不再需要 next/font 的 CSS 變數轉接。
        serif: ["Noto Serif TC", "serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      keyframes: {
        floatUp: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        pulse2: {
          "0%,100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        },
        dmgFloat: {
          "0%": { opacity: "0", transform: "translateY(0) scale(0.9)" },
          "15%": { opacity: "1", transform: "translateY(-4px) scale(1.05)" },
          "100%": { opacity: "0", transform: "translateY(-38px) scale(1)" },
        },
        // 3.12 版新增:超稀有符寶(如未來的「電」屬性)卡面邊框微微明滅,呼應「閃電金色外框」的
        // 特效需求,幅度刻意收斂(box-shadow 而非位移/縮放)避免手牌區太吵。
        legendaryGlow: {
          "0%,100%": { boxShadow: "0 0 4px 0px rgba(245, 212, 66, 0.35)" },
          "50%": { boxShadow: "0 0 9px 2px rgba(245, 212, 66, 0.75)" },
        },
      },
      animation: {
        floatUp: "floatUp .4s ease-out",
        dmgFloat: "dmgFloat 1.1s ease-out forwards",
        legendaryGlow: "legendaryGlow 2.2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
export default config;
