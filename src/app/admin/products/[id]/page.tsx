// Copyright (c) 2026 Abdullah Al-Sakni. All rights reserved. DYLLU Catalog.
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import ProductForm from "@/components/admin/ProductForm";
export const dynamic = "force-dynamic";
export default async function Edit(props: { params: Promise<{ id: string }>; searchParams: Promise<{ cat?: string; t?: string }> }) {
  const searchParams = await props.searchParams;
  const params = await props.params;
  const categories = await db.category.findMany({ orderBy: { sortOrder: "asc" } });
  if (params.id !== "new" && !Number.isInteger(Number(params.id))) notFound();
  const p =
    params.id === "new"
      ? null
      : await db.product.findUnique({
          where: { id: Number(params.id) },
          include: {
            images: { orderBy: { sortOrder: "asc" } },
            specs: { orderBy: { sortOrder: "asc" } },
            features: { orderBy: { sortOrder: "asc" } },
            documents: true,
            categories: { select: { id: true } },
            alternatives: { select: { id: true, nameAr: true, inStock: true, images: { take: 1, orderBy: { sortOrder: "asc" } } } },
          },
        });
  if (params.id !== "new" && !p) notFound();
  const initial = p
    ? {
        ...p,
        price: p.price == null ? null : Number(p.price),
        wholesalePrice: p.wholesalePrice == null ? null : Number(p.wholesalePrice),
        stock: p.stock ?? "",
        extraCategoryIds: p.categories.map((c) => c.id),
        alternatives: p.alternatives.map((a) => ({ id: a.id, nameAr: a.nameAr, inStock: a.inStock, image: a.images[0]?.url ?? null })),
      }
    : null;
  const cat = Number(searchParams.cat);
  return (
    <ProductForm
      key={`${params.id}-${searchParams.cat ?? ""}-${searchParams.t ?? ""}`}
      defaultCategory={categories.some((c) => c.id === cat) ? cat : undefined}
      initial={JSON.parse(JSON.stringify(initial))}
      categories={categories.map((c) => ({ id: c.id, nameAr: c.nameAr }))}
    />
  );
}
