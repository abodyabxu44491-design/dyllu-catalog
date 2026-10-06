"use client";
import { useState } from "react";
import { post } from "@/lib/client";
type C = { id: number; code: string; name: string; isActive: boolean; orders: number };
export default function CodesManager({ initial }: { initial: C[] }) {
  const [name, setName] = useState(""), [err, setErr] = useState(""), [copied, setCopied] = useState<number | null>(null);
  const reload = () => window.location.reload();
  async function create() { const r = await post("/api/admin/codes", { name }); r.ok ? reload() : setErr(r.data.error); }
  async function toggle(c: C) { await post("/api/admin/codes", { id: c.id, isActive: !c.isActive }, "PUT"); reload(); }
  async function remove(c: C) { if (!confirm("حذف الكود؟")) return; const r = await fetch(`/api/admin/codes?id=${c.id}`, { method: "DELETE" }); r.ok ? reload() : setErr((await r.json()).error); }
  return (<div className="space-y-4 max-w-3xl"><h1 className="text-xl font-extrabold">أكواد الجملة</h1>
    <div className="bg-ink text-white rounded-2xl p-4 text-sm space-y-1"><b className="text-lime">طريقة الاستخدام</b><p>أنشئ كودًا لكل عميل جملة وأعطه الكود. العميل يضغط على شعار DYLLU <b>3 ضغطات متتالية بسرعة</b> فتظهر نافذة الكود، يكتبه، فتتحول الأسعار لأسعار الجملة. لا يوجد رابط ولا زر ظاهر في الواجهة.</p><p className="text-white/70">أوقف الكود في أي وقت وسيفقد العميل أسعار الجملة فورًا.</p></div>
    <div className="bg-white rounded-2xl p-4 flex gap-2"><input className="border rounded-xl p-2.5 flex-1 bg-white" placeholder="اسم العميل / الشركة" value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && create()} /><button onClick={create} className="bg-lime font-extrabold rounded-xl px-5">إنشاء كود</button></div>
    {err && <p className="text-accent font-bold">{err}</p>}
    <div className="space-y-2">{initial.map((c) => (<div key={c.id} className={`bg-white rounded-2xl p-3 flex items-center gap-3 flex-wrap ${c.isActive ? "" : "opacity-60"}`}>
      <div className="flex-1 min-w-[160px]"><b>{c.name}</b><div className="text-xs text-steel">{c.orders} طلب</div></div>
      <code dir="ltr" className="bg-soft rounded-lg px-3 py-1.5 font-extrabold tracking-widest">{c.code}</code>
      <button className="border rounded-xl px-3 py-1.5 text-sm font-bold" onClick={() => { navigator.clipboard?.writeText(c.code); setCopied(c.id); setTimeout(() => setCopied(null), 1200); }}>{copied === c.id ? "تم النسخ ✓" : "نسخ"}</button>
      <button className="border rounded-xl px-3 py-1.5 text-sm font-bold" onClick={() => toggle(c)}>{c.isActive ? "إيقاف" : "تفعيل"}</button><button className="text-accent text-sm font-bold" onClick={() => remove(c)}>حذف</button></div>))}
      {initial.length === 0 && <p className="text-steel text-center p-6">لا توجد أكواد بعد.</p>}</div></div>);
}
