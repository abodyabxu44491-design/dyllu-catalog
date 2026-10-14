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
  link: string;
  isActive: boolean;
  tradeAccess: boolean;
  lastUsedAt: string | null;
  scans: number;
};
type Scan = { id: number; shop: string; barcode: string; product: string | null; productId: number | null; at: string };
const when = (iso: string | null) => {
  if (!iso) return "لم يفتح التطبيق بعد";
  const m = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return "الآن";
  if (m < 60) return `قبل ${m} دقيقة`;
  if (m < 1440) return `قبل ${Math.round(m / 60)} ساعة`;
  return new Date(iso).toLocaleDateString("ar-SA-u-nu-latn", { day: "numeric", month: "short", year: "numeric" });
};
const message = (s: Shop) =>
  `أهلًا ${s.name} 👋\nهذا رابط تطبيق DYLLU Trade الخاص بمحلك لمعرفة أسعار الجملة:\n${s.link}\n\nافتحه وثبّته على جوالك:\n• آيفون: من Safari ← زر المشاركة ← «إضافة إلى الشاشة الرئيسية»\n• أندرويد: من Chrome ← «تثبيت التطبيق»\n\nبعدها امسح باركود أي منتج DYLLU ويظهر لك سعر الجملة.\nالرابط خاص بمحلك، لا تشاركه مع أحد.`;
