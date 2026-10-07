import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { checkPassword } from "@/lib/password";
import { SESSION_COOKIE, signSession } from "@/lib/session";
import { ipOf, limited } from "@/lib/ratelimit";
export async function POST(req: Request) {
  if (limited(`login:${ipOf(req)}`, 8, 5 * 60_000)) return NextResponse.json({ error: "محاولات كثيرة، حاول بعد 5 دقائق" }, { status: 429 });
  if (!process.env.ADMIN_SESSION_SECRET) return NextResponse.json({ error: "ADMIN_SESSION_SECRET غير مضبوط في ملف .env" }, { status: 500 });
  const { email, password } = await req.json().catch(() => ({ email: "", password: "" }));
  const u = await db.adminUser.findUnique({ where: { email: String(email ?? "").trim().toLowerCase() } });
  if (!u || !checkPassword(String(password), u.passwordHash)) return NextResponse.json({ error: "بيانات غير صحيحة" }, { status: 401 });
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, await signSession(u.id, u.sessionVersion), { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 7 * 86400 });
  return res;
}
