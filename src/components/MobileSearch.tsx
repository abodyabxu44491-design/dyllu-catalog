"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import Icon from "./Icon";
import SearchBox from "./SearchBox";
import { useLang } from "@/lib/useLang";
import { pick, t } from "@/lib/i18n";
type Cat = { slug: string; nameAr: string; nameEn: string };
// بحث الجوال والتابلت: زر في الهيدر يفتح شاشة بحث كاملة مع اقتراحات فورية واختصارات التصنيفات
export default function MobileSearch({ placeholder, cur, hidden, cats }: { placeholder: string; cur: string; hidden: string; cats: Cat[] }) {
  const L = useLang(), [open, setOpen] = useState(false);
  useEffect(() => { document.body.style.overflow = open ? "hidden" : ""; return () => { document.body.style.overflow = ""; }; }, [open]);
  return (<>
    <button aria-label={t(L, "search")} onClick={() => setOpen(true)} className="md:hidden btn-icon w-11 h-11 bg-soft text-ink"><Icon n="search" s={21} /></button>
    {open && <div role="dialog" aria-modal="true" className="fixed inset-0 z-[70] bg-white animate-rise flex flex-col">
      <div className="flex items-center gap-2 p-3 border-b border-line"><div className="flex-1"><SearchBox placeholder={placeholder} cur={cur} hidden={hidden} autoFocus onDone={() => setOpen(false)} /></div>
        <button onClick={() => setOpen(false)} className="btn btn-sm text-steel px-2">{t(L, "close")}</button></div>
      <div className="p-4 overflow-y-auto"><b className="block text-sm text-steel mb-3">{t(L, "categories")}</b>
        <div className="flex flex-wrap gap-2">{cats.map((c) => <Link key={c.slug} href={`/categories/${c.slug}`} onClick={() => setOpen(false)} className="chip chip-off">{pick(L, c.nameAr, c.nameEn)}</Link>)}</div></div>
    </div>}
  </>);
}
