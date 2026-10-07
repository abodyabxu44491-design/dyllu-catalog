"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Icon from "./Icon";
import Portal from "./Portal";
import { useLang } from "@/lib/useLang";
// الشعار: ضغطة واحدة = الرئيسية. 3 ضغطات متتالية (كل واحدة خلال ~0.4 ثانية من السابقة) = نافذة كود الدخول.
// لا يوجد أي زر أو نص في الواجهة يدل على وجودها، فالجملة تبقى مخفية عن عامة العملاء.
export default function LogoTap({ children }: { children: React.ReactNode }) {
  const r = useRouter(), en = useLang() === "en", n = useRef(0), t = useRef<ReturnType<typeof setTimeout>>();
  const [open, setOpen] = useState(false), [code, setCode] = useState(""), [err, setErr] = useState(""), [busy, setBusy] = useState(false);
  useEffect(() => { if (!open) return; const f = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false); addEventListener("keydown", f); return () => removeEventListener("keydown", f); }, [open]);
  function tap(e: React.MouseEvent) {
    e.preventDefault(); n.current++; clearTimeout(t.current);
    if (n.current >= 3) { n.current = 0; setCode(""); setErr(""); setOpen(true); return; }
    t.current = setTimeout(() => { n.current = 0; r.push("/"); }, 400);
  }
  async function go() {
    setBusy(true); setErr("");
    try {
      const res = await fetch("/api/ws", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code }) });
      if (!res.ok) return setErr((await res.json().catch(() => ({}))).error ?? (en ? "Invalid code" : "الكود غير صحيح"));
      setOpen(false); r.refresh();
    } catch { setErr(en ? "Connection problem" : "تعذر الاتصال"); } finally { setBusy(false); }
  }
  return (<>
    <a href="/" onClick={tap} aria-label="DYLLU" className="shrink-0" style={{ touchAction: "manipulation", WebkitUserSelect: "none", userSelect: "none" }}>{children}</a>
    <Portal>{open && <div className="fixed inset-0 z-[90] bg-ink/60 backdrop-blur-sm grid place-items-center p-6" onClick={() => setOpen(false)}>
      <div role="dialog" aria-modal="true" className="animate-rise bg-white rounded-3xl w-full max-w-xs overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="dy-stripe" /><div className="p-5 space-y-3">
          <b className="flex items-center gap-2 text-lg"><Icon n="key" s={20} className="text-accent" />{en ? "Access code" : "كود الدخول"}</b>
          <input autoFocus dir="ltr" maxLength={14} value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} onKeyDown={(e) => e.key === "Enter" && code.length >= 4 && go()} placeholder="DY-XXXXXX" className="field text-center text-lg tracking-widest font-bold" />
          {err && <p className="text-accent text-sm font-bold">{err}</p>}
          <button disabled={busy || code.length < 4} onClick={go} className="btn btn-lg btn-lime w-full">{busy ? "..." : en ? "Enter" : "دخول"}</button>
        </div></div></div>}</Portal>
  </>);
}
