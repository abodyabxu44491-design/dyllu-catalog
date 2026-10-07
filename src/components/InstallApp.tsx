"use client";
import { useEffect, useState } from "react";
import Icon from "./Icon";
import Portal from "./Portal";
type BIP = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };
declare global { interface Window { __bip?: BIP | null } }
// زر «تثبيت التطبيق»: أندرويد/كروم/إيدج = نافذة التثبيت الرسمية · آيفون/آيباد = شرح الإضافة للشاشة الرئيسية.
// يختفي إذا كان التطبيق مثبتًا (يعمل بوضع standalone) أو بعد التثبيت مباشرة.
export default function InstallApp({ variant = "store", en = false }: { variant?: "store" | "admin" | "admin-side"; en?: boolean }) {
  const [bip, setBip] = useState<BIP | null>(null), [ios, setIos] = useState(false), [installed, setInstalled] = useState(true), [help, setHelp] = useState(false);
  useEffect(() => {
    const standalone = matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
    setInstalled(standalone);
    const ua = navigator.userAgent, isIos = /iPhone|iPad|iPod/.test(ua) || (ua.includes("Macintosh") && navigator.maxTouchPoints > 1);
    setIos(isIos && !/CriOS|FxiOS|EdgiOS/.test(ua));
    const sync = () => { setBip(window.__bip ?? null); if (window.__bip === null) setInstalled(true); };
    sync(); addEventListener("dy-bip", sync); return () => removeEventListener("dy-bip", sync);
  }, []);
  if (installed || (!bip && !ios)) return null;
  async function install() {
    if (bip) { await bip.prompt(); const c = await bip.userChoice; if (c.outcome === "accepted") { window.__bip = null; setInstalled(true); } return; }
    setHelp(true);
  }
  const label = en ? "Install app" : "ثبّت التطبيق";
  const btn = variant === "store" ? <button onClick={install} className="btn btn-sm h-11 rounded-xl bg-ink text-lime hover:bg-black px-3" aria-label={label} title={label}><Icon n="download" s={18} /><span className="hidden lg:inline">{label}</span></button>
    : variant === "admin" ? <button onClick={install} className="btn btn-sm h-9 rounded-lg bg-lime text-ink" aria-label={label}><Icon n="download" s={16} /><span className="hidden xs:inline">{label}</span></button>
    : <button onClick={install} className="w-full flex items-center gap-3 rounded-xl px-3 h-10 text-sm font-bold text-ink bg-lime hover:bg-lime-dark"><Icon n="download" s={18} />{label}</button>;
  return (<>{btn}
    <Portal>{help && <div className="fixed inset-0 z-[90] bg-ink/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-6" onClick={() => setHelp(false)}>
      <div role="dialog" aria-modal="true" aria-label={label} className="animate-rise bg-white w-full sm:max-w-sm rounded-t-3xl sm:rounded-3xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="dy-stripe" /><div className="p-5 space-y-4 pb-safe">
          <div className="flex items-center gap-3"><img src="/brand/icon-192.png" alt="" className="w-14 h-14 rounded-2xl shadow-card" /><div><b className="block font-display">DYLLU</b><small className="text-steel">{en ? "Add to your Home Screen" : "أضفه إلى الشاشة الرئيسية"}</small></div></div>
          <ol className="space-y-3 text-sm">
            <li className="flex items-center gap-3"><span className="w-8 h-8 rounded-full bg-lime grid place-items-center font-extrabold shrink-0">1</span><span>{en ? "Tap the Share button" : "اضغط زر المشاركة"} <Icon n="share" s={16} className="inline align-text-bottom text-[#007AFF]" /> {en ? "in Safari's toolbar" : "في شريط Safari"}</span></li>
            <li className="flex items-center gap-3"><span className="w-8 h-8 rounded-full bg-lime grid place-items-center font-extrabold shrink-0">2</span><span>{en ? "Choose “Add to Home Screen”" : "اختر «إضافة إلى الشاشة الرئيسية»"} <Icon n="plus" s={16} className="inline align-text-bottom" /></span></li>
            <li className="flex items-center gap-3"><span className="w-8 h-8 rounded-full bg-lime grid place-items-center font-extrabold shrink-0">3</span><span>{en ? "Tap “Add” — DYLLU opens like an app" : "اضغط «إضافة»، ويفتح DYLLU كتطبيق"}</span></li>
          </ol>
          <button onClick={() => setHelp(false)} className="btn btn-lg btn-lime w-full">{en ? "Got it" : "تم"}</button>
        </div></div></div>}</Portal>
  </>);
}
