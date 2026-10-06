"use client";
import { useState } from "react";
import { post, uploadFile } from "@/lib/client";
// لإضافة إعداد جديد: أضف مفتاحه هنا وفي defaultSettings (src/config/brand.ts)
const IMAGES: [string, string][] = [["logo.url", "الشعار (يظهر بجانب الاسم في أعلى المتجر)"], ["hero.image", "صورة القسم الرئيسي (PNG شفاف مفضّل)"]];
const FIELDS: [string, string][] = [["site.name", "اسم المتجر"], ["whatsapp.number", "رقم واتساب العام (احتياطي عند عدم وجود مناديب، بصيغة 9665...)"], ["price.hiddenLabel.ar", "نص السعر المخفي"], ["currency.ar", "العملة"]];
// كل نص له نسختان (عربي/إنجليزي) تُحفظان كـ المفتاح.ar و المفتاح.en
const PAIRS: [string, string][] = [["home.title", "عنوان الواجهة الرئيسية"], ["home.sub", "النص الفرعي"], ["home.cta", "نص زر الواجهة"], ["search.ph", "نص خانة البحث"], ["home.cats", "عنوان قسم التصنيفات"], ["home.featured", "عنوان قسم المميز"], ["home.allCats", "رابط «عرض كل التصنيفات» (يظهر لو التصنيفات أكثر من 6)"], ["home.allProducts", "رابط «عرض كل المنتجات» (قسم التصنيفات)"], ["home.allFeatured", "رابط «عرض كل المنتجات المميزة»"], ["home.how", "عنوان كيف تطلب"], ["home.step1", "الخطوة 1"], ["home.step2", "الخطوة 2"], ["home.step3", "الخطوة 3"], ["footer.text", "نص التذييل"]];
export default function SettingsForm({ initial }: { initial: Record<string, string> }) {
  const [s, setS] = useState(initial), [msg, setMsg] = useState("");
  return (<div className="space-y-4 max-w-2xl"><h1 className="text-xl font-extrabold">الإعدادات</h1>
    <div><b className="text-sm">معاينة أعلى المتجر</b><div className="mt-1 bg-white rounded-2xl h-16 px-4 flex items-center gap-2.5 border-b-[3px] border-lime"><img src={s["logo.url"] || "/brand/logo-wordmark.png"} alt="" className="h-9 w-auto max-w-[150px] object-contain" /></div></div>
    {IMAGES.map(([k, l]) => (<div key={k}><b>{l}</b><div className="my-2 flex items-center gap-3">{s[k] && <img src={s[k]} className="h-14 bg-white border p-1" alt="" />}{s[k] && <button className="text-sm text-accent" onClick={() => setS((o) => ({ ...o, [k]: "" }))}>إزالة</button>}</div>
      <input type="file" accept="image/*" onChange={async (e) => { const f = e.target.files?.[0]; e.target.value = ""; if (!f) return; try { const url = await uploadFile(f); setS((o) => ({ ...o, [k]: url })); } catch (x) { setMsg((x as Error).message); } }} /></div>))}
    {FIELDS.map(([k, l]) => <label key={k} className="block"><span className="text-sm">{l}</span><input className="w-full border rounded-lg p-2 bg-white" value={s[k] ?? ""} onChange={(e) => setS({ ...s, [k]: e.target.value })} /></label>)}
    {PAIRS.map(([k, l]) => <div key={k}><span className="text-sm">{l}</span><div className="grid grid-cols-2 gap-2"><input className="w-full border rounded-lg p-2 bg-white" placeholder="عربي" value={s[k + ".ar"] ?? ""} onChange={(e) => setS({ ...s, [k + ".ar"]: e.target.value })} /><input dir="ltr" className="w-full border rounded-lg p-2 bg-white" placeholder="English" value={s[k + ".en"] ?? ""} onChange={(e) => setS({ ...s, [k + ".en"]: e.target.value })} /></div></div>)}
    <button className="bg-lime font-bold rounded-lg px-6 py-3" onClick={async () => { setMsg(""); const r = await post("/api/admin/settings", s, "PUT"); setMsg(r.ok ? "تم الحفظ ✓" : "فشل الحفظ"); }}>حفظ الإعدادات</button> <span className="font-bold">{msg}</span></div>);
}
