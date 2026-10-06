import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { isWsPrice, priceLabel } from "@/lib/format";
import { getWholesale } from "@/lib/wholesale";
import { getLang, pick, t } from "@/lib/lang";
import ProductCard from "@/components/ProductCard";
import Icon from "@/components/Icon";
import SiteHeader from "@/components/SiteHeader";
import AddToCart from "@/components/AddToCart";
export const dynamic = "force-dynamic";
export async function generateMetadata({ params }: { params: { slug: string } }) {
  const p = await db.product.findFirst({ where: { slug: params.slug, isActive: true }, include: { images: { take: 1, orderBy: { sortOrder: "asc" } } } });
  return p ? { title: `${p.nameEn} | DYLLU`, description: p.descriptionAr ?? undefined, openGraph: { images: p.images[0] ? [p.images[0].url] : [] } } : {};
}
const Sec = ({ title, children }: { title: string; children: React.ReactNode }) => (<section className="mx-4 mt-6"><h2 className="relative inline-flex items-center bg-lime text-steel rounded-full ps-7 pe-4 py-1.5 text-[15px]"><i className="absolute start-2.5 w-2.5 h-2.5 bg-accent rotate-45" />{title}</h2><div className="mt-3 border rounded-2xl overflow-hidden bg-white">{children}</div></section>);
export default async function ProductPage({ params }: { params: { slug: string } }) {
  const [s, p] = await Promise.all([getSettings(), db.product.findFirst({ where: { slug: params.slug, isActive: true }, include: { images: { orderBy: { sortOrder: "asc" } }, specs: { orderBy: { sortOrder: "asc" } }, features: { orderBy: { sortOrder: "asc" } }, documents: true, category: true } })]);
  if (!p) notFound();
  const L = getLang(), ws = !!(await getWholesale());
  const related = await db.product.findMany({ where: { categoryId: p.categoryId, isActive: true, id: { not: p.id } }, include: { images: { orderBy: { sortOrder: "asc" }, take: 1 } }, take: 4 });
  const en = L === "en", price = priceLabel(p, s, L, ws), desc = pick(L, p.descriptionAr, p.descriptionEn), cat = p.category;
  return (
    <main className="pb-28 max-w-3xl mx-auto">
      <SiteHeader back={`/categories/${cat.slug}`} />
      <div className="relative bg-soft rounded-b-[28px] overflow-hidden">
        <div className="flex overflow-x-auto snap-x snap-mandatory">{p.images.length ? p.images.map((i) => <img key={i.id} src={i.url} alt={p.nameEn} className="snap-center w-full shrink-0 aspect-square object-contain" />) : <div className="w-full aspect-square grid place-items-center text-8xl font-display text-ink/10">{p.nameEn[0]}</div>}</div>
        {p.isFeatured && <span className="absolute top-3.5 start-3.5 bg-accent text-white text-xs font-extrabold px-3 py-1 rounded-full">{en ? "Featured" : "مميز"}</span>}
        {p.images.length > 1 && <span className="absolute bottom-3 end-3.5 bg-ink/70 text-white text-xs px-2.5 py-1 rounded-full">{p.images.length} {en ? "photos" : "صور"}</span>}
      </div>
      <section className="px-4 pt-4">
        <div className="text-[11px] font-extrabold tracking-widest text-accent">DYLLU{p.sku ? ` · ${p.sku}` : ""}</div>
        <h1 className="text-[22px] leading-tight mt-1" dir="ltr" style={{ textAlign: "start" }}>{p.nameEn}</h1><div className="text-steel">{p.nameAr}</div>
        <div className="flex flex-wrap gap-2 mt-3 text-xs font-bold"><Link href={`/categories/${cat.slug}`} className="bg-soft rounded-full px-3 py-1.5">{pick(L, cat.nameAr, cat.nameEn)}</Link>
          <span className={`rounded-full px-3 py-1.5 inline-flex items-center gap-1 ${p.inStock ? "bg-lime/20 text-[#586000]" : "bg-accent/15 text-accent"}`}>{p.inStock && <Icon n="check" s={14} />}{p.inStock ? (en ? "In stock" : "متوفر") : (en ? "Currently unavailable" : "غير متوفر حاليًا")}</span></div>
        <div className="mt-3 font-display text-[28px]">{price}{isWsPrice(p, ws) && <span className="ms-2 align-middle bg-ink text-lime text-xs font-extrabold rounded-lg px-2 py-0.5">{en ? "Wholesale" : "سعر جملة"}</span>}</div>
      </section>
      {desc && <Sec title={en ? "Description" : "الوصف"}><p className="p-4 leading-8 text-steel text-sm">{desc}</p></Sec>}
      {p.features.length > 0 && <Sec title={t(L, "features")}><ul>{p.features.map((f) => <li key={f.id} className="flex gap-2.5 p-3 border-b last:border-0 text-sm"><span className="mt-0.5 bg-lime rounded-full w-5 h-5 grid place-items-center shrink-0"><Icon n="check" s={12} /></span>{pick(L, f.textAr, f.textEn)}</li>)}</ul></Sec>}
      {p.specs.length > 0 && <Sec title={t(L, "specs")}><table className="w-full text-sm"><tbody>{p.specs.map((x, i) => <tr key={x.id} className={i % 2 ? "" : "bg-soft"}><td className="p-3 text-steel w-[42%]">{pick(L, x.nameAr, x.nameEn)}</td><td className="p-3 font-bold" dir="ltr" style={{ textAlign: "start" }}>{x.value}</td></tr>)}</tbody></table></Sec>}
      {p.videoUrl && <Sec title={en ? "Video" : "فيديو"}>{/\.(mp4|webm)(\?|$)/i.test(p.videoUrl) ? <video src={p.videoUrl} controls playsInline className="w-full bg-ink" /> : <a href={p.videoUrl} target="_blank" rel="noopener" className="flex items-center gap-3 p-4 font-bold"><span className="w-9 h-9 rounded-full bg-lime grid place-items-center"><Icon n="play" s={16} /></span>{en ? "Watch video" : "شاهد الفيديو"}</a>}</Sec>}
      {p.documents.length > 0 && <Sec title={en ? "Files" : "الملفات"}>{p.documents.map((d) => <a key={d.id} href={d.url} className="flex items-center gap-3 p-3 border-b last:border-0 text-sm font-bold"><Icon n="doc" s={20} className="text-steel" />{d.title}</a>)}</Sec>}
      {related.length > 0 && <section className="mx-4 mt-8"><h2 className="font-display text-lg">{en ? "Related products" : "منتجات مرتبطة"}</h2><div className="grid grid-cols-2 gap-3 mt-3">{related.map((r) => <ProductCard key={r.id} p={r} s={s} ws={ws} />)}</div></section>}
      <div className="fixed inset-x-0 bottom-0 z-30 bg-white border-t"><div className="max-w-3xl mx-auto p-3 flex items-center gap-3"><div className="min-w-[84px]"><small className="block text-steel text-[11px]">{en ? "Price" : "السعر"}</small><b>{price}</b></div>
        <div className="flex-1">{p.allowCart ? <AddToCart productId={p.id} withQty /> : <span className="block text-center text-steel text-sm">{en ? "Contact us to order" : "تواصل معنا للطلب"}</span>}</div></div></div>
    </main>
  );
}
