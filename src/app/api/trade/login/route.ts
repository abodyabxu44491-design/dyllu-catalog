// Copyright (c) 2026 Abdullah Al-Sakni. All rights reserved. DYLLU Catalog.
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { normalizePhone } from "@/lib/phone";
import { ipOf, limited } from "@/lib/ratelimit";
import { TRADE_COOKIE, signTradeSession } from "@/lib/session";
const BAD = "الكود أو رقم الجوال غير صحيح، أو الحساب غير مفعّل";
export async function POST(req: Request) {
  const b = await req.json().catch(() => ({}));
  const code = String(b.code ?? "")
      .trim()
      .toUpperCase(),
    phone = normalizePhone(String(b.phone ?? ""));
  if (limited(`trade:${ipOf(req)}`, 8, 5 * 60_000) || limited(`trade-code:${code}`, 8, 5 * 60_000))
    return NextResponse.json({ error: "محاولات كثيرة، انتظر خمس دقائق" }, { status: 429 });
  if (!code || !phone) return NextResponse.json({ error: "اكتب الكود ورقم الجوال" }, { status: 400 });
  const c = await db.wholesaleCode.findUnique({ where: { code } });
  if (!c || !c.isActive || !c.tradeAccess || !c.phone || normalizePhone(c.phone) !== phone)
    return NextResponse.json({ error: BAD }, { status: 401 });
  await db.wholesaleCode.update({ where: { id: c.id }, data: { lastUsedAt: new Date() } });
  const res = NextResponse.json({ ok: true, name: c.name });
  res.cookies.set(TRADE_COOKIE, await signTradeSession(c.id, c.sessionVersion), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 90 * 86400,
  });
  return res;
}
export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(TRADE_COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}
