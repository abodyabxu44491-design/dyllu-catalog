// Copyright (c) 2026 Abdullah Al-Sakni. All rights reserved. DYLLU Catalog.
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Icon, { type IconName } from "./Icon";
import { useCartCount } from "@/store/cart";
import { useLang } from "@/lib/useLang";
import { t, type TKey } from "@/lib/i18n";
const ITEMS: [string, IconName, TKey][] = [
  ["/", "home", "home"],
  ["/categories", "grid", "categories"],
  ["/products", "box", "products"],
  ["/cart", "cart", "cart"],
];
export default function BottomNav() {
  const p = usePathname(),
    L = useLang(),
    count = useCartCount();
  if (/^\/(products\/[^/]+|order)/.test(p)) return null;
  const on = (h: string) => (h === "/" ? p === "/" : p.startsWith(h));
  return (
    <>
      <div className="h-[68px] md:hidden pb-safe" aria-hidden />
      <nav className="md:hidden fixed inset-x-0 bottom-0 z-40 bg-white/95 backdrop-blur border-t border-line pb-safe">
        <div className="grid grid-cols-4 h-[64px]">
          {ITEMS.map(([h, i, k]) => (
            <Link
              key={h}
              href={h}
              className={`relative flex flex-col items-center justify-center gap-1 text-[11px] font-bold ${on(h) ? "text-ink" : "text-steel"}`}
            >
              {on(h) && <i className="absolute top-0 inset-x-6 h-[3px] rounded-b-full bg-accent" />}
              <span className={`relative grid place-items-center w-12 h-7 rounded-full transition ${on(h) ? "bg-lime" : ""}`}>
                <Icon n={i} s={21} />
                {h === "/cart" && count > 0 && (
                  <b
                    key={count}
                    className="animate-pop absolute -top-1.5 end-0.5 min-w-[18px] h-[18px] rounded-full bg-accent text-white text-[10px] grid place-items-center border-2 border-white px-0.5"
                  >
                    {count > 99 ? "99+" : count}
                  </b>
                )}
              </span>
              {t(L, k)}
            </Link>
          ))}
        </div>
      </nav>
    </>
  );
}
