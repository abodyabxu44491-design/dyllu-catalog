"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Icon from "@/components/Icon";
import Modal from "@/components/Modal";
import { post } from "@/lib/client";
import { toast } from "@/store/toast";
import { ask } from "@/store/confirm";
import { AEmpty, Badge, Field, PageHead } from "./ui";
import Switch from "./Switch";
type O = { id?: number; nameAr: string; percent: number; scope: "all" | "categories" | "products"; categoryIds: number[]; productIds: number[]; includeWholesale: boolean; startsAt: string | null; endsAt: string | null; isActive: boolean };
type P = { id: number; nameAr: string; image: string | null };
const blank: O = { nameAr: "", percent: 10, scope: "all", categoryIds: [], productIds: [], includeWholesale: false, startsAt: null, endsAt: null, isActive: true };
const PCTS = [5, 10, 15, 20, 25, 30, 40, 50];
// datetime-local يحتاج الوقت المحلي بصيغة YYYY-MM-DDTHH:mm
const local = (iso: string | null) => { if (!iso) return ""; const d = new Date(iso); return new Date(d.getTime() - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 16); };
// تنسيق يدوي بتوقيت السعودية (UTC+3): نفس النص حرفيًا على السيرفر والمتصفح (مكتبات التاريخ تختلف بينهما)
const MONTHS = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
const fmt = (iso: string) => { const d = new Date(new Date(iso).getTime() + 3 * 36e5), h = d.getUTCHours(); return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${h % 12 || 12}:${String(d.getUTCMinutes()).padStart(2, "0")} ${h < 12 ? "ص" : "م"}`; };
function status(o: O, now: number): [string, string] {
  if (!o.isActive) return ["موقوف", "bg-soft text-steel"];
  if (o.endsAt && new Date(o.endsAt).getTime() <= now) return ["منتهي", "bg-soft text-steel"];
  if (o.startsAt && new Date(o.startsAt).getTime() > now) return ["مجدول", "bg-ink text-lime"];
  return ["فعّال الآن", "bg-lime text-ink"];
}

// اختيار منتجات بالبحث (للعروض على منتجات محددة)
function ProductPicker({ value, known, onChange }: { value: number[]; known: Map<number, P>; onChange: (ids: number[], p?: P) => void }) {
  const [q, setQ] = useState(""), [list, setList] = useState<P[]>([]);
  useEffect(() => { const t = setTimeout(() => fetch(`/api/admin/products?q=${encodeURIComponent(q)}`).then((r) => r.json()).then((x) => Array.isArray(x) && setList(x.map((p: { id: number; nameAr: string; images: string[] }) => ({ id: p.id, nameAr: p.nameAr, image: p.images[0] ?? null })))).catch(() => {}), 250); return () => clearTimeout(t); }, [q]);
  return (<div className="space-y-2">
    {value.length > 0 && <div className="flex flex-wrap gap-1.5">{value.map((id) => <span key={id} className="inline-flex items-center gap-1.5 rounded-xl bg-lime/40 ps-2.5 pe-1 h-8 text-xs font-bold">{known.get(id)?.nameAr ?? `#${id}`}
      <button type="button" aria-label="إزالة" onClick={() => onChange(value.filter((x) => x !== id))} className="btn-icon w-6 h-6 rounded-lg hover:bg-white/70"><Icon n="close" s={13} /></button></span>)}</div>}
    <span className="relative block"><Icon n="search" s={17} className="absolute start-3 top-1/2 -translate-y-1/2 text-steel" /><input className="field ps-9 h-11" placeholder="ابحث باسم المنتج أو رقم الموديل" value={q} onChange={(e) => setQ(e.target.value)} aria-label="بحث عن منتج" /></span>
    <div className="max-h-56 overflow-y-auto rounded-xl border border-line divide-y divide-line">{list.map((p) => { const on = value.includes(p.id); return (
      <button type="button" key={p.id} onClick={() => onChange(on ? value.filter((x) => x !== p.id) : [...value, p.id], p)} className={`w-full flex items-center gap-3 p-2 text-start ${on ? "bg-lime/20" : "hover:bg-soft"}`}>
        <span className="w-10 h-10 rounded-lg bg-soft overflow-hidden shrink-0">{p.image && <img src={p.image} alt="" className="w-full h-full object-contain" />}</span>
        <span className="flex-1 min-w-0 text-sm font-bold line-clamp-1">{p.nameAr}</span>
        <span className={`w-6 h-6 rounded-md border-2 grid place-items-center ${on ? "bg-ink border-ink text-lime" : "border-line"}`}>{on && <Icon n="check" s={14} stroke={3} />}</span></button>); })}
      {list.length === 0 && <p className="text-sm text-steel p-3">لا توجد نتائج</p>}</div>
  </div>);
}

