// Copyright (c) 2026 Abdullah Al-Sakni. All rights reserved. DYLLU Catalog.
import { NextResponse } from "next/server";
import { OrderStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { currentRep } from "@/lib/repAuth";
export async function PUT(req: Request) {
  const rep = await currentRep();
  if (!rep) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id, status } = await req.json().catch(() => ({}));
  if (!(status in OrderStatus)) return NextResponse.json({ error: "حالة غير صحيحة" }, { status: 400 });
  const r = await db.order.updateMany({ where: { id: Number(id), repId: rep.id }, data: { status } });
  return r.count ? NextResponse.json({ ok: true }) : NextResponse.json({ error: "الطلب غير موجود" }, { status: 404 });
}
