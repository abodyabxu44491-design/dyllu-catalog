// Copyright (c) 2026 Abdullah Al-Sakni. All rights reserved. DYLLU Catalog.
/** @type {import('next').NextConfig} */
export default {
  poweredByHeader: false,
  eslint: { ignoreDuringBuilds: true },
  experimental: { optimizePackageImports: ["zod"] },
  async headers() {
    return [
      { source: "/uploads/:path*", headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }] },
      { source: "/items/:path*", headers: [{ key: "Cache-Control", value: "public, max-age=604800, stale-while-revalidate=86400" }] },
      { source: "/brand/:path*", headers: [{ key: "Cache-Control", value: "public, max-age=604800, stale-while-revalidate=86400" }] },
    ];
  },
};
