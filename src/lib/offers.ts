import { cache } from "react";
import type { Offer, Prisma } from "@prisma/client";
import { db } from "./db";
// العروض الفعّالة الآن (مرة واحدة لكل طلب)
export const activeOffers = cache(async () => {
  const now = new Date();
  return db.offer.findMany({ where: { isActive: true, AND: [{ OR: [{ startsAt: null }, { startsAt: { lte: now } }] }, { OR: [{ endsAt: null }, { endsAt: { gt: now } }] }] }, orderBy: { percent: "desc" } });
});
export type AppliedOffer = { pct: number; nameAr: string; nameEn: string; wholesale: boolean; endsAt: string | null };
const applies = (o: Offer, p: { id: number; categoryId: number }) => o.scope === "all" || (o.scope === "categories" && o.categoryIds.includes(p.categoryId)) || (o.scope === "products" && o.productIds.includes(p.id));
// أعلى خصم ينطبق على المنتج (العروض مرتبة تنازليًا بالنسبة)
export function offerFor(p: { id: number; categoryId: number }, offers: Offer[]): AppliedOffer | null {
  const o = offers.find((x) => applies(x, p));
  return o ? { pct: o.percent, nameAr: o.nameAr, nameEn: o.nameEn || o.nameAr, wholesale: o.includeWholesale, endsAt: o.endsAt?.toISOString() ?? null } : null;
}
// يضيف حقل offer لكل منتج، فتحسب priceOf السعر بعد الخصم تلقائيًا
export async function withOffers<T extends { id: number; categoryId: number }>(rows: T[]): Promise<(T & { offer: AppliedOffer | null })[]> {
  const offers = await activeOffers();
  return rows.map((r) => ({ ...r, offer: offers.length ? offerFor(r, offers) : null }));
}
// شرط Prisma لـ«المنتجات التي عليها عرض الآن» (لقسم العروض وفلتر ?sale=1)
export async function onSaleWhere(): Promise<Prisma.ProductWhereInput | null> {
  const offers = await activeOffers();
  if (!offers.length) return null;
  if (offers.some((o) => o.scope === "all")) return {};
  return { OR: [{ id: { in: offers.flatMap((o) => (o.scope === "products" ? o.productIds : [])) } }, { categoryId: { in: offers.flatMap((o) => (o.scope === "categories" ? o.categoryIds : [])) } }] };
}
