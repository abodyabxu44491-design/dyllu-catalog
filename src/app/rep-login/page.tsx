"use client";
import { useState } from "react";
import Icon from "@/components/Icon";
import { post } from "@/lib/client";
import { toAsciiDigits } from "@/lib/phone";
// دخول المندوب: رقم الجوال (بأي صيغة) + كلمة المرور التي أرسلتها الإدارة
export default function RepLogin() {
  const [f, setF] = useState({ phone: "", password: "" }), [err, setErr] = useState(""), [busy, setBusy] = useState(false), [show, setShow] = useState(false);
  async function go(e: React.FormEvent) { e.preventDefault(); setErr(""); setBusy(true); const r = await post("/api/rep/login", f); setBusy(false); r.ok ? (window.location.href = "/rep") : setErr(r.data.error || "تعذر تسجيل الدخول"); }
  return (<main dir="rtl" lang="ar" className="min-h-screen grid place-items-center bg-ink p-5 relative overflow-hidden">
    <span aria-hidden className="absolute -top-24 -end-24 w-80 h-80 bg-lime rotate-45 rounded-[3rem] opacity-90" />
    <span aria-hidden className="absolute -bottom-16 -start-10 w-40 h-40 bg-accent rotate-45 rounded-3xl" />
    <form onSubmit={go} className="relative w-full max-w-sm bg-white rounded-[1.75rem] p-6 shadow-[0_30px_80px_-20px_rgba(0,0,0,.6)] space-y-4 overflow-hidden">
      <div className="dy-stripe -mx-6 -mt-6 mb-5" />
      <img src="/brand/logo-wordmark.png" alt="DYLLU" className="h-11 w-auto mx-auto" />
      <div><h1 className="dy-tab !text-ink">دخول المندوب</h1><p className="text-sm text-steel mt-3">ادخل برقم جوالك وكلمة المرور التي وصلتك من الإدارة</p></div>
      <label className="block space-y-1.5"><span className="text-sm font-bold">رقم الجوال</span>
        <span className="relative block"><Icon n="phone" s={18} className="absolute start-3.5 top-1/2 -translate-y-1/2 text-steel pointer-events-none" />
          <input className="field ps-10" dir="ltr" inputMode="tel" autoComplete="username" placeholder="05XXXXXXXX" required value={f.phone} onChange={(e) => setF({ ...f, phone: toAsciiDigits(e.target.value) })} /></span></label>
      <label className="block space-y-1.5"><span className="text-sm font-bold">كلمة المرور</span><span className="relative block">
        <input className="field pe-12" type={show ? "text" : "password"} dir="ltr" autoComplete="current-password" autoCapitalize="none" autoCorrect="off" spellCheck={false} required value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} />
        <button type="button" aria-label={show ? "إخفاء" : "إظهار"} onClick={() => setShow(!show)} className="absolute end-1 top-1 btn-icon w-10 h-10 text-steel hover:text-ink"><Icon n={show ? "eyeOff" : "eye"} s={20} /></button></span></label>
      {err && <p role="alert" className="flex items-center gap-2 text-accent font-bold text-sm bg-accent/10 rounded-xl p-3"><Icon n="alert" s={16} />{err}</p>}
      <button disabled={busy} className="btn btn-lg btn-lime w-full">{busy ? "..." : "دخول"}</button>
      <a href="/" className="flex items-center justify-center gap-1 text-sm text-steel hover:text-ink"><Icon n="external" s={16} />عرض الكتالوج</a>
    </form>
  </main>);
}
