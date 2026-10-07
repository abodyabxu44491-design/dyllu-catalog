"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Icon from "@/components/Icon";
import { post } from "@/lib/client";
import { toast } from "@/store/toast";
import { AEmpty, Badge, PageHead } from "./ui";
import Switch from "./Switch";
type C = { id: number; code: string; name: string; isActive: boolean; orders: number };
export default function CodesManager({ initial }: { initial: C[] }) {
  const r = useRouter(), [name, setName] = useState(""), [busy, setBusy] = useState(false);
  async function create() { if (!name.trim()) return toast("اكتب اسم العميل", { tone: "err" }); setBusy(true); const x = await post("/api/admin/codes", { name }); setBusy(false); if (x.ok) { setName(""); toast(`تم إنشاء الكود ${x.data.code}`); r.refresh(); } else toast(x.data.error, { tone: "err" }); }
  async function toggle(c: C, v: boolean) { const x = await post("/api/admin/codes", { id: c.id, isActive: v }, "PUT"); if (x.ok) { toast(v ? "تم تفعيل الكود" : "تم إيقاف الكود"); r.refresh(); } else toast("تعذر الحفظ", { tone: "err" }); }
  async function remove(c: C) { if (!confirm(`حذف كود ${c.name}؟`)) return; const x = await fetch(`/api/admin/codes?id=${c.id}`, { method: "DELETE" }); if (x.ok) { toast("تم حذف الكود"); r.refresh(); } else toast((await x.json()).error, { tone: "err" }); }
  const copy = (c: C) => { navigator.clipboard?.writeText(c.code); toast(`تم نسخ ${c.code}`); };
  return (<div className="max-w-4xl space-y-4">
    <PageHead title="أكواد الجملة" desc="أنشئ كودًا لكل عميل جملة. عند إدخاله تتحول الأسعار لأسعار الجملة. أوقف الكود في أي وقت ويفقد العميل الأسعار فورًا." />
    <div className="rounded-2xl bg-ink text-white p-4 md:p-5 flex gap-4 items-start"><span className="w-11 h-11 rounded-xl bg-lime text-ink grid place-items-center shrink-0"><Icon n="info" s={22} /></span>
      <div className="text-sm leading-7"><b className="text-lime">كيف يدخل العميل الكود؟</b><p className="text-white/80">يضغط على شعار DYLLU أعلى المتجر <b className="text-white">3 ضغطات متتالية بسرعة</b>، فتظهر نافذة الكود. لا يوجد رابط أو زر ظاهر لبقية العملاء.</p></div></div>
    <form onSubmit={(e) => { e.preventDefault(); create(); }} className="card p-3 flex flex-col sm:flex-row gap-2"><input className="field flex-1" placeholder="اسم العميل أو الشركة" value={name} onChange={(e) => setName(e.target.value)} /><button disabled={busy} className="btn btn-lg btn-lime"><Icon n="plus" s={18} />{busy ? "..." : "إنشاء كود"}</button></form>
    <div className="card overflow-hidden divide-y divide-line">{initial.map((c) => (<div key={c.id} className={`flex flex-wrap items-center gap-3 p-3 ${c.isActive ? "" : "bg-soft/50"}`}>
      <span className={`w-10 h-10 rounded-xl grid place-items-center shrink-0 ${c.isActive ? "bg-lime text-ink" : "bg-soft text-steel"}`}><Icon n="key" s={18} /></span>
      <div className="flex-1 min-w-[140px]"><b className="block text-sm">{c.name}</b><small className="text-xs text-steel">{c.orders} طلب</small>{!c.isActive && <Badge cls="bg-soft text-steel ms-2">موقوف</Badge>}</div>
      <button onClick={() => copy(c)} title="نسخ" className="inline-flex items-center gap-2 bg-soft hover:bg-line rounded-xl px-3 h-10 font-extrabold tracking-widest text-sm" dir="ltr"><Icon n="copy" s={16} className="text-steel" />{c.code}</button>
      <Switch on={c.isActive} onChange={(v) => toggle(c, v)} label={undefined} />
      <button onClick={() => remove(c)} aria-label="حذف" className="btn-icon w-10 h-10 text-steel hover:text-accent hover:bg-accent/5"><Icon n="trash" s={18} /></button></div>))}
      {initial.length === 0 && <AEmpty icon="key" title="لا توجد أكواد بعد" />}</div>
  </div>);
}
