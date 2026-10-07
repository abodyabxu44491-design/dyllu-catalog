"use client";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Icon from "./Icon";
import { useLang } from "@/lib/useLang";
import { t } from "@/lib/i18n";
type Hit = { slug: string; nameAr: string; nameEn: string; sku: string | null; image: string | null; price: number | null };
// بحث فوري: اقتراحات أثناء الكتابة (بعد حرفين)، الأسهم للتنقل، Enter يفتح صفحة النتائج الكاملة
export default function SearchBox({ placeholder, initial = "", cur, hidden, autoFocus = false, size = "md", onDone }: { placeholder: string; initial?: string; cur: string; hidden: string; autoFocus?: boolean; size?: "md" | "lg"; onDone?: () => void }) {
  const L = useLang(), en = L === "en", r = useRouter(), id = useId();
  const [q, setQ] = useState(initial), [hits, setHits] = useState<Hit[]>([]), [open, setOpen] = useState(false), [act, setAct] = useState(-1), [busy, setBusy] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const s = q.trim(); if (s.length < 2) { setHits([]); setBusy(false); return; }
    setBusy(true); const c = new AbortController();
    const tm = setTimeout(() => fetch(`/api/search?q=${encodeURIComponent(s)}`, { signal: c.signal }).then((x) => x.json()).then((x) => { setHits(Array.isArray(x) ? x : []); setAct(-1); setBusy(false); }).catch(() => {}), 220);
    return () => { clearTimeout(tm); c.abort(); };
  }, [q]);
  useEffect(() => { const f = (e: MouseEvent) => { if (!box.current?.contains(e.target as Node)) setOpen(false); }; document.addEventListener("mousedown", f); return () => document.removeEventListener("mousedown", f); }, []);
  const go = (href: string) => { setOpen(false); onDone?.(); r.push(href); };
  function submit(e: React.FormEvent) { e.preventDefault(); if (act >= 0 && hits[act]) return go(`/products/${hits[act].slug}`); const s = q.trim(); go(s ? `/products?q=${encodeURIComponent(s)}` : "/products"); }
  function key(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") { e.preventDefault(); setOpen(true); setAct((a) => Math.min(hits.length - 1, a + 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setAct((a) => Math.max(-1, a - 1)); }
    else if (e.key === "Escape") { setOpen(false); (e.target as HTMLInputElement).blur(); }
  }
  const show = open && q.trim().length >= 2, h = size === "lg" ? "h-14" : "h-11";
  return (<div ref={box} className="relative w-full">
    <form role="search" onSubmit={submit} className="relative">
      <Icon n="search" s={20} className="absolute start-4 top-1/2 -translate-y-1/2 text-steel pointer-events-none" />
      <input type="search" name="q" value={q} autoFocus={autoFocus} autoComplete="off" enterKeyHint="search" placeholder={placeholder} aria-label={placeholder}
        role="combobox" aria-expanded={show} aria-controls={id} aria-activedescendant={act >= 0 ? `${id}-${act}` : undefined}
        onChange={(e) => { setQ(e.target.value); setOpen(true); }} onFocus={() => setOpen(true)} onKeyDown={key}
        className={`w-full ${h} rounded-full bg-soft border border-transparent ps-12 pe-14 text-base outline-none transition placeholder:text-steel/80 focus:bg-white focus:border-steel/40 focus:ring-4 focus:ring-lime/40 [&::-webkit-search-cancel-button]:hidden`} />
      {q && <button type="button" aria-label={t(L, "close")} onClick={() => { setQ(""); setHits([]); }} className="absolute end-12 top-1/2 -translate-y-1/2 btn-icon w-8 h-8 text-steel hover:text-ink"><Icon n="close" s={16} /></button>}
      <button aria-label={t(L, "search")} className={`absolute end-1.5 top-1/2 -translate-y-1/2 btn-icon rounded-full bg-lime text-ink hover:bg-lime-dark ${size === "lg" ? "w-11 h-11" : "w-8 h-8"}`}><Icon n="chev" s={18} className="flip-rtl" stroke={2.6} /></button>
    </form>
    {show && (<div id={id} role="listbox" className="absolute z-50 inset-x-0 top-full mt-2 bg-white rounded-2xl shadow-lift border border-line overflow-hidden animate-rise">
      {busy && !hits.length ? <div className="p-4 space-y-2">{[0, 1, 2].map((i) => <div key={i} className="skeleton h-12" />)}</div>
        : hits.length === 0 ? <p className="p-5 text-center text-sm text-steel">{t(L, "noResults")}</p>
        : <>{hits.map((x, i) => (<Link key={x.slug} id={`${id}-${i}`} role="option" aria-selected={i === act} href={`/products/${x.slug}`} onClick={() => { setOpen(false); onDone?.(); }} onMouseEnter={() => setAct(i)}
            className={`flex items-center gap-3 px-3 py-2.5 ${i === act ? "bg-soft" : ""}`}>
            <span className="w-12 h-12 rounded-xl bg-soft overflow-hidden shrink-0">{x.image && <img src={x.image} alt="" className="w-full h-full object-contain" />}</span>
            <span className="flex-1 min-w-0"><b className="block text-sm line-clamp-1">{en ? x.nameEn : x.nameAr}</b><small className="block text-xs text-steel line-clamp-1" dir="ltr" style={{ textAlign: "start" }}>{x.sku ? `${x.sku} · ` : ""}{en ? x.nameAr : x.nameEn}</small></span>
            <b className="text-sm whitespace-nowrap">{x.price == null ? <span className="text-steel font-normal text-xs">{hidden}</span> : `${x.price} ${cur}`}</b></Link>))}
          <button onClick={() => go(`/products?q=${encodeURIComponent(q.trim())}`)} className="w-full flex items-center justify-center gap-1.5 p-3 text-sm font-bold bg-soft hover:bg-lime/30 border-t border-line">{t(L, "resultsFor")} «{q.trim()}»<Icon n="chev" s={16} className="flip-rtl" /></button></>}
    </div>)}
  </div>);
}
