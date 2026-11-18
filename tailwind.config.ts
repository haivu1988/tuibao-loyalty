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
        // Xanh lá TUIBAO — màu thương hiệu chính (con mèo)
        brand: {
          50: "#f1faec",
          100: "#ddf3cf",
          200: "#bfe8a4",
          300: "#98d872",
          400: "#72c548",
          500: "#52ab30",
          600: "#3d8a24",
          700: "#306c20",
          800: "#2a561f",
          900: "#24481d",
        },
        // Cam TUIBAO — mũ mèo & chữ logo (điểm nhấn/CTA phụ)
        carrot: {
          50: "#fff3ed",
          100: "#ffe3d4",
          200: "#ffc2a8",
          300: "#ff9870",
          400: "#fb6a38",
          500: "#f2531e",
          600: "#e03c0f",
          700: "#b92d0f",
          800: "#932714",
          900: "#772313",
        },
        // Vàng TUIBAO — bụng mèo & highlight
        sun: {
          50: "#fffceb",
          100: "#fff6c6",
          200: "#ffec88",
          300: "#ffdc45",
          400: "#ffc916",
          500: "#f2aa06",
          600: "#d68102",
          700: "#b15c06",
          800: "#90470c",
          900: "#773a0d",
        },
      },
      borderRadius: {
        bubble: "1.75rem",
      },
      fontFamily: {
        display: [
          "Be Vietnam Pro",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
      },
      boxShadow: {
        bubble: "0 10px 30px -12px rgba(61, 138, 36, 0.35)",
      },
    },
  },
  plugins: [],
};

export default config;
