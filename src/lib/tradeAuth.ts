// Copyright (c) 2026 Abdullah Al-Sakni. All rights reserved. DYLLU Catalog.
import { cache } from "react";
import { cookies, headers } from "next/headers";
import { db } from "./db";
import { TRADE_COOKIE, verifyTradeKey } from "./session";
// The shop's private key comes from the link (?k=), the app header, or the cookie set on first open.
// Checked against the database on every request, so disabling a shop or changing its link applies immediately.
export const currentTrade = cache(async (fromUrl?: string | null) => {
  const s =
    (await verifyTradeKey(fromUrl)) ??
    (await verifyTradeKey((await headers()).get("x-trade-key"))) ??
    (await verifyTradeKey((await cookies()).get(TRADE_COOKIE)?.value));
  if (!s) return null;
  const c = await db.wholesaleCode.findUnique({
    where: { id: s.id },
    select: { id: true, name: true, isActive: true, tradeAccess: true, sessionVersion: true },
  });
  return c && c.isActive && c.tradeAccess && c.sessionVersion === s.ver ? { id: c.id, name: c.name } : null;
});
