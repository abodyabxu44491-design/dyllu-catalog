import { db } from "@/lib/db";
import ImportManager from "@/components/admin/ImportManager";
export const dynamic = "force-dynamic";
export default async function ImportPage() {
  const [skus, cats] = await Promise.all([db.product.findMany({ where: { sku: { not: null } }, select: { sku: true } }), db.category.findMany({ orderBy: { sortOrder: "asc" }, select: { nameAr: true } })]);
  return <ImportManager skus={skus.map((s) => s.sku!)} categories={cats.map((c) => c.nameAr)} />;
}
