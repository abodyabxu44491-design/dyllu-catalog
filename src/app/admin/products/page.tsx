import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { pageParam } from "@/lib/format";
import ProductToggles from "@/components/admin/ProductToggles";
import RowActions from "@/components/admin/RowActions";
import { AEmpty, APager, Badge, PageHead } from "@/components/admin/ui";
import Icon from "@/components/Icon";
export const dynamic = "force-dynamic";
const PER = 20;
const TABS: [string, string, Prisma.ProductWhereInput][] = [["", "الكل", {}], ["active", "ظاهر", { isActive: true }], ["hidden", "مخفي", { isActive: false }], ["out", "غير متوفر", { inStock: false }], ["featured", "مميز", { isFeatured: true }], ["nows", "بلا سعر جملة", { wholesalePrice: null }]];
export default async function List({ searchParams }: { searchParams: { q?: string; cat?: string; st?: string; page?: string } }) {
  const { q, cat, st } = searchParams, page = pageParam(searchParams.page), tab = TABS.find(([k]) => k === (st ?? "")) ?? TABS[0];
  const base: Prisma.ProductWhereInput = { ...(Number.isInteger(Number(cat)) && cat && { categoryId: Number(cat) }),
    ...(q && { OR: [{ nameAr: { contains: q, mode: "insensitive" } }, { nameEn: { contains: q, mode: "insensitive" } }, { sku: { contains: q, mode: "insensitive" } }] }) };
  const where = { ...base, ...tab[2] };
  const [cats, total, ps, counts] = await Promise.all([db.category.findMany({ orderBy: { sortOrder: "asc" } }), db.product.count({ where }),
    db.product.findMany({ where, include: { category: true, images: { orderBy: { sortOrder: "asc" }, take: 1 } }, orderBy: [{ sortOrder: "asc" }, { id: "desc" }], skip: (page - 1) * PER, take: PER }),
    Promise.all(TABS.map(([, , w]) => db.product.count({ where: { ...base, ...w } })))]);
  const pages = Math.max(1, Math.ceil(total / PER)), href = (o: Record<string, string | undefined>) => "/admin/products?" + new URLSearchParams(Object.entries({ q, cat, st, ...o }).filter(([, v]) => v) as [string, string][]).toString();
  const num = (v: unknown) => (v == null ? <span className="text-steel">—</span> : Number(v).toLocaleString("en-US"));
  const Thumb = ({ p }: { p: (typeof ps)[number] }) => <span className="relative w-14 h-14 rounded-xl bg-soft shrink-0 overflow-hidden border border-line">{p.images[0] ? <img src={p.images[0].url} alt="" className="w-full h-full object-contain" /> : <Icon n="image" s={22} className="m-auto mt-4 text-steel/40" />}{!p.isActive && <span className="absolute inset-0 bg-white/60 grid place-items-center"><Icon n="eyeOff" s={18} className="text-steel" /></span>}</span>;
  return (<div>
    <PageHead title={`المنتجات`} desc="أضف منتجاتك وعدّل أسعارها وحالتها. التبديلات السريعة تُحفظ فورًا."><Link href="/admin/products/new" className="btn btn-md btn-lime"><Icon n="plus" s={18} />إضافة منتج</Link></PageHead>
    <div className="-mx-4 px-4 sm:mx-0 sm:px-0 flex gap-2 overflow-x-auto no-scrollbar mb-3">{TABS.map(([k, l], i) => <Link key={k} href={href({ st: k || undefined, page: undefined })} className={`chip h-9 ${tab[0] === k ? "chip-on" : "chip-off"}`}>{l}<small className={`rounded-md px-1.5 text-[11px] ${tab[0] === k ? "bg-white/20" : "bg-soft"}`}>{counts[i]}</small></Link>)}</div>
    <form className="flex flex-wrap gap-2 mb-4">{st && <input type="hidden" name="st" value={st} />}
      <div className="relative flex-1 min-w-[200px]"><Icon n="search" s={18} className="absolute start-3.5 top-1/2 -translate-y-1/2 text-steel" /><input name="q" defaultValue={q} placeholder="بحث بالاسم أو رقم الموديل (SKU)" className="field ps-10 h-11" /></div>
      <select name="cat" defaultValue={cat ?? ""} className="field h-11 w-auto min-w-[160px]"><option value="">كل التصنيفات</option>{cats.map((c) => <option key={c.id} value={c.id}>{c.nameAr}</option>)}</select>
      <button className="btn btn-md btn-dark">تصفية</button>{(q || cat) && <Link href={href({ q: undefined, cat: undefined, page: undefined })} className="btn btn-md btn-ghost">مسح</Link>}</form>

    {ps.length === 0 ? <div className="card"><AEmpty icon="box" title={q || cat || st ? "لا توجد منتجات مطابقة" : "لم تضف أي منتج بعد"}><Link href="/admin/products/new" className="btn btn-md btn-lime"><Icon n="plus" s={18} />إضافة منتج</Link></AEmpty></div> : <>
      {/* كمبيوتر: جدول */}
      <div className="hidden lg:block card overflow-hidden"><table className="w-full text-sm">
        <thead className="bg-soft text-steel text-xs"><tr><th className="text-start font-bold p-3 ps-4">المنتج</th><th className="text-start font-bold p-3">التصنيف</th><th className="text-start font-bold p-3">السعر</th><th className="text-start font-bold p-3">الجملة</th><th className="text-start font-bold p-3">الحالة</th><th className="p-3 pe-4" /></tr></thead>
        <tbody className="divide-y divide-line">{ps.map((p) => (<tr key={p.id} className={`hover:bg-soft/60 ${p.isActive ? "" : "bg-soft/40"}`}>
          <td className="p-3 ps-4"><Link href={`/admin/products/${p.id}`} className="flex items-center gap-3 min-w-0"><Thumb p={p} /><span className="min-w-0"><b className="block line-clamp-1">{p.nameAr}</b><small className="block text-xs text-steel line-clamp-1" dir="ltr" style={{ textAlign: "start" }}>{p.sku ? `${p.sku} · ` : ""}{p.nameEn}</small></span></Link></td>
          <td className="p-3 text-steel">{p.category.nameAr}</td><td className="p-3 font-bold">{num(p.price)}{!p.showPrice && p.price != null && <Badge cls="bg-soft text-steel ms-1">مخفي</Badge>}</td><td className="p-3 font-bold">{num(p.wholesalePrice)}</td>
          <td className="p-3"><ProductToggles id={p.id} init={{ isActive: p.isActive, inStock: p.inStock, isFeatured: p.isFeatured, showPrice: p.showPrice, allowCart: p.allowCart }} /></td>
          <td className="p-3 pe-4"><RowActions id={p.id} slug={p.slug} /></td></tr>))}</tbody></table></div>
      {/* جوال/تابلت: بطاقات */}
      <div className="lg:hidden grid sm:grid-cols-2 gap-3">{ps.map((p) => (<div key={p.id} className={`card p-3 space-y-3 ${p.isActive ? "" : "opacity-80"}`}>
        <Link href={`/admin/products/${p.id}`} className="flex gap-3"><Thumb p={p} /><span className="min-w-0 flex-1"><b className="block text-sm line-clamp-2">{p.nameAr}</b><small className="block text-xs text-steel">{p.category.nameAr}{p.sku ? ` · ${p.sku}` : ""}</small>
          <span className="flex gap-3 text-xs mt-1"><span>عادي: <b>{num(p.price)}</b></span><span>جملة: <b>{num(p.wholesalePrice)}</b></span></span></span></Link>
        <ProductToggles id={p.id} init={{ isActive: p.isActive, inStock: p.inStock, isFeatured: p.isFeatured, showPrice: p.showPrice, allowCart: p.allowCart }} />
        <div className="border-t border-line pt-2 flex justify-end"><RowActions id={p.id} slug={p.slug} /></div></div>))}</div>
      <p className="text-xs text-steel text-center mt-3">{total} منتج</p>
      <APager page={page} pages={pages} href={(n) => href({ page: String(n) })} /></>}
  </div>);
}
