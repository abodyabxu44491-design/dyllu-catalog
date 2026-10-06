import { cookies } from "next/headers";
export type Lang = "ar" | "en";
export const getLang = (): Lang => (cookies().get("lang")?.value === "en" ? "en" : "ar");
export const pick = (l: Lang, ar?: string | null, en?: string | null) => (l === "en" && en ? en : ar ?? "");
// نصوص الواجهة الثابتة: أضف مفتاحًا جديدًا هنا بالعربية والإنجليزية
const T = { features: ["المميزات", "Features"], specs: ["المواصفات", "Specifications"], back: ["رجوع", "Back"], all: ["كل المنتجات", "All products"], search: ["ابحث عن منتج...", "Search products..."], browse: ["استعرض المنتجات", "Browse products"] } as const;
export const t = (l: Lang, k: keyof typeof T) => T[k][l === "en" ? 1 : 0];

// نص قابل للتعديل من الإعدادات: المفتاح k له نسختان k.ar و k.en (الإنجليزية تعود للعربية إن كانت فارغة)
export const txt = (s: Record<string, string>, l: Lang, k: string) => (l === "en" ? s[`${k}.en`] || s[`${k}.ar`] : s[`${k}.ar`]) ?? "";
