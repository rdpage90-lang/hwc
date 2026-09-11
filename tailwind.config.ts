import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        track: {
          950: "#07090d",
          900: "#0b0e14",
          850: "#10141c",
          800: "#151a24",
          700: "#1e2531",
          600: "#2b3344",
          500: "#3f4a5e",
          400: "#5c6a83",
          300: "#8b96ab",
        },
        heat: {
          DEFAULT: "#ff5a1f",
          bright: "#ff7a3d",
          dim: "#c4451a",
        },
        volt: {
          DEFAULT: "#3ddc97",
          bright: "#5cf0af",
        },
        signal: {
          amber: "#ffb020",
          red: "#ff3b4e",
          blue: "#2ea8ff",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      backgroundImage: {
        "grid-fade":
          "linear-gradient(180deg, rgba(255,90,31,0.08) 0%, rgba(255,90,31,0) 60%)",
        "hairline": "repeating-linear-gradient(90deg, rgba(255,255,255,0.06) 0px, rgba(255,255,255,0.06) 1px, transparent 1px, transparent 8px)",
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(255,90,31,0.25), 0 0 24px rgba(255,90,31,0.15)",
        "glow-volt": "0 0 0 1px rgba(61,220,151,0.25), 0 0 24px rgba(61,220,151,0.15)",
        card: "0 1px 0 rgba(255,255,255,0.04) inset, 0 8px 24px rgba(0,0,0,0.4)",
      },
      letterSpacing: {
        tightish: "-0.01em",
        wideish: "0.04em",
      },
      keyframes: {
        sweep: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
        "pulse-glow": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        },
      },
      animation: {
        sweep: "sweep 1.8s ease-in-out infinite",
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
