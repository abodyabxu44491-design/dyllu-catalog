// Copyright (c) 2026 Abdullah Al-Sakni. All rights reserved. DYLLU Catalog.
import { brand } from "@/config/brand";
export function GET() {
  return Response.json(
    {
      name: "DYLLU · المندوب",
      short_name: "DYLLU Rep",
      start_url: "/rep",
      scope: "/",
      id: "/rep",
      display: "standalone",
      dir: "rtl",
      lang: "ar",
      background_color: brand.ink,
      theme_color: brand.ink,
      icons: [
        { src: "/brand/icon-192.png", sizes: "192x192", type: "image/png" },
        { src: "/brand/icon-512.png", sizes: "512x512", type: "image/png" },
        { src: "/brand/icon-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
      ],
    },
    { headers: { "Content-Type": "application/manifest+json" } },
  );
}
