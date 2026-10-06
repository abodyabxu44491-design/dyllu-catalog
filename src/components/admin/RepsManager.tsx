"use client";
import { useState } from "react";
import { post, uploadFile } from "@/lib/client";
type R = { id?: number; name: string; location: string; phone: string; photo?: string | null; sortOrder: number; isActive: boolean; orders?: number };
const blank: R = { name: "", location: "", phone: "", photo: null, sortOrder: 0, isActive: true };
function Row({ r }: { r: R }) {
  const [v, setV] = useState(r), [msg, setMsg] = useState("");
  const i = "border rounded-xl p-2 bg-white w-full";
  async function save() { const x = await post("/api/admin/reps", { ...v, orders: undefined, sortOrder: Number(v.sortOrder) || 0 }); x.ok ? window.location.reload() : setMsg("تحقق من الاسم والموقع ورقم الجوال"); }
  async function del() { if (!confirm("حذف المندوب؟")) return; const x = await fetch(`/api/admin/reps?id=${v.id}`, { method: "DELETE" }); x.ok ? window.location.reload() : setMsg((await x.json()).error); }
  return (<div className="bg-white rounded-2xl p-3 grid grid-cols-2 gap-2">
    <div className="col-span-2 flex items-center gap-3"><span className="w-16 h-16 rounded-full bg-ink text-lime grid place-items-center font-extrabold text-2xl overflow-hidden shrink-0">{v.photo ? <img src={v.photo} alt="" className="w-full h-full object-cover" /> : (v.name[0] ?? "؟")}</span>
      <div className="flex-1 text-sm"><div className="mb-1">صورة المندوب</div><input type="file" accept="image/jpeg,image/png,image/webp" onChange={async (e) => { const f = e.target.files?.[0]; if (f) try { setV({ ...v, photo: await uploadFile(f) }); } catch (x) { setMsg((x as Error).message); } }} />{v.photo && <button className="text-accent ms-2" onClick={() => setV({ ...v, photo: null })}>إزالة</button>}</div></div>
    <input className={i} placeholder="اسم المندوب" value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} /><input className={i} placeholder="الموقع (المدينة - الحي)" value={v.location} onChange={(e) => setV({ ...v, location: e.target.value })} />
    <input className={i} dir="ltr" inputMode="tel" placeholder="واتساب 9665XXXXXXXX" value={v.phone} onChange={(e) => setV({ ...v, phone: e.target.value })} /><input className={i} type="number" placeholder="الترتيب" value={v.sortOrder} onChange={(e) => setV({ ...v, sortOrder: +e.target.value })} />
    <label className="flex gap-2 items-center"><input type="checkbox" checked={v.isActive} onChange={(e) => setV({ ...v, isActive: e.target.checked })} />يظهر للعملاء{v.id != null && <small className="text-steel"> · {v.orders ?? 0} طلب</small>}</label>
    <div className="flex gap-2 justify-end"><button onClick={save} className="bg-lime font-extrabold rounded-xl px-5 py-1.5">حفظ</button>{v.id && <button onClick={del} className="text-accent font-bold">حذف</button>}</div>{msg && <p className="text-accent col-span-2">{msg}</p>}</div>);
}
export default function RepsManager({ initial }: { initial: R[] }) {
  return <div className="space-y-3 max-w-3xl"><h1 className="text-xl font-extrabold">المناديب</h1><p className="text-sm text-steel">عند إتمام الطلب يختار العميل مندوبًا من هذه القائمة، ويُرسل الطلب إلى واتساب المندوب. إن لم يوجد مندوب فعّال يُستخدم الرقم العام من الإعدادات.</p><h2 className="font-bold">إضافة مندوب</h2><Row r={blank} /><h2 className="font-bold">المناديب ({initial.length})</h2>{initial.map((r) => <Row key={r.id} r={r} />)}</div>;
}
