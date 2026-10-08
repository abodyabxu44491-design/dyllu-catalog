// Copyright (c) 2026 Abdullah Al-Sakni. All rights reserved. DYLLU Catalog.
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { checkPassword, hashPassword } from "@/lib/password";
import { currentRep, repCookie } from "@/lib/repAuth";
import { REP_COOKIE, signRepSession } from "@/lib/session";
export async function POST(req: Request) {
  const rep = await currentRep();
  if (!rep) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { current, next } = await req.json().catch(() => ({}));
  const a = await db.repAccount.findUnique({ where: { repId: rep.id } });
  if (!a || !checkPassword(String(current ?? ""), a.passwordHash))
    return NextResponse.json({ error: "كلمة المرور الحالية غير صحيحة" }, { status: 400 });
  const n = String(next ?? "").trim();
  if (n.length < 6) return NextResponse.json({ error: "كلمة المرور الجديدة 6 أحرف على الأقل" }, { status: 400 });
  const u = await db.repAccount.update({ where: { id: a.id }, data: { passwordHash: hashPassword(n), sessionVersion: { increment: 1 } } });
  const res = NextResponse.json({ ok: true });
  res.cookies.set(REP_COOKIE, await signRepSession(rep.id, u.sessionVersion), repCookie);
  return res;
}
