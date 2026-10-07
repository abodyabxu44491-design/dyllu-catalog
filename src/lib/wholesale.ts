import { cache } from "react";
import { cookies } from "next/headers";
import { db } from "./db";
import { verifyToken } from "./session";
export const WS_COOKIE = "dyllu_ws";
// يرجع بيانات عميل الجملة إذا كوكيه سليم وكوده ما زال فعّالًا، وإلا null. السيرفر وحده يقرر الأسعار.
export const getWholesale = cache(async () => {
  const id = await verifyToken("ws", cookies().get(WS_COOKIE)?.value);
  if (!id) return null;
  const c = await db.wholesaleCode.findUnique({ where: { id } });
  return c && c.isActive ? { id: c.id, name: c.name } : null;
});
