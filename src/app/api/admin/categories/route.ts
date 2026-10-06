import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
const C = z.object({ id: z.number().optional(), slug: z.string().optional(), nameAr: z.string().min(1), nameEn: z.string().min(1), descriptionAr: z.string().nullish(), subtitleAr: z.string().nullish(), subtitleEn: z.string().nullish(), image: z.string().nullish(), sortOrder: z.number().int(), isActive: z.boolean() });
export async function POST(req: Request) {
  try {
    // الرابط (slug) يُولَّد تلقائيًا من الاسم الإنجليزي، فلا يحتاج المدير لكتابته
    const { id, slug, ...d } = C.parse(await req.json()), given = slug?.trim();
    if (id) return NextResponse.json(await db.category.update({ where: { id }, data: { ...d, ...(given && { slug: given }) } }));
    const base = d.nameEn.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "cat";
    return NextResponse.json(await db.category.create({ data: { ...d, slug: given || `${base}-${Date.now().toString(36)}` } }));
  }
  catch (e) { return NextResponse.json({ error: (e as { code?: string }).code === "P2002" ? "الرابط مستخدم لتصنيف آخر" : (e as Error).message }, { status: 400 }); }
}
export async function DELETE(req: Request) {
  try { await db.category.delete({ where: { id: Number(new URL(req.url).searchParams.get("id")) } }); return NextResponse.json({ ok: true }); }
  catch { return NextResponse.json({ error: "التصنيف يحتوي منتجات، أخفِه بدل الحذف" }, { status: 400 }); }
}
