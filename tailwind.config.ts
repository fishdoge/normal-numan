import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0b0e11",
        coal: "#12161c",
        smoke: "#1e2329",
        parchment: "#eaecef",
        cream: "#b7bdc6",
        faded: "#848e9c",
        vermillion: "#f6465d",
        cinnabar: "#ff707e",
        jade: "#0ecb81",
        gold: "#f0b90b",
        azure: "#3b9eff",
        // 盤性(五行)
        metal: "#e8b923",
        wood: "#0ecb81",
        water: "#3b9eff",
        fire: "#f6465d",
        earth: "#c98a3a",
      },
      fontFamily: {
        serif: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "monospace"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "monospace"],
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
        ticker: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
      },
      animation: {
        floatUp: "floatUp .4s ease-out",
        ticker: "ticker 40s linear infinite",
      },
    },
  },
  plugins: [],
};
export default config;
