// Copyright (c) 2026 Abdullah Al-Sakni. All rights reserved. DYLLU Catalog.
"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Icon from "@/components/Icon";
import { post } from "@/lib/client";
import { isPhone, localPhone, waHref } from "@/lib/phone";
import { toast } from "@/store/toast";
import { ask } from "@/store/confirm";
import { AEmpty, Badge, Card, PageHead } from "./ui";
import Switch from "./Switch";
type Shop = {
  id: number;
  name: string;
  code: string;
  phone: string;
  isActive: boolean;
  tradeAccess: boolean;
  lastUsedAt: string | null;
  scans: number;
};
type Scan = { id: number; shop: string; barcode: string; product: string | null; productId: number | null; at: string };
const when = (iso: string | null) => {
  if (!iso) return "لم يستخدم التطبيق بعد";
  const m = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return "الآن";
  if (m < 60) return `قبل ${m} دقيقة`;
  if (m < 1440) return `قبل ${Math.round(m / 60)} ساعة`;
  return new Date(iso).toLocaleDateString("ar-SA-u-nu-latn", { day: "numeric", month: "short", year: "numeric" });
};
export default function TradeManager({
  link,
  shops,
  scans,
  coverage,
}: {
  link: string;
  shops: Shop[];
  scans: Scan[];
  coverage: { withBarcode: number; total: number };
}) {
  const r = useRouter(),
    [name, setName] = useState(""),
    [phone, setPhone] = useState(""),
    [busy, setBusy] = useState(false),
    [edit, setEdit] = useState<number | null>(null),
    [editPhone, setEditPhone] = useState("");
  const general = `تطبيق DYLLU Trade لأسعار الجملة 📦\n${link}\n\nافتح الرابط وثبّت التطبيق على جوالك، ثم ادخل بكود محلك ورقم جوالك المسجّل لدى DYLLU.`;
  const forShop = (s: Shop) =>
    `أهلًا ${s.name} 👋\nتم اعتماد محلك في تطبيق DYLLU Trade لأسعار الجملة.\n\nرابط التطبيق:\n${link}\n\nبيانات الدخول:\nالكود: ${s.code}\nرقم الجوال: ${localPhone(s.phone)}\n\nللتثبيت على الجوال:\n• آيفون: افتح الرابط في Safari ← زر المشاركة ← «إضافة إلى الشاشة الرئيسية»\n• أندرويد: افتح الرابط في Chrome ← «تثبيت التطبيق»\n\nبعدها امسح باركود أي منتج DYLLU ويظهر لك سعر الجملة.`;
  const copy = (t: string, msg: string) => {
    navigator.clipboard?.writeText(t);
    toast(msg);
  };
  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return toast("اكتب اسم المحل", { tone: "err" });
    if (!isPhone(phone)) return toast("اكتب رقم جوال صحيح", { tone: "err" });
    setBusy(true);
    const x = await post("/api/admin/trade", { name, phone });
    setBusy(false);
    if (!x.ok) return toast(x.data.error, { tone: "err" });
    setName("");
    setPhone("");
    toast(`تم اعتماد ${x.data.name} · الكود ${x.data.code}`);
    r.refresh();
  }
  async function update(s: Shop, data: Record<string, unknown>, ok: string) {
    const x = await post("/api/admin/trade", { id: s.id, ...data }, "PUT");
    if (!x.ok) return (toast(x.data.error, { tone: "err" }), false);
    toast(ok);
    r.refresh();
    return true;
  }
  async function signOut(s: Shop) {
    if (!(await ask({ title: `إخراج ${s.name} من كل الأجهزة؟`, body: "يحتاج صاحب المحل يدخل الكود ورقم الجوال من جديد.", ok: "إخراج" })))
      return;
    update(s, { signOut: true }, "تم تسجيل الخروج من كل الأجهزة");
  }
  const active = shops.filter((s) => s.tradeAccess && s.isActive).length;
  return (
    <div className="max-w-5xl space-y-5">
      <PageHead
        title="إرسال تطبيق أصحاب المحلات"
        desc="أرسل رابط تطبيق DYLLU Trade لأصحاب المحلات. يمسحون باركود المنتج ويظهر لهم سعر الجملة، بشرط أن يكون المحل معتمدًا هنا."
      />
      <section className="rounded-3xl bg-ink text-white p-5 md:p-6 space-y-4">
        <div className="flex items-center gap-3">
          <span className="w-12 h-12 rounded-2xl bg-lime text-ink grid place-items-center shrink-0">
            <Icon n="qr" s={24} />
          </span>
          <div className="min-w-0">
            <b className="block font-display text-lg">DYLLU Trade</b>
            <small className="text-white/70">تطبيق يُثبَّت على الجوال بدون متجر التطبيقات</small>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-2xl bg-white/10 p-2 ps-4">
          <code dir="ltr" className="flex-1 min-w-0 truncate text-sm font-bold text-lime">
            {link}
          </code>
          <button onClick={() => copy(link, "تم نسخ رابط التطبيق")} className="btn btn-sm h-10 bg-lime text-ink shrink-0">
            <Icon n="copy" s={16} />
            نسخ الرابط
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          <a
            href={`https://wa.me/?text=${encodeURIComponent(general)}`}
            target="_blank"
            rel="noreferrer"
            className="btn btn-md bg-[#25D366] text-white"
          >
            <Icon n="whatsapp" s={18} />
            مشاركة عبر واتساب
          </a>
          <a href="/trade" target="_blank" rel="noreferrer" className="btn btn-md bg-white/10 text-white hover:bg-white/20">
            <Icon n="external" s={18} />
            فتح التطبيق
          </a>
        </div>
        <p className="flex gap-2 text-sm text-white/80 leading-7">
          <Icon n="shield" s={18} className="text-lime shrink-0 mt-1" />
          الرابط وحده لا يعرض أي سعر. التطبيق يطلب كود المحل ورقم الجوال المسجّل، والأسعار تُرسل من السيرفر فقط للمحلات المعتمدة. أوقف أي
          محل ويفقد الوصول فورًا.
        </p>
      </section>

      <div className="grid sm:grid-cols-3 gap-3">
        <div className="card p-4">
          <small className="text-xs text-steel font-bold">محلات معتمدة</small>
          <b className="block font-display text-2xl mt-1">{active}</b>
        </div>
        <div className="card p-4">
          <small className="text-xs text-steel font-bold">عمليات مسح</small>
          <b className="block font-display text-2xl mt-1">{shops.reduce((a, s) => a + s.scans, 0)}</b>
        </div>
        <Link href="/admin/products" className="card p-4 hover:border-ink/30">
          <small className="text-xs text-steel font-bold">منتجات لها باركود</small>
          <b className="block font-display text-2xl mt-1">
            {coverage.withBarcode} <small className="text-sm text-steel">من {coverage.total}</small>
          </b>
        </Link>
      </div>

      <Card title="اعتماد محل جديد" desc="يُنشأ للمحل كود خاص. أرسله له مع الرابط عبر واتساب.">
        <form onSubmit={create} className="grid sm:grid-cols-[1fr_1fr_auto] gap-2">
          <input className="field" placeholder="اسم المحل" value={name} onChange={(e) => setName(e.target.value)} />
          <input
            className="field"
            dir={phone ? "ltr" : "rtl"}
            type="tel"
            inputMode="tel"
            placeholder="رقم جوال صاحب المحل"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <button disabled={busy} className="btn btn-lg btn-lime">
            <Icon n="plus" s={18} />
            {busy ? "..." : "اعتماد"}
          </button>
        </form>
      </Card>

      <Card title="المحلات" desc="أكواد الجملة الحالية تظهر هنا أيضًا. فعّل «تطبيق المحلات» لأي كود بعد إضافة رقم جوال صاحبه.">
        <div className="divide-y divide-line -mx-4 md:-mx-5">
          {shops.map((s) => {
            const on = s.tradeAccess && s.isActive;
            return (
              <div key={s.id} className={`px-4 md:px-5 py-3 space-y-2 ${on ? "" : "bg-soft/40"}`}>
                <div className="flex flex-wrap items-center gap-3">
                  <span
                    className={`w-10 h-10 rounded-xl grid place-items-center shrink-0 ${on ? "bg-lime text-ink" : "bg-soft text-steel"}`}
                  >
                    <Icon n="key" s={18} />
                  </span>
                  <div className="flex-1 min-w-[150px]">
                    <b className="block text-sm">
                      {s.name}
                      {!s.isActive && <Badge cls="bg-soft text-steel ms-2">الكود موقوف</Badge>}
                    </b>
                    <small className="text-xs text-steel">
                      {when(s.lastUsedAt)} · {s.scans} مسح
                    </small>
                  </div>
                  <button
                    onClick={() => copy(s.code, `تم نسخ ${s.code}`)}
                    dir="ltr"
                    className="inline-flex items-center gap-2 bg-soft hover:bg-line rounded-xl px-3 h-10 font-extrabold tracking-widest text-sm"
                  >
                    <Icon n="copy" s={16} className="text-steel" />
                    {s.code}
                  </button>
                  <Switch
                    on={s.tradeAccess}
                    onChange={(v) =>
                      s.phone || !v
                        ? update(s, { tradeAccess: v }, v ? "تم تفعيل التطبيق للمحل" : "تم إيقاف التطبيق للمحل")
                        : (setEdit(s.id), setEditPhone(""), toast("أضف رقم جوال المحل أولًا", { tone: "err" }))
                    }
                    ariaLabel={`تطبيق المحلات لـ ${s.name}`}
                  />
                </div>
                <div className="flex flex-wrap items-center gap-2 ps-[52px]">
                  {edit === s.id ? (
                    <form
                      className="flex gap-2 w-full sm:w-auto"
                      onSubmit={async (e) => {
                        e.preventDefault();
                        if (!isPhone(editPhone)) return toast("اكتب رقم جوال صحيح", { tone: "err" });
                        if (await update(s, { phone: editPhone, ...(s.tradeAccess ? {} : { tradeAccess: true }) }, "تم حفظ الرقم"))
                          setEdit(null);
                      }}
                    >
                      <input
                        autoFocus
                        className="field h-10 flex-1 sm:w-48"
                        dir="ltr"
                        type="tel"
                        inputMode="tel"
                        placeholder="05XXXXXXXX"
                        value={editPhone}
                        onChange={(e) => setEditPhone(e.target.value)}
                      />
                      <button className="btn btn-sm h-10 btn-lime">حفظ</button>
                      <button type="button" onClick={() => setEdit(null)} className="btn btn-sm h-10 btn-ghost">
                        إلغاء
                      </button>
                    </form>
                  ) : (
                    <button
                      onClick={() => {
                        setEdit(s.id);
                        setEditPhone(s.phone ? localPhone(s.phone) : "");
                      }}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-steel hover:text-ink h-8"
                    >
                      <Icon n="phone" s={14} />
                      <span dir="ltr">{s.phone ? localPhone(s.phone) : "إضافة رقم الجوال"}</span>
                      <Icon n="edit" s={13} />
                    </button>
                  )}
                  {on && s.phone && edit !== s.id && (
                    <>
                      <a
                        href={waHref(s.phone, forShop(s))}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-[#25D366] rounded-lg px-2.5 h-8"
                      >
                        <Icon n="whatsapp" s={14} />
                        إرسال للمحل
                      </a>
                      <button
                        onClick={() => signOut(s)}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-steel hover:text-accent rounded-lg px-2.5 h-8 bg-soft"
                      >
                        <Icon n="logout" s={14} />
                        إخراج من الأجهزة
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
          {shops.length === 0 && <AEmpty icon="key" title="لا توجد محلات بعد" />}
        </div>
      </Card>

      <Card title="آخر عمليات المسح">
        {scans.length ? (
          <div className="divide-y divide-line -mx-4 md:-mx-5 text-sm">
            {scans.map((s) => (
              <div key={s.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 md:px-5 py-2.5">
                <b className="min-w-0 truncate">{s.shop}</b>
                <span className="text-steel" dir="ltr">
                  {s.barcode}
                </span>
                <span className="flex-1 min-w-0 truncate">
                  {s.product ? (
                    <Link href={`/admin/products/${s.productId}`} className="hover:underline">
                      {s.product}
                    </Link>
                  ) : (
                    <Badge cls="bg-accent/10 text-accent">غير موجود</Badge>
                  )}
                </span>
                <small className="text-xs text-steel">{when(s.at)}</small>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-steel text-center py-6">لا توجد عمليات مسح بعد</p>
        )}
      </Card>
    </div>
  );
}
