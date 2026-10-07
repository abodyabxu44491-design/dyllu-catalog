import { cache } from "react";
import { db } from "./db";
import type { Prisma } from "@prisma/client";
// استعلامات الكتالوج المشتركة بين الصفحات والـ API: البحث (الاسم عربي/إنجليزي + رقم الموديل) والترتيب
export function searchWhere(q?: string | null): Prisma.ProductWhereInput {
  const s = q?.trim();
  if (!s) return {};
  const words = s.split(/\s+/).slice(0, 5);
  // كل كلمة يجب أن تظهر في أحد الحقول، فيعمل البحث بـ «دريل 20V» أو «drill 20v»
  return { AND: words.map((w) => ({ OR: [{ nameAr: { contains: w, mode: "insensitive" as const } }, { nameEn: { contains: w, mode: "insensitive" as const } }, { sku: { contains: w, mode: "insensitive" as const } }] })) };
}
export const SORTS = ["", "new", "low", "high", "name"] as const;
export function orderByFor(sort?: string, en = false): Prisma.ProductOrderByWithRelationInput[] {
  const o: Prisma.ProductOrderByWithRelationInput = sort === "new" ? { id: "desc" } : sort === "low" ? { price: { sort: "asc", nulls: "last" } } : sort === "high" ? { price: { sort: "desc", nulls: "last" } } : sort === "name" ? (en ? { nameEn: "asc" } : { nameAr: "asc" }) : { sortOrder: "asc" };
  return [o, { id: "asc" }];
}
export const cardInclude = { images: { orderBy: { sortOrder: "asc" as const }, take: 1 } };
// التصنيفات الظاهرة للتنقل (الهيدر، التذييل، شرائح الفلاتر): استعلام واحد لكل طلب
export const getNavCategories = cache(() => db.category.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" }, select: { id: true, slug: true, nameAr: true, nameEn: true, image: true } }));
