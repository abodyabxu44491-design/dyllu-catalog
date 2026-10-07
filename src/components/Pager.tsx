import Link from "next/link";
import Icon from "./Icon";
// ترقيم صفحات بأرقام (مع … للصفحات البعيدة). روابط عادية فيعمل بدون جافاسكربت
export default function Pager({ page, pages, href, en }: { page: number; pages: number; href: (n: number) => string; en: boolean }) {
  if (pages <= 1) return null;
  const nums = Array.from(new Set([1, page - 1, page, page + 1, pages].filter((n) => n >= 1 && n <= pages))).sort((a, b) => a - b);
  const box = "inline-grid place-items-center min-w-10 h-10 px-2 rounded-xl text-sm font-bold transition";
  return (<nav className="flex items-center justify-center gap-1.5 pt-8" aria-label="pagination">
    {page > 1 ? <Link href={href(page - 1)} aria-label={en ? "Previous" : "السابق"} className={`${box} bg-white border border-line hover:border-steel/50`}><Icon n="chev" s={18} className="rotate-180 rtl:rotate-0" /></Link> : <span className={`${box} opacity-30 border border-line`}><Icon n="chev" s={18} className="rotate-180 rtl:rotate-0" /></span>}
    {nums.map((n, i) => (<span key={n} className="contents">{i > 0 && n - nums[i - 1] > 1 && <span className="px-1 text-steel">…</span>}
      {n === page ? <span aria-current="page" className={`${box} bg-ink text-white`}>{n}</span> : <Link href={href(n)} className={`${box} bg-white border border-line hover:border-steel/50`}>{n}</Link>}</span>))}
    {page < pages ? <Link href={href(page + 1)} aria-label={en ? "Next" : "التالي"} className={`${box} bg-white border border-line hover:border-steel/50`}><Icon n="chev" s={18} className="rtl:rotate-180" /></Link> : <span className={`${box} opacity-30 border border-line`}><Icon n="chev" s={18} className="rtl:rotate-180" /></span>}
  </nav>);
}
