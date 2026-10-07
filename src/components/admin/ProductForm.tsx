"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Icon from "@/components/Icon";
import { post, uploadFile } from "@/lib/client";
import { toast } from "@/store/toast";
import { Card, Field, PageHead } from "./ui";
import Switch from "./Switch";
/* eslint-disable @typescript-eslint/no-explicit-any */
const blank = { nameAr: "", nameEn: "", sku: "", descriptionAr: "", descriptionEn: "", price: null, wholesalePrice: null, videoUrl: "", showPrice: true, isActive: true, allowCart: true, inStock: true, isFeatured: false, sortOrder: 0, images: [], specs: [], features: [], documents: [] };
const IMG = "image/jpeg,image/png,image/webp,image/gif";
// نموذج المنتج: كمبيوتر = عمودان (المحتوى | النشر والأسعار والتصنيف) · جوال = عمود واحد. شريط حفظ ثابت وتنبيه عند ترك تعديلات غير محفوظة
export default function ProductForm({ initial, categories, ai = false }: { initial: any; categories: { id: number; nameAr: string }[]; ai?: boolean }) {
  const r = useRouter(), start = useRef(JSON.stringify(initial ?? { ...blank, categoryId: categories[0]?.id }));
  const [p, setP] = useState<any>(() => JSON.parse(start.current));
  const [err, setErr] = useState(""), [busy, setBusy] = useState(false), [ups, setUps] = useState(0), [drag, setDrag] = useState(false), [tr, setTr] = useState(false);
  // ترجمة تلقائية للحقول الفارغة (الاسم، الوصف، المميزات، أسماء المواصفات) في الاتجاهين، ليراجعها المدير قبل الحفظ
  async function autoTranslate() {
    const toEn: Record<string, string> = {}, toAr: Record<string, string> = {}, add = (a: string, e: string, ka: string, ke: string) => { if (a?.trim() && !e?.trim()) toEn[ke] = a; else if (e?.trim() && !a?.trim()) toAr[ka] = e; };
    add(p.nameAr, p.nameEn, "nameAr", "nameEn"); add(p.descriptionAr ?? "", p.descriptionEn ?? "", "descriptionAr", "descriptionEn");
    p.features.forEach((f: any, i: number) => add(f.textAr, f.textEn, `f${i}.textAr`, `f${i}.textEn`)); p.specs.forEach((x: any, i: number) => add(x.nameAr, x.nameEn, `s${i}.nameAr`, `s${i}.nameEn`));
    if (!Object.keys(toEn).length && !Object.keys(toAr).length) return toast("كل الحقول مترجمة بالفعل");
    setTr(true); const x = await post("/api/admin/translate", { toEn, toAr }); setTr(false);
    if (!x.ok) return toast(x.data.error || "تعذرت الترجمة", { tone: "err" });
    const t = x.data as Record<string, string>;
    setP((o: any) => ({ ...o, ...Object.fromEntries(["nameAr", "nameEn", "descriptionAr", "descriptionEn"].filter((k) => t[k]).map((k) => [k, t[k]])),
      features: o.features.map((f: any, i: number) => ({ ...f, textAr: t[`f${i}.textAr`] ?? f.textAr, textEn: t[`f${i}.textEn`] ?? f.textEn })),
      specs: o.specs.map((s: any, i: number) => ({ ...s, nameAr: t[`s${i}.nameAr`] ?? s.nameAr, nameEn: t[`s${i}.nameEn`] ?? s.nameEn })) }));
    toast(`تمت ترجمة ${Object.keys(t).length} حقل، راجعها ثم احفظ`);
  }
  const dirty = JSON.stringify(p) !== start.current;
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
  async function save() {
    setErr("");
    if (!categories.length) return setErr("أضف تصنيفًا أولًا من صفحة التصنيفات ثم أضف المنتج");
    if (!p.nameAr.trim() && !p.nameEn.trim()) return setErr("اكتب اسم المنتج");
    setBusy(true);
    const x = await post("/api/admin/products", { ...p, categoryId: Number(p.categoryId), price: num(p.price), wholesalePrice: num(p.wholesalePrice), sortOrder: Number(p.sortOrder) || 0 }); setBusy(false);
    if (!x.ok) return setErr(x.data.error?.includes("[") ? "تحقق من الاسم العربي والإنجليزي والتصنيف" : x.data.error);
    toast("تم حفظ المنتج");
    if (x.data.id && !p.id) { start.current = ""; r.replace(`/admin/products/${x.data.id}`); return; }
    // السيرفر قد يضيف الترجمات الناقصة؛ نعرضها مباشرة في النموذج
    const filled = { ...p, nameAr: x.data.nameAr ?? p.nameAr, nameEn: x.data.nameEn ?? p.nameEn, descriptionAr: x.data.descriptionAr ?? p.descriptionAr, descriptionEn: x.data.descriptionEn ?? p.descriptionEn,
      features: x.data.features ?? p.features, specs: x.data.specs ?? p.specs };
    start.current = JSON.stringify(filled); setP(filled); r.refresh();
  }
  async function remove() { if (!confirm("حذف المنتج نهائيًا؟ لا يمكن التراجع.")) return; const x = await fetch(`/api/admin/products?id=${p.id}`, { method: "DELETE" }); if (x.ok) { start.current = JSON.stringify(p); toast("تم حذف المنتج"); r.push("/admin/products"); } else setErr((await x.json()).error); }
  const rowBtn = "btn-icon w-10 h-10 text-steel hover:text-accent hover:bg-accent/5 shrink-0";
  return (<div>
    <PageHead title={p.id ? "تعديل منتج" : "إضافة منتج"} back={["/admin/products", "المنتجات"]}>{p.id && p.slug && <a href={`/products/${p.slug}`} target="_blank" className="btn btn-md btn-ghost"><Icon n="external" s={18} />عرض في المتجر</a>}</PageHead>
    <div className="grid lg:grid-cols-[1fr_320px] gap-4 md:gap-5 items-start">
      <div className="space-y-4 md:space-y-5 min-w-0">
        <Card title="البيانات الأساسية" desc={ai ? "اكتب بالعربية فقط؛ الحقول الإنجليزية الفارغة تُترجم تلقائيًا عند الحفظ." : undefined}
          action={<button type="button" onClick={autoTranslate} disabled={!ai || tr} title={ai ? "" : "أضف ANTHROPIC_API_KEY في .env لتفعيل الترجمة"} className="btn btn-sm btn-ghost"><Icon n="globe" s={16} />{tr ? "جارٍ الترجمة..." : "ترجمة تلقائية"}</button>}>
          {!ai && <p className="mb-3 flex items-start gap-2 rounded-xl bg-soft p-3 text-xs text-steel leading-5"><Icon n="info" s={16} className="mt-0.5" />الترجمة التلقائية غير مفعّلة. أضف <code dir="ltr">ANTHROPIC_API_KEY</code> في ملف <code>.env</code> لتفعيلها. الحقول الإنجليزية اختيارية، وإن تُركت فارغة يظهر النص العربي.</p>}
          <div className="space-y-3">
          <div className="grid sm:grid-cols-2 gap-3"><Field label="الاسم بالعربية *"><input className="field" value={p.nameAr} onChange={(e) => set("nameAr", e.target.value)} /></Field><Field label={`Name (English)${ai ? " · تلقائي" : ""}`}><input className="field" dir="ltr" placeholder={ai ? "يُترجم تلقائيًا إن تُرك فارغًا" : ""} value={p.nameEn} onChange={(e) => set("nameEn", e.target.value)} /></Field></div>
          <Field label="الوصف (عربي)"><textarea rows={4} className="field" value={p.descriptionAr ?? ""} onChange={(e) => set("descriptionAr", e.target.value)} /></Field>
          <Field label={`Description (English)${ai ? " · تلقائي" : ""}`}><textarea rows={4} dir="ltr" className="field" placeholder={ai ? "يُترجم تلقائيًا إن تُرك فارغًا" : ""} value={p.descriptionEn ?? ""} onChange={(e) => set("descriptionEn", e.target.value)} /></Field></div></Card>

        <Card title="الصور" desc="الصورة الأولى هي الرئيسية في البطاقات. اسحب الصور هنا أو اضغط للرفع (JPG / PNG / WEBP حتى 8MB).">
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

        <Card title="المميزات" desc="نقاط قصيرة تظهر بجانب السعر في صفحة المنتج." action={<button className="btn btn-sm btn-ghost" onClick={() => set("features", [...p.features, { textAr: "", textEn: "" }])}><Icon n="plus" s={16} />ميزة</button>}>
          {p.features.length === 0 ? <p className="text-sm text-steel">لا توجد مميزات. اضغط «ميزة» للإضافة.</p> : <div className="space-y-2">{p.features.map((x: any, n: number) => (<div key={n} className="flex gap-2 items-start">
            <div className="flex-1 grid sm:grid-cols-2 gap-2"><input className="field h-11" placeholder="الميزة بالعربية" value={x.textAr} onChange={(e) => setList("features", n, "textAr", e.target.value)} /><input className="field h-11" dir="ltr" placeholder={ai ? "English (تلقائي)" : "English (اختياري)"} value={x.textEn} onChange={(e) => setList("features", n, "textEn", e.target.value)} /></div>
            <button aria-label="حذف" onClick={() => del("features", n)} className={rowBtn}><Icon n="trash" s={18} /></button></div>))}</div>}</Card>

        <Card title="المواصفات" desc="أي مواصفة تناسب المنتج: القوة، السرعة، السعة، الوزن..." action={<button className="btn btn-sm btn-ghost" onClick={() => set("specs", [...p.specs, { nameAr: "", nameEn: "", value: "" }])}><Icon n="plus" s={16} />مواصفة</button>}>
          {p.specs.length === 0 ? <p className="text-sm text-steel">لا توجد مواصفات. اضغط «مواصفة» للإضافة.</p> : <div className="space-y-2">{p.specs.map((x: any, n: number) => (<div key={n} className="flex gap-2 items-start rounded-xl sm:rounded-none bg-soft sm:bg-transparent p-2 sm:p-0">
            <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 gap-2"><input className="field h-11" placeholder="الاسم (عربي)" value={x.nameAr} onChange={(e) => setList("specs", n, "nameAr", e.target.value)} /><input className="field h-11" dir="ltr" placeholder={ai ? "Name (تلقائي)" : "Name"} value={x.nameEn} onChange={(e) => setList("specs", n, "nameEn", e.target.value)} /><input className="field h-11 col-span-2 sm:col-span-1" dir="ltr" placeholder="Value: 20V" value={x.value} onChange={(e) => setList("specs", n, "value", e.target.value)} /></div>
            <div className="flex flex-col sm:flex-row"><button aria-label="أعلى" onClick={() => move("specs", n, -1)} className="btn-icon w-9 h-10 text-steel hover:text-ink"><Icon n="arrowUp" s={16} /></button><button aria-label="حذف" onClick={() => del("specs", n)} className={rowBtn}><Icon n="trash" s={18} /></button></div></div>))}</div>}</Card>

        <Card title="ملفات PDF" desc="كتالوج أو دليل استخدام يظهر للعميل للتحميل.">
          <div className="space-y-2">{p.documents.map((x: any, n: number) => (<div key={n} className="flex gap-2 items-center"><span className="w-10 h-10 rounded-xl bg-accent/10 text-accent grid place-items-center shrink-0"><Icon n="doc" s={18} /></span><input className="field h-11 flex-1" placeholder="عنوان الملف" value={x.title} onChange={(e) => setList("documents", n, "title", e.target.value)} /><a href={x.url} target="_blank" className="btn-icon w-10 h-10 text-steel hover:text-ink" aria-label="فتح"><Icon n="external" s={18} /></a><button aria-label="حذف" onClick={() => del("documents", n)} className={rowBtn}><Icon n="trash" s={18} /></button></div>))}</div>
          <label className="mt-3 btn btn-md btn-ghost cursor-pointer"><input type="file" hidden accept="application/pdf" onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) upload([f], (url, ff) => setP((o: any) => ({ ...o, documents: [...o.documents, { title: ff.name.replace(/\.pdf$/i, ""), url }] }))); }} /><Icon n="upload" s={18} />رفع ملف PDF</label></Card>
      </div>

      <div className="space-y-4 md:space-y-5 lg:sticky lg:top-6">
        <Card title="النشر"><div className="divide-y divide-line -my-1">
          <div className="py-2"><Switch label="المنتج ظاهر" hint="المخفي لا يظهر للعملاء" on={p.isActive} onChange={(v) => set("isActive", v)} /></div>
          <div className="py-2"><Switch label="مميز" hint="يظهر في الرئيسية" on={p.isFeatured} onChange={(v) => set("isFeatured", v)} /></div>
          <div className="py-2"><Switch label="متوفر" on={p.inStock} onChange={(v) => set("inStock", v)} /></div>
          <div className="py-2"><Switch label="السماح بالإضافة للسلة" on={p.allowCart} onChange={(v) => set("allowCart", v)} /></div></div></Card>
        <Card title="الأسعار" desc="سعر الجملة يراه فقط من أدخل كود الجملة؛ إن تركته فارغًا يرى السعر العادي."><div className="space-y-3">
          <Field label="السعر العادي (ريال)"><input className="field" type="number" inputMode="decimal" min="0" step="0.01" dir="ltr" value={p.price ?? ""} onChange={(e) => set("price", e.target.value)} /></Field>
          <Switch label="إظهار السعر العادي" hint="إن أُخفي يظهر «تواصل معنا» ويبقى السعر محفوظًا" on={p.showPrice} onChange={(v) => set("showPrice", v)} />
          <Field label="سعر الجملة (ريال)"><input className="field" type="number" inputMode="decimal" min="0" step="0.01" dir="ltr" value={p.wholesalePrice ?? ""} onChange={(e) => set("wholesalePrice", e.target.value)} /></Field></div></Card>
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
        <button disabled={busy || ups > 0} onClick={save} className="btn btn-lg btn-lime flex-1 sm:flex-none sm:min-w-[180px]">{busy ? (ai ? "جارٍ الحفظ والترجمة..." : "جارٍ الحفظ...") : <><Icon n="check" s={20} />حفظ المنتج</>}</button>
      </div></div>
  </div>);
}
