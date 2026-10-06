import Link from "next/link";
import { db } from "@/lib/db";
import { getLang } from "@/lib/lang";
import SiteHeader from "@/components/SiteHeader";
import CategoryCard from "@/components/CategoryCard";
import Icon from "@/components/Icon";
export const dynamic = "force-dynamic";
export default async function Categories() {
  const L = getLang(), en = L === "en";
  const cats = await db.category.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" }, include: { _count: { select: { products: { where: { isActive: true } } } } } });
  return (<main className="max-w-3xl mx-auto pb-24"><SiteHeader back="/" />
    <div className="mx-4 mt-5 flex justify-between items-center gap-3"><h1 className="relative inline-flex items-center bg-lime text-steel rounded-full ps-7 pe-4 py-1.5 text-[15px]"><i className="absolute start-2.5 w-2.5 h-2.5 bg-accent rotate-45" />{en ? "Categories" : "التصنيفات"}</h1>
      <Link href="/products" className="inline-flex items-center gap-1 text-[13px] font-bold text-steel">{en ? "View all products" : "عرض كل المنتجات"}<Icon n="chev" s={16} className="rtl:rotate-180" /></Link></div>
    <section className="p-4 grid grid-cols-2 md:grid-cols-3 gap-3">{cats.map((c) => <CategoryCard key={c.id} c={c} L={L} />)}</section></main>);
}
