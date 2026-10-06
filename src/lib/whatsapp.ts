type O = { number: string; total: unknown; hasUnpriced: boolean; notes?: string | null; isWholesale?: boolean; rep?: { name: string } | null; items: { nameSnapshot: string; unitPrice: unknown; quantity: number }[]; customer: { name: string; phone: string; company?: string | null; city?: string | null } };
export function buildWhatsAppMessage(o: O, cur = "ريال", hidden = "غير محدد", link?: string) {
  const lines = o.items.map((it, i) => {
    const up = it.unitPrice === null ? null : Number(it.unitPrice);
    return `${i + 1}. ${it.nameSnapshot}\nالكمية: ${it.quantity}\nالسعر: ${up === null ? hidden : `${up} ${cur}`}` + (up === null ? "" : `\nالإجمالي: ${up * it.quantity} ${cur}`);
  });
  const head = o.hasUnpriced ? "أرغب في طلب عرض سعر للمنتجات التالية من DYLLU:" : "أرغب في طلب المنتجات التالية من DYLLU:";
  const hi = o.rep ? `السلام عليكم ${o.rep.name}،` : "السلام عليكم،";
  const who = o.customer.name && o.customer.name !== "بدون اسم" ? `الاسم: ${o.customer.name}\n` : "";
  const extra = (o.customer.company ? `\nالشركة: ${o.customer.company}` : "") + (o.customer.city ? `\nالمدينة: ${o.customer.city}` : "") + (o.notes ? `\nملاحظات: ${o.notes}` : "");
  return `${hi}\n${head}${o.isWholesale ? " (طلب جملة)" : ""}\nرقم الطلب: ${o.number}\n\n${lines.join("\n\n")}\n------------------\nالإجمالي: ${Number(o.total)} ${cur}${o.hasUnpriced ? " (+ منتجات بسعر غير محدد)" : ""}\n\nبيانات العميل:\n${who}الجوال: ${o.customer.phone}${extra}${link ? `\n\nملخص الطلب: ${link}` : ""}\n\nشكرًا.`;
}
// يحوّل الأرقام المحلية السعودية (05xxxxxxxx أو 5xxxxxxxx أو 00966...) إلى الصيغة الدولية المطلوبة في wa.me
export function normalizePhone(raw: string) {
  let d = String(raw ?? "").replace(/\D/g, "");
  if (d.startsWith("00")) d = d.slice(2);
  if (/^05\d{8}$/.test(d)) d = "966" + d.slice(1); else if (/^5\d{8}$/.test(d)) d = "966" + d;
  return d;
}
export const whatsappUrl = (num: string, msg: string) => `https://wa.me/${normalizePhone(num)}?text=${encodeURIComponent(msg)}`;
