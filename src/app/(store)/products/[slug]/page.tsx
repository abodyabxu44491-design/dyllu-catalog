import type { Metadata } from "next";
import { cache } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { isWsPrice, priceLabel, priceOf } from "@/lib/format";
import { getWholesale } from "@/lib/wholesale";
import { cardInclude } from "@/lib/catalog";
import { isPhone, telHref, waHref } from "@/lib/phone";
import Linkify from "@/components/Linkify";
import { getLang, pick, t } from "@/lib/lang";
import ProductCard from "@/components/ProductCard";
import ProductGallery from "@/components/ProductGallery";
import ShareButtons from "@/components/ShareButtons";
import RecentlyViewed from "@/components/RecentlyViewed";
import AddToCart from "@/components/AddToCart";
import Icon from "@/components/Icon";
import { Crumbs, SectionHead } from "@/components/ui";
import { siteUrl } from "@/lib/siteUrl";
export const dynamic = "force-dynamic";
// cache: العنوان (generateMetadata) والصفحة يشتركان في استعلام واحد
const find = cache((slug: string) => db.product.findFirst({ where: { slug: decodeURIComponent(slug), isActive: true }, include: { images: { orderBy: { sortOrder: "asc" } }, specs: { orderBy: { sortOrder: "asc" } }, features: { orderBy: { sortOrder: "asc" } }, documents: true, category: true } }));
export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const p = await find(params.slug), L = getLang();
  return p ? { title: pick(L, p.nameAr, p.nameEn), description: (pick(L, p.descriptionAr, p.descriptionEn) || p.nameEn).slice(0, 160), openGraph: { title: pick(L, p.nameAr, p.nameEn), images: p.images[0] ? [p.images[0].url] : [] } } : {};
}
const Sec = ({ title, children, className = "" }: { title: string; children: React.ReactNode; className?: string }) => (<section className={`space-y-3 ${className}`}><SectionHead title={title} /><div className="card overflow-hidden">{children}</div></section>);
// صفحة المنتج: كمبيوتر = عمودان (المعرض | البيانات والشراء) · جوال = معرض بالسحب وشريط شراء ثابت أسفل الشاشة
export default async function ProductPage({ params }: { params: { slug: string } }) {
  const [s, p] = await Promise.all([getSettings(), find(params.slug)]);
  if (!p) notFound();
  const L = getLang(), en = L === "en", ws = !!(await getWholesale());
  const related = await db.product.findMany({ where: { categoryId: p.categoryId, isActive: true, id: { not: p.id } }, include: cardInclude, orderBy: [{ isFeatured: "desc" }, { sortOrder: "asc" }], take: 4 });
  const name = pick(L, p.nameAr, p.nameEn), other = (en ? p.nameAr : p.nameEn) === name ? "" : en ? p.nameAr : p.nameEn, price = priceLabel(p, s, L, ws), priced = priceOf(p, ws) != null;
  const desc = pick(L, p.descriptionAr, p.descriptionEn), cat = p.category, catName = pick(L, cat.nameAr, cat.nameEn), base = siteUrl();
  const wa = s["whatsapp.number"], askUrl = isPhone(wa) ? waHref(wa, `${en ? "Hello, I'd like to ask about" : "السلام عليكم، أرغب في الاستفسار عن"}: ${p.nameEn || p.nameAr}${p.sku ? ` (${p.sku})` : ""}${base ? `\n${base}/products/${p.slug}` : ""}`) : undefined;
  const call = isPhone(s["contact.phone"]) ? s["contact.phone"] : isPhone(wa) ? wa : "";
  return (<div className="wrap pt-4 md:pt-8">
    <div className="flex items-center justify-between gap-3 mb-4 md:mb-6">
      <Link href={`/categories/${cat.slug}`} className="sm:hidden inline-flex items-center gap-1 text-sm font-bold text-steel"><Icon n="chev" s={18} className="rotate-180 rtl:rotate-0" />{catName}</Link>
      <Crumbs items={[[t(L, "home"), "/"], [catName, `/categories/${cat.slug}`], [name]]} />
    </div>

    <div className="grid md:grid-cols-2 gap-6 lg:gap-12 items-start">
      <div className="md:sticky md:top-28"><ProductGallery images={p.images.map((i) => i.url)} alt={name} badge={p.isFeatured ? t(L, "featured") : undefined} /></div>
      <div className="space-y-5">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-extrabold tracking-widest text-accent" dir="ltr" style={{ justifyContent: "flex-start" }}>DYLLU{p.sku && <span className="text-steel">· {p.sku}</span>}</div>
          <h1 className="text-2xl md:text-3xl lg:text-4xl leading-tight">{name}</h1>
          {other && <p className="text-steel md:text-lg" dir={en ? "rtl" : "ltr"} style={{ textAlign: "start" }}>{other}</p>}
          <div className="flex flex-wrap gap-2 pt-1 text-xs font-bold">
            <Link href={`/categories/${cat.slug}`} className="inline-flex items-center gap-1 bg-soft rounded-full px-3 py-1.5 hover:bg-line"><Icon n="grid" s={14} />{catName}</Link>
            <span className={`rounded-full px-3 py-1.5 inline-flex items-center gap-1 ${p.inStock ? "bg-lime/25 text-[#586000]" : "bg-accent/10 text-accent"}`}><Icon n={p.inStock ? "check" : "clock"} s={14} />{p.inStock ? t(L, "inStock") : t(L, "outOfStock")}</span>
          </div>
        </div>
        <div className="rounded-2xl bg-soft p-4 md:p-5 space-y-4">
          <div className="flex items-end justify-between gap-3"><div><small className="block text-xs text-steel font-bold">{t(L, "price")}</small>
            <b className={priced ? "font-display text-3xl md:text-4xl" : "text-xl text-steel"}>{price}</b>{isWsPrice(p, ws) && <span className="ms-2 align-middle bg-ink text-lime text-xs font-extrabold rounded-lg px-2 py-1">{t(L, "wholesale")}</span>}</div></div>
          <div className="hidden md:block">{p.allowCart ? <AddToCart productId={p.id} name={name} full /> : <p className="text-steel font-bold">{t(L, "contactToOrder")}</p>}</div>
        </div>
        {p.features.length > 0 && <ul className="grid sm:grid-cols-2 gap-2">{p.features.slice(0, 6).map((f) => <li key={f.id} className="flex gap-2.5 items-start text-sm"><span className="mt-0.5 bg-lime rounded-full w-5 h-5 grid place-items-center shrink-0"><Icon n="check" s={12} stroke={3} /></span>{pick(L, f.textAr, f.textEn)}</li>)}</ul>}
        <ShareButtons title={name} askUrl={askUrl} callUrl={call ? telHref(call) : undefined} />
      </div>
    </div>

    <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 mt-10 md:mt-14 items-start">
      {desc && <Sec title={t(L, "description")} className={p.specs.length ? "" : "lg:col-span-2"}><p className="p-4 md:p-6 leading-8 text-ink/80 whitespace-pre-line"><Linkify text={desc} /></p></Sec>}
      {p.specs.length > 0 && <Sec title={t(L, "specs")} className={desc ? "" : "lg:col-span-2"}><table className="w-full text-sm md:text-base"><tbody>{p.specs.map((x, i) => <tr key={x.id} className={i % 2 ? "" : "bg-soft"}><th scope="row" className="p-3 md:px-5 text-steel font-normal text-start w-[42%]">{pick(L, x.nameAr, x.nameEn)}</th><td className="p-3 md:px-5 font-bold" dir="ltr" style={{ textAlign: "start" }}>{x.value}</td></tr>)}</tbody></table></Sec>}
      {p.features.length > 6 && <Sec title={t(L, "features")} className="lg:col-span-2"><ul className="grid md:grid-cols-2">{p.features.map((f) => <li key={f.id} className="flex gap-2.5 p-3 md:px-5 border-b border-line text-sm"><span className="mt-0.5 bg-lime rounded-full w-5 h-5 grid place-items-center shrink-0"><Icon n="check" s={12} stroke={3} /></span>{pick(L, f.textAr, f.textEn)}</li>)}</ul></Sec>}
      {p.videoUrl && <Sec title={t(L, "video")}>{/\.(mp4|webm)(\?|$)/i.test(p.videoUrl) ? <video src={p.videoUrl} controls playsInline preload="metadata" className="w-full bg-ink aspect-video" /> : <a href={p.videoUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-4 font-bold hover:bg-soft"><span className="w-11 h-11 rounded-full bg-lime grid place-items-center"><Icon n="play" s={18} /></span>{t(L, "watchVideo")}<Icon n="external" s={16} className="ms-auto text-steel" /></a>}</Sec>}
      {p.documents.length > 0 && <Sec title={t(L, "files")}>{p.documents.map((d) => <a key={d.id} href={d.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-4 border-b border-line last:border-0 font-bold hover:bg-soft"><span className="w-10 h-10 rounded-xl bg-accent/10 text-accent grid place-items-center"><Icon n="doc" s={20} /></span><span className="flex-1">{d.title}</span><Icon n="download" s={18} className="text-steel" /></a>)}</Sec>}
    </div>

    {related.length > 0 && <section className="mt-12 md:mt-16 space-y-4 md:space-y-6"><SectionHead title={t(L, "related")} href={`/categories/${cat.slug}`} more={t(L, "viewAll")} />
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">{related.map((r) => <ProductCard key={r.id} p={r} s={s} ws={ws} />)}</div></section>}

    <div className="mt-12 md:mt-16"><RecentlyViewed track={p.id} exclude={p.id} cur={en ? s["currency.en"] || "SAR" : s["currency.ar"]} hidden={en ? "Contact us" : s["price.hiddenLabel.ar"]} /></div>

    {/* شريط الشراء الثابت (جوال/تابلت) */}
    <div className="h-24 md:hidden" aria-hidden />
    <div className="md:hidden fixed inset-x-0 bottom-0 z-30 bg-white/95 backdrop-blur border-t border-line pb-safe no-print"><div className="wrap py-3 flex items-center gap-3">
      <div className="min-w-[72px]"><small className="block text-steel text-[11px] font-bold">{t(L, "price")}</small><b className={priced ? "font-display" : "text-sm text-steel"}>{price}</b></div>
      <div className="flex-1">{p.allowCart ? <AddToCart productId={p.id} name={name} full /> : askUrl ? <a href={askUrl} target="_blank" rel="noopener noreferrer" className="btn btn-lg btn-lime w-full"><Icon n="whatsapp" s={20} />{t(L, "contactToOrder")}</a> : <span className="block text-center text-steel text-sm font-bold">{t(L, "contactToOrder")}</span>}</div>
    </div></div>
  </div>);
}
