"use client";
import { useState } from "react";
import Link from "next/link";
import { post, uploadFile } from "@/lib/client";
/* eslint-disable @typescript-eslint/no-explicit-any */
const i = "w-full border rounded-xl p-2.5 bg-white";
const Box = ({ t, children, hint }: { t: string; children: React.ReactNode; hint?: string }) => <section className="bg-white rounded-2xl p-4 space-y-3"><div><h2 className="font-extrabold border-b-2 border-lime inline-block">{t}</h2>{hint && <p className="text-xs text-steel mt-1">{hint}</p>}</div>{children}</section>;
const blank = { nameAr: "", nameEn: "", sku: "", descriptionAr: "", descriptionEn: "", price: null, wholesalePrice: null, videoUrl: "", showPrice: true, isActive: true, allowCart: true, inStock: true, isFeatured: false, sortOrder: 0, images: [], specs: [], features: [], documents: [] };
export default function ProductForm({ initial, categories }: { initial: any; categories: { id: number; nameAr: string }[] }) {
  const [p, setP] = useState<any>(initial ?? { ...blank, categoryId: categories[0]?.id });
  const [err, setErr] = useState(""), [msg, setMsg] = useState(""), [busy, setBusy] = useState(false);
  const set = (k: string, v: any) => setP((o: any) => ({ ...o, [k]: v }));
  const setList = (k: string, n: number, f: string, v: string) => set(k, p[k].map((x: any, j: number) => (j === n ? { ...x, [f]: v } : x)));
  const del = (k: string, n: number) => set(k, p[k].filter((_: any, j: number) => j !== n));
  const move = (k: string, n: number, d: number) => { const a = [...p[k]], m = n + d; if (m < 0 || m >= a.length) return; [a[n], a[m]] = [a[m], a[n]]; set(k, a); };
  const num = (v: any) => (v === "" || v == null ? null : Number(v));
  async function up(f: File | undefined, done: (url: string) => void) { if (!f) return; try { done(await uploadFile(f)); } catch (x) { setErr((x as Error).message); } }
  async function save() {
    setErr(""); setMsg("");
    if (!categories.length) return setErr("أضف تصنيفًا أولًا من صفحة التصنيفات ثم أضف المنتج");
    setBusy(true);
    const r = await post("/api/admin/products", { ...p, categoryId: Number(p.categoryId), price: num(p.price), wholesalePrice: num(p.wholesalePrice), sortOrder: Number(p.sortOrder) || 0 }); setBusy(false);
    if (!r.ok) return setErr(r.data.error?.includes("[") ? "تحقق من الاسم العربي والإنجليزي والتصنيف" : r.data.error);
    r.data.id && !p.id ? (window.location.href = `/admin/products/${r.data.id}`) : setMsg("تم الحفظ ✓");
  }
  async function remove() { if (confirm("حذف المنتج نهائيًا؟")) { const r = await fetch(`/api/admin/products?id=${p.id}`, { method: "DELETE" }); r.ok ? (window.location.href = "/admin/products") : setErr((await r.json()).error); } }
  const Chk = ({ k, l, h }: { k: string; l: string; h?: string }) => <label className="flex gap-2 items-start"><input type="checkbox" className="mt-1.5" checked={p[k]} onChange={(e) => set(k, e.target.checked)} /><span>{l}{h && <small className="block text-xs text-steel">{h}</small>}</span></label>;
  return (<div className="space-y-4 max-w-3xl">
    <div className="flex justify-between items-center"><h1 className="text-xl font-extrabold">{p.id ? "تعديل منتج" : "إضافة منتج"}</h1><Link href="/admin/products" className="text-sm text-steel">← القائمة</Link></div>
    <Box t="البيانات الأساسية"><div className="grid md:grid-cols-2 gap-2"><input className={i} placeholder="الاسم بالعربية *" value={p.nameAr} onChange={(e) => set("nameAr", e.target.value)} /><input className={i} dir="ltr" placeholder="Name (English) *" value={p.nameEn} onChange={(e) => set("nameEn", e.target.value)} />
      <input className={i} dir="ltr" placeholder="SKU" value={p.sku ?? ""} onChange={(e) => set("sku", e.target.value)} /><select className={i} value={p.categoryId} onChange={(e) => set("categoryId", e.target.value)}>{categories.map((c) => <option key={c.id} value={c.id}>{c.nameAr}</option>)}</select></div>
      <textarea rows={3} className={i} placeholder="الوصف (عربي)" value={p.descriptionAr ?? ""} onChange={(e) => set("descriptionAr", e.target.value)} /><textarea rows={3} dir="ltr" className={i} placeholder="Description (English)" value={p.descriptionEn ?? ""} onChange={(e) => set("descriptionEn", e.target.value)} /></Box>
    <Box t="الأسعار" hint="السعر العادي يراه كل الزوار (إن كان إظهاره مفعّلًا). سعر الجملة يراه فقط من أدخل كود الجملة. إن تركته فارغًا يرى عميل الجملة السعر العادي.">
      <div className="grid grid-cols-2 gap-2"><label><span className="text-sm">السعر العادي</span><input className={i} type="number" min="0" step="0.01" value={p.price ?? ""} onChange={(e) => set("price", e.target.value)} /></label><label><span className="text-sm">سعر الجملة (للأكواد فقط)</span><input className={i} type="number" min="0" step="0.01" value={p.wholesalePrice ?? ""} onChange={(e) => set("wholesalePrice", e.target.value)} /></label></div></Box>
    <Box t="الحالة والخيارات"><div className="grid md:grid-cols-2 gap-2"><Chk k="isActive" l="المنتج ظاهر" /><Chk k="showPrice" l="إظهار السعر العادي" h="إن أُخفي يظهر نص «تواصل معنا» والسعر يبقى محفوظًا" /><Chk k="allowCart" l="السماح بالإضافة للسلة" /><Chk k="inStock" l="متوفر" /><Chk k="isFeatured" l="مميز (يظهر في الرئيسية)" /></div>
      <label className="block"><span className="text-sm">الترتيب (الأصغر يظهر أولًا)</span><input className={i} type="number" value={p.sortOrder} onChange={(e) => set("sortOrder", e.target.value)} /></label></Box>
    <Box t="الصور" hint="الصورة الأولى هي الرئيسية. استخدم الأسهم للترتيب."><div className="flex gap-2 flex-wrap">{p.images.map((x: any, n: number) => <div key={n} className="w-24"><div className={`relative w-24 h-24 bg-soft rounded-xl overflow-hidden ${n === 0 ? "ring-2 ring-lime" : ""}`}><img src={x.url} className="w-full h-full object-contain" alt="" /><button className="absolute top-1 end-1 bg-accent text-white rounded-md px-1.5 text-sm" onClick={() => del("images", n)}>×</button></div>
      <div className="flex justify-between text-sm mt-1"><button onClick={() => move("images", n, -1)}>→</button>{n === 0 && <b className="text-xs">رئيسية</b>}<button onClick={() => move("images", n, 1)}>←</button></div></div>)}</div>
      <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple onChange={async (e) => { for (const f of Array.from(e.target.files ?? [])) await up(f, (url) => setP((o: any) => ({ ...o, images: [...o.images, { url }] }))); e.target.value = ""; }} />
      <input className={i} dir="ltr" placeholder="رابط فيديو (YouTube أو ملف mp4) - اختياري" value={p.videoUrl ?? ""} onChange={(e) => set("videoUrl", e.target.value)} /></Box>
    <Box t="المميزات">{p.features.map((x: any, n: number) => <div key={n} className="flex gap-1"><input className={i} placeholder="عربي" value={x.textAr} onChange={(e) => setList("features", n, "textAr", e.target.value)} /><input className={i} dir="ltr" placeholder="English" value={x.textEn} onChange={(e) => setList("features", n, "textEn", e.target.value)} /><button onClick={() => del("features", n)} className="px-2">×</button></div>)}
      <button className="text-sm font-bold underline" onClick={() => set("features", [...p.features, { textAr: "", textEn: "" }])}>+ ميزة</button></Box>
    <Box t="المواصفات" hint="أضف أي مواصفة تناسب المنتج (القوة، السرعة، السعة...) بدون تغيير قاعدة البيانات.">{p.specs.map((x: any, n: number) => <div key={n} className="flex gap-1"><input className={i} placeholder="الاسم عربي" value={x.nameAr} onChange={(e) => setList("specs", n, "nameAr", e.target.value)} /><input className={i} dir="ltr" placeholder="Name" value={x.nameEn} onChange={(e) => setList("specs", n, "nameEn", e.target.value)} /><input className={i} dir="ltr" placeholder="Value" value={x.value} onChange={(e) => setList("specs", n, "value", e.target.value)} /><button onClick={() => del("specs", n)} className="px-2">×</button></div>)}
      <button className="text-sm font-bold underline" onClick={() => set("specs", [...p.specs, { nameAr: "", nameEn: "", value: "" }])}>+ مواصفة</button></Box>
    <Box t="ملفات PDF (كتالوج / دليل استخدام)">{p.documents.map((x: any, n: number) => <div key={n} className="flex gap-1 items-center"><input className={i} placeholder="عنوان الملف" value={x.title} onChange={(e) => setList("documents", n, "title", e.target.value)} /><a href={x.url} target="_blank" className="text-sm underline shrink-0">فتح</a><button onClick={() => del("documents", n)} className="px-2">×</button></div>)}
      <input type="file" accept="application/pdf" onChange={(e) => up(e.target.files?.[0], (url) => set("documents", [...p.documents, { title: "ملف PDF", url }]))} /></Box>
    {err && <p className="text-accent font-bold">{err}</p>}{msg && <p className="font-bold">{msg}</p>}
    <div className="sticky bottom-0 bg-soft py-3 flex gap-2"><button disabled={busy} onClick={save} className="bg-lime font-extrabold rounded-xl px-6 py-3 flex-1">{busy ? "..." : "حفظ المنتج"}</button>{p.id && <button onClick={remove} className="bg-white border text-accent font-bold rounded-xl px-5">حذف</button>}</div></div>);
}
