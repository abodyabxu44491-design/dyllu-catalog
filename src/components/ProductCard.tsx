import Link from "next/link";
import AddToCart from "./AddToCart";
import Icon from "./Icon";
import { isWsPrice, priceLabel, priceOf } from "@/lib/format";
import { getLang, pick, t } from "@/lib/lang";
type P = { id: number; slug: string; sku?: string | null; nameAr: string; nameEn: string; price: unknown; wholesalePrice?: unknown; showPrice: boolean; allowCart: boolean; inStock?: boolean; isFeatured?: boolean; images: { url: string }[] };
// بطاقة منتج موحّدة: صورة مربعة، شارات (جملة / غير متوفر)، الاسم باللغتين، السعر، وزر إضافة سريع
export default function ProductCard({ p, s, ws = false }: { p: P; s: Record<string, string>; ws?: boolean }) {
  const L = getLang(), en = L === "en", name = pick(L, p.nameAr, p.nameEn), other = (en ? p.nameAr : p.nameEn) === name ? "" : en ? p.nameAr : p.nameEn, priced = priceOf(p, ws) != null;
  return (
    <article className="group relative flex flex-col bg-white rounded-2xl border border-line overflow-hidden transition hover:shadow-lift hover:-translate-y-0.5 hover:border-transparent">
      <Link href={`/products/${p.slug}`} className="flex flex-col flex-1" aria-label={name}>
        <div className="relative aspect-square bg-soft overflow-hidden">
          {p.images[0] ? <img src={p.images[0].url} alt={name} loading="lazy" className="w-full h-full object-contain p-3 transition-transform duration-500 group-hover:scale-105" />
            : <span className="absolute inset-0 grid place-items-center text-steel/30"><Icon n="image" s={48} stroke={1.4} /></span>}
          <div className="absolute top-2 start-2 flex flex-col items-start gap-1">
            {isWsPrice(p, ws) && <span className="bg-ink text-lime text-[11px] font-extrabold rounded-lg px-2 py-0.5">{t(L, "wholesale")}</span>}
            {p.inStock === false && <span className="bg-white/95 text-accent text-[11px] font-extrabold rounded-lg px-2 py-0.5 border border-accent/30">{t(L, "outOfStock")}</span>}
          </div>
        </div>
        <div className="p-3 sm:p-4 flex flex-col gap-1 flex-1">
          {p.sku && <span className="text-[11px] font-bold tracking-wider text-accent" dir="ltr" style={{ textAlign: "start" }}>{p.sku}</span>}
          <h3 className="font-sans font-bold text-sm sm:text-[15px] leading-snug line-clamp-2">{name}</h3>
          <span className="text-xs text-steel line-clamp-1" dir={en ? "rtl" : "ltr"} style={{ textAlign: "start" }}>{other}</span>
          <b className={`mt-auto pt-2 ${priced ? "text-base sm:text-lg font-display" : "text-sm text-steel"}`}>{priceLabel(p, s, L, ws)}</b>
        </div>
      </Link>
      {p.allowCart && <div className="px-3 pb-3 sm:px-4 sm:pb-4 -mt-1"><AddToCart productId={p.id} name={name} /></div>}
    </article>
  );
}
