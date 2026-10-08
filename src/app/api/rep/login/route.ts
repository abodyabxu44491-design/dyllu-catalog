// Copyright (c) 2026 Abdullah Al-Sakni. All rights reserved. DYLLU Catalog.
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { checkPassword } from "@/lib/password";
import { normalizePhone } from "@/lib/phone";
import { REP_COOKIE, sessionSecret, signRepSession } from "@/lib/session";
import { repCookie } from "@/lib/repAuth";
import { ipOf, limited } from "@/lib/ratelimit";
export async function POST(req: Request) {
  if (limited(`replogin:${ipOf(req)}`, 8, 5 * 60_000))
    return NextResponse.json({ error: "محاولات كثيرة، حاول بعد 5 دقائق" }, { status: 429 });
  if (!sessionSecret()) return NextResponse.json({ error: "إعدادات السيرفر غير مكتملة" }, { status: 500 });
  const { phone, password } = await req.json().catch(() => ({}));
  const pw = String(password ?? ""),
    key = normalizePhone(String(phone ?? ""));
  const a = key.length >= 8 ? await db.repAccount.findFirst({ where: { rep: { phone: key } } }) : null;
  if (!a || !(checkPassword(pw, a.passwordHash) || (pw.trim() !== pw && checkPassword(pw.trim(), a.passwordHash))))
    return NextResponse.json({ error: "رقم الجوال أو كلمة المرور غير صحيحة" }, { status: 401 });
  if (!a.isActive) return NextResponse.json({ error: "حسابك موقوف، تواصل مع الإدارة" }, { status: 403 });
  await db.repAccount.update({ where: { id: a.id }, data: { lastLoginAt: new Date() } });
  const res = NextResponse.json({ ok: true });
  res.cookies.set(REP_COOKIE, await signRepSession(a.repId, a.sessionVersion), repCookie);
  return res;
}
