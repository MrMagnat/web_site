import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        burgundy:  { DEFAULT: "#3F1111", light: "#5a1a1a", dark: "#2a0b0b" },
        brand: {
          black:  "#191E1B",
          white:  "#FAFAFA",
          beige:  "#F7F0EC",
          gray:   "#9a9a9a",
          border: "#e8e0da",
        },
      },
      fontFamily: {
        prata:  ["var(--font-prata)", "Georgia", "serif"],
        inter:  ["var(--font-inter-tight)", "system-ui", "sans-serif"],
        gogol:  ["var(--font-gogol)", "cursive"],
      },
      fontSize: {
        "2xs": ["10px", { lineHeight: "1.4" }],
        xs:    ["12px", { lineHeight: "1.5" }],
        sm:    ["13px", { lineHeight: "1.6" }],
        base:  ["14px", { lineHeight: "1.7" }],
        lg:    ["16px", { lineHeight: "1.5" }],
        xl:    ["18px", { lineHeight: "1.4" }],
        "2xl": ["22px", { lineHeight: "1.3" }],
        "3xl": ["28px", { lineHeight: "1.2" }],
        "4xl": ["36px", { lineHeight: "1.15" }],
        "5xl": ["48px", { lineHeight: "1.1" }],
        "6xl": ["62px", { lineHeight: "1.05" }],
      },
      letterSpacing: {
        widest2: "0.2em",
        widest3: "0.28em",
      },
      spacing: {
        "18": "4.5rem",
        "22": "5.5rem",
        "26": "6.5rem",
        "30": "7.5rem",
      },
      borderRadius: {
        none: "0",
      },
      transitionTimingFunction: {
        luxury: "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
      },
      aspectRatio: {
        "3/4":  "3 / 4",
        "4/3":  "4 / 3",
        "2/3":  "2 / 3",
      },
      animation: {
        marquee: "marquee 28s linear infinite",
        "fade-up": "fadeUp 0.7s ease forwards",
        "scroll-line": "scrollLine 2s infinite",
      },
      keyframes: {
        marquee: {
          from: { transform: "translateX(0)" },
          to:   { transform: "translateX(-50%)" },
        },
        fadeUp: {
          from: { opacity: "0", transform: "translateY(32px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        scrollLine: {
          "0%":      { transform: "scaleY(0)", transformOrigin: "top" },
          "50%":     { transform: "scaleY(1)", transformOrigin: "top" },
          "50.01%":  { transformOrigin: "bottom" },
          "100%":    { transform: "scaleY(0)", transformOrigin: "bottom" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
