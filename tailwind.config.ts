import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        rosewood: {
          50: "#fdf6f0",
          100: "#faeadc",
          200: "#f5d0b5",
          300: "#eeaf84",
          400: "#e68552",
          500: "#df652e",
          600: "#d14d22",
          700: "#ad3b1e",
          800: "#8b3020",
          900: "#71291e",
          950: "#3d120d",
        },
        cream: "#FAF8F5",
        bark: "#2C1810",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        serif: ["var(--font-playfair)", "Georgia", "serif"],
      },
    },
  },
  plugins: [],
};

export default config;
