// Copyright (c) 2026 Abdullah Al-Sakni. All rights reserved. DYLLU Catalog.
import type { MetadataRoute } from "next";
import { cdb } from "@/lib/cache";
import { siteUrl } from "@/lib/siteUrl";
export const dynamic = "force-dynamic";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = await siteUrl();
  const [cats, products] = await Promise.all([
    cdb.category.findMany({ where: { isActive: true }, select: { slug: true } }),
    cdb.product.findMany({ where: { isActive: true }, select: { slug: true, updatedAt: true } }),
  ]);
  return [
    { url: base, priority: 1 },
    { url: `${base}/products`, priority: 0.9 },
    { url: `${base}/categories`, priority: 0.8 },
    ...cats.map((c) => ({ url: `${base}/categories/${c.slug}`, priority: 0.8 })),
    ...products.map((p) => ({ url: `${base}/products/${p.slug}`, lastModified: p.updatedAt, priority: 0.7 })),
  ];
}
