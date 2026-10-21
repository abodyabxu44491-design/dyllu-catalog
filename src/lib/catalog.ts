// Copyright (c) 2026 Abdullah Al-Sakni. All rights reserved. DYLLU Catalog.
import { cache } from "react";
import { db } from "./db";
import type { Prisma } from "@prisma/client";
// A product belongs to a category through its primary category or one of its extra categories
export const inCategory = (id: number): Prisma.ProductWhereInput => ({ OR: [{ categoryId: id }, { categories: { some: { id } } }] });
export const catCount = { select: { products: { where: { isActive: true } }, extraProducts: { where: { isActive: true } } } } as const;
export function searchWhere(q?: string | null): Prisma.ProductWhereInput {
  const s = q?.trim();
  if (!s) return {};
  const words = s.split(/\s+/).slice(0, 5);
  return {
    AND: words.map((w) => ({
      OR: [
        { nameAr: { contains: w, mode: "insensitive" as const } },
        { nameEn: { contains: w, mode: "insensitive" as const } },
        { sku: { contains: w, mode: "insensitive" as const } },
      ],
    })),
  };
}
export const SORTS = ["", "new", "low", "high", "name"] as const;
export function orderByFor(sort?: string, en = false): Prisma.ProductOrderByWithRelationInput[] {
  const o: Prisma.ProductOrderByWithRelationInput =
    sort === "new"
      ? { id: "desc" }
      : sort === "low"
        ? { price: { sort: "asc", nulls: "last" } }
        : sort === "high"
          ? { price: { sort: "desc", nulls: "last" } }
          : sort === "name"
            ? en
              ? { nameEn: "asc" }
              : { nameAr: "asc" }
            : { sortOrder: "asc" };
  return [o, { id: "asc" }];
}
export const cardInclude = { images: { orderBy: { sortOrder: "asc" as const }, take: 1 } };
export const getNavCategories = cache(() =>
  db.category.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    select: { id: true, slug: true, nameAr: true, nameEn: true, image: true },
  }),
);
