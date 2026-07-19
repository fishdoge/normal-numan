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
        // 五行
        metal: "#d9d2c0",
        wood: "#5aa860",
        water: "#5a8fd0",
        fire: "#e0603a",
        earth: "#b08040",
      },
      fontFamily: {
        serif: ["var(--font-serif-tc)", "Noto Serif TC", "serif"],
        mono: ["var(--font-mono)", "monospace"],
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
      },
      animation: {
        floatUp: "floatUp .4s ease-out",
      },
    },
  },
  plugins: [],
};
export default config;
