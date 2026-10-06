import Link from "next/link";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { getLang, pick, txt } from "@/lib/lang";
import { getWholesale } from "@/lib/wholesale";
import SiteHeader from "@/components/SiteHeader";
import ProductCard from "@/components/ProductCard";
import CategoryCard from "@/components/CategoryCard";
import BannerCarousel from "@/components/BannerCarousel";
import Icon from "@/components/Icon";
export const dynamic = "force-dynamic";
// مقاس البنر موحّد: نفس الصندوق للإعلانات المتحركة وللواجهة الثابتة (BannerCarousel يستخدم نفس النسبة)
const RATIO = "aspect-[16/9] md:aspect-[2.4/1]";
// عنوان القسم بهوية DYLLU: كبسولة ليمونية بمعيّن برتقالي (كما في دليل الهوية)
const Head = ({ title, href, more }: { title: string; href: string; more: string }) => (<div className="mx-4 mt-7 flex justify-between items-center">
  <h2 className="relative inline-flex items-center bg-lime text-steel rounded-full ps-7 pe-4 py-1.5 text-[15px]"><i className="absolute start-2.5 w-2.5 h-2.5 bg-accent rotate-45" />{title}</h2>
  <Link href={href} className="inline-flex items-center gap-1 text-[13px] font-bold text-steel text-end">{more}<Icon n="chev" s={16} className="rtl:rotate-180" /></Link></div>);
// الترتيب: هيدر ← بنر (إعلانات أو واجهة ثابتة بنفس المقاس) ← بحث ثابت تحته ← تصنيفات ← مميز ← كيف تطلب ← تذييل. كل النصوص من الإعدادات.
export default async function Home() {
  const L = getLang(), en = L === "en", ws = !!(await getWholesale()), now = new Date();
  const [s, cats, featured, banners] = await Promise.all([getSettings(),
    db.category.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" }, include: { _count: { select: { products: { where: { isActive: true } } } } } }),
    db.product.findMany({ where: { isActive: true, isFeatured: true }, include: { images: { orderBy: { sortOrder: "asc" }, take: 1 } }, orderBy: { sortOrder: "asc" }, take: 6 }),
    db.banner.findMany({ where: { isActive: true, AND: [{ OR: [{ startsAt: null }, { startsAt: { lte: now } }] }, { OR: [{ endsAt: null }, { endsAt: { gte: now } }] }] }, orderBy: [{ sortOrder: "asc" }, { id: "asc" }] })]);
  const T = (k: string) => txt(s, L, k);
  const slides = banners.map((b) => { const x = b.type === "IMAGE_TEXT"; return { id: b.id, type: b.type, image: b.image, title: x ? pick(L, b.titleAr, b.titleEn) : "", subtitle: x ? pick(L, b.subtitleAr, b.subtitleEn) : "", button: x ? pick(L, b.buttonAr, b.buttonEn) : "", href: b.linkUrl ?? "", seconds: b.seconds }; });
  return (
    <main className="max-w-3xl mx-auto">
      <SiteHeader />
      {slides.length > 0 ? <BannerCarousel slides={slides} rtl={!en} /> :
        <section className={`relative overflow-hidden bg-lime rounded-3xl mx-4 mt-3 ${RATIO}`}>
          <span className="absolute -bottom-16 -end-10 w-56 h-56 rounded-full bg-white/25" />
          <img src={s["hero.image"] || "/brand/logo-badge.png"} alt="" className="absolute end-4 top-1/2 -translate-y-1/2 h-[78%] max-w-[40%] object-contain" />
          <div className="relative h-full flex flex-col justify-center items-start gap-1.5 md:gap-3 p-5 md:p-10 pe-[44%]">
            <h1 className="text-[19px] leading-tight md:text-4xl text-ink">{T("home.title")}</h1>
            <p className="text-xs md:text-base text-ink/70 line-clamp-2">{T("home.sub")}</p>
            <Link href="/products" className="mt-1 bg-ink text-white font-bold text-sm px-5 py-2.5 rounded-xl">{T("home.cta")}</Link>
          </div>
          <i className="absolute inset-x-0 bottom-0 h-[3px] bg-accent" />
        </section>}
      <form action="/products" className="mx-4 mt-3 relative">
        <span className="absolute start-4 top-1/2 -translate-y-1/2 text-steel pointer-events-none"><Icon n="search" s={20} /></span>
        <input name="q" type="search" placeholder={T("search.ph")} aria-label={T("search.ph")} className="w-full h-14 rounded-full bg-soft border border-transparent focus:border-steel ps-12 pe-16 text-base outline-none placeholder:text-steel" />
        <button aria-label={T("search.ph")} className="absolute end-2 top-2 h-10 w-10 rounded-full bg-lime text-ink grid place-items-center"><Icon n="chev" s={20} className="rtl:rotate-180" /></button>
      </form>
      {/* أكثر من 6 تصنيفات: رابط «عرض كل التصنيفات»، وإلا فالتصنيفات كلها ظاهرة والرابط يفتح كل المنتجات مباشرة */}
      <Head title={T("home.cats")} href={cats.length > 6 ? "/categories" : "/products"} more={cats.length > 6 ? T("home.allCats") : T("home.allProducts")} />
      <section className="px-4 pt-3 grid grid-cols-2 gap-3">{cats.map((c) => <CategoryCard key={c.id} c={c} L={L} />)}</section>
      {featured.length > 0 && <><Head title={T("home.featured")} href="/products?featured=1" more={T("home.allFeatured")} />
        <section className="px-4 pt-3 grid grid-cols-2 gap-3">{featured.map((p) => <ProductCard key={p.id} p={p} s={s} ws={ws} />)}</section></>}
      <section className="mx-4 mt-8 bg-soft rounded-3xl p-4"><b className="block mb-3">{T("home.how")}</b>
        <div className="grid grid-cols-3 gap-2 text-center text-sm">{["home.step1", "home.step2", "home.step3"].map((k, i) => <div key={k}><span className="mx-auto mb-1.5 w-9 h-9 rounded-full bg-lime font-extrabold grid place-items-center">{i + 1}</span>{T(k)}</div>)}</div></section>
      <footer className="mt-10 bg-soft rounded-t-[32px] text-center text-steel text-sm pt-6 pb-8"><img src="/brand/logo-badge.png" alt={s["site.name"] || "DYLLU"} className="h-20 w-auto mx-auto mb-2" /><b className="block text-ink">{T("footer.text")}</b><small className="block mt-2 opacity-70">© {new Date().getFullYear()} {s["site.name"] || "DYLLU"}</small></footer>
    </main>
  );
}
