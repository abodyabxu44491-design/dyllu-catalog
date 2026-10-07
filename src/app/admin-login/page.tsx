"use client";
import { useEffect, useRef, useState } from "react";
import Icon from "@/components/Icon";
import AuthShell, { AuthField } from "@/components/AuthShell";
import { post } from "@/lib/client";
// دخول لوحة التحكم: البريد يُحفظ على الجهاز، تنبيه Caps Lock، وبعد الدخول يرجع للصفحة التي طُلبت (?next=)
export default function Login() {
  const [f, setF] = useState({ email: "", password: "" }), [err, setErr] = useState(""), [busy, setBusy] = useState(false), [show, setShow] = useState(false), [caps, setCaps] = useState(false), [shake, setShake] = useState(0);
  const pwRef = useRef<HTMLInputElement>(null);
  useEffect(() => { try { const e = localStorage.getItem("dy-admin-email"); if (e) { setF((x) => ({ ...x, email: e })); pwRef.current?.focus(); } } catch { /* لا شيء */ } }, []);
  async function go(e: React.FormEvent) {
    e.preventDefault(); if (busy) return; if (!f.email.trim() || !f.password) { setErr("اكتب البريد وكلمة المرور"); setShake((n) => n + 1); return; } setErr(""); setBusy(true);
    const email = f.email.trim().toLowerCase(), r = await post("/api/admin/login", { email, password: f.password });
    if (r.ok) {
      try { localStorage.setItem("dy-admin-email", email); } catch { /* لا شيء */ }
      const next = new URLSearchParams(location.search).get("next");
      return location.replace(next && /^\/admin(\/|$)/.test(next) ? next : "/admin");
    }
    setBusy(false); setErr(r.data.error || "تعذر تسجيل الدخول"); setShake((n) => n + 1); setF((x) => ({ ...x, password: "" })); pwRef.current?.focus();
  }
  const capsKey = (e: React.KeyboardEvent) => setCaps(e.getModifierState?.("CapsLock") ?? false);
  return (<AuthShell role="admin" title="دخول لوحة التحكم" sub="سجّل الدخول بالبريد وكلمة المرور الخاصة بالإدارة">
    <form onSubmit={go} key={shake} className={`space-y-4 ${shake ? "animate-shake" : ""}`} noValidate>
      <AuthField label="البريد الإلكتروني" icon="mail" type="email" inputMode="email" autoComplete="username" autoCapitalize="none" autoCorrect="off" spellCheck={false} autoFocus required placeholder="name@company.com"
        value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
      <AuthField label="كلمة المرور" icon="lock" inputRef={pwRef} type={show ? "text" : "password"} autoComplete="current-password" autoCapitalize="none" autoCorrect="off" spellCheck={false} required placeholder="••••••••"
        value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} onKeyUp={capsKey} onKeyDown={capsKey} onBlur={() => setCaps(false)}
        end={<button type="button" aria-label={show ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"} aria-pressed={show} onClick={() => { setShow(!show); pwRef.current?.focus(); }} className="btn-icon w-10 h-10 rounded-xl text-steel hover:text-ink hover:bg-white"><Icon n={show ? "eyeOff" : "eye"} s={20} /></button>}
        hint={caps && <small className="flex items-center gap-1 text-xs font-bold text-accent"><Icon n="alert" s={13} />الأحرف الكبيرة (Caps Lock) مفعّلة</small>} />
      {err && <p role="alert" className="flex items-center gap-2 text-accent font-bold text-sm bg-accent/10 rounded-2xl p-3"><Icon n="alert" s={16} />{err}</p>}
      <button disabled={busy} className="btn btn-lg btn-lime w-full h-[3.25rem] rounded-2xl text-base mt-2">{busy ? <span className="w-5 h-5 rounded-full border-2 border-ink/30 border-t-ink animate-spin" /> : <>دخول<Icon n="chev" s={18} className="flip-rtl" /></>}</button>
    </form>
  </AuthShell>);
}
