import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { pageParam } from "@/lib/format";
import ProductToggles from "@/components/admin/ProductToggles";
export const dynamic = "force-dynamic";
const PER = 20;
export default async function List({ searchParams }: { searchParams: { q?: string; cat?: string; st?: string; page?: string } }) {
  const { q, cat, st } = searchParams, page = pageParam(searchParams.page);
  const where: Prisma.ProductWhereInput = { ...(Number.isInteger(Number(cat)) && cat && { categoryId: Number(cat) }), ...(st === "hidden" && { isActive: false }), ...(st === "active" && { isActive: true }), ...(st === "nows" && { wholesalePrice: null }), ...(st === "out" && { inStock: false }),
    ...(q && { OR: [{ nameAr: { contains: q, mode: "insensitive" } }, { nameEn: { contains: q, mode: "insensitive" } }, { sku: { contains: q, mode: "insensitive" } }] }) };
  const [cats, total, ps] = await Promise.all([db.category.findMany({ orderBy: { sortOrder: "asc" } }), db.product.count({ where }),
    db.product.findMany({ where, include: { category: true, images: { orderBy: { sortOrder: "asc" }, take: 1 } }, orderBy: [{ sortOrder: "asc" }, { id: "desc" }], skip: (page - 1) * PER, take: PER })]);
  const pages = Math.max(1, Math.ceil(total / PER)), href = (n: number) => "/admin/products?" + new URLSearchParams(Object.entries({ q, cat, st, page: String(n) }).filter(([, v]) => v) as [string, string][]).toString();
  const f = "border rounded-xl p-2 bg-white";
  return (<div className="space-y-4">
    <div className="flex justify-between items-center"><h1 className="text-xl font-extrabold">المنتجات ({total})</h1><Link href="/admin/products/new" className="bg-lime font-extrabold rounded-xl px-4 py-2">+ إضافة منتج</Link></div>
    <form className="flex flex-wrap gap-2"><input name="q" defaultValue={q} placeholder="بحث: اسم أو SKU" className={`${f} flex-1 min-w-[160px]`} />
      <select name="cat" defaultValue={cat ?? ""} className={f}><option value="">كل التصنيفات</option>{cats.map((c) => <option key={c.id} value={c.id}>{c.nameAr}</option>)}</select>
      <select name="st" defaultValue={st ?? ""} className={f}><option value="">كل الحالات</option><option value="active">ظاهر</option><option value="hidden">مخفي</option><option value="out">غير متوفر</option><option value="nows">بلا سعر جملة</option></select>
      <button className="bg-ink text-white font-bold rounded-xl px-4">تصفية</button></form>
    <div className="space-y-2">{ps.map((p) => (<div key={p.id} className="bg-white rounded-2xl p-3 flex gap-3 items-center flex-wrap">
      <div className="w-16 h-16 rounded-xl bg-soft shrink-0 overflow-hidden">{p.images[0] && <img src={p.images[0].url} alt="" className="w-full h-full object-contain" />}</div>
      <div className="flex-1 min-w-[180px]"><Link href={`/admin/products/${p.id}`} className="font-bold" dir="ltr">{p.nameEn}</Link><div className="text-sm">{p.nameAr}</div><div className="text-xs text-steel">{p.category.nameAr}{p.sku ? ` · ${p.sku}` : ""}</div></div>
      <div className="text-sm min-w-[110px]"><div>عادي: <b>{p.price != null ? Number(p.price) : "-"}</b></div><div>جملة: <b>{p.wholesalePrice != null ? Number(p.wholesalePrice) : "-"}</b></div></div>
      <ProductToggles id={p.id} init={{ isActive: p.isActive, inStock: p.inStock, isFeatured: p.isFeatured, showPrice: p.showPrice, allowCart: p.allowCart }} />
      <Link href={`/admin/products/${p.id}`} className="border rounded-xl px-3 py-1 text-sm font-bold">تعديل</Link></div>))}
      {ps.length === 0 && <p className="text-steel text-center p-8">لا توجد منتجات مطابقة.</p>}</div>
    {pages > 1 && <div className="flex gap-2 justify-center items-center">{page > 1 && <Link href={href(page - 1)} className="border bg-white rounded-xl px-3 py-1">السابق</Link>}<span className="text-sm">{page} / {pages}</span>{page < pages && <Link href={href(page + 1)} className="border bg-white rounded-xl px-3 py-1">التالي</Link>}</div>}
  </div>);
}
