"use client";
import { useState } from "react";
import Icon from "@/components/Icon";
import { post } from "@/lib/client";
import { toast } from "@/store/toast";
// تغيير كلمة مرور المندوب + تسجيل الخروج
export function RepPassword() {
  const [f, setF] = useState({ current: "", next: "" }), [err, setErr] = useState(""), [busy, setBusy] = useState(false);
  async function go(e: React.FormEvent) { e.preventDefault(); setErr(""); setBusy(true); const x = await post("/api/rep/password", f); setBusy(false); if (x.ok) { setF({ current: "", next: "" }); toast("تم تغيير كلمة المرور"); } else setErr(x.data.error || "تعذر الحفظ"); }
  const inp = "field"; return (<form onSubmit={go} className="space-y-3 max-w-sm">
    <label className="block space-y-1.5"><span className="block text-sm font-bold">كلمة المرور الحالية</span><input className={inp} type="password" dir="ltr" autoComplete="current-password" required value={f.current} onChange={(e) => setF({ ...f, current: e.target.value })} /></label>
    <label className="block space-y-1.5"><span className="block text-sm font-bold">كلمة المرور الجديدة</span><input className={inp} type="password" dir="ltr" autoComplete="new-password" minLength={6} required value={f.next} onChange={(e) => setF({ ...f, next: e.target.value })} /><small className="block text-xs text-steel">6 أحرف على الأقل</small></label>
    {err && <p role="alert" className="flex items-center gap-2 text-accent font-bold text-sm"><Icon n="alert" s={16} />{err}</p>}
    <button disabled={busy} className="btn btn-md btn-lime">{busy ? "..." : <><Icon n="check" s={18} />حفظ كلمة المرور</>}</button>
  </form>);
}
export function RepLogout() {
  return <button onClick={async () => { await post("/api/rep/logout", {}); window.location.href = "/rep-login"; }} className="btn btn-md btn-ghost text-accent"><Icon n="logout" s={18} />تسجيل الخروج</button>;
}
