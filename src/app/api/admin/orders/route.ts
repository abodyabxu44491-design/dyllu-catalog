// Copyright (c) 2026 Abdullah Al-Sakni. All rights reserved. DYLLU Catalog.
import { NextResponse } from "next/server";
import { denyUnlessAdmin } from "@/lib/adminAuth";
import { OrderStatus } from "@prisma/client";
import { db } from "@/lib/db";
export async function PUT(req: Request) {
  const deny = await denyUnlessAdmin();
  if (deny) return deny;
  const { id, status } = await req.json();
  if (!(status in OrderStatus)) return NextResponse.json({ error: "bad status" }, { status: 400 });
  return NextResponse.json(await db.order.update({ where: { id }, data: { status } }));
}
