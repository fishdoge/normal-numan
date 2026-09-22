import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontSize: {
        xs: ["0.875rem", { lineHeight: "1.5" }],
        sm: ["1rem", { lineHeight: "1.6" }],
        base: ["1.125rem", { lineHeight: "1.6" }],
        lg: ["1.25rem", { lineHeight: "1.5" }],
        xl: ["1.375rem", { lineHeight: "1.4" }],
      },
      colors: {
        ink: "#0c171a",
        coal: "#111f22",
        smoke: "#1a2b2d",
        parchment: "#e9e6dc",
        cream: "#ced6ce",
        faded: "#93a6a5",
        vermillion: "#bd6960",
        cinnabar: "#e79a7d",
        jade: "#79b7a5",
        gold: "#c6af7b",
        azure: "#71a6bc",
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
        // 3.15 版:拉長顯示時間並補上一段「停留」,原本 1.1s 幾乎邊冒出來就邊開始淡出,常常來不及看清數字。
        // 3.16 版:進場改成「彈出」——從縮小帶點傾斜開始,瞬間放大超過原尺寸再回彈,比單純淡入更有力道。
        dmgFloat: {
          "0%": { opacity: "0", transform: "translateY(6px) scale(0.4) rotate(-4deg)" },
          "10%": { opacity: "1", transform: "translateY(-6px) scale(1.35) rotate(2deg)" },
          "22%": { opacity: "1", transform: "translateY(-10px) scale(1.05) rotate(-1deg)" },
          "70%": { opacity: "1", transform: "translateY(-32px) scale(1) rotate(0deg)" },
          "100%": { opacity: "0", transform: "translateY(-50px) scale(0.92) rotate(0deg)" },
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
        dmgFloat: "dmgFloat 1.6s ease-out forwards",
        legendaryGlow: "legendaryGlow 2.2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
export default config;
