import { brand } from "@/config/brand";
// ملف تثبيت حساب المندوب كتطبيق مستقل: يفتح على /rep مباشرة
export function GET() {
  return Response.json({ name: "DYLLU · المندوب", short_name: "DYLLU Rep", start_url: "/rep", scope: "/", id: "/rep", display: "standalone", dir: "rtl", lang: "ar", background_color: brand.ink, theme_color: brand.ink,
    icons: [{ src: "/brand/icon-192.png", sizes: "192x192", type: "image/png" }, { src: "/brand/icon-512.png", sizes: "512x512", type: "image/png" }, { src: "/brand/icon-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" }] },
    { headers: { "Content-Type": "application/manifest+json" } });
}
