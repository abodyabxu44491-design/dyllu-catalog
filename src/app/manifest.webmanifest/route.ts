import { getSettings } from "@/lib/settings";
import { brand } from "@/config/brand";
export const dynamic = "force-dynamic";
// تطبيق المتجر: «إضافة إلى الشاشة الرئيسية» يفتح الكتالوج كتطبيق (لوحة التحكم لها ملف مستقل /admin-manifest.webmanifest)
export async function GET() {
  const s = await getSettings(), name = s["site.name"] || "DYLLU";
  return Response.json({ name: `${name} Catalog`, short_name: name, description: s["home.sub.ar"], id: "/", start_url: "/", scope: "/", display: "standalone", dir: "rtl", lang: "ar", background_color: brand.lime, theme_color: brand.lime,
    icons: [{ src: "/brand/icon-192.png", sizes: "192x192", type: "image/png" }, { src: "/brand/icon-512.png", sizes: "512x512", type: "image/png" }, { src: "/brand/icon-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" }] },
    { headers: { "Content-Type": "application/manifest+json" } });
}
