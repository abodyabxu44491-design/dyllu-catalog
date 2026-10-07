"use client";
import { useEffect, useRef, useState } from "react";
import Icon from "./Icon";
import { useLang } from "@/lib/useLang";
import { t } from "@/lib/i18n";
// معرض صور المنتج: سحب باليد (جوال)، صور مصغّرة وأسهم (كمبيوتر)، والضغط يفتح عرضًا كامل الشاشة قابلًا للتكبير
export default function ProductGallery({ images, alt, badge }: { images: string[]; alt: string; badge?: string }) {
  const L = useLang(), rtl = L !== "en", [i, setI] = useState(0), [zoom, setZoom] = useState(false), track = useRef<HTMLDivElement>(null), n = images.length;
  const go = (k: number) => { const j = (k + n) % n; setI(j); const el = track.current; if (el) el.scrollTo({ left: (rtl ? -1 : 1) * j * el.clientWidth, behavior: "smooth" }); };
  const onScroll = () => { const el = track.current; if (el) setI(Math.round(Math.abs(el.scrollLeft) / el.clientWidth)); };
  useEffect(() => {
    if (!zoom) return; document.body.style.overflow = "hidden";
    const f = (e: KeyboardEvent) => { if (e.key === "Escape") setZoom(false); if (e.key === "ArrowLeft") setI((x) => (x + (rtl ? 1 : -1) + n) % n); if (e.key === "ArrowRight") setI((x) => (x + (rtl ? -1 : 1) + n) % n); };
    addEventListener("keydown", f); return () => { removeEventListener("keydown", f); document.body.style.overflow = ""; };
  }, [zoom, n, rtl]);
  if (!n) return <div className="aspect-square rounded-3xl bg-soft grid place-items-center text-steel/30"><Icon n="image" s={72} stroke={1.2} /></div>;
  const arrow = "absolute top-1/2 -translate-y-1/2 btn-icon w-11 h-11 rounded-full bg-white/90 shadow-card hover:bg-lime";
  return (<div className="space-y-3">
    <div className="relative group rounded-3xl bg-soft overflow-hidden">
      <div ref={track} onScroll={onScroll} className="flex overflow-x-auto snap-x snap-mandatory no-scrollbar">
        {images.map((src, k) => <button key={k} onClick={() => { setI(k); setZoom(true); }} className="snap-center shrink-0 w-full aspect-square cursor-zoom-in" aria-label={`${alt} ${k + 1}`}>
          <img src={src} alt={k === 0 ? alt : ""} loading={k === 0 ? "eager" : "lazy"} className="w-full h-full object-contain p-4 md:p-8" draggable={false} /></button>)}
      </div>
      {badge && <span className="absolute top-4 start-4 bg-accent text-white text-xs font-extrabold px-3 py-1 rounded-full">{badge}</span>}
      <span className="absolute top-4 end-4 btn-icon w-10 h-10 rounded-full bg-white/90 text-steel pointer-events-none"><Icon n="zoom" s={20} /></span>
      {n > 1 && <>
        <button aria-label={t(L, "prev")} onClick={() => go(i - 1)} className={`${arrow} start-3 hidden md:grid opacity-0 group-hover:opacity-100 transition`}><Icon n="chev" s={20} className="rotate-180 rtl:rotate-0" /></button>
        <button aria-label={t(L, "next")} onClick={() => go(i + 1)} className={`${arrow} end-3 hidden md:grid opacity-0 group-hover:opacity-100 transition`}><Icon n="chev" s={20} className="rtl:rotate-180" /></button>
        <div className="absolute bottom-3 inset-x-0 flex justify-center gap-1.5 md:hidden">{images.map((_, k) => <i key={k} className={`h-1.5 rounded-full transition-all ${k === i ? "w-5 bg-accent" : "w-1.5 bg-ink/20"}`} />)}</div></>}
    </div>
    {n > 1 && <div className="hidden sm:flex gap-2 overflow-x-auto no-scrollbar">{images.map((src, k) => <button key={k} onClick={() => go(k)} aria-label={`${k + 1}`} className={`shrink-0 w-20 h-20 rounded-2xl bg-soft overflow-hidden border-2 transition ${k === i ? "border-accent" : "border-transparent hover:border-line"}`}><img src={src} alt="" className="w-full h-full object-contain p-1.5" /></button>)}</div>}

    {zoom && <div role="dialog" aria-modal="true" aria-label={alt} className="fixed inset-0 z-[90] bg-ink/95 flex flex-col animate-rise" onClick={() => setZoom(false)}>
      <div className="flex justify-between items-center p-3 text-white"><span className="text-sm font-bold px-2">{i + 1} / {n}</span><button aria-label={t(L, "close")} className="btn-icon w-11 h-11 rounded-full bg-white/10 hover:bg-white/20"><Icon n="close" s={22} /></button></div>
      <div className="flex-1 relative overflow-auto grid place-items-center p-4" onClick={(e) => e.stopPropagation()} style={{ touchAction: "pinch-zoom" }}>
        <img src={images[i]} alt={alt} className="max-w-full max-h-[80vh] object-contain" />
        {n > 1 && <><button aria-label={t(L, "prev")} onClick={() => setI((i - 1 + n) % n)} className={`${arrow} start-3`}><Icon n="chev" s={20} className="rotate-180 rtl:rotate-0" /></button>
          <button aria-label={t(L, "next")} onClick={() => setI((i + 1) % n)} className={`${arrow} end-3`}><Icon n="chev" s={20} className="rtl:rotate-180" /></button></>}
      </div>
      {n > 1 && <div className="flex justify-center gap-2 p-3 overflow-x-auto" onClick={(e) => e.stopPropagation()}>{images.map((src, k) => <button key={k} onClick={() => setI(k)} className={`shrink-0 w-14 h-14 rounded-xl bg-white overflow-hidden border-2 ${k === i ? "border-lime" : "border-transparent opacity-60"}`}><img src={src} alt="" className="w-full h-full object-contain p-1" /></button>)}</div>}
    </div>}
  </div>);
}
