// Copyright (c) 2026 Abdullah Al-Sakni. All rights reserved. DYLLU Catalog.
"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Icon from "@/components/Icon";
import { post, uploadFile } from "@/lib/client";
import { currentEndpoint, enablePush, pushSupport } from "@/lib/pushClient";
import { toast } from "@/store/toast";
import { ask } from "@/store/confirm";
import { AEmpty, Badge, Card, Field, PageHead, Stat } from "./ui";
type H = {
  id: number;
  title: string;
  body: string;
  url: string;
  status: string;
  total: number;
  sent: number;
  failed: number;
  by: string | null;
  at: string;
  sendAt: string | null;
  source: string | null;
};
type Cat = { slug: string; nameAr: string };
// Riyadh time (UTC+3), formatted the same on the server and in the browser
const when = (iso: string) => {
  const d = new Date(new Date(iso).getTime() + 3 * 3600e3).toISOString();
  return `${d.slice(0, 10)} ${d.slice(11, 16)}`;
};
// Links on this site only: a full https://… link to the site is reduced to its path
const toPath = (v: string) => {
  const s = v.trim();
  if (!s) return "/";
  try {
    if (/^https?:\/\//.test(s)) {
      const u = new URL(s);
      return u.pathname + u.search;
    }
  } catch {}
  return s.startsWith("/") ? s : `/${s}`;
};
export default function NotificationsManager({
  ready,
  counts,
  cats,
  history,
}: {
  ready: boolean;
  counts: { store: number; other: number };
  cats: Cat[];
  history: H[];
}) {
  const r = useRouter(),
    [title, setTitle] = useState(""),
    [body, setBody] = useState(""),
    [url, setUrl] = useState("/"),
    [image, setImage] = useState(""),
    [busy, setBusy] = useState(false),
    [progress, setProgress] = useState<{ sent: number; failed: number; total: number } | null>(null),
    [mine, setMine] = useState<string | null>(null),
    [support, setSupport] = useState<"yes" | "install" | "no">("no");
  useEffect(() => {
    setSupport(pushSupport());
    currentEndpoint().then(setMine);
  }, []);
  const msg = () => ({ title: title.trim(), body: body.trim(), url: toPath(url), image: image || null });
  async function deliver(id: number, total: number) {
    setProgress({ sent: 0, failed: 0, total });
    // Small groups, one after another, until every device has been tried
    for (let i = 0; i < 2000; i++) {
      const x = await post("/api/admin/push", { action: "send", id });
      if (!x.ok) {
        toast(x.data.error || "توقف الإرسال، اضغط «أكمل الإرسال» من السجل", { tone: "err" });
        break;
      }
      setProgress({ sent: x.data.sent, failed: x.data.failed, total: x.data.total });
      if (x.data.done) {
        toast(`تم إرسال الإشعار إلى ${x.data.sent} جهاز`);
        break;
      }
    }
    setProgress(null);
    r.refresh();
  }
  async function send() {
    const m = msg();
    if (!m.title || !m.body) return toast("اكتب العنوان والنص", { tone: "err" });
    const ok = await ask({
      title: "إرسال الإشعار لكل العملاء؟",
      body: `يصل إلى ${counts.store + counts.other} جهاز فعّل الإشعارات (العملاء وأجهزة الإدارة والمناديب)، حتى لو كان التطبيق مغلقًا. لا يمكن سحبه بعد الإرسال.`,
      ok: "إرسال الآن",
    });
    if (!ok) return;
    setBusy(true);
    const x = await post("/api/admin/push", { action: "create", audience: "store", ...m });
    if (!x.ok) {
      setBusy(false);
      return toast(x.data.error, { tone: "err" });
    }
    await deliver(x.data.id, x.data.total);
    setBusy(false);
    setTitle("");
    setBody("");
    setUrl("/");
    setImage("");
  }
  async function test() {
    const m = msg();
    if (!m.title || !m.body) return toast("اكتب العنوان والنص أولًا", { tone: "err" });
    let ep = mine;
    if (!ep) {
      const res = await enablePush("admin");
      if (res !== "on")
        return toast(res === "denied" ? "الإشعارات مقفلة لهذا الموقع في إعدادات الجهاز" : "تعذر تفعيل الإشعارات على هذا الجهاز", {
          tone: "err",
        });
      ep = await currentEndpoint();
      setMine(ep);
      r.refresh();
    }
    const x = await post("/api/admin/push", { action: "test", endpoint: ep, ...m });
    x.ok ? toast("وصل إشعار تجربة لهذا الجهاز") : toast(x.data.error, { tone: "err" });
  }
  async function pick(f?: File) {
    if (!f) return;
    try {
      setImage(await uploadFile(f));
    } catch (e) {
      toast((e as Error).message, { tone: "err" });
    }
  }
  async function remove(h: H) {
    if (
      !(await ask({ title: "حذف من السجل؟", body: "يُحذف من القائمة فقط، والإشعار الذي وصل للعملاء لا يتأثر.", ok: "حذف", danger: true }))
    )
      return;
    await fetch(`/api/admin/push?id=${h.id}`, { method: "DELETE" });
    r.refresh();
  }
  const quick: [string, string][] = [
    ["الرئيسية", "/"],
    ["كل المنتجات", "/products"],
    ...cats.slice(0, 6).map((c) => [c.nameAr, `/categories/${c.slug}`] as [string, string]),
  ];
  const pct = progress ? Math.round(((progress.sent + progress.failed) / Math.max(1, progress.total)) * 100) : 0;
  return (
    <div className="max-w-5xl space-y-4">
      <PageHead
        title="الإشعارات"
        desc="أرسل إشعارًا يظهر على جوالات العملاء الذين فعّلوا الإشعارات، حتى لو كان التطبيق مغلقًا. مناسب للعروض والمنتجات الجديدة."
      />
      {!ready && (
        <div className="rounded-2xl bg-accent/10 text-accent p-4 text-sm font-bold">
          الإشعارات ستعمل بعد النشر القادم (تُنشأ مفاتيحها تلقائيًا في Cloudflare).
        </div>
      )}
      <div className="grid sm:grid-cols-2 gap-3">
        <Stat label="أجهزة العملاء المفعّل عليها" value={counts.store.toLocaleString("en-US")} sub="يصلها الإشعار" icon="bell" />
        <Stat
          label="أجهزة الإدارة والمناديب"
          value={counts.other.toLocaleString("en-US")}
          sub="يصلها الإشعار أيضًا"
          icon="users"
          tone="soft"
        />
      </div>
      <div className="grid lg:grid-cols-[1fr_340px] gap-4 items-start">
        <Card title="إشعار جديد">
          <div className="space-y-4">
            <Field label="العنوان" hint={`${title.length}/70`}>
              <input
                className="field"
                maxLength={70}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="مثال: خصم 20% على العدد اليدوية"
              />
            </Field>
            <Field label="النص" hint={`${body.length}/240`}>
              <textarea
                className="field min-h-24"
                maxLength={240}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="مثال: العرض لمدة 3 أيام فقط، اطلب الآن من التطبيق"
              />
            </Field>
            <Field label="عند الضغط على الإشعار يفتح" hint="اختر صفحة، أو الصق رابط منتج أو صفحة من الموقع">
              <input className="field" dir="ltr" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="/products/..." />
            </Field>
            <div className="flex flex-wrap gap-1.5 -mt-2">
              {quick.map(([l, h]) => (
                <button
                  key={h}
                  type="button"
                  onClick={() => setUrl(h)}
                  className={`rounded-lg px-2.5 h-8 text-xs font-bold border ${toPath(url) === h ? "bg-ink text-lime border-ink" : "border-line hover:bg-soft"}`}
                >
                  {l}
                </button>
              ))}
            </div>
            <Field label="صورة (اختياري)" hint="تظهر كبيرة في الإشعار على أندرويد والكمبيوتر">
              <div className="flex items-center gap-2">
                <label className="btn btn-md btn-ghost cursor-pointer">
                  <Icon n="upload" s={18} />
                  {image ? "تغيير الصورة" : "رفع صورة"}
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => pick(e.target.files?.[0])} />
                </label>
                {image && (
                  <button type="button" onClick={() => setImage("")} className="btn btn-md btn-ghost text-accent">
                    <Icon n="trash" s={16} />
                    إزالة
                  </button>
                )}
              </div>
            </Field>
            {progress && (
              <div className="space-y-1.5">
                <div className="h-2.5 rounded-full bg-soft overflow-hidden">
                  <div className="h-full bg-lime transition-all" style={{ width: `${pct}%` }} />
                </div>
                <small className="text-steel">
                  جارٍ الإرسال {progress.sent + progress.failed} من {progress.total}، لا تغلق الصفحة
                </small>
              </div>
            )}
            <div className="flex flex-col sm:flex-row gap-2">
              <button onClick={send} disabled={busy || !ready || !(counts.store + counts.other)} className="btn btn-lg btn-lime sm:flex-1">
                <Icon n="bell" s={18} />
                {busy ? "جارٍ الإرسال..." : `إرسال لكل العملاء (${counts.store + counts.other})`}
              </button>
              <button onClick={test} disabled={busy || !ready || support !== "yes"} className="btn btn-lg btn-ghost">
                تجربة على جهازي
              </button>
            </div>
            {support === "install" && (
              <small className="block text-xs text-steel">
                للتجربة على الآيفون: افتح لوحة التحكم من التطبيق المثبّت على الشاشة الرئيسية.
              </small>
            )}
          </div>
        </Card>
        <div className="lg:sticky lg:top-4 space-y-2">
          <b className="block text-sm text-steel">معاينة على الجوال</b>
          <div className="rounded-[28px] bg-gradient-to-b from-[#3a3f47] to-[#1f2329] p-4 pt-8">
            <div className="rounded-2xl bg-white/90 backdrop-blur p-3 shadow-lg" dir="rtl">
              <div className="flex items-center gap-2 text-[11px] text-steel">
                <img src="/brand/icon-192.png" alt="" className="w-5 h-5 rounded-md" />
                <span className="font-bold">DYLLU</span>
                <span className="ms-auto">الآن</span>
              </div>
              <b className="block mt-1.5 text-sm text-ink leading-5">{title || "عنوان الإشعار"}</b>
              <p className="text-[13px] text-ink/80 leading-5 line-clamp-4 whitespace-pre-line">{body || "نص الإشعار يظهر هنا"}</p>
              {image && <img src={image} alt="" className="mt-2 rounded-xl w-full max-h-40 object-cover" />}
            </div>
          </div>
        </div>
      </div>
      <Card title="الإشعارات المرسلة" pad={false}>
        {history.length ? (
          <div className="divide-y divide-line">
            {history.map((h) => (
              <div key={h.id} className="p-4 flex flex-wrap items-start gap-3">
                <div className="flex-1 min-w-[200px]">
                  <b className="block">{h.title}</b>
                  <p className="text-sm text-steel line-clamp-2">{h.body}</p>
                  <small className="text-xs text-steel">
                    {when(h.at)}
                    {h.by ? ` • ${h.by}` : ""} • <span dir="ltr">{h.url}</span>
                  </small>
                </div>
                <div className="flex items-center gap-2">
                  {h.source && <Badge>{h.source.startsWith("offer") ? "تلقائي: عرض" : "تلقائي: إعلان"}</Badge>}
                  {h.status === "scheduled" ? (
                    <Badge cls="bg-ink text-lime">يُرسل {h.sendAt ? when(h.sendAt) : "لاحقًا"}</Badge>
                  ) : h.status === "done" ? (
                    <Badge cls="bg-lime text-ink">وصل {h.sent}</Badge>
                  ) : (
                    <Badge cls="bg-accent/10 text-accent">
                      لم يكتمل {h.sent}/{h.total}
                    </Badge>
                  )}
                  {h.failed > 0 && <Badge>لم يصل {h.failed}</Badge>}
                  {h.status === "sending" && (
                    <button
                      disabled={busy}
                      onClick={() => (setBusy(true), deliver(h.id, h.total).finally(() => setBusy(false)))}
                      className="btn btn-sm btn-lime"
                    >
                      أكمل الإرسال
                    </button>
                  )}
                  <button onClick={() => remove(h)} className="btn btn-sm btn-ghost" aria-label="حذف من السجل">
                    <Icon n="trash" s={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <AEmpty icon="bell" title="لم ترسل أي إشعار بعد" />
        )}
      </Card>
    </div>
  );
}
