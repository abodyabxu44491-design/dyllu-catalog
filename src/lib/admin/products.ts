import { z } from "zod";
import { db } from "../db";
import { fillPairs } from "../translate";
const P = z.object({ nameAr: z.string().trim(), nameEn: z.string().trim(), slug: z.string().optional(), sku: z.string().nullish(), categoryId: z.number().int(), descriptionAr: z.string().nullish(), descriptionEn: z.string().nullish(), price: z.number().nullish(), wholesalePrice: z.number().nullish(), videoUrl: z.string().nullish(), showPrice: z.boolean(), isActive: z.boolean(), allowCart: z.boolean(), inStock: z.boolean(), isFeatured: z.boolean(), sortOrder: z.number().int().default(0),
  images: z.array(z.object({ url: z.string() })), specs: z.array(z.object({ nameAr: z.string(), nameEn: z.string(), value: z.string() })), features: z.array(z.object({ textAr: z.string(), textEn: z.string() })), documents: z.array(z.object({ title: z.string(), url: z.string() })).default([])  }).refine((p) => p.nameAr || p.nameEn, "اكتب اسم المنتج (بالعربية أو الإنجليزية)");
// الترجمة التلقائية: كل نص له نسخة عربية وإنجليزية؛ الفارغ منهما يُترجم من الآخر قبل الحفظ (إن كان ANTHROPIC_API_KEY مضبوطًا)
async function autoTranslate(d: z.infer<typeof P>) {
  const flat: Record<string, string> = { nameAr: d.nameAr, nameEn: d.nameEn, descriptionAr: d.descriptionAr ?? "", descriptionEn: d.descriptionEn ?? "" }, pairs: [string, string][] = [["nameAr", "nameEn"], ["descriptionAr", "descriptionEn"]];
  d.features.forEach((f, i) => { flat[`f${i}a`] = f.textAr; flat[`f${i}e`] = f.textEn; pairs.push([`f${i}a`, `f${i}e`]); });
  d.specs.forEach((x, i) => { flat[`s${i}a`] = x.nameAr; flat[`s${i}e`] = x.nameEn; pairs.push([`s${i}a`, `s${i}e`]); });
  const t = await fillPairs(flat, pairs);
  return { ...d, nameAr: t.nameAr, nameEn: t.nameEn, descriptionAr: t.descriptionAr || null, descriptionEn: t.descriptionEn || null,
    features: d.features.map((f, i) => ({ textAr: t[`f${i}a`], textEn: t[`f${i}e`] })), specs: d.specs.map((x, i) => ({ ...x, nameAr: t[`s${i}a`], nameEn: t[`s${i}e`] })) };
}
export async function saveProduct(id: number | null, raw: unknown) {
  const { images, specs, features, documents, slug, price, wholesalePrice, sku, videoUrl, ...d } = await autoTranslate(P.parse(raw));
  const data = { ...d, price: price ?? null, wholesalePrice: wholesalePrice ?? null, videoUrl: videoUrl || null, sku: sku || null, slug: slug || `${d.nameEn.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "p"}-${Date.now().toString(36)}` };
  const nested = { images: { create: images.map((x, i) => ({ url: x.url, sortOrder: i, isPrimary: i === 0 })) }, specs: { create: specs.filter((x) => x.value || x.nameAr || x.nameEn).map((x, i) => ({ ...x, sortOrder: i })) }, features: { create: features.filter((x) => x.textAr || x.textEn).map((x, i) => ({ ...x, sortOrder: i })) }, documents: { create: documents.filter((x) => x.url) } };
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
