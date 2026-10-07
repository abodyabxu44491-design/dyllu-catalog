"use client";
import { useState } from "react";
import Icon from "@/components/Icon";
import { post } from "@/lib/client";
export default function Login() {
  const [f, setF] = useState({ email: "", password: "" }), [err, setErr] = useState(""), [busy, setBusy] = useState(false), [show, setShow] = useState(false);
  async function go(e: React.FormEvent) { e.preventDefault(); setErr(""); setBusy(true); const r = await post("/api/admin/login", f); setBusy(false); r.ok ? (window.location.href = "/admin") : setErr(r.data.error || "تعذر تسجيل الدخول"); }
  return (<main dir="rtl" lang="ar" className="min-h-screen grid lg:grid-cols-2 bg-white">
    <section className="hidden lg:flex relative overflow-hidden bg-ink text-white p-12 flex-col justify-between">
      <span className="absolute -top-32 -start-32 w-96 h-96 rounded-full bg-lime/10" /><span className="absolute -bottom-40 -end-24 w-[28rem] h-[28rem] rounded-full bg-accent/10" />
      <img src="/brand/logo-wordmark-white.png" alt="DYLLU" className="relative h-12 w-auto self-start" />
      <div className="relative"><span className="inline-block bg-white rounded-3xl p-4"><img src="/brand/logo-badge.png" alt="" className="h-28 w-auto" /></span>
        <b className="block font-display text-4xl text-lime mt-8" dir="ltr" style={{ textAlign: "start" }}>Discover your Power</b><p className="text-white/70 mt-3 text-lg">أدر منتجاتك وطلباتك وعملاء الجملة من مكان واحد.</p></div>
      <div className="relative h-2 bg-lime shadow-[0_-3px_0_theme(colors.accent)] -mx-12 -mb-12" />
    </section>
    <section className="flex items-center justify-center p-6 bg-soft lg:bg-white">
      <form onSubmit={go} className="w-full max-w-sm bg-white rounded-3xl lg:rounded-none p-6 lg:p-0 shadow-card lg:shadow-none space-y-4 overflow-hidden relative">
        <div className="lg:hidden dy-stripe -mx-6 -mt-6 mb-4" />
        <img src="/brand/logo-wordmark.png" alt="DYLLU" className="h-11 w-auto lg:hidden mx-auto" />
        <div><h1 className="dy-tab">لوحة التحكم</h1><p className="text-sm text-steel mt-3">سجّل الدخول للمتابعة</p></div>
        <label className="block space-y-1.5"><span className="text-sm font-bold">البريد الإلكتروني</span><input className="field" type="email" dir="ltr" autoComplete="username" autoCapitalize="none" autoCorrect="off" spellCheck={false} required value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></label>
        <label className="block space-y-1.5"><span className="text-sm font-bold">كلمة المرور</span><span className="relative block"><input className="field pe-12" type={show ? "text" : "password"} dir="ltr" autoComplete="current-password" autoCapitalize="none" autoCorrect="off" spellCheck={false} required value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} />
          <button type="button" aria-label={show ? "إخفاء" : "إظهار"} onClick={() => setShow(!show)} className="absolute end-1 top-1 btn-icon w-10 h-10 text-steel hover:text-ink"><Icon n={show ? "eyeOff" : "eye"} s={20} /></button></span></label>
        {err && <p className="flex items-center gap-2 text-accent font-bold text-sm bg-accent/10 rounded-xl p-3"><Icon n="alert" s={16} />{err}</p>}
        <button disabled={busy} className="btn btn-lg btn-lime w-full">{busy ? "..." : "دخول"}</button>
        <a href="/" className="flex items-center justify-center gap-1 text-sm text-steel hover:text-ink"><Icon n="external" s={16} />عرض المتجر</a>
      </form>
    </section>
  </main>);
}
