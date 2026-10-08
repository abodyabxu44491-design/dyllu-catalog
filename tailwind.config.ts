// Copyright (c) 2026 Abdullah Al-Sakni. All rights reserved. DYLLU Catalog.
import type { Config } from "tailwindcss";
import { brand } from "./src/config/brand";
export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["var(--font-ard)", '"Arial Black"', "Arial", "Tahoma", "sans-serif"],
        sans: ["var(--font-ar)", "Arial", "Helvetica", "Tahoma", "system-ui", "sans-serif"],
      },
      colors: {
        lime: { DEFAULT: brand.lime, dark: brand.limeDark },
        ink: brand.ink,
        accent: brand.accent,
        soft: brand.soft,
        steel: brand.gray,
        line: brand.line,
      },
      boxShadow: {
        card: "0 1px 2px rgba(43,45,47,.06), 0 8px 24px -12px rgba(43,45,47,.18)",
        lift: "0 2px 4px rgba(43,45,47,.06), 0 18px 40px -16px rgba(43,45,47,.28)",
      },
      screens: { xs: "420px" },
    },
  },
} satisfies Config;
