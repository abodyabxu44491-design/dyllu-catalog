// Copyright (c) 2026 Abdullah Al-Sakni. All rights reserved. DYLLU Catalog.
"use client";
import { useState } from "react";
import Icon from "./Icon";
import { useCart } from "@/store/cart";
import { useLang } from "@/lib/useLang";
import { t } from "@/lib/i18n";
import { toast } from "@/store/toast";
export default function AddToCart({ productId, name, full = false }: { productId: number; name?: string; full?: boolean }) {
  const L = useLang(),
    add = useCart((s) => s.add),
    [q, setQ] = useState(1),
    [done, setDone] = useState(false);
  function click(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    add(productId, full ? q : 1);
    setDone(true);
    setTimeout(() => setDone(false), 1400);
    toast(name ? `${t(L, "addedToCart")}: ${name}` : t(L, "addedToCart"), { action: { label: t(L, "viewCart"), href: "/cart" } });
  }
  if (!full)
    return (
      <button onClick={click} aria-label={t(L, "addToCart")} className={`btn btn-sm w-full h-10 ${done ? "btn-dark" : "btn-lime"}`}>
        <Icon n={done ? "check" : "plus"} s={18} stroke={2.6} />
        <span>{done ? t(L, "added") : t(L, "add")}</span>
      </button>
    );
  return (
    <div className="flex items-stretch gap-2 w-full">
      <div className="flex items-center rounded-xl border border-line bg-white shrink-0" role="group" aria-label={t(L, "qty")}>
        <button
          aria-label="-"
          className="btn-icon w-9 xs:w-11 h-12 text-steel hover:text-ink disabled:opacity-30"
          disabled={q <= 1}
          onClick={() => setQ(Math.max(1, q - 1))}
        >
          <Icon n="minus" s={18} />
        </button>
        <input
          aria-label={t(L, "qty")}
          inputMode="numeric"
          value={q}
          onChange={(e) => setQ(Math.max(1, Math.min(999, parseInt(e.target.value.replace(/\D/g, "")) || 1)))}
          className="w-8 xs:w-10 text-center font-extrabold bg-transparent outline-none"
        />
        <button aria-label="+" className="btn-icon w-9 xs:w-11 h-12 text-steel hover:text-ink" onClick={() => setQ(Math.min(999, q + 1))}>
          <Icon n="plus" s={18} />
        </button>
      </div>
      <button onClick={click} className={`btn btn-lg flex-1 min-w-0 px-3 ${done ? "btn-dark" : "btn-lime"}`}>
        <Icon n={done ? "check" : "cart"} s={20} />
        {done ? (
          t(L, "added")
        ) : (
          <>
            <span className="hidden xs:inline">{t(L, "addToCart")}</span>
            <span className="xs:hidden">{t(L, "add")}</span>
          </>
        )}
      </button>
    </div>
  );
}
