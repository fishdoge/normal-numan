import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      // 5.0 版「夜色仙境」:深夜墨藍底、半透明深色玻璃面板、玉青互動色、淡金只用於標題與稀有物。
      // 沿用原本的語意色名(ink/coal/gold…),只換色值,元件上數百處的顏色 class 一起換裝。
      colors: {
        ink: "#070B11",
        coal: "#0E151E",
        smoke: "#18222F",
        parchment: "#E8EEF2",
        cream: "#C9D3DB",
        faded: "#8F9DAA",
        vermillion: "#E0604F",
        cinnabar: "#F07C6C",
        jade: "#7FD1C0",
        gold: "#E6C680",
        azure: "#6FA8DC",
        // 五行
        metal: "#E6C680",
        wood: "#7FCB8A",
        water: "#6FA8DC",
        fire: "#F07C6C",
        earth: "#C99A62",
        electric: "#F5D442",
        curse: "#8F6AA8",
      },
      fontFamily: {
        // 內文改用思源黑體(好讀),標題用思源宋體;數字開啟等寬數字
        sans: ["Noto Sans TC", "system-ui", "sans-serif"],
        serif: ["Noto Sans TC", "system-ui", "sans-serif"],
        display: ["Noto Serif TC", "serif"],
        mono: ["Noto Sans TC", "system-ui", "sans-serif"],
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
