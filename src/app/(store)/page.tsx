import Link from "next/link";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { getLang, pick, txt } from "@/lib/lang";
import { getWholesale } from "@/lib/wholesale";
import { cardInclude } from "@/lib/catalog";
import { oldPriceOf, priceLabel, priceOf } from "@/lib/format";
import ProductCard from "@/components/ProductCard";
import CategoryCard from "@/components/CategoryCard";
import BannerCarousel, { type Slide } from "@/components/BannerCarousel";
import SearchBox from "@/components/SearchBox";
import RecentlyViewed from "@/components/RecentlyViewed";
import Icon from "@/components/Icon";
import { SectionHead } from "@/components/ui";
import { activeOffers, offerFor, onSaleWhere } from "@/lib/offers";
export const dynamic = "force-dynamic";
// الترتيب: بنر (إعلانات أو واجهة ثابتة) ← بحث (جوال) ← تصنيفات ← العروض ← مميز ← وصل حديثًا. كل النصوص من الإعدادات.
export default async function Home() {
  const L = getLang(), en = L === "en", ws = !!(await getWholesale()), now = new Date();
  const [s, cats, featured, latest, banners] = await Promise.all([getSettings(),
    db.category.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" }, take: 12, include: { _count: { select: { products: { where: { isActive: true } } } } } }),
    db.product.findMany({ where: { isActive: true, isFeatured: true }, include: cardInclude, orderBy: [{ sortOrder: "asc" }, { id: "asc" }], take: 8 }),
    db.product.findMany({ where: { isActive: true }, include: cardInclude, orderBy: { id: "desc" }, take: 8 }),
    db.banner.findMany({ where: { isActive: true, AND: [{ OR: [{ startsAt: null }, { startsAt: { lte: now } }] }, { OR: [{ endsAt: null }, { endsAt: { gte: now } }] }] }, orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
      include: { product: { include: { images: { orderBy: { sortOrder: "asc" }, take: 1 }, category: { select: { nameAr: true, nameEn: true } } } } } })]);
  // العروض: منتجات عليها خصم فعّال الآن (القسم يظهر فقط عند وجود عروض)
  const [offers, saleWhere] = await Promise.all([activeOffers(), onSaleWhere()]);
  const sale = saleWhere ? await db.product.findMany({ where: { isActive: true, AND: [saleWhere, { OR: [{ showPrice: true, price: { not: null } }, ...(ws ? [{ wholesalePrice: { not: null } }] : [])] }] }, include: cardInclude, orderBy: [{ isFeatured: "desc" }, { sortOrder: "asc" }], take: 8 }) : [];
  const T = (k: string) => txt(s, L, k), cur = en ? s["currency.en"] || "SAR" : s["currency.ar"], hidden = en ? "Contact us" : s["price.hiddenLabel.ar"];
  // إعلان المنتج: بياناته وسعره (حسب الجملة/الإخفاء) من المنتج نفسه، والضغط يفتح صفحته. يُتجاهل إن كان المنتج مخفيًا أو محذوفًا
  const slides = banners.flatMap((b): Slide[] => {
    const base = { id: b.id, seconds: b.seconds };
    if (b.type === "PRODUCT") { const p0 = b.product; if (!p0 || !p0.isActive) return []; const p = { ...p0, offer: offerFor(p0, offers) };
      return [{ ...base, href: `/products/${p.slug}`, ad: { kind: "PRODUCT" as const, template: b.template, rtl: !en, image: b.image || p.images[0]?.url || "", title: pick(L, b.titleAr, b.titleEn) || pick(L, p.nameAr, p.nameEn), subtitle: pick(L, b.subtitleAr, b.subtitleEn) || pick(L, p.category.nameAr, p.category.nameEn), button: pick(L, b.buttonAr, b.buttonEn) || (en ? "Order now" : "اطلب الآن"), badge: pick(L, b.badgeAr, b.badgeEn), price: b.showPrice && priceOf(p, ws) != null ? priceLabel(p, s, L, ws) : null, oldPrice: b.showPrice && oldPriceOf(p, ws) != null ? priceLabel({ ...p, offer: null }, s, L, ws) : null, sku: p.sku } }]; }
    const x = b.type === "IMAGE_TEXT";
    return [{ ...base, href: b.linkUrl ?? "", ad: { kind: b.type, template: "", rtl: !en, image: b.image, title: x ? pick(L, b.titleAr, b.titleEn) : "", subtitle: x ? pick(L, b.subtitleAr, b.subtitleEn) : "", button: x && b.linkUrl ? pick(L, b.buttonAr, b.buttonEn) : "", badge: "", price: null } }];
  });
  const grid = "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5";
  return (<div className="wrap pt-4 md:pt-6 space-y-10 md:space-y-14">
    <div className="space-y-4">
      {slides.length > 0 ? <BannerCarousel slides={slides} rtl={!en} /> :
        <section className="relative overflow-hidden bg-lime rounded-3xl aspect-[16/10] sm:aspect-[16/9] md:aspect-[2.6/1] lg:aspect-[3/1]">
          <span className="absolute -bottom-24 -end-16 w-72 h-72 md:w-[28rem] md:h-[28rem] rounded-full bg-white/25" />
          <img src={s["hero.image"] || "/brand/logo-badge.png"} alt="" className="absolute end-4 md:end-12 top-1/2 -translate-y-1/2 h-[70%] md:h-[78%] max-w-[40%] object-contain" />
          <div className="relative h-full flex flex-col justify-center items-start gap-2 md:gap-4 p-5 md:p-12 lg:p-16 pe-[44%]">
            <h1 className="text-xl sm:text-3xl md:text-4xl lg:text-5xl leading-tight text-ink">{T("home.title")}</h1>
            <p className="text-sm md:text-lg text-ink/70 line-clamp-2">{T("home.sub")}</p>
            <Link href="/products" className="mt-1 md:mt-3 btn btn-md md:btn-lg btn-dark">{T("home.cta")}<Icon n="chev" s={18} className="flip-rtl" /></Link>
          </div>
          <i className="absolute inset-x-0 bottom-0 h-1 bg-accent" />
        </section>}
      <div className="md:hidden"><SearchBox placeholder={T("search.ph")} cur={cur} hidden={hidden} size="lg" /></div>
    </div>

    {cats.length > 0 && <section className="space-y-4 md:space-y-6">
      <SectionHead title={T("home.cats")} href={cats.length > 6 ? "/categories" : "/products"} more={cats.length > 6 ? T("home.allCats") : T("home.allProducts")} />
      <div className={`grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 ${cats.length <= 6 ? "lg:grid-cols-6" : "lg:grid-cols-4"}`}>{cats.map((c) => <CategoryCard key={c.id} c={c} L={L} />)}</div>
    </section>}

    {sale.length > 0 && <section className="space-y-4 md:space-y-6">
      <SectionHead title={en ? "Offers" : "العروض"} href="/products?sale=1" more={en ? "All offers" : "كل العروض"} />
      <div className={grid}>{sale.map((p) => <ProductCard key={p.id} p={p} s={s} ws={ws} />)}</div>
    </section>}

    {featured.length > 0 && <section className="space-y-4 md:space-y-6">
      <SectionHead title={T("home.featured")} href="/products?featured=1" more={T("home.allFeatured")} />
      <div className={grid}>{featured.map((p) => <ProductCard key={p.id} p={p} s={s} ws={ws} />)}</div>
    </section>}

    {latest.length > 0 && <section className="space-y-4 md:space-y-6">
      <SectionHead title={T("home.new")} href="/products?sort=new" more={T("home.allProducts")} />
      {/* جوال: صف أفقي بالسحب · تابلت/كمبيوتر: شبكة */}
      <div className="-mx-4 px-4 flex gap-3 overflow-x-auto snap-x snap-mandatory no-scrollbar sm:mx-0 sm:px-0 sm:grid sm:grid-cols-3 lg:grid-cols-4 sm:gap-4 lg:gap-5 sm:overflow-visible">
        {latest.map((p) => <div key={p.id} className="snap-start shrink-0 w-[46%] xs:w-[40%] sm:w-auto flex"><div className="w-full flex [&>article]:w-full"><ProductCard p={p} s={s} ws={ws} /></div></div>)}</div>
    </section>}

    <RecentlyViewed cur={cur} hidden={hidden} />

  </div>);
}
