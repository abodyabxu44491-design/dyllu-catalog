import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { getLang, pick, t, txt } from "@/lib/lang";
import { getWholesale } from "@/lib/wholesale";
import SiteHeader from "@/components/SiteHeader";
import ProductCard from "@/components/ProductCard";
import Pager from "@/components/Pager";
export const dynamic = "force-dynamic";
const PER = 24;
type SP = { category?: string; q?: string; sort?: string; featured?: string; page?: string };
// صفحة كل المنتجات: هي وجهة «عرض كل المنتجات» مباشرة. تدعم التصنيف والمميز والبحث والفرز وترقيم الصفحات (لا حد أقصى للمنتجات).
export default async function Products({ searchParams }: { searchParams: SP }) {
  const { category, q, sort, featured } = searchParams, L = getLang(), en = L === "en", ws = !!(await getWholesale());
  const page = Math.max(1, parseInt(searchParams.page ?? "1", 10) || 1);
  const href = (o: Record<string, string>) => { const p = new URLSearchParams(Object.entries({ category, q, sort, featured, ...o }).filter(([, v]) => v) as [string, string][]).toString(); return p ? `/products?${p}` : "/products"; };
  const orderBy: Prisma.ProductOrderByWithRelationInput = sort === "new" ? { id: "desc" } : sort === "low" ? { price: { sort: "asc", nulls: "last" } } : sort === "high" ? { price: { sort: "desc", nulls: "last" } } : { sortOrder: "asc" };
  const SORTS = [["", "الافتراضي", "Default"], ["new", "الأحدث", "Newest"], ["low", "السعر ↑", "Price ↑"], ["high", "السعر ↓", "Price ↓"]];
  const where: Prisma.ProductWhereInput = { isActive: true, ...(featured && { isFeatured: true }), ...(category && { category: { slug: category } }), ...(q && { OR: [{ nameAr: { contains: q, mode: "insensitive" } }, { nameEn: { contains: q, mode: "insensitive" } }] }) };
  const [s, cats, total, products] = await Promise.all([
    getSettings(),
    db.category.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
    db.product.count({ where }),
    db.product.findMany({ where, include: { images: { orderBy: { sortOrder: "asc" }, take: 1 } }, orderBy: [orderBy, { id: "asc" }], skip: (page - 1) * PER, take: PER }),
  ]);
  const pages = Math.max(1, Math.ceil(total / PER)), cur = cats.find((c) => c.slug === category);
  const title = featured ? txt(s, L, "home.featured") : cur ? pick(L, cur.nameAr, cur.nameEn) : t(L, "all");
  return (
    <main className="max-w-3xl mx-auto pb-24">
      <SiteHeader />
      <h1 className="relative inline-flex items-center bg-lime text-steel rounded-full ps-7 pe-4 py-1.5 text-[15px] mx-4 mt-5"><i className="absolute start-2.5 w-2.5 h-2.5 bg-accent rotate-45" />{title}</h1>
      <form className="px-4 pt-3 pb-2"><input name="q" type="search" defaultValue={q} placeholder={t(L, "search")} className="w-full border rounded-xl p-3 text-base" />{category && <input type="hidden" name="category" value={category} />}{featured && <input type="hidden" name="featured" value={featured} />}{sort && <input type="hidden" name="sort" value={sort} />}</form>
      <div className="flex gap-2 overflow-x-auto px-4 pb-3">
        <Link href="/products" className={`px-4 py-2 rounded-full whitespace-nowrap ${!category && !featured ? "bg-lime font-bold" : "bg-soft"}`}>{t(L, "all")}</Link>
        {cats.map((c) => <Link key={c.id} href={`/products?category=${c.slug}`} className={`px-4 py-2 rounded-full whitespace-nowrap ${category === c.slug ? "bg-lime font-bold" : "bg-soft"}`}>{pick(L, c.nameAr, c.nameEn)}</Link>)}
      </div>
      <div className="flex gap-2 px-4 pb-1 text-sm items-center overflow-x-auto"><span className="text-steel">{en ? "Sort" : "ترتيب"}:</span>{SORTS.map(([k, ar, e]) => <Link key={k} href={href({ sort: k, page: "" })} className={`whitespace-nowrap px-3 py-1 rounded-lg ${(sort ?? "") === k ? "bg-ink text-white font-bold" : "text-steel"}`}>{en ? e : ar}</Link>)}<span className="ms-auto text-steel whitespace-nowrap">{total} {en ? "products" : "منتج"}</span></div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 p-4">{products.map((p) => <ProductCard key={p.id} p={p} s={s} ws={ws} />)}</div>
      {products.length === 0 && <p className="text-center text-steel p-8">{en ? "No products found" : "لا توجد منتجات"}</p>}
      <Pager page={page} pages={pages} href={(n) => href({ page: n > 1 ? String(n) : "" })} en={en} />
    </main>
  );
}
