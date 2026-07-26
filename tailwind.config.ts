import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#050607",
        coal: "#0b0f0e",
        smoke: "#141a18",
        parchment: "#e6f2ec",
        cream: "#b9ccc2",
        faded: "#6f8479",
        vermillion: "#e0483a",
        cinnabar: "#ff6a4a",
        jade: "#34d399",
        gold: "#e5b83b",
        azure: "#4a9fd0",
        // 盤性(五行)
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
