import { NextResponse } from "next/server";
import { denyUnlessAdmin } from "@/lib/adminAuth";
import { z } from "zod";
import { db } from "@/lib/db";
import { fillPairs } from "@/lib/translate";
const txt = z.string().max(160).nullish();
const B = z.object({ id: z.number().optional(), type: z.enum(["IMAGE", "IMAGE_TEXT", "PRODUCT"]), image: z.string().default(""),
  productId: z.number().int().nullish(), template: z.enum(["spotlight", "lime", "clean", "offer", "split"]).default("spotlight"), showPrice: z.boolean().default(true),
  titleAr: txt, titleEn: txt, subtitleAr: txt, subtitleEn: txt, buttonAr: z.string().max(30).nullish(), buttonEn: z.string().max(30).nullish(), badgeAr: z.string().max(30).nullish(), badgeEn: z.string().max(30).nullish(),
  linkUrl: z.string().nullish().refine((v) => !v || v.startsWith("/") || v.startsWith("https://"), "الرابط يبدأ بـ / أو https://"),
  seconds: z.number().int().min(2).max(30), startsAt: z.string().nullish(), endsAt: z.string().nullish(), isActive: z.boolean() })
  .superRefine((b, ctx) => {
    if (b.type === "PRODUCT" && !b.productId) ctx.addIssue({ code: "custom", message: "اختر المنتج الذي تعلن عنه" });
    if (b.type !== "PRODUCT" && !b.image) ctx.addIssue({ code: "custom", message: "ارفع صورة الإعلان" });
  });
const date = (v?: string | null) => (v ? new Date(v) : null);
// POST {action:"move", id, dir:-1|1} للترتيب | POST {…الإعلان} إنشاء/تعديل | DELETE ?id=
export async function POST(req: Request) {
  const deny = await denyUnlessAdmin(); if (deny) return deny;
  try {
    const body = await req.json();
    if (body.action === "move") {
      const all = await db.banner.findMany({ orderBy: [{ sortOrder: "asc" }, { id: "asc" }] }), i = all.findIndex((b) => b.id === body.id), j = i + Number(body.dir);
      if (i < 0 || j < 0 || j >= all.length) return NextResponse.json({ ok: true });
      [all[i], all[j]] = [all[j], all[i]];
      await db.$transaction(all.map((b, k) => db.banner.update({ where: { id: b.id }, data: { sortOrder: k } })));
      return NextResponse.json({ ok: true });
    }
    const r = B.safeParse(body);
    if (!r.success) return NextResponse.json({ error: r.error.issues[0]?.message ?? "تحقق من بيانات الإعلان" }, { status: 400 });
    // إعلان المنتج يفتح صفحة المنتج دائمًا (الرابط يُحسب وقت العرض)، والنصوص الإنجليزية الفارغة تُترجم تلقائيًا
    const parsed = { ...r.data, ...(r.data.type === "PRODUCT" ? { linkUrl: null } : { productId: null }) };
    const { id, startsAt, endsAt, ...d } = parsed.type === "IMAGE" ? parsed : await fillPairs(parsed, [["titleAr", "titleEn"], ["subtitleAr", "subtitleEn"], ["buttonAr", "buttonEn"], ["badgeAr", "badgeEn"]]), data = { ...d, startsAt: date(startsAt), endsAt: date(endsAt) };
    if (id) return NextResponse.json(await db.banner.update({ where: { id }, data }));
    const max = await db.banner.aggregate({ _max: { sortOrder: true } });
    return NextResponse.json(await db.banner.create({ data: { ...data, sortOrder: (max._max.sortOrder ?? -1) + 1 } }));
  } catch (e) { return NextResponse.json({ error: (e as Error).message }, { status: 400 }); }
}
export async function DELETE(req: Request) {
  const deny = await denyUnlessAdmin(); if (deny) return deny;
  await db.banner.delete({ where: { id: Number(new URL(req.url).searchParams.get("id")) } });
  return NextResponse.json({ ok: true });
}
