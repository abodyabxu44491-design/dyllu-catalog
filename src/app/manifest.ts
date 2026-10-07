import type { MetadataRoute } from "next";
import { getSettings } from "@/lib/settings";
import { brand } from "@/config/brand";
export const dynamic = "force-dynamic";
// يتيح «إضافة إلى الشاشة الرئيسية» فيفتح الكتالوج كتطبيق على الجوال والتابلت
export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const s = await getSettings(), name = s["site.name"] || "DYLLU";
  return { name: `${name} Catalog`, short_name: name, description: s["home.sub.ar"], start_url: "/", display: "standalone", dir: "rtl", lang: "ar", background_color: "#ffffff", theme_color: brand.lime,
    icons: [{ src: "/brand/icon-192.png", sizes: "192x192", type: "image/png" }, { src: "/brand/icon-512.png", sizes: "512x512", type: "image/png" }, { src: "/brand/icon-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" }] };
}
