type Off = { pct: number; wholesale: boolean } | null | undefined;
type PP = { price: unknown; showPrice: boolean; wholesalePrice?: unknown; offer?: Off };
// السعر قبل العروض: عميل الجملة يرى سعر الجملة (إن وُجد)، والبقية يرون السعر العادي إن كان ظاهرًا. null = "تواصل معنا"
export function basePrice(p: PP, ws = false): number | null {
  if (ws && p.wholesalePrice != null) return Number(p.wholesalePrice);
  return p.showPrice && p.price != null ? Number(p.price) : null;
}
export const isWsPrice = (p: PP, ws = false) => ws && p.wholesalePrice != null;
// هل ينطبق العرض على هذا السعر؟ (أسعار الجملة لا يشملها العرض إلا إن فُعّل ذلك في العرض)
const offerOn = (p: PP, ws: boolean) => !!p.offer && basePrice(p, ws) != null && (!isWsPrice(p, ws) || p.offer.wholesale);
// السعر الفعلي بعد الخصم (مقرّب لأقرب هللة)
export function priceOf(p: PP, ws = false): number | null {
  const b = basePrice(p, ws);
  if (b == null || !offerOn(p, ws)) return b;
  return Math.round(b * (100 - p.offer!.pct)) / 100;
}
// السعر قبل الخصم ليظهر مشطوبًا (null إن لم يوجد عرض)
export const oldPriceOf = (p: PP, ws = false) => (offerOn(p, ws) ? basePrice(p, ws) : null);
export const discountOf = (p: PP, ws = false) => (offerOn(p, ws) ? p.offer!.pct : 0);
const fmt = (v: number) => (Number.isInteger(v) ? String(v) : v.toFixed(2));
export function priceLabel(p: PP, s: Record<string, string>, lang = "ar", ws = false) {
  const en = lang === "en", v = priceOf(p, ws);
  if (v != null) return `${fmt(v)} ${en ? s["currency.en"] ?? "SAR" : s["currency.ar"]}`;
  return en ? "Contact us" : s["price.hiddenLabel.ar"];
}
export const moneyLabel = (v: number, s: Record<string, string>, lang = "ar") => `${fmt(v)} ${lang === "en" ? s["currency.en"] ?? "SAR" : s["currency.ar"]}`;
// رقم الصفحة من الرابط: أي قيمة غير صالحة (نص، صفر، سالب، كسر) تصبح 1
export const pageParam = (v: unknown) => { const n = Math.floor(Number(v)); return Number.isFinite(n) && n >= 1 ? n : 1; };
