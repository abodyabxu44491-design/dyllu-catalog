// Copyright (c) 2026 Abdullah Al-Sakni. All rights reserved. DYLLU Catalog.
import { NextResponse } from "next/server";
import { denyUnlessAdmin } from "@/lib/adminAuth";
import { OrderStatus } from "@prisma/client";
import { db } from "@/lib/db";
const DONE = ["COMPLETED", "CANCELLED"] as const;
// archive: true/false archives or restores one order; action "archiveDone" archives every completed or cancelled order
export async function PATCH(req: Request) {
  const deny = await denyUnlessAdmin();
  if (deny) return deny;
  const b = await req.json().catch(() => ({}));
  if (b.action === "archiveDone") {
    const r = await db.order.updateMany({ where: { archivedAt: null, status: { in: [...DONE] } }, data: { archivedAt: new Date() } });
    return NextResponse.json({ ok: true, count: r.count });
  }
  const ids = idList(b.ids ?? [b.id]);
  if (!ids.length || typeof b.archive !== "boolean") return NextResponse.json({ error: "bad request" }, { status: 400 });
  const r = await db.order.updateMany({ where: { id: { in: ids } }, data: { archivedAt: b.archive ? new Date() : null } });
  return NextResponse.json({ ok: true, count: r.count });
}
const idList = (v: unknown) =>
  [...new Set((Array.isArray(v) ? v : []).map(Number))].filter((n) => Number.isInteger(n) && n > 0).slice(0, 500);
// Permanent delete of one order (?id=) or several ({ ids }). Order items go with the order; customers and products stay.
export async function DELETE(req: Request) {
  const deny = await denyUnlessAdmin();
  if (deny) return deny;
  const one = new URL(req.url).searchParams.get("id");
  const ids = idList(one ? [one] : (await req.json().catch(() => ({}))).ids);
  if (!ids.length) return NextResponse.json({ error: "اختر طلبًا واحدًا على الأقل" }, { status: 400 });
  const r = await db.order.deleteMany({ where: { id: { in: ids } } });
  if (!r.count) return NextResponse.json({ error: "الطلب غير موجود" }, { status: 404 });
  return NextResponse.json({ ok: true, count: r.count });
}
export async function PUT(req: Request) {
  const deny = await denyUnlessAdmin();
  if (deny) return deny;
  const { id, status } = await req.json();
  if (!(status in OrderStatus)) return NextResponse.json({ error: "bad status" }, { status: 400 });
  return NextResponse.json(await db.order.update({ where: { id }, data: { status } }));
}
