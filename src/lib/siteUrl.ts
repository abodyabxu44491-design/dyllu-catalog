// Copyright (c) 2026 Abdullah Al-Sakni. All rights reserved. DYLLU Catalog.
import { headers } from "next/headers";
export function siteUrl() {
  try {
    const h = headers(),
      host = (h.get("x-forwarded-host") ?? h.get("host"))?.split(",")[0].trim();
    if (host) {
      const local = /^(localhost|127\.|0\.0\.0\.0|\[::1\])/.test(host);
      const proto = h.get("x-forwarded-proto")?.split(",")[0].trim() || (local ? "http" : "https");
      return `${proto}://${host}`;
    }
  } catch {}
  return (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
}
