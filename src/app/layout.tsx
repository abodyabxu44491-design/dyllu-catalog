import "./globals.css";
import type { Metadata, Viewport } from "next";
import SourceCapture from "@/components/SourceCapture";
import Providers from "@/components/Providers";
import { getLang, txt } from "@/lib/lang";
import { getSettings } from "@/lib/settings";
import { brand } from "@/config/brand";
import { Cairo, IBM_Plex_Sans_Arabic } from "next/font/google";
import { siteUrl } from "@/lib/siteUrl";
// خطوط عربية حديثة (تُحمَّل من الموقع نفسه وقت البناء): Plex للنصوص و Cairo للعناوين. مقيدة بالحروف العربية فقط،
// فالإنجليزية تبقى Arial / Arial Black كما في دليل الهوية
const ar = IBM_Plex_Sans_Arabic({ subsets: ["arabic"], weight: ["400", "500", "600", "700"], variable: "--font-ar", display: "swap", fallback: [], adjustFontFallback: false });
const ard = Cairo({ subsets: ["arabic"], weight: ["700", "800", "900"], variable: "--font-ard", display: "swap", fallback: [], adjustFontFallback: false });
export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings(), L = getLang(), name = s["site.name"] || "DYLLU", base = siteUrl();
  return {
    metadataBase: base ? new URL(base) : undefined,
    title: { default: `${name} | ${txt(s, L, "footer.text")}`, template: `%s | ${name}` },
    description: txt(s, L, "home.sub"),
    applicationName: name,
    appleWebApp: { capable: true, title: name, statusBarStyle: "default" },
    openGraph: { siteName: name, type: "website", locale: L === "en" ? "en_US" : "ar_SA", images: ["/brand/og.png"] },
    formatDetection: { telephone: false },
    manifest: "/manifest.webmanifest",
  };
}
// الحقول 16px تمنع التكبير التلقائي على الجوال، ويبقى تكبير الصور بالإصبعين متاحًا
export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: brand.lime };
// يعمل قبل رسم الصفحة: شاشة البداية مرة واحدة لكل جلسة للعملاء (وليس في لوحة التحكم ولا صفحات المستندات: الفاتورة وقائمة الأسعار)، والتقاط حدث تثبيت التطبيق مبكرًا قبل تحميل React
const BOOT = `try{var d=document.documentElement;var pa=location.pathname;if(pa.indexOf("/order/")===0||pa.indexOf("/catalog")===0||pa.indexOf("/admin")===0||pa.indexOf("/rep")===0||sessionStorage.getItem("dy-splash")||matchMedia("(prefers-reduced-motion: reduce)").matches)d.classList.add("no-splash");else sessionStorage.setItem("dy-splash","1")}catch(e){}addEventListener("beforeinstallprompt",function(e){e.preventDefault();window.__bip=e;dispatchEvent(new Event("dy-bip"))});addEventListener("appinstalled",function(){window.__bip=null;dispatchEvent(new Event("dy-bip"))});`;
// مواضع حروف الشعار داخل الكبسولة (٪ من عرض الشعار الأصلي 600px): D Y L L U
// زوايا شرارات لحظة الهبوط
const SPARKS = [0, 30, 150, 180, 210, 330, 60, 120, 240, 300];
const SPLASH: [number, number][] = [[12.67, 16.67], [29.33, 16], [46.17, 13.17], [59.33, 11.67], [71, 16.17]];
export default function RootLayout({ children }: { children: React.ReactNode }) {
  const l = getLang();
  return (<html lang={l} dir={l === "en" ? "ltr" : "rtl"} className={`${ar.variable} ${ard.variable}`} suppressHydrationWarning><head><script dangerouslySetInnerHTML={{ __html: BOOT }} /></head>
    <body>
      {/* شاشة البداية: حروف الشعار تتجمع بحركة قوية وتختفي خلال ~2.8 ثانية (CSS فقط، لا تؤخر تحميل الصفحة) */}
      <div id="splash" aria-hidden="true"><div className="s-stage">
        <div className="s-logo">{SPARKS.map((a, i) => <span key={a} className="s-sp" style={{ ["--a" as string]: `${a}deg` }} />)}<span className="s-wave" />
          <svg className="s-draw" viewBox="0 0 600 197" preserveAspectRatio="none"><rect x="4" y="4" width="592" height="189" rx="94.5" pathLength={1} /></svg>
          <span className="s-pill" />{SPLASH.map(([l, w], i) => <img key={i} src={`/brand/splash/l${i + 1}.png`} alt="" className="s-l" fetchPriority="high" style={{ ["--i" as string]: i, left: `${l}%`, width: `${w}%` }} />)}</div></div></div>
      <Providers lang={l}>{children}</Providers><SourceCapture /></body></html>);
}
