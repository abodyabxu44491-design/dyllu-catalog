// Copyright (c) 2026 Abdullah Al-Sakni. All rights reserved. DYLLU Catalog.
// Every `import Link from "next/link"` resolves here (see next.config.mjs): links no longer prefetch pages
// in the background. On the Cloudflare free plan each prefetch is a full server render, and a page full
// of product cards would trigger dozens of them for pages the visitor never opens.
"use client";
import type { ComponentProps } from "react";
import Link from "next/dist/client/app-dir/link";
export default function NoPrefetchLink(props: ComponentProps<typeof Link>) {
  return <Link prefetch={false} {...props} />;
}
