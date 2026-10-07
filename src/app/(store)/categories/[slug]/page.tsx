import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getLang, pick, t } from "@/lib/lang";
import ProductBrowser, { type BrowseParams } from "@/components/ProductBrowser";
import { Crumbs } from "@/components/ui";
import Linkify from "@/components/Linkify";
export const dynamic = "force-dynamic";
const find = (slug: string) => db.category.findFirst({ where: { slug: decodeURIComponent(slug), isActive: true } });
export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const c = await find(params.slug), L = getLang();
  return c ? { title: pick(L, c.nameAr, c.nameEn), description: pick(L, c.subtitleAr, c.subtitleEn) || c.descriptionAr || undefined, openGraph: { images: c.image ? [c.image] : [] } } : {};
}
// صفحة التصنيف: بنر بالصورة والاسم، ثم قائمة المنتجات المشتركة (بحث وفلاتر وترتيب)
export default async function CategoryPage({ params, searchParams }: { params: { slug: string }; searchParams: BrowseParams }) {
  const L = getLang(), en = L === "en", cat = await find(params.slug);
  if (!cat) notFound();
  const name = pick(L, cat.nameAr, cat.nameEn), sub = pick(L, cat.subtitleAr, cat.subtitleEn);
  return (<div className="wrap pt-5 md:pt-8 space-y-5 md:space-y-7">
    <Crumbs items={[[t(L, "home"), "/"], [t(L, "categories"), "/categories"], [name]]} />
    <section className="relative overflow-hidden rounded-3xl bg-ink min-h-[150px] md:min-h-[220px] flex items-end isolate">
      {cat.image && <img src={cat.image} alt="" className="absolute inset-0 w-full h-full object-cover opacity-60 -z-10" />}
      <div className="w-full p-5 md:p-10 bg-gradient-to-t md:bg-gradient-to-r rtl:md:bg-gradient-to-l from-ink/95 via-ink/60 to-transparent text-white">
        <i className="block w-12 h-1.5 bg-accent rounded mb-3" />
        <h1 className="text-2xl md:text-4xl">{name}</h1>
        {sub && <p className="text-lime font-bold mt-1 md:text-lg">{sub}</p>}
        {cat.descriptionAr && !en && <p className="text-sm md:text-base text-white/80 mt-2 max-w-2xl leading-7 [&_a]:text-white"><Linkify text={cat.descriptionAr} /></p>}
      </div>
    </section>
    <ProductBrowser sp={searchParams} category={{ id: cat.id, slug: cat.slug }} />
  </div>);
}
