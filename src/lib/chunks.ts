// Copyright (c) 2026 Abdullah Al-Sakni. All rights reserved. DYLLU Catalog.
// Cloudflare D1 accepts at most 100 bound values per query, so long id lists are sent in parts
export const D1_MAX_VARS = 90;
export function chunks<T>(list: T[], size = D1_MAX_VARS): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < list.length; i += size) out.push(list.slice(i, i + size));
  return out;
}
