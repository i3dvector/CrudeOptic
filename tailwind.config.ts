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
        crude: {
          bg: "#0A0A0A",
          surface: "#111111",
          border: "rgba(255, 255, 255, 0.1)",
          amber: "#F59E0B",
          orange: "#F97316",
          red: "#EF4444",
          green: "#22C55E",
          muted: "#6B7280",
        },
      },
      fontFamily: {
        heading: ["var(--font-space-grotesk)", "sans-serif"],
        body: ["var(--font-inter)", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "monospace"],
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "hero-glow":
          "radial-gradient(ellipse at center, rgba(245,158,11,0.15) 0%, transparent 70%)",
      },
      animation: {
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
      },
      keyframes: {
        "pulse-glow": {
          "0%, 100%": {
            boxShadow: "0 0 15px rgba(239, 68, 68, 0.3)",
          },
          "50%": {
            boxShadow: "0 0 30px rgba(239, 68, 68, 0.6)",
          },
        },
      },
    },
  },
  plugins: [],
};
export default config;
