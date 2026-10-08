// Copyright (c) 2026 Abdullah Al-Sakni. All rights reserved. DYLLU Catalog.
export const toAsciiDigits = (s: string) =>
  String(s ?? "")
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0));
export function normalizePhone(raw: string) {
  let d = toAsciiDigits(raw).replace(/\D/g, "");
  if (d.startsWith("00")) d = d.slice(2);
  if (/^9660\d{9}$/.test(d)) d = "966" + d.slice(4);
  if (/^05\d{8}$/.test(d)) d = "966" + d.slice(1);
  else if (/^5\d{8}$/.test(d)) d = "966" + d;
  else if (/^0(1[1-7]|1)\d{7}$/.test(d)) d = "966" + d.slice(1);
  return d;
}
export const isPhone = (raw?: string | null) => {
  if (!raw || /x/i.test(raw)) return false;
  const d = normalizePhone(raw);
  return /^\d{8,15}$/.test(d) && !/^0[1-9]/.test(d) && !(/^9665/.test(d) && d.length !== 12);
};
export const isMobileSA = (raw: string) => /^9665\d{8}$/.test(normalizePhone(raw));
export function prettyPhone(raw: string) {
  const d = normalizePhone(raw),
    m = d.match(/^966(5\d)(\d{3})(\d{4})$/) ?? d.match(/^966(1\d)(\d{3})(\d{4})$/);
  return m ? `+966 ${m[1]} ${m[2]} ${m[3]}` : `+${d}`;
}
export const telHref = (raw: string) => `tel:+${normalizePhone(raw)}`;
export const waHref = (raw: string, text?: string) =>
  `https://wa.me/${normalizePhone(raw)}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
export function localPhone(raw: string) {
  const d = normalizePhone(raw);
  return /^966[15]\d{8}$/.test(d) ? "0" + d.slice(3) : raw;
}
