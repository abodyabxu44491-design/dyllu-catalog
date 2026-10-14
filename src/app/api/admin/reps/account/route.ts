// Copyright (c) 2026 Abdullah Al-Sakni. All rights reserved. DYLLU Catalog.
import { NextResponse } from "next/server";
import { denyUnlessAdmin } from "@/lib/adminAuth";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { isPhone } from "@/lib/phone";
export async function POST(req: Request) {
  const deny = await denyUnlessAdmin();
  if (deny) return deny;
  const { repId, password, isActive = true } = await req.json().catch(() => ({}));
  const rep = await db.rep.findUnique({ where: { id: Number(repId) }, include: { account: { select: { id: true } } } });
  if (!rep) return NextResponse.json({ error: "المندوب غير موجود" }, { status: 404 });
  if (!isPhone(rep.phone)) return NextResponse.json({ error: "أضف رقم جوال صحيح للمندوب أولًا (يدخل به)" }, { status: 400 });
  const pw = typeof password === "string" ? password.trim() : "";
  if (pw && pw.length < 6) return NextResponse.json({ error: "كلمة المرور 6 أحرف على الأقل" }, { status: 400 });
  if (!rep.account && !pw) return NextResponse.json({ error: "اكتب كلمة مرور للحساب" }, { status: 400 });
  const dup = await db.repAccount.findFirst({
    where: { repId: { not: rep.id }, rep: { phone: rep.phone } },
    select: { rep: { select: { name: true } } },
  });
  if (dup) return NextResponse.json({ error: `نفس الرقم مستخدم لحساب ${dup.rep.name}` }, { status: 400 });
  const bump = pw || !isActive ? { sessionVersion: { increment: 1 } } : {};
  await db.repAccount.upsert({
    where: { repId: rep.id },
    create: { repId: rep.id, passwordHash: hashPassword(pw), isActive: !!isActive },
    update: { isActive: !!isActive, ...(pw && { passwordHash: hashPassword(pw) }), ...bump },
  });
  return NextResponse.json({ ok: true });
}
export async function DELETE(req: Request) {
  const deny = await denyUnlessAdmin();
  if (deny) return deny;
  await db.repAccount.deleteMany({ where: { repId: Number(new URL(req.url).searchParams.get("repId")) } });
  return NextResponse.json({ ok: true });
}
