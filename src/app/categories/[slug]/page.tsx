import Link from "next/link";
import { notFound } from "next/navigation";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { getWholesale } from "@/lib/wholesale";
import { getLang, pick, t } from "@/lib/lang";
import SiteHeader from "@/components/SiteHeader";
import ProductCard from "@/components/ProductCard";
import Pager from "@/components/Pager";
export const dynamic = "force-dynamic";
export async function generateMetadata({ params }: { params: { slug: string } }) {
  const c = await db.category.findFirst({ where: { slug: params.slug, isActive: true } });
  return c ? { title: `${c.nameEn} | DYLLU`, description: c.descriptionAr ?? undefined, openGraph: { images: c.image ? [c.image] : [] } } : {};
}
// صفحة التصنيف: كل المنتجات داخله مع بحث وفرز، وشريط للانتقال بين التصنيفات
export default async function CategoryPage({ params, searchParams }: { params: { slug: string }; searchParams: { q?: string; sort?: string; page?: string } }) {
  const { q, sort } = searchParams, L = getLang(), en = L === "en", ws = !!(await getWholesale()), PER = 24, page = Math.max(1, parseInt(searchParams.page ?? "1", 10) || 1);
  const cat = await db.category.findFirst({ where: { slug: params.slug, isActive: true } });
  if (!cat) notFound();
  const orderBy: Prisma.ProductOrderByWithRelationInput = sort === "new" ? { id: "desc" } : sort === "low" ? { price: { sort: "asc", nulls: "last" } } : sort === "high" ? { price: { sort: "desc", nulls: "last" } } : { sortOrder: "asc" };
  const SORTS = [["", "الافتراضي", "Default"], ["new", "الأحدث", "Newest"], ["low", "السعر ↑", "Price ↑"], ["high", "السعر ↓", "Price ↓"]];
  const where: Prisma.ProductWhereInput = { isActive: true, categoryId: cat.id, ...(q && { OR: [{ nameAr: { contains: q, mode: "insensitive" } }, { nameEn: { contains: q, mode: "insensitive" } }] }) };
  const [s, cats, total, products] = await Promise.all([getSettings(), db.category.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }), db.product.count({ where }),
    db.product.findMany({ where, include: { images: { orderBy: { sortOrder: "asc" }, take: 1 } }, orderBy: [orderBy, { id: "asc" }], skip: (page - 1) * PER, take: PER })]);
  const pages = Math.max(1, Math.ceil(total / PER));
  const qs = (o: Record<string, string>) => { const p = new URLSearchParams(Object.entries({ q, sort, ...o }).filter(([, v]) => v) as [string, string][]).toString(); return `/categories/${cat.slug}${p ? `?${p}` : ""}`; };
  return (<main className="max-w-3xl mx-auto pb-24"><SiteHeader back="/" />
    <section className="relative m-4 rounded-3xl overflow-hidden bg-ink min-h-[150px] flex items-end">
      {cat.image && <img src={cat.image} alt="" className="absolute inset-0 w-full h-full object-cover opacity-60" />}
      <div className="relative p-5 text-white w-full bg-gradient-to-t from-ink/90 to-transparent pt-16"><h1 className="text-2xl font-extrabold">{pick(L, cat.nameAr, cat.nameEn)}</h1>
        {pick(L, cat.subtitleAr, cat.subtitleEn) && <p className="text-lime text-sm font-bold mt-0.5">{pick(L, cat.subtitleAr, cat.subtitleEn)}</p>}
        {cat.descriptionAr && !en && <p className="text-sm text-white/80 mt-1">{cat.descriptionAr}</p>}<span className="inline-block mt-2 bg-lime text-ink text-xs font-extrabold rounded-lg px-2 py-0.5">{total} {en ? "products" : "منتج"}</span></div></section>
    <div className="flex gap-2 overflow-x-auto px-4 pb-3">{cats.map((c) => <Link key={c.id} href={`/categories/${c.slug}`} className={`px-4 py-2 rounded-full whitespace-nowrap ${c.id === cat.id ? "bg-lime font-bold" : "bg-soft"}`}>{pick(L, c.nameAr, c.nameEn)}</Link>)}</div>
    <form className="px-4 pb-2"><input name="q" type="search" defaultValue={q} placeholder={t(L, "search")} className="w-full border rounded-xl p-3 text-base" />{sort && <input type="hidden" name="sort" value={sort} />}</form>
    <div className="flex gap-2 px-4 pb-1 text-sm items-center overflow-x-auto"><span className="text-steel">{en ? "Sort" : "ترتيب"}:</span>{SORTS.map(([k, ar, e]) => <Link key={k} href={qs({ sort: k, page: "" })} className={`whitespace-nowrap px-3 py-1 rounded-lg ${(sort ?? "") === k ? "bg-ink text-white font-bold" : "text-steel"}`}>{en ? e : ar}</Link>)}</div>
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 p-4">{products.map((p) => <ProductCard key={p.id} p={p} s={s} ws={ws} />)}</div>
    {products.length === 0 && <p className="text-center text-steel p-8">{en ? "No products in this category" : "لا توجد منتجات في هذا التصنيف"}</p>}
    <Pager page={page} pages={pages} href={(n) => qs({ page: n > 1 ? String(n) : "" })} en={en} /></main>);
}
