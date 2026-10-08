// Copyright (c) 2026 Abdullah Al-Sakni. All rights reserved. DYLLU Catalog.
import Link from "next/link";
import { getLang, t } from "@/lib/lang";
import Icon from "@/components/Icon";
export default function NotFound() {
  const L = getLang();
  return (
    <div className="wrap py-16 md:py-24 text-center">
      <b className="block font-display text-7xl md:text-9xl text-lime [-webkit-text-stroke:2px_theme(colors.steel)]">404</b>
      <h1 className="text-2xl md:text-3xl mt-4">{t(L, "notFound")}</h1>
      <p className="text-steel mt-2">{t(L, "notFoundSub")}</p>
      <div className="mt-8 flex flex-wrap gap-2 justify-center">
        <Link href="/" className="btn btn-lg btn-lime">
          <Icon n="home" s={20} />
          {t(L, "goHome")}
        </Link>
        <Link href="/products" className="btn btn-lg btn-ghost">
          {t(L, "browse")}
        </Link>
      </div>
    </div>
  );
}