function Editor({ o0, cats, known, onClose }: { o0: O; cats: { id: number; nameAr: string }[]; known: Map<number, P>; onClose: () => void }) {
  const r = useRouter(), [v, setV] = useState<O>(o0), [busy, setBusy] = useState(false), [err, setErr] = useState(""), [, bump] = useState(0);
  const set = <K extends keyof O>(k: K, x: O[K]) => setV((o) => ({ ...o, [k]: x }));
  const quick = (days: number | null) => { const s = new Date(); setV((o) => ({ ...o, startsAt: s.toISOString(), endsAt: days ? new Date(s.getTime() + days * 864e5).toISOString() : null })); };
  async function save() {
    setErr(""); setBusy(true);
    const x = await post("/api/admin/offers", { ...v, id: v.id, percent: Number(v.percent) });
    setBusy(false); if (!x.ok) return setErr(x.data.error || "تعذر الحفظ");
    toast(v.id ? "تم حفظ العرض" : "تم إنشاء العرض"); onClose(); r.refresh();
  }
  const scopeTxt = v.scope === "all" ? "كل المنتجات" : v.scope === "categories" ? `${v.categoryIds.length} تصنيف` : `${v.productIds.length} منتج`;
  return (<Modal open onClose={onClose} size="lg" icon="tag" title={v.id ? "تعديل العرض" : "عرض جديد"} sub="خصم بنسبة مئوية لفترة محددة. السعر القديم يظهر مشطوبًا والطلب يُحسب بالسعر بعد الخصم.">
    <div className="space-y-5">
      <Field label="اسم العرض *" hint="يظهر للعميل بجانب السعر، مثل: عروض رمضان"><input className="field" autoFocus value={v.nameAr} onChange={(e) => set("nameAr", e.target.value)} placeholder="مثال: عرض اليوم الوطني" /></Field>
      <div className="space-y-2"><b className="block text-sm">نسبة الخصم</b>
        <div className="flex flex-wrap gap-2">{PCTS.map((p) => <button type="button" key={p} onClick={() => set("percent", p)} className={`chip h-10 ${v.percent === p ? "chip-on" : "chip-off"}`} dir="ltr">{p}%</button>)}
          <span className="relative"><input className="field h-10 w-24 text-center font-bold pe-7" type="number" min={1} max={90} dir="ltr" aria-label="نسبة مخصصة" value={v.percent} onChange={(e) => set("percent", Math.max(0, Math.min(90, Number(e.target.value) || 0)))} /><span className="absolute end-3 top-1/2 -translate-y-1/2 text-steel text-sm">%</span></span></div></div>
      <div className="space-y-2"><b className="block text-sm">يشمل</b>
        <div className="grid grid-cols-3 gap-1 p-1 rounded-2xl bg-soft">{([["all", "كل المنتجات", "box"], ["categories", "تصنيفات", "grid"], ["products", "منتجات محددة", "tag"]] as const).map(([k, l, i]) => (
          <button type="button" key={k} onClick={() => set("scope", k)} className={`flex items-center justify-center gap-1.5 h-10 rounded-xl text-xs sm:text-sm font-bold ${v.scope === k ? "bg-ink text-lime" : "text-steel hover:text-ink"}`}><Icon n={i} s={16} />{l}</button>))}</div>
        {v.scope === "categories" && <div className="flex flex-wrap gap-2 pt-1">{cats.map((c) => { const on = v.categoryIds.includes(c.id); return <button type="button" key={c.id} onClick={() => set("categoryIds", on ? v.categoryIds.filter((x) => x !== c.id) : [...v.categoryIds, c.id])} className={`chip h-9 ${on ? "chip-on" : "chip-off"}`}>{on && <Icon n="check" s={14} stroke={3} />}{c.nameAr}</button>; })}</div>}
        {v.scope === "products" && <ProductPicker value={v.productIds} known={known} onChange={(ids, p) => { if (p) { known.set(p.id, p); bump((n) => n + 1); } set("productIds", ids); }} />}</div>
      <div className="space-y-2"><b className="block text-sm">المدة</b>
        <div className="flex flex-wrap gap-2">{([["يوم", 1], ["أسبوع", 7], ["أسبوعين", 14], ["شهر", 30], ["بدون نهاية", null]] as const).map(([l, d]) => <button type="button" key={l} onClick={() => quick(d)} className="chip chip-off h-9">{l}</button>)}</div>
        <div className="grid sm:grid-cols-2 gap-3"><Field label="يبدأ" hint="فارغ = يبدأ فورًا"><input type="datetime-local" className="field" value={local(v.startsAt)} onChange={(e) => set("startsAt", e.target.value ? new Date(e.target.value).toISOString() : null)} /></Field>
          <Field label="ينتهي" hint="فارغ = بدون نهاية"><input type="datetime-local" className="field" value={local(v.endsAt)} onChange={(e) => set("endsAt", e.target.value ? new Date(e.target.value).toISOString() : null)} /></Field></div></div>
      <div className="grid sm:grid-cols-2 gap-3"><Switch label="يشمل أسعار الجملة" hint="عادة العروض لعملاء التجزئة فقط" on={v.includeWholesale} onChange={(x) => set("includeWholesale", x)} /><Switch label="العرض مفعّل" on={v.isActive} onChange={(x) => set("isActive", x)} /></div>
      <p className="rounded-2xl bg-lime/25 p-3 text-sm leading-6"><b>الملخص:</b> خصم <b dir="ltr">{v.percent}%</b> على {scopeTxt}{v.startsAt ? `، من ${fmt(v.startsAt)}` : "، يبدأ فورًا"}{v.endsAt ? ` حتى ${fmt(v.endsAt)}` : "، بدون تاريخ نهاية"}.</p>
      {err && <p role="alert" className="flex items-center gap-2 text-accent font-bold text-sm"><Icon n="alert" s={16} />{err}</p>}
      <div className="flex flex-col-reverse sm:flex-row gap-2"><button type="button" onClick={onClose} className="btn btn-lg btn-ghost sm:flex-1">إلغاء</button><button type="button" disabled={busy} onClick={save} className="btn btn-lg btn-lime sm:flex-1">{busy ? "..." : <><Icon n="check" s={18} />{v.id ? "حفظ العرض" : "إنشاء العرض"}</>}</button></div>
    </div>
  </Modal>);
}

