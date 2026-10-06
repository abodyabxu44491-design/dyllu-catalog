import { z } from "zod";
import { db } from "../db";
const P = z.object({ nameAr: z.string().min(1), nameEn: z.string().min(1), slug: z.string().optional(), sku: z.string().nullish(), categoryId: z.number().int(), descriptionAr: z.string().nullish(), descriptionEn: z.string().nullish(), price: z.number().nullish(), wholesalePrice: z.number().nullish(), videoUrl: z.string().nullish(), showPrice: z.boolean(), isActive: z.boolean(), allowCart: z.boolean(), inStock: z.boolean(), isFeatured: z.boolean(), sortOrder: z.number().int().default(0),
  images: z.array(z.object({ url: z.string() })), specs: z.array(z.object({ nameAr: z.string(), nameEn: z.string(), value: z.string() })), features: z.array(z.object({ textAr: z.string(), textEn: z.string() })), documents: z.array(z.object({ title: z.string(), url: z.string() })).default([]) });
export async function saveProduct(id: number | null, raw: unknown) {
  const { images, specs, features, documents, slug, price, wholesalePrice, sku, videoUrl, ...d } = P.parse(raw);
  const data = { ...d, price: price ?? null, wholesalePrice: wholesalePrice ?? null, videoUrl: videoUrl || null, sku: sku || null, slug: slug || `${d.nameEn.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now().toString(36)}` };
  const nested = { images: { create: images.map((x, i) => ({ url: x.url, sortOrder: i, isPrimary: i === 0 })) }, specs: { create: specs.filter((x) => x.value || x.nameAr || x.nameEn).map((x, i) => ({ ...x, sortOrder: i })) }, features: { create: features.filter((x) => x.textAr || x.textEn).map((x, i) => ({ ...x, sortOrder: i })) }, documents: { create: documents.filter((x) => x.url) } };
  if (!id) return db.product.create({ data: { ...data, ...nested } });
  const w = { where: { productId: id } };
  const [, , , , p] = await db.$transaction([db.productImage.deleteMany(w), db.productSpec.deleteMany(w), db.productFeature.deleteMany(w), db.productDocument.deleteMany(w), db.product.update({ where: { id }, data: { ...data, ...nested } })]);
  return p;
}
