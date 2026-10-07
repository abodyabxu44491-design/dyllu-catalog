"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Icon, { type IconName } from "@/components/Icon";
import AdCanvas, { TEMPLATES, type AdData, type AdKind } from "@/components/ads/AdCanvas";
import { post, uploadFile } from "@/lib/client";
import { toast } from "@/store/toast";
import { AEmpty, Badge, Field, PageHead } from "./ui";
import Switch from "./Switch";
export type Prod = { id: number; slug: string; sku: string | null; nameAr: string; nameEn: string; price: number | null; showPrice: boolean; images: string[]; category: string; isActive?: boolean };
type B = { id?: number; type: AdKind; image: string; productId?: number | null; product?: Prod | null; template: string; showPrice: boolean; titleAr?: string | null; titleEn?: string | null; subtitleAr?: string | null; subtitleEn?: string | null; buttonAr?: string | null; buttonEn?: string | null; badgeAr?: string | null; badgeEn?: string | null; linkUrl?: string | null; seconds: number; startsAt?: string | null; endsAt?: string | null; isActive: boolean };
type Cat = { slug: string; nameAr: string };
const blank: B = { type: "PRODUCT", image: "", productId: null, product: null, template: "spotlight", showPrice: true, titleAr: "", titleEn: "", subtitleAr: "", subtitleEn: "", buttonAr: "", buttonEn: "", badgeAr: "", badgeEn: "", linkUrl: "", seconds: 5, startsAt: "", endsAt: "", isActive: true };
const BADGES = ["جديد", "الأكثر مبيعًا", "عرض خاص", "خصم 10%", "خصم 20%", "كمية محدودة"];
const KINDS: [AdKind, string, string, IconName][] = [["PRODUCT", "إعلان منتج", "اختر منتجًا ويُصمَّم الإعلان تلقائيًا، والضغط يفتح المنتج", "box"], ["IMAGE_TEXT", "صورة + نص", "صورتك مع عنوان وزر ورابط", "image"], ["IMAGE", "صورة فقط", "تصميم جاهز من عندك كصورة كاملة", "megaphone"]];
const toLocal = (iso?: string | null) => { if (!iso) return ""; const d = new Date(iso); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 16); };
const status = (b: B): [string, string] => !b.isActive ? ["موقوف", "bg-soft text-steel"] : b.type === "PRODUCT" && b.product && b.product.isActive === false ? ["المنتج مخفي", "bg-accent text-white"] : b.startsAt && new Date(b.startsAt) > new Date() ? ["مجدول", "bg-ink text-white"] : b.endsAt && new Date(b.endsAt) < new Date() ? ["منتهي", "bg-accent text-white"] : ["ساري", "bg-lime text-ink"];
// تحويل بيانات المحرر إلى تصميم الإعلان (نفس ما يظهر للعميل بالعربية)
function toAd(v: B, cur: string, template = v.template): AdData {
  const p = v.product;
  if (v.type === "PRODUCT") return { kind: "PRODUCT", template, rtl: true, image: v.image || p?.images[0] || "", title: v.titleAr || p?.nameAr || "اسم المنتج", subtitle: v.subtitleAr || p?.category || "", button: v.buttonAr || "اطلب الآن", badge: v.badgeAr || "", price: v.showPrice && p?.showPrice && p.price != null ? `${p.price.toLocaleString("en-US")} ${cur}` : null, sku: p?.sku };
  return { kind: v.type, template: "", rtl: true, image: v.image, title: v.type === "IMAGE_TEXT" ? v.titleAr || "" : "", subtitle: v.type === "IMAGE_TEXT" ? v.subtitleAr || "" : "", button: v.type === "IMAGE_TEXT" && v.linkUrl ? v.buttonAr || "" : "", badge: "", price: null };
}
const Frame = ({ ad, ratio = "aspect-[16/9]", className = "" }: { ad: AdData; ratio?: string; className?: string }) => <div className={`relative ${ratio} rounded-2xl overflow-hidden bg-soft ${className}`}><AdCanvas ad={ad} /></div>;
const Step = ({ n, t, children, hint }: { n: number; t: string; hint?: string; children: React.ReactNode }) => (<section className="space-y-3">
  <h3 className="font-sans text-sm font-extrabold flex items-center gap-2"><span className="w-6 h-6 rounded-full bg-ink text-lime text-xs grid place-items-center">{n}</span>{t}</h3>{hint && <p className="text-xs text-steel -mt-1 leading-5">{hint}</p>}{children}</section>);
