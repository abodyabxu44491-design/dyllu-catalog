// Copyright (c) 2026 Abdullah Al-Sakni. All rights reserved. DYLLU Catalog.
"use client";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import BarcodeScanner from "@/components/BarcodeScanner";
import Icon from "@/components/Icon";
import InstallApp from "@/components/InstallApp";
type Product = {
  id: number;
  name: string;
  nameEn: string;
  sku: string | null;
  barcode: string | null;
  category: string;
  description: string | null;
  images: string[];
  wholesalePrice: number | null;
  price: number | null;
  inStock: boolean;
  specs: { nameAr: string; value: string }[];
  features: string[];
};
type Recent = { b: string; name: string };
type View =
  | { k: "home" }
  | { k: "manual" }
  | { k: "loading"; b: string }
  | { k: "found"; p: Product; b: string }
  | { k: "missing"; b: string };
const RECENT = "dy-trade-recent";
const sar = (n: number) => `${n.toLocaleString("en-US", { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 })}`;
function readRecent(): Recent[] {
  try {
    return JSON.parse(localStorage.getItem(RECENT) || "[]");
  } catch {
    return [];
  }
}
export default function TradeApp({ shop }: { shop: string }) {
  const r = useRouter(),
    [view, setView] = useState<View>({ k: "home" }),
    [scan, setScan] = useState(false),
    [manual, setManual] = useState(""),
    [err, setErr] = useState(""),
    [img, setImg] = useState(0),
    [recent, setRecent] = useState<Recent[]>([]);
  useEffect(() => setRecent(readRecent()), []);
  const lookup = useCallback(
    async (raw: string) => {
      const b = raw.trim();
      if (!b) return;
      setErr("");
      setImg(0);
      setView({ k: "loading", b });
      const res = await fetch(`/api/trade/lookup?b=${encodeURIComponent(b)}`, { cache: "no-store" }).catch(() => null);
      if (!res) {
        setErr("لا يوجد اتصال بالإنترنت، تأكد من الشبكة وحاول مرة أخرى");
        return setView({ k: "home" });
      }
      if (res.status === 401) return r.refresh();
      const x = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(x.error ?? "تعذر البحث، حاول مرة أخرى");
        return setView({ k: "home" });
      }
      if (!x.found) return setView({ k: "missing", b: x.barcode ?? b });
      setView({ k: "found", p: x.product, b });
      const next = [{ b, name: x.product.name }, ...readRecent().filter((i) => i.b !== b)].slice(0, 6);
      setRecent(next);
      try {
        localStorage.setItem(RECENT, JSON.stringify(next));
      } catch {}
      window.scrollTo({ top: 0 });
    },
    [r],
  );
  const onScan = useCallback(
    (code: string) => {
      setScan(false);
      lookup(code);
    },
    [lookup],
  );
  async function logout() {
    await fetch("/api/trade/login", { method: "DELETE" });
    try {
      localStorage.removeItem(RECENT);
    } catch {}
    r.refresh();
  }
  const again = (
    <div className="grid grid-cols-2 gap-2">
      <button onClick={() => setScan(true)} className="btn btn-lg btn-lime">
        <Icon n="qr" s={20} />
        مسح منتج آخر
      </button>
      <button onClick={() => setView({ k: "manual" })} className="btn btn-lg btn-ghost bg-white">
        <Icon n="edit" s={18} />
        إدخال يدوي
      </button>
    </div>
  );
  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-40 bg-ink text-white border-b-[3px] border-lime pt-[env(safe-area-inset-top)]">
        <div className="max-w-lg mx-auto flex items-center gap-3 h-14 px-4">
          {view.k !== "home" ? (
            <button onClick={() => setView({ k: "home" })} aria-label="رجوع" className="btn-icon w-10 h-10 -ms-2 hover:bg-white/10">
              <Icon n="chev" s={22} />
            </button>
          ) : null}
          <img src="/brand/logo-wordmark-white.png" alt="DYLLU" className="h-7 w-auto shrink-0" />
          <span className="text-[10px] font-extrabold text-ink bg-lime rounded-full px-2 py-0.5 tracking-wider">TRADE</span>
          <b className="ms-auto min-w-0 truncate text-sm text-white/80">{shop}</b>
          <button onClick={logout} aria-label="تسجيل الخروج" className="btn-icon w-10 h-10 -me-2 hover:bg-white/10 shrink-0">
            <Icon n="logout" s={20} />
          </button>
        </div>
      </header>
      <main className="flex-1 w-full max-w-lg mx-auto px-4 py-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] space-y-4">
        {err && (
          <p role="alert" className="flex items-start gap-2 text-sm font-bold text-accent bg-white border border-accent/30 rounded-2xl p-3">
            <Icon n="alert" s={18} className="shrink-0 mt-0.5" />
            {err}
          </p>
        )}
        {view.k === "home" && (
          <>
            <div className="rounded-3xl bg-ink text-white p-5">
              <small className="text-lime font-bold">أهلًا {shop}</small>
              <h1 className="text-xl mt-1">امسح باركود المنتج لمعرفة سعر الجملة</h1>
            </div>
            <button
              onClick={() => setScan(true)}
              className="w-full rounded-3xl bg-lime text-ink p-6 flex items-center gap-4 text-start shadow-card active:scale-[.98] transition"
            >
              <span className="w-16 h-16 rounded-2xl bg-ink text-lime grid place-items-center shrink-0 text-3xl" aria-hidden>
                📷
              </span>
              <span>
                <b className="block text-xl font-display">مسح الباركود</b>
                <small className="text-ink/70">افتح الكاميرا ووجّهها على باركود العبوة</small>
              </span>
            </button>
            <button
              onClick={() => setView({ k: "manual" })}
              className="w-full rounded-3xl bg-white border border-line p-6 flex items-center gap-4 text-start shadow-card active:scale-[.98] transition"
            >
              <span className="w-16 h-16 rounded-2xl bg-soft grid place-items-center shrink-0 text-3xl" aria-hidden>
                ⌨️
              </span>
              <span>
                <b className="block text-xl font-display">إدخال الباركود يدويًا</b>
                <small className="text-steel">اكتب الرقم المطبوع تحت الباركود</small>
              </span>
            </button>
            {recent.length > 0 && (
              <section className="card p-4">
                <b className="block text-sm mb-2">آخر المنتجات</b>
                <div className="divide-y divide-line">
                  {recent.map((i) => (
                    <button key={i.b} onClick={() => lookup(i.b)} className="w-full flex items-center gap-3 py-2.5 text-start">
                      <Icon n="clock" s={16} className="text-steel shrink-0" />
                      <span className="flex-1 min-w-0 truncate text-sm font-bold">{i.name}</span>
                      <small className="text-xs text-steel" dir="ltr">
                        {i.b}
                      </small>
                    </button>
                  ))}
                </div>
              </section>
            )}
            <InstallApp variant="admin-side" />
          </>
        )}
        {view.k === "manual" && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              lookup(manual);
            }}
            className="card p-5 space-y-4"
          >
            <label className="block">
              <b className="block mb-2">رقم الباركود</b>
              <input
                autoFocus
                className="field h-14 text-center text-xl font-extrabold tracking-[.15em]"
                dir="ltr"
                inputMode="numeric"
                autoComplete="off"
                placeholder="6281234567890"
                value={manual}
                onChange={(e) => setManual(e.target.value)}
              />
            </label>
            <button disabled={!manual.trim()} className="btn btn-lg btn-lime w-full">
              <Icon n="search" s={18} />
              عرض المنتج
            </button>
          </form>
        )}
        {view.k === "loading" && (
          <div className="card p-10 text-center space-y-3" aria-live="polite">
            <span className="block w-10 h-10 mx-auto rounded-full border-4 border-lime border-t-transparent animate-spin" />
            <p className="text-steel text-sm">
              جارٍ البحث عن <b dir="ltr">{view.b}</b>
            </p>
          </div>
        )}
        {view.k === "missing" && (
          <div className="space-y-4">
            <div className="card p-6 text-center space-y-3" role="alert">
              <span className="w-14 h-14 rounded-2xl bg-accent/10 text-accent grid place-items-center mx-auto">
                <Icon n="alert" s={28} />
              </span>
              <h2 className="text-lg">المنتج غير موجود</h2>
              <p className="text-sm text-steel leading-7">
                الباركود{" "}
                <b dir="ltr" className="text-ink">
                  {view.b}
                </b>{" "}
                غير مسجّل في كتالوج DYLLU. تأكد من الرقم أو تواصل مع DYLLU.
              </p>
            </div>
            {again}
          </div>
        )}
        {view.k === "found" && (
          <article className="space-y-4">
            <div className="card overflow-hidden">
              <div className="relative bg-white aspect-square">
                {view.p.images[img] ? (
                  <img src={view.p.images[img]} alt={view.p.name} className="absolute inset-0 w-full h-full object-contain p-4" />
                ) : (
                  <span className="absolute inset-0 grid place-items-center text-steel">
                    <Icon n="image" s={40} />
                  </span>
                )}
                {!view.p.inStock && (
                  <span className="absolute top-3 start-3 text-xs font-bold bg-ink text-white rounded-full px-3 py-1">
                    غير متوفر حاليًا
                  </span>
                )}
              </div>
              {view.p.images.length > 1 && (
                <div className="flex gap-2 p-3 overflow-x-auto no-scrollbar border-t border-line">
                  {view.p.images.map((u, i) => (
                    <button
                      key={u + i}
                      onClick={() => setImg(i)}
                      aria-label={`صورة ${i + 1}`}
                      className={`w-14 h-14 rounded-xl border-2 shrink-0 bg-white overflow-hidden ${i === img ? "border-lime" : "border-line"}`}
                    >
                      <img src={u} alt="" className="w-full h-full object-contain" />
                    </button>
                  ))}
                </div>
              )}
              <div className="p-5 space-y-3">
                <small className="text-xs font-bold text-accent">{view.p.category}</small>
                <h1 className="text-xl leading-snug">{view.p.name}</h1>
                {view.p.nameEn && view.p.nameEn !== view.p.name && (
                  <p className="text-sm text-steel" dir="ltr">
                    {view.p.nameEn}
                  </p>
                )}
                <div className="rounded-2xl bg-ink text-white p-4 flex items-end justify-between gap-3">
                  <div>
                    <small className="text-lime text-xs font-bold">سعر الجملة</small>
                    <b className="block font-display text-4xl leading-tight" dir="ltr">
                      {view.p.wholesalePrice != null ? sar(view.p.wholesalePrice) : "—"}
                      {view.p.wholesalePrice != null && <small className="text-base font-bold text-white/70 ms-1">ريال</small>}
                    </b>
                    {view.p.wholesalePrice == null && <small className="text-white/70">لم يُحدَّد سعر جملة، تواصل مع DYLLU</small>}
                  </div>
                  {view.p.price != null && (
                    <div className="text-end">
                      <small className="block text-white/60 text-xs">سعر البيع للمستهلك</small>
                      <b className="text-lg" dir="ltr">
                        {sar(view.p.price)} <small className="text-xs text-white/60">ريال</small>
                      </b>
                    </div>
                  )}
                </div>
                <dl className="grid grid-cols-2 gap-2 text-sm">
                  {view.p.sku && (
                    <div className="rounded-xl bg-soft p-3">
                      <dt className="text-xs text-steel">رقم الموديل</dt>
                      <dd className="font-bold" dir="ltr">
                        {view.p.sku}
                      </dd>
                    </div>
                  )}
                  {view.p.barcode && (
                    <div className="rounded-xl bg-soft p-3">
                      <dt className="text-xs text-steel">الباركود</dt>
                      <dd className="font-bold" dir="ltr">
                        {view.p.barcode}
                      </dd>
                    </div>
                  )}
                </dl>
              </div>
            </div>
            {view.p.features.length > 0 && (
              <section className="card p-5">
                <h2 className="text-base mb-3">المميزات</h2>
                <ul className="space-y-2 text-sm">
                  {view.p.features.map((f, i) => (
                    <li key={i} className="flex gap-2">
                      <Icon n="check" s={16} className="text-lime-dark shrink-0 mt-1" />
                      {f}
                    </li>
                  ))}
                </ul>
              </section>
            )}
            {view.p.specs.length > 0 && (
              <section className="card overflow-hidden">
                <h2 className="text-base p-5 pb-3">المواصفات</h2>
                <dl className="divide-y divide-line text-sm">
                  {view.p.specs.map((s, i) => (
                    <div key={i} className="flex gap-3 px-5 py-2.5">
                      <dt className="w-2/5 text-steel shrink-0">{s.nameAr}</dt>
                      <dd className="font-bold">{s.value}</dd>
                    </div>
                  ))}
                </dl>
              </section>
            )}
            {view.p.description && (
              <section className="card p-5">
                <h2 className="text-base mb-2">التفاصيل</h2>
                <p className="text-sm leading-7 text-ink/80 whitespace-pre-line">{view.p.description}</p>
              </section>
            )}
            {again}
          </article>
        )}
      </main>
      {scan && <BarcodeScanner onResult={onScan} onClose={() => setScan(false)} />}
    </div>
  );
}
