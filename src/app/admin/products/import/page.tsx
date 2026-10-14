// Copyright (c) 2026 Abdullah Al-Sakni. All rights reserved. DYLLU Catalog.
import { db } from "@/lib/db";
import ImportManager from "@/components/admin/ImportManager";
export const dynamic = "force-dynamic";
export default async function ImportPage() {
  const [skus, codes, cats] = await Promise.all([
    db.product.findMany({ where: { sku: { not: null } }, select: { sku: true } }),
    db.product.findMany({ where: { barcode: { not: null } }, select: { barcode: true } }),
    db.category.findMany({ orderBy: { sortOrder: "asc" }, select: { nameAr: true } }),
  ]);
  return <ImportManager skus={skus.map((s) => s.sku!)} barcodes={codes.map((c) => c.barcode!)} categories={cats.map((c) => c.nameAr)} />;
}
