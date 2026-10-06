import Link from "next/link";
import { db } from "@/lib/db";
import { STATUS_AR, STATUS_CLS, fmtDate, money } from "@/lib/admin/labels";
export const dynamic = "force-dynamic";
const Card = ({ l, n, sub, href }: { l: string; n: React.ReactNode; sub?: string; href?: string }) => {
  const c = <div className="relative bg-white rounded-3xl p-4 pt-5 border-b-4 border-lime h-full overflow-hidden"><i className="absolute top-3 end-3 w-2.5 h-2.5 bg-accent rotate-45" /><div className="text-steel text-sm">{l}</div><div className="text-3xl font-extrabold">{n}</div>{sub && <div className="text-xs text-steel mt-1">{sub}</div>}</div>;
  return href ? <Link href={href}>{c}</Link> : c;
};
export default async function Dash() {
  const now = new Date(), day = new Date(now.getFullYear(), now.getMonth(), now.getDate()), month = new Date(now.getFullYear(), now.getMonth(), 1), d30 = new Date(Date.now() - 30 * 864e5);
  const live = { status: { not: "CANCELLED" as const } };
  const [pAll, pOn, cats, oDay, oMonth, oNew, wsMonth, sales, codes, reps, noWs, byStatus, bySrc, top, latest] = await Promise.all([
    db.product.count(), db.product.count({ where: { isActive: true } }), db.category.count(),
    db.order.count({ where: { createdAt: { gte: day } } }), db.order.count({ where: { createdAt: { gte: month } } }), db.order.count({ where: { status: "NEW" } }),
    db.order.count({ where: { createdAt: { gte: month }, isWholesale: true } }), db.order.aggregate({ _sum: { total: true }, where: { createdAt: { gte: month }, ...live } }),
    db.wholesaleCode.count({ where: { isActive: true } }), db.rep.count({ where: { isActive: true } }), db.product.count({ where: { isActive: true, wholesalePrice: null } }),
    db.order.groupBy({ by: ["status"], _count: true }), db.order.groupBy({ by: ["source"], _count: true, where: { source: { not: null } }, orderBy: { _count: { source: "desc" } }, take: 6 }),
    db.orderItem.groupBy({ by: ["productId"], _sum: { quantity: true }, where: { order: { createdAt: { gte: d30 }, ...live } }, orderBy: { _sum: { quantity: "desc" } }, take: 5 }),
    db.order.findMany({ include: { customer: true, rep: true }, orderBy: { id: "desc" }, take: 8 }),
  ]);
  const names = new Map((await db.product.findMany({ where: { id: { in: top.map((t) => t.productId) } }, select: { id: true, nameEn: true } })).map((p) => [p.id, p.nameEn]));
  const maxTop = Math.max(1, ...top.map((t) => t._sum.quantity ?? 0)), stat = (s: string) => byStatus.find((x) => x.status === s)?._count ?? 0;
  return (<div className="space-y-6">
    <div className="flex flex-wrap gap-2"><Link href="/admin/products/new" className="bg-lime font-extrabold rounded-xl px-4 py-2">+ منتج</Link><Link href="/admin/banners" className="bg-white border font-bold rounded-xl px-4 py-2">+ إعلان</Link><Link href="/admin/codes" className="bg-ink text-white font-bold rounded-xl px-4 py-2">+ كود جملة</Link><Link href="/admin/reps" className="bg-white border font-bold rounded-xl px-4 py-2">+ مندوب</Link><Link href="/admin/qr" className="bg-white border font-bold rounded-xl px-4 py-2">QR</Link></div>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <Card l="طلبات جديدة" n={oNew} sub="تحتاج متابعة" href="/admin/orders?status=NEW" /><Card l="طلبات اليوم" n={oDay} href="/admin/orders" /><Card l="طلبات الشهر" n={oMonth} sub={`منها جملة: ${wsMonth}`} href="/admin/orders" />
      <Card l="مبيعات الشهر" n={money(sales._sum.total)} sub="ريال، بدون الملغي" />
      <Card l="المنتجات" n={pAll} sub={`ظاهر ${pOn} · مخفي ${pAll - pOn}`} href="/admin/products" /><Card l="التصنيفات" n={cats} href="/admin/categories" />
      <Card l="أكواد الجملة الفعّالة" n={codes} sub={noWs ? `${noWs} منتج بلا سعر جملة` : undefined} href="/admin/codes" /><Card l="المناديب الفعّالون" n={reps} href="/admin/reps" /></div>
    <div className="grid md:grid-cols-2 gap-4">
      <section className="bg-white rounded-2xl p-4"><h2 className="font-extrabold mb-3">الطلبات حسب الحالة</h2><div className="flex flex-wrap gap-2">{Object.keys(STATUS_AR).map((s) => <Link key={s} href={`/admin/orders?status=${s}`} className={`rounded-xl px-3 py-2 text-sm font-bold ${STATUS_CLS[s]}`}>{STATUS_AR[s]} · {stat(s)}</Link>)}</div>
        {bySrc.length > 0 && <><h2 className="font-extrabold mt-5 mb-2">مصادر الطلبات (QR)</h2><div className="space-y-1 text-sm">{bySrc.map((x) => <div key={x.source} className="flex justify-between border-b py-1"><span dir="ltr">{x.source}</span><b>{x._count}</b></div>)}</div></>}</section>
      <section className="bg-white rounded-2xl p-4"><h2 className="font-extrabold mb-3">الأكثر طلبًا (30 يومًا)</h2>{top.length === 0 ? <p className="text-steel text-sm">لا توجد بيانات بعد.</p> : <div className="space-y-2">{top.map((t) => <div key={t.productId}><div className="flex justify-between text-sm"><span dir="ltr">{names.get(t.productId)}</span><b>{t._sum.quantity}</b></div><div className="h-2 bg-soft rounded-full"><div className="h-2 bg-lime rounded-full" style={{ width: `${((t._sum.quantity ?? 0) / maxTop) * 100}%` }} /></div></div>)}</div>}</section></div>
    <section className="bg-white rounded-2xl p-4"><div className="flex justify-between mb-3"><h2 className="font-extrabold">آخر الطلبات</h2><Link href="/admin/orders" className="text-sm text-steel">عرض الكل</Link></div>
      {latest.length === 0 ? <p className="text-steel text-sm">لا توجد طلبات بعد.</p> : <div className="overflow-x-auto"><table className="w-full text-sm"><tbody>{latest.map((o) => <tr key={o.id} className="border-b"><td className="py-2 font-bold">{o.number}</td><td>{o.customer.name}{o.isWholesale && <span className="ms-1 bg-ink text-lime text-[11px] font-bold rounded px-1">جملة</span>}</td><td className="text-steel">{o.rep?.name ?? "-"}</td><td>{money(o.total)}{o.hasUnpriced ? "+" : ""}</td><td><span className={`rounded-lg px-2 py-0.5 text-xs font-bold ${STATUS_CLS[o.status]}`}>{STATUS_AR[o.status]}</span></td><td className="text-steel text-xs">{fmtDate(o.createdAt)}</td></tr>)}</tbody></table></div>}</section>
  </div>);
}
