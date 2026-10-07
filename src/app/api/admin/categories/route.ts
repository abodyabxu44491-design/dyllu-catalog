import { NextResponse } from "next/server";
import { errMsg } from "@/lib/apiError";
import { denyUnlessAdmin } from "@/lib/adminAuth";
import { z } from "zod";
import { db } from "@/lib/db";
import { fillPairs } from "@/lib/translate";
const C = z.object({ id: z.number().optional(), slug: z.string().optional(), nameAr: z.string().trim(), nameEn: z.string().trim(), descriptionAr: z.string().nullish(), subtitleAr: z.string().nullish(), subtitleEn: z.string().nullish(), image: z.string().nullish(), sortOrder: z.number().int(), isActive: z.boolean() }).refine((c) => c.nameAr || c.nameEn, "اكتب اسم التصنيف");
export async function POST(req: Request) {
  const deny = await denyUnlessAdmin(); if (deny) return deny;
  try {
    // الرابط (slug) يُولَّد تلقائيًا من الاسم الإنجليزي، فلا يحتاج المدير لكتابته
    const { id, slug, ...d } = await fillPairs(C.parse(await req.json()), [["nameAr", "nameEn"], ["subtitleAr", "subtitleEn"]]), given = slug?.trim();
    if (id) return NextResponse.json(await db.category.update({ where: { id }, data: { ...d, ...(given && { slug: given }) } }));
    const base = d.nameEn.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "cat";
    return NextResponse.json(await db.category.create({ data: { ...d, slug: given || `${base}-${Date.now().toString(36)}` } }));
  }
  catch (e) { return NextResponse.json({ error: errMsg(e, "الرابط مستخدم لتصنيف آخر") }, { status: 400 }); }
}
export async function DELETE(req: Request) {
  const deny = await denyUnlessAdmin(); if (deny) return deny;
  try { await db.category.delete({ where: { id: Number(new URL(req.url).searchParams.get("id")) } }); return NextResponse.json({ ok: true }); }
  catch { return NextResponse.json({ error: "التصنيف يحتوي منتجات، أخفِه بدل الحذف" }, { status: 400 }); }
}
