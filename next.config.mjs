// Copyright (c) 2026 Abdullah Al-Sakni. All rights reserved. DYLLU Catalog.
import path from "node:path";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
// Local `next dev` gets the same D1/R2 bindings as the Worker
if (process.argv.includes("dev")) initOpenNextCloudflareForDev();
/** @type {import('next').NextConfig} */
export default {
  // Prisma's query compiler is a WebAssembly module: keep its import as-is so the Workers bundler loads it as a module
  webpack(config, { isServer }) {
    if (isServer)
      config.externals = [
        ...[config.externals ?? []].flat(),
        ({ request, context }, cb) => (request?.endsWith(".wasm?module") ? cb(null, `import ${path.resolve(context, request)}`) : cb()),
      ];
    return config;
  },
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
