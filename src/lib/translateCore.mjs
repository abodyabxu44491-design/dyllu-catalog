// محرك الترجمة العربية ← الإنجليزية (مشترك بين الموقع وسكربت التشغيل). مجاني وبدون أي مفتاح أو إعداد.
// قاموس مصطلحات العدد قبل الترجمة (لتجنب ترجمات حرفية مثل «مفتاح إنجليزي» = English wrench أو «صاروخ» = rocket)
const GLOSSARY = [
  // مركّبات أولًا (الأطول قبل الأقصر)
  [/صواريخ\s+(ال)?تجليخ/g, "angle grinders"], [/صاروخ\s+(ال)?(تجليخ|قص)/g, "angle grinder"], [/مساطرين\s+(ال)?معجون/g, "putty trowels"], [/مسطرين\s+(ال)?معجون/g, "putty trowel"],
  [/دريلات\s+(ال)?شحن/g, "cordless drills"], [/دريل\s+(ال)?شحن/g, "cordless drill"], [/دريل\s+كهربائي/g, "electric drill"], [/منشار\s+دائري/g, "circular saw"], [/منشار\s+(ال)?جبس/g, "jab saw"],
  [/منشار\s+(ال)?تقليم/g, "pruning saw"], [/أقراص\s+(ال)?قص/g, "cutting discs"], [/قرص\s+(ال)?قص/g, "cutting disc"], [/أقراص\s+(ال)?ألماس/g, "diamond discs"], [/قرص\s+(ال)?ألماس/g, "diamond disc"],
  [/طقم\s+مفاتيح/g, "wrench set"], [/بطارية\s+ليثيوم/g, "lithium battery"], [/مفاتيح\s+(إ|ا)نجليزي(ة)?/g, "adjustable wrenches"], [/مفتاح\s+(إ|ا)نجليزي/g, "adjustable wrench"],
  [/(ال)?عدد\s+اليدوية/g, "hand tools"], [/عدد\s+يدوية/g, "hand tools"], [/السعر\s+عند\s+التواصل/g, "price on request"],
  // العروض («عرض» تُترجم أحيانًا Display)
  [/(ال)?عروض/g, "offers"], [/^عرض\s+/g, "offer on "], [/\sعرض\s/g, " offer "],
  // كلمات مفردة
  [/(ال)?صواريخ/g, "angle grinders"], [/(ال)?صاروخ/g, "angle grinder"], [/(ال)?جلاخ(ة|ات)/g, "angle grinder"], [/(ال)?دريلات/g, "drills"], [/(ال)?دريل/g, "drill"], [/(ال)?شنيور/g, "drill"],
  [/(ال)?مساطرين/g, "trowels"], [/(ال)?مسطرين/g, "trowel"], [/(ال)?بوكسات/g, "sockets"],
  // وحدات
  [/(\d)\s*(ملم|مم|ملي)/g, "$1mm"], [/(\d)\s*(سم)/g, "$1cm"], [/(\d)\s*فولت/g, "$1V"], [/(\d)\s*واط/g, "$1W"], [/(\d)\s*(إنش|انش|بوصة)/g, '$1"'],
];
// أسماء المواصفات والكلمات الشائعة: ترجمة ثابتة عند تطابق النص كاملًا (أدق من الترجمة الآلية، مثل «الطول» = Length وليس Height)
const EXACT = { "الطول": "Length", "الوزن": "Weight", "العرض": "Width", "الارتفاع": "Height", "العمق": "Depth", "القطر": "Diameter", "السماكة": "Thickness", "السمك": "Thickness",
  "الجهد": "Voltage", "الفولت": "Voltage", "القدرة": "Power", "القوة": "Power", "السرعة": "Speed", "سرعة الدوران": "No-load speed", "عزم الدوران": "Torque", "العزم": "Torque", "السعة": "Capacity",
  "البطارية": "Battery", "الشاحن": "Charger", "الخامة": "Material", "المادة": "Material", "اللون": "Color", "الضمان": "Warranty", "المقاس": "Size", "الحجم": "Size", "الموديل": "Model",
  "بلد المنشأ": "Country of origin", "المنشأ": "Origin", "الاستخدام": "Application", "الأسنان": "Teeth", "الشفرة": "Blade", "فتحة التركيب": "Bore", "طريقة القطع": "Cutting", "أقصى سرعة": "Max speed",
  "متوفر": "In stock", "غير متوفر": "Out of stock", "نعم": "Yes", "لا": "No", "فولاذ": "Steel", "ستانلس ستيل": "Stainless steel", "بلاستيك": "Plastic", "ألمنيوم": "Aluminum" };
const HAS_AR = /[؀-ۿ]/;
export const hasArabic = (s) => HAS_AR.test(String(s ?? ""));
const cache = new Map();
async function google(text, timeout) {
  const ctrl = new AbortController(), t = setTimeout(() => ctrl.abort(), timeout);
  try {
    const r = await fetch("https://translate.googleapis.com/translate_a/single?client=gtx&sl=ar&tl=en&dt=t", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" }, body: "q=" + encodeURIComponent(text), signal: ctrl.signal });
    if (!r.ok) return null;
    const d = await r.json();
    return Array.isArray(d?.[0]) ? d[0].map((s) => s?.[0] ?? "").join("").trim() : null;
  } catch { return null; } finally { clearTimeout(t); }
}
// تنسيق الإنجليزية: أول حرف كبير، والوحدات (mm / V / Ah) كما هي
const tidy = (s) => s.replace(/\s+/g, " ").replace(/\s+([,.:;)])/g, "$1").replace(/^./, (c) => c.toUpperCase()).replace(/(\d)\s?mm\b/gi, "$1mm").replace(/(\d)\s?(V|W)\b/g, "$1$2").trim();
// يترجم نصًا عربيًا واحدًا. نص بلا حروف عربية يرجع كما هو. الفشل يرجع null (ولا يوقف الحفظ أبدًا)
export async function arToEn(text, { timeout = 8000 } = {}) {
  const src = String(text ?? "").trim();
  if (!src) return "";
  if (!hasArabic(src)) return src;
  if (cache.has(src)) return cache.get(src);
  const exact = EXACT[src.replace(/[:：]\s*$/, "")]; if (exact) return exact;
  let pre = src; for (const [re, en] of GLOSSARY) pre = pre.replace(re, en);
  let out = hasArabic(pre) ? await google(pre, timeout) : pre;
  if (!out) { await new Promise((r) => setTimeout(r, 600)); out = await google(pre, timeout); } // محاولة ثانية عند انقطاع عابر
  if (!out) return null;
  const res = tidy(out);
  if (cache.size > 3000) cache.clear();
  cache.set(src, res);
  return res;
}
// ترجمة عدة نصوص بالتوازي (4 في المرة)
export async function arToEnMany(texts, opts) {
  const out = new Array(texts.length); let i = 0;
  await Promise.all(Array.from({ length: Math.min(4, texts.length) }, async () => { while (i < texts.length) { const k = i++; out[k] = await arToEn(texts[k], opts); } }));
  return out;
}
// عناوين المنتجات والتصنيفات بحروف كبيرة في أول كل كلمة (Title Case)
const SMALL = new Set(["a", "an", "and", "or", "for", "of", "the", "with", "to", "in", "on", "by"]);
export const titleCase = (s) => String(s).split(" ").map((w, i) => (i > 0 && SMALL.has(w.toLowerCase()) ? w.toLowerCase() : /^[a-z]/.test(w) ? w[0].toUpperCase() + w.slice(1) : w)).join(" ");
