// Copyright (c) 2026 Abdullah Al-Sakni. All rights reserved. DYLLU Catalog.
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { getLang, t } from "@/lib/lang";
import CategoryCard from "@/components/CategoryCard";
import { Crumbs, Empty, SectionHead } from "@/components/ui";
export const dynamic = "force-dynamic";
export async function generateMetadata(): Promise<Metadata> {
  return { title: t(getLang(), "categories") };
}
export default async function Categories() {
  const L = getLang();
  const cats = await db.category.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    include: { _count: { select: { products: { where: { isActive: true } } } } },
  });
  return (
    <div className="wrap pt-5 md:pt-8 space-y-5 md:space-y-7">
      <div className="space-y-3">
        <Crumbs items={[[t(L, "home"), "/"], [t(L, "categories")]]} />
        <SectionHead as="h1" title={t(L, "categories")} href="/products" more={t(L, "all")} />
      </div>
      {cats.length ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
          {cats.map((c) => (
            <CategoryCard key={c.id} c={c} L={L} />
          ))}
        </div>
      ) : (
        <Empty icon="grid" title={t(L, "noResults")} />
      )}
    </div>
  );
}