export default function OffersManager({ initial, cats, products, now }: { initial: O[]; cats: { id: number; nameAr: string }[]; products: P[]; now: number }) {
  const r = useRouter(), [edit, setEdit] = useState<O | null>(null), [known] = useState(() => new Map(products.map((p) => [p.id, p])));
  const catName = (id: number) => cats.find((c) => c.id === id)?.nameAr ?? "";
  async function toggle(o: O, on: boolean) { const x = await post("/api/admin/offers", { id: o.id, isActive: on }, "PATCH"); if (x.ok) { toast(on ? "تم تفعيل العرض" : "تم إيقاف العرض"); r.refresh(); } else toast("تعذر الحفظ", { tone: "err" }); }
  async function remove(o: O) { if (!(await ask({ title: `حذف «${o.nameAr}»؟`, body: "ترجع الأسعار لوضعها الطبيعي فورًا.", ok: "حذف", danger: true }))) return; await fetch(`/api/admin/offers?id=${o.id}`, { method: "DELETE" }); toast("تم حذف العرض"); r.refresh(); }
  return (<div className="max-w-4xl">
    <PageHead title="العروض والخصومات" desc="خصم بنسبة مئوية على كل المنتجات أو تصنيفات أو منتجات محددة، لفترة تحددها. يظهر للعميل السعر القديم مشطوبًا مع شارة الخصم، وقسم «العروض» في الرئيسية.">
      <button onClick={() => setEdit({ ...blank })} className="btn btn-md btn-lime"><Icon n="plus" s={18} />عرض جديد</button></PageHead>
    {initial.length === 0 ? <div className="card"><AEmpty icon="tag" title="لا توجد عروض بعد"><button onClick={() => setEdit({ ...blank })} className="btn btn-md btn-lime"><Icon n="plus" s={18} />أنشئ أول عرض</button></AEmpty></div> :
      <div className="space-y-3">{initial.map((o) => { const [st, cls] = status(o, now); return (
        <div key={o.id} className={`card p-4 flex flex-wrap items-center gap-4 ${st === "فعّال الآن" ? "" : "opacity-90"}`}>
          <span className={`w-16 h-16 rounded-2xl grid place-items-center font-display text-xl shrink-0 ${st === "فعّال الآن" ? "bg-accent text-white" : "bg-soft text-steel"}`} dir="ltr">-{o.percent}%</span>
          <div className="flex-1 min-w-[180px] space-y-1"><div className="flex flex-wrap items-center gap-2"><b>{o.nameAr}</b><Badge cls={cls}>{st}</Badge>{o.includeWholesale && <Badge cls="bg-ink text-lime">يشمل الجملة</Badge>}</div>
            <small className="block text-xs text-steel">{o.scope === "all" ? "كل المنتجات" : o.scope === "categories" ? `التصنيفات: ${o.categoryIds.map(catName).filter(Boolean).join("، ")}` : `${o.productIds.length} منتج: ${o.productIds.slice(0, 3).map((id) => known.get(id)?.nameAr).filter(Boolean).join("، ")}${o.productIds.length > 3 ? "…" : ""}`}</small>
            <small className="flex items-center gap-1 text-xs text-steel"><Icon n="clock" s={13} />{o.startsAt ? `من ${fmt(o.startsAt)}` : "من الآن"}{o.endsAt ? ` حتى ${fmt(o.endsAt)}` : "، بدون نهاية"}</small></div>
          <div className="flex items-center gap-1"><Switch on={o.isActive} onChange={(x) => toggle(o, x)} ariaLabel={`تفعيل ${o.nameAr}`} />
            <button onClick={() => setEdit(o)} aria-label="تعديل" className="btn-icon w-10 h-10 text-steel hover:bg-soft"><Icon n="edit" s={18} /></button>
            <button onClick={() => remove(o)} aria-label="حذف" className="btn-icon w-10 h-10 text-steel hover:text-accent hover:bg-accent/5"><Icon n="trash" s={18} /></button></div>
        </div>); })}</div>}
    {edit && <Editor o0={edit} cats={cats} known={known} onClose={() => setEdit(null)} />}
  </div>);
}
