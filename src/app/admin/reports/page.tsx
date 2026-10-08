import Link from "next/link";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { STATUS_AR, money } from "@/lib/admin/labels";
import { Card, PageHead, Stat } from "@/components/admin/ui";
import Icon from "@/components/Icon";
export const dynamic = "force-dynamic";
const RANGES: [string, string, number | null][] = [["7", "7 أيام", 7], ["30", "30 يوم", 30], ["90", "3 أشهر", 90], ["365", "سنة", 365], ["all", "الكل", null]];
type Row = { name: string; value: number; sub?: string; href?: string };
// قائمة ترتيب مع شريط نسبي
function Rank({ rows, unit, empty }: { rows: Row[]; unit: string; empty: string }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  if (!rows.length) return <p className="text-sm text-steel text-center py-8">{empty}</p>;
  return (<ol className="space-y-3">{rows.map((r, i) => (<li key={r.name + i} className="space-y-1.5">
    <div className="flex items-center gap-3 text-sm"><span className={`w-6 h-6 rounded-lg grid place-items-center text-xs font-extrabold shrink-0 ${i === 0 ? "bg-lime text-ink" : "bg-soft text-steel"}`}>{i + 1}</span>
      {r.href ? <Link href={r.href} className="flex-1 min-w-0 font-bold truncate hover:underline">{r.name}</Link> : <b className="flex-1 min-w-0 truncate">{r.name}</b>}
      <span className="text-end shrink-0"><b>{money(r.value)}</b> <small className="text-steel">{unit}</small>{r.sub && <small className="block text-xs text-steel">{r.sub}</small>}</span></div>
    <div className="h-2 rounded-full bg-soft overflow-hidden ms-9"><i className={`block h-full rounded-full ${i === 0 ? "bg-lime" : "bg-ink/70"}`} style={{ width: `${(r.value / max) * 100}%` }} /></div></li>))}</ol>);
}
// تقارير المبيعات: الأرقام الأساسية مع مقارنة بالفترة السابقة، الرسم اليومي، وأكثر المنتجات والمناديب والمحلات والعملاء
export default async function Reports({ searchParams }: { searchParams: { r?: string } }) {
  const range = RANGES.find(([k]) => k === searchParams.r) ?? RANGES[1], days = range[2], now = new Date();
  const from = days ? new Date(now.getTime() - days * 864e5) : null, prevFrom = days ? new Date(now.getTime() - 2 * days * 864e5) : null;
  const ok: Prisma.OrderWhereInput = { status: { not: "CANCELLED" }, ...(from && { createdAt: { gte: from } }) };
  const fromSql = from ?? new Date(0), monthly = !days || days > 90;
  const [cur, prev, pieces, statuses, types, reps, stores, custs, products, series, newCustomers] = await Promise.all([
    db.order.aggregate({ where: ok, _count: true, _sum: { total: true } }),
    prevFrom ? db.order.aggregate({ where: { status: { not: "CANCELLED" }, createdAt: { gte: prevFrom, lt: from! } }, _count: true, _sum: { total: true } }) : null,
    db.orderItem.aggregate({ where: { order: ok }, _sum: { quantity: true } }),
    db.order.groupBy({ by: ["status"], where: from ? { createdAt: { gte: from } } : {}, _count: true }),
    db.order.groupBy({ by: ["isWholesale"], where: ok, _count: true, _sum: { total: true } }),
    db.order.groupBy({ by: ["repId"], where: { ...ok, repId: { not: null } }, _count: true, _sum: { total: true }, orderBy: { _sum: { total: "desc" } }, take: 8 }),
    db.order.groupBy({ by: ["storeId"], where: { ...ok, storeId: { not: null } }, _count: true, _sum: { total: true }, orderBy: { _count: { storeId: "desc" } }, take: 8 }),
    db.order.groupBy({ by: ["customerId"], where: ok, _count: true, _sum: { total: true }, orderBy: { _sum: { total: "desc" } }, take: 8 }),
    db.$queryRaw<{ id: number; name: string; qty: bigint; rev: Prisma.Decimal | null }[]>`
      SELECT oi."productId" AS id, MAX(oi."nameSnapshot") AS name, SUM(oi.quantity) AS qty, SUM(oi.quantity * COALESCE(oi."unitPrice", 0)) AS rev
      FROM "OrderItem" oi JOIN "Order" o ON o.id = oi."orderId"
      WHERE o.status <> 'CANCELLED' AND o."createdAt" >= ${fromSql}
      GROUP BY oi."productId" ORDER BY qty DESC, rev DESC LIMIT 10`,
    db.$queryRaw<{ d: Date; n: bigint; t: Prisma.Decimal | null }[]>`
      SELECT date_trunc(${monthly ? "month" : "day"}, o."createdAt" AT TIME ZONE 'Asia/Riyadh') AS d, COUNT(*) AS n, SUM(o.total) AS t
      FROM "Order" o WHERE o.status <> 'CANCELLED' AND o."createdAt" >= ${fromSql} GROUP BY 1 ORDER BY 1`,
    db.customer.count({ where: from ? { createdAt: { gte: from } } : {} }),
  ]);
  const [repRows, storeRows, custRows] = await Promise.all([
    db.rep.findMany({ where: { id: { in: reps.map((r) => r.repId!) } }, select: { id: true, name: true } }),
    db.store.findMany({ where: { id: { in: stores.map((r) => r.storeId!) } }, select: { id: true, name: true } }),
    db.customer.findMany({ where: { id: { in: custs.map((r) => r.customerId) } }, select: { id: true, name: true, company: true } })]);
  const revenue = Number(cur._sum.total ?? 0), orders = cur._count, avg = orders ? revenue / orders : 0;
  const delta = (a: number, b?: number | null) => (b ? Math.round(((a - b) / b) * 100) : null), dRev = delta(revenue, prev ? Number(prev._sum.total ?? 0) : null), dOrd = delta(orders, prev?._count);
  const sub = (d: number | null) => (d == null ? (days ? "لا توجد بيانات للفترة السابقة" : undefined) : `${d >= 0 ? "▲" : "▼"} ${Math.abs(d)}% عن الفترة السابقة`);
  // الرسم: كل يوم (أو شهر) في الفترة حتى الفارغ منها
  const pts = series.map((x) => ({ k: x.d.toISOString().slice(0, monthly ? 7 : 10), n: Number(x.n), t: Number(x.t ?? 0) }));
  const bars: { k: string; n: number; t: number }[] = [];
  if (!monthly && days) for (let i = days - 1; i >= 0; i--) { const k = new Date(now.getTime() - i * 864e5 + 3 * 36e5).toISOString().slice(0, 10); bars.push(pts.find((p) => p.k === k) ?? { k, n: 0, t: 0 }); }
  else bars.push(...pts);
  const maxT = Math.max(1, ...bars.map((b) => b.t)), label = (k: string) => new Date(k + (monthly ? "-01" : "")).toLocaleDateString("ar-SA", monthly ? { month: "short", year: "2-digit" } : { day: "numeric", month: "short" });
  const allStatus = statuses.reduce((n, s) => n + s._count, 0);
  return (<div className="space-y-4 md:space-y-5">
    <PageHead title="التقارير" desc="أداء المبيعات للفترة المختارة. الطلبات الملغاة لا تُحسب في المبيعات." />
    <div className="-mx-4 px-4 sm:mx-0 sm:px-0 flex gap-2 overflow-x-auto no-scrollbar">{RANGES.map(([k, l]) => <Link key={k} href={`/admin/reports?r=${k}`} className={`chip h-9 ${range[0] === k ? "chip-on" : "chip-off"}`}>{l}</Link>)}</div>
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <Stat label="المبيعات" value={`${money(revenue)}`} sub={sub(dRev) ?? "ريال"} icon="chart" />
      <Stat label="الطلبات" value={orders} sub={sub(dOrd)} icon="orders" tone="ink" href="/admin/orders" />
      <Stat label="متوسط الطلب" value={money(Math.round(avg))} sub="ريال" icon="bag" tone="soft" />
      <Stat label="القطع المباعة" value={money(pieces._sum.quantity ?? 0)} sub={`${newCustomers} عميل جديد`} icon="box" tone="accent" />
    </div>
    <Card title={monthly ? "المبيعات الشهرية" : "المبيعات اليومية"} desc="مرّر على العمود لعرض التفاصيل">
      {bars.length && bars.some((b) => b.n) ? <div className="flex items-end gap-[3px] h-48 overflow-x-auto no-scrollbar" dir="ltr">{bars.map((b) => (
        <div key={b.k} className="group relative flex-1 min-w-[8px] h-full flex flex-col justify-end" title={`${label(b.k)}: ${b.n} طلب · ${money(b.t)} ريال`}>
          <i className={`block w-full rounded-t-md transition ${b.n ? "bg-lime group-hover:bg-accent" : "bg-soft"}`} style={{ height: `${Math.max(b.n ? 4 : 2, (b.t / maxT) * 100)}%` }} /></div>))}</div>
        : <p className="text-sm text-steel text-center py-12">لا توجد مبيعات في هذه الفترة</p>}
      {bars.length > 0 && <div className="flex justify-between text-[11px] text-steel mt-2" dir="ltr"><span>{label(bars[0].k)}</span><span>{label(bars[bars.length - 1].k)}</span></div>}
    </Card>
    <div className="grid lg:grid-cols-2 gap-4">
      <Card title="الأكثر طلبًا" desc="حسب عدد القطع"><Rank unit="قطعة" empty="لا توجد طلبات" rows={products.map((p) => ({ name: p.name, value: Number(p.qty), sub: Number(p.rev ?? 0) ? `${money(Number(p.rev))} ريال` : undefined, href: `/admin/products/${p.id}` }))} /></Card>
      <Card title="أفضل المناديب" desc="حسب قيمة المبيعات"><Rank unit="ريال" empty="لا توجد طلبات عن طريق مناديب" rows={reps.map((r) => ({ name: repRows.find((x) => x.id === r.repId)?.name ?? "—", value: Number(r._sum.total ?? 0), sub: `${r._count} طلب`, href: "/admin/reps" }))} /></Card>
      <Card title="أفضل المحلات" desc="الطلبات القادمة من رمز QR كل محل"><Rank unit="طلب" empty="لا توجد طلبات من رموز المحلات" rows={stores.map((r) => ({ name: storeRows.find((x) => x.id === r.storeId)?.name ?? "—", value: r._count, sub: `${money(Number(r._sum.total ?? 0))} ريال`, href: `/admin/orders?store=${r.storeId}` }))} /></Card>
      <Card title="أكبر العملاء" desc="حسب قيمة الطلبات"><Rank unit="ريال" empty="لا يوجد عملاء" rows={custs.map((r) => { const c = custRows.find((x) => x.id === r.customerId); return { name: c ? `${c.name}${c.company ? ` · ${c.company}` : ""}` : "—", value: Number(r._sum.total ?? 0), sub: `${r._count} طلب` }; })} /></Card>
    </div>
    <div className="grid md:grid-cols-2 gap-4">
      <Card title="حالة الطلبات"><div className="space-y-2">{Object.entries(STATUS_AR).map(([k, l]) => { const n = statuses.find((s) => s.status === k)?._count ?? 0; return (
        <div key={k} className="flex items-center gap-3 text-sm"><span className="w-24 shrink-0 text-steel">{l}</span><div className="flex-1 h-2.5 rounded-full bg-soft overflow-hidden"><i className={`block h-full ${k === "CANCELLED" ? "bg-steel/40" : k === "NEW" ? "bg-accent" : "bg-ink/70"}`} style={{ width: `${allStatus ? (n / allStatus) * 100 : 0}%` }} /></div><b className="w-8 text-end">{n}</b></div>); })}</div></Card>
      <Card title="جملة وتجزئة"><div className="grid grid-cols-2 gap-3">{[false, true].map((w) => { const x = types.find((t) => t.isWholesale === w); return (
        <div key={String(w)} className={`rounded-2xl p-4 ${w ? "bg-ink text-white" : "bg-soft"}`}><small className={`flex items-center gap-1.5 text-xs font-bold ${w ? "text-lime" : "text-steel"}`}><Icon n={w ? "key" : "user"} s={14} />{w ? "جملة" : "تجزئة"}</small>
          <b className="block font-display text-2xl mt-1">{money(Number(x?._sum.total ?? 0))}</b><small className={w ? "text-white/60" : "text-steel"}>{x?._count ?? 0} طلب</small></div>); })}</div></Card>
    </div>
  </div>);
}
