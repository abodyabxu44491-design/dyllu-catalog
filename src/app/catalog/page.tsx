import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { getWholesale } from "@/lib/wholesale";
import { getLang, pick } from "@/lib/lang";
import { isWsPrice, priceLabel } from "@/lib/format";
import { isPhone, prettyPhone } from "@/lib/phone";
import PrintButton from "@/components/PrintButton";
import Icon from "@/components/Icon";
import SortSelect from "@/components/SortSelect";
export const dynamic = "force-dynamic";
export async function generateMetadata(): Promise<Metadata> { return { title: getLang() === "en" ? "Price list" : "قائمة الأسعار" }; }
// قائمة أسعار قابلة للطباعة / الحفظ PDF: كل المنتجات الظاهرة مجمّعة حسب التصنيف. عميل الجملة يرى أسعار الجملة تلقائيًا
export default async function Catalog({ searchParams }: { searchParams: { cat?: string; img?: string } }) {
  const L = getLang(), en = L === "en", ws = await getWholesale(), imgs = searchParams.img !== "0";
  const [s, cats] = await Promise.all([getSettings(), db.category.findMany({ where: { isActive: true, ...(searchParams.cat && { slug: searchParams.cat }) }, orderBy: { sortOrder: "asc" },
    include: { products: { where: { isActive: true }, orderBy: [{ sortOrder: "asc" }, { id: "asc" }], include: { images: { orderBy: { sortOrder: "asc" }, take: 1 } } } } })]);
  const all = await db.category.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" }, select: { slug: true, nameAr: true, nameEn: true } });
  const list = cats.filter((c) => c.products.length), count = list.reduce((n, c) => n + c.products.length, 0), wa = s["whatsapp.number"];
  const href = (o: Record<string, string | undefined>) => { const p = new URLSearchParams(Object.entries({ cat: searchParams.cat, img: searchParams.img, ...o }).filter(([, v]) => v) as [string, string][]).toString(); return `/catalog${p ? `?${p}` : ""}`; };
  return (<main className="min-h-screen bg-soft print:bg-white py-6 print:py-0 px-4 print:px-0">
    <div className="no-print max-w-4xl mx-auto mb-4 flex flex-wrap items-center gap-2">
      <Link href="/" className="btn btn-md btn-ghost"><Icon n="chev" s={16} className="rotate-180 rtl:rotate-0" />{en ? "Back to catalog" : "العودة للمتجر"}</Link>
      <SortSelect icon="grid" label={en ? "Category" : "التصنيف"} value={searchParams.cat ?? ""} options={[{ v: "", label: en ? "All categories" : "كل التصنيفات", href: href({ cat: undefined }) }, ...all.map((c) => ({ v: c.slug, label: pick(L, c.nameAr, c.nameEn), href: href({ cat: c.slug }) }))]} />
      <Link href={href({ img: imgs ? "0" : undefined })} className="btn btn-md btn-ghost"><Icon n={imgs ? "eyeOff" : "image"} s={18} />{imgs ? (en ? "Hide images" : "بدون صور") : (en ? "Show images" : "مع الصور")}</Link>
      <div className="ms-auto w-full sm:w-auto"><PrintButton /></div>
    </div>
    <article className="max-w-4xl mx-auto bg-white rounded-3xl print:rounded-none overflow-hidden shadow-card print:shadow-none">
      <div className="dy-stripe" />
      <header className="p-5 md:p-8 flex flex-wrap items-center justify-between gap-4 border-b border-line">
        <img src={s["logo.url"] || "/brand/logo-wordmark.png"} alt="DYLLU" className="h-12 w-auto" />
        <div className="text-end"><span className="dy-tab">{en ? "Price list" : "قائمة الأسعار"}</span>
          <small className="block text-steel mt-2">{new Date().toLocaleDateString(en ? "en-GB" : "ar-SA", { dateStyle: "long" })} · {count} {en ? "products" : "منتج"}{ws ? ` · ${en ? "Wholesale prices" : "أسعار الجملة"}: ${ws.name}` : ""}</small></div>
      </header>
      {list.map((c) => (<section key={c.id} className="p-5 md:p-8 pt-6 break-inside-avoid-page">
        <h2 className="flex items-center gap-2 text-lg mb-3"><i className="w-1.5 h-6 rounded bg-accent" />{pick(L, c.nameAr, c.nameEn)}<small className="text-steel font-sans font-normal text-sm">({c.products.length})</small></h2>
        <table className="w-full text-sm"><thead><tr className="text-steel text-xs border-b-2 border-ink">{imgs && <th className="w-14 pb-2" />}<th className="text-start pb-2 font-bold">{en ? "Product" : "المنتج"}</th><th className="text-start pb-2 font-bold w-28">{en ? "Model" : "الموديل"}</th><th className="text-end pb-2 font-bold w-32">{en ? "Price" : "السعر"}</th></tr></thead>
          <tbody>{c.products.map((p) => (<tr key={p.id} className="border-b border-line break-inside-avoid">
            {imgs && <td className="py-2"><span className="block w-12 h-12 rounded-lg bg-soft overflow-hidden">{p.images[0] && <img src={p.images[0].url} alt="" className="w-full h-full object-contain" />}</span></td>}
            <td className="py-2 pe-2"><Link href={`/products/${p.slug}`} className="font-bold hover:underline">{pick(L, p.nameAr, p.nameEn)}</Link>{(en ? p.nameAr : p.nameEn) && <small className="block text-xs text-steel" dir={en ? "rtl" : "ltr"} style={{ textAlign: "start" }}>{en ? p.nameAr : p.nameEn}</small>}{!p.inStock && <small className="text-xs text-accent font-bold">{en ? "Currently unavailable" : "غير متوفر حاليًا"}</small>}</td>
            <td className="py-2 text-xs text-steel" dir="ltr" style={{ textAlign: "start" }}>{p.sku ?? "—"}</td>
            <td className="py-2 text-end font-bold whitespace-nowrap">{priceLabel(p, s, L, !!ws)}{isWsPrice(p, !!ws) && <small className="block text-[10px] text-steel font-normal">{en ? "wholesale" : "جملة"}</small>}</td></tr>))}</tbody></table>
      </section>))}
      {list.length === 0 && <p className="p-10 text-center text-steel">{en ? "No products" : "لا توجد منتجات"}</p>}
      <footer className="p-5 md:p-8 border-t border-line text-xs text-steel flex flex-wrap justify-between gap-2"><span>{en ? "Prices may change without notice." : "الأسعار قابلة للتغيير دون إشعار مسبق."}</span>{isPhone(wa) && <span>{en ? "Orders" : "للطلب"}: <b dir="ltr">{prettyPhone(wa)}</b></span>}</footer>
      <div className="bg-lime px-5 md:px-8 py-2 text-end shadow-[0_-3px_0_theme(colors.accent)]"><b className="text-steel text-xs" dir="ltr">DYLLU, Discover your Power</b></div>
    </article>
  </main>);
}
