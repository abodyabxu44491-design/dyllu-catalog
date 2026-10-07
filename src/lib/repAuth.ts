import { cache } from "react";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { db } from "./db";
import { REP_COOKIE, verifyRepSession } from "./session";
// المندوب الحالي (سيرفر فقط): توقيع سليم + الحساب فعّال + نسخة الجلسة لم تُبطل
export const currentRep = cache(async () => {
  const s = await verifyRepSession(cookies().get(REP_COOKIE)?.value);
  if (!s) return null;
  const a = await db.repAccount.findUnique({ where: { repId: s.id }, select: { isActive: true, sessionVersion: true, rep: { select: { id: true, name: true, location: true, phone: true, photo: true, isActive: true } } } });
  return a && a.isActive && a.sessionVersion === s.ver ? a.rep : null;
});
export async function denyUnlessRep() {
  return (await currentRep()) ? null : NextResponse.json({ error: "unauthorized" }, { status: 401 });
}
export const repCookie = { httpOnly: true, sameSite: "lax" as const, secure: process.env.NODE_ENV === "production", path: "/", maxAge: 30 * 86400 };
