import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { SESSION_COOKIE, verifySession } from "@/lib/session";
// الخروج يرفع sessionVersion فيُبطل الجلسة على كل الأجهزة، لا مجرد حذف الكوكي من هذا المتصفح
export async function POST(req: Request) {
  const s = await verifySession(cookies().get(SESSION_COOKIE)?.value);
  if (s) await db.adminUser.updateMany({ where: { id: s.id, sessionVersion: s.ver }, data: { sessionVersion: { increment: 1 } } });
  const r = NextResponse.redirect(new URL("/admin-login", req.url), 303); r.cookies.delete(SESSION_COOKIE); return r;
}
