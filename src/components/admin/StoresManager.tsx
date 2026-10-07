"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Icon from "@/components/Icon";
import { post } from "@/lib/client";
import { toast } from "@/store/toast";
import { drawQr, loadImg, qrSvg } from "@/lib/qrdraw";
import { FORMATS, renderPoster, type PosterFormat } from "@/lib/qrposter";
import { AEmpty, Badge, Field, PageHead } from "./ui";
import Switch from "./Switch";
export type Store = { id: number; name: string; code: string; city: string | null; notes: string | null; scans: number; isActive: boolean; orders: number };
const linkFor = (base: string, code?: string) => (code ? `${base}/?src=${encodeURIComponent(code)}` : base);
const file = (s?: Store) => `dyllu-qr-${s?.code ?? "catalog"}`;
function download(href: string, name: string) { const a = document.createElement("a"); a.href = href; a.download = name; a.click(); }
async function share(url: string, title: string) {
  if (navigator.share) { try { await navigator.share({ title, text: title, url }); return; } catch { return; } }
  try { await navigator.clipboard.writeText(url); toast("تم نسخ الرابط"); } catch { prompt("الرابط", url); }
}
// معاينة الرمز داخل البطاقة (نفس رسم الطباعة بدقة أقل)
function QrThumb({ url, size = 168 }: { url: string; size?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => { let off = false; loadImg("/brand/logo-badge.png").then((logo) => { const c = ref.current; if (!c || off) return; const k = 2; c.width = c.height = size * k; drawQr(c.getContext("2d")!, url, 0, 0, size * k, { logo }); }); return () => { off = true; }; }, [url, size]);
  return <canvas ref={ref} style={{ width: size, height: size }} className="rounded-2xl" aria-label="QR" />;
}
// مصمم الطباعة: اختيار المقاس والنصوص ومعاينة حية ثم تحميل PNG أو طباعة مباشرة
function Designer({ url, store, onClose }: { url: string; store?: Store; onClose: () => void }) {
  const [f, setF] = useState<PosterFormat>("a5"), [headline, setHeadline] = useState("امسح الرمز وتصفّح الكتالوج"), [sub, setSub] = useState("اطلب مباشرة عبر واتساب"), [busy, setBusy] = useState(true), ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => { const c = ref.current; if (!c) return; setBusy(true); renderPoster(c, f, { url, store: store?.name, headline, sub }).then(() => setBusy(false)); }, [f, headline, sub, url, store]);
  useEffect(() => { const k = (e: KeyboardEvent) => e.key === "Escape" && onClose(); addEventListener("keydown", k); document.body.style.overflow = "hidden"; return () => { removeEventListener("keydown", k); document.body.style.overflow = ""; }; }, [onClose]);
  const spec = FORMATS.find((x) => x.id === f)!;
  function print() {
    const src = ref.current!.toDataURL("image/png"), fr = document.createElement("iframe"); fr.style.cssText = "position:fixed;width:0;height:0;border:0"; document.body.appendChild(fr);
    const d = fr.contentDocument!; d.open(); d.write(`<!doctype html><html><head><style>@page{margin:0}html,body{margin:0;height:100%;display:grid;place-items:center}img{max-width:100%;max-height:100vh}</style></head><body><img src="${src}"></body></html>`); d.close();
    fr.contentWindow!.onload = () => { fr.contentWindow!.print(); setTimeout(() => fr.remove(), 1500); };
  }
  return (<div className="fixed inset-0 z-[70] bg-ink/70 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-6" onClick={onClose}>
    <div role="dialog" aria-modal="true" aria-label="تصميم للطباعة" className="animate-rise bg-white w-full sm:max-w-4xl max-h-[94vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
      <div className="sticky top-0 z-10 bg-white flex items-center justify-between gap-3 px-4 md:px-6 py-3 border-b border-line"><b className="flex items-center gap-2"><Icon n="print" s={20} className="text-accent" />تصميم للطباعة{store && <span className="text-steel font-normal text-sm">· {store.name}</span>}</b><button onClick={onClose} aria-label="إغلاق" className="btn-icon w-10 h-10 hover:bg-soft"><Icon n="close" s={22} /></button></div>
      <div className="grid md:grid-cols-[1fr_300px] gap-5 p-4 md:p-6">
        <div className="relative rounded-2xl bg-soft p-4 grid place-items-center min-h-[280px]"><canvas ref={ref} className={`max-w-full max-h-[60vh] w-auto h-auto shadow-lift rounded-lg transition ${busy ? "opacity-40" : ""}`} /></div>
        <div className="space-y-4">
          <div><b className="block text-sm mb-2">المقاس</b><div className="grid gap-2">{FORMATS.map((x) => <button key={x.id} onClick={() => setF(x.id)} className={`flex items-center justify-between rounded-xl border-2 px-3 py-2.5 text-start ${f === x.id ? "border-ink bg-soft" : "border-line hover:border-steel/40"}`}><b className="text-sm">{x.ar}</b><small className="text-xs text-steel">{x.size}</small></button>)}</div></div>
          <Field label="العنوان"><input className="field" maxLength={40} value={headline} onChange={(e) => setHeadline(e.target.value)} /></Field>
          {f !== "square" && <Field label="نص قصير"><input className="field" maxLength={50} value={sub} onChange={(e) => setSub(e.target.value)} /></Field>}
          <div className="grid gap-2 pt-1">
            <button disabled={busy} onClick={() => download(ref.current!.toDataURL("image/png"), `${file(store)}-${f}.png`)} className="btn btn-lg btn-lime"><Icon n="download" s={18} />تحميل للطباعة (PNG)</button>
            <button disabled={busy} onClick={print} className="btn btn-md btn-ghost"><Icon n="print" s={18} />طباعة مباشرة</button>
            <small className="text-xs text-steel leading-5">دقة 300 نقطة/إنش ({spec.w}×{spec.h} بكسل) مناسبة لأي مطبعة.</small></div>
        </div></div></div></div>);
}
function StoreForm({ s0, onDone }: { s0?: Store; onDone: () => void }) {
  const r = useRouter(), [v, setV] = useState({ name: s0?.name ?? "", city: s0?.city ?? "", code: s0?.code ?? "", notes: s0?.notes ?? "", isActive: s0?.isActive ?? true }), [busy, setBusy] = useState(false), [adv, setAdv] = useState(false);
  async function save(e: React.FormEvent) { e.preventDefault(); setBusy(true); const x = await post("/api/admin/stores", { ...v, id: s0?.id, code: v.code || undefined }); setBusy(false); if (x.ok) { toast(s0 ? "تم حفظ المحل" : `تمت إضافة «${v.name}» ورمزه جاهز`); onDone(); r.refresh(); } else toast(x.data.error || "تعذر الحفظ", { tone: "err" }); }
  return (<form onSubmit={save} className="p-4 md:p-5 border-t border-line bg-soft/40 space-y-3">
    <div className="grid sm:grid-cols-2 gap-3"><Field label="اسم المحل *"><input autoFocus className="field" placeholder="مثال: محل الرياض - السلي" value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} /></Field><Field label="المدينة"><input className="field" value={v.city} onChange={(e) => setV({ ...v, city: e.target.value })} /></Field></div>
    <Field label="ملاحظات (اختياري)"><input className="field" placeholder="مثال: الرمز على الكاونتر" value={v.notes} onChange={(e) => setV({ ...v, notes: e.target.value })} /></Field>
    {s0 && <div className="max-w-xs"><Switch label="الرمز فعّال" hint="الموقوف لا يُحسب له مسح" on={v.isActive} onChange={(x) => setV({ ...v, isActive: x })} /></div>}
    <button type="button" onClick={() => setAdv(!adv)} className="text-xs font-bold text-steel inline-flex items-center gap-1"><Icon n="chevDown" s={14} className={adv ? "rotate-180" : ""} />خيارات متقدمة</button>
    {adv && <Field label="رمز الرابط (?src=)" hint={s0 ? "تغييره يجعل الرموز المطبوعة سابقًا لا تُنسب لهذا المحل" : "يُولَّد تلقائيًا إن تُرك فارغًا. أحرف إنجليزية وأرقام فقط"}><input className="field" dir="ltr" value={v.code} onChange={(e) => setV({ ...v, code: e.target.value })} /></Field>}
    <div className="flex gap-2"><button disabled={busy || v.name.trim().length < 2} className="btn btn-md btn-lime"><Icon n="check" s={18} />{busy ? "..." : s0 ? "حفظ" : "إضافة المحل وإنشاء رمزه"}</button><button type="button" onClick={onDone} className="btn btn-md btn-ghost">إلغاء</button></div>
  </form>);
}
export default function StoresManager({ stores, base, unassigned }: { stores: Store[]; base: string; unassigned: number }) {
  const r = useRouter(), [design, setDesign] = useState<{ url: string; store?: Store } | null>(null), [edit, setEdit] = useState<number | "new" | null>(stores.length ? null : "new"), [q, setQ] = useState("");
  const list = stores.filter((s) => !q || `${s.name} ${s.city ?? ""} ${s.code}`.toLowerCase().includes(q.toLowerCase()));
  const totalScans = stores.reduce((n, s) => n + s.scans, 0), totalOrders = stores.reduce((n, s) => n + s.orders, 0);
  async function remove(s: Store) { if (!confirm(`حذف «${s.name}»؟`)) return; const x = await fetch(`/api/admin/stores?id=${s.id}`, { method: "DELETE" }).then((x) => x.json()); toast(x.deactivated ? "للمحل طلبات، فتم إيقاف رمزه بدل حذفه" : "تم حذف المحل"); r.refresh(); }
  const svg = (url: string, s?: Store) => download("data:image/svg+xml;charset=utf-8," + encodeURIComponent(qrSvg(url)), `${file(s)}.svg`);
  return (<div className="max-w-6xl">
    <PageHead title="رموز QR للمحلات" desc="لكل محل رمز خاص محفوظ هنا دائمًا. أي عميل يمسح رمز المحل ويطلب، يظهر اسم المحل في طلبه وفي صفحة العملاء.">
      <button onClick={() => setEdit(edit === "new" ? null : "new")} className="btn btn-md btn-lime"><Icon n="plus" s={18} />محل جديد</button></PageHead>
    <div className="grid grid-cols-3 gap-3 mb-4">{([["المحلات", stores.filter((s) => s.isActive).length, "qr"], ["مرات المسح", totalScans, "eye"], ["طلبات من المحلات", totalOrders, "orders"]] as const).map(([l, n, i]) => <div key={l} className="card p-3 md:p-4 flex items-center gap-3"><span className="hidden sm:grid w-10 h-10 rounded-xl bg-soft text-steel place-items-center"><Icon n={i} s={20} /></span><div><small className="block text-xs text-steel font-bold">{l}</small><b className="font-display text-xl md:text-2xl">{n}</b></div></div>)}</div>
    {edit === "new" && <div className="card overflow-hidden mb-4"><b className="block px-4 md:px-5 pt-4">محل جديد</b><StoreForm onDone={() => setEdit(null)} /></div>}
    {stores.length > 3 && <div className="relative mb-3"><Icon n="search" s={18} className="absolute start-3.5 top-1/2 -translate-y-1/2 text-steel" /><input className="field ps-10 h-11" placeholder="ابحث عن محل" value={q} onChange={(e) => setQ(e.target.value)} /></div>}
    <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-4">
      {/* الرمز العام للكتالوج */}
      <div className="card p-4 flex flex-col gap-3 bg-ink text-white border-ink">
        <div className="flex items-start gap-3"><span className="bg-white rounded-2xl p-1.5"><QrThumb url={base} size={96} /></span><div className="min-w-0"><Badge cls="bg-lime text-ink">الرمز العام</Badge><b className="block mt-1.5">كتالوج DYLLU</b><small className="block text-xs text-white/60 mt-0.5">بدون محل · طلبات بلا مصدر: {unassigned}</small></div></div>
        <div className="flex flex-wrap gap-1.5 mt-auto"><button onClick={() => setDesign({ url: base })} className="btn btn-sm btn-lime"><Icon n="print" s={16} />تصميم للطباعة</button><button onClick={() => share(base, "كتالوج DYLLU")} className="btn btn-sm bg-white/10 text-white hover:bg-white/20"><Icon n="share" s={16} />مشاركة</button><button onClick={() => svg(base)} className="btn btn-sm bg-white/10 text-white hover:bg-white/20" title="للمصمم"><Icon n="download" s={16} />SVG</button></div>
      </div>
      {list.map((s) => { const url = linkFor(base, s.code); return (<div key={s.id} className={`card overflow-hidden flex flex-col ${s.isActive ? "" : "opacity-60"}`}>
        <div className="p-4 flex items-start gap-3"><span className="rounded-2xl border border-line p-1.5 shrink-0"><QrThumb url={url} size={96} /></span>
          <div className="min-w-0 flex-1"><b className="block leading-snug">{s.name}</b><small className="block text-xs text-steel mt-0.5">{s.city ?? "—"} · <span dir="ltr">{s.code}</span></small>{!s.isActive && <Badge cls="bg-soft text-steel mt-1">موقوف</Badge>}
            <div className="flex gap-4 mt-2 text-xs"><span><b className="font-display text-base">{s.scans}</b> <span className="text-steel">مسح</span></span><a href={`/admin/orders?store=${s.id}`} className="hover:underline"><b className="font-display text-base">{s.orders}</b> <span className="text-steel">طلب</span></a></div></div></div>
        {s.notes && <p className="px-4 -mt-1 pb-3 text-xs text-steel">{s.notes}</p>}
        <div className="mt-auto border-t border-line p-2 flex items-center gap-1">
          <button onClick={() => setDesign({ url, store: s })} className="btn btn-sm btn-lime h-9"><Icon n="print" s={16} />تصميم للطباعة</button>
          <button onClick={() => share(url, `كتالوج DYLLU · ${s.name}`)} className="btn-icon w-9 h-9 rounded-lg border border-line text-steel hover:text-ink hover:bg-soft" aria-label="مشاركة" title="مشاركة"><Icon n="share" s={16} /></button>
          <button onClick={async () => { try { await navigator.clipboard.writeText(url); toast("تم نسخ رابط المحل"); } catch { prompt("الرابط", url); } }} className="btn-icon w-9 h-9 rounded-lg border border-line text-steel hover:text-ink hover:bg-soft" aria-label="نسخ الرابط" title="نسخ الرابط"><Icon n="copyLink" s={16} /></button>
          <button onClick={() => svg(url, s)} className="btn-icon w-9 h-9 rounded-lg border border-line text-steel hover:text-ink hover:bg-soft" title="تحميل SVG للمصمم" aria-label="تحميل SVG"><Icon n="download" s={16} /></button>
          <button onClick={() => setEdit(edit === s.id ? null : s.id)} className="btn-icon w-9 h-9 rounded-lg border border-line text-steel hover:text-ink hover:bg-soft ms-auto" aria-label="تعديل" title="تعديل"><Icon n="edit" s={16} /></button>
          <button onClick={() => remove(s)} className="btn-icon w-9 h-9 rounded-lg border border-line text-steel hover:text-ink hover:bg-soft hover:!text-accent" aria-label="حذف" title="حذف"><Icon n="trash" s={16} /></button></div>
        {edit === s.id && <StoreForm s0={s} onDone={() => setEdit(null)} />}
      </div>); })}
    </div>
    {stores.length === 0 && edit !== "new" && <div className="card mt-4"><AEmpty icon="qr" title="أضف أول محل لتحصل على رمزه الخاص" /></div>}
    {design && <Designer url={design.url} store={design.store} onClose={() => setDesign(null)} />}
  </div>);
}
