// Copyright (c) 2026 Abdullah Al-Sakni. All rights reserved. DYLLU Catalog.
import { NextResponse } from "next/server";
import { z } from "zod";
import { denyUnlessAdmin } from "@/lib/adminAuth";
import { db } from "@/lib/db";
import { errMsg } from "@/lib/apiError";
import { englishFor } from "@/lib/translate";
export const maxDuration = 30;
const O = z
  .object({
    id: z.number().int().optional(),
    nameAr: z.string().trim().min(2, "اكتب اسم العرض"),
    percent: z.number().int().min(1, "نسبة الخصم من 1 إلى 90").max(90, "نسبة الخصم من 1 إلى 90"),
    scope: z.enum(["all", "categories", "products"]),
    categoryIds: z.array(z.number().int()).default([]),
    productIds: z.array(z.number().int()).default([]),
    includeWholesale: z.boolean().default(false),
    startsAt: z.string().nullish(),
    endsAt: z.string().nullish(),
    isActive: z.boolean().default(true),
  })
  .superRefine((o, c) => {
    if (o.scope === "categories" && !o.categoryIds.length) c.addIssue({ code: "custom", message: "اختر تصنيفًا واحدًا على الأقل" });
    if (o.scope === "products" && !o.productIds.length) c.addIssue({ code: "custom", message: "اختر منتجًا واحدًا على الأقل" });
    if (o.startsAt && o.endsAt && new Date(o.endsAt) <= new Date(o.startsAt))
      c.addIssue({ code: "custom", message: "تاريخ النهاية يجب أن يكون بعد البداية" });
  });
const date = (v?: string | null) => (v ? new Date(v) : null);
export async function POST(req: Request) {
  const deny = await denyUnlessAdmin();
  if (deny) return deny;
  try {
    const { id, startsAt, endsAt, ...d } = O.parse(await req.json());
    const prev = id ? await db.offer.findUnique({ where: { id } }) : null;
    const [nameEn] = await englishFor([{ ar: d.nameAr, prevAr: prev?.nameAr, prevEn: prev?.nameEn, title: true }]);
    const data = {
      ...d,
      nameEn,
      categoryIds: d.scope === "categories" ? d.categoryIds : [],
      productIds: d.scope === "products" ? d.productIds : [],
      startsAt: date(startsAt),
      endsAt: date(endsAt),
    };
    return NextResponse.json(id ? await db.offer.update({ where: { id }, data }) : await db.offer.create({ data }));
  } catch (e) {
    return NextResponse.json({ error: errMsg(e) }, { status: 400 });
  }
}
export async function PATCH(req: Request) {
  const deny = await denyUnlessAdmin();
  if (deny) return deny;
  const { id, isActive } = await req.json().catch(() => ({}));
  return NextResponse.json(await db.offer.update({ where: { id: Number(id) }, data: { isActive: !!isActive } }));
}
export async function DELETE(req: Request) {
  const deny = await denyUnlessAdmin();
  if (deny) return deny;
  await db.offer.deleteMany({ where: { id: Number(new URL(req.url).searchParams.get("id")) } });
  return NextResponse.json({ ok: true });
}
