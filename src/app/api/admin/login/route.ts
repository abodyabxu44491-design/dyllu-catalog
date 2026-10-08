import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { checkPassword } from "@/lib/password";
import { SESSION_COOKIE, sessionSecret, signSession } from "@/lib/session";
import { ipOf, limited } from "@/lib/ratelimit";
export async function POST(req: Request) {
  if (limited(`login:${ipOf(req)}`, 8, 5 * 60_000)) return NextResponse.json({ error: "محاولات كثيرة، حاول بعد 5 دقائق" }, { status: 429 });
  if (!sessionSecret()) return NextResponse.json({ error: "إعدادات السيرفر غير مكتملة: أضف DATABASE_URL و ADMIN_SESSION_SECRET في متغيرات البيئة" }, { status: 500 });
  const { email, password } = await req.json().catch(() => ({ email: "", password: "" }));
  const u = await db.adminUser.findUnique({ where: { email: String(email ?? "").trim().toLowerCase() } });
  const pw = String(password ?? "");
  // كلمة المرور كما كُتبت، أو بدون مسافات زائدة في أولها/آخرها (لصق من الجوال يضيفها أحيانًا)
  if (!u || !(checkPassword(pw, u.passwordHash) || (pw.trim() !== pw && checkPassword(pw.trim(), u.passwordHash)))) return NextResponse.json({ error: "البريد أو كلمة المرور غير صحيحة" }, { status: 401 });
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, await signSession(u.id, u.sessionVersion), { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 7 * 86400 });
  return res;
}
