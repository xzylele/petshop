// ตั้งค่าธีม/สีหลักของ Tailwind สำหรับทั้งโปรเจกต์
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/app/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f0fbf6",
          100: "#d9f5e6",
          200: "#b3ebd0",
          300: "#85dcb6",
          400: "#52c595",
          500: "#2eab78",
          600: "#1f8a60",
          700: "#1c6e4f",
          800: "#19583f",
          900: "#154734"
        }
      },
      fontFamily: {
        sans: ["ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Tahoma", "Sarabun", "sans-serif"]
      }
    }
  },
  plugins: []
};
export default config;
