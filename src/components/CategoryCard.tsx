import Link from "next/link";
import { pick, type Lang } from "@/lib/lang";
type C = { slug: string; nameAr: string; nameEn: string; subtitleAr?: string | null; subtitleEn?: string | null; image: string | null; _count: { products: number } };
// بطاقة تصنيف: صورة كاملة + الاسم + عدد المنتجات. تُستخدم في الرئيسية وصفحة التصنيفات.
export default function CategoryCard({ c, L }: { c: C; L: Lang }) {
  return (<Link href={`/categories/${c.slug}`} className="relative block aspect-[4/3] rounded-2xl overflow-hidden bg-soft border active:scale-[.98] transition-transform">
    {c.image ? <img src={c.image} alt="" className="absolute inset-0 w-full h-full object-cover" /> : <span className="absolute inset-0 grid place-items-center text-6xl font-extrabold text-ink/10">{c.nameEn[0]}</span>}
    <span className="absolute inset-x-0 bottom-0 p-3 pt-10 bg-gradient-to-t from-ink/90 via-ink/50 to-transparent text-white"><b className="block leading-tight">{pick(L, c.nameAr, c.nameEn)}</b>{pick(L, c.subtitleAr, c.subtitleEn) && <span className="block text-xs text-white/80">{pick(L, c.subtitleAr, c.subtitleEn)}</span>}<small className="text-lime font-bold">{c._count.products} {L === "en" ? "products" : "منتج"}</small></span></Link>);
}
