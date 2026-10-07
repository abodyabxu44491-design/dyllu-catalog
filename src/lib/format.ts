type PP = { price: unknown; showPrice: boolean; wholesalePrice?: unknown };
// السعر الفعلي: عميل الجملة يرى سعر الجملة (إن وُجد)، والبقية يرون السعر العادي إن كان ظاهرًا. null = "تواصل معنا"
export function priceOf(p: PP, ws = false): number | null {
  if (ws && p.wholesalePrice != null) return Number(p.wholesalePrice);
  return p.showPrice && p.price != null ? Number(p.price) : null;
}
export const isWsPrice = (p: PP, ws = false) => ws && p.wholesalePrice != null;
export function priceLabel(p: PP, s: Record<string, string>, lang = "ar", ws = false) {
  const en = lang === "en", v = priceOf(p, ws);
  if (v != null) return `${v} ${en ? s["currency.en"] ?? "SAR" : s["currency.ar"]}`;
  return en ? "Contact us" : s["price.hiddenLabel.ar"];
}
// رقم الصفحة من الرابط: أي قيمة غير صالحة (نص، صفر، سالب، كسر) تصبح 1
export const pageParam = (v: unknown) => { const n = Math.floor(Number(v)); return Number.isFinite(n) && n >= 1 ? n : 1; };
