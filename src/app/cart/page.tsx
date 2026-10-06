"use client";
import Icon from "@/components/Icon";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useCart } from "@/store/cart";
import { useLang } from "@/lib/useLang";
type Item = { id: number; nameAr: string; nameEn: string; allowCart: boolean; image: string | null; price: number | null };
type Rep = { id: number; name: string; location: string; photo: string | null };
const D = {
  ar: { title: "السلة", empty: "السلة فارغة", emptySub: "أضف منتجات وستظهر هنا", browse: "استعرض المنتجات", s1: "المراجعة", s2: "البيانات", s3: "المندوب", count: "عدد القطع", total: "الإجمالي", unp: "+ منتجات بسعر غير محدد", co: "إتمام الطلب", clear: "تفريغ السلة", more: "متابعة التصفح", contact: "تواصل معنا", cur: "ريال",
    info: "بيانات الطلب", edit: "تعديل", phone: "رقم الجوال *", city: "المدينة", notes: "ملاحظات (اختياري)", who: "إضافة اسم الشخص أو الشركة", whoSub: "اختياري، يمكنك تركه فارغًا", person: "اسم الشخص", company: "اسم الشركة", next: "اختيار المندوب",
    pick: "اختر المندوب", pickSub: "اضغط على المندوب وسيُرسل طلبك له مباشرة عبر واتساب", via: "أرسل الطلب", back: "رجوع", err: "تحقق من رقم الجوال والمنتجات", many: "محاولات كثيرة، انتظر دقيقة ثم أعد المحاولة", net: "تعذر الاتصال، تحقق من الإنترنت وأعد المحاولة", retry: "إعادة المحاولة", removed: "أُزيلت من السلة منتجات لم تعد متاحة" },
  en: { title: "Cart", empty: "Your cart is empty", emptySub: "Add products and they will show here", browse: "Browse products", s1: "Review", s2: "Details", s3: "Rep", count: "Items", total: "Total", unp: "+ items with no listed price", co: "Complete order", clear: "Clear cart", more: "Keep browsing", contact: "Contact us", cur: "SAR",
    info: "Order details", edit: "Edit", phone: "Mobile number *", city: "City", notes: "Notes (optional)", who: "Add person or company name", whoSub: "Optional, you can leave it empty", person: "Person name", company: "Company name", next: "Choose representative",
    pick: "Choose your representative", pickSub: "Tap a representative and your order is sent to them on WhatsApp", via: "Send order", back: "Back", err: "Check your mobile number and items", many: "Too many attempts, wait a minute and retry", net: "Connection problem, check your internet and retry", retry: "Retry", removed: "Unavailable items were removed from your cart" },
};
const inp = "w-full border rounded-xl p-3 bg-white";
export default function CartPage() {
  const L = useLang(), d = D[L === "en" ? "en" : "ar"], { lines: stored, setQty, clear } = useCart();
  const [items, setItems] = useState<Item[]>([]), [loaded, setLoaded] = useState(false), [ready, setReady] = useState(false);
  const [fail, setFail] = useState(false), [tick, setTick] = useState(0), [removed, setRemoved] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3>(1), [reps, setReps] = useState<Rep[]>([]), [extra, setExtra] = useState(false), [err, setErr] = useState(""), [busy, setBusy] = useState(false);
  const [f, setF] = useState({ name: "", phone: "", company: "", city: "", notes: "" });
  const lines = ready ? stored : []; // قبل التحميل على المتصفح نعرض سلة فارغة كي يطابق HTML السيرفر (تجنب خطأ hydration)
  const key = lines.map((l) => l.productId).join(",");
  useEffect(() => setReady(true), []);
  useEffect(() => { fetch("/api/reps").then((r) => r.json()).then((x) => Array.isArray(x) && setReps(x)).catch(() => {}); }, []);
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
  const nm = (p: Item) => (L === "en" ? p.nameEn : p.nameAr), money = (n: number) => `${n} ${d.cur}`;
  function next() { if (f.phone.replace(/\D/g, "").length < 8 || !rows.length) return setErr(d.err); setErr(""); reps.length ? setStep(3) : send(); }
  // اختيار المندوب = إنشاء الطلب (السعر من السيرفر) ثم فتح واتساب المندوب برسالة جاهزة
  async function send(repId?: number) {
    setErr(""); setBusy(true);
    try {
      const res = await fetch("/api/orders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ customer: { name: extra && f.name.trim() ? f.name.trim() : undefined, company: extra && f.company.trim() ? f.company.trim() : undefined, phone: f.phone, city: f.city || undefined }, notes: f.notes || undefined, source: localStorage.getItem("dyllu-src") || undefined, repId, items: rows.map((r) => ({ productId: r.l.productId, quantity: r.l.quantity })) }) });
      const j = await res.json().catch(() => ({}));
      if (!res.ok || !j.whatsappUrl) return setErr(res.status === 429 ? d.many : d.err);
      clear(); window.location.href = j.whatsappUrl;
    } catch { setErr(d.net); } finally { setBusy(false); }
  }
  const Steps = () => (<div className="flex gap-2 text-xs font-bold">{[d.s1, d.s2, d.s3].map((l, i) => <span key={l} className={`flex-1 text-center rounded-full py-1.5 ${i + 1 === step ? "bg-ink text-lime" : i + 1 < step ? "bg-lime text-ink" : "bg-soft text-steel"}`}>{i + 1}. {l}</span>)}</div>);
  return (<main className="max-w-xl mx-auto pb-32">
    <header className="h-14 px-4 flex items-center justify-between border-b-[3px] border-lime"><Link href="/" className="font-bold text-steel">{L === "en" ? "Home" : "الرئيسية"}</Link><b>{d.title}</b><span className="w-14" /></header>
    {fail ? <div className="text-center p-10 space-y-3"><p className="text-accent font-bold">{d.net}</p><button onClick={() => setTick((n) => n + 1)} className="bg-lime font-extrabold rounded-xl px-6 py-3">{d.retry}</button></div> : !ready || (!loaded && key !== "") ? <p className="text-center text-steel p-10">...</p> : rows.length === 0 ? (
      <div className="text-center p-10 space-y-3">{removed && <p className="text-accent text-sm font-bold">{d.removed}</p>}<div className="text-5xl"><Icon n="cart" s={56} className="mx-auto text-steel" /></div><b className="block text-lg">{d.empty}</b><p className="text-steel">{d.emptySub}</p><Link href="/products" className="inline-block bg-lime font-extrabold rounded-xl px-6 py-3">{d.browse}</Link></div>
    ) : (<section className="p-4 space-y-3">{removed && <p className="bg-accent/10 text-accent text-sm font-bold rounded-xl p-3">{d.removed}</p>}<Steps />
      {step === 1 && <>
        {rows.map(({ l, p }) => (<div key={p.id} className="flex gap-3 items-center bg-white border rounded-2xl p-3">
          <div className="w-16 h-16 rounded-xl bg-soft overflow-hidden shrink-0">{p.image && <img src={p.image} alt="" className="w-full h-full object-contain" />}</div>
          <div className="flex-1 min-w-0"><div className="font-bold text-sm leading-snug">{nm(p)}</div><div className="text-xs text-steel mt-0.5">{p.price == null ? d.contact : money(p.price)}</div></div>
          <div className="flex flex-col items-end gap-1.5"><div className="flex items-center gap-2"><b className="text-sm">{p.price == null ? "—" : money(p.price * l.quantity)}</b><button aria-label="delete" onClick={() => setQty(p.id, 0)} className="text-accent p-1"><Icon n="trash" s={18} /></button></div>
            <div className="flex items-center border rounded-xl"><button className="w-9 h-9 text-lg" onClick={() => setQty(p.id, l.quantity - 1)}><Icon n="minus" s={16} /></button><span className="min-w-6 text-center font-bold">{l.quantity}</span><button className="w-9 h-9 text-lg" onClick={() => setQty(p.id, l.quantity + 1)}><Icon n="plus" s={16} /></button></div></div></div>))}
        <div className="bg-soft rounded-2xl p-4 space-y-1"><div className="flex justify-between text-sm"><span>{d.count}</span><b>{qty}</b></div><div className="flex justify-between text-lg font-extrabold"><span>{d.total}</span><span>{money(total)}</span></div>{unpriced && <p className="text-xs text-steel">{d.unp}</p>}</div>
        <div className="flex justify-between text-sm"><Link href="/products" className="text-steel">{d.more}</Link><button className="text-accent font-bold" onClick={clear}>{d.clear}</button></div>
        <div className="fixed inset-x-0 bottom-0 bg-white border-t p-3"><div className="max-w-xl mx-auto"><button onClick={() => setStep(2)} className="w-full bg-lime text-ink font-extrabold rounded-xl p-4 flex justify-between px-5"><span>{d.co}</span><span>{money(total)}</span></button></div></div></>}
      {step === 2 && <>
        <div className="flex justify-between items-center bg-soft rounded-xl p-3 text-sm"><span>{qty} · <b>{money(total)}</b></span><button className="font-bold underline" onClick={() => setStep(1)}>{d.edit}</button></div>
        <h2 className="font-extrabold text-lg">{d.info}</h2>
        <input className={inp} placeholder={d.phone} inputMode="tel" dir="ltr" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} />
        <label className="flex items-start gap-3 bg-white border rounded-2xl p-3 cursor-pointer"><input type="checkbox" className="mt-1 w-5 h-5 accent-ink" checked={extra} onChange={(e) => setExtra(e.target.checked)} /><span><b className="block">{d.who}</b><small className="text-steel">{d.whoSub}</small></span></label>
        {extra && <div className="grid grid-cols-2 gap-2"><input className={inp} placeholder={d.person} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /><input className={inp} placeholder={d.company} value={f.company} onChange={(e) => setF({ ...f, company: e.target.value })} /></div>}
        <input className={inp} placeholder={d.city} value={f.city} onChange={(e) => setF({ ...f, city: e.target.value })} />
        <textarea className={inp} rows={3} placeholder={d.notes} value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} />
        {err && <p className="text-accent font-bold">{err}</p>}
        <button disabled={busy} onClick={next} className="w-full bg-lime text-ink font-extrabold rounded-xl p-4">{busy ? "..." : d.next}</button><button onClick={() => setStep(1)} className="w-full border rounded-xl p-3 bg-white">{d.back}</button></>}
      {step === 3 && <>
        <h2 className="font-extrabold text-lg">{d.pick}</h2><p className="text-sm text-steel">{d.pickSub}</p>
        {reps.map((r) => (<button key={r.id} disabled={busy} onClick={() => send(r.id)} className="w-full flex items-center gap-3 bg-white border rounded-2xl p-3 text-start disabled:opacity-60">
          <span className="w-14 h-14 rounded-full bg-ink text-lime grid place-items-center font-extrabold text-xl overflow-hidden shrink-0">{r.photo ? <img src={r.photo} alt="" className="w-full h-full object-cover" /> : r.name[0]}</span>
          <span className="flex-1"><b className="block">{r.name}</b><small className="text-steel">{r.location}</small></span><span className="bg-lime text-ink font-extrabold text-sm rounded-xl px-3 py-2">{busy ? "..." : d.via}</span></button>))}
        {err && <p className="text-accent font-bold">{err}</p>}<button onClick={() => setStep(2)} className="w-full border rounded-xl p-3 bg-white">{d.back}</button></>}
    </section>)}
  </main>);
}
