import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
export const dynamic = "force-dynamic";
// خريطة الموقع لمحركات البحث: الرئيسية، التصنيفات، وكل منتج ظاهر
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const [cats, products] = await Promise.all([db.category.findMany({ where: { isActive: true }, select: { slug: true } }), db.product.findMany({ where: { isActive: true }, select: { slug: true, updatedAt: true } })]);
  return [{ url: base, priority: 1 }, { url: `${base}/products`, priority: 0.9 }, { url: `${base}/categories`, priority: 0.8 },
    ...cats.map((c) => ({ url: `${base}/categories/${c.slug}`, priority: 0.8 })), ...products.map((p) => ({ url: `${base}/products/${p.slug}`, lastModified: p.updatedAt, priority: 0.7 }))];
}
