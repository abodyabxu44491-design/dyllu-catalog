"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Icon from "./Icon";
import Modal from "./Modal";
import { useLang } from "@/lib/useLang";
// الشعار: ضغطة واحدة = الرئيسية. 3 ضغطات متتالية (كل واحدة خلال ~0.4 ثانية من السابقة) = نافذة كود الدخول.
// لا يوجد أي زر أو نص في الواجهة يدل على وجودها، فالجملة تبقى مخفية عن عامة العملاء.
export default function LogoTap({ children }: { children: React.ReactNode }) {
  const r = useRouter(), en = useLang() === "en", n = useRef(0), t = useRef<ReturnType<typeof setTimeout>>();
  const [open, setOpen] = useState(false), [code, setCode] = useState(""), [err, setErr] = useState(""), [busy, setBusy] = useState(false);
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
    <Modal open={open} onClose={() => setOpen(false)} icon="key" title={en ? "Access code" : "كود الدخول"} sub={en ? "Enter the code you received from DYLLU" : "أدخل الكود الذي وصلك من DYLLU"} closeLabel={en ? "Close" : "إغلاق"}>
      <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); if (code.length >= 4) go(); }}>
        <input autoFocus dir="ltr" maxLength={14} aria-label={en ? "Access code" : "كود الدخول"} autoComplete="off" autoCapitalize="characters" spellCheck={false} value={code} onChange={(e) => { setCode(e.target.value.toUpperCase()); setErr(""); }} placeholder="DY-XXXXXX"
          className={`field h-14 text-center text-xl tracking-[.25em] font-extrabold placeholder:tracking-[.2em] placeholder:font-bold ${err ? "border-accent ring-4 ring-accent/15" : ""}`} />
        {err && <p role="alert" className="flex items-center gap-1.5 text-accent text-sm font-bold"><Icon n="alert" s={16} />{err}</p>}
        <button disabled={busy || code.length < 4} className="btn btn-lg btn-lime w-full">{busy ? <span className="w-5 h-5 rounded-full border-2 border-ink/30 border-t-ink animate-spin" /> : <><Icon n="check" s={18} stroke={2.6} />{en ? "Enter" : "دخول"}</>}</button>
      </form>
    </Modal>
  </>);
}
