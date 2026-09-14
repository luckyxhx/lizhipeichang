import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#1f2937",
        paper: "#fffaf8",
        brand: {
          50: "#fff1f5",
          100: "#ffe4eb",
          500: "#e64c78",
          600: "#cf315f",
          700: "#ad234c",
        },
      },
      boxShadow: {
        soft: "0 12px 32px rgba(75, 49, 58, 0.09)",
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          '"Segoe UI"',
          '"PingFang SC"',
          '"Hiragino Sans GB"',
          '"Microsoft YaHei"',
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
} satisfies Config;
