// Copyright (c) 2026 Abdullah Al-Sakni. All rights reserved. DYLLU Catalog.
import { NextResponse } from "next/server";
import { z } from "zod";
import { currentAdmin, denyUnlessAdmin } from "@/lib/adminAuth";
import { announce } from "@/lib/push";
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
    const raw = await req.json();
    const { id, startsAt, endsAt, ...d } = O.parse(raw);
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
    const saved = id ? await db.offer.update({ where: { id }, data }) : await db.offer.create({ data });
    // New offer (or an edit the admin chose to announce): notify customers now, or when it starts
    const notify = typeof raw?.notify === "boolean" ? raw.notify : !id;
    const push = notify && saved.isActive && (!saved.endsAt || saved.endsAt > new Date()) ? await offerNotice(saved) : null;
    return NextResponse.json({ ...saved, push });
  } catch (e) {
    return NextResponse.json({ error: errMsg(e) }, { status: 400 });
  }
}
async function offerNotice(o: {
  id: number;
  nameAr: string;
  percent: number;
  scope: string;
  categoryIds: unknown;
  productIds: unknown;
  startsAt: Date | null;
  endsAt: Date | null;
}) {
  const ids = (v: unknown) => (Array.isArray(v) ? v.map(Number).filter(Number.isInteger) : []);
  const cats = ids(o.categoryIds),
    prods = ids(o.productIds);
  let url = "/products",
    on = "كل المنتجات";
  if (o.scope === "categories" && cats.length) {
    const c = await db.category.findMany({ where: { id: { in: cats } }, select: { slug: true, nameAr: true } });
    on =
      c
        .map((x) => x.nameAr)
        .slice(0, 3)
        .join("، ") + (c.length > 3 ? " وغيرها" : "");
    if (c.length === 1) url = `/categories/${c[0].slug}`;
  } else if (o.scope === "products" && prods.length) {
    const p = await db.product.findMany({ where: { id: { in: prods } }, select: { slug: true, nameAr: true }, take: 4 });
    on = prods.length === 1 && p[0] ? p[0].nameAr : `${prods.length} منتج مختار`;
    if (prods.length === 1 && p[0]) url = `/products/${p[0].slug}`;
  }
  const until = o.endsAt
    ? ` حتى ${o.endsAt.toLocaleDateString("ar-SA-u-nu-latn", { timeZone: "Asia/Riyadh", day: "numeric", month: "long" })}`
    : "";
  return announce(
    { title: `عرض جديد: ${o.nameAr}`, body: `خصم ${o.percent}% على ${on}${until}`, url },
    { source: `offer:${o.id}`, startsAt: o.startsAt, createdBy: (await currentAdmin())?.name },
  ).catch(() => null);
}
export async function PATCH(req: Request) {
  const deny = await denyUnlessAdmin();
  if (deny) return deny;
  const { id, isActive } = await req.json().catch(() => ({}));
  // A paused offer does not announce itself later
  if (!isActive) await db.announcement.deleteMany({ where: { source: `offer:${Number(id)}`, status: "scheduled" } });
  return NextResponse.json(await db.offer.update({ where: { id: Number(id) }, data: { isActive: !!isActive } }));
}
export async function DELETE(req: Request) {
  const deny = await denyUnlessAdmin();
  if (deny) return deny;
  const id = Number(new URL(req.url).searchParams.get("id"));
  await db.offer.deleteMany({ where: { id } });
  await db.announcement.deleteMany({ where: { source: `offer:${id}`, status: "scheduled" } });
  return NextResponse.json({ ok: true });
}
