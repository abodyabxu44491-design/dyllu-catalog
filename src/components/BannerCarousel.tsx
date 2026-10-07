"use client";
import Icon from "./Icon";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import AdCanvas, { type AdData } from "./ads/AdCanvas";
export type Slide = { id: number; href: string; seconds: number; ad: AdData };
// سلايدر الإعلانات: يقلب تلقائيًا بعد seconds (الافتراضي 5)، يتوقف أثناء اللمس، ويدعم السحب باليد ونقاط التنقل.
export default function BannerCarousel({ slides, rtl }: { slides: Slide[]; rtl: boolean }) {
  const n = slides.length, [i, setI] = useState(0), [hold, setHold] = useState(false), x0 = useRef(0), swiped = useRef(false);
  const go = (k: number) => setI(((k % n) + n) % n);
  useEffect(() => { if (n < 2 || hold) return; const t = setTimeout(() => go(i + 1), slides[i].seconds * 1000); return () => clearTimeout(t); }, [i, hold, n]); // eslint-disable-line react-hooks/exhaustive-deps
  function up(e: React.PointerEvent) {
    const dx = e.clientX - x0.current; setHold(false);
    if (Math.abs(dx) > 40) { swiped.current = true; go(i + ((dx > 0) === rtl ? 1 : -1)); } // في العربية السحب لليمين = التالي
  }
  const inner = (s: Slide) => <AdCanvas ad={s.ad} />;
  return (<section aria-roledescription="carousel">
    <div className="relative aspect-[16/9] md:aspect-[2.6/1] lg:aspect-[3/1] rounded-3xl overflow-hidden bg-ink touch-pan-y select-none"
      onPointerDown={(e) => { x0.current = e.clientX; swiped.current = false; setHold(true); }} onPointerUp={up} onPointerCancel={() => setHold(false)} onPointerLeave={() => hold && setHold(false)}
      onClickCapture={(e) => { if (swiped.current) { e.preventDefault(); e.stopPropagation(); swiped.current = false; } }}>
      {slides.map((s, k) => { const cls = `absolute inset-0 transition-opacity duration-500 ${k === i ? "opacity-100" : "opacity-0 pointer-events-none"}`;
        return s.href ? (s.href.startsWith("/") ? <Link key={s.id} href={s.href} draggable={false} aria-hidden={k !== i} tabIndex={k === i ? 0 : -1} aria-label={s.ad.title || undefined} className={cls}>{inner(s)}</Link> : <a key={s.id} href={s.href} target="_blank" rel="noopener noreferrer" draggable={false} aria-hidden={k !== i} tabIndex={k === i ? 0 : -1} aria-label={s.ad.title || undefined} className={cls}>{inner(s)}</a>) : <div key={s.id} aria-hidden={k !== i} className={cls}>{inner(s)}</div>; })}
      {n > 1 && <span className="absolute inset-x-0 bottom-0 h-[3px] bg-white/25"><span key={`${i}-${hold}`} className="block h-full bg-lime" style={hold ? { width: 0 } : { animation: `bnr ${slides[i].seconds}s linear forwards` }} /></span>}
      {n > 1 && <><button aria-label="prev" onClick={() => go(i - 1)} className="hidden md:grid absolute top-1/2 -translate-y-1/2 start-3 w-11 h-11 rounded-full bg-white/90 hover:bg-lime place-items-center transition"><Icon n="chev" s={20} className={rtl ? "" : "rotate-180"} /></button><button aria-label="next" onClick={() => go(i + 1)} className="hidden md:grid absolute top-1/2 -translate-y-1/2 end-3 w-11 h-11 rounded-full bg-white/90 hover:bg-lime place-items-center transition"><Icon n="chev" s={20} className={rtl ? "rotate-180" : ""} /></button></>}</div>
    {n > 1 && <div className="flex justify-center gap-1.5 mt-2.5">{slides.map((s, k) => <button key={s.id} aria-label={`${k + 1}`} onClick={() => go(k)} className={`h-2 rounded-full transition-all ${k === i ? "w-6 bg-accent" : "w-2 bg-ink/20"}`} />)}</div>}
  </section>);
}
