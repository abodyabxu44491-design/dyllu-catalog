import type { Config } from "tailwindcss";
import { brand } from "./src/config/brand";
export default { content: ["./src/**/*.{ts,tsx}"],
  theme: { extend: { fontFamily: { display: ["\"Arial Black\"", "Arial", "Tahoma", "sans-serif"] }, colors: { lime: brand.lime, ink: brand.ink, accent: brand.accent, soft: brand.soft, steel: brand.gray } } } } satisfies Config;
