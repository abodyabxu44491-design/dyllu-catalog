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
const Create = z.object({
  name: z.string().trim().min(1, "اكتب اسم المحل").max(120),
  phone: phone.optional().or(z.literal("").transform(() => undefined)),
});
const Update = z.object({
  id: z.number().int(),
  phone: phone.optional().or(z.literal("").transform(() => null)),
  tradeAccess: z.boolean().optional(),
  signOut: z.boolean().optional(),
});
// Shop accounts for the DYLLU Trade app are wholesale codes with tradeAccess; each gets a private link (see tradeKey)
export async function POST(req: Request) {
  const deny = await denyUnlessAdmin();
  if (deny) return deny;
  try {
    const b = Create.parse(await req.json());
    const c = await db.wholesaleCode.create({ data: { name: b.name, phone: b.phone ?? null, tradeAccess: true, code: genCode() } });
    return NextResponse.json(c);
  } catch (e) {
    return NextResponse.json({ error: errMsg(e) }, { status: 400 });
  }
}
export async function PUT(req: Request) {
  const deny = await denyUnlessAdmin();
  if (deny) return deny;
  try {
    const b = Update.parse(await req.json());
    const c = await db.wholesaleCode.update({
      where: { id: b.id },
      data: {
        ...(b.phone !== undefined && { phone: b.phone }),
        ...(b.tradeAccess !== undefined && { tradeAccess: b.tradeAccess }),
        // A new link (signOut) or disabling access invalidates the old private link on every device
        ...((b.signOut || b.tradeAccess === false) && {
          sessionVersion: { increment: 1 },
        }),
      },
    });
    return NextResponse.json(c);
  } catch (e) {
    return NextResponse.json({ error: errMsg(e) }, { status: 400 });
  }
}
