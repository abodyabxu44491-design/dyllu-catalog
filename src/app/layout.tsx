import "./globals.css";
import type { Metadata, Viewport } from "next";
import SourceCapture from "@/components/SourceCapture";
import Providers from "@/components/Providers";
import { getLang, txt } from "@/lib/lang";
import { getSettings } from "@/lib/settings";
import { brand } from "@/config/brand";
export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings(), L = getLang(), name = s["site.name"] || "DYLLU", base = process.env.NEXT_PUBLIC_SITE_URL;
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
// يعمل قبل رسم الصفحة: شاشة البداية مرة واحدة لكل جلسة (وليس في صفحات المستندات: الفاتورة وقائمة الأسعار)، والتقاط حدث تثبيت التطبيق مبكرًا قبل تحميل React
const BOOT = `try{var d=document.documentElement;var pa=location.pathname;if(pa.indexOf("/order/")===0||pa.indexOf("/catalog")===0||sessionStorage.getItem("dy-splash")||matchMedia("(prefers-reduced-motion: reduce)").matches)d.classList.add("no-splash");else sessionStorage.setItem("dy-splash","1")}catch(e){}addEventListener("beforeinstallprompt",function(e){e.preventDefault();window.__bip=e;dispatchEvent(new Event("dy-bip"))});addEventListener("appinstalled",function(){window.__bip=null;dispatchEvent(new Event("dy-bip"))});`;
export default function RootLayout({ children }: { children: React.ReactNode }) {
  const l = getLang();
  return (<html lang={l} dir={l === "en" ? "ltr" : "rtl"} suppressHydrationWarning><head><script dangerouslySetInnerHTML={{ __html: BOOT }} /></head>
    <body>
      {/* شاشة البداية: شعار متحرك يختفي خلال ثانية تقريبًا (CSS فقط، لا تؤخر تحميل الصفحة) */}
      <div id="splash" aria-hidden="true"><div className="s-in"><span className="s-ring" /><img src="/brand/logo-badge.png" alt="" className="s-badge" width={140} height={125} /><img src="/brand/logo-wordmark-white.png" alt="" className="s-mark" width={150} height={49} /><span className="s-bar"><i /></span></div></div>
      <Providers lang={l}>{children}</Providers><SourceCapture /></body></html>);
}
