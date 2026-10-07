import Icon from "./Icon";
import { isMobileSA, isPhone, normalizePhone, telHref, waHref } from "@/lib/phone";
const D = "[0-9\\u0660-\\u0669\\u06F0-\\u06F9]";
// روابط، بريد، أو رقم هاتف بأي صيغة (يشمل الأرقام العربية ٠١٢٣)
const RE = new RegExp(`(https?://[^\\s<]+[^\\s<.,،)])|([\\w.+-]+@[\\w-]+\\.[\\w.-]*\\w)|((?:\\+|00)?${D}[${D.slice(1, -1)}\\s-]{7,16}${D})`, "g");
// يحوّل أي رقم أو بريد أو رابط داخل النص إلى رابط قابل للضغط: الرقم = اتصال + أيقونة واتساب بجانبه
export default function Linkify({ text, wa = true }: { text: string; wa?: boolean }) {
  const out: React.ReactNode[] = []; let last = 0, m: RegExpExecArray | null; RE.lastIndex = 0;
  while ((m = RE.exec(text))) {
    const [all, url, mail, phone] = m;
    if (phone && !(isPhone(phone) && normalizePhone(phone).length >= 11)) continue; // أرقام قصيرة (مثل 0-1800) ليست هواتف
    out.push(text.slice(last, m.index)); last = m.index + all.length;
    const cls = "font-bold text-ink underline decoration-lime decoration-2 underline-offset-4 hover:decoration-accent";
    if (url) out.push(<a key={m.index} href={url} target="_blank" rel="noopener noreferrer nofollow" className={`${cls} break-all`} dir="ltr">{url.replace(/^https?:\/\/(www\.)?/, "")}</a>);
    else if (mail) out.push(<a key={m.index} href={`mailto:${mail}`} className={cls} dir="ltr">{mail}</a>);
    else out.push(<span key={m.index} className="inline-flex items-center gap-1 whitespace-nowrap align-baseline"><a href={telHref(phone)} className={cls} dir="ltr">{phone.trim()}</a>
      {wa && (isMobileSA(phone) || !normalizePhone(phone).startsWith("966")) && <a href={waHref(phone)} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" className="inline-grid place-items-center w-6 h-6 rounded-full bg-[#1FA855]/10 text-[#1FA855] hover:bg-[#1FA855] hover:text-white transition"><Icon n="whatsapp" s={14} /></a>}</span>);
  }
  out.push(text.slice(last));
  return <>{out}</>;
}
