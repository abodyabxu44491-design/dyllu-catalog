// Copyright (c) 2026 Abdullah Al-Sakni. All rights reserved. DYLLU Catalog.
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Icon from "@/components/Icon";
import { post, uploadFile } from "@/lib/client";
import { toast } from "@/store/toast";
import { ask } from "@/store/confirm";
import { localPhone, waHref, prettyPhone } from "@/lib/phone";
import PhoneInput from "./PhoneInput";
import { AEmpty, Badge, Field, PageHead } from "./ui";
import Switch from "./Switch";
type Acc = { isActive: boolean; lastLoginAt: string | null } | null;
type R = {
  id?: number;
  name: string;
  location: string;
  phone: string;
  photo?: string | null;
  sortOrder: number;
  isActive: boolean;
  orders?: number;
  account?: Acc;
};
const blank: R = { name: "", location: "", phone: "", photo: null, sortOrder: 0, isActive: true };
const Avatar = ({ r, s = "w-12 h-12 text-lg" }: { r: R; s?: string }) => (
  <span className={`${s} rounded-full bg-ink text-lime grid place-items-center font-extrabold overflow-hidden shrink-0`}>
    {r.photo ? <img src={r.photo} alt="" className="w-full h-full object-cover" /> : (r.name[0] ?? "؟")}
  </span>
);
const MONTHS = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
const when = (iso: string) => {
  const d = new Date(new Date(iso).getTime() + 3 * 36e5),
    h = d.getUTCHours();
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}، ${h % 12 || 12}:${String(d.getUTCMinutes()).padStart(2, "0")} ${h < 12 ? "ص" : "م"}`;
};
const gen = () => Array.from(crypto.getRandomValues(new Uint8Array(8)), (b) => "abcdefghjkmnpqrstuvwxyz23456789"[b % 31]).join("");
function Account({ rep }: { rep: R }) {
  const r = useRouter(),
    acc = rep.account,
    [active, setActive] = useState(acc?.isActive ?? true),
    [pw, setPw] = useState(acc ? "" : gen()),
    [busy, setBusy] = useState(false),
    [msg, setMsg] = useState(""),
    [sent, setSent] = useState<string | null>(null);
  const loginUrl = `${typeof location !== "undefined" ? location.origin : ""}/rep-login`;
  const creds = (p: string) =>
    `أهلًا ${rep.name}، هذا حسابك في كتالوج DYLLU لمتابعة طلباتك وعملائك:\n${loginUrl}\nرقم الجوال: ${localPhone(rep.phone)}\nكلمة المرور: ${p}\nيمكنك تغيير كلمة المرور من «حسابي».`;
  async function save() {
    setBusy(true);
    setMsg("");
    const x = await post("/api/admin/reps/account", { repId: rep.id, password: pw || undefined, isActive: active });
    setBusy(false);
    if (!x.ok) return setMsg(x.data.error || "تعذر الحفظ");
    toast(acc ? "تم حفظ الحساب" : "تم إنشاء الحساب");
    if (pw) setSent(pw);
    setPw("");
    r.refresh();
  }
  async function remove() {
    if (
      !(await ask({
        title: `حذف حساب ${rep.name}؟`,
        body: "لن يستطيع الدخول. المندوب وطلباته تبقى كما هي.",
        ok: "حذف الحساب",
        danger: true,
      }))
    )
      return;
    await fetch(`/api/admin/reps/account?repId=${rep.id}`, { method: "DELETE" });
    toast("تم حذف الحساب");
    setSent(null);
    setPw(gen());
    r.refresh();
  }
  return (
    <div className="rounded-2xl border border-line bg-white p-4 space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Icon n="key" s={18} className="text-accent" />
        <b className="text-sm">حساب الدخول</b>
        {acc ? (
          <Badge cls={acc.isActive ? "bg-lime text-ink" : "bg-soft text-steel"}>{acc.isActive ? "فعّال" : "موقوف"}</Badge>
        ) : (
          <Badge>لا يوجد حساب</Badge>
        )}
        {acc?.lastLoginAt && <small className="text-xs text-steel ms-auto">آخر دخول: {when(acc.lastLoginAt)}</small>}
      </div>
      <p className="text-xs text-steel leading-5">
        يدخل المندوب من <b dir="ltr">/rep-login</b> برقم جواله <b dir="ltr">{localPhone(rep.phone)}</b>، ويرى طلباته وعملاءه ويحدّث حالة
        الطلب، ويحصل على رابط خاص به: أي طلب من الرابط يصله هو.
      </p>
      <div className="grid sm:grid-cols-[1fr_auto] gap-2 items-end">
        <Field
          label={acc ? "كلمة مرور جديدة (اختياري)" : "كلمة المرور"}
          hint={acc ? "اتركها فارغة للإبقاء على الحالية" : "6 أحرف على الأقل"}
        >
          <span className="relative block">
            <input
              className="field pe-12 font-bold tracking-wider"
              dir="ltr"
              autoComplete="off"
              spellCheck={false}
              value={pw}
              onChange={(e) => setPw(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setPw(gen())}
              title="توليد كلمة مرور"
              aria-label="توليد كلمة مرور"
              className="absolute end-1 top-1 btn-icon w-10 h-10 text-steel hover:text-ink"
            >
              <Icon n="bolt" s={18} />
            </button>
          </span>
        </Field>
        {acc && (
          <div className="sm:pb-6">
            <Switch label="الحساب فعّال" on={active} onChange={setActive} />
          </div>
        )}
      </div>
      {msg && (
        <p role="alert" className="text-accent text-sm font-bold flex items-center gap-2">
          <Icon n="alert" s={16} />
          {msg}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <button type="button" disabled={busy} onClick={save} className="btn btn-md btn-dark">
          {busy ? (
            "..."
          ) : (
            <>
              <Icon n="check" s={18} />
              {acc ? "حفظ الحساب" : "إنشاء الحساب"}
            </>
          )}
        </button>
        {acc && (
          <button type="button" onClick={remove} className="btn btn-md btn-ghost text-accent">
            حذف الحساب
          </button>
        )}
      </div>
      {sent && (
        <div className="rounded-xl bg-lime/25 p-3 space-y-2 text-sm">
          <b className="flex items-center gap-1.5">
            <Icon n="check" s={16} stroke={2.6} />
            بيانات الدخول جاهزة، أرسلها للمندوب:
          </b>
          <div dir="ltr" className="font-mono text-xs bg-white rounded-lg p-2 leading-6" style={{ textAlign: "start" }}>
            {localPhone(rep.phone)} · {sent}
          </div>
          <div className="flex flex-wrap gap-2">
            <a
              href={waHref(rep.phone, creds(sent))}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-sm bg-[#1FA855] text-white"
            >
              <Icon n="whatsapp" s={16} />
              إرسال عبر واتساب
            </a>
            <button
              type="button"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(creds(sent));
                  toast("تم النسخ");
                } catch {}
              }}
              className="btn btn-sm btn-ghost"
            >
              <Icon n="copy" s={16} />
              نسخ
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
function Editor({ r0, onDone }: { r0: R; onDone: () => void }) {
  const r = useRouter(),
    [v, setV] = useState(r0),
    [msg, setMsg] = useState(""),
    [busy, setBusy] = useState(false);
  async function save() {
    setBusy(true);
    const x = await post("/api/admin/reps", { ...v, orders: undefined, account: undefined, sortOrder: Number(v.sortOrder) || 0 });
    setBusy(false);
    if (x.ok) {
      toast(v.id ? "تم حفظ المندوب" : "تمت إضافة المندوب");
      onDone();
      r.refresh();
    } else setMsg(x.data.error || "تحقق من الاسم والموقع ورقم الجوال");
  }

  async function del() {
    if (!(await ask({ title: "حذف المندوب؟", body: "إن كان مرتبطًا بطلبات، أوقفه بدل الحذف.", ok: "حذف", danger: true }))) return;
    const x = await fetch(`/api/admin/reps?id=${v.id}`, { method: "DELETE" });
    if (x.ok) {
      toast("تم حذف المندوب");
      r.refresh();
    } else setMsg((await x.json()).error);
  }
  return (
    <div className="p-4 border-t border-line bg-soft/40 space-y-3">
      <div className="flex items-center gap-3">
        <Avatar r={v} s="w-16 h-16 text-2xl" />
        <label className="btn btn-sm btn-ghost cursor-pointer">
          <input
            type="file"
            hidden
            accept="image/jpeg,image/png,image/webp"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              e.target.value = "";
              if (f)
                try {
                  setV({ ...v, photo: await uploadFile(f) });
                } catch (x) {
                  setMsg((x as Error).message);
                }
            }}
          />
          <Icon n="upload" s={16} />
          {v.photo ? "تغيير الصورة" : "رفع صورة"}
        </label>
        {v.photo && (
          <button className="text-accent text-sm font-bold" onClick={() => setV({ ...v, photo: null })}>
            إزالة
          </button>
        )}
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        <Field label="اسم المندوب *">
          <input className="field" value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} />
        </Field>
        <Field label="الموقع *" hint="المدينة - الحي">
          <input className="field" value={v.location} onChange={(e) => setV({ ...v, location: e.target.value })} />
        </Field>
        <PhoneInput label="رقم واتساب *" hint="اكتبه كما هو: 05XXXXXXXX" value={v.phone} onChange={(x) => setV({ ...v, phone: x })} />
        <Field label="الترتيب">
          <input
            className="field"
            type="number"
            dir="ltr"
            value={v.sortOrder}
            onChange={(e) => setV({ ...v, sortOrder: +e.target.value })}
          />
        </Field>
      </div>
      <div className="max-w-xs">
        <Switch label="يظهر للعملاء" on={v.isActive} onChange={(x) => setV({ ...v, isActive: x })} />
      </div>
      {v.id ? (
        <Account rep={r0} />
      ) : (
        <p className="text-xs text-steel flex items-center gap-1.5">
          <Icon n="info" s={14} />
          بعد إضافة المندوب يمكنك إنشاء حساب دخول له ليتابع طلباته وعملاءه.
        </p>
      )}
      {msg && (
        <p className="text-accent text-sm font-bold flex items-center gap-2">
          <Icon n="alert" s={16} />
          {msg}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <button disabled={busy} onClick={save} className="btn btn-md btn-lime">
          {busy ? (
            "..."
          ) : (
            <>
              <Icon n="check" s={18} />
              {v.id ? "حفظ" : "إضافة المندوب"}
            </>
          )}
        </button>
        <button onClick={onDone} className="btn btn-md btn-ghost">
          إلغاء
        </button>
        {v.id && (
          <button onClick={del} className="btn btn-md btn-danger ms-auto">
            <Icon n="trash" s={18} />
            حذف
          </button>
        )}
      </div>
    </div>
  );
}
export default function RepsManager({ initial }: { initial: R[] }) {
  const [open, setOpen] = useState<number | "new" | null>(initial.length ? null : "new");
  return (
    <div className="max-w-4xl">
      <PageHead
        title="المناديب"
        desc="عند إتمام الطلب يختار العميل مندوبًا ويُرسل الطلب إلى واتساب المندوب. لكل مندوب حساب دخول يتابع منه طلباته وعملاءه، ورابط خاص يوصل الطلبات له مباشرة."
      >
        <button onClick={() => setOpen(open === "new" ? null : "new")} className="btn btn-md btn-lime">
          <Icon n="plus" s={18} />
          مندوب جديد
        </button>
      </PageHead>
      {open === "new" && (
        <div className="card overflow-hidden mb-3">
          <b className="block px-4 pt-4">مندوب جديد</b>
          <Editor r0={blank} onDone={() => setOpen(null)} />
        </div>
      )}
      <div className="card overflow-hidden divide-y divide-line">
        {initial.map((x) => (
          <div key={x.id}>
            <div className="flex items-center gap-3 p-3">
              <button
                onClick={() => setOpen(open === x.id ? null : x.id!)}
                aria-expanded={open === x.id}
                className="flex items-center gap-3 flex-1 min-w-0 text-start"
              >
                <Avatar r={x} />
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-1.5">
                    <b className="text-sm">{x.name}</b>
                    {x.account && (
                      <Badge cls={x.account.isActive ? "bg-lime text-ink" : "bg-soft text-steel"}>
                        <Icon n="key" s={11} />
                        {x.account.isActive ? "له حساب" : "حساب موقوف"}
                      </Badge>
                    )}
                    {!x.isActive && <Badge>مخفي</Badge>}
                  </span>
                  <small className="flex items-center gap-1 text-xs text-steel mt-0.5">
                    <Icon n="pin" s={12} />
                    {x.location}
                  </small>
                  <small className="block text-xs text-steel">
                    <span dir="ltr">{prettyPhone(x.phone)}</span> · {x.orders ?? 0} طلب
                  </small>
                </span>
              </button>
              <a
                href={waHref(x.phone)}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="واتساب"
                className="btn-icon w-10 h-10 text-[#1FA855] hover:bg-soft"
              >
                <Icon n="whatsapp" s={20} />
              </a>
              <button
                onClick={() => setOpen(open === x.id ? null : x.id!)}
                aria-label="تعديل"
                className="btn-icon w-10 h-10 text-steel hover:bg-soft"
              >
                <Icon n={open === x.id ? "chevDown" : "edit"} s={18} />
              </button>
            </div>
            {open === x.id && <Editor r0={x} onDone={() => setOpen(null)} />}
          </div>
        ))}
        {initial.length === 0 && open !== "new" && <AEmpty icon="users" title="لا يوجد مناديب بعد" />}
      </div>
    </div>
  );
}
