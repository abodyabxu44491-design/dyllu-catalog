"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Icon from "@/components/Icon";
import { post, uploadFile } from "@/lib/client";
import { toast } from "@/store/toast";
import { ask } from "@/store/confirm";
import { Card, Field, PageHead } from "./ui";
import Switch from "./Switch";
/* eslint-disable @typescript-eslint/no-explicit-any */
const blank = { nameAr: "", sku: "", descriptionAr: "", price: null, wholesalePrice: null, videoUrl: "", showPrice: true, isActive: true, allowCart: true, inStock: true, isFeatured: false, sortOrder: 0, images: [], specs: [], features: [], documents: [] };
const IMG = "image/jpeg,image/png,image/webp,image/gif";
// نموذج المنتج: كمبيوتر = عمودان (المحتوى | النشر والأسعار والتصنيف) · جوال = عمود واحد. شريط حفظ ثابت وتنبيه عند ترك تعديلات غير محفوظة
type Brief = { id: number; nameAr: string; nameEn: string; images: string[]; category: string };
// منتقي «نسخ المواصفات من منتج آخر»
function CopyFrom({ onPick, onClose }: { onPick: (id: number, name: string) => void; onClose: () => void }) {
  const [q, setQ] = useState(""), [list, setList] = useState<Brief[]>([]);
  useEffect(() => { const c = new AbortController(); const t = setTimeout(() => fetch(`/api/admin/products?q=${encodeURIComponent(q)}`, { signal: c.signal }).then((x) => x.json()).then((x) => setList(Array.isArray(x) ? x : [])).catch(() => {}), 200); return () => { clearTimeout(t); c.abort(); }; }, [q]);
  return (<div className="mb-3 rounded-2xl border border-line overflow-hidden"><div className="flex items-center gap-2 p-2 border-b border-line bg-soft"><Icon n="search" s={18} className="text-steel ms-1" /><input autoFocus className="flex-1 bg-transparent outline-none h-9 text-sm" placeholder="ابحث عن منتج لنسخ مواصفاته" value={q} onChange={(e) => setQ(e.target.value)} /><button type="button" onClick={onClose} aria-label="إغلاق" className="btn-icon w-8 h-8 text-steel"><Icon n="close" s={16} /></button></div>
    <div className="max-h-56 overflow-y-auto divide-y divide-line">{list.map((x) => <button type="button" key={x.id} onClick={() => onPick(x.id, x.nameAr || x.nameEn)} className="w-full flex items-center gap-3 p-2 text-start hover:bg-soft"><span className="w-9 h-9 rounded-lg bg-soft overflow-hidden shrink-0">{x.images[0] && <img src={x.images[0]} alt="" className="w-full h-full object-contain" />}</span><span className="min-w-0"><b className="block text-sm truncate">{x.nameAr || x.nameEn}</b><small className="text-xs text-steel">{x.category}</small></span></button>)}</div></div>);
}
export default function ProductForm({ initial, categories, defaultCategory }: { initial: any; categories: { id: number; nameAr: string }[]; defaultCategory?: number }) {
  const r = useRouter(), start = useRef(JSON.stringify(initial ?? { ...blank, categoryId: defaultCategory ?? categories[0]?.id }));
  const [copying, setCopying] = useState(false), saveRef = useRef<(andNew?: boolean) => void>(() => {});
  const [p, setP] = useState<any>(() => JSON.parse(start.current));
  const [err, setErr] = useState(""), [busy, setBusy] = useState(false), [ups, setUps] = useState(0), [drag, setDrag] = useState(false);
  const dirty = JSON.stringify(p) !== start.current;
  // اختصارات: Ctrl/⌘+S حفظ · لصق صورة (Ctrl/⌘+V) يرفعها مباشرة
  useEffect(() => {
    const key = (e: KeyboardEvent) => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") { e.preventDefault(); saveRef.current(); } };
    const paste = (e: ClipboardEvent) => { const files = Array.from(e.clipboardData?.files ?? []).filter((f) => f.type.startsWith("image/")); if (files.length) { e.preventDefault(); addImages(files); toast(`جارٍ رفع ${files.length} صورة ملصوقة`); } };
    addEventListener("keydown", key); addEventListener("paste", paste); return () => { removeEventListener("keydown", key); removeEventListener("paste", paste); };
  });
  // مميزات: Enter يضيف سطرًا جديدًا تحته، ولصق عدة أسطر يوزّعها على مميزات منفصلة
  const focusFeat = (i: number) => setTimeout(() => (document.getElementById(`feat-${i}`) as HTMLInputElement | null)?.focus(), 0);
  function featKey(e: React.KeyboardEvent, n: number) { if (e.key === "Enter") { e.preventDefault(); setP((o: any) => { const a = [...o.features]; a.splice(n + 1, 0, { textAr: "" }); return { ...o, features: a }; }); focusFeat(n + 1); } }
  function featPaste(e: React.ClipboardEvent, n: number) {
    const lines = e.clipboardData.getData("text").split(/\r?\n/).map((x) => x.replace(/^[\s•\-–*·\d.)]+/, "").trim()).filter(Boolean);
    if (lines.length < 2) return; e.preventDefault();
    setP((o: any) => { const a = [...o.features]; a.splice(n, 1, ...lines.map((t) => ({ textAr: t }))); return { ...o, features: a }; }); toast(`تمت إضافة ${lines.length} مميزات`);
  }
  async function copyFrom(id: number, name: string) {
    const x = await fetch(`/api/admin/products?id=${id}`).then((r) => r.json()).catch(() => null); setCopying(false);
    if (!x) return toast("تعذر النسخ", { tone: "err" });
    setP((o: any) => ({ ...o, specs: [...o.specs.filter((s: any) => s.nameAr || s.value), ...x.specs.map((s: any) => ({ ...s, value: "" }))], features: o.features.length ? o.features : x.features }));
    toast(`نُسخت ${x.specs.length} مواصفة من «${name}»، اكتب القيم الجديدة`);
  }
  const price = Number(p.price) || 0;
  const checks: [boolean, string][] = [[!!p.nameAr.trim(), "اسم المنتج"], [p.images.length > 0, "صورة واحدة على الأقل"], [p.price !== null && p.price !== "" || !p.showPrice, "السعر"], [!!(p.descriptionAr ?? "").trim(), "الوصف"], [p.specs.some((x: any) => x.value), "مواصفة واحدة على الأقل"], [!!(p.sku ?? "").trim(), "رقم الموديل"]];
  const ready = Math.round((checks.filter(([ok]) => ok).length / checks.length) * 100);
  useEffect(() => { const f = (e: BeforeUnloadEvent) => { if (dirty) { e.preventDefault(); e.returnValue = ""; } }; addEventListener("beforeunload", f); return () => removeEventListener("beforeunload", f); }, [dirty]);
  const set = (k: string, v: any) => setP((o: any) => ({ ...o, [k]: v }));
  const setList = (k: string, n: number, f: string, v: string) => setP((o: any) => ({ ...o, [k]: o[k].map((x: any, j: number) => (j === n ? { ...x, [f]: v } : x)) }));
  const del = (k: string, n: number) => setP((o: any) => ({ ...o, [k]: o[k].filter((_: any, j: number) => j !== n) }));
  const move = (k: string, n: number, d: number) => setP((o: any) => { const a = [...o[k]], m = n + d; if (m < 0 || m >= a.length) return o; [a[n], a[m]] = [a[m], a[n]]; return { ...o, [k]: a }; });
  const num = (v: any) => (v === "" || v == null ? null : Number(v));
  async function upload(files: File[], done: (url: string, f: File) => void) {
    for (const f of files) { setUps((n) => n + 1); try { done(await uploadFile(f), f); } catch (x) { toast((x as Error).message, { tone: "err" }); } finally { setUps((n) => n - 1); } }
  }
  const addImages = (files: File[]) => upload(files.filter((f) => f.type.startsWith("image/")), (url) => setP((o: any) => ({ ...o, images: [...o.images, { url }] })));
  async function save(andNew = false) {
    setErr("");
    if (!categories.length) return setErr("أضف تصنيفًا أولًا من صفحة التصنيفات ثم أضف المنتج");
    if (!p.nameAr.trim()) return setErr("اكتب اسم المنتج");
    setBusy(true);
    const x = await post("/api/admin/products", { ...p, categoryId: Number(p.categoryId), price: num(p.price), wholesalePrice: num(p.wholesalePrice), sortOrder: Number(p.sortOrder) || 0 }); setBusy(false);
    if (!x.ok) return setErr(x.data.error?.includes("[") ? "تحقق من اسم المنتج والتصنيف" : x.data.error);
    toast("تم حفظ المنتج");
    if (andNew) { start.current = JSON.stringify(p); setP((o: any) => o); r.push(`/admin/products/new?cat=${p.categoryId}&t=${Date.now()}`); return; }
    if (x.data.id && !p.id) { start.current = ""; r.replace(`/admin/products/${x.data.id}`); return; }
    const filled = p;
    start.current = JSON.stringify(filled); setP(filled); r.refresh();
  }
  saveRef.current = save;
  async function remove() { if (!(await ask({ title: "حذف المنتج نهائيًا؟", body: "لا يمكن التراجع. لإخفائه مؤقتًا استخدم «المنتج ظاهر».", ok: "حذف نهائي", danger: true }))) return; const x = await fetch(`/api/admin/products?id=${p.id}`, { method: "DELETE" }); if (x.ok) { start.current = JSON.stringify(p); toast("تم حذف المنتج"); r.push("/admin/products"); } else setErr((await x.json()).error); }
  const rowBtn = "btn-icon w-10 h-10 text-steel hover:text-accent hover:bg-accent/5 shrink-0";
  return (<div>
    <PageHead title={p.id ? "تعديل منتج" : "إضافة منتج"} back={["/admin/products", "المنتجات"]}>{p.id && p.slug && JSON.parse(start.current).isActive && <a href={`/products/${p.slug}`} target="_blank" className="btn btn-md btn-ghost"><Icon n="external" s={18} />عرض في المتجر</a>}</PageHead>
    <div className="grid lg:grid-cols-[1fr_320px] gap-4 md:gap-5 items-start">
      <div className="space-y-4 md:space-y-5 min-w-0">
        <Card title="البيانات الأساسية" desc="اكتب بالعربية فقط. النسخة الإنجليزية للمتجر تُترجم تلقائيًا عند الحفظ.">
          <div className="space-y-3">
          <Field label="اسم المنتج *"><input className="field" value={p.nameAr} onChange={(e) => set("nameAr", e.target.value)} placeholder="مثال: دريل شحن 20 فولت" /></Field>
          <Field label="الوصف"><textarea rows={4} className="field" value={p.descriptionAr ?? ""} onChange={(e) => set("descriptionAr", e.target.value)} /></Field></div></Card>

        <Card title="الصور" desc="الصورة الأولى هي الرئيسية. اسحب الصور هنا، أو اضغط للرفع، أو الصق صورة (Ctrl+V). JPG / PNG / WEBP حتى 15MB، وتُضغط تلقائيًا لتفتح بسرعة.">
          <div className="grid grid-cols-3 sm:grid-cols-4 xl:grid-cols-5 gap-3">
            {p.images.map((x: any, n: number) => (<div key={x.url + n} className={`group relative rounded-2xl bg-soft overflow-hidden border-2 ${n === 0 ? "border-lime" : "border-transparent"}`}>
              <img src={x.url} className="w-full aspect-square object-contain" alt="" />
              {n === 0 && <span className="absolute top-1.5 start-1.5 bg-lime text-ink text-[10px] font-extrabold rounded-md px-1.5 py-0.5">رئيسية</span>}
              <button aria-label="حذف الصورة" onClick={() => del("images", n)} className="absolute top-1.5 end-1.5 btn-icon w-7 h-7 rounded-lg bg-white/95 text-accent shadow-card"><Icon n="close" s={14} stroke={2.6} /></button>
              <div className="absolute inset-x-1.5 bottom-1.5 flex justify-between"><button aria-label="تقديم" disabled={n === 0} onClick={() => move("images", n, -1)} className="btn-icon w-7 h-7 rounded-lg bg-white/95 shadow-card disabled:opacity-0"><Icon n="chev" s={14} className="rtl:rotate-0 rotate-180" /></button>
                {n > 0 && <button onClick={() => setP((o: any) => ({ ...o, images: [o.images[n], ...o.images.filter((_: any, j: number) => j !== n)] }))} className="btn h-7 px-2 rounded-lg bg-white/95 shadow-card text-[10px]">جعلها رئيسية</button>}
                <button aria-label="تأخير" disabled={n === p.images.length - 1} onClick={() => move("images", n, 1)} className="btn-icon w-7 h-7 rounded-lg bg-white/95 shadow-card disabled:opacity-0"><Icon n="chev" s={14} className="rtl:rotate-180" /></button></div>
            </div>))}
            <label onDragOver={(e) => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)} onDrop={(e) => { e.preventDefault(); setDrag(false); addImages(Array.from(e.dataTransfer.files)); }}
              className={`aspect-square rounded-2xl border-2 border-dashed grid place-items-center text-center cursor-pointer transition p-2 ${drag ? "border-accent bg-accent/5" : "border-line hover:border-steel hover:bg-soft"}`}>
              <input type="file" hidden accept={IMG} multiple onChange={(e) => { addImages(Array.from(e.target.files ?? [])); e.target.value = ""; }} />
              <span className="text-steel">{ups > 0 ? <span className="text-xs font-bold">جارٍ الرفع ({ups})...</span> : <><Icon n="upload" s={26} className="mx-auto" /><b className="block text-xs mt-1">إضافة صور</b></>}</span></label>
          </div>
          <div className="mt-4"><Field label="رابط فيديو (اختياري)" hint="YouTube أو رابط ملف mp4"><input className="field" dir="ltr" placeholder="https://" value={p.videoUrl ?? ""} onChange={(e) => set("videoUrl", e.target.value)} /></Field></div>
        </Card>

        <Card title="المميزات" desc="نقاط قصيرة تظهر بجانب السعر. Enter يضيف سطرًا جديدًا، ولصق قائمة كاملة يوزعها تلقائيًا." action={<button className="btn btn-sm btn-ghost" onClick={() => { set("features", [...p.features, { textAr: "" }]); focusFeat(p.features.length); }}><Icon n="plus" s={16} />ميزة</button>}>
          {p.features.length === 0 ? <p className="text-sm text-steel">لا توجد مميزات. اضغط «ميزة» للإضافة.</p> : <div className="space-y-2">{p.features.map((x: any, n: number) => (<div key={n} className="flex gap-2 items-start">
            <input id={`feat-${n}`} className="field h-11 flex-1" placeholder="مثال: محرك بدون فحمات لعمر أطول" enterKeyHint="next" value={x.textAr} onKeyDown={(e) => featKey(e, n)} onPaste={(e) => featPaste(e, n)} onChange={(e) => setList("features", n, "textAr", e.target.value)} />
            <button aria-label="حذف" onClick={() => del("features", n)} className={rowBtn}><Icon n="trash" s={18} /></button></div>))}</div>}</Card>

        <Card title="المواصفات" desc="أي مواصفة تناسب المنتج: القوة، السرعة، السعة، الوزن..." action={<div className="flex gap-1"><button className="btn btn-sm btn-ghost" aria-label="نسخ المواصفات من منتج آخر" onClick={() => setCopying(!copying)}><Icon n="dup" s={16} /><span className="hidden sm:inline">نسخ من منتج</span></button><button className="btn btn-sm btn-ghost" onClick={() => set("specs", [...p.specs, { nameAr: "", value: "" }])}><Icon n="plus" s={16} />مواصفة</button></div>}>
          {copying && <CopyFrom onPick={copyFrom} onClose={() => setCopying(false)} />}
          {p.specs.length === 0 ? <p className="text-sm text-steel">لا توجد مواصفات. اضغط «مواصفة» للإضافة.</p> : <div className="space-y-2">{p.specs.map((x: any, n: number) => (<div key={n} className="flex gap-2 items-start rounded-xl sm:rounded-none bg-soft sm:bg-transparent p-2 sm:p-0">
            <div className="flex-1 grid grid-cols-2 gap-2"><input className="field h-11" placeholder="المواصفة: القوة" value={x.nameAr} onChange={(e) => setList("specs", n, "nameAr", e.target.value)} /><input className="field h-11" placeholder="القيمة: 20 فولت" value={x.value} onChange={(e) => setList("specs", n, "value", e.target.value)} /></div>
            <div className="flex flex-col sm:flex-row"><button aria-label="أعلى" onClick={() => move("specs", n, -1)} className="btn-icon w-9 h-10 text-steel hover:text-ink"><Icon n="arrowUp" s={16} /></button><button aria-label="حذف" onClick={() => del("specs", n)} className={rowBtn}><Icon n="trash" s={18} /></button></div></div>))}</div>}</Card>

        <Card title="ملفات PDF" desc="كتالوج أو دليل استخدام يظهر للعميل للتحميل.">
          <div className="space-y-2">{p.documents.map((x: any, n: number) => (<div key={n} className="flex gap-2 items-center"><span className="w-10 h-10 rounded-xl bg-accent/10 text-accent grid place-items-center shrink-0"><Icon n="doc" s={18} /></span><input className="field h-11 flex-1" placeholder="عنوان الملف" value={x.title} onChange={(e) => setList("documents", n, "title", e.target.value)} /><a href={x.url} target="_blank" className="btn-icon w-10 h-10 text-steel hover:text-ink" aria-label="فتح"><Icon n="external" s={18} /></a><button aria-label="حذف" onClick={() => del("documents", n)} className={rowBtn}><Icon n="trash" s={18} /></button></div>))}</div>
          <label className="mt-3 btn btn-md btn-ghost cursor-pointer"><input type="file" hidden accept="application/pdf" onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) upload([f], (url, ff) => setP((o: any) => ({ ...o, documents: [...o.documents, { title: ff.name.replace(/\.pdf$/i, ""), url }] }))); }} /><Icon n="upload" s={18} />رفع ملف PDF</label></Card>
      </div>

      <div className="space-y-4 md:space-y-5 lg:sticky lg:top-6">
        <Card title="جاهزية المنتج" action={<b className={`font-display ${ready === 100 ? "text-[#586000]" : "text-accent"}`}>{ready}%</b>}>
          <div className="h-2 rounded-full bg-soft overflow-hidden mb-3"><div className={`h-full rounded-full transition-all ${ready === 100 ? "bg-lime" : "bg-accent"}`} style={{ width: `${ready}%` }} /></div>
          <ul className="grid grid-cols-2 gap-x-2 gap-y-1.5 text-xs">{checks.map(([ok, l]) => <li key={l} className={`flex items-center gap-1.5 ${ok ? "text-steel" : "text-ink font-bold"}`}><Icon n={ok ? "check" : "info"} s={14} stroke={ok ? 3 : 2} className={ok ? "text-[#586000]" : "text-accent"} />{l}</li>)}</ul></Card>
        <Card title="النشر"><div className="divide-y divide-line -my-1">
          <div className="py-2"><Switch label="المنتج ظاهر" hint="المخفي لا يظهر للعملاء" on={p.isActive} onChange={(v) => set("isActive", v)} /></div>
          <div className="py-2"><Switch label="مميز" hint="يظهر في الرئيسية" on={p.isFeatured} onChange={(v) => set("isFeatured", v)} /></div>
          <div className="py-2"><Switch label="متوفر" on={p.inStock} onChange={(v) => set("inStock", v)} /></div>
          <div className="py-2"><Switch label="السماح بالإضافة للسلة" on={p.allowCart} onChange={(v) => set("allowCart", v)} /></div></div></Card>
        <Card title="الأسعار" desc="سعر الجملة يراه فقط من أدخل كود الجملة؛ إن تركته فارغًا يرى السعر العادي."><div className="space-y-3">
          <Field label="السعر العادي (ريال)"><input className="field" type="number" inputMode="decimal" min="0" step="0.01" dir="ltr" value={p.price ?? ""} onChange={(e) => set("price", e.target.value)} /></Field>
          <Switch label="إظهار السعر العادي" hint="إن أُخفي يظهر «تواصل معنا» ويبقى السعر محفوظًا" on={p.showPrice} onChange={(v) => set("showPrice", v)} />
          <Field label="سعر الجملة (ريال)"><input className="field" type="number" inputMode="decimal" min="0" step="0.01" dir="ltr" value={p.wholesalePrice ?? ""} onChange={(e) => set("wholesalePrice", e.target.value)} /></Field>
          {price > 0 && <div className="flex flex-wrap gap-1.5 -mt-1"><small className="w-full text-xs text-steel">حساب سريع من السعر العادي:</small>{[5, 10, 15, 20].map((d) => <button type="button" key={d} onClick={() => set("wholesalePrice", String(Math.round(price * (100 - d)) / 100))} className="chip chip-off h-8 text-xs">-{d}%</button>)}</div>}</div></Card>
        <Card title="التنظيم"><div className="space-y-3">
          <Field label="التصنيف">{categories.length ? <select className="field" value={p.categoryId} onChange={(e) => set("categoryId", e.target.value)}>{categories.map((c) => <option key={c.id} value={c.id}>{c.nameAr}</option>)}</select> : <Link href="/admin/categories" className="btn btn-md btn-ghost w-full">أضف تصنيفًا أولًا</Link>}</Field>
          <Field label="رقم الموديل (SKU)"><input className="field" dir="ltr" value={p.sku ?? ""} onChange={(e) => set("sku", e.target.value)} /></Field>
          <Field label="الترتيب" hint="الأصغر يظهر أولًا"><input className="field" type="number" dir="ltr" value={p.sortOrder} onChange={(e) => set("sortOrder", e.target.value)} /></Field></div></Card>
        {p.id && <button onClick={remove} className="btn btn-md btn-danger w-full"><Icon n="trash" s={18} />حذف المنتج</button>}
      </div>
    </div>

    <div className="sticky bottom-16 lg:bottom-0 z-30 mt-5 -mx-4 sm:mx-0 px-4 sm:px-0 py-3 bg-soft/95 backdrop-blur">
      <div className="card shadow-lift p-3 flex items-center gap-3">
        <span className={`hidden sm:flex items-center gap-2 text-sm font-bold flex-1 ${err ? "text-accent" : dirty ? "text-accent" : "text-steel"}`}><Icon n={err ? "alert" : dirty ? "info" : "check"} s={18} />{err || (dirty ? "لديك تعديلات غير محفوظة" : "كل التعديلات محفوظة")}</span>
        {err && <span className="sm:hidden text-accent text-xs font-bold flex-1">{err}</span>}
        <small className="hidden xl:inline text-xs text-steel" dir="ltr">Ctrl+S</small>
        {!p.id && <button disabled={busy || ups > 0} onClick={() => save(true)} className="btn btn-lg btn-ghost hidden sm:inline-flex" title="يحفظ ويفتح نموذجًا جديدًا بنفس التصنيف"><Icon n="plus" s={18} />حفظ وإضافة آخر</button>}
        <button disabled={busy || ups > 0} onClick={() => save()} className="btn btn-lg btn-lime flex-1 sm:flex-none sm:min-w-[180px]">{busy ? "جارٍ الحفظ والترجمة..." : <><Icon n="check" s={20} />حفظ المنتج</>}</button>
      </div></div>
  </div>);
}
