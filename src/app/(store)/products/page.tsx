import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSettings } from "@/lib/settings";
import { getLang, t, txt } from "@/lib/lang";
import ProductBrowser, { type BrowseParams } from "@/components/ProductBrowser";
import { Crumbs, SectionHead } from "@/components/ui";
export const dynamic = "force-dynamic";
export async function generateMetadata({ searchParams }: { searchParams: BrowseParams }): Promise<Metadata> {
  const L = getLang(); return { title: searchParams.sale ? (L === "en" ? "Offers" : "العروض") : searchParams.q ? `${t(L, "resultsFor")} «${searchParams.q}»` : t(L, "all") };
}
// كل المنتجات: بحث وفلاتر وترتيب. الروابط القديمة ?category=slug تُحوَّل إلى صفحة التصنيف
export default async function Products({ searchParams }: { searchParams: BrowseParams }) {
  if (searchParams.category) { const { category, ...rest } = searchParams; const p = new URLSearchParams(rest as Record<string, string>).toString(); redirect(`/categories/${encodeURIComponent(category)}${p ? `?${p}` : ""}`); }
  const L = getLang(), s = await getSettings();
  const title = searchParams.sale ? (L === "en" ? "Offers" : "العروض") : searchParams.featured ? txt(s, L, "home.featured") : searchParams.q ? t(L, "search") : t(L, "all");
  return (<div className="wrap pt-5 md:pt-8 space-y-5 md:space-y-7">
    <div className="space-y-3"><Crumbs items={[[t(L, "home"), "/"], [title]]} /><SectionHead as="h1" title={title} /></div>
    <ProductBrowser sp={searchParams} />
  </div>);
}
