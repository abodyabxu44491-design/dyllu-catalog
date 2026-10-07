"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Icon from "@/components/Icon";
import { post, uploadFile } from "@/lib/client";
import { toast } from "@/store/toast";
import { Card, Field, PageHead } from "./ui";
// لإضافة إعداد جديد: أضف مفتاحه هنا وفي defaultSettings (src/config/brand.ts)
const IMAGES: [string, string, string][] = [["logo.url", "الشعار", "يظهر أعلى المتجر. PNG شفاف بعرض 600px مثالي. يُستخدم شعار DYLLU الرسمي إن تُرك فارغًا."], ["hero.image", "صورة الواجهة الثابتة", "تظهر في الرئيسية عند عدم وجود إعلانات. PNG شفاف مفضّل."]];
type F = [string, string, string?, boolean?];
const CONTACT: F[] = [["whatsapp.number", "رقم واتساب العام", "احتياطي عند عدم وجود مناديب، ولزر «استفسر عبر واتساب». بصيغة 9665XXXXXXXX", true], ["contact.email", "البريد الإلكتروني", "يظهر في التذييل", true], ["social.instagram", "Instagram", "اسم الحساب أو الرابط", true], ["social.x", "X (تويتر)", "اسم الحساب أو الرابط", true], ["social.tiktok", "TikTok", "اسم الحساب أو الرابط", true], ["social.snapchat", "Snapchat", "اسم الحساب أو الرابط", true]];
const PRICE: F[] = [["price.hiddenLabel.ar", "نص السعر المخفي", "يظهر بدل السعر عند إخفائه"], ["currency.ar", "العملة (عربي)"], ["currency.en", "Currency (English)", undefined, true]];
// كل نص له نسختان (عربي/إنجليزي) تُحفظان كـ المفتاح.ar و المفتاح.en
const HOME: [string, string][] = [["home.title", "عنوان الواجهة الثابتة"], ["home.sub", "النص الفرعي"], ["home.cta", "نص زر الواجهة"], ["search.ph", "نص خانة البحث"], ["home.how", "عنوان «كيف تطلب»"], ["home.step1", "الخطوة 1"], ["home.step2", "الخطوة 2"], ["home.step3", "الخطوة 3"], ["home.cats", "عنوان قسم التصنيفات"], ["home.featured", "عنوان قسم المميز"], ["home.new", "عنوان قسم «وصل حديثًا»"], ["home.allCats", "رابط «عرض كل التصنيفات»"], ["home.allProducts", "رابط «عرض كل المنتجات»"], ["home.allFeatured", "رابط «عرض كل المميزة»"]];
const FOOT: [string, string][] = [["footer.text", "وصف المتجر في التذييل"], ["footer.tagline", "الشعار النصي (أسفل الصفحة)"], ["contact.address", "العنوان"]];
export default function SettingsForm({ initial }: { initial: Record<string, string> }) {
  const r = useRouter(), base = useRef(JSON.stringify(initial)), [s, setS] = useState(initial), [busy, setBusy] = useState(false);
  const dirty = JSON.stringify(s) !== base.current, set = (k: string, v: string) => setS((o) => ({ ...o, [k]: v }));
  useEffect(() => { const f = (e: BeforeUnloadEvent) => { if (dirty) { e.preventDefault(); e.returnValue = ""; } }; addEventListener("beforeunload", f); return () => removeEventListener("beforeunload", f); }, [dirty]);
  async function save() { setBusy(true); const x = await post("/api/admin/settings", s, "PUT"); setBusy(false); if (x.ok) { base.current = JSON.stringify(s); toast("تم حفظ الإعدادات"); r.refresh(); } else toast("فشل الحفظ", { tone: "err" }); }
  const plain = ([k, l, h, ltr]: F) => <Field key={k} label={l} hint={h}><input className="field" dir={ltr ? "ltr" : undefined} value={s[k] ?? ""} onChange={(e) => set(k, e.target.value)} /></Field>;
  const pair = (k: string, l: string) => <div key={k} className="space-y-1.5"><b className="block text-sm">{l}</b><div className="grid sm:grid-cols-2 gap-2"><input className="field" placeholder="عربي" value={s[k + ".ar"] ?? ""} onChange={(e) => set(k + ".ar", e.target.value)} /><input dir="ltr" className="field" placeholder="English" value={s[k + ".en"] ?? ""} onChange={(e) => set(k + ".en", e.target.value)} /></div></div>;
  return (<div className="max-w-4xl space-y-4 md:space-y-5">
    <PageHead title="الإعدادات" desc="نصوص المتجر وبيانات التواصل والشعار. التغييرات تظهر للعملاء بعد الحفظ مباشرة." />
    <Card title="الهوية"><div className="space-y-5">
      <Field label="اسم المتجر"><input className="field" value={s["site.name"] ?? ""} onChange={(e) => set("site.name", e.target.value)} /></Field>
      <div className="grid md:grid-cols-2 gap-4">{IMAGES.map(([k, l, h]) => (<div key={k} className="space-y-2"><b className="block text-sm">{l}</b>
        <div className="h-28 rounded-2xl bg-soft border border-line grid place-items-center p-3"><img src={s[k] || (k === "logo.url" ? "/brand/logo-wordmark.png" : "/brand/logo-badge.png")} className={`h-20 w-auto max-w-full object-contain ${s[k] ? "" : "opacity-40"}`} alt="" /></div>
        <div className="flex gap-2"><label className="btn btn-sm btn-ghost flex-1 cursor-pointer"><input type="file" hidden accept="image/png,image/jpeg,image/webp" onChange={async (e) => { const f = e.target.files?.[0]; e.target.value = ""; if (!f) return; try { set(k, await uploadFile(f)); } catch (x) { toast((x as Error).message, { tone: "err" }); } }} /><Icon n="upload" s={16} />{s[k] ? "تغيير" : "رفع"}</label>{s[k] && <button className="btn btn-sm btn-danger" onClick={() => set(k, "")}>إزالة</button>}</div>
        <small className="block text-xs text-steel leading-5">{h}</small></div>))}</div></div></Card>
    <Card title="التواصل والحسابات"><div className="grid sm:grid-cols-2 gap-3">{CONTACT.map(plain)}</div></Card>
    <Card title="الأسعار والعملة"><div className="grid sm:grid-cols-3 gap-3">{PRICE.map(plain)}</div></Card>
    <Card title="نصوص الصفحة الرئيسية" desc="الإنجليزية اختيارية؛ إن تُركت فارغة تظهر العربية."><div className="space-y-4">{HOME.map(([k, l]) => pair(k, l))}</div></Card>
    <Card title="التذييل"><div className="space-y-4">{FOOT.map(([k, l]) => pair(k, l))}</div></Card>
    <div className="sticky bottom-16 lg:bottom-0 z-30 -mx-4 sm:mx-0 px-4 sm:px-0 py-3 bg-soft/95 backdrop-blur"><div className="card shadow-lift p-3 flex items-center gap-3">
      <span className={`hidden sm:flex items-center gap-2 text-sm font-bold flex-1 ${dirty ? "text-accent" : "text-steel"}`}><Icon n={dirty ? "info" : "check"} s={18} />{dirty ? "لديك تعديلات غير محفوظة" : "كل التعديلات محفوظة"}</span>
      <button disabled={busy || !dirty} onClick={save} className="btn btn-lg btn-lime flex-1 sm:flex-none sm:min-w-[180px]">{busy ? "جارٍ الحفظ..." : <><Icon n="check" s={20} />حفظ الإعدادات</>}</button></div></div>
  </div>);
}
