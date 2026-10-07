"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Icon from "@/components/Icon";
import { post, uploadFile } from "@/lib/client";
import { toast } from "@/store/toast";
import { AEmpty, Badge, Field, PageHead } from "./ui";
import Switch from "./Switch";
type C = { id?: number; slug?: string; nameAr: string; nameEn: string; subtitleAr?: string | null; subtitleEn?: string | null; descriptionAr?: string | null; sortOrder: number; isActive: boolean; image?: string | null; count?: number };
const blank: C = { nameAr: "", nameEn: "", subtitleAr: "", subtitleEn: "", descriptionAr: "", sortOrder: 0, isActive: true };
function Editor({ c, onDone }: { c: C; onDone: () => void }) {
  const r = useRouter(), [v, setV] = useState(c), [msg, setMsg] = useState(""), [busy, setBusy] = useState(false), set = (k: keyof C, x: unknown) => setV((o) => ({ ...o, [k]: x }));
  async function save() { setBusy(true); const x = await post("/api/admin/categories", { ...v, count: undefined, sortOrder: Number(v.sortOrder) || 0 }); setBusy(false); if (x.ok) { toast(v.id ? "تم حفظ التصنيف" : "تمت إضافة التصنيف"); onDone(); r.refresh(); } else setMsg(typeof x.data.error === "string" && !x.data.error.includes("[") ? x.data.error : "اكتب اسم التصنيف بالعربي والإنجليزي"); }
  async function del() { if (!confirm("حذف التصنيف؟")) return; const x = await fetch(`/api/admin/categories?id=${v.id}`, { method: "DELETE" }); if (x.ok) { toast("تم حذف التصنيف"); r.refresh(); } else setMsg((await x.json()).error); }
  return (<div className="grid md:grid-cols-[240px_1fr] gap-4 p-4 border-t border-line bg-soft/40">
    <div className="space-y-2">{/* معاينة حية لبطاقة التصنيف كما تظهر للعميل */}
      <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-steel">{v.image ? <img src={v.image} alt="" className="absolute inset-0 w-full h-full object-cover" /> : <span className="absolute inset-0 grid place-items-center text-white/50"><Icon n="image" s={36} stroke={1.4} /></span>}
        <span className="absolute inset-x-0 bottom-0 p-3 pt-8 bg-gradient-to-t from-ink/90 to-transparent text-white"><b className="block leading-tight">{v.nameAr || "اسم التصنيف"}</b>{v.subtitleAr && <span className="block text-xs text-white/80">{v.subtitleAr}</span>}<small className="inline-block mt-1 bg-lime text-ink text-[10px] font-extrabold rounded px-1.5">{v.count ?? 0} منتج</small></span></div>
      <div className="flex gap-2"><label className="btn btn-sm btn-ghost flex-1 cursor-pointer"><input type="file" hidden accept="image/jpeg,image/png,image/webp" onChange={async (e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) try { set("image", await uploadFile(f)); } catch (x) { setMsg((x as Error).message); } }} /><Icon n="upload" s={16} />{v.image ? "تغيير الصورة" : "رفع صورة"}</label>
        {v.image && <button className="btn btn-sm btn-danger" onClick={() => set("image", null)} aria-label="إزالة الصورة"><Icon n="trash" s={16} /></button>}</div></div>
    <div className="space-y-3">
      <div className="grid sm:grid-cols-2 gap-3"><Field label="اسم التصنيف (عربي) *"><input className="field" value={v.nameAr} onChange={(e) => set("nameAr", e.target.value)} /></Field><Field label="Name (English) *"><input className="field" dir="ltr" value={v.nameEn} onChange={(e) => set("nameEn", e.target.value)} /></Field>
        <Field label="عنوان صغير (اختياري)"><input className="field" value={v.subtitleAr ?? ""} onChange={(e) => set("subtitleAr", e.target.value)} /></Field><Field label="Subtitle (optional)"><input className="field" dir="ltr" value={v.subtitleEn ?? ""} onChange={(e) => set("subtitleEn", e.target.value)} /></Field></div>
      <Field label="وصف أعلى صفحة التصنيف (اختياري)"><textarea rows={2} className="field" value={v.descriptionAr ?? ""} onChange={(e) => set("descriptionAr", e.target.value)} /></Field>
      <div className="grid grid-cols-2 gap-3 items-end"><Field label="الترتيب" hint="الأصغر يظهر أولًا"><input className="field" type="number" dir="ltr" value={v.sortOrder} onChange={(e) => set("sortOrder", +e.target.value)} /></Field><div className="pb-6"><Switch label="ظاهر للعملاء" on={v.isActive} onChange={(x) => set("isActive", x)} /></div></div>
      {msg && <p className="text-accent text-sm font-bold flex items-center gap-2"><Icon n="alert" s={16} />{msg}</p>}
      <div className="flex flex-wrap gap-2"><button disabled={busy} onClick={save} className="btn btn-md btn-lime">{busy ? "..." : <><Icon n="check" s={18} />{v.id ? "حفظ" : "إضافة التصنيف"}</>}</button><button onClick={onDone} className="btn btn-md btn-ghost">إلغاء</button>
        {v.id && <button onClick={del} className="btn btn-md btn-danger ms-auto"><Icon n="trash" s={18} />حذف</button>}</div>
    </div></div>);
}
export default function CategoryManager({ initial }: { initial: C[] }) {
  const [open, setOpen] = useState<number | "new" | null>(initial.length ? null : "new");
  return (<div className="max-w-4xl">
    <PageHead title="التصنيفات" desc="كل تصنيف يظهر للعميل كبطاقة بصورة واسم. الضغط عليه يفتح كل المنتجات داخله."><button onClick={() => setOpen(open === "new" ? null : "new")} className="btn btn-md btn-lime"><Icon n="plus" s={18} />تصنيف جديد</button></PageHead>
    {open === "new" && <div className="card overflow-hidden mb-3"><b className="block px-4 pt-4">تصنيف جديد</b><Editor c={blank} onDone={() => setOpen(null)} /></div>}
    <div className="card overflow-hidden divide-y divide-line">{initial.map((c) => (<div key={c.id}>
      <button onClick={() => setOpen(open === c.id ? null : c.id!)} aria-expanded={open === c.id} className="w-full flex items-center gap-3 p-3 text-start hover:bg-soft/60">
        <span className="w-16 h-12 rounded-xl bg-steel overflow-hidden shrink-0">{c.image && <img src={c.image} alt="" className="w-full h-full object-cover" />}</span>
        <span className="flex-1 min-w-0"><b className="block text-sm">{c.nameAr} <span className="font-normal text-steel" dir="ltr">· {c.nameEn}</span></b><small className="text-xs text-steel">{c.count} منتج · ترتيب {c.sortOrder}</small></span>
        {!c.isActive && <Badge>مخفي</Badge>}<Icon n="chevDown" s={18} className={`text-steel transition-transform ${open === c.id ? "rotate-180" : ""}`} /></button>
      {open === c.id && <Editor c={c} onDone={() => setOpen(null)} />}</div>))}
      {initial.length === 0 && open !== "new" && <AEmpty icon="grid" title="لا توجد تصنيفات بعد" />}</div>
  </div>);
}
