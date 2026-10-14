// Copyright (c) 2026 Abdullah Al-Sakni. All rights reserved. DYLLU Catalog.
import { db } from "@/lib/db";
import CategoryManager from "@/components/admin/CategoryManager";
export const dynamic = "force-dynamic";
export default async function Cats() {
  const cs = await db.category.findMany({ orderBy: { sortOrder: "asc" }, include: { _count: { select: { products: true } } } });
  return <CategoryManager initial={cs.map(({ _count, ...c }) => ({ ...c, count: _count.products }))} />;
}
