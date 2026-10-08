import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { SESSION_COOKIE, verifySession } from "@/lib/session";
// الخروج يرفع sessionVersion فيُبطل الجلسة على كل الأجهزة، لا مجرد حذف الكوكي من هذا المتصفح.
// يرجع دائمًا لصفحة الدخول ويحذف الكوكي، حتى لو كانت الجلسة منتهية أو تعذر الوصول لقاعدة البيانات
export async function POST(req: Request) {
  try {
    const s = await verifySession(cookies().get(SESSION_COOKIE)?.value);
    if (s) await db.adminUser.updateMany({ where: { id: s.id, sessionVersion: s.ver }, data: { sessionVersion: { increment: 1 } } });
  } catch (e) { console.error("[logout]", e); }
  const r = NextResponse.redirect(new URL("/admin-login", req.url), 303);
  r.cookies.set(SESSION_COOKIE, "", { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 0 });
  return r;
}
