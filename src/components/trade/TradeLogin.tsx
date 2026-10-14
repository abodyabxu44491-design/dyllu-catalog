// Copyright (c) 2026 Abdullah Al-Sakni. All rights reserved. DYLLU Catalog.
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Icon from "@/components/Icon";
import InstallApp from "@/components/InstallApp";
import { post } from "@/lib/client";
export default function TradeLogin() {
  const r = useRouter(),
    [code, setCode] = useState(""),
    [phone, setPhone] = useState(""),
    [err, setErr] = useState(""),
    [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    if (!code.trim() || !phone.trim()) return setErr("اكتب الكود ورقم الجوال");
    setBusy(true);
    const x = await post("/api/trade/login", { code, phone });
    setBusy(false);
    if (!x.ok) return setErr(x.data.error ?? "تعذر الدخول، حاول مرة أخرى");
    r.refresh();
  }
  return (
    <div className="min-h-screen bg-ink text-white flex flex-col">
      <div className="flex-1 flex flex-col justify-center max-w-sm w-full mx-auto px-5 py-10">
        <div className="text-center mb-8">
          <img src="/brand/logo-wordmark-white.png" alt="DYLLU" className="h-12 w-auto mx-auto" />
          <span className="inline-block mt-3 text-xs font-extrabold text-ink bg-lime rounded-full px-3 py-1 tracking-wider">TRADE</span>
          <h1 className="mt-5 text-2xl">أسعار الجملة لأصحاب المحلات</h1>
          <p className="mt-2 text-sm text-white/70 leading-7">
            امسح باركود أي منتج DYLLU واعرف سعر الجملة فورًا. الدخول للمحلات المعتمدة فقط.
          </p>
        </div>
        <form onSubmit={submit} className="bg-white text-ink rounded-3xl p-5 space-y-4 shadow-lift">
          <label className="block">
            <b className="block text-sm mb-1.5">كود المحل</b>
            <input
              className="field text-center font-extrabold tracking-widest uppercase"
              dir="ltr"
              autoComplete="username"
              autoCapitalize="characters"
              placeholder="DY-XXXXXX"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
          </label>
          <label className="block">
            <b className="block text-sm mb-1.5">رقم الجوال المسجّل</b>
            <input
              className="field text-center"
              dir="ltr"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="05XXXXXXXX"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </label>
          {err && (
            <p role="alert" className="flex items-start gap-2 text-sm font-bold text-accent bg-accent/5 rounded-xl p-3">
              <Icon n="alert" s={18} className="shrink-0 mt-0.5" />
              {err}
            </p>
          )}
          <button disabled={busy} className="btn btn-lg btn-lime w-full">
            <Icon n="lock" s={18} />
            {busy ? "جارٍ الدخول…" : "دخول"}
          </button>
        </form>
        <p className="text-center text-xs text-white/60 mt-5 leading-6">ما عندك كود؟ تواصل مع DYLLU لاعتماد محلك.</p>
        <div className="mt-6">
          <InstallApp variant="admin-side" />
        </div>
      </div>
    </div>
  );
}
