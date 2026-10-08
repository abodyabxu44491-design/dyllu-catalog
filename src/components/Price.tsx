import { discountOf, oldPriceOf, priceLabel, priceOf } from "@/lib/format";
import type { AppliedOffer } from "@/lib/offers";
type PP = Parameters<typeof priceOf>[0] & { offer?: AppliedOffer | null };
const cur = (s: Record<string, string>, en: boolean) => (en ? s["currency.en"] ?? "SAR" : s["currency.ar"]);

// مبلغ بأسلوب المتاجر الكبيرة: الرقم كبير، الهللات صغيرة مرفوعة، والعملة صغيرة
export function Money({ v, s, L, className = "", strong = true }: { v: number; s: Record<string, string>; L: string; className?: string; strong?: boolean }) {
  const [int, dec] = (Math.round(v * 100) / 100).toFixed(2).split("."), Tag = strong ? "b" : "span";
  return (<Tag className={`inline-flex items-start gap-1 whitespace-nowrap leading-none ${className}`}>
    <span className="font-display">{Number(int).toLocaleString("en-US")}{dec !== "00" && <sup className="text-[.55em] ms-px top-0 align-super">.{dec}</sup>}</span>
    <small className="text-[.5em] font-bold mt-[.15em] opacity-80">{cur(s, L === "en")}</small>
  </Tag>);
}

// وقت انتهاء العرض بصيغة قصيرة (يحسب على السيرفر عند كل طلب)
function endsIn(iso: string | null, en: boolean) {
  if (!iso) return en ? "Limited-time deal" : "عرض لفترة محدودة";
  const h = (new Date(iso).getTime() - Date.now()) / 36e5, d = Math.floor(h / 24);
  if (h < 24) return en ? "Ends today" : "ينتهي اليوم";
  if (d > 6) return en ? "Limited-time deal" : "عرض لفترة محدودة";
  return en ? `${d} day${d > 1 ? "s" : ""} left` : d === 1 ? "باقي يوم واحد" : d === 2 ? "باقي يومين" : `باقي ${d} أيام`;
}

// كتلة السعر: بدون عرض = السعر فقط. مع عرض = نسبة الخصم + السعر الجديد، ثم «السعر السابق» مشطوبًا، ثم «وفّر» ومدة العرض
export default function Price({ p, s, L, ws = false, size = "card" }: { p: PP; s: Record<string, string>; L: string; ws?: boolean; size?: "card" | "page" }) {
  const en = L === "en", v = priceOf(p, ws), old = oldPriceOf(p, ws), off = discountOf(p, ws), page = size === "page";
  if (v == null) return <span className={page ? "text-xl font-bold text-steel" : "text-sm font-bold text-steel"}>{priceLabel(p, s, L, ws)}</span>;
  if (old == null) return <Money v={v} s={s} L={L} className={page ? "text-3xl md:text-4xl" : "text-lg sm:text-xl"} />;
  return (<span className={`flex flex-col items-start ${page ? "gap-2" : "gap-1"}`}>
    <span className="flex items-center gap-2 flex-wrap">
      <span className={`font-display text-accent leading-none ${page ? "text-2xl md:text-3xl" : "text-base sm:text-lg"}`} dir="ltr">-{off}%</span>
      <Money v={v} s={s} L={L} className={page ? "text-3xl md:text-4xl" : "text-lg sm:text-xl"} />
    </span>
    <span className={`text-steel ${page ? "text-sm" : "text-[11px] sm:text-xs"}`}>{en ? "Was:" : "السعر السابق:"} <s className="decoration-accent/70">{priceLabel({ ...p, offer: null }, s, L, ws)}</s></span>
    <span className={`flex items-center gap-1.5 flex-wrap font-bold ${page ? "text-sm" : "text-[11px] sm:text-xs"}`}>
      <span className="rounded-md bg-[#e8f6ee] text-[#0b7a3e] px-1.5 py-0.5">{en ? "Save" : "وفّر"} {priceLabel({ price: Math.round((old - v) * 100) / 100, showPrice: true }, s, L)}</span>
      <span className="rounded-md bg-accent/10 text-accent px-1.5 py-0.5">{endsIn(p.offer?.endsAt ?? null, en)}</span>
    </span>
  </span>);
}
