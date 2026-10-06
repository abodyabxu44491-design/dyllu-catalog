"use client";
import { useState } from "react";
import { post, uploadFile } from "@/lib/client";
type B = { id?: number; type: "IMAGE" | "IMAGE_TEXT"; image: string; titleAr?: string | null; titleEn?: string | null; subtitleAr?: string | null; subtitleEn?: string | null; buttonAr?: string | null; buttonEn?: string | null; linkUrl?: string | null; seconds: number; startsAt?: string | null; endsAt?: string | null; isActive: boolean };
type Cat = { slug: string; nameAr: string };
const blank: B = { type: "IMAGE_TEXT", image: "", titleAr: "", titleEn: "", subtitleAr: "", subtitleEn: "", buttonAr: "تسوّق الآن", buttonEn: "Shop now", linkUrl: "", seconds: 5, startsAt: "", endsAt: "", isActive: true };
// كل الحقول 16px (يمنع تكبير الجوال) وعرضها كامل بعمود واحد (يمنع العرض الزائد والاهتزاز أثناء التمرير)
const inp = "w-full min-w-0 border rounded-xl px-3 h-12 bg-white text-base";
const toLocal = (iso?: string | null) => { if (!iso) return ""; const d = new Date(iso); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 16); };
const status = (b: B): [string, string] => !b.isActive ? ["موقوف", "bg-ink/10 text-steel"] : b.startsAt && new Date(b.startsAt) > new Date() ? ["مجدول", "bg-ink text-white"] : b.endsAt && new Date(b.endsAt) < new Date() ? ["منتهي", "bg-accent text-white"] : ["ساري", "bg-lime text-ink"];
const Sec = ({ t, children }: { t: string; children: React.ReactNode }) => <section className="space-y-2"><h3 className="text-sm font-extrabold border-s-4 border-lime ps-2">{t}</h3>{children}</section>;
function Preview({ v }: { v: B }) {
  const txt = v.type === "IMAGE_TEXT" && (v.titleAr || v.subtitleAr || v.buttonAr);
  return (<div className="relative aspect-[16/9] rounded-2xl overflow-hidden bg-ink">{v.image ? <img src={v.image} alt="" className="absolute inset-0 w-full h-full object-cover" /> : <span className="absolute inset-0 grid place-items-center text-white/60 text-sm">لا توجد صورة</span>}
    {txt && <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/35 to-transparent flex flex-col justify-end p-3"><i className="block w-8 h-1 bg-lime rounded mb-1.5" /><b className="text-white leading-tight">{v.titleAr}</b><span className="text-white/85 text-xs line-clamp-2">{v.subtitleAr}</span>{v.buttonAr && v.linkUrl && <span className="mt-2 self-start bg-lime text-ink font-extrabold text-xs rounded-lg px-3 py-1">{v.buttonAr}</span>}</div>}</div>);
}
function Editor({ b0, cats }: { b0: B; cats: Cat[] }) {
  const [v, setV] = useState<B>({ ...b0, startsAt: toLocal(b0.startsAt), endsAt: toLocal(b0.endsAt) }), [msg, setMsg] = useState(""), [busy, setBusy] = useState(false);
  const set = (k: keyof B, x: unknown) => setV((o) => ({ ...o, [k]: x })), txt = v.type === "IMAGE_TEXT";
  async function save() {
    setMsg(""); setBusy(true);
    const r = await post("/api/admin/banners", { ...v, seconds: Number(v.seconds) || 5, startsAt: v.startsAt ? new Date(v.startsAt).toISOString() : null, endsAt: v.endsAt ? new Date(v.endsAt).toISOString() : null, linkUrl: v.linkUrl || null });
    setBusy(false); r.ok ? window.location.reload() : setMsg(r.data.error?.includes("[") ? "ارفع الصورة وتأكد من المدة والرابط" : r.data.error);
  }
  async function del() { if (confirm("حذف الإعلان؟")) { await fetch(`/api/admin/banners?id=${v.id}`, { method: "DELETE" }); window.location.reload(); } }
  const step = (d: number) => set("seconds", Math.max(2, Math.min(30, (Number(v.seconds) || 5) + d)));
  return (<div className="p-3 space-y-5 border-t">
    <Sec t="الصورة"><Preview v={v} /><label className="flex h-12 items-center justify-center rounded-xl border-2 border-dashed font-bold cursor-pointer bg-soft"><input type="file" hidden accept="image/jpeg,image/png,image/webp" onChange={async (e) => { const f = e.target.files?.[0]; if (f) try { set("image", await uploadFile(f)); } catch (x) { setMsg((x as Error).message); } e.target.value = ""; }} />{v.image ? "تغيير الصورة" : "رفع صورة (1600×900)"}</label></Sec>
    <Sec t="نوع الإعلان"><div className="grid grid-cols-2 gap-2">{([["IMAGE_TEXT", "صورة + نص"], ["IMAGE", "صورة فقط"]] as const).map(([k, l]) => <button key={k} onClick={() => set("type", k)} className={`h-12 rounded-xl font-bold border ${v.type === k ? "bg-ink text-lime border-ink" : "bg-white"}`}>{l}</button>)}</div></Sec>
    {txt && <Sec t="النص">
      <input className={inp} placeholder="عنوان الإعلان" value={v.titleAr ?? ""} onChange={(e) => set("titleAr", e.target.value)} /><input className={inp} placeholder="نص قصير" value={v.subtitleAr ?? ""} onChange={(e) => set("subtitleAr", e.target.value)} /><input className={inp} placeholder="نص الزر" value={v.buttonAr ?? ""} onChange={(e) => set("buttonAr", e.target.value)} />
      <details className="rounded-xl bg-soft p-3"><summary className="font-bold cursor-pointer">النسخة الإنجليزية (اختياري)</summary><div className="space-y-2 mt-3"><input className={inp} dir="ltr" placeholder="Title" value={v.titleEn ?? ""} onChange={(e) => set("titleEn", e.target.value)} /><input className={inp} dir="ltr" placeholder="Short text" value={v.subtitleEn ?? ""} onChange={(e) => set("subtitleEn", e.target.value)} /><input className={inp} dir="ltr" placeholder="Button" value={v.buttonEn ?? ""} onChange={(e) => set("buttonEn", e.target.value)} /></div></details></Sec>}
    <Sec t="الرابط عند الضغط"><select className={inp} value="" onChange={(e) => e.target.value && set("linkUrl", e.target.value === "-" ? "" : e.target.value)}><option value="">اختر وجهة سريعة...</option><option value="-">بدون رابط</option><option value="/products">كل المنتجات</option><option value="/categories">كل التصنيفات</option>{cats.map((c) => <option key={c.slug} value={`/categories/${c.slug}`}>{c.nameAr}</option>)}</select>
      <input className={inp} dir="ltr" placeholder="أو اكتب رابطًا: /products أو https://..." value={v.linkUrl ?? ""} onChange={(e) => set("linkUrl", e.target.value)} /></Sec>
    <Sec t="المدة والحالة">
      <div className="flex items-center justify-between gap-3"><span className="font-bold">مدة العرض (ثواني)</span><div className="flex items-center border rounded-xl bg-white"><button className="w-12 h-12 text-xl" onClick={() => step(-1)} aria-label="-">−</button><span className="w-10 text-center font-extrabold">{v.seconds}</span><button className="w-12 h-12 text-xl" onClick={() => step(1)} aria-label="+">+</button></div></div>
      <div className="flex items-center justify-between gap-3"><span className="font-bold">الإعلان فعّال</span><button role="switch" aria-checked={v.isActive} onClick={() => set("isActive", !v.isActive)} className={`w-14 h-8 rounded-full p-1 transition-colors ${v.isActive ? "bg-lime" : "bg-ink/20"}`}><span className={`block w-6 h-6 rounded-full bg-ink transition-transform ${v.isActive ? "-translate-x-6" : ""}`} /></button></div></Sec>
    <Sec t="جدولة (اختياري)"><label className="block text-sm text-steel">يبدأ في<input className={`${inp} mt-1`} type="datetime-local" value={v.startsAt ?? ""} onChange={(e) => set("startsAt", e.target.value)} /></label><label className="block text-sm text-steel">ينتهي في<input className={`${inp} mt-1`} type="datetime-local" value={v.endsAt ?? ""} onChange={(e) => set("endsAt", e.target.value)} /></label></Sec>
    {msg && <p className="text-accent font-bold">{msg}</p>}
    <div className="space-y-2"><button disabled={busy} onClick={save} className="w-full h-12 bg-lime font-extrabold rounded-xl">{busy ? "..." : v.id ? "حفظ التعديلات" : "إضافة الإعلان"}</button>{v.id && <button onClick={del} className="w-full h-12 rounded-xl border text-accent font-bold">حذف الإعلان</button>}</div></div>);
}
export default function BannersManager({ initial, cats }: { initial: B[]; cats: Cat[] }) {
  const [open, setOpen] = useState<number | null>(null), [adding, setAdding] = useState(false), live = initial.filter((b) => status(b)[0] === "ساري").length;
  async function move(id: number, dir: number) { await post("/api/admin/banners", { action: "move", id, dir }); window.location.reload(); }
  return (<div className="space-y-3 max-w-2xl"><h1 className="text-xl font-extrabold">الإعلانات</h1>
    <div className="bg-ink text-white rounded-2xl p-4 text-sm leading-relaxed"><b className="text-lime">كيف تعمل؟</b> الإعلانات السارية تظهر في الرئيسية بالترتيب، ويقلب كل إعلان بعد مدته (الافتراضي 5 ثواني). يظهر للعملاء الآن <b className="text-lime">{live}</b> إعلان.</div>
    <button onClick={() => { setAdding(!adding); setOpen(null); }} className="w-full h-12 bg-lime font-extrabold rounded-xl">{adding ? "إلغاء" : "+ إعلان جديد"}</button>
    {adding && <div className="bg-white rounded-2xl overflow-hidden"><Editor b0={blank} cats={cats} /></div>}
    <div className="space-y-2">{initial.map((b, n) => { const st = status(b), isOpen = open === b.id; return (<div key={b.id} className="bg-white rounded-2xl overflow-hidden">
      <div className="flex items-center gap-2 p-3"><button onClick={() => { setOpen(isOpen ? null : b.id!); setAdding(false); }} className="flex items-center gap-3 flex-1 min-w-0 text-start" aria-expanded={isOpen}>
        <span className="w-24 shrink-0"><span className="block relative aspect-[16/9] rounded-xl overflow-hidden bg-ink"><img src={b.image} alt="" className="absolute inset-0 w-full h-full object-cover" /></span></span>
        <span className="min-w-0 flex-1"><span className={`inline-block text-[11px] font-bold rounded-md px-2 ${st[1]}`}>{st[0]}</span><b className="block truncate text-sm">{b.type === "IMAGE" ? "صورة فقط" : b.titleAr || "بدون عنوان"}</b><small className="text-steel">{b.seconds} ث{b.linkUrl ? " · له رابط" : ""}</small></span></button>
        <div className="flex flex-col gap-1 shrink-0"><button disabled={n === 0} onClick={() => move(b.id!, -1)} className="w-10 h-9 border rounded-lg disabled:opacity-30" aria-label="أعلى">↑</button><button disabled={n === initial.length - 1} onClick={() => move(b.id!, 1)} className="w-10 h-9 border rounded-lg disabled:opacity-30" aria-label="أسفل">↓</button></div></div>
      {isOpen && <Editor b0={b} cats={cats} />}</div>); })}
      {initial.length === 0 && !adding && <p className="text-steel text-center p-8">لا توجد إعلانات. اضغط «إعلان جديد» لإضافة أول إعلان.</p>}</div></div>);
}
