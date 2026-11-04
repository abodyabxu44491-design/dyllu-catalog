// Copyright (c) 2026 Abdullah Al-Sakni. All rights reserved. DYLLU Catalog.
import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import r2IncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache";
import d1NextTagCache from "@opennextjs/cloudflare/overrides/tag-cache/d1-next-tag-cache";
import memoryQueue from "@opennextjs/cloudflare/overrides/queue/memory-queue";

// Cached store data lives in R2, admin changes invalidate it through tags stored in D1.
// routePreloadingBehavior "onStart": every page module is loaded while the Worker starts (worker.ts imports the
// server at startup), which Cloudflare limits separately (1 s), instead of inside the first request of each page,
// which counts against the free plan's 10 ms CPU per request.
export default defineCloudflareConfig({
  incrementalCache: r2IncrementalCache,
  tagCache: d1NextTagCache,
  queue: memoryQueue,
  routePreloadingBehavior: "onStart",
});
