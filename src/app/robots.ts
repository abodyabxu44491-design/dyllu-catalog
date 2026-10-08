// Copyright (c) 2026 Abdullah Al-Sakni. All rights reserved. DYLLU Catalog.
import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/siteUrl";
export default function robots(): MetadataRoute.Robots {
  const base = siteUrl();
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/admin-login", "/rep", "/rep-login", "/api/", "/cart", "/order/"] },
    ...(base && { sitemap: `${base}/sitemap.xml` }),
  };
}
