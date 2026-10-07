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
  };
}
// الحقول 16px تمنع التكبير التلقائي على الجوال، ويبقى تكبير الصور بالإصبعين متاحًا
export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: brand.lime };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  const l = getLang();
  return (<html lang={l} dir={l === "en" ? "ltr" : "rtl"}><body><Providers lang={l}>{children}</Providers><SourceCapture /></body></html>);
}
