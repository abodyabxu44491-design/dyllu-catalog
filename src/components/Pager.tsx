import Link from "next/link";
import Icon from "./Icon";
// ترقيم صفحات موحّد للواجهة: السابق / رقم الصفحة / التالي (يعتمد على روابط عادية فيعمل بدون جافاسكربت)
export default function Pager({ page, pages, href, en }: { page: number; pages: number; href: (n: number) => string; en: boolean }) {
  if (pages <= 1) return null;
  const cls = "inline-flex items-center gap-1 rounded-full bg-lime text-ink font-extrabold px-4 py-2 text-sm";
  return (<nav className="flex items-center justify-center gap-3 px-4 pb-4" aria-label="pagination">
    {page > 1 ? <Link href={href(page - 1)} className={cls}><Icon n="chev" s={16} className="rotate-180 rtl:rotate-0" />{en ? "Previous" : "السابق"}</Link> : <span className="w-24" />}
    <span className="text-sm font-bold text-steel">{page} / {pages}</span>
    {page < pages ? <Link href={href(page + 1)} className={cls}>{en ? "Next" : "التالي"}<Icon n="chev" s={16} className="rtl:rotate-180" /></Link> : <span className="w-24" />}
  </nav>);
}
