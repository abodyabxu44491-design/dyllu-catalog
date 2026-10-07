import { NextResponse } from "next/server";
import { errMsg } from "@/lib/apiError";
import { denyUnlessAdmin } from "@/lib/adminAuth";
import { z } from "zod";
import { db } from "@/lib/db";
import { englishFor } from "@/lib/translate";
// الحفظ يشمل الترجمة التلقائية (ورفع الصور يشمل الضغط): مهلة أطول على الاستضافات السحابية
export const maxDuration = 30;
const txt = z.string().max(160).nullish();
const B = z.object({ id: z.number().optional(), type: z.enum(["IMAGE", "IMAGE_TEXT", "PRODUCT"]), image: z.string().default(""),
  productId: z.number().int().nullish(), template: z.enum(["spotlight", "lime", "clean", "offer", "split"]).default("spotlight"), showPrice: z.boolean().default(true),
  titleAr: txt, subtitleAr: txt, buttonAr: z.string().max(30).nullish(), badgeAr: z.string().max(30).nullish(),
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
    // إعلان المنتج يفتح صفحة المنتج دائمًا (الرابط يُحسب وقت العرض)، والإنجليزية تُولَّد من العربي تلقائيًا
    const parsed = { ...r.data, ...(r.data.type === "PRODUCT" ? { linkUrl: null } : { productId: null }) };
    const prev = parsed.id ? await db.banner.findUnique({ where: { id: parsed.id } }) : null;
    const keys = ["title", "subtitle", "button", "badge"] as const;
    const en = await englishFor(keys.map((k) => ({ ar: parsed[`${k}Ar`], prevAr: prev?.[`${k}Ar`], prevEn: prev?.[`${k}En`] })));
    const { id, startsAt, endsAt, ...d } = { ...parsed, ...Object.fromEntries(keys.map((k, i) => [`${k}En`, en[i] || null])) }, data = { ...d, startsAt: date(startsAt), endsAt: date(endsAt) };
    if (id) return NextResponse.json(await db.banner.update({ where: { id }, data }));
    const max = await db.banner.aggregate({ _max: { sortOrder: true } });
    return NextResponse.json(await db.banner.create({ data: { ...data, sortOrder: (max._max.sortOrder ?? -1) + 1 } }));
  } catch (e) { return NextResponse.json({ error: errMsg(e) }, { status: 400 }); }
}
export async function DELETE(req: Request) {
  const deny = await denyUnlessAdmin(); if (deny) return deny;
  await db.banner.delete({ where: { id: Number(new URL(req.url).searchParams.get("id")) } });
  return NextResponse.json({ ok: true });
}
