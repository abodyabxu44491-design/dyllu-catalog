// تصميم الإعلان: نفس المكوّن يُعرض في المعاينة داخل لوحة التحكم وفي سلايدر الرئيسية، فما تراه هو ما يراه العميل.
// كل المقاسات نسبية لصندوق الإعلان (cqw/cqh)، فيبقى التصميم متناسقًا على الجوال والتابلت والكمبيوتر.
export type AdKind = "IMAGE" | "IMAGE_TEXT" | "PRODUCT";
export type AdData = { kind: AdKind; template: string; image: string; title: string; subtitle: string; button: string; badge: string; price: string | null; oldPrice?: string | null; sku?: string | null; rtl: boolean };
export const TEMPLATES: { id: string; ar: string; en: string }[] = [
  { id: "spotlight", ar: "أضواء (داكن)", en: "Spotlight" }, { id: "lime", ar: "ليموني (الهوية)", en: "Lime" }, { id: "clean", ar: "أنيق (فاتح)", en: "Clean" },
  { id: "offer", ar: "عرض (برتقالي)", en: "Offer" }, { id: "split", ar: "مقسوم", en: "Split" },
];
// المقاسات في globals.css (‎.ad-*‎): نسبية لصندوق الإعلان وتتكبّر على صندوق الجوال الأطول
const Chev = ({ rtl }: { rtl: boolean }) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" style={{ width: "1em", height: "1em", transform: rtl ? "scaleX(-1)" : undefined }} aria-hidden><path d="M9 6l6 6-6 6" /></svg>;
type Theme = { bg: string; title: string; sub: string; price: string; cta: string; badge: string; logo: string; accent: string };
const THEMES: Record<string, Theme> = {
  spotlight: { bg: "bg-ink", title: "text-white", sub: "text-white/70", price: "text-lime", cta: "bg-lime text-ink", badge: "bg-accent text-white", logo: "/brand/logo-wordmark-white.png", accent: "bg-accent" },
  lime: { bg: "bg-lime", title: "text-ink", sub: "text-ink/70", price: "text-ink", cta: "bg-ink text-lime", badge: "bg-accent text-white", logo: "/brand/logo-wordmark-white.png", accent: "bg-accent" },
  clean: { bg: "bg-gradient-to-br from-white to-soft", title: "text-ink", sub: "text-steel", price: "text-accent", cta: "bg-lime text-ink", badge: "bg-accent text-white", logo: "/brand/logo-wordmark.png", accent: "bg-lime" },
  offer: { bg: "bg-accent", title: "text-white", sub: "text-white/85", price: "text-white", cta: "bg-ink text-white", badge: "bg-lime text-ink", logo: "/brand/logo-wordmark-white.png", accent: "bg-lime" },
  split: { bg: "bg-ink", title: "text-white", sub: "text-white/70", price: "text-lime", cta: "bg-lime text-ink", badge: "bg-accent text-white", logo: "/brand/logo-wordmark-white.png", accent: "bg-accent" },
};
function Decor({ t }: { t: string }) {
  if (t === "spotlight") return (<><span className="absolute rounded-full bg-lime/90" style={{ width: "62cqh", height: "62cqh", insetInlineEnd: "10cqw", top: "50%", transform: "translateY(-50%)" }} /><span className="absolute rounded-full border-lime/30" style={{ width: "92cqh", height: "92cqh", insetInlineEnd: "calc(10cqw - 15cqh)", top: "50%", transform: "translateY(-50%)", borderWidth: "0.4cqh" }} /></>);
  if (t === "lime") return (<><span className="absolute rounded-full bg-white/60" style={{ width: "120cqh", height: "120cqh", insetInlineEnd: "-12cqh", top: "-10cqh" }} /><span className="absolute bottom-0 inset-x-0 bg-accent" style={{ height: "1.6cqh" }} /></>);
  if (t === "clean") return (<><span className="absolute rounded-full bg-lime/25" style={{ width: "80cqh", height: "80cqh", insetInlineEnd: "8cqw", top: "50%", transform: "translateY(-50%)" }} /><span className="absolute inset-x-0 bottom-0 bg-lime" style={{ height: "3cqh", boxShadow: "0 -0.8cqh 0 #FF6900" }} /></>);
  if (t === "offer") return (<><span className="absolute bg-ink" style={{ width: "60cqw", height: "300cqh", insetInlineEnd: "-18cqw", top: "-100cqh", transform: "rotate(18deg)" }} /><span className="absolute rounded-full bg-white/10" style={{ width: "50cqh", height: "50cqh", insetInlineStart: "-12cqh", bottom: "-20cqh" }} /></>);
  if (t === "split") return <span className="absolute inset-y-0 bg-lime" style={{ width: "47cqw", insetInlineEnd: 0, clipPath: "polygon(22% 0, 100% 0, 100% 100%, 0 100%)" }} />;
  return null;
}
export default function AdCanvas({ ad }: { ad: AdData }) {
  if (ad.kind === "IMAGE") return <div className="absolute inset-0 bg-ink">{ad.image && <img src={ad.image} alt={ad.title} draggable={false} className="w-full h-full object-cover" />}</div>;
  if (ad.kind === "IMAGE_TEXT") return (<div className="absolute inset-0 bg-ink [container-type:size]">
    {ad.image && <img src={ad.image} alt="" draggable={false} className="absolute inset-0 w-full h-full object-cover" />}
    {(ad.title || ad.subtitle || ad.button) && <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r rtl:md:bg-gradient-to-l from-ink/90 via-ink/40 to-transparent flex flex-col justify-end md:justify-center adt-pad">
      <i className="block bg-accent rounded" style={{ width: "6cqw", height: "1.2cqh" }} />
      {ad.title && <b className="font-display text-white leading-tight max-w-[85%] md:max-w-[55%] line-clamp-2 adt-title">{ad.title}</b>}
      {ad.subtitle && <span className="text-white/85 max-w-[85%] md:max-w-[50%] line-clamp-2 adt-sub">{ad.subtitle}</span>}
      {ad.button && <span className="self-start inline-flex items-center rounded-full bg-lime text-ink font-bold ad-cta">{ad.button}<Chev rtl={ad.rtl} /></span>}
    </div>}</div>);
  // إعلان منتج بتصميم جاهز
  const th = THEMES[ad.template] ?? THEMES.spotlight, t = THEMES[ad.template] ? ad.template : "spotlight";
  return (<div className={`absolute inset-0 overflow-hidden isolate [container-type:size] ${th.bg}`} dir={ad.rtl ? "rtl" : "ltr"}>
    <Decor t={t} />
    {/* صورة المنتج */}
    <div className="absolute flex items-center justify-center ad-media">
      {ad.image ? <img src={ad.image} alt={ad.title} draggable={false} className="max-w-full max-h-full object-contain ad-img" />
        : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" className="opacity-30" style={{ width: "40cqh", height: "40cqh" }} aria-hidden><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="9" cy="10" r="2" /><path d="M21 16l-5-5-9 9" /></svg>}
      {ad.badge && t === "offer" && <span className={`absolute grid place-items-center text-center rounded-full font-display leading-none ad-sticker ${th.badge}`} style={{ top: "-2cqh", insetInlineStart: "-2cqw", transform: "rotate(-10deg)" }}>{ad.badge}</span>}
    </div>
    {/* النص */}
    <div className="absolute flex flex-col justify-center ad-text">
      {ad.badge && t !== "offer" && <span className={`self-start rounded-full font-bold ad-badge ${th.badge}`}>{ad.badge}</span>}
      <i className={`block rounded ${th.accent}`} style={{ width: "6cqw", height: "1.2cqh" }} />
      <b className={`font-display leading-[1.12] line-clamp-2 ad-title ${th.title}`}>{ad.title}</b>
      {ad.subtitle && <span className={`line-clamp-2 leading-snug ad-sub ${th.sub}`}>{ad.subtitle}</span>}
      <div className="flex flex-wrap items-center" style={{ gap: "2.4cqw", marginTop: "1cqh" }}>
        {ad.price && <span className="inline-flex flex-col leading-none">{ad.oldPrice && <s className={`whitespace-nowrap opacity-70 ad-sub ${th.sub}`}>{ad.oldPrice}</s>}<b className={`font-display whitespace-nowrap ad-price ${th.price}`}>{ad.price}</b></span>}
        {ad.button && <span className={`inline-flex items-center rounded-full font-bold whitespace-nowrap ad-cta ${th.cta}`}>{ad.button}<Chev rtl={ad.rtl} /></span>}
      </div>
    </div>
    <img src={th.logo} alt="DYLLU" className="absolute h-auto ad-logo" />
    {ad.sku && <span className={`absolute font-bold tracking-wider opacity-60 ad-sku ${th.title}`} dir="ltr">{ad.sku}</span>}
  </div>);
}
