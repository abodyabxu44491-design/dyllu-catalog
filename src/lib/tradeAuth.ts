// Copyright (c) 2026 Abdullah Al-Sakni. All rights reserved. DYLLU Catalog.
import { cache } from "react";
import { cookies } from "next/headers";
import { db } from "./db";
import { TRADE_COOKIE, verifyTradeSession } from "./session";
// Checked against the database on every request, so disabling a shop or signing it out applies immediately
export const currentTrade = cache(async () => {
  const s = await verifyTradeSession(cookies().get(TRADE_COOKIE)?.value);
  if (!s) return null;
  const c = await db.wholesaleCode.findUnique({
    where: { id: s.id },
    select: { id: true, name: true, isActive: true, tradeAccess: true, sessionVersion: true },
  });
  return c && c.isActive && c.tradeAccess && c.sessionVersion === s.ver ? { id: c.id, name: c.name } : null;
});
