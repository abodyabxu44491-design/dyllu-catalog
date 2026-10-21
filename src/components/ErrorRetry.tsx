// Copyright (c) 2026 Abdullah Al-Sakni. All rights reserved. DYLLU Catalog.
"use client";
import { startTransition, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Icon from "@/components/Icon";
const KEY = "dy-auto-retry";
// Server errors are usually a momentary database hiccup: retry once by itself, then offer a button
export default function ErrorRetry({ reset, error }: { reset: () => void; error: Error & { digest?: string } }) {
  const r = useRouter(),
    [busy, setBusy] = useState(false);
  const retry = () => {
    setBusy(true);
    startTransition(() => {
      r.refresh();
      reset();
    });
    setTimeout(() => setBusy(false), 4000);
  };
  useEffect(() => {
    let last = 0;
    try {
      last = Number(sessionStorage.getItem(KEY) || 0);
      if (Date.now() - last > 30_000) sessionStorage.setItem(KEY, String(Date.now()));
    } catch {}
    if (Date.now() - last > 30_000) {
      const t = setTimeout(retry, 1200);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <div dir="rtl" lang="ar" className="max-w-md mx-auto py-16 px-4 text-center">
      <span className="mx-auto grid place-items-center w-16 h-16 rounded-full bg-accent/10 text-accent">
        <Icon n="alert" s={30} />
      </span>
      <h1 className="text-xl font-extrabold mt-4">تعذر تحميل الصفحة</h1>
      <p className="text-steel text-sm mt-2 leading-7">
        غالبًا انقطاع لحظي في الاتصال. اضغط «إعادة المحاولة»، ولو تكررت المشكلة أعد تحميل الصفحة بعد دقيقة.
      </p>
      <button onClick={retry} disabled={busy} className="btn btn-lg btn-lime mt-6">
        <Icon n="bolt" s={18} />
        {busy ? "جارٍ المحاولة…" : "إعادة المحاولة"}
      </button>
      {error.digest && (
        <p className="text-[11px] text-steel/70 mt-5" dir="ltr">
          ref: {error.digest}
        </p>
      )}
    </div>
  );
}