const waFor = (s: Shop) => (s.phone ? waHref(s.phone, message(s)) : `https://wa.me/?text=${encodeURIComponent(message(s))}`);
export default function TradeManager({
  shops,
  scans,
  coverage,
}: {
  shops: Shop[];
  scans: Scan[];
  coverage: { withBarcode: number; total: number };
}) {
  const r = useRouter(),
    [name, setName] = useState(""),
    [phone, setPhone] = useState(""),
    [busy, setBusy] = useState(false),
    [fresh, setFresh] = useState<number | null>(null),
    [edit, setEdit] = useState<number | null>(null),
    [editPhone, setEditPhone] = useState("");
  const copy = (t: string, msg: string) => {
    navigator.clipboard?.writeText(t);
    toast(msg);
  };
  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return toast("اكتب اسم المحل", { tone: "err" });
    if (phone.trim() && !isPhone(phone)) return toast("رقم الجوال غير صحيح، أو اتركه فارغًا", { tone: "err" });
    setBusy(true);
    const x = await post("/api/admin/trade", { name, phone });
    setBusy(false);
    if (!x.ok) return toast(x.data.error, { tone: "err" });
    setName("");
    setPhone("");
    setFresh(x.data.id);
    toast(`رابط ${x.data.name} جاهز، انسخه أو أرسله عبر واتساب`);
    r.refresh();
  }
  async function update(s: Shop, data: Record<string, unknown>, ok: string) {
    const x = await post("/api/admin/trade", { id: s.id, ...data }, "PUT");
    if (!x.ok) return (toast(x.data.error, { tone: "err" }), false);
    toast(ok);
    r.refresh();
    return true;
  }
  async function newLink(s: Shop) {
    if (
      !(await ask({
        title: `رابط جديد لـ ${s.name}؟`,
        body: "الرابط الحالي يتوقف فورًا على كل الأجهزة، وترسل للمحل الرابط الجديد.",
        ok: "إنشاء رابط جديد",
      }))
    )
      return;
    if (await update(s, { signOut: true }, "تم إنشاء رابط جديد، أرسله للمحل")) setFresh(s.id);
  }
  const active = shops.filter((s) => s.tradeAccess && s.isActive).length;
  return (
    <div className="max-w-5xl space-y-5">
      <PageHead
        title="إرسال تطبيق أصحاب المحلات"
        desc="كل محل له رابط خاص يفتح تطبيق DYLLU Trade مباشرة بدون كود أو كلمة مرور. صاحب المحل يمسح باركود المنتج ويظهر له سعر الجملة."
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
        <ol className="grid sm:grid-cols-3 gap-2 text-sm">
          {["أضف المحل بالأسفل", "انسخ رابطه أو أرسله عبر واتساب", "يفتحه صاحب المحل ويثبّت التطبيق"].map((t, i) => (
            <li key={t} className="flex items-center gap-2 rounded-2xl bg-white/10 p-3">
              <b className="w-7 h-7 rounded-full bg-lime text-ink grid place-items-center shrink-0 text-xs">{i + 1}</b>
              {t}
            </li>
          ))}
        </ol>
        <p className="flex gap-2 text-sm text-white/80 leading-7">
          <Icon n="shield" s={18} className="text-lime shrink-0 mt-1" />
          الرابط خاص بكل محل. أوقف المحل أو أنشئ له رابطًا جديدًا ويتوقف الرابط القديم فورًا. فتح التطبيق بدون الرابط الخاص لا يعرض أي سعر.
        </p>
      </section>

      <div className="grid sm:grid-cols-3 gap-3">
        <div className="card p-4">
          <small className="text-xs text-steel font-bold">محلات مفعّلة</small>
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

      <Card title="إضافة محل" desc="يُنشأ للمحل رابط خاص فورًا. رقم الجوال اختياري، يُستخدم لإرسال الرابط مباشرة عبر واتساب.">
        <form onSubmit={create} className="grid sm:grid-cols-[1fr_1fr_auto] gap-2">
          <input className="field" placeholder="اسم المحل" value={name} onChange={(e) => setName(e.target.value)} />
          <input
            className="field"
            dir={phone ? "ltr" : "rtl"}
            type="tel"
            inputMode="tel"
            placeholder="جوال المحل (اختياري)"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <button disabled={busy} className="btn btn-lg btn-lime">
            <Icon n="plus" s={18} />
            {busy ? "..." : "إضافة"}
          </button>
        </form>
      </Card>

      <Card title="المحلات" desc="أكواد الجملة الحالية تظهر هنا أيضًا، فعّل التطبيق لأي منها ويُنشأ له رابط.">
        <div className="divide-y divide-line -mx-4 md:-mx-5">
          {shops.map((s) => {
            const on = s.tradeAccess && s.isActive;
            return (
              <div key={s.id} className={`px-4 md:px-5 py-3 space-y-2.5 ${on ? "" : "bg-soft/40"} ${fresh === s.id ? "bg-lime/15" : ""}`}>
                <div className="flex items-center gap-3">
                  <span
                    className={`w-10 h-10 rounded-xl grid place-items-center shrink-0 ${on ? "bg-lime text-ink" : "bg-soft text-steel"}`}
                  >
                    <Icon n="qr" s={18} />
                  </span>
                  <div className="flex-1 min-w-0">
                    <b className="block text-sm truncate">
                      {s.name}
                      {!s.isActive && <Badge cls="bg-soft text-steel ms-2">الكود موقوف</Badge>}
                    </b>
                    <small className="text-xs text-steel">
                      {s.tradeAccess ? `${when(s.lastUsedAt)} · ${s.scans} مسح` : "التطبيق غير مفعّل"}
                    </small>
                  </div>
                  <Switch
                    on={s.tradeAccess}
                    onChange={(v) => update(s, { tradeAccess: v }, v ? "تم تفعيل التطبيق للمحل" : "تم إيقاف التطبيق للمحل")}
                    ariaLabel={`تطبيق المحلات لـ ${s.name}`}
                  />
                </div>
                {on && (
                  <div className="ps-[52px] space-y-2">
                    <div className="flex items-center gap-2 rounded-xl bg-soft p-1.5 ps-3">
                      <code dir="ltr" className="flex-1 min-w-0 truncate text-xs font-bold text-steel">
                        {s.link}
                      </code>
                      <button
                        onClick={() => copy(s.link, `تم نسخ رابط ${s.name}`)}
                        className="btn btn-sm h-9 btn-dark shrink-0"
                        aria-label={`نسخ رابط ${s.name}`}
                      >
                        <Icon n="copy" s={15} />
                        نسخ الرابط
                      </button>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <a
                        href={waFor(s)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-[#25D366] rounded-lg px-3 h-8"
                      >
                        <Icon n="whatsapp" s={14} />
                        إرسال عبر واتساب
                      </a>
                      <button
                        onClick={() => newLink(s)}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-steel hover:text-accent rounded-lg px-3 h-8 bg-soft"
                      >
                        <Icon n="lock" s={14} />
                        رابط جديد
                      </button>
                      {edit === s.id ? (
                        <form
                          className="flex gap-2 w-full sm:w-auto"
                          onSubmit={async (e) => {
                            e.preventDefault();
                            if (editPhone.trim() && !isPhone(editPhone)) return toast("رقم الجوال غير صحيح", { tone: "err" });
                            if (await update(s, { phone: editPhone.trim() }, "تم حفظ الرقم")) setEdit(null);
                          }}
                        >
                          <input
                            autoFocus
                            className="field h-9 flex-1 sm:w-44"
                            dir="ltr"
                            type="tel"
                            inputMode="tel"
                            placeholder="05XXXXXXXX"
                            value={editPhone}
                            onChange={(e) => setEditPhone(e.target.value)}
                          />
                          <button className="btn btn-sm h-9 btn-lime">حفظ</button>
                          <button type="button" onClick={() => setEdit(null)} className="btn btn-sm h-9 btn-ghost">
                            إلغاء
                          </button>
                        </form>
                      ) : (
                        <button
                          onClick={() => {
                            setEdit(s.id);
                            setEditPhone(s.phone ? localPhone(s.phone) : "");
                          }}
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-steel hover:text-ink h-8 px-1"
                        >
                          <Icon n="phone" s={14} />
                          <span dir="ltr">{s.phone ? localPhone(s.phone) : "إضافة جوال"}</span>
                          <Icon n="edit" s={13} />
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          {shops.length === 0 && <AEmpty icon="qr" title="لا توجد محلات بعد" />}
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