// منتقي المنتج: بحث فوري بالاسم أو الموديل مع صور مصغّرة
function ProductPicker({ value, onPick }: { value: Prod | null | undefined; onPick: (p: Prod) => void }) {
  const [q, setQ] = useState(""), [list, setList] = useState<Prod[]>([]), [open, setOpen] = useState(!value), [busy, setBusy] = useState(false);
  useEffect(() => { if (!open) return; setBusy(true); const c = new AbortController(); const t = setTimeout(() => fetch(`/api/admin/products?q=${encodeURIComponent(q)}`, { signal: c.signal }).then((r) => r.json()).then((x) => { setList(Array.isArray(x) ? x : []); setBusy(false); }).catch(() => {}), 200); return () => { clearTimeout(t); c.abort(); }; }, [q, open]);
  if (value && !open) return (<div className="flex items-center gap-3 rounded-2xl border-2 border-lime bg-white p-2.5">
    <span className="w-14 h-14 rounded-xl bg-soft overflow-hidden shrink-0">{value.images[0] && <img src={value.images[0]} alt="" className="w-full h-full object-contain" />}</span>
    <span className="flex-1 min-w-0"><b className="block text-sm truncate">{value.nameAr || value.nameEn}</b><small className="text-xs text-steel">{value.category}{value.sku ? ` · ${value.sku}` : ""}{value.price != null ? ` · ${value.price}` : ""}</small></span>
    <button type="button" onClick={() => setOpen(true)} className="btn btn-sm btn-ghost">تغيير</button></div>);
  return (<div className="rounded-2xl border border-line bg-white overflow-hidden">
    <div className="relative p-2 border-b border-line"><Icon n="search" s={18} className="absolute start-5 top-1/2 -translate-y-1/2 text-steel" /><input autoFocus className="field h-11 ps-10" placeholder="ابحث باسم المنتج أو رقم الموديل" value={q} onChange={(e) => setQ(e.target.value)} /></div>
    <div className="max-h-72 overflow-y-auto divide-y divide-line">{busy && !list.length ? <div className="p-3 space-y-2">{[0, 1, 2].map((i) => <div key={i} className="skeleton h-12" />)}</div>
      : list.length === 0 ? <p className="p-5 text-center text-sm text-steel">لا توجد منتجات مطابقة</p>
      : list.map((p) => <button type="button" key={p.id} onClick={() => { onPick(p); setOpen(false); }} className={`w-full flex items-center gap-3 p-2.5 text-start hover:bg-soft ${value?.id === p.id ? "bg-lime/20" : ""}`}>
        <span className="w-11 h-11 rounded-lg bg-soft overflow-hidden shrink-0">{p.images[0] && <img src={p.images[0]} alt="" className="w-full h-full object-contain" />}</span>
        <span className="flex-1 min-w-0"><b className="block text-sm truncate">{p.nameAr || p.nameEn}</b><small className="text-xs text-steel">{p.category}{p.sku ? ` · ${p.sku}` : ""}</small></span>
        {p.price != null && <b className="text-xs">{p.price}</b>}</button>)}</div>
    {value && <button type="button" onClick={() => setOpen(false)} className="w-full p-2.5 text-sm font-bold text-steel bg-soft hover:bg-line">إلغاء</button>}
  </div>);
}
function Editor({ b0, cats, cur, onDone }: { b0: B; cats: Cat[]; cur: string; onDone: () => void }) {
  const r = useRouter(), [v, setV] = useState<B>({ ...b0, startsAt: toLocal(b0.startsAt), endsAt: toLocal(b0.endsAt) }), [msg, setMsg] = useState(""), [busy, setBusy] = useState(false), [up, setUp] = useState(false), [device, setDevice] = useState<"m" | "d">("d");
  useEffect(() => { if (window.innerWidth < 1024) setDevice("m"); }, []);
  const set = <K extends keyof B>(k: K, x: B[K]) => setV((o) => ({ ...o, [k]: x })), prod = v.type === "PRODUCT", ad = toAd(v, cur);
  async function upload(f?: File) { if (!f) return; setUp(true); try { set("image", await uploadFile(f)); } catch (x) { setMsg((x as Error).message); } setUp(false); }
  async function save() {
    setMsg(""); setBusy(true);
    const { product: _p, ...body } = v;
    const x = await post("/api/admin/banners", { ...body, productId: prod ? v.product?.id ?? null : null, seconds: Number(v.seconds) || 5, startsAt: v.startsAt ? new Date(v.startsAt).toISOString() : null, endsAt: v.endsAt ? new Date(v.endsAt).toISOString() : null, linkUrl: v.linkUrl || null });
    setBusy(false); if (x.ok) { toast(v.id ? "تم حفظ الإعلان" : "تم نشر الإعلان"); onDone(); r.refresh(); } else setMsg(x.data.error || "تحقق من بيانات الإعلان");
  }
  async function del() { if (confirm("حذف الإعلان؟")) { await fetch(`/api/admin/banners?id=${v.id}`, { method: "DELETE" }); toast("تم حذف الإعلان"); onDone(); r.refresh(); } }
  const step = (d: number) => set("seconds", Math.max(2, Math.min(30, (Number(v.seconds) || 5) + d)));
  let n = 1;
  return (<div className="border-t border-line bg-soft/40 grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] gap-6 p-4 md:p-5">
    <div className="space-y-6 min-w-0">
      <Step n={n++} t="نوع الإعلان"><div className="grid grid-cols-3 gap-2">{KINDS.map(([k, l, h, i]) => <button type="button" key={k} onClick={() => set("type", k)} className={`text-start rounded-2xl border-2 p-3 transition ${v.type === k ? "border-ink bg-white shadow-card" : "border-line bg-white hover:border-steel/40"}`}>
        <span className={`w-9 h-9 rounded-xl grid place-items-center mb-2 ${v.type === k ? "bg-lime text-ink" : "bg-soft text-steel"}`}><Icon n={i} s={18} /></span><b className="block text-xs sm:text-sm">{l}</b><small className="hidden sm:block text-xs text-steel leading-5 mt-0.5">{h}</small></button>)}</div></Step>

      {prod ? <>
        <Step n={n++} t="المنتج" hint="الإعلان يأخذ الاسم والصورة والسعر من المنتج، والضغط عليه يفتح صفحة المنتج مباشرة."><ProductPicker value={v.product} onPick={(p) => setV((o) => ({ ...o, product: p, productId: p.id, image: "" }))} /></Step>
        {v.product && <>
          <Step n={n++} t="القالب"><div className="grid grid-cols-2 xl:grid-cols-3 gap-2">{TEMPLATES.map((t) => <button type="button" key={t.id} onClick={() => set("template", t.id)} className={`rounded-2xl p-1.5 text-start transition ${v.template === t.id ? "bg-ink text-white" : "bg-white hover:bg-line"}`}>
            <Frame ad={toAd(v, cur, t.id)} ratio="aspect-[2.6/1]" className="rounded-xl pointer-events-none" /><b className="flex items-center gap-1.5 text-xs px-1.5 pt-1.5 pb-0.5">{v.template === t.id && <Icon n="check" s={14} stroke={3} className="text-lime" />}{t.ar}</b></button>)}</div></Step>
          <Step n={n++} t="الصورة" hint="صورة PNG بخلفية شفافة تعطي أجمل نتيجة.">
            <div className="flex flex-wrap gap-2">{v.product.images.map((src, i) => { const on = (v.image || v.product!.images[0]) === src; return <button type="button" key={src} onClick={() => set("image", i === 0 ? "" : src)} className={`w-16 h-16 rounded-xl bg-white border-2 overflow-hidden ${on ? "border-accent" : "border-line"}`} aria-label={`صورة ${i + 1}`}><img src={src} alt="" className="w-full h-full object-contain p-1" /></button>; })}
              <label className="w-16 h-16 rounded-xl border-2 border-dashed border-line bg-white grid place-items-center cursor-pointer text-steel hover:border-steel" title="رفع صورة مخصصة"><input type="file" hidden accept="image/png,image/webp,image/jpeg" onChange={(e) => { upload(e.target.files?.[0]); e.target.value = ""; }} />{up ? <small className="text-[10px] font-bold">...</small> : <Icon n="upload" s={20} />}</label>
              {v.image && !v.product.images.includes(v.image) && <span className="w-16 h-16 rounded-xl bg-white border-2 border-accent overflow-hidden"><img src={v.image} alt="" className="w-full h-full object-contain p-1" /></span>}</div></Step>
          <Step n={n++} t="النصوص" hint="اتركها فارغة لاستخدام بيانات المنتج تلقائيًا. النسخة الإنجليزية تُترجم تلقائيًا.">
            <Field label="العنوان"><input className="field" placeholder={v.product.nameAr} maxLength={160} value={v.titleAr ?? ""} onChange={(e) => set("titleAr", e.target.value)} /></Field>
            <Field label="نص قصير"><input className="field" placeholder={v.product.category} maxLength={160} value={v.subtitleAr ?? ""} onChange={(e) => set("subtitleAr", e.target.value)} /></Field>
            <Field label="شارة العرض (اختياري)"><input className="field" placeholder="مثال: خصم 15%" maxLength={30} value={v.badgeAr ?? ""} onChange={(e) => set("badgeAr", e.target.value)} /></Field>
            <div className="flex flex-wrap gap-1.5 -mt-1">{BADGES.map((x) => <button type="button" key={x} onClick={() => set("badgeAr", v.badgeAr === x ? "" : x)} className={`chip h-8 text-xs ${v.badgeAr === x ? "chip-on" : "chip-off"}`}>{x}</button>)}</div>
            <div className="grid sm:grid-cols-2 gap-3 items-end"><Field label="نص الزر"><input className="field" placeholder="اطلب الآن" maxLength={30} value={v.buttonAr ?? ""} onChange={(e) => set("buttonAr", e.target.value)} /></Field>
              <div className="pb-1.5"><Switch label="إظهار السعر" hint={v.product.price == null || !v.product.showPrice ? "سعر المنتج مخفي" : "يتغير تلقائيًا لعملاء الجملة"} on={v.showPrice} onChange={(x) => set("showPrice", x)} /></div></div>
          </Step></>}
      </> : <>
        <Step n={n++} t="الصورة" hint="المقاس المثالي 1800×600 للكمبيوتر، ويُقص تلقائيًا على الجوال.">
          <label className="btn btn-lg btn-ghost w-full cursor-pointer border-dashed border-2"><input type="file" hidden accept="image/jpeg,image/png,image/webp" onChange={(e) => { upload(e.target.files?.[0]); e.target.value = ""; }} /><Icon n="upload" s={18} />{up ? "جارٍ الرفع..." : v.image ? "تغيير الصورة" : "رفع صورة الإعلان"}</label></Step>
        {v.type === "IMAGE_TEXT" && <Step n={n++} t="النصوص" hint="النسخة الإنجليزية تُترجم تلقائيًا."><Field label="العنوان"><input className="field" maxLength={160} value={v.titleAr ?? ""} onChange={(e) => set("titleAr", e.target.value)} /></Field><Field label="نص قصير"><input className="field" maxLength={160} value={v.subtitleAr ?? ""} onChange={(e) => set("subtitleAr", e.target.value)} /></Field><Field label="نص الزر"><input className="field" placeholder="تسوّق الآن" maxLength={30} value={v.buttonAr ?? ""} onChange={(e) => set("buttonAr", e.target.value)} /></Field></Step>}
        <Step n={n++} t="عند الضغط يذهب إلى"><select className="field" value="" onChange={(e) => e.target.value && set("linkUrl", e.target.value === "-" ? "" : e.target.value)}><option value="">اختر وجهة سريعة...</option><option value="-">بدون رابط</option><option value="/products">كل المنتجات</option><option value="/products?featured=1">المنتجات المميزة</option><option value="/categories">كل التصنيفات</option><option value="/catalog">قائمة الأسعار</option>{cats.map((c) => <option key={c.slug} value={`/categories/${c.slug}`}>{c.nameAr}</option>)}</select>
          <input className="field" dir="ltr" placeholder="أو اكتب رابطًا: /products أو https://..." value={v.linkUrl ?? ""} onChange={(e) => set("linkUrl", e.target.value)} /></Step>
      </>}
      <Step n={n++} t="العرض والجدولة">
        <div className="flex items-center justify-between gap-3"><b className="text-sm">مدة الظهور (ثوانٍ)</b><div className="flex items-center rounded-xl border border-line bg-white"><button type="button" className="btn-icon w-11 h-11" onClick={() => step(-1)} aria-label="أقل"><Icon n="minus" s={16} /></button><span className="w-10 text-center font-extrabold">{v.seconds}</span><button type="button" className="btn-icon w-11 h-11" onClick={() => step(1)} aria-label="أكثر"><Icon n="plus" s={16} /></button></div></div>
        <Switch label="الإعلان فعّال" on={v.isActive} onChange={(x) => set("isActive", x)} />
        <div className="grid sm:grid-cols-2 gap-3"><Field label="يبدأ في (اختياري)"><input className="field" type="datetime-local" value={v.startsAt ?? ""} onChange={(e) => set("startsAt", e.target.value)} /></Field><Field label="ينتهي في (اختياري)"><input className="field" type="datetime-local" value={v.endsAt ?? ""} onChange={(e) => set("endsAt", e.target.value)} /></Field></div>
      </Step>
    </div>
    {/* المعاينة الحية: جوال = ثابتة أعلى المحرر وأزرار الحفظ في آخره · كمبيوتر = عمود جانبي ثابت */}
    <div className="contents lg:block lg:sticky lg:top-6 lg:self-start lg:space-y-3 min-w-0">
      <div className="order-first lg:order-none sticky top-14 lg:static z-20 -mx-4 px-4 py-2 lg:m-0 lg:p-0 bg-soft/95 lg:bg-transparent backdrop-blur lg:backdrop-blur-none space-y-2">
      <div className="flex items-center justify-between gap-2"><b className="text-sm flex items-center gap-2"><Icon n="eye" s={18} />المعاينة</b>
        <div className="flex rounded-xl bg-white border border-line p-1" role="tablist">{([["d", "كمبيوتر"], ["m", "جوال"]] as const).map(([k, l]) => <button type="button" key={k} role="tab" aria-selected={device === k} onClick={() => setDevice(k)} className={`px-3 h-8 rounded-lg text-xs font-bold ${device === k ? "bg-ink text-white" : "text-steel"}`}>{l}</button>)}</div></div>
      <div className={device === "m" ? "max-w-[340px] mx-auto rounded-[28px] border-[6px] border-ink p-2 bg-white" : ""}><Frame ad={ad} ratio={device === "m" ? "aspect-[16/9]" : "aspect-[3/1]"} /></div>
      </div>
      <div className="order-last lg:order-none space-y-3">
      <p className="text-xs text-steel flex items-center gap-1.5"><Icon n="external" s={14} />عند الضغط: {prod ? (v.product ? <b className="text-ink">صفحة المنتج «{v.product.nameAr || v.product.nameEn}»</b> : "اختر المنتج") : v.linkUrl ? <b className="text-ink" dir="ltr">{v.linkUrl}</b> : "بدون رابط"}</p>
      {msg && <p className="text-accent text-sm font-bold flex items-center gap-2 bg-accent/10 rounded-xl p-3"><Icon n="alert" s={16} />{msg}</p>}
      <div className="flex flex-wrap gap-2"><button type="button" disabled={busy || up} onClick={save} className="btn btn-lg btn-lime flex-1">{busy ? "جارٍ الحفظ..." : <><Icon n="check" s={18} />{v.id ? "حفظ التعديلات" : "نشر الإعلان"}</>}</button><button type="button" onClick={onDone} className="btn btn-lg btn-ghost">إلغاء</button>{v.id && <button type="button" onClick={del} className="btn btn-lg btn-danger" aria-label="حذف الإعلان"><Icon n="trash" s={18} /></button>}</div>
      </div>
    </div>
  </div>);
}
export default function BannersManager({ initial, cats, cur }: { initial: B[]; cats: Cat[]; cur: string }) {
  const r = useRouter(), [open, setOpen] = useState<number | "new" | null>(initial.length ? null : "new"), live = initial.filter((b) => status(b)[0] === "ساري").length;
  async function move(id: number, dir: number) { await post("/api/admin/banners", { action: "move", id, dir }); r.refresh(); }
  return (<div className="max-w-6xl">
    <PageHead title="الإعلانات" desc={`سلايدر أعلى الرئيسية بالترتيب. اختر منتجًا ويُصمَّم إعلانه تلقائيًا بهوية DYLLU. يظهر للعملاء الآن ${live} إعلان.`}><button onClick={() => setOpen(open === "new" ? null : "new")} className="btn btn-md btn-lime"><Icon n="plus" s={18} />إعلان جديد</button></PageHead>
    {open === "new" && <div className="card overflow-hidden mb-4"><b className="block px-4 md:px-5 pt-4">إعلان جديد</b><Editor b0={blank} cats={cats} cur={cur} onDone={() => setOpen(null)} /></div>}
    <div className="card overflow-hidden divide-y divide-line">{initial.map((b, i) => { const st = status(b), isOpen = open === b.id; return (<div key={b.id}>
      <div className="flex items-center gap-3 p-3"><button onClick={() => setOpen(isOpen ? null : b.id!)} className="flex items-center gap-3 flex-1 min-w-0 text-start" aria-expanded={isOpen}>
        <span className="w-32 sm:w-44 shrink-0"><Frame ad={toAd(b, cur)} ratio="aspect-[2.6/1]" className="rounded-xl pointer-events-none" /></span>
        <span className="min-w-0 flex-1 space-y-1"><span className="flex flex-wrap gap-1"><Badge cls={st[1]}>{st[0]}</Badge><Badge>{KINDS.find(([k]) => k === b.type)?.[1]}</Badge></span>
          <b className="block truncate text-sm">{b.type === "PRODUCT" ? b.titleAr || b.product?.nameAr || "منتج محذوف" : b.type === "IMAGE" ? "صورة فقط" : b.titleAr || "بدون عنوان"}</b>
          <small className="text-xs text-steel">{b.seconds} ثوانٍ{b.type === "PRODUCT" ? " · يفتح المنتج" : b.linkUrl ? " · له رابط" : ""}</small></span></button>
        <div className="flex flex-col gap-1 shrink-0"><button disabled={i === 0} onClick={() => move(b.id!, -1)} className="btn-icon w-9 h-9 border border-line rounded-lg disabled:opacity-30" aria-label="أعلى"><Icon n="arrowUp" s={16} /></button><button disabled={i === initial.length - 1} onClick={() => move(b.id!, 1)} className="btn-icon w-9 h-9 border border-line rounded-lg disabled:opacity-30" aria-label="أسفل"><Icon n="arrowDown" s={16} /></button></div></div>
      {isOpen && <Editor b0={b} cats={cats} cur={cur} onDone={() => setOpen(null)} />}</div>); })}
      {initial.length === 0 && open !== "new" && <AEmpty icon="megaphone" title="لا توجد إعلانات. تظهر الواجهة الثابتة في الرئيسية بدلًا منها." />}</div>
  </div>);
}
