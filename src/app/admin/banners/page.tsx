// Copyright (c) 2026 Abdullah Al-Sakni. All rights reserved. DYLLU Catalog.
import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import BannersManager, { type Prod } from "@/components/admin/BannersManager";
export const dynamic = "force-dynamic";
export default async function Banners() {
  const [bs, cats, s] = await Promise.all([
    db.banner.findMany({
      orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
      include: { product: { include: { images: { orderBy: { sortOrder: "asc" } }, category: { select: { nameAr: true } } } } },
    }),
    db.category.findMany({ orderBy: { sortOrder: "asc" }, select: { slug: true, nameAr: true } }),
    getSettings(),
  ]);
  const brief = (p: NonNullable<(typeof bs)[number]["product"]>): Prod => ({
    id: p.id,
    slug: p.slug,
    sku: p.sku,
    nameAr: p.nameAr,
    nameEn: p.nameEn,
    price: p.price == null ? null : Number(p.price),
    showPrice: p.showPrice,
    images: p.images.map((i) => i.url),
    category: p.category.nameAr,
    isActive: p.isActive,
  });
  return (
    <BannersManager
      cats={cats}
      cur={s["currency.ar"]}
      initial={bs.map(({ product, createdAt: _c, ...b }) => ({
        ...b,
        startsAt: b.startsAt?.toISOString() ?? null,
        endsAt: b.endsAt?.toISOString() ?? null,
        product: product ? brief(product) : null,
      }))}
    />
  );
}
