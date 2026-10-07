"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Icon from "@/components/Icon";
import { post, uploadFile } from "@/lib/client";
import { toast } from "@/store/toast";
import { normalizePhone } from "@/lib/whatsapp";
import { AEmpty, Badge, Field, PageHead } from "./ui";
import Switch from "./Switch";
type R = { id?: number; name: string; location: string; phone: string; photo?: string | null; sortOrder: number; isActive: boolean; orders?: number };
const blank: R = { name: "", location: "", phone: "", photo: null, sortOrder: 0, isActive: true };
const Avatar = ({ r, s = "w-12 h-12 text-lg" }: { r: R; s?: string }) => <span className={`${s} rounded-full bg-ink text-lime grid place-items-center font-extrabold overflow-hidden shrink-0`}>{r.photo ? <img src={r.photo} alt="" className="w-full h-full object-cover" /> : (r.name[0] ?? "؟")}</span>;
function Editor({ r0, onDone }: { r0: R; onDone: () => void }) {
  const r = useRouter(), [v, setV] = useState(r0), [msg, setMsg] = useState(""), [busy, setBusy] = useState(false);
  async function save() { setBusy(true); const x = await post("/api/admin/reps", { ...v, orders: undefined, sortOrder: Number(v.sortOrder) || 0 }); setBusy(false); if (x.ok) { toast(v.id ? "تم حفظ المندوب" : "تمت إضافة المندوب"); onDone(); r.refresh(); } else setMsg("تحقق من الاسم والموقع ورقم الجوال"); }
  async function del() { if (!confirm("حذف المندوب؟")) return; const x = await fetch(`/api/admin/reps?id=${v.id}`, { method: "DELETE" }); if (x.ok) { toast("تم حذف المندوب"); r.refresh(); } else setMsg((await x.json()).error); }
  return (<div className="p-4 border-t border-line bg-soft/40 space-y-3">
    <div className="flex items-center gap-3"><Avatar r={v} s="w-16 h-16 text-2xl" /><label className="btn btn-sm btn-ghost cursor-pointer"><input type="file" hidden accept="image/jpeg,image/png,image/webp" onChange={async (e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) try { setV({ ...v, photo: await uploadFile(f) }); } catch (x) { setMsg((x as Error).message); } }} /><Icon n="upload" s={16} />{v.photo ? "تغيير الصورة" : "رفع صورة"}</label>{v.photo && <button className="text-accent text-sm font-bold" onClick={() => setV({ ...v, photo: null })}>إزالة</button>}</div>
    <div className="grid sm:grid-cols-2 gap-3"><Field label="اسم المندوب *"><input className="field" value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} /></Field><Field label="الموقع *" hint="المدينة - الحي"><input className="field" value={v.location} onChange={(e) => setV({ ...v, location: e.target.value })} /></Field>
      <Field label="رقم واتساب *" hint="مثال: 9665XXXXXXXX أو 05XXXXXXXX"><input className="field" dir="ltr" inputMode="tel" value={v.phone} onChange={(e) => setV({ ...v, phone: e.target.value })} /></Field><Field label="الترتيب"><input className="field" type="number" dir="ltr" value={v.sortOrder} onChange={(e) => setV({ ...v, sortOrder: +e.target.value })} /></Field></div>
    <div className="max-w-xs"><Switch label="يظهر للعملاء" on={v.isActive} onChange={(x) => setV({ ...v, isActive: x })} /></div>
    {msg && <p className="text-accent text-sm font-bold flex items-center gap-2"><Icon n="alert" s={16} />{msg}</p>}
    <div className="flex flex-wrap gap-2"><button disabled={busy} onClick={save} className="btn btn-md btn-lime">{busy ? "..." : <><Icon n="check" s={18} />{v.id ? "حفظ" : "إضافة المندوب"}</>}</button><button onClick={onDone} className="btn btn-md btn-ghost">إلغاء</button>{v.id && <button onClick={del} className="btn btn-md btn-danger ms-auto"><Icon n="trash" s={18} />حذف</button>}</div>
  </div>);
}
export default function RepsManager({ initial }: { initial: R[] }) {
  const [open, setOpen] = useState<number | "new" | null>(initial.length ? null : "new");
  return (<div className="max-w-4xl">
    <PageHead title="المناديب" desc="عند إتمام الطلب يختار العميل مندوبًا ويُرسل الطلب إلى واتساب المندوب. إن لم يوجد مندوب فعّال يُستخدم الرقم العام من الإعدادات."><button onClick={() => setOpen(open === "new" ? null : "new")} className="btn btn-md btn-lime"><Icon n="plus" s={18} />مندوب جديد</button></PageHead>
    {open === "new" && <div className="card overflow-hidden mb-3"><b className="block px-4 pt-4">مندوب جديد</b><Editor r0={blank} onDone={() => setOpen(null)} /></div>}
    <div className="card overflow-hidden divide-y divide-line">{initial.map((x) => (<div key={x.id}>
      <div className="flex items-center gap-3 p-3"><button onClick={() => setOpen(open === x.id ? null : x.id!)} aria-expanded={open === x.id} className="flex items-center gap-3 flex-1 min-w-0 text-start">
        <Avatar r={x} /><span className="min-w-0 flex-1"><b className="block text-sm">{x.name}</b><small className="text-xs text-steel inline-flex items-center gap-1"><Icon n="pin" s={12} />{x.location} · {x.orders ?? 0} طلب</small></span>
        {!x.isActive && <Badge>موقوف</Badge>}</button>
        <a href={`https://wa.me/${normalizePhone(x.phone)}`} target="_blank" rel="noopener noreferrer" aria-label="واتساب" className="btn-icon w-10 h-10 text-[#1FA855] hover:bg-soft"><Icon n="whatsapp" s={20} /></a>
        <button onClick={() => setOpen(open === x.id ? null : x.id!)} aria-label="تعديل" className="btn-icon w-10 h-10 text-steel hover:bg-soft"><Icon n={open === x.id ? "chevDown" : "edit"} s={18} /></button></div>
      {open === x.id && <Editor r0={x} onDone={() => setOpen(null)} />}</div>))}
      {initial.length === 0 && open !== "new" && <AEmpty icon="users" title="لا يوجد مناديب بعد" />}</div>
  </div>);
}
