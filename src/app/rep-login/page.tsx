// Copyright (c) 2026 Abdullah Al-Sakni. All rights reserved. DYLLU Catalog.
"use client";
import { useEffect, useRef, useState } from "react";
import Icon from "@/components/Icon";
import AuthShell, { AuthField } from "@/components/AuthShell";
import { post } from "@/lib/client";
import { toAsciiDigits } from "@/lib/phone";
export default function RepLogin() {
  const [f, setF] = useState({ phone: "", password: "" }),
    [err, setErr] = useState(""),
    [busy, setBusy] = useState(false),
    [show, setShow] = useState(false),
    [shake, setShake] = useState(0);
  const pwRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    try {
      const p = localStorage.getItem("dy-rep-phone");
      if (p) {
        setF((x) => ({ ...x, phone: p }));
        pwRef.current?.focus();
      }
    } catch {}
  }, []);
  async function go(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    if (!f.phone.trim() || !f.password) {
      setErr("اكتب رقم الجوال وكلمة المرور");
      setShake((n) => n + 1);
      return;
    }
    setErr("");
    setBusy(true);
    const r = await post("/api/rep/login", f);
    if (r.ok) {
      try {
        localStorage.setItem("dy-rep-phone", f.phone.trim());
      } catch {}
      return location.replace("/rep");
    }
    setBusy(false);
    setErr(r.data.error || "تعذر تسجيل الدخول");
    setShake((n) => n + 1);
    setF((x) => ({ ...x, password: "" }));
    pwRef.current?.focus();
  }
  return (
    <AuthShell role="rep" title="دخول المندوب" sub="ادخل برقم جوالك وكلمة المرور التي وصلتك من الإدارة">
      <form onSubmit={go} key={shake} className={`space-y-4 ${shake ? "animate-shake" : ""}`} noValidate>
        <AuthField
          label="رقم الجوال"
          icon="phone"
          inputMode="tel"
          autoComplete="username"
          autoFocus
          required
          placeholder="05XXXXXXXX"
          value={f.phone}
          onChange={(e) => setF({ ...f, phone: toAsciiDigits(e.target.value) })}
        />
        <AuthField
          label="كلمة المرور"
          icon="lock"
          inputRef={pwRef}
          type={show ? "text" : "password"}
          autoComplete="current-password"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          required
          placeholder="••••••••"
          value={f.password}
          onChange={(e) => setF({ ...f, password: e.target.value })}
          end={
            <button
              type="button"
              aria-label={show ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
              aria-pressed={show}
              onClick={() => {
                setShow(!show);
                pwRef.current?.focus();
              }}
              className="btn-icon w-10 h-10 rounded-xl text-steel hover:text-ink hover:bg-white"
            >
              <Icon n={show ? "eyeOff" : "eye"} s={20} />
            </button>
          }
        />
        {err && (
          <p role="alert" className="flex items-center gap-2 text-accent font-bold text-sm bg-accent/10 rounded-2xl p-3">
            <Icon n="alert" s={16} />
            {err}
          </p>
        )}
        <button disabled={busy} className="btn btn-lg btn-lime w-full h-[3.25rem] rounded-2xl text-base mt-2">
          {busy ? (
            <span className="w-5 h-5 rounded-full border-2 border-ink/30 border-t-ink animate-spin" />
          ) : (
            <>
              دخول
              <Icon n="chev" s={18} className="flip-rtl" />
            </>
          )}
        </button>
        <p className="text-xs text-steel text-center leading-5">نسيت كلمة المرور؟ تواصل مع الإدارة لإرسال كلمة مرور جديدة.</p>
      </form>
    </AuthShell>
  );
}
