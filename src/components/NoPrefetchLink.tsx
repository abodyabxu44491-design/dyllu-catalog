// Copyright (c) 2026 Abdullah Al-Sakni. All rights reserved. DYLLU Catalog.
// Every `import Link from "next/link"` resolves here (see next.config.mjs).
// Links are plain anchors: each click loads the page as a whole, which Cloudflare serves from its edge
// copy (worker.ts) without running the app. Next.js client navigation would instead ask the server for
// a fresh render each time, and prefetching would render pages the visitor never opens; on the free
// plan (about 10 ms of CPU per request) those renders are what fails.
import type { AnchorHTMLAttributes, Ref } from "react";
type Props = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  href: string | { pathname?: string | null; query?: Record<string, string | number | undefined>; hash?: string };
  prefetch?: boolean | null;
  replace?: boolean;
  scroll?: boolean;
  ref?: Ref<HTMLAnchorElement>;
};
const toHref = (h: Props["href"]) => {
  if (typeof h === "string") return h;
  const q = Object.entries(h.query ?? {}).filter(([, v]) => v !== undefined) as [string, string][];
  return `${h.pathname ?? ""}${q.length ? `?${new URLSearchParams(q.map(([k, v]) => [k, String(v)]))}` : ""}${h.hash ? `#${h.hash.replace(/^#/, "")}` : ""}`;
};
export default function Link({ href, prefetch: _p, replace: _r, scroll: _s, ...rest }: Props) {
  return <a href={toHref(href)} {...rest} />;
}
