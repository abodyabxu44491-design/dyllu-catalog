import Link from "next/link";
import Icon from "./Icon";
import { pick, t, type Lang } from "@/lib/lang";
type C = { slug: string; nameAr: string; nameEn: string; subtitleAr?: string | null; subtitleEn?: string | null; image: string | null; _count: { products: number } };
// بطاقة تصنيف: صورة كاملة + الاسم + عدد المنتجات، وسهم يظهر عند المرور
export default function CategoryCard({ c, L }: { c: C; L: Lang }) {
  const sub = pick(L, c.subtitleAr, c.subtitleEn);
  return (<Link href={`/categories/${c.slug}`} className="group relative block aspect-[4/3] rounded-2xl overflow-hidden bg-steel isolate">
    {c.image ? <img src={c.image} alt="" loading="lazy" className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" /> : <span className="absolute inset-0 grid place-items-center text-7xl font-display text-white/10">{c.nameEn[0]}</span>}
    <span className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/30 to-transparent" />
    <span className="absolute inset-x-0 bottom-0 p-3 sm:p-4 text-white flex items-end gap-2">
      <span className="flex-1 min-w-0"><b className="block font-display text-[15px] sm:text-lg leading-tight">{pick(L, c.nameAr, c.nameEn)}</b>
        {sub && <span className="block text-xs text-white/75 line-clamp-1 mt-0.5">{sub}</span>}
        <small className="inline-block mt-1.5 bg-lime text-ink text-[11px] font-extrabold rounded-md px-1.5 py-0.5">{c._count.products} {t(L, "productsCount")}</small></span>
      <span className="hidden sm:grid place-items-center w-9 h-9 rounded-full bg-white/15 group-hover:bg-lime group-hover:text-ink transition shrink-0"><Icon n="chev" s={18} className="flip-rtl" /></span>
    </span></Link>);
}
