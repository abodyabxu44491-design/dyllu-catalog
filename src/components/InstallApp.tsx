// Copyright (c) 2026 Abdullah Al-Sakni. All rights reserved. DYLLU Catalog.
"use client";
import { useEffect, useState } from "react";
import Icon from "./Icon";
import Modal from "./Modal";
type BIP = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };
declare global {
  interface Window {
    __bip?: BIP | null;
  }
}
export default function InstallApp({ variant = "store", en = false }: { variant?: "store" | "admin" | "admin-side"; en?: boolean }) {
  const [bip, setBip] = useState<BIP | null>(null),
    [ios, setIos] = useState(false),
    [installed, setInstalled] = useState(true),
    [help, setHelp] = useState(false);
  useEffect(() => {
    const standalone =
      matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
    setInstalled(standalone);
    const ua = navigator.userAgent,
      isIos = /iPhone|iPad|iPod/.test(ua) || (ua.includes("Macintosh") && navigator.maxTouchPoints > 1);
    setIos(isIos && !/CriOS|FxiOS|EdgiOS/.test(ua));
    const sync = () => {
      setBip(window.__bip ?? null);
      if (window.__bip === null) setInstalled(true);
    };
    sync();
    addEventListener("dy-bip", sync);
    return () => removeEventListener("dy-bip", sync);
  }, []);
  if (installed || (!bip && !ios)) return null;
  async function install() {
    if (bip) {
      await bip.prompt();
      const c = await bip.userChoice;
      if (c.outcome === "accepted") {
        window.__bip = null;
        setInstalled(true);
      }
      return;
    }
    setHelp(true);
  }
  const label = en ? "Install app" : "ثبّت التطبيق";
  const btn =
    variant === "store" ? (
      <button
        onClick={install}
        className="btn btn-sm h-11 rounded-xl bg-ink text-lime hover:bg-black px-3"
        aria-label={label}
        title={label}
      >
        <Icon n="download" s={18} />
        <span className="hidden lg:inline">{label}</span>
      </button>
    ) : variant === "admin" ? (
      <button onClick={install} className="btn btn-sm h-9 rounded-lg bg-lime text-ink" aria-label={label}>
        <Icon n="download" s={16} />
        <span className="hidden xs:inline">{label}</span>
      </button>
    ) : (
      <button
        onClick={install}
        className="w-full flex items-center gap-3 rounded-xl px-3 h-10 text-sm font-bold text-ink bg-lime hover:bg-lime-dark"
      >
        <Icon n="download" s={18} />
        {label}
      </button>
    );
  return (
    <>
      {btn}
      <Modal
        open={help}
        onClose={() => setHelp(false)}
        title={en ? "Install DYLLU" : "ثبّت تطبيق DYLLU"}
        sub={en ? "Add it to your Home Screen in 3 steps" : "أضفه إلى الشاشة الرئيسية في 3 خطوات"}
        closeLabel={en ? "Close" : "إغلاق"}
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 rounded-2xl bg-soft p-3">
            <img src="/brand/icon-192.png" alt="" className="w-12 h-12 rounded-xl shadow-card" />
            <div>
              <b className="block font-display">DYLLU</b>
              <small className="text-steel">{en ? "Opens full screen, like an app" : "يفتح بملء الشاشة كتطبيق"}</small>
            </div>
          </div>
          <ol className="space-y-3 text-sm">
            <li className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-full bg-lime grid place-items-center font-extrabold shrink-0">1</span>
              <span>
                {en ? "Tap the Share button" : "اضغط زر المشاركة"}{" "}
                <Icon n="share" s={16} className="inline align-text-bottom text-[#007AFF]" />{" "}
                {en ? "in Safari's toolbar" : "في شريط Safari"}
              </span>
            </li>
            <li className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-full bg-lime grid place-items-center font-extrabold shrink-0">2</span>
              <span>
                {en ? "Choose “Add to Home Screen”" : "اختر «إضافة إلى الشاشة الرئيسية»"}{" "}
                <Icon n="plus" s={16} className="inline align-text-bottom" />
              </span>
            </li>
            <li className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-full bg-lime grid place-items-center font-extrabold shrink-0">3</span>
              <span>{en ? "Tap “Add”" : "اضغط «إضافة»"}</span>
            </li>
          </ol>
          <button onClick={() => setHelp(false)} className="btn btn-lg btn-lime w-full">
            {en ? "Got it" : "تم"}
          </button>
        </div>
      </Modal>
    </>
  );
}
