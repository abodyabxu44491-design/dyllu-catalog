import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { getWholesale } from "@/lib/wholesale";
import { pageParam } from "@/lib/format";
import { cardInclude, getNavCategories, orderByFor, searchWhere } from "@/lib/catalog";
import { getLang, pick, t, txt } from "@/lib/lang";
import ProductCard from "./ProductCard";
import Pager from "./Pager";
import SortSelect from "./SortSelect";
import Icon from "./Icon";
import { Empty } from "./ui";
export type BrowseParams = { q?: string; sort?: string; stock?: string; featured?: string; page?: string; category?: string };
const PER = 24;
// قائمة منتجات مشتركة بين «كل المنتجات» وصفحة التصنيف: بحث + تصنيفات + المتوفر فقط + ترتيب + ترقيم.
// كمبيوتر: شريط جانبي للفلاتر · جوال/تابلت: شرائح أفقية وقائمة ترتيب
export default async function ProductBrowser({ sp, category }: { sp: BrowseParams; category?: { id: number; slug: string } }) {
  const L = getLang(), en = L === "en", ws = !!(await getWholesale()), page = pageParam(sp.page);
  const q = sp.q?.trim().slice(0, 60) || undefined, sort = ["new", "low", "high", "name"].includes(sp.sort ?? "") ? sp.sort : undefined, stock = sp.stock === "1" ? "1" : undefined, featured = sp.featured ? "1" : undefined;
  const base = category ? `/categories/${category.slug}` : "/products";
  const href = (o: Record<string, string | undefined>, path = base) => { const p = new URLSearchParams(Object.entries({ q, sort, stock, featured: path === "/products" ? featured : undefined, ...o }).filter(([, v]) => v) as [string, string][]).toString(); return p ? `${path}?${p}` : path; };
  // فلاتر بدون التصنيف (لحساب عدد كل تصنيف في الشريط الجانبي)
  const common: Prisma.ProductWhereInput = { isActive: true, ...(featured && !category && { isFeatured: true }), ...(stock && { inStock: true }), ...searchWhere(q) };
  const where: Prisma.ProductWhereInput = { ...common, ...(category && { categoryId: category.id }) };
  const [s, cats, counts, total, products] = await Promise.all([getSettings(),
    getNavCategories(),
    db.product.groupBy({ by: ["categoryId"], where: common, _count: true }),
    db.product.count({ where }),
    db.product.findMany({ where, include: cardInclude, orderBy: orderByFor(sort, en), skip: (page - 1) * PER, take: PER })]);
  const pages = Math.max(1, Math.ceil(total / PER)), cnt = (id: number) => counts.find((c) => c.categoryId === id)?._count ?? 0, all = counts.reduce((n, c) => n + c._count, 0);
  const sorts = [["", "sortDefault"], ["new", "sortNew"], ["low", "sortLow"], ["high", "sortHigh"], ["name", "sortName"]] as const;
  const sortOpts = sorts.map(([v, k]) => ({ v, label: t(L, k), href: href({ sort: v || undefined }) }));
  const catHref = (slug?: string) => (slug ? href({}, `/categories/${slug}`) : href({}, "/products"));
  const filtered = !!(q || stock || featured);
  const side = "flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-sm font-bold transition";
  return (<div className="lg:grid lg:grid-cols-[250px_1fr] lg:gap-8 xl:gap-10">
    {/* الشريط الجانبي (كمبيوتر) */}
    <aside className="hidden lg:block"><div className="sticky top-28 space-y-6">
      <div><b className="block text-xs text-steel mb-2 px-3">{t(L, "categories")}</b><nav className="space-y-0.5">
        <Link href={catHref()} className={`${side} ${!category ? "bg-lime text-ink" : "hover:bg-soft"}`}><span>{t(L, "all")}</span><small className="font-normal opacity-70">{all}</small></Link>
        {cats.map((c) => <Link key={c.id} href={catHref(c.slug)} className={`${side} ${category?.id === c.id ? "bg-lime text-ink" : "hover:bg-soft"}`}><span>{pick(L, c.nameAr, c.nameEn)}</span><small className="font-normal opacity-70">{cnt(c.id)}</small></Link>)}</nav></div>
      <div><b className="block text-xs text-steel mb-2 px-3">{t(L, "filters")}</b>
        <Link href={href({ stock: stock ? undefined : "1", page: undefined })} className={`${side} hover:bg-soft`} role="switch" aria-checked={!!stock}><span>{t(L, "inStockOnly")}</span>
          <span className={`w-10 h-6 rounded-full p-0.5 transition ${stock ? "bg-ink" : "bg-line"}`}><span className={`block w-5 h-5 rounded-full bg-white transition ${stock ? "translate-x-4 rtl:-translate-x-4" : ""}`} /></span></Link>
        {!category && <Link href={href({ featured: featured ? undefined : "1" })} className={`${side} hover:bg-soft`} role="switch" aria-checked={!!featured}><span>{txt(s, L, "home.featured")}</span>
          <span className={`w-10 h-6 rounded-full p-0.5 transition ${featured ? "bg-ink" : "bg-line"}`}><span className={`block w-5 h-5 rounded-full bg-white transition ${featured ? "translate-x-4 rtl:-translate-x-4" : ""}`} /></span></Link>}
      </div>
    </div></aside>

    <div className="min-w-0">
      {/* شرائح التصنيفات (جوال/تابلت) */}
      <div className="lg:hidden -mx-4 px-4 sm:-mx-6 sm:px-6 flex gap-2 overflow-x-auto no-scrollbar pb-3">
        <Link href={catHref()} className={`chip ${!category ? "chip-on" : "chip-off"}`}>{t(L, "all")}</Link>
        {cats.map((c) => <Link key={c.id} href={catHref(c.slug)} className={`chip ${category?.id === c.id ? "chip-on" : "chip-off"}`}>{pick(L, c.nameAr, c.nameEn)}<small className="opacity-60 font-normal">{cnt(c.id)}</small></Link>)}
      </div>
      {/* شريط الأدوات: عدد النتائج + المتوفر فقط + الترتيب */}
      <div className="flex flex-wrap items-center gap-2 pb-4">
        <p className="text-sm text-steel me-auto"><b className="text-ink">{total}</b> {t(L, "productsCount")}{q && <> · {t(L, "resultsFor")} «<b className="text-ink">{q}</b>»</>}</p>
        <Link href={href({ stock: stock ? undefined : "1", page: undefined })} className={`lg:hidden chip h-10 ${stock ? "chip-on" : "chip-off"}`}>{stock && <Icon n="check" s={14} stroke={3} />}{t(L, "inStockOnly")}</Link>
        <SortSelect label={t(L, "sort")} value={sort ?? ""} options={sortOpts} />
      </div>
      {filtered && <div className="flex flex-wrap gap-2 pb-4">
        {q && <Link href={href({ q: undefined })} className="chip chip-off h-8 text-xs">«{q}»<Icon n="close" s={14} /></Link>}
        {featured && !category && <Link href={href({ featured: undefined })} className="chip chip-off h-8 text-xs">{txt(s, L, "home.featured")}<Icon n="close" s={14} /></Link>}
        {stock && <Link href={href({ stock: undefined })} className="chip chip-off h-8 text-xs">{t(L, "inStockOnly")}<Icon n="close" s={14} /></Link>}
        <Link href={base} className="text-xs font-bold text-accent self-center px-2">{t(L, "clearFilters")}</Link></div>}

      {products.length > 0 ? <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">{products.map((p) => <ProductCard key={p.id} p={p} s={s} ws={ws} />)}</div>
        : <Empty icon="search" title={t(L, "noResults")} sub={t(L, "noResultsSub")}>{filtered && <Link href={base} className="btn btn-md btn-dark">{t(L, "clearFilters")}</Link>}<Link href="/categories" className="btn btn-md btn-ghost">{t(L, "categories")}</Link></Empty>}
      <Pager page={page} pages={pages} href={(n) => href({ page: n > 1 ? String(n) : undefined })} en={en} />
    </div>
  </div>);
}
