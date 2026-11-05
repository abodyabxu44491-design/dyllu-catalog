// Copyright (c) 2026 Abdullah Al-Sakni. All rights reserved. DYLLU Catalog.
import { NextResponse } from "next/server";
import { errMsg } from "@/lib/apiError";
import { currentAdmin, denyUnlessAdmin } from "@/lib/adminAuth";
import { announce } from "@/lib/push";
import { z } from "zod";
import { db } from "@/lib/db";
import { englishFor } from "@/lib/translate";
export const maxDuration = 30;
const txt = z.string().max(160).nullish();
const B = z
  .object({
    id: z.number().optional(),
    type: z.enum(["IMAGE", "IMAGE_TEXT", "PRODUCT"]),
    image: z.string().default(""),
    productId: z.number().int().nullish(),
    template: z.enum(["spotlight", "lime", "clean", "offer", "split"]).default("spotlight"),
    showPrice: z.boolean().default(true),
    titleAr: txt,
    subtitleAr: txt,
    buttonAr: z.string().max(30).nullish(),
    badgeAr: z.string().max(30).nullish(),
    linkUrl: z
      .string()
      .nullish()
      .refine((v) => !v || v.startsWith("/") || v.startsWith("https://"), "الرابط يبدأ بـ / أو https://"),
    seconds: z.number().int().min(2).max(30),
    startsAt: z.string().nullish(),
    endsAt: z.string().nullish(),
    isActive: z.boolean(),
  })
  .superRefine((b, ctx) => {
    if (b.type === "PRODUCT" && !b.productId) ctx.addIssue({ code: "custom", message: "اختر المنتج الذي تعلن عنه" });
    if (b.type !== "PRODUCT" && !b.image) ctx.addIssue({ code: "custom", message: "ارفع صورة الإعلان" });
  });
const date = (v?: string | null) => (v ? new Date(v) : null);
export async function POST(req: Request) {
  const deny = await denyUnlessAdmin();
  if (deny) return deny;
  try {
    const body = await req.json();
    if (body.action === "move") {
      const all = await db.banner.findMany({ orderBy: [{ sortOrder: "asc" }, { id: "asc" }] }),
        i = all.findIndex((b) => b.id === body.id),
        j = i + Number(body.dir);
      if (i < 0 || j < 0 || j >= all.length) return NextResponse.json({ ok: true });
      [all[i], all[j]] = [all[j], all[i]];
      await db.$transaction(all.map((b, k) => db.banner.update({ where: { id: b.id }, data: { sortOrder: k } })));
      return NextResponse.json({ ok: true });
    }
    const r = B.safeParse(body);
    if (!r.success) return NextResponse.json({ error: r.error.issues[0]?.message ?? "تحقق من بيانات الإعلان" }, { status: 400 });
    const parsed = { ...r.data, ...(r.data.type === "PRODUCT" ? { linkUrl: null } : { productId: null }) };
    const prev = parsed.id ? await db.banner.findUnique({ where: { id: parsed.id } }) : null;
    const keys = ["title", "subtitle", "button", "badge"] as const;
    const en = await englishFor(keys.map((k) => ({ ar: parsed[`${k}Ar`], prevAr: prev?.[`${k}Ar`], prevEn: prev?.[`${k}En`] })));
    const { id, startsAt, endsAt, ...d } = { ...parsed, ...Object.fromEntries(keys.map((k, i) => [`${k}En`, en[i] || null])) },
      data = { ...d, startsAt: date(startsAt), endsAt: date(endsAt) };
    const saved = id
      ? await db.banner.update({ where: { id }, data })
      : await db.banner.create({
          data: { ...data, sortOrder: ((await db.banner.aggregate({ _max: { sortOrder: true } }))._max.sortOrder ?? -1) + 1 },
        });
    // New ad (or an edit the admin chose to announce): notify customers now, or when it starts
    const notify = typeof body.notify === "boolean" ? body.notify : !id;
    const push = notify && saved.isActive && (!saved.endsAt || saved.endsAt > new Date()) ? await bannerNotice(saved) : null;
    return NextResponse.json({ ...saved, push });
  } catch (e) {
    return NextResponse.json({ error: errMsg(e) }, { status: 400 });
  }
}
async function bannerNotice(b: {
  id: number;
  type: string;
  productId: number | null;
  titleAr: string | null;
  subtitleAr: string | null;
  linkUrl: string | null;
  image: string;
  startsAt: Date | null;
}) {
  const p = b.productId
    ? await db.product.findUnique({
        where: { id: b.productId },
        select: { slug: true, nameAr: true, images: { orderBy: { sortOrder: "asc" }, take: 1, select: { url: true } } },
      })
    : null;
  const image = b.type === "PRODUCT" ? (p?.images[0]?.url ?? null) : b.image || null;
  return announce(
    {
      title: b.titleAr?.trim() || p?.nameAr || "إعلان جديد من DYLLU",
      body: b.subtitleAr?.trim() || (p ? "شوفه الحين في الكتالوج" : "اضغط وشوف التفاصيل"),
      url: p ? `/products/${p.slug}` : b.linkUrl?.startsWith("/") ? b.linkUrl : "/",
      image: image && (image.startsWith("/uploads/") || image.startsWith("https://")) ? image : null,
    },
    { source: `banner:${b.id}`, startsAt: b.startsAt, createdBy: (await currentAdmin())?.name },
  ).catch(() => null);
}
export async function DELETE(req: Request) {
  const deny = await denyUnlessAdmin();
  if (deny) return deny;
  const id = Number(new URL(req.url).searchParams.get("id"));
  await db.banner.delete({ where: { id } });
  await db.announcement.deleteMany({ where: { source: `banner:${id}`, status: "scheduled" } });
  return NextResponse.json({ ok: true });
}
