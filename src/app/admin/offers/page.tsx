import { db } from "@/lib/db";
import OffersManager from "@/components/admin/OffersManager";
export const dynamic = "force-dynamic";
export default async function Offers() {
  const [offers, cats] = await Promise.all([db.offer.findMany({ orderBy: [{ isActive: "desc" }, { id: "desc" }] }), db.category.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, nameAr: true } })]);
  const ids = [...new Set(offers.flatMap((o) => o.productIds))];
  const prods = ids.length ? await db.product.findMany({ where: { id: { in: ids } }, select: { id: true, nameAr: true, images: { take: 1, orderBy: { sortOrder: "asc" }, select: { url: true } } } }) : [];
  return <OffersManager now={Date.now()} cats={cats} products={prods.map((p) => ({ id: p.id, nameAr: p.nameAr, image: p.images[0]?.url ?? null }))}
    initial={offers.map((o) => ({ ...o, scope: o.scope as "all" | "categories" | "products", startsAt: o.startsAt?.toISOString() ?? null, endsAt: o.endsAt?.toISOString() ?? null, createdAt: undefined }))} />;
}
