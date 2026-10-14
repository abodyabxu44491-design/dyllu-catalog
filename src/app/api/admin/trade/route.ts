// Copyright (c) 2026 Abdullah Al-Sakni. All rights reserved. DYLLU Catalog.
import { NextResponse } from "next/server";
import { z } from "zod";
import { denyUnlessAdmin } from "@/lib/adminAuth";
import { errMsg } from "@/lib/apiError";
import { db } from "@/lib/db";
import { genCode } from "@/lib/admin/codes";
import { isPhone, normalizePhone } from "@/lib/phone";
const phone = z
  .string()
  .trim()
  .refine((v) => isPhone(v), "رقم الجوال غير صحيح")
  .transform(normalizePhone);
const Create = z.object({ name: z.string().trim().min(1, "اكتب اسم المحل").max(120), phone });
const Update = z.object({
  id: z.number().int(),
  phone: phone.optional(),
  tradeAccess: z.boolean().optional(),
  signOut: z.boolean().optional(),
});
// Shop accounts for the DYLLU Trade app are wholesale codes with tradeAccess + a registered phone
export async function POST(req: Request) {
  const deny = await denyUnlessAdmin();
  if (deny) return deny;
  try {
    const b = Create.parse(await req.json());
    const c = await db.wholesaleCode.create({ data: { name: b.name, phone: b.phone, tradeAccess: true, code: genCode() } });
    return NextResponse.json(c);
  } catch (e) {
    return NextResponse.json({ error: errMsg(e) }, { status: 400 });
  }
}
export async function PUT(req: Request) {
  const deny = await denyUnlessAdmin();
  if (deny) return deny;
  try {
    const b = Update.parse(await req.json()),
      cur = await db.wholesaleCode.findUniqueOrThrow({ where: { id: b.id } });
    if (b.tradeAccess && !(b.phone ?? cur.phone)) return NextResponse.json({ error: "أضف رقم جوال المحل أولًا" }, { status: 400 });
    const c = await db.wholesaleCode.update({
      where: { id: b.id },
      data: {
        ...(b.phone !== undefined && { phone: b.phone }),
        ...(b.tradeAccess !== undefined && { tradeAccess: b.tradeAccess }),
        // Changing the phone or signing out invalidates every device logged in with the old session
        ...((b.signOut || (b.phone !== undefined && b.phone !== cur.phone) || b.tradeAccess === false) && {
          sessionVersion: { increment: 1 },
        }),
      },
    });
    return NextResponse.json(c);
  } catch (e) {
    return NextResponse.json({ error: errMsg(e) }, { status: 400 });
  }
}
