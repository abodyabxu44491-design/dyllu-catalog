import Link from "next/link";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { getLang, pick, txt } from "@/lib/lang";
import { getWholesale } from "@/lib/wholesale";
import { cardInclude } from "@/lib/catalog";
import ProductCard from "@/components/ProductCard";
import CategoryCard from "@/components/CategoryCard";
import BannerCarousel from "@/components/BannerCarousel";
import SearchBox from "@/components/SearchBox";
import RecentlyViewed from "@/components/RecentlyViewed";
import Icon, { type IconName } from "@/components/Icon";
import { SectionHead } from "@/components/ui";
export const dynamic = "force-dynamic";
// الترتيب: بنر (إعلانات أو واجهة ثابتة) ← بحث (جوال) ← كيف تطلب ← تصنيفات ← مميز ← وصل حديثًا ← شريط الهوية. كل النصوص من الإعدادات.
export default async function Home() {
  const L = getLang(), en = L === "en", ws = !!(await getWholesale()), now = new Date();
  const [s, cats, featured, latest, banners] = await Promise.all([getSettings(),
    db.category.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" }, take: 12, include: { _count: { select: { products: { where: { isActive: true } } } } } }),
    db.product.findMany({ where: { isActive: true, isFeatured: true }, include: cardInclude, orderBy: [{ sortOrder: "asc" }, { id: "asc" }], take: 8 }),
    db.product.findMany({ where: { isActive: true }, include: cardInclude, orderBy: { id: "desc" }, take: 8 }),
    db.banner.findMany({ where: { isActive: true, AND: [{ OR: [{ startsAt: null }, { startsAt: { lte: now } }] }, { OR: [{ endsAt: null }, { endsAt: { gte: now } }] }] }, orderBy: [{ sortOrder: "asc" }, { id: "asc" }] })]);
  const T = (k: string) => txt(s, L, k), cur = en ? s["currency.en"] || "SAR" : s["currency.ar"], hidden = en ? "Contact us" : s["price.hiddenLabel.ar"];
  const slides = banners.map((b) => { const x = b.type === "IMAGE_TEXT"; return { id: b.id, type: b.type, image: b.image, title: x ? pick(L, b.titleAr, b.titleEn) : "", subtitle: x ? pick(L, b.subtitleAr, b.subtitleEn) : "", button: x ? pick(L, b.buttonAr, b.buttonEn) : "", href: b.linkUrl ?? "", seconds: b.seconds }; });
  const steps: [string, IconName][] = [["home.step1", "search"], ["home.step2", "cart"], ["home.step3", "whatsapp"]];
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

    {/* كيف تطلب: 3 خطوات بأيقونات */}
    <section aria-label={T("home.how")} className="grid grid-cols-3 gap-2 sm:gap-4">
      {steps.map(([k, i], n) => (<div key={k} className="relative flex flex-col sm:flex-row items-center sm:items-center gap-2 sm:gap-4 text-center sm:text-start rounded-2xl bg-soft p-3 sm:p-5">
        <span className="relative grid place-items-center w-11 h-11 sm:w-14 sm:h-14 rounded-2xl bg-white text-ink shadow-card shrink-0"><Icon n={i} s={24} /><b className="absolute -top-1.5 -start-1.5 w-6 h-6 rounded-full bg-lime text-ink text-xs grid place-items-center border-2 border-soft">{n + 1}</b></span>
        <span className="min-w-0"><small className="hidden sm:block text-xs text-steel font-bold">{T("home.how")}</small><b className="block text-xs sm:text-base leading-tight">{T(k)}</b></span>
      </div>))}
    </section>

    {cats.length > 0 && <section className="space-y-4 md:space-y-6">
      <SectionHead title={T("home.cats")} href={cats.length > 6 ? "/categories" : "/products"} more={cats.length > 6 ? T("home.allCats") : T("home.allProducts")} />
      <div className={`grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 ${cats.length <= 6 ? "lg:grid-cols-6" : "lg:grid-cols-4"}`}>{cats.map((c) => <CategoryCard key={c.id} c={c} L={L} />)}</div>
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

    {/* شريط الهوية: DYLLU, Discover your Power */}
    <section className="relative overflow-hidden rounded-3xl bg-ink text-white">
      <span className="absolute -top-20 -end-20 w-72 h-72 rounded-full bg-lime/10" /><span className="absolute -bottom-24 end-40 w-56 h-56 rounded-full bg-accent/10" />
      <div className="relative grid md:grid-cols-[auto_1fr_auto] items-center gap-6 p-6 md:p-10">
        <span className="bg-white rounded-2xl p-3 w-fit"><img src="/brand/logo-badge.png" alt="DYLLU" className="h-16 md:h-20 w-auto" /></span>
        <div><b className="block font-display text-2xl md:text-3xl text-lime" dir="ltr" style={{ textAlign: "start" }}>Discover your Power</b><p className="text-white/70 mt-2 max-w-xl">{T("footer.text")} — {T("home.sub")}</p></div>
        <Link href="/products" className="btn btn-lg btn-lime w-full md:w-auto">{T("home.cta")}<Icon n="chev" s={18} className="flip-rtl" /></Link>
      </div>
      <div className="h-1.5 bg-lime shadow-[0_-2px_0_theme(colors.accent)]" />
    </section>
  </div>);
}
