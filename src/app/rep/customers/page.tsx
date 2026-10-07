import { db } from "@/lib/db";
import { currentRep } from "@/lib/repAuth";
import { prettyPhone, telHref, waHref } from "@/lib/phone";
import { money } from "@/lib/admin/labels";
import { AEmpty, PageHead } from "@/components/admin/ui";
import Icon from "@/components/Icon";
export const dynamic = "force-dynamic";
// عملاء المندوب: كل من طلب عن طريقه، مع عدد طلباته وقيمتها وآخر طلب
export default async function RepCustomers() {
  const rep = (await currentRep())!;
  const g = await db.order.groupBy({ by: ["customerId"], where: { repId: rep.id }, _count: true, _max: { createdAt: true } });
  const sums = await db.order.groupBy({ by: ["customerId"], where: { repId: rep.id, status: { not: "CANCELLED" } }, _sum: { total: true } });
  const cs = await db.customer.findMany({ where: { id: { in: g.map((x) => x.customerId) } } });
  const rows = cs.map((c) => { const x = g.find((y) => y.customerId === c.id)!; return { ...c, n: x._count, last: x._max.createdAt, sum: sums.find((y) => y.customerId === c.id)?._sum.total ?? 0 }; })
    .sort((a, b) => (b.last?.getTime() ?? 0) - (a.last?.getTime() ?? 0));
  return (<div>
    <PageHead title="عملائي" desc={`${rows.length} عميل طلبوا عن طريقك`} />
    {rows.length === 0 ? <div className="card"><AEmpty icon="user" title="لا يوجد عملاء بعد" /></div> :
      <div className="grid sm:grid-cols-2 gap-3">{rows.map((c) => (<div key={c.id} className="card p-4 flex items-center gap-3">
        <span className="w-11 h-11 rounded-full bg-ink text-lime grid place-items-center font-extrabold shrink-0">{c.name[0]}</span>
        <span className="min-w-0 flex-1"><b className="block text-sm truncate">{c.name}{c.company && <span className="text-steel font-normal"> · {c.company}</span>}</b>
          <small className="block text-xs text-steel" dir="ltr" style={{ textAlign: "start" }}>{prettyPhone(c.phone)}</small>
          <small className="block text-xs text-steel">{c.n} طلب · {money(c.sum)} ر.س{c.last && ` · آخر طلب ${c.last.toLocaleDateString("ar-SA", { dateStyle: "medium" })}`}</small></span>
        <a href={waHref(c.phone, `السلام عليكم ${c.name}`)} target="_blank" rel="noopener noreferrer" aria-label={`واتساب ${c.name}`} className="btn-icon w-10 h-10 bg-[#1FA855] text-white"><Icon n="whatsapp" s={20} /></a>
        <a href={telHref(c.phone)} aria-label={`اتصال ${c.name}`} className="btn-icon w-10 h-10 bg-soft text-ink"><Icon n="phone" s={18} /></a></div>))}</div>}
  </div>);
}
