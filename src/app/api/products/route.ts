import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { pageParam, priceOf } from "@/lib/format";
import { getWholesale } from "@/lib/wholesale";
import { searchWhere } from "@/lib/catalog";
// ?category=slug&q=text&featured=1&page=1  — السعر المخفي وسعر الجملة لا يخرجان إلا لمن يحق له
export async function GET(req: Request) {
  const p = new URL(req.url).searchParams, take = 20, page = pageParam(p.get("page")), ws = !!(await getWholesale());
  const q = p.get("q"), cat = p.get("category");
  const where = { isActive: true, ...(cat && { category: { slug: cat } }), ...(p.get("featured") && { isFeatured: true }),
    ...searchWhere(q) };
  const rows = await db.product.findMany({ where, include: { images: { orderBy: { sortOrder: "asc" } } }, orderBy: { sortOrder: "asc" }, skip: (page - 1) * take, take });
  return NextResponse.json(rows.map(({ wholesalePrice, ...r }) => ({ ...r, price: priceOf({ ...r, wholesalePrice }, ws) })));
}
