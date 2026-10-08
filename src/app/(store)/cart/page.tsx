"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import Icon from "@/components/Icon";
import { Empty } from "@/components/ui";
import { useCart } from "@/store/cart";
import { useLang } from "@/lib/useLang";
import { isPhone, toAsciiDigits } from "@/lib/phone";
type Item = { id: number; slug: string; sku: string | null; inStock: boolean; nameAr: string; nameEn: string; allowCart: boolean; image: string | null; price: number | null; oldPrice?: number | null };
type Rep = { id: number; name: string; location: string; photo: string | null };
const D = {
  ar: { title: "سلة الطلب", empty: "السلة فارغة", emptySub: "أضف منتجات وستظهر هنا", browse: "استعرض المنتجات", s1: "المراجعة", s2: "البيانات", s3: "المندوب", count: "عدد القطع", items: "المنتجات", total: "الإجمالي", unp: "+ منتجات بسعر غير محدد (يُحدد سعرها عند التواصل)", co: "إتمام الطلب", clear: "تفريغ السلة", more: "متابعة التصفح", contact: "تواصل معنا", cur: "ريال", each: "للقطعة", summary: "ملخص الطلب", remove: "حذف", out: "غير متوفر حاليًا",
    info: "بيانات التواصل", infoSub: "نحتاج اسمك ورقم جوالك للتواصل معك بخصوص الطلب", name: "الاسم", nameHint: "الاسم الكامل", company: "اسم الشركة", errName: "اكتب اسمك", edit: "تعديل", phone: "رقم الجوال", phoneHint: "05XXXXXXXX", city: "المدينة", notes: "ملاحظات", optional: "اختياري", next: "اختيار المندوب", sendNow: "إرسال الطلب عبر واتساب",
    pick: "اختر المندوب", pickSub: "اضغط على المندوب وسيُفتح واتساب برسالة طلبك جاهزة للإرسال", via: "أرسل الطلب", back: "رجوع", err: "رقم الجوال غير مكتمل، اكتبه مثل 0551234567", errItems: "تحقق من المنتجات في السلة", many: "محاولات كثيرة، انتظر دقيقة ثم أعد المحاولة", net: "تعذر الاتصال، تحقق من الإنترنت وأعد المحاولة", retry: "إعادة المحاولة", removed: "أُزيلت من السلة منتجات لم تعد متاحة", confirmClear: "تفريغ السلة بالكامل؟", secure: "لن يُرسل الطلب حتى تضغط «إرسال» في واتساب" },
  en: { title: "Your cart", empty: "Your cart is empty", emptySub: "Add products and they will show here", browse: "Browse products", s1: "Review", s2: "Details", s3: "Rep", count: "Items", items: "Products", total: "Total", unp: "+ items with no listed price (quoted on contact)", co: "Checkout", clear: "Clear cart", more: "Keep browsing", contact: "Contact us", cur: "SAR", each: "each", summary: "Order summary", remove: "Remove", out: "Currently unavailable",
    info: "Contact details", infoSub: "We need your name and mobile number to follow up on the order", name: "Full name", nameHint: "Your name", company: "Company name", errName: "Please enter your name", edit: "Edit", phone: "Mobile number", phoneHint: "05XXXXXXXX", city: "City", notes: "Notes", optional: "optional", next: "Choose representative", sendNow: "Send order via WhatsApp",
    pick: "Choose your representative", pickSub: "Tap a representative and WhatsApp opens with your order ready to send", via: "Send order", back: "Back", err: "Mobile number looks incomplete, e.g. 0551234567", errItems: "Check the items in your cart", many: "Too many attempts, wait a minute and retry", net: "Connection problem, check your internet and retry", retry: "Retry", removed: "Unavailable items were removed from your cart", confirmClear: "Clear the whole cart?", secure: "Nothing is sent until you press Send in WhatsApp" },
};
const Label = ({ t, opt, children }: { t: string; opt?: string; children: React.ReactNode }) => <label className="block space-y-1.5"><span className="text-sm font-bold">{t}{opt && <small className="text-steel font-normal"> ({opt})</small>}</span>{children}</label>;
export default function CartPage() {
  const L = useLang(), en = L === "en", d = D[en ? "en" : "ar"], { lines: stored, setQty, clear } = useCart();
  const [items, setItems] = useState<Item[]>([]), [loaded, setLoaded] = useState(false), [ready, setReady] = useState(false);
  const [fail, setFail] = useState(false), [tick, setTick] = useState(0), [removed, setRemoved] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3>(1), [reps, setReps] = useState<Rep[]>([]), [err, setErr] = useState(""), [busy, setBusy] = useState(false);
  const [f, setF] = useState({ name: "", phone: "", company: "", city: "", notes: "" });
  const lines = ready ? stored : []; // قبل التحميل على المتصفح نعرض سلة فارغة كي يطابق HTML السيرفر (تجنب خطأ hydration)
  const key = lines.map((l) => l.productId).join(",");
  useEffect(() => setReady(true), []);
  // رابط المندوب الخاص (?rep=ID): مندوبه يظهر أولًا ومميزًا في خطوة اختيار المندوب
  const [mine, setMine] = useState(0);
  useEffect(() => { let m = 0; try { m = Number(localStorage.getItem("dyllu-rep")) || 0; } catch { /* لا شيء */ } setMine(m);
    fetch("/api/reps").then((r) => r.json()).then((x: Rep[]) => Array.isArray(x) && setReps(m ? [...x].sort((a, b) => Number(b.id === m) - Number(a.id === m)) : x)).catch(() => {}); }, []);
  // نحفظ بيانات العميل على جهازه فقط لتسهيل الطلب القادم
  useEffect(() => { try { const v = JSON.parse(localStorage.getItem("dyllu-customer") ?? "null"); if (v) setF((o) => ({ ...o, ...v, notes: "" })); } catch { /* لا شيء */ } }, []);
  useEffect(() => { window.scrollTo({ top: 0, behavior: "smooth" }); }, [step]);
  useEffect(() => {
    if (!ready) return;
    if (!key) { setItems([]); setLoaded(true); return; }
    let off = false; setFail(false);
    fetch(`/api/products/by-ids?ids=${key}`).then((r) => { if (!r.ok) throw new Error("bad"); return r.json(); }).then((x: Item[]) => {
      if (off) return; const list = Array.isArray(x) ? x : [], ok = new Set(list.filter((i) => i.allowCart).map((i) => i.id));
      const gone = lines.filter((l) => !ok.has(l.productId)); gone.forEach((l) => setQty(l.productId, 0)); if (gone.length) setRemoved(true);
      setItems(list); setLoaded(true);
    }).catch(() => { if (!off) { setFail(true); setLoaded(true); } });
    return () => { off = true; };
  }, [key, ready, tick]); // eslint-disable-line react-hooks/exhaustive-deps
  const rows = lines.map((l) => ({ l, p: items.find((i) => i.id === l.productId) })).filter((r): r is { l: (typeof lines)[number]; p: Item } => !!r.p);
  const total = rows.reduce((t, r) => t + (r.p.price ?? 0) * r.l.quantity, 0), qty = rows.reduce((t, r) => t + r.l.quantity, 0), unpriced = rows.some((r) => r.p.price == null);
  const nm = (p: Item) => (en ? p.nameEn || p.nameAr : p.nameAr || p.nameEn), money = (n: number) => `${n.toLocaleString("en-US")} ${d.cur}`;
  const phoneOk = isPhone(f.phone), nameOk = f.name.trim().length >= 2;
  function next() { if (!nameOk) return setErr(d.errName); if (!phoneOk) return setErr(d.err); if (!rows.length) return setErr(d.errItems); setErr(""); reps.length ? setStep(3) : send(); }
  // اختيار المندوب = إنشاء الطلب (السعر من السيرفر) ثم فتح واتساب المندوب برسالة جاهزة
  async function send(repId?: number) {
    setErr(""); setBusy(true);
    try {
      const customer = { name: f.name.trim(), company: f.company.trim() || undefined, phone: f.phone.trim(), city: f.city.trim() || undefined };
      const res = await fetch("/api/orders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ customer, notes: f.notes.trim() || undefined, source: localStorage.getItem("dyllu-src") || undefined, repId, items: rows.map((r) => ({ productId: r.l.productId, quantity: r.l.quantity })) }) });
      const j = await res.json().catch(() => ({}));
      if (!res.ok || !j.whatsappUrl) return setErr(res.status === 429 ? d.many : d.err);
      try { localStorage.setItem("dyllu-customer", JSON.stringify({ name: customer.name ?? "", company: customer.company ?? "", phone: customer.phone, city: customer.city ?? "" })); } catch { /* لا شيء */ }
      clear(); window.location.href = j.whatsappUrl;
    } catch { setErr(d.net); } finally { setBusy(false); }
  }
  const Stepper = () => (<ol className="flex items-center gap-2">{[d.s1, d.s2, d.s3].map((l, i) => { const n = i + 1, done = n < step, on = n === step; return (<li key={l} className="flex items-center gap-2 flex-1 last:flex-none">
    <button disabled={n >= step} onClick={() => setStep(n as 1 | 2 | 3)} className="flex items-center gap-2 disabled:cursor-default">
      <span className={`grid place-items-center w-8 h-8 rounded-full text-sm font-extrabold shrink-0 transition ${on ? "bg-ink text-lime" : done ? "bg-lime text-ink" : "bg-soft text-steel"}`}>{done ? <Icon n="check" s={16} stroke={3} /> : n}</span>
      <span className={`text-sm font-bold whitespace-nowrap ${on ? "text-ink" : "text-steel"} ${on ? "" : "hidden xs:inline"}`}>{l}</span></button>
    {n < 3 && <i className={`h-0.5 flex-1 rounded-full ${done ? "bg-lime" : "bg-line"}`} />}</li>); })}</ol>);
  const Summary = ({ cta }: { cta?: React.ReactNode }) => (<div className="card p-5 space-y-3">
    <b className="block font-display">{d.summary}</b>
    <div className="flex justify-between text-sm"><span className="text-steel">{d.items}</span><b>{rows.length}</b></div>
    <div className="flex justify-between text-sm"><span className="text-steel">{d.count}</span><b>{qty}</b></div>
    <div className="border-t border-dashed border-line pt-3 flex justify-between items-end"><span className="font-bold">{d.total}</span><b className="font-display text-2xl">{money(total)}</b></div>
    {unpriced && <p className="text-xs text-steel leading-5">{d.unp}</p>}{cta}
    <p className="flex items-center gap-2 text-xs text-steel"><Icon n="shield" s={16} className="text-[#586000]" />{d.secure}</p></div>);
  if (!ready || (!loaded && key !== "")) return <div className="wrap pt-8 grid lg:grid-cols-[1fr_360px] gap-6"><div className="space-y-3">{[0, 1, 2].map((i) => <div key={i} className="skeleton h-28" />)}</div><div className="skeleton h-64 hidden lg:block" /></div>;
  if (fail) return <div className="wrap"><Empty icon="alert" title={d.net}><button onClick={() => setTick((n) => n + 1)} className="btn btn-md btn-lime">{d.retry}</button></Empty></div>;
  if (!rows.length) return <div className="wrap">{removed && <p className="mt-6 bg-accent/10 text-accent text-sm font-bold rounded-xl p-3">{d.removed}</p>}<Empty icon="cart" title={d.empty} sub={d.emptySub}><Link href="/products" className="btn btn-lg btn-lime">{d.browse}</Link></Empty></div>;
  const primary = step === 1 ? <button onClick={() => setStep(2)} className="btn btn-lg btn-lime w-full">{d.co}<Icon n="chev" s={18} className="flip-rtl" /></button>
    : step === 2 ? <button disabled={busy} onClick={next} className="btn btn-lg btn-lime w-full">{busy ? "..." : reps.length ? d.next : d.sendNow}{!busy && <Icon n={reps.length ? "chev" : "whatsapp"} s={18} className={reps.length ? "flip-rtl" : ""} />}</button> : null;
  return (<div className="wrap pt-5 md:pt-8">
    <div className="flex flex-wrap items-center justify-between gap-4 mb-5 md:mb-7"><h1 className="dy-tab">{d.title}</h1><div className="w-full sm:w-auto sm:min-w-[380px]"><Stepper /></div></div>
    {removed && <p className="mb-4 bg-accent/10 text-accent text-sm font-bold rounded-xl p-3">{d.removed}</p>}
    <div className="grid lg:grid-cols-[1fr_360px] gap-6 lg:gap-8 items-start">
      <div className="min-w-0 space-y-3">
        {step === 1 && <>
          {rows.map(({ l, p }) => (<div key={p.id} className="card p-3 sm:p-4 flex gap-3 sm:gap-4">
            <Link href={`/products/${p.slug}`} aria-label={nm(p)} className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl bg-soft overflow-hidden shrink-0">{p.image && <img src={p.image} alt="" className="w-full h-full object-contain p-1" />}</Link>
            <div className="flex-1 min-w-0 flex flex-col gap-2">
              <div className="flex gap-2 items-start"><div className="flex-1 min-w-0"><Link href={`/products/${p.slug}`} className="font-bold text-sm sm:text-base leading-snug line-clamp-2 hover:underline">{nm(p)}</Link>
                <small className="block text-xs text-steel mt-0.5" dir="ltr" style={{ textAlign: "start" }}>{p.sku}</small>{!p.inStock && <small className="text-xs text-accent font-bold">{d.out}</small>}</div>
                <button aria-label={d.remove} onClick={() => setQty(p.id, 0)} className="btn-icon w-9 h-9 text-steel hover:text-accent hover:bg-accent/5 -mt-1 -me-1"><Icon n="trash" s={18} /></button></div>
              <div className="flex items-center justify-between gap-2 mt-auto flex-wrap">
                <div className="flex items-center rounded-xl border border-line"><button aria-label="-" className="btn-icon w-10 h-10 text-steel hover:text-ink" onClick={() => setQty(p.id, l.quantity - 1)}><Icon n={l.quantity === 1 ? "trash" : "minus"} s={16} /></button><span className="min-w-8 text-center font-extrabold">{l.quantity}</span><button aria-label="+" className="btn-icon w-10 h-10 text-steel hover:text-ink" onClick={() => setQty(p.id, l.quantity + 1)}><Icon n="plus" s={16} /></button></div>
                <div className="text-end">{p.oldPrice != null && p.price != null && <s className="block text-xs text-steel">{money(p.oldPrice * l.quantity)}</s>}<b className={`block ${p.oldPrice != null ? "text-accent" : ""}`}>{p.price == null ? d.contact : money(p.price * l.quantity)}</b>{p.price != null && l.quantity > 1 && <small className="text-xs text-steel">{money(p.price)} {d.each}</small>}</div></div>
            </div></div>))}
          <div className="flex justify-between text-sm pt-1"><Link href="/products" className="inline-flex items-center gap-1 font-bold text-steel hover:text-ink"><Icon n="chev" s={16} className="rotate-180 rtl:rotate-0" />{d.more}</Link><button className="text-accent font-bold" onClick={() => confirm(d.confirmClear) && clear()}>{d.clear}</button></div></>}
        {step === 2 && <div className="card p-4 sm:p-6 space-y-4">
          <div><h2 className="text-lg">{d.info}</h2><p className="text-sm text-steel mt-1">{d.infoSub}</p></div>
          <div className="grid sm:grid-cols-2 gap-3">
            <Label t={d.name}><input className={`field ${err === d.errName ? "border-accent ring-4 ring-accent/15" : ""}`} placeholder={d.nameHint} autoComplete="name" enterKeyHint="next" value={f.name} onChange={(e) => { setF({ ...f, name: e.target.value }); setErr(""); }} /></Label>
            <Label t={d.phone}><input className={`field ${err === d.err && !phoneOk ? "border-accent ring-4 ring-accent/15" : ""}`} placeholder={d.phoneHint} inputMode="tel" autoComplete="tel" dir="ltr" enterKeyHint="next" value={f.phone} onChange={(e) => { setF({ ...f, phone: toAsciiDigits(e.target.value) }); setErr(""); }} /></Label>
            <Label t={d.company} opt={d.optional}><input className="field" autoComplete="organization" value={f.company} onChange={(e) => setF({ ...f, company: e.target.value })} /></Label>
            <Label t={d.city} opt={d.optional}><input className="field" autoComplete="address-level2" value={f.city} onChange={(e) => setF({ ...f, city: e.target.value })} /></Label>
          </div>
          <Label t={d.notes} opt={d.optional}><textarea className="field" rows={3} value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} /></Label>
          {err && <p className="text-accent font-bold text-sm flex items-center gap-2"><Icon n="alert" s={16} />{err}</p>}
          <button onClick={() => setStep(1)} className="btn btn-md btn-ghost"><Icon n="chev" s={16} className="rotate-180 rtl:rotate-0" />{d.back}</button>
        </div>}
        {step === 3 && <div className="space-y-4">
          <div className="card p-4 sm:p-6"><h2 className="text-lg">{d.pick}</h2><p className="text-sm text-steel mt-1">{d.pickSub}</p></div>
          <div className="grid sm:grid-cols-2 gap-3">{reps.map((r) => (<button key={r.id} disabled={busy} onClick={() => send(r.id)} className={`group card p-4 flex items-center gap-3 text-start transition hover:shadow-lift hover:border-transparent disabled:opacity-60 ${r.id === mine ? "sm:col-span-2 ring-2 ring-lime border-transparent" : ""}`}>
            <span className="w-14 h-14 rounded-full bg-ink text-lime grid place-items-center font-extrabold text-xl overflow-hidden shrink-0">{r.photo ? <img src={r.photo} alt="" className="w-full h-full object-cover" /> : r.name[0]}</span>
            <span className="flex-1 min-w-0">{r.id === mine && <small className="inline-block mb-1 rounded-md bg-lime px-2 py-0.5 text-[11px] font-extrabold">{en ? "Your representative" : "مندوبك"}</small>}<b className="block">{r.name}</b><small className="text-steel inline-flex items-center gap-1"><Icon n="pin" s={14} />{r.location}</small></span>
            <span className="btn btn-sm btn-lime group-hover:bg-lime-dark"><Icon n="whatsapp" s={16} />{busy ? "..." : d.via}</span></button>))}</div>
          {err && <p className="text-accent font-bold text-sm">{err}</p>}
          <button onClick={() => setStep(2)} className="btn btn-md btn-ghost"><Icon n="chev" s={16} className="rotate-180 rtl:rotate-0" />{d.back}</button>
        </div>}
      </div>
      <aside className="hidden lg:block lg:sticky lg:top-28"><Summary cta={primary} /></aside>
      <div className="lg:hidden"><Summary /></div>
    </div>
    {primary && <><div className="h-24 lg:hidden" aria-hidden /><div className="lg:hidden fixed inset-x-0 bottom-0 z-30 bg-white/95 backdrop-blur border-t border-line pb-safe"><div className="wrap py-3 flex items-center gap-3">
      <div className="min-w-[84px]"><small className="block text-steel text-[11px] font-bold">{d.total}</small><b className="font-display">{money(total)}</b></div><div className="flex-1">{primary}</div></div></div></>}
  </div>);
}
