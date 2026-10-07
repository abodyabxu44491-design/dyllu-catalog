import { z } from "zod";
import { db } from "../db";
import { englishFor } from "../translate";
const P = z.object({ nameAr: z.string().trim(), nameEn: z.string().trim().optional(), slug: z.string().optional(), sku: z.string().nullish(), categoryId: z.number().int(), descriptionAr: z.string().nullish(),  price: z.number().nullish(), wholesalePrice: z.number().nullish(), videoUrl: z.string().nullish(), showPrice: z.boolean(), isActive: z.boolean(), allowCart: z.boolean(), inStock: z.boolean(), isFeatured: z.boolean(), sortOrder: z.number().int().default(0),
  images: z.array(z.object({ url: z.string() })), specs: z.array(z.object({ nameAr: z.string(), value: z.string() })), features: z.array(z.object({ textAr: z.string() })), documents: z.array(z.object({ title: z.string(), url: z.string() })).default([])  }).refine((p) => p.nameAr, "اكتب اسم المنتج");
// الإنجليزية تُولَّد من العربي: لا يُعاد ترجمة نص لم يتغير (تبقى ترجمته السابقة)، والجديد أو المعدّل يُترجم
async function withEnglish(id: number | null, d: z.infer<typeof P>) {
  const prev = id ? await db.product.findUnique({ where: { id }, include: { specs: true, features: true, documents: true } }) : null;
  const m = <T,>(a: T[] | undefined, k: (x: T) => string, v: (x: T) => string | null | undefined) => new Map((a ?? []).map((x) => [k(x).trim(), v(x) ?? ""]));
  const fe = m(prev?.features, (x) => x.textAr, (x) => x.textEn), sn = m(prev?.specs, (x) => x.nameAr, (x) => x.nameEn), sv = m(prev?.specs, (x) => x.value, (x) => x.valueEn), dt = m(prev?.documents, (x) => x.title, (x) => x.titleEn);
  const same = (a?: string | null) => ({ prevAr: a?.trim() });
  const jobs = [
    { ar: d.nameAr, prevAr: prev?.nameAr, prevEn: prev?.nameEn, title: true }, { ar: d.descriptionAr, prevAr: prev?.descriptionAr, prevEn: prev?.descriptionEn },
    ...d.features.map((f) => ({ ar: f.textAr, ...same(fe.has(f.textAr.trim()) ? f.textAr : null), prevEn: fe.get(f.textAr.trim()) })),
    ...d.specs.map((x) => ({ ar: x.nameAr, ...same(sn.has(x.nameAr.trim()) ? x.nameAr : null), prevEn: sn.get(x.nameAr.trim()), title: true })),
    ...d.specs.map((x) => ({ ar: x.value, ...same(sv.has(x.value.trim()) ? x.value : null), prevEn: sv.get(x.value.trim()) })),
    ...d.documents.map((x) => ({ ar: x.title, ...same(dt.has(x.title.trim()) ? x.title : null), prevEn: dt.get(x.title.trim()) })),
  ];
  const en = await englishFor(jobs); let i = 2;
  const features = d.features.map((f) => ({ textAr: f.textAr, textEn: en[i++] }));
  const specNames = d.specs.map(() => en[i++]), specVals = d.specs.map(() => en[i++]);
  const specs = d.specs.map((x, k) => ({ nameAr: x.nameAr, nameEn: specNames[k], value: x.value, valueEn: specVals[k] !== x.value ? specVals[k] : null }));
  const documents = d.documents.map((x) => ({ title: x.title, titleEn: en[i++] || null, url: x.url }));
  return { ...d, nameEn: en[0], descriptionAr: d.descriptionAr || null, descriptionEn: en[1] || null, features, specs, documents };
}
export async function saveProduct(id: number | null, raw: unknown) {
  const { images, specs, features, documents, slug, price, wholesalePrice, sku, videoUrl, ...d } = await withEnglish(id, P.parse(raw));
  const data = { ...d, price: price ?? null, wholesalePrice: wholesalePrice ?? null, videoUrl: videoUrl || null, sku: sku || null, slug: slug || `${(d.nameEn || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "p"}-${Date.now().toString(36)}` };
  const nested = { images: { create: images.map((x, i) => ({ url: x.url, sortOrder: i, isPrimary: i === 0 })) }, specs: { create: specs.filter((x) => x.value || x.nameAr).map((x, i) => ({ ...x, sortOrder: i })) }, features: { create: features.filter((x) => x.textAr).map((x, i) => ({ ...x, sortOrder: i })) }, documents: { create: documents.filter((x) => x.url) } };
  if (!id) return db.product.create({ data: { ...data, ...nested } });
  const w = { where: { productId: id } };
  const [, , , , p] = await db.$transaction([db.productImage.deleteMany(w), db.productSpec.deleteMany(w), db.productFeature.deleteMany(w), db.productDocument.deleteMany(w), db.product.update({ where: { id }, data: { ...data, ...nested }, include: { features: { orderBy: { sortOrder: "asc" } }, specs: { orderBy: { sortOrder: "asc" } } } })]);
  return p;
}
// نسخة من منتج بكل صوره ومواصفاته (تُنشأ مخفية وبدون SKU حتى تُراجع)
export async function duplicateProduct(id: number) {
  const p = await db.product.findUniqueOrThrow({ where: { id }, include: { images: true, specs: true, features: true, documents: true } });
  const { id: _id, slug: _s, sku: _k, createdAt: _c, updatedAt: _u, images, specs, features, documents, ...d } = p;
  const strip = <T extends { id: number; productId: number }>(a: T[]) => a.map(({ id: _a, productId: _b, ...x }) => x);
  return db.product.create({ data: { ...d, nameAr: `${p.nameAr} (نسخة)`, nameEn: p.nameEn ? `${p.nameEn} (copy)` : "", isActive: false, isFeatured: false, slug: `${p.slug}-copy-${Date.now().toString(36)}`,
    images: { create: strip(images) }, specs: { create: strip(specs) }, features: { create: strip(features) }, documents: { create: strip(documents) } } });
}
