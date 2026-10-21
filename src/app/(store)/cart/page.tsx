// Copyright (c) 2026 Abdullah Al-Sakni. All rights reserved. DYLLU Catalog.
"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import Icon from "@/components/Icon";
import { Empty } from "@/components/ui";
import { useCart } from "@/store/cart";
import { useLang } from "@/lib/useLang";
import { isPhone, toAsciiDigits } from "@/lib/phone";
type Item = {
  id: number;
  slug: string;
  sku: string | null;
  inStock: boolean;
  nameAr: string;
  nameEn: string;
  allowCart: boolean;
  image: string | null;
  price: number | null;
  oldPrice?: number | null;
};
type Rep = { id: number; name: string; location: string; photo: string | null };
type Sent = {
  number: string;
  token: string;
  wa: string;
  rep: string | null;
  total: number;
  unpriced: boolean;
  items: { name: string; qty: number }[];
};
const LAST = "dy-last-order";
const D = {
  ar: {
    title: "سلة الطلب",
    empty: "السلة فارغة",
    emptySub: "أضف منتجات وستظهر هنا",
    browse: "استعرض المنتجات",
    s1: "المراجعة",
    s2: "بياناتك",
    s3: "الإرسال",
    count: "عدد القطع",
    items: "المنتجات",
    total: "الإجمالي",
    unp: "+ منتجات بسعر غير محدد (يُحدد سعرها عند التواصل)",
    co: "متابعة الطلب",
    clear: "تفريغ السلة",
    more: "متابعة التصفح",
    contact: "تواصل معنا",
    cur: "ريال",
    each: "للقطعة",
    summary: "ملخص الطلب",
    remove: "حذف",
    out: "غير متوفر حاليًا",
    outBanner: "بعض المنتجات غير متوفرة حاليًا. احذفها لتكمل الطلب.",
    info: "بيانات التواصل",
    infoSub: "يتواصل معك المندوب على هذا الرقم بخصوص الطلب",
    extra: "تفاصيل إضافية",
    name: "الاسم",
    nameHint: "الاسم الكامل",
    company: "اسم الشركة",
    errName: "اكتب اسمك",
    edit: "تعديل",
    phone: "رقم الجوال",
    phoneHint: "05XXXXXXXX",
    city: "المدينة",
    notes: "ملاحظات",
    notesHint: "مثل: موعد التوصيل أو تفاصيل الطلب",
    optional: "اختياري",
    next: "متابعة",
    sendNow: "إرسال الطلب عبر واتساب",
    pick: "اختر المندوب",
    pickSub: "اضغط على المندوب ويُفتح واتساب برسالة طلبك جاهزة",
    mine: "مندوبك",
    mineSub: "يُرسل طلبك مباشرة إلى مندوبك المعتمد",
    sendTo: "إرسال الطلب إلى",
    via: "أرسل الطلب",
    back: "رجوع",
    err: "رقم الجوال غير مكتمل، اكتبه مثل 0551234567",
    errItems: "تحقق من المنتجات في السلة",
    many: "محاولات كثيرة، انتظر دقيقة ثم أعد المحاولة",
    net: "تعذر الاتصال، تحقق من الإنترنت وأعد المحاولة",
    retry: "إعادة المحاولة",
    removed: "أُزيلت من السلة منتجات لم تعد متاحة",
    confirmClear: "تفريغ السلة بالكامل؟",
    secure: "لن يُرسل الطلب حتى تضغط «إرسال» في واتساب",
    paused: "استقبال الطلبات متوقف مؤقتًا",
    doneTitle: "تم تجهيز طلبك",
    doneSub: "اضغط «إرسال» في واتساب ليصل طلبك. إذا لم يُفتح واتساب، اضغط الزر بالأسفل.",
    orderNo: "رقم الطلب",
    toRep: "المندوب",
    openWa: "فتح واتساب وإرسال الطلب",
    invoice: "عرض الفاتورة",
    newOrder: "متابعة التسوق",
    qty: "الكمية",
    customer: "العميل",
  },
  en: {
    title: "Your cart",
    empty: "Your cart is empty",
    emptySub: "Add products and they will show here",
    browse: "Browse products",
    s1: "Review",
    s2: "Details",
    s3: "Send",
    count: "Items",
    items: "Products",
    total: "Total",
    unp: "+ items with no listed price (quoted on contact)",
    co: "Continue",
    clear: "Clear cart",
    more: "Keep browsing",
    contact: "Contact us",
    cur: "SAR",
    each: "each",
    summary: "Order summary",
    remove: "Remove",
    out: "Currently unavailable",
    outBanner: "Some items are currently unavailable. Remove them to continue.",
    info: "Contact details",
    infoSub: "Your representative will contact you on this number",
    extra: "More details",
    name: "Full name",
    nameHint: "Your name",
    company: "Company name",
    errName: "Please enter your name",
    edit: "Edit",
    phone: "Mobile number",
    phoneHint: "05XXXXXXXX",
    city: "City",
    notes: "Notes",
    notesHint: "e.g. delivery time or order details",
    optional: "optional",
    next: "Continue",
    sendNow: "Send order via WhatsApp",
    pick: "Choose your representative",
    pickSub: "Tap a representative and WhatsApp opens with your order ready",
    mine: "Your representative",
    mineSub: "Your order goes straight to your assigned representative",
    sendTo: "Send order to",
    via: "Send order",
    back: "Back",
    err: "Mobile number looks incomplete, e.g. 0551234567",
    errItems: "Check the items in your cart",
    many: "Too many attempts, wait a minute and retry",
    net: "Connection problem, check your internet and retry",
    retry: "Retry",
    removed: "Unavailable items were removed from your cart",
    confirmClear: "Clear the whole cart?",
    secure: "Nothing is sent until you press Send in WhatsApp",
    paused: "Ordering is temporarily paused",
    doneTitle: "Your order is ready",
    doneSub: "Press Send in WhatsApp to deliver your order. If WhatsApp did not open, use the button below.",
    orderNo: "Order number",
    toRep: "Representative",
    openWa: "Open WhatsApp and send",
    invoice: "View invoice",
    newOrder: "Keep shopping",
    qty: "Qty",
    customer: "Customer",
  },
};
const Label = ({ t, opt, children }: { t: string; opt?: string; children: React.ReactNode }) => (
  <label className="block space-y-1.5">
    <span className="text-sm font-bold">
      {t}
      {opt && <small className="text-steel font-normal"> ({opt})</small>}
    </span>
    {children}
  </label>
);
const Avatar = ({ r, big }: { r: Rep; big?: boolean }) => (
  <span
    className={`${big ? "w-16 h-16 text-2xl" : "w-12 h-12 text-lg"} rounded-full bg-ink text-lime grid place-items-center font-extrabold overflow-hidden shrink-0`}
  >
    {r.photo ? <img src={r.photo} alt="" className="w-full h-full object-cover" /> : r.name[0]}
  </span>
);
export default function CartPage() {
  const L = useLang(),
    en = L === "en",
    d = D[en ? "en" : "ar"],
    { lines: stored, setQty, clear } = useCart();
  const [items, setItems] = useState<Item[]>([]),
    [loaded, setLoaded] = useState(false),
    [ready, setReady] = useState(false);
  const [fail, setFail] = useState(false),
    [tick, setTick] = useState(0),
    [removed, setRemoved] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3>(1),
    [reps, setReps] = useState<Rep[]>([]),
    [linkRep, setLinkRep] = useState(0),
    [locked, setLocked] = useState<Rep | null>(null),
    [err, setErr] = useState(""),
    [busy, setBusy] = useState(false),
    [sent, setSent] = useState<Sent | null>(null),
    [paused, setPaused] = useState<string | null>(null);
  const [f, setF] = useState({ name: "", phone: "", company: "", city: "", notes: "" });
  const lines = ready ? stored : [];
  const key = lines.map((l) => l.productId).join(",");
  useEffect(() => {
    setReady(true);
    try {
      const last = JSON.parse(sessionStorage.getItem(LAST) ?? "null");
      if (last?.number) setSent(last);
    } catch {}
  }, []);
  useEffect(() => {
    let m = 0;
    try {
      m = Number(localStorage.getItem("dyllu-rep")) || 0;
    } catch {}
    setLinkRep(m);
    fetch("/api/reps")
      .then((r) => r.json())
      .then((x: Rep[]) => Array.isArray(x) && setReps(x))
      .catch(() => {});
    fetch("/api/ordering", { cache: "no-store" })
      .then((r) => r.json())
      .then((x) => setPaused(x.open === false ? (en ? x.en : x.ar) : null))
      .catch(() => {});
  }, [en]);
  useEffect(() => {
    try {
      const v = JSON.parse(localStorage.getItem("dyllu-customer") ?? "null");
      if (v) setF((o) => ({ ...o, ...v, notes: "" }));
    } catch {}
  }, []);
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [step, sent]);
  useEffect(() => {
    if (!ready) return;
    if (!key) {
      setItems([]);
      setLoaded(true);
      return;
    }
    let off = false;
    setFail(false);
    fetch(`/api/products/by-ids?ids=${key}`)
      .then((r) => {
        if (!r.ok) throw new Error("bad");
        return r.json();
      })
      .then((x: Item[]) => {
        if (off) return;
        const list = Array.isArray(x) ? x : [],
          ok = new Set(list.filter((i) => i.allowCart).map((i) => i.id));
        const gone = lines.filter((l) => !ok.has(l.productId));
        gone.forEach((l) => setQty(l.productId, 0));
        if (gone.length) setRemoved(true);
        setItems(list);
        setLoaded(true);
      })
      .catch(() => {
        if (!off) {
          setFail(true);
          setLoaded(true);
        }
      });
    return () => {
      off = true;
    };
  }, [key, ready, tick]); // eslint-disable-line react-hooks/exhaustive-deps
  const rows = lines
    .map((l) => ({ l, p: items.find((i) => i.id === l.productId) }))
    .filter((r): r is { l: (typeof lines)[number]; p: Item } => !!r.p);
  const total = rows.reduce((t, r) => t + (r.p.price ?? 0) * r.l.quantity, 0),
    qty = rows.reduce((t, r) => t + r.l.quantity, 0),
    unpriced = rows.some((r) => r.p.price == null),
    outRows = rows.filter((r) => !r.p.inStock);
  const nm = (p: Item) => (en ? p.nameEn || p.nameAr : p.nameAr || p.nameEn),
    money = (n: number) => `${n.toLocaleString("en-US")} ${d.cur}`;
  const phoneOk = isPhone(f.phone),
    nameOk = f.name.trim().length >= 2;
  const blocked = !!paused || outRows.length > 0;
  async function next() {
    if (!nameOk) return setErr(d.errName);
    if (!phoneOk) return setErr(d.err);
    if (!rows.length) return setErr(d.errItems);
    setErr("");
    if (!reps.length) return send();
    setBusy(true);
    // A returning customer's assigned rep wins; otherwise the rep whose link they came from
    const assigned = await fetch(`/api/reps/assigned?phone=${encodeURIComponent(f.phone.trim())}`)
      .then((r) => r.json())
      .then((x) => Number(x.repId) || 0)
      .catch(() => 0);
    setBusy(false);
    setLocked(reps.find((r) => r.id === assigned) ?? reps.find((r) => r.id === linkRep) ?? null);
    setStep(3);
  }
  async function send(repId?: number) {
    setErr("");
    setBusy(true);
    try {
      const customer = {
        name: f.name.trim(),
        company: f.company.trim() || undefined,
        phone: f.phone.trim(),
        city: f.city.trim() || undefined,
      };
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer,
          notes: f.notes.trim() || undefined,
          source: localStorage.getItem("dyllu-src") || undefined,
          repId,
          items: rows.map((r) => ({ productId: r.l.productId, quantity: r.l.quantity })),
        }),
      });
      const j = await res.json().catch(() => ({}));
      if (res.status === 503 && j.paused) return setPaused(en ? j.errorEn : j.error);
      if (!res.ok || !j.whatsappUrl) return setErr(res.status === 429 ? d.many : j.error || d.err);
      try {
        localStorage.setItem(
          "dyllu-customer",
          JSON.stringify({ name: customer.name ?? "", company: customer.company ?? "", phone: customer.phone, city: customer.city ?? "" }),
        );
      } catch {}
      const done: Sent = {
        number: j.number,
        token: j.token,
        wa: j.whatsappUrl,
        rep: reps.find((r) => r.id === (repId ?? locked?.id))?.name ?? null,
        total,
        unpriced,
        items: rows.map((r) => ({ name: nm(r.p), qty: r.l.quantity })),
      };
      try {
        sessionStorage.setItem(LAST, JSON.stringify(done));
      } catch {}
      setSent(done);
      clear();
      setStep(1);
      setTimeout(() => {
        window.location.href = j.whatsappUrl;
      }, 350);
    } catch {
      setErr(d.net);
    } finally {
      setBusy(false);
    }
  }
  function finish() {
    try {
      sessionStorage.removeItem(LAST);
    } catch {}
    setSent(null);
  }
  const Stepper = () => (
    <ol className="flex items-center gap-1.5 sm:gap-2" aria-label={d.title}>
      {[d.s1, d.s2, d.s3].map((l, i) => {
        const n = i + 1,
          done = n < step,
          on = n === step;
        return (
          <li key={l} className="flex items-center gap-1.5 sm:gap-2 flex-1 last:flex-none">
            <button
              disabled={n >= step}
              onClick={() => setStep(n as 1 | 2 | 3)}
              aria-current={on ? "step" : undefined}
              className="flex items-center gap-1.5 disabled:cursor-default"
            >
              <span
                className={`grid place-items-center w-7 h-7 rounded-full text-xs font-extrabold shrink-0 transition ${on ? "bg-ink text-lime" : done ? "bg-lime text-ink" : "bg-soft text-steel"}`}
              >
                {done ? <Icon n="check" s={14} stroke={3} /> : n}
              </span>
              <span className={`text-xs sm:text-sm font-bold whitespace-nowrap ${on ? "text-ink" : "text-steel"}`}>{l}</span>
            </button>
            {n < 3 && <i className={`h-0.5 flex-1 min-w-3 rounded-full ${done ? "bg-lime" : "bg-line"}`} />}
          </li>
        );
      })}
    </ol>
  );
  const Summary = ({ cta }: { cta?: React.ReactNode }) => (
    <div className="card p-5 space-y-3">
      <b className="block font-display">{d.summary}</b>
      <div className="flex justify-between text-sm">
        <span className="text-steel">{d.items}</span>
        <b>{rows.length}</b>
      </div>
      <div className="flex justify-between text-sm">
        <span className="text-steel">{d.count}</span>
        <b>{qty}</b>
      </div>
      <div className="border-t border-dashed border-line pt-3 flex justify-between items-end">
        <span className="font-bold">{d.total}</span>
        <b className="font-display text-2xl">{money(total)}</b>
      </div>
      {unpriced && <p className="text-xs text-steel leading-5">{d.unp}</p>}
      {cta}
      <p className="flex items-center gap-2 text-xs text-steel">
        <Icon n="shield" s={16} className="text-[#586000] shrink-0" />
        {d.secure}
      </p>
    </div>
  );
  if (sent && !rows.length)
    return (
      <div className="wrap pt-6 md:pt-10 pb-6">
        <div className="max-w-xl mx-auto space-y-4">
          <div className="card p-6 md:p-8 text-center space-y-3">
            <span className="w-16 h-16 rounded-full bg-lime grid place-items-center mx-auto shadow-[0_0_0_8px_rgba(208,223,0,.25)]">
              <Icon n="check" s={32} stroke={3} />
            </span>
            <h1 className="text-2xl md:text-3xl">{d.doneTitle}</h1>
            <p className="text-sm text-steel leading-7 max-w-sm mx-auto">{d.doneSub}</p>
            <div className="inline-flex items-center gap-2 rounded-full bg-soft px-4 py-2 text-sm">
              <span className="text-steel">{d.orderNo}</span>
              <b dir="ltr">{sent.number}</b>
            </div>
          </div>
          <div className="card overflow-hidden">
            {sent.rep && (
              <div className="flex items-center justify-between gap-3 px-5 py-3 bg-soft/60 border-b border-line text-sm">
                <span className="text-steel">{d.toRep}</span>
                <b>{sent.rep}</b>
              </div>
            )}
            <ul className="divide-y divide-line">
              {sent.items.map((it, i) => (
                <li key={i} className="flex items-center justify-between gap-3 px-5 py-3 text-sm">
                  <span className="min-w-0 truncate">{it.name}</span>
                  <span className="shrink-0 text-steel">
                    {d.qty}: <b className="text-ink">{it.qty}</b>
                  </span>
                </li>
              ))}
            </ul>
            <div className="flex items-end justify-between gap-3 px-5 py-4 border-t border-dashed border-line">
              <span className="font-bold">{d.total}</span>
              <span className="text-end">
                <b className="font-display text-2xl block">{money(sent.total)}</b>
                {sent.unpriced && <small className="text-xs text-steel">{d.unp}</small>}
              </span>
            </div>
          </div>
          <div className="grid gap-2">
            <a href={sent.wa} className="btn btn-lg bg-[#25D366] text-white hover:brightness-95 w-full">
              <Icon n="whatsapp" s={20} />
              {d.openWa}
            </a>
            <div className="grid grid-cols-2 gap-2">
              <Link href={`/order/${sent.token}`} className="btn btn-md btn-ghost bg-white">
                <Icon n="doc" s={18} />
                {d.invoice}
              </Link>
              <Link href="/products" onClick={finish} className="btn btn-md btn-dark">
                {d.newOrder}
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  if (!ready || (!loaded && key !== ""))
    return (
      <div className="wrap pt-8 grid lg:grid-cols-[1fr_360px] gap-6">
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="skeleton h-28" />
          ))}
        </div>
        <div className="skeleton h-64 hidden lg:block" />
      </div>
    );
  if (fail)
    return (
      <div className="wrap">
        <Empty icon="alert" title={d.net}>
          <button onClick={() => setTick((n) => n + 1)} className="btn btn-md btn-lime">
            {d.retry}
          </button>
        </Empty>
      </div>
    );
  if (!rows.length)
    return (
      <div className="wrap">
        {removed && <p className="mt-6 bg-accent/10 text-accent text-sm font-bold rounded-xl p-3">{d.removed}</p>}
        <Empty icon="cart" title={d.empty} sub={d.emptySub}>
          <Link href="/products" className="btn btn-lg btn-lime">
            {d.browse}
          </Link>
        </Empty>
      </div>
    );
  const primary =
    step === 1 ? (
      <button disabled={blocked} onClick={() => setStep(2)} className="btn btn-lg btn-lime w-full">
        {paused ? d.paused : d.co}
        {!paused && <Icon n="chev" s={18} className="flip-rtl" />}
      </button>
    ) : step === 2 ? (
      <button disabled={busy || blocked} onClick={next} className="btn btn-lg btn-lime w-full">
        {busy ? "..." : paused ? d.paused : reps.length ? d.next : d.sendNow}
        {!busy && !paused && <Icon n={reps.length ? "chev" : "whatsapp"} s={18} className={reps.length ? "flip-rtl" : ""} />}
      </button>
    ) : null;
  const errBox = err && (
    <p role="alert" className="flex items-center gap-2 rounded-xl bg-accent/10 text-accent text-sm font-bold p-3">
      <Icon n="alert" s={16} className="shrink-0" />
      {err}
    </p>
  );
  return (
    <div className="wrap pt-5 md:pt-8">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-5 md:mb-7">
        <h1 className="dy-tab">{d.title}</h1>
        <div className="w-full sm:w-auto sm:min-w-[380px]">
          <Stepper />
        </div>
      </div>
      {paused && (
        <div role="status" className="mb-4 flex items-start gap-3 rounded-2xl bg-ink text-white p-4">
          <span className="w-10 h-10 rounded-xl bg-accent grid place-items-center shrink-0">
            <Icon n="clock" s={20} />
          </span>
          <div className="text-sm leading-7">
            <b className="block text-lime">{d.paused}</b>
            {paused}
          </div>
        </div>
      )}
      {removed && <p className="mb-4 bg-accent/10 text-accent text-sm font-bold rounded-xl p-3">{d.removed}</p>}
      <div className="grid lg:grid-cols-[1fr_360px] gap-6 lg:gap-8 items-start">
        <div className="min-w-0 space-y-3">
          {step === 1 && (
            <>
              {outRows.length > 0 && (
                <p role="alert" className="flex items-center gap-2 rounded-xl bg-accent/10 text-accent text-sm font-bold p-3">
                  <Icon n="alert" s={16} className="shrink-0" />
                  {d.outBanner}
                </p>
              )}
              {rows.map(({ l, p }) => (
                <div key={p.id} className={`card p-3 sm:p-4 flex gap-3 sm:gap-4 ${p.inStock ? "" : "border-accent/40 bg-accent/[.03]"}`}>
                  <Link
                    href={`/products/${p.slug}`}
                    aria-label={nm(p)}
                    className={`w-20 h-20 sm:w-24 sm:h-24 rounded-xl bg-soft overflow-hidden shrink-0 ${p.inStock ? "" : "opacity-50"}`}
                  >
                    {p.image && <img src={p.image} alt="" className="w-full h-full object-contain p-1" />}
                  </Link>
                  <div className="flex-1 min-w-0 flex flex-col gap-2">
                    <div className="flex gap-2 items-start">
                      <div className="flex-1 min-w-0">
                        <Link
                          href={`/products/${p.slug}`}
                          className="font-bold text-sm sm:text-base leading-snug line-clamp-2 hover:underline"
                        >
                          {nm(p)}
                        </Link>
                        {p.sku && (
                          <small className="block text-xs text-steel mt-0.5" dir="ltr" style={{ textAlign: "start" }}>
                            {p.sku}
                          </small>
                        )}
                        {!p.inStock && (
                          <small className="inline-block mt-1 rounded-md bg-accent text-white px-2 py-0.5 text-[11px] font-extrabold">
                            {d.out}
                          </small>
                        )}
                      </div>
                      <button
                        aria-label={d.remove}
                        onClick={() => setQty(p.id, 0)}
                        className="btn-icon w-9 h-9 text-steel hover:text-accent hover:bg-accent/5 -mt-1 -me-1"
                      >
                        <Icon n="trash" s={18} />
                      </button>
                    </div>
                    <div className="flex items-center justify-between gap-2 mt-auto flex-wrap">
                      {p.inStock ? (
                        <div className="flex items-center rounded-xl border border-line">
                          <button
                            aria-label="-"
                            className="btn-icon w-10 h-10 text-steel hover:text-ink"
                            onClick={() => setQty(p.id, l.quantity - 1)}
                          >
                            <Icon n={l.quantity === 1 ? "trash" : "minus"} s={16} />
                          </button>
                          <span className="min-w-8 text-center font-extrabold">{l.quantity}</span>
                          <button
                            aria-label="+"
                            className="btn-icon w-10 h-10 text-steel hover:text-ink"
                            onClick={() => setQty(p.id, l.quantity + 1)}
                          >
                            <Icon n="plus" s={16} />
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => setQty(p.id, 0)} className="btn btn-sm h-9 bg-accent text-white">
                          <Icon n="trash" s={15} />
                          {d.remove}
                        </button>
                      )}
                      <div className="text-end">
                        {p.oldPrice != null && p.price != null && (
                          <s className="block text-xs text-steel">{money(p.oldPrice * l.quantity)}</s>
                        )}
                        <b className={`block ${p.oldPrice != null ? "text-accent" : ""}`}>
                          {p.price == null ? d.contact : money(p.price * l.quantity)}
                        </b>
                        {p.price != null && l.quantity > 1 && (
                          <small className="text-xs text-steel">
                            {money(p.price)} {d.each}
                          </small>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              <div className="flex justify-between text-sm pt-1">
                <Link href="/products" className="inline-flex items-center gap-1 font-bold text-steel hover:text-ink">
                  <Icon n="chev" s={16} className="rotate-180 rtl:rotate-0" />
                  {d.more}
                </Link>
                <button className="text-accent font-bold" onClick={() => confirm(d.confirmClear) && clear()}>
                  {d.clear}
                </button>
              </div>
            </>
          )}
          {step === 2 && (
            <div className="card overflow-hidden">
              <div className="p-4 sm:p-6 space-y-4">
                <div className="flex items-start gap-3">
                  <span className="w-10 h-10 rounded-xl bg-lime grid place-items-center shrink-0">
                    <Icon n="user" s={20} />
                  </span>
                  <div>
                    <h2 className="text-lg">{d.info}</h2>
                    <p className="text-sm text-steel mt-0.5">{d.infoSub}</p>
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  <Label t={d.name}>
                    <input
                      className={`field ${err === d.errName ? "border-accent ring-4 ring-accent/15" : ""}`}
                      placeholder={d.nameHint}
                      autoComplete="name"
                      enterKeyHint="next"
                      value={f.name}
                      onChange={(e) => {
                        setF({ ...f, name: e.target.value });
                        setErr("");
                      }}
                    />
                  </Label>
                  <Label t={d.phone}>
                    <input
                      className={`field ${err === d.err && !phoneOk ? "border-accent ring-4 ring-accent/15" : ""}`}
                      placeholder={d.phoneHint}
                      inputMode="tel"
                      autoComplete="tel"
                      dir="ltr"
                      enterKeyHint="next"
                      value={f.phone}
                      onChange={(e) => {
                        setF({ ...f, phone: toAsciiDigits(e.target.value) });
                        setErr("");
                      }}
                    />
                  </Label>
                </div>
              </div>
              <div className="p-4 sm:p-6 space-y-3 bg-soft/50 border-t border-line">
                <b className="block text-sm text-steel">
                  {d.extra} <small className="font-normal">({d.optional})</small>
                </b>
                <div className="grid sm:grid-cols-2 gap-3">
                  <Label t={d.company}>
                    <input
                      className="field bg-white"
                      autoComplete="organization"
                      value={f.company}
                      onChange={(e) => setF({ ...f, company: e.target.value })}
                    />
                  </Label>
                  <Label t={d.city}>
                    <input
                      className="field bg-white"
                      autoComplete="address-level2"
                      value={f.city}
                      onChange={(e) => setF({ ...f, city: e.target.value })}
                    />
                  </Label>
                </div>
                <Label t={d.notes}>
                  <textarea
                    className="field bg-white"
                    rows={2}
                    placeholder={d.notesHint}
                    value={f.notes}
                    onChange={(e) => setF({ ...f, notes: e.target.value })}
                  />
                </Label>
              </div>
              <div className="p-4 sm:px-6 space-y-3 border-t border-line">
                {errBox}
                <button onClick={() => setStep(1)} className="btn btn-md btn-ghost">
                  <Icon n="chev" s={16} className="rotate-180 rtl:rotate-0" />
                  {d.back}
                </button>
              </div>
            </div>
          )}
          {step === 3 && (
            <div className="space-y-4">
              <div className="card p-4 flex items-center gap-3 text-sm">
                <Icon n="user" s={18} className="text-steel shrink-0" />
                <span className="flex-1 min-w-0 truncate">
                  <b>{f.name}</b> · <span dir="ltr">{f.phone}</span>
                </span>
                <button onClick={() => setStep(2)} className="font-bold text-steel hover:text-ink underline underline-offset-4">
                  {d.edit}
                </button>
              </div>
              {locked ? (
                <div className="card p-5 sm:p-6 space-y-4 ring-2 ring-lime border-transparent">
                  <div className="flex items-center gap-4">
                    <Avatar r={locked} big />
                    <div className="min-w-0">
                      <small className="inline-block mb-1 rounded-md bg-lime px-2 py-0.5 text-[11px] font-extrabold">{d.mine}</small>
                      <b className="block text-lg">{locked.name}</b>
                      <small className="text-steel inline-flex items-center gap-1">
                        <Icon n="pin" s={14} />
                        {locked.location}
                      </small>
                    </div>
                  </div>
                  <p className="text-sm text-steel">{d.mineSub}</p>
                  <button disabled={busy || blocked} onClick={() => send(locked.id)} className="btn btn-lg btn-lime w-full">
                    <Icon n="whatsapp" s={20} />
                    {busy ? "..." : paused ? d.paused : `${d.sendTo} ${locked.name}`}
                  </button>
                </div>
              ) : (
                <>
                  <div className="px-1">
                    <h2 className="text-lg">{d.pick}</h2>
                    <p className="text-sm text-steel mt-0.5">{d.pickSub}</p>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {reps.map((r) => (
                      <button
                        key={r.id}
                        disabled={busy || blocked}
                        onClick={() => send(r.id)}
                        className="group card p-4 flex items-center gap-3 text-start transition hover:shadow-lift hover:border-transparent disabled:opacity-60"
                      >
                        <Avatar r={r} />
                        <span className="flex-1 min-w-0">
                          <b className="block truncate">{r.name}</b>
                          <small className="text-steel inline-flex items-center gap-1">
                            <Icon n="pin" s={14} />
                            {r.location}
                          </small>
                        </span>
                        <span className="btn btn-sm btn-lime group-hover:bg-lime-dark shrink-0">
                          <Icon n="whatsapp" s={16} />
                          {busy ? "..." : d.via}
                        </span>
                      </button>
                    ))}
                  </div>
                </>
              )}
              {errBox}
              <button onClick={() => setStep(2)} className="btn btn-md btn-ghost">
                <Icon n="chev" s={16} className="rotate-180 rtl:rotate-0" />
                {d.back}
              </button>
              <div className="lg:hidden">
                <Summary />
              </div>
            </div>
          )}
        </div>
        <aside className="hidden lg:block lg:sticky lg:top-28">
          <Summary cta={primary} />
        </aside>
      </div>
      {primary && (
        <>
          <div className="h-28 lg:hidden" aria-hidden />
          <div className="lg:hidden fixed inset-x-0 bottom-[calc(64px+env(safe-area-inset-bottom))] md:bottom-0 md:pb-safe z-30 bg-white/95 backdrop-blur border-t border-line shadow-[0_-8px_24px_-12px_rgba(43,45,47,.25)]">
            <div className="wrap py-3 flex items-center gap-3">
              <div className="min-w-[84px]">
                <small className="block text-steel text-[11px] font-bold">
                  {d.total} · {qty} {en ? "pcs" : "قطعة"}
                </small>
                <b className="font-display">{money(total)}</b>
              </div>
              <div className="flex-1">{primary}</div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
