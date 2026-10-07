import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { db } from "./db";
import { SESSION_COOKIE, verifySession } from "./session";
// التحقق الكامل من الأدمن (سيرفر فقط): توقيع سليم + المستخدم ما زال موجودًا + نسخة الجلسة لم تُبطل
export async function currentAdmin() {
  const s = await verifySession(cookies().get(SESSION_COOKIE)?.value);
  if (!s) return null;
  const u = await db.adminUser.findUnique({ where: { id: s.id }, select: { id: true, email: true, name: true, sessionVersion: true } });
  return u && u.sessionVersion === s.ver ? u : null;
}
// لمسارات /api/admin: ترجع رد 401 إذا الجلسة غير صالحة، وإلا null
export async function denyUnlessAdmin() {
  return (await currentAdmin()) ? null : NextResponse.json({ error: "unauthorized" }, { status: 401 });
}
