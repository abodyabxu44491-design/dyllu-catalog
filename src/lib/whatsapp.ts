// Copyright (c) 2026 Abdullah Al-Sakni. All rights reserved. DYLLU Catalog.
type O = {
  number: string;
  total: unknown;
  hasUnpriced: boolean;
  notes?: string | null;
  isWholesale?: boolean;
  rep?: { name: string } | null;
  store?: { name: string } | null;
  items: { nameSnapshot: string; skuSnapshot?: string | null; unitPrice: unknown; quantity: number }[];
  customer: { name: string; phone: string; company?: string | null; city?: string | null };
};
// WhatsApp formatting: *bold*. Numbers use Latin digits with thousands separators, like the invoice page.
export function buildWhatsAppMessage(o: O, cur = "ريال", hidden = "غير محدد", link?: string) {
  const money = (n: number) => `${n.toLocaleString("en-US", { maximumFractionDigits: 2 })} ${cur}`;
  const pcs = o.items.reduce((n, it) => n + it.quantity, 0);
  const lines = o.items.map((it, i) => {
    const up = it.unitPrice === null || it.unitPrice === undefined ? null : Number(it.unitPrice);
    return [
      `${i + 1}) *${it.nameSnapshot}*`,
      it.skuSnapshot ? `   الكود: ${it.skuSnapshot}` : "",
      up === null ? `   الكمية: ${it.quantity} • السعر: ${hidden}` : `   ${it.quantity} × ${money(up)} = *${money(up * it.quantity)}*`,
    ]
      .filter(Boolean)
      .join("\n");
  });
  const hasName = o.customer.name && o.customer.name !== "بدون اسم";
  const customer = [
    hasName ? `الاسم: ${o.customer.name}` : "",
    `الجوال: ${o.customer.phone}`,
    o.customer.company ? `الشركة: ${o.customer.company}` : "",
    o.customer.city ? `المدينة: ${o.customer.city}` : "",
    o.store ? `عن طريق: ${o.store.name}` : "",
  ].filter(Boolean);
  return [
    o.rep ? `السلام عليكم ${o.rep.name} 👋` : "السلام عليكم 👋",
    o.hasUnpriced ? "أرغب في *عرض سعر* للمنتجات التالية من DYLLU" : "أرغب في *طلب* المنتجات التالية من DYLLU",
    "",
    `🧾 رقم الطلب: *${o.number}*${o.isWholesale ? " (طلب جملة)" : ""}`,
    `📦 ${o.items.length} ${o.items.length === 1 ? "صنف" : "أصناف"} • ${pcs} قطعة`,
    "",
    lines.join("\n\n"),
    "",
    "────────────",
    `*الإجمالي: ${money(Number(o.total))}*${o.hasUnpriced ? "\n(+ منتجات سعرها عند الطلب)" : ""}`,
    "",
    "*بيانات العميل*",
    customer.join("\n"),
    o.notes ? `\n*ملاحظات:* ${o.notes}` : "",
    link ? `\n🔗 الفاتورة: ${link}` : "",
    "",
    "شكرًا لكم 🌿",
  ]
    .filter((x, i, a) => !(x === "" && a[i - 1] === ""))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
import { normalizePhone } from "./phone";
export { normalizePhone };
export const whatsappUrl = (num: string, msg: string) => `https://wa.me/${normalizePhone(num)}?text=${encodeURIComponent(msg)}`;
