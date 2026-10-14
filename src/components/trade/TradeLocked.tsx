// Copyright (c) 2026 Abdullah Al-Sakni. All rights reserved. DYLLU Catalog.
"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Icon from "@/components/Icon";
import { KEY_STORE } from "./TradeApp";
// Shown when the app is opened without a valid private link. If this device was set up before,
// the saved key restores access silently; otherwise the shop asks DYLLU for its link.
export default function TradeLocked() {
  const r = useRouter(),
    [checking, setChecking] = useState(true);
  useEffect(() => {
    let key = "";
    try {
      key = localStorage.getItem(KEY_STORE) || "";
    } catch {}
    if (!key) return setChecking(false);
    fetch("/api/trade/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ key }) })
      .then((x) => {
        if (x.ok) return r.refresh();
        try {
          localStorage.removeItem(KEY_STORE);
        } catch {}
        setChecking(false);
      })
      .catch(() => setChecking(false));
  }, [r]);
  return (
    <div className="min-h-screen bg-ink text-white flex flex-col">
      <div className="flex-1 flex flex-col justify-center items-center text-center max-w-sm w-full mx-auto px-6 py-10">
        <img src="/brand/logo-wordmark-white.png" alt="DYLLU" className="h-12 w-auto" />
        <span className="inline-block mt-3 text-xs font-extrabold text-ink bg-lime rounded-full px-3 py-1 tracking-wider">TRADE</span>
        {checking ? (
          <span
            className="mt-10 block w-10 h-10 rounded-full border-4 border-lime border-t-transparent animate-spin"
            aria-label="جارٍ التحميل"
          />
        ) : (
          <>
            <span className="mt-8 w-14 h-14 rounded-2xl bg-white/10 grid place-items-center">
              <Icon n="lock" s={26} className="text-lime" />
            </span>
            <h1 className="mt-5 text-2xl">التطبيق خاص بالمحلات المعتمدة</h1>
            <p className="mt-3 text-sm text-white/70 leading-7">
              افتح التطبيق من الرابط الخاص بمحلك الذي وصلك من DYLLU. إذا لم يصلك الرابط أو توقف، تواصل مع DYLLU.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
