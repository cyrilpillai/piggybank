import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        brand: {
          50: "#f0fdf4",
          100: "#dcfce7",
          500: "#10b981",
          600: "#059669",
          700: "#047857",
        },
      },
      backdropBlur: {
        "2xl": "40px",
        "3xl": "64px",
      },
      boxShadow: {
        glass: "0 8px 32px 0 rgba(0, 0, 0, 0.37)",
        "glass-sm": "0 4px 16px 0 rgba(0, 0, 0, 0.25)",
        "glass-inset": "inset 0 1px 1px 0 rgba(255, 255, 255, 0.15), 0 8px 32px 0 rgba(0, 0, 0, 0.37)",
        "glass-glow": "0 0 30px -5px rgba(16, 185, 129, 0.25)",
        "ios-card": "0 20px 40px -15px rgba(0, 0, 0, 0.6)",
      },
      animation: {
        "float-slow": "float 9s ease-in-out infinite",
        "float-reverse": "float-rev 12s ease-in-out infinite",
        "pulse-subtle": "pulse-subtle 5s ease-in-out infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translate(0px, 0px) scale(1)" },
          "50%": { transform: "translate(25px, -20px) scale(1.06)" },
        },
        "float-rev": {
          "0%, 100%": { transform: "translate(0px, 0px) scale(1)" },
          "50%": { transform: "translate(-25px, 25px) scale(0.95)" },
        },
        "pulse-subtle": {
          "0%, 100%": { opacity: "0.2" },
          "50%": { opacity: "0.35" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
