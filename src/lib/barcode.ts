// Copyright (c) 2026 Abdullah Al-Sakni. All rights reserved. DYLLU Catalog.
import { toAsciiDigits } from "./phone";
// Stored form: Arabic digits → ASCII, no spaces/dashes, uppercase (Code 128 can hold letters)
export const normalizeBarcode = (raw?: string | null) =>
  toAsciiDigits(String(raw ?? ""))
    .replace(/[\s\-–_.]/g, "")
    .toUpperCase()
    .slice(0, 64);
// UPC-A (12 digits) and EAN-13 with a leading 0 are the same code; scanners report either form
export function barcodeVariants(raw?: string | null) {
  const b = normalizeBarcode(raw);
  if (!b) return [];
  const v = new Set([b]);
  if (/^\d{12}$/.test(b)) v.add("0" + b);
  if (/^0\d{12}$/.test(b)) v.add(b.slice(1));
  return [...v];
}
