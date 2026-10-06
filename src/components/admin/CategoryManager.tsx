"use client";
import { useState } from "react";
import { post, uploadFile } from "@/lib/client";
type C = { id?: number; slug?: string; nameAr: string; nameEn: string; subtitleAr?: string | null; subtitleEn?: string | null; descriptionAr?: string | null; sortOrder: number; isActive: boolean; image?: string | null; count?: number };
const blank: C = { nameAr: "", nameEn: "", subtitleAr: "", subtitleEn: "", descriptionAr: "", sortOrder: 0, isActive: true };
const i = "border rounded-xl p-2 bg-white w-full";
function Row({ c }: { c: C }) {
  const [v, setV] = useState(c), [msg, setMsg] = useState(""), set = (k: keyof C, x: unknown) => setV((o) => ({ ...o, [k]: x }));
  async function save() { const r = await post("/api/admin/categories", { ...v, count: undefined, sortOrder: Number(v.sortOrder) || 0 }); r.ok ? window.location.reload() : setMsg(typeof r.data.error === "string" && !r.data.error.includes("[") ? r.data.error : "اكتب اسم التصنيف بالعربي والإنجليزي"); }
  async function del() { if (!confirm("حذف التصنيف؟")) return; const r = await fetch(`/api/admin/categories?id=${v.id}`, { method: "DELETE" }); r.ok ? window.location.reload() : setMsg((await r.json()).error); }
  return (<div className="bg-white rounded-2xl p-3 grid md:grid-cols-[200px_1fr] gap-3">
    <div>{/* معاينة حية لبطاقة التصنيف كما تظهر للعميل */}
      <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-soft border">{v.image ? <img src={v.image} alt="" className="absolute inset-0 w-full h-full object-cover" /> : <span className="absolute inset-0 grid place-items-center text-sm text-steel">بدون صورة</span>}
        <span className="absolute inset-x-0 bottom-0 p-3 pt-8 bg-gradient-to-t from-ink/90 via-ink/50 to-transparent text-white"><b className="block leading-tight">{v.nameAr || "اسم التصنيف"}</b>{v.subtitleAr && <span className="block text-xs text-white/80">{v.subtitleAr}</span>}<small className="text-lime font-bold">{v.count ?? 0} منتج</small></span></div>
      <input className="mt-2 text-xs w-full" type="file" accept="image/jpeg,image/png,image/webp" onChange={async (e) => { const f = e.target.files?.[0]; if (f) try { set("image", await uploadFile(f)); } catch (x) { setMsg((x as Error).message); } }} />{v.image && <button className="text-accent text-xs" onClick={() => set("image", null)}>إزالة الصورة</button>}</div>
    <div className="grid grid-cols-2 gap-2 content-start"><input className={i} placeholder="اسم التصنيف (عربي) *" value={v.nameAr} onChange={(e) => set("nameAr", e.target.value)} /><input className={i} dir="ltr" placeholder="Name (English) *" value={v.nameEn} onChange={(e) => set("nameEn", e.target.value)} />
      <input className={i} placeholder="عنوان صغير (اختياري)" value={v.subtitleAr ?? ""} onChange={(e) => set("subtitleAr", e.target.value)} /><input className={i} dir="ltr" placeholder="Small subtitle (optional)" value={v.subtitleEn ?? ""} onChange={(e) => set("subtitleEn", e.target.value)} />
      <textarea rows={2} className={`${i} col-span-2`} placeholder="وصف يظهر أعلى صفحة التصنيف (اختياري)" value={v.descriptionAr ?? ""} onChange={(e) => set("descriptionAr", e.target.value)} />
      <input className={i} type="number" placeholder="الترتيب" value={v.sortOrder} onChange={(e) => set("sortOrder", +e.target.value)} /><label className="flex gap-2 items-center"><input type="checkbox" checked={v.isActive} onChange={(e) => set("isActive", e.target.checked)} />ظاهر للعملاء</label>
      <div className="col-span-2 flex gap-2 justify-end"><button onClick={save} className="bg-lime font-extrabold rounded-xl px-5 py-1.5">{v.id ? "حفظ" : "إضافة التصنيف"}</button>{v.id && <button onClick={del} className="text-accent font-bold">حذف</button>}</div>{msg && <p className="text-accent col-span-2">{msg}</p>}</div></div>);
}
export default function CategoryManager({ initial }: { initial: C[] }) {
  return <div className="space-y-3 max-w-3xl"><h1 className="text-xl font-extrabold">التصنيفات</h1><p className="text-sm text-steel">كل تصنيف يظهر للعميل كبطاقة بصورة واسم وعنوان صغير (اختياري). الضغط عليه يفتح كل المنتجات داخله.</p><h2 className="font-bold">إضافة تصنيف</h2><Row c={blank} /><h2 className="font-bold">التصنيفات الحالية ({initial.length})</h2>{initial.map((c) => <Row key={c.id} c={c} />)}</div>;
}
