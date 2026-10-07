"use client";
import { useEffect, useRef, useState } from "react";
import Icon from "@/components/Icon";
import { post } from "@/lib/client";
// دخول لوحة التحكم: البريد يُحفظ على الجهاز، تنبيه Caps Lock، وبعد الدخول يرجع للصفحة التي طُلبت (?next=)
export default function Login() {
  const [f, setF] = useState({ email: "", password: "" }), [err, setErr] = useState(""), [busy, setBusy] = useState(false), [show, setShow] = useState(false), [caps, setCaps] = useState(false), [shake, setShake] = useState(0);
  const pwRef = useRef<HTMLInputElement>(null);
  useEffect(() => { try { const e = localStorage.getItem("dy-admin-email"); if (e) { setF((x) => ({ ...x, email: e })); pwRef.current?.focus(); } } catch { /* لا شيء */ } }, []);
  async function go(e: React.FormEvent) {
    e.preventDefault(); if (busy) return; setErr(""); setBusy(true);
    const email = f.email.trim().toLowerCase(), r = await post("/api/admin/login", { email, password: f.password });
    if (r.ok) {
      try { localStorage.setItem("dy-admin-email", email); } catch { /* لا شيء */ }
      const next = new URLSearchParams(location.search).get("next");
      return location.replace(next && /^\/admin(\/|$)/.test(next) ? next : "/admin");
    }
    setBusy(false); setErr(r.data.error || "تعذر تسجيل الدخول"); setShake((n) => n + 1); setF((x) => ({ ...x, password: "" })); pwRef.current?.focus();
  }
  const capsKey = (e: React.KeyboardEvent) => setCaps(e.getModifierState?.("CapsLock") ?? false);
  const field = "field h-12 pl-11";
  return (<main dir="rtl" lang="ar" className="min-h-screen grid lg:grid-cols-2 bg-white">
    <section className="hidden lg:flex relative overflow-hidden bg-ink text-white p-12 flex-col justify-between">
      <span aria-hidden className="absolute -top-24 -end-24 w-96 h-96 bg-lime rotate-45 rounded-[4rem] opacity-90" />
      <span aria-hidden className="absolute -bottom-20 end-20 w-44 h-44 bg-accent rotate-45 rounded-[2.5rem]" />
      <img src="/brand/logo-wordmark-white.png" alt="DYLLU" className="relative h-12 w-auto self-start" />
      <div className="relative max-w-md"><span className="inline-block bg-white rounded-3xl p-4 shadow-2xl"><img src="/brand/logo-badge.png" alt="" className="h-28 w-auto" /></span>
        <b className="block font-display text-5xl leading-[1.05] text-lime mt-8" dir="ltr" style={{ textAlign: "start" }}>Discover<br />your Power</b>
        <p className="text-white/70 mt-4 text-lg leading-8">أدر منتجاتك وطلباتك ومناديبك وعملاء الجملة من مكان واحد.</p></div>
      <div className="relative h-2 bg-lime shadow-[0_-3px_0_theme(colors.accent)] -mx-12 -mb-12" />
    </section>
    <section className="flex items-center justify-center p-5 sm:p-8 bg-soft lg:bg-white">
      <form onSubmit={go} key={shake} className={`w-full max-w-sm bg-white rounded-[1.75rem] lg:rounded-none p-6 lg:p-0 shadow-card lg:shadow-none space-y-5 overflow-hidden relative ${shake ? "animate-shake" : ""}`} noValidate>
        <div className="lg:hidden dy-stripe -mx-6 -mt-6 mb-5" />
        <img src="/brand/logo-wordmark.png" alt="DYLLU" className="h-11 w-auto lg:hidden mx-auto" />
        <div><h1 className="dy-tab !text-ink">لوحة التحكم</h1><p className="text-sm text-steel mt-3">سجّل الدخول بالبريد وكلمة المرور</p></div>
        <label className="block space-y-1.5"><span className="text-sm font-bold">البريد الإلكتروني</span>
          <span className="relative block"><Icon n="mail" s={19} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-steel pointer-events-none" />
            <input className={field} type="email" dir="ltr" inputMode="email" autoComplete="username" autoCapitalize="none" autoCorrect="off" spellCheck={false} autoFocus required placeholder="name@company.com"
              value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></span></label>
        <label className="block space-y-1.5"><span className="text-sm font-bold">كلمة المرور</span>
          <span className="relative block"><Icon n="lock" s={19} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-steel pointer-events-none" />
            <input ref={pwRef} className={`${field} pr-12`} type={show ? "text" : "password"} dir="ltr" autoComplete="current-password" autoCapitalize="none" autoCorrect="off" spellCheck={false} required
              value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} onKeyUp={capsKey} onKeyDown={capsKey} onBlur={() => setCaps(false)} />
            <button type="button" aria-label={show ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"} aria-pressed={show} onClick={() => { setShow(!show); pwRef.current?.focus(); }}
              className="absolute right-1 top-1/2 -translate-y-1/2 btn-icon w-10 h-10 text-steel hover:text-ink hover:bg-soft"><Icon n={show ? "eyeOff" : "eye"} s={20} /></button></span>
          {caps && <small className="flex items-center gap-1 text-xs font-bold text-accent"><Icon n="alert" s={13} />الأحرف الكبيرة (Caps Lock) مفعّلة</small>}</label>
        {err && <p role="alert" className="flex items-center gap-2 text-accent font-bold text-sm bg-accent/10 rounded-xl p-3"><Icon n="alert" s={16} />{err}</p>}
        <button disabled={busy || !f.email.trim() || !f.password} className="btn btn-lg btn-lime w-full">{busy ? <span className="w-5 h-5 rounded-full border-2 border-ink/30 border-t-ink animate-spin" /> : <>دخول<Icon n="chev" s={18} className="flip-rtl" /></>}</button>
        <div className="flex items-center justify-center gap-5 text-sm text-steel pt-1"><a href="/" className="inline-flex items-center gap-1 hover:text-ink"><Icon n="external" s={16} />عرض المتجر</a><a href="/rep-login" className="inline-flex items-center gap-1 hover:text-ink"><Icon n="users" s={16} />دخول المندوبين</a></div>
      </form>
    </section>
  </main>);
}
