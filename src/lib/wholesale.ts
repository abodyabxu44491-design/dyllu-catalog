// Copyright (c) 2026 Abdullah Al-Sakni. All rights reserved. DYLLU Catalog.
import { cache } from "react";
import { cookies } from "next/headers";
import { cdb } from "./cache";
import { verifyToken } from "./session";
export const WS_COOKIE = "dyllu_ws";
export const getWholesale = cache(async () => {
  const id = await verifyToken("ws", (await cookies()).get(WS_COOKIE)?.value);
  if (!id) return null;
  const c = await cdb.wholesaleCode.findUnique({ where: { id } });
  return c && c.isActive ? { id: c.id, name: c.name } : null;
});
