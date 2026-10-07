"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Icon from "@/components/Icon";
import { post, uploadFile } from "@/lib/client";
import { toast } from "@/store/toast";
import { AEmpty, Badge, Field, PageHead } from "./ui";
import Switch from "./Switch";
type B = { id?: number; type: "IMAGE" | "IMAGE_TEXT"; image: string; titleAr?: string | null; titleEn?: string | null; subtitleAr?: string | null; subtitleEn?: string | null; buttonAr?: string | null; buttonEn?: string | null; linkUrl?: string | null; seconds: number; startsAt?: string | null; endsAt?: string | null; isActive: boolean };
type Cat = { slug: string; nameAr: string };
const blank: B = { type: "IMAGE_TEXT", image: "", titleAr: "", titleEn: "", subtitleAr: "", subtitleEn: "", buttonAr: "تسوّق الآن", buttonEn: "Shop now", linkUrl: "", seconds: 5, startsAt: "", endsAt: "", isActive: true };
const toLocal = (iso?: string | null) => { if (!iso) return ""; const d = new Date(iso); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 16); };
const status = (b: B): [string, string] => !b.isActive ? ["موقوف", "bg-soft text-steel"] : b.startsAt && new Date(b.startsAt) > new Date() ? ["مجدول", "bg-ink text-white"] : b.endsAt && new Date(b.endsAt) < new Date() ? ["منتهي", "bg-accent text-white"] : ["ساري", "bg-lime text-ink"];
const Sec = ({ t, children }: { t: string; children: React.ReactNode }) => <section className="space-y-3"><h3 className="font-sans text-sm font-extrabold flex items-center gap-2"><i className="w-1 h-4 rounded bg-accent" />{t}</h3>{children}</section>;
// معاينة الإعلان كما يظهر في الرئيسية (جوال 16:9)
function Preview({ v }: { v: B }) {
  const txt = v.type === "IMAGE_TEXT" && (v.titleAr || v.subtitleAr || v.buttonAr);
  return (<div className="relative aspect-[16/9] rounded-2xl overflow-hidden bg-ink">{v.image ? <img src={v.image} alt="" className="absolute inset-0 w-full h-full object-cover" /> : <span className="absolute inset-0 grid place-items-center text-white/50"><span className="text-center"><Icon n="image" s={36} stroke={1.4} className="mx-auto" /><small className="block mt-1">لا توجد صورة</small></span></span>}
    {txt && <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/35 to-transparent flex flex-col justify-end p-4"><i className="block w-8 h-1 bg-accent rounded mb-1.5" /><b className="text-white leading-tight text-lg">{v.titleAr}</b><span className="text-white/85 text-xs line-clamp-2">{v.subtitleAr}</span>{v.buttonAr && v.linkUrl && <span className="mt-2 self-start bg-lime text-ink font-extrabold text-xs rounded-lg px-3 py-1.5">{v.buttonAr}</span>}</div>}</div>);
}
function Editor({ b0, cats, onDone }: { b0: B; cats: Cat[]; onDone: () => void }) {
  const r = useRouter(), [v, setV] = useState<B>({ ...b0, startsAt: toLocal(b0.startsAt), endsAt: toLocal(b0.endsAt) }), [msg, setMsg] = useState(""), [busy, setBusy] = useState(false), [up, setUp] = useState(false);
  const set = (k: keyof B, x: unknown) => setV((o) => ({ ...o, [k]: x })), txt = v.type === "IMAGE_TEXT";
  async function save() {
    setMsg(""); setBusy(true);
    const x = await post("/api/admin/banners", { ...v, seconds: Number(v.seconds) || 5, startsAt: v.startsAt ? new Date(v.startsAt).toISOString() : null, endsAt: v.endsAt ? new Date(v.endsAt).toISOString() : null, linkUrl: v.linkUrl || null });
    setBusy(false); if (x.ok) { toast(v.id ? "تم حفظ الإعلان" : "تمت إضافة الإعلان"); onDone(); r.refresh(); } else setMsg(x.data.error?.includes("[") ? "ارفع الصورة وتأكد من المدة والرابط" : x.data.error);
  }
  async function del() { if (confirm("حذف الإعلان؟")) { await fetch(`/api/admin/banners?id=${v.id}`, { method: "DELETE" }); toast("تم حذف الإعلان"); onDone(); r.refresh(); } }
  const step = (d: number) => set("seconds", Math.max(2, Math.min(30, (Number(v.seconds) || 5) + d)));
  return (<div className="p-4 border-t border-line bg-soft/40 grid lg:grid-cols-[1fr_1fr] gap-5">
    <div className="space-y-5 lg:sticky lg:top-6 self-start">
      <Sec t="الصورة"><Preview v={v} /><label className="btn btn-md btn-ghost w-full cursor-pointer border-dashed border-2"><input type="file" hidden accept="image/jpeg,image/png,image/webp" onChange={async (e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) { setUp(true); try { set("image", await uploadFile(f)); } catch (x) { setMsg((x as Error).message); } setUp(false); } }} /><Icon n="upload" s={18} />{up ? "جارٍ الرفع..." : v.image ? "تغيير الصورة" : "رفع صورة (1600×900 مثالي)"}</label></Sec>
      <Sec t="نوع الإعلان"><div className="grid grid-cols-2 gap-2">{([["IMAGE_TEXT", "صورة + نص"], ["IMAGE", "صورة فقط"]] as const).map(([k, l]) => <button key={k} onClick={() => set("type", k)} className={`btn btn-md ${v.type === k ? "btn-dark" : "btn-ghost"}`}>{l}</button>)}</div></Sec>
    </div>
    <div className="space-y-5">
      {txt && <Sec t="النص"><Field label="العنوان"><input className="field" value={v.titleAr ?? ""} onChange={(e) => set("titleAr", e.target.value)} /></Field><Field label="نص قصير"><input className="field" value={v.subtitleAr ?? ""} onChange={(e) => set("subtitleAr", e.target.value)} /></Field><Field label="نص الزر"><input className="field" value={v.buttonAr ?? ""} onChange={(e) => set("buttonAr", e.target.value)} /></Field>
        <details className="rounded-xl bg-white border border-line p-3"><summary className="font-bold text-sm cursor-pointer">النسخة الإنجليزية (تُترجم تلقائيًا إن تُركت فارغة)</summary><div className="space-y-2 mt-3"><input className="field" dir="ltr" placeholder="Title" value={v.titleEn ?? ""} onChange={(e) => set("titleEn", e.target.value)} /><input className="field" dir="ltr" placeholder="Short text" value={v.subtitleEn ?? ""} onChange={(e) => set("subtitleEn", e.target.value)} /><input className="field" dir="ltr" placeholder="Button" value={v.buttonEn ?? ""} onChange={(e) => set("buttonEn", e.target.value)} /></div></details></Sec>}
      <Sec t="الرابط عند الضغط"><select className="field" value="" onChange={(e) => e.target.value && set("linkUrl", e.target.value === "-" ? "" : e.target.value)}><option value="">اختر وجهة سريعة...</option><option value="-">بدون رابط</option><option value="/products">كل المنتجات</option><option value="/products?featured=1">المنتجات المميزة</option><option value="/categories">كل التصنيفات</option>{cats.map((c) => <option key={c.slug} value={`/categories/${c.slug}`}>{c.nameAr}</option>)}</select>
        <input className="field" dir="ltr" placeholder="أو اكتب رابطًا: /products أو https://..." value={v.linkUrl ?? ""} onChange={(e) => set("linkUrl", e.target.value)} /></Sec>
      <Sec t="المدة والحالة"><div className="flex items-center justify-between gap-3"><b className="text-sm">مدة العرض (ثواني)</b><div className="flex items-center rounded-xl border border-line bg-white"><button className="btn-icon w-11 h-11" onClick={() => step(-1)} aria-label="-"><Icon n="minus" s={16} /></button><span className="w-10 text-center font-extrabold">{v.seconds}</span><button className="btn-icon w-11 h-11" onClick={() => step(1)} aria-label="+"><Icon n="plus" s={16} /></button></div></div>
        <Switch label="الإعلان فعّال" on={v.isActive} onChange={(x) => set("isActive", x)} /></Sec>
      <Sec t="جدولة (اختياري)"><div className="grid sm:grid-cols-2 gap-3"><Field label="يبدأ في"><input className="field" type="datetime-local" value={v.startsAt ?? ""} onChange={(e) => set("startsAt", e.target.value)} /></Field><Field label="ينتهي في"><input className="field" type="datetime-local" value={v.endsAt ?? ""} onChange={(e) => set("endsAt", e.target.value)} /></Field></div></Sec>
      {msg && <p className="text-accent text-sm font-bold flex items-center gap-2"><Icon n="alert" s={16} />{msg}</p>}
      <div className="flex flex-wrap gap-2"><button disabled={busy || up} onClick={save} className="btn btn-lg btn-lime flex-1">{busy ? "..." : <><Icon n="check" s={18} />{v.id ? "حفظ التعديلات" : "إضافة الإعلان"}</>}</button><button onClick={onDone} className="btn btn-lg btn-ghost">إلغاء</button>{v.id && <button onClick={del} className="btn btn-lg btn-danger" aria-label="حذف"><Icon n="trash" s={18} /></button>}</div>
    </div></div>);
}
export default function BannersManager({ initial, cats }: { initial: B[]; cats: Cat[] }) {
  const r = useRouter(), [open, setOpen] = useState<number | "new" | null>(null), live = initial.filter((b) => status(b)[0] === "ساري").length;
  async function move(id: number, dir: number) { await post("/api/admin/banners", { action: "move", id, dir }); r.refresh(); }
  return (<div className="max-w-5xl">
    <PageHead title="الإعلانات" desc={`الإعلانات السارية تظهر في أعلى الرئيسية بالترتيب، ويقلب كل إعلان بعد مدته. يظهر للعملاء الآن ${live} إعلان.`}><button onClick={() => setOpen(open === "new" ? null : "new")} className="btn btn-md btn-lime"><Icon n="plus" s={18} />إعلان جديد</button></PageHead>
    {open === "new" && <div className="card overflow-hidden mb-3"><b className="block px-4 pt-4">إعلان جديد</b><Editor b0={blank} cats={cats} onDone={() => setOpen(null)} /></div>}
    <div className="card overflow-hidden divide-y divide-line">{initial.map((b, n) => { const st = status(b), isOpen = open === b.id; return (<div key={b.id}>
      <div className="flex items-center gap-3 p-3"><button onClick={() => setOpen(isOpen ? null : b.id!)} className="flex items-center gap-3 flex-1 min-w-0 text-start" aria-expanded={isOpen}>
        <span className="w-28 sm:w-36 shrink-0"><span className="block relative aspect-[16/9] rounded-xl overflow-hidden bg-ink"><img src={b.image} alt="" className="absolute inset-0 w-full h-full object-cover" /></span></span>
        <span className="min-w-0 flex-1 space-y-1"><Badge cls={st[1]}>{st[0]}</Badge><b className="block truncate text-sm">{b.type === "IMAGE" ? "صورة فقط" : b.titleAr || "بدون عنوان"}</b><small className="text-xs text-steel">{b.seconds} ثوانٍ{b.linkUrl ? " · له رابط" : ""}</small></span></button>
        <div className="flex flex-col gap-1 shrink-0"><button disabled={n === 0} onClick={() => move(b.id!, -1)} className="btn-icon w-9 h-9 border border-line rounded-lg disabled:opacity-30" aria-label="أعلى"><Icon n="arrowUp" s={16} /></button><button disabled={n === initial.length - 1} onClick={() => move(b.id!, 1)} className="btn-icon w-9 h-9 border border-line rounded-lg disabled:opacity-30" aria-label="أسفل"><Icon n="arrowDown" s={16} /></button></div></div>
      {isOpen && <Editor b0={b} cats={cats} onDone={() => setOpen(null)} />}</div>); })}
      {initial.length === 0 && open !== "new" && <AEmpty icon="megaphone" title="لا توجد إعلانات. تظهر الواجهة الثابتة في الرئيسية بدلًا منها." />}</div>
  </div>);
}
