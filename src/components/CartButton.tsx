// Copyright (c) 2026 Abdullah Al-Sakni. All rights reserved. DYLLU Catalog.
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { hidesBottomNav } from "./BottomNav";
import Icon from "./Icon";
import { useCartCount } from "@/store/cart";
import { useLang } from "@/lib/useLang";
import { t } from "@/lib/i18n";
export default function CartButton() {
  const L = useLang(),
    count = useCartCount(),
    // On phones the bottom nav already has the cart; show this one only where that nav is hidden
    mobile = hidesBottomNav(usePathname() ?? "");
  return (
    <Link
      href="/cart"
      aria-label={`${t(L, "cart")} (${count})`}
      className={`relative btn-icon w-10 h-10 xs:w-11 xs:h-11 bg-lime text-ink hover:bg-lime-dark ${mobile ? "" : "max-md:!hidden"}`}
    >
      <Icon n="cart" s={22} />
      {count > 0 && (
        <span
          key={count}
          className="animate-pop absolute -top-1.5 -end-1.5 min-w-[22px] h-[22px] rounded-full bg-accent text-white text-xs font-extrabold grid place-items-center border-2 border-white px-1"
        >
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}
