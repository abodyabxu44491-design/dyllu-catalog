"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Icon from "./Icon";
import { useLang } from "@/lib/useLang";
import { pick, t } from "@/lib/i18n";
type Cat = { slug: string; nameAr: string; nameEn: string; image: string | null };
// روابط الهيدر على الكمبيوتر: الرئيسية، المنتجات، والتصنيفات (قائمة منسدلة بالصور عند المرور أو التركيز)
export default function HeaderNav({ cats }: { cats: Cat[] }) {
  const p = usePathname(), L = useLang();
  const cls = (on: boolean) => `relative inline-flex items-center gap-1 h-11 px-3.5 rounded-xl text-[15px] font-bold transition ${on ? "text-ink after:absolute after:inset-x-3.5 after:-bottom-[13px] after:h-[3px] after:bg-accent after:rounded-full" : "text-steel hover:text-ink hover:bg-soft"}`;
  return (<nav className="hidden lg:flex items-center gap-1">
    <Link href="/" className={cls(p === "/")}>{t(L, "home")}</Link>
    <Link href="/products" className={cls(p === "/products")}>{t(L, "products")}</Link>
    <div className="relative group">
      <Link href="/categories" className={cls(p.startsWith("/categories"))}>{t(L, "categories")}<Icon n="chevDown" s={16} className="transition-transform group-hover:rotate-180 group-focus-within:rotate-180" /></Link>
      {cats.length > 0 && <div className="invisible opacity-0 translate-y-1 group-hover:visible group-hover:opacity-100 group-hover:translate-y-0 group-focus-within:visible group-focus-within:opacity-100 group-focus-within:translate-y-0 transition absolute top-full start-0 pt-3 z-50">
        <div className="w-[520px] bg-white rounded-2xl shadow-lift border border-line p-3 grid grid-cols-2 gap-1">
          {cats.map((c) => <Link key={c.slug} href={`/categories/${c.slug}`} className="flex items-center gap-3 rounded-xl p-2 hover:bg-soft">
            <span className="w-11 h-11 rounded-lg bg-soft overflow-hidden shrink-0">{c.image && <img src={c.image} alt="" className="w-full h-full object-cover" />}</span><b className="text-sm">{pick(L, c.nameAr, c.nameEn)}</b></Link>)}
          <Link href="/categories" className="col-span-2 mt-1 flex items-center justify-center gap-1 rounded-xl p-2.5 bg-soft text-sm font-bold hover:bg-lime/40">{t(L, "viewAll")}<Icon n="chev" s={16} className="flip-rtl" /></Link>
        </div></div>}
    </div>
  </nav>);
}
