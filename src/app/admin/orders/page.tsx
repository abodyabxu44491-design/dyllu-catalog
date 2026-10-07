import Link from "next/link";
import type { OrderStatus, Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { pageParam } from "@/lib/format";
import { normalizePhone } from "@/lib/whatsapp";
import StatusSelect from "@/components/admin/StatusSelect";
import { STATUS_AR, STATUS_CLS, fmtDate, money } from "@/lib/admin/labels";
export const dynamic = "force-dynamic";
const PER = 30;
export default async function Orders({ searchParams }: { searchParams: { status?: string; q?: string; t?: string; page?: string } }) {
  const { status, q, t } = searchParams, page = pageParam(searchParams.page);
  const where: Prisma.OrderWhereInput = { ...(status && status in STATUS_AR && { status: status as OrderStatus }), ...(t === "ws" && { isWholesale: true }), ...(t === "retail" && { isWholesale: false }),
    ...(q && { OR: [{ number: { contains: q, mode: "insensitive" } }, { customer: { name: { contains: q, mode: "insensitive" } } }, { customer: { phone: { contains: q } } }, { source: { contains: q, mode: "insensitive" } }] }) };
  const [total, os, counts] = await Promise.all([db.order.count({ where }), db.order.findMany({ where, include: { customer: true, items: true, rep: true, wholesaleCode: true }, orderBy: { id: "desc" }, skip: (page - 1) * PER, take: PER }), db.order.groupBy({ by: ["status"], _count: true })]);
  const pages = Math.max(1, Math.ceil(total / PER)), href = (o: Record<string, string | undefined>) => "/admin/orders?" + new URLSearchParams(Object.entries({ status, q, t, ...o }).filter(([, v]) => v) as [string, string][]).toString();
  const chip = (on: boolean) => `rounded-xl px-3 py-1.5 text-sm font-bold ${on ? "bg-ink text-white" : "bg-white border"}`;
  return (<div className="space-y-4">
    <h1 className="text-xl font-extrabold">الطلبات ({total})</h1>
    <div className="flex gap-2 flex-wrap"><Link href={href({ status: undefined, page: undefined })} className={chip(!status)}>الكل</Link>{Object.entries(STATUS_AR).map(([k, l]) => <Link key={k} href={href({ status: k, page: undefined })} className={chip(status === k)}>{l} · {counts.find((c) => c.status === k)?._count ?? 0}</Link>)}</div>
    <form className="flex flex-wrap gap-2">{status && <input type="hidden" name="status" value={status} />}<input name="q" defaultValue={q} placeholder="رقم الطلب، اسم، جوال، مصدر QR" className="border rounded-xl p-2 bg-white flex-1 min-w-[180px]" />
      <select name="t" defaultValue={t ?? ""} className="border rounded-xl p-2 bg-white"><option value="">جملة وعادي</option><option value="ws">جملة فقط</option><option value="retail">عادي فقط</option></select><button className="bg-ink text-white font-bold rounded-xl px-4">بحث</button></form>
    <div className="space-y-2">{os.map((o) => (<details key={o.id} className="bg-white rounded-2xl p-3">
      <summary className="flex justify-between items-center gap-2 cursor-pointer flex-wrap"><span><b>{o.number}</b> {o.customer.name}{o.isWholesale && <span className="ms-1 bg-ink text-lime text-[11px] font-bold rounded px-1.5">جملة</span>}</span>
        <span className="flex items-center gap-2 text-sm"><span className="text-steel text-xs">{fmtDate(o.createdAt)}</span><b>{money(o.total)} ر.س{o.hasUnpriced ? "+" : ""}</b><span className={`rounded-lg px-2 py-0.5 text-xs font-bold ${STATUS_CLS[o.status]}`}>{STATUS_AR[o.status]}</span></span></summary>
      <div className="mt-3 text-sm space-y-3">
        <table className="w-full"><thead><tr className="text-steel text-start border-b"><td>المنتج</td><td>الكمية</td><td>السعر</td><td>الإجمالي</td></tr></thead><tbody>{o.items.map((x) => <tr key={x.id} className="border-b"><td className="py-1.5" dir="ltr">{x.nameSnapshot}</td><td>{x.quantity}</td><td>{x.unitPrice == null ? "غير محدد" : money(x.unitPrice)}</td><td>{x.unitPrice == null ? "-" : money(Number(x.unitPrice) * x.quantity)}</td></tr>)}</tbody></table>
        <div className="grid md:grid-cols-2 gap-2 bg-soft rounded-xl p-3"><div>العميل: <b>{o.customer.name}</b></div><div>الجوال: <b dir="ltr">{o.customer.phone}</b></div><div>الشركة: {o.customer.company ?? "-"}</div><div>المدينة: {o.customer.city ?? "-"}</div>
          <div>المندوب: <b>{o.rep?.name ?? "—"}</b>{o.rep && <span className="text-steel"> · {o.rep.location}</span>}</div><div>مصدر QR: <b dir="ltr">{o.source ?? "—"}</b></div>{o.wholesaleCode && <div>كود الجملة: <b>{o.wholesaleCode.name}</b></div>}{o.notes && <div className="md:col-span-2">ملاحظات: {o.notes}</div>}</div>
        <div className="flex flex-wrap gap-2 items-center"><StatusSelect id={o.id} status={o.status} />
          <a className="bg-lime font-bold rounded-xl px-3 py-1.5" target="_blank" href={`https://wa.me/${normalizePhone(o.customer.phone)}`}>واتساب العميل</a>
          <Link className="border rounded-xl px-3 py-1.5 font-bold" target="_blank" href={`/order/${o.token}`}>الفاتورة / PDF</Link></div></div></details>))}
      {os.length === 0 && <p className="text-steel text-center p-8">لا توجد طلبات.</p>}</div>
    {pages > 1 && <div className="flex gap-2 justify-center items-center">{page > 1 && <Link href={href({ page: String(page - 1) })} className="border bg-white rounded-xl px-3 py-1">السابق</Link>}<span className="text-sm">{page} / {pages}</span>{page < pages && <Link href={href({ page: String(page + 1) })} className="border bg-white rounded-xl px-3 py-1">التالي</Link>}</div>}
  </div>);
}
