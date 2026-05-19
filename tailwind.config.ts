import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#FF6600",
          hover: "#FF8833",
          ring: "rgba(255, 102, 0, 0.2)",
          border: "rgba(255, 102, 0, 0.18)",
        },
        surface: {
          base: "#141414",
          raised: "#1d1d1d",
          input: "#262626",
          inputHover: "#2e2e2e",
          divider: "#2a2a2a",
        },
        ink: {
          DEFAULT: "#F5F5F5",
          muted: "#A8A8A8",
          subtle: "#6B6B6B",
        },
        danger: "#ef4444",
        warning: "#f59e0b",
      },
      fontFamily: {
        sans: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
      },
      fontFeatureSettings: {
        nums: '"tnum"',
      },
      borderRadius: {
        card: "12px",
        control: "8px",
      },
      boxShadow: {
        card: "0 24px 60px -20px rgba(0, 0, 0, 0.6)",
        focus: "0 0 0 3px rgba(255, 102, 0, 0.2)",
        cta: "0 8px 24px -6px rgba(255, 102, 0, 0.45)",
      },
      transitionTimingFunction: {
        soft: "cubic-bezier(0.22, 1, 0.36, 1)",
      },
    },
  },
  plugins: [],
};

export default config;
