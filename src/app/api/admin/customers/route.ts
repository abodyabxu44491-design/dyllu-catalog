// Copyright (c) 2026 Abdullah Al-Sakni. All rights reserved. DYLLU Catalog.
import { NextResponse } from "next/server";
import { z } from "zod";
import { denyUnlessAdmin } from "@/lib/adminAuth";
import { db } from "@/lib/db";
const Body = z.object({ id: z.number().int(), repId: z.number().int().nullable() });
// Changes the representative responsible for a customer (null removes the assignment)
export async function PATCH(req: Request) {
  const deny = await denyUnlessAdmin();
  if (deny) return deny;
  const b = Body.safeParse(await req.json().catch(() => null));
  if (!b.success) return NextResponse.json({ error: "تحقق من البيانات" }, { status: 400 });
  if (b.data.repId && !(await db.rep.findUnique({ where: { id: b.data.repId } })))
    return NextResponse.json({ error: "المندوب غير موجود" }, { status: 400 });
  await db.customer.update({ where: { id: b.data.id }, data: { repId: b.data.repId } });
  return NextResponse.json({ ok: true });
}
