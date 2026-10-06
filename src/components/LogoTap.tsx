"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
// الشعار: ضغطة واحدة = الرئيسية. 3 ضغطات متتالية (كل واحدة خلال ~0.4 ثانية من السابقة) = نافذة كود الدخول.
// لا يوجد أي زر أو نص في الواجهة يدل على وجودها، فالجملة تبقى مخفية عن عامة العملاء.
export default function LogoTap({ children }: { children: React.ReactNode }) {
  const r = useRouter(), n = useRef(0), t = useRef<ReturnType<typeof setTimeout>>();
  const [open, setOpen] = useState(false), [code, setCode] = useState(""), [err, setErr] = useState(""), [busy, setBusy] = useState(false);
  function tap(e: React.MouseEvent) {
    e.preventDefault(); n.current++; clearTimeout(t.current);
    if (n.current >= 3) { n.current = 0; setCode(""); setErr(""); setOpen(true); return; }
    t.current = setTimeout(() => { n.current = 0; r.push("/"); }, 400);
  }
  async function go() {
    setBusy(true); setErr("");
    const res = await fetch("/api/ws", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code }) });
    setBusy(false);
    if (!res.ok) return setErr((await res.json()).error ?? "الكود غير صحيح");
    setOpen(false); r.refresh();
  }
  return (<>
    <a href="/" onClick={tap} style={{ touchAction: "manipulation", WebkitUserSelect: "none", userSelect: "none" }}>{children}</a>
    {open && <div className="fixed inset-0 z-[60] bg-ink/60 grid place-items-center p-6" onClick={() => setOpen(false)}>
      <div className="bg-white rounded-3xl p-5 w-full max-w-xs space-y-3" onClick={(e) => e.stopPropagation()}>
        <b className="block text-lg">كود الدخول</b>
        <input autoFocus dir="ltr" maxLength={14} value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} onKeyDown={(e) => e.key === "Enter" && go()} placeholder="DY-XXXXXX" className="w-full border rounded-xl p-3 text-center text-lg tracking-widest bg-soft" />
        {err && <p className="text-accent text-sm font-bold">{err}</p>}
        <button disabled={busy || code.length < 4} onClick={go} className="w-full bg-lime text-ink font-extrabold rounded-xl p-3 disabled:opacity-50">{busy ? "..." : "دخول"}</button>
      </div></div>}
  </>);
}
