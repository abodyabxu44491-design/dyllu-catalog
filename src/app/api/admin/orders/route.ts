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
  const id = Number(b.id);
  if (!id || typeof b.archive !== "boolean") return NextResponse.json({ error: "bad request" }, { status: 400 });
  await db.order.update({ where: { id }, data: { archivedAt: b.archive ? new Date() : null } });
  return NextResponse.json({ ok: true });
}
// Permanent delete is allowed only for archived orders; customers and products are not touched
export async function DELETE(req: Request) {
  const deny = await denyUnlessAdmin();
  if (deny) return deny;
  const id = Number(new URL(req.url).searchParams.get("id"));
  const o = id ? await db.order.findUnique({ where: { id }, select: { archivedAt: true } }) : null;
  if (!o) return NextResponse.json({ error: "الطلب غير موجود" }, { status: 404 });
  if (!o.archivedAt) return NextResponse.json({ error: "أرشف الطلب أولًا ثم احذفه" }, { status: 400 });
  await db.order.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
export async function PUT(req: Request) {
  const deny = await denyUnlessAdmin();
  if (deny) return deny;
  const { id, status } = await req.json();
  if (!(status in OrderStatus)) return NextResponse.json({ error: "bad status" }, { status: 400 });
  return NextResponse.json(await db.order.update({ where: { id }, data: { status } }));
}
