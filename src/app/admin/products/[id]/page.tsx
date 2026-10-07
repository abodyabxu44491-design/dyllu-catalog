import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import ProductForm from "@/components/admin/ProductForm";
import { canTranslate } from "@/lib/translate";
export const dynamic = "force-dynamic";
// ?cat= يحدد تصنيف المنتج الجديد (يُستخدم بعد «حفظ وإضافة منتج آخر»)
export default async function Edit({ params, searchParams }: { params: { id: string }; searchParams: { cat?: string; t?: string } }) {
  const categories = await db.category.findMany({ orderBy: { sortOrder: "asc" } });
  if (params.id !== "new" && !Number.isInteger(Number(params.id))) notFound();
  const p = params.id === "new" ? null : await db.product.findUnique({ where: { id: Number(params.id) }, include: { images: { orderBy: { sortOrder: "asc" } }, specs: { orderBy: { sortOrder: "asc" } }, features: { orderBy: { sortOrder: "asc" } }, documents: true } });
  if (params.id !== "new" && !p) notFound();
  const initial = p ? { ...p, price: p.price == null ? null : Number(p.price), wholesalePrice: p.wholesalePrice == null ? null : Number(p.wholesalePrice) } : null;
  const cat = Number(searchParams.cat);
  return <ProductForm key={`${params.id}-${searchParams.cat ?? ""}-${searchParams.t ?? ""}`} ai={canTranslate()} defaultCategory={categories.some((c) => c.id === cat) ? cat : undefined} initial={JSON.parse(JSON.stringify(initial))} categories={categories.map((c) => ({ id: c.id, nameAr: c.nameAr }))} />;
}
