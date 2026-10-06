"use client";
import { useState } from "react";
import { post } from "@/lib/client";
export default function Login() {
  const [f, setF] = useState({ email: "", password: "" }), [err, setErr] = useState(""), [busy, setBusy] = useState(false);
  async function go() { setErr(""); setBusy(true); const r = await post("/api/admin/login", f); setBusy(false); r.ok ? (window.location.href = "/admin") : setErr(r.data.error || "تعذر تسجيل الدخول"); }
  const i = "w-full h-12 border rounded-xl px-3 bg-soft text-base outline-none focus:border-steel";
  return (<main dir="rtl" className="min-h-screen bg-ink flex items-center p-6"><div className="bg-white rounded-3xl p-6 w-full max-w-sm mx-auto space-y-3 overflow-hidden relative">
    <i className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-lime via-accent to-steel" />
    <img src="/brand/logo-wordmark.png" alt="DYLLU" className="h-10 w-auto mx-auto mt-2" />
    <h1 className="relative flex items-center justify-center bg-lime text-ink rounded-full ps-7 pe-4 py-1.5 text-[15px] w-fit mx-auto font-display"><i className="absolute start-2.5 w-2.5 h-2.5 bg-accent rotate-45" />لوحة التحكم</h1>
    <input className={i} type="email" dir="ltr" autoComplete="username" placeholder="البريد" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
    <input className={i} type="password" dir="ltr" autoComplete="current-password" placeholder="كلمة المرور" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} onKeyDown={(e) => e.key === "Enter" && go()} />
    {err && <p className="text-accent font-bold text-sm">{err}</p>}
    <button onClick={go} disabled={busy} className="w-full h-12 bg-lime text-ink font-extrabold rounded-xl disabled:opacity-60">{busy ? "..." : "دخول"}</button></div></main>);
}
