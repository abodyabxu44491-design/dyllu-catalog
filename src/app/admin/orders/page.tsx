// Copyright (c) 2026 Abdullah Al-Sakni. All rights reserved. DYLLU Catalog.
import Link from "next/link";
import { db } from "@/lib/db";
import { pageParam } from "@/lib/format";
import { telHref, waHref } from "@/lib/phone";
import Linkify from "@/components/Linkify";
import { orderWhere, type OrderFilters } from "@/lib/admin/orders";
import StatusSelect from "@/components/admin/StatusSelect";
import { AEmpty, APager, Badge, PageHead } from "@/components/admin/ui";
import Icon from "@/components/Icon";
import { STATUS_AR, STATUS_CLS, fmtDate, money } from "@/lib/admin/labels";
export const dynamic = "force-dynamic";
const PER = 25;
export default async function Orders({ searchParams }: { searchParams: OrderFilters & { page?: string } }) {
  const { status, q, t, from, to, store } = searchParams,
    page = pageParam(searchParams.page),
    f = { status, q, t, from, to, store };
  const where = orderWhere(f);
  const [total, os, counts, sum, stores] = await Promise.all([
    db.order.count({ where }),
    db.order.findMany({
      where,
      include: { customer: true, items: true, rep: true, wholesaleCode: true, store: true },
      orderBy: { id: "desc" },
      skip: (page - 1) * PER,
      take: PER,
    }),
    db.order.groupBy({ by: ["status"], where: orderWhere(f, false), _count: true }),
    db.order.aggregate({ where: { ...where, status: { not: "CANCELLED" } }, _sum: { total: true } }),
    db.store.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);
  const pages = Math.max(1, Math.ceil(total / PER)),
    qs = (o: Record<string, string | undefined>) =>
      new URLSearchParams(Object.entries({ ...f, ...o }).filter(([, v]) => v) as [string, string][]).toString(),
    href = (o: Record<string, string | undefined>) => `/admin/orders?${qs(o)}`;
  const all = counts.reduce((n, c) => n + c._count, 0),
    filtered = !!(q || t || from || to || store);
  return (
    <div>
      <PageHead title="الطلبات" desc="كل طلب يُنشأ عند إرسال العميل للسلة. حدّث حالته بعد التواصل مع العميل.">
        <a href={`/api/admin/orders/export?${qs({ page: undefined })}`} className="btn btn-md btn-ghost">
          <Icon n="download" s={18} />
          تصدير Excel
        </a>
      </PageHead>
      <div className="-mx-4 px-4 sm:mx-0 sm:px-0 flex gap-2 overflow-x-auto no-scrollbar mb-3">
        <Link href={href({ status: undefined, page: undefined })} className={`chip h-9 ${!status ? "chip-on" : "chip-off"}`}>
          الكل<small className={`rounded-md px-1.5 text-[11px] ${!status ? "bg-white/20" : "bg-soft"}`}>{all}</small>
        </Link>
        {Object.entries(STATUS_AR).map(([k, l]) => (
          <Link key={k} href={href({ status: k, page: undefined })} className={`chip h-9 ${status === k ? "chip-on" : "chip-off"}`}>
            {l}
            <small
              className={`rounded-md px-1.5 text-[11px] ${status === k ? "bg-white/20" : k === "NEW" ? "bg-accent text-white" : "bg-soft"}`}
            >
              {counts.find((c) => c.status === k)?._count ?? 0}
            </small>
          </Link>
        ))}
      </div>
      <form className="card p-3 grid grid-cols-2 md:grid-cols-[1fr_auto_auto_auto_auto_auto] gap-2 mb-4">
        {status && <input type="hidden" name="status" value={status} />}
        <div className="relative col-span-2 md:col-span-1">
          <Icon n="search" s={18} className="absolute start-3.5 top-1/2 -translate-y-1/2 text-steel" />
          <input name="q" defaultValue={q} placeholder="رقم الطلب، الاسم، الجوال، الشركة، مصدر QR" className="field ps-10 h-11" />
        </div>
        <select name="t" aria-label="نوع العميل" defaultValue={t ?? ""} className="field h-11 md:w-auto">
          <option value="">جملة وعادي</option>
          <option value="ws">جملة فقط</option>
          <option value="retail">عادي فقط</option>
        </select>
        <select name="store" defaultValue={store ?? ""} aria-label="المحل" className="field h-11 md:w-auto">
          <option value="">كل المحلات</option>
          <option value="none">بدون محل</option>
          {stores.map((x) => (
            <option key={x.id} value={x.id}>
              {x.name}
            </option>
          ))}
        </select>
        <label className="relative">
          <span className="sr-only">من تاريخ</span>
          <input type="date" name="from" defaultValue={from} className="field h-11 md:w-40" aria-label="من تاريخ" />
        </label>
        <label className="relative">
          <span className="sr-only">إلى تاريخ</span>
          <input type="date" name="to" defaultValue={to} className="field h-11 md:w-40" aria-label="إلى تاريخ" />
        </label>
        <div className="flex gap-2">
          <button className="btn btn-md btn-dark flex-1">بحث</button>
          {filtered && (
            <Link
              href={href({ q: undefined, t: undefined, from: undefined, to: undefined, store: undefined, page: undefined })}
              className="btn btn-md btn-ghost"
            >
              مسح
            </Link>
          )}
        </div>
      </form>
      <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-steel mb-3 px-1">
        <span>
          <b className="text-ink">{total}</b> طلب
        </span>
        <span>
          الإجمالي (بدون الملغي): <b className="text-ink">{money(sum._sum.total)}</b> ريال
        </span>
      </div>

      {os.length === 0 ? (
        <div className="card">
          <AEmpty icon="orders" title={filtered || status ? "لا توجد طلبات مطابقة" : "لا توجد طلبات بعد"} />
        </div>
      ) : (
        <div className="space-y-2">
          {os.map((o) => {
            const pcs = o.items.reduce((n, i) => n + i.quantity, 0);
            return (
              <details key={o.id} className="group card overflow-hidden open:shadow-card" open={os.length === 1}>
                <summary className="list-none cursor-pointer p-3 md:p-4 grid grid-cols-[auto_1fr_auto] items-center gap-3 hover:bg-soft/60 [&::-webkit-details-marker]:hidden">
                  <span
                    className={`w-10 h-10 rounded-xl grid place-items-center shrink-0 ${o.status === "NEW" ? "bg-accent text-white" : "bg-soft text-steel"}`}
                  >
                    <Icon n="orders" s={18} />
                  </span>
                  <span className="min-w-0">
                    <b className="flex items-center gap-2 flex-wrap text-sm">
                      <span dir="ltr">{o.number}</span>
                      <span className="font-normal text-ink/80 truncate">{o.customer.name}</span>
                      {o.isWholesale && <Badge cls="bg-ink text-lime">جملة</Badge>}
                    </b>
                    <small className="block text-xs text-steel mt-0.5">
                      {fmtDate(o.createdAt)} · {pcs} قطعة{o.rep ? ` · ${o.rep.name}` : ""}
                      {o.store ? ` · من ${o.store.name}` : ""}
                    </small>
                  </span>
                  <span className="text-end">
                    <b className="block text-sm">
                      {money(o.total)}
                      {o.hasUnpriced ? "+" : ""} <small className="font-normal text-steel">ر.س</small>
                    </b>
                    <Badge cls={STATUS_CLS[o.status]}>{STATUS_AR[o.status]}</Badge>
                  </span>
                </summary>
                <div className="border-t border-line p-3 md:p-5 space-y-4 text-sm">
                  <div className="grid md:grid-cols-[1fr_280px] gap-4">
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[380px]">
                        <thead>
                          <tr className="text-steel text-xs border-b border-line">
                            <th className="text-start font-bold pb-2">المنتج</th>
                            <th className="font-bold pb-2 w-14">الكمية</th>
                            <th className="text-end font-bold pb-2">السعر</th>
                            <th className="text-end font-bold pb-2">الإجمالي</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-line">
                          {o.items.map((x) => (
                            <tr key={x.id}>
                              <td className="py-2" dir="ltr" style={{ textAlign: "start" }}>
                                {x.nameSnapshot}
                              </td>
                              <td className="text-center">{x.quantity}</td>
                              <td className="text-end text-steel">{x.unitPrice == null ? "غير محدد" : money(x.unitPrice)}</td>
                              <td className="text-end font-bold">{x.unitPrice == null ? "—" : money(Number(x.unitPrice) * x.quantity)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <dl className="rounded-xl bg-soft p-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 content-start">
                      <dt className="text-steel">العميل</dt>
                      <dd className="font-bold">{o.customer.name}</dd>
                      <dt className="text-steel">الجوال</dt>
                      <dd>
                        <Linkify text={o.customer.phone} />
                      </dd>
                      {o.customer.company && (
                        <>
                          <dt className="text-steel">الشركة</dt>
                          <dd>{o.customer.company}</dd>
                        </>
                      )}
                      {o.customer.city && (
                        <>
                          <dt className="text-steel">المدينة</dt>
                          <dd>{o.customer.city}</dd>
                        </>
                      )}
                      <dt className="text-steel">المندوب</dt>
                      <dd>{o.rep ? `${o.rep.name} · ${o.rep.location}` : "—"}</dd>
                      {(o.store || o.source) && (
                        <>
                          <dt className="text-steel">المحل</dt>
                          <dd className="font-bold">
                            {o.store ? (
                              <a href={`/admin/orders?store=${o.store.id}`} className="hover:underline">
                                {o.store.name}
                              </a>
                            ) : (
                              <span dir="ltr">{o.source}</span>
                            )}
                          </dd>
                        </>
                      )}
                      {o.wholesaleCode && (
                        <>
                          <dt className="text-steel">كود الجملة</dt>
                          <dd>{o.wholesaleCode.name}</dd>
                        </>
                      )}
                    </dl>
                  </div>
                  {o.notes && (
                    <p className="rounded-xl border border-line p-3 leading-7">
                      <b>ملاحظات العميل:</b> <Linkify text={o.notes} />
                    </p>
                  )}
                  <div className="flex flex-wrap gap-2 items-center">
                    <StatusSelect id={o.id} status={o.status} />
                    <a
                      className="btn btn-sm h-10 btn-lime"
                      target="_blank"
                      rel="noopener noreferrer"
                      href={waHref(
                        o.customer.phone,
                        `السلام عليكم ${o.customer.name !== "بدون اسم" ? o.customer.name : ""}، بخصوص طلبكم ${o.number} من DYLLU`,
                      )}
                    >
                      <Icon n="whatsapp" s={16} />
                      واتساب العميل
                    </a>
                    <a className="btn btn-sm h-10 btn-ghost" href={telHref(o.customer.phone)}>
                      <Icon n="phone" s={16} />
                      اتصال
                    </a>
                    <Link className="btn btn-sm h-10 btn-ghost" target="_blank" href={`/order/${o.token}`}>
                      <Icon n="print" s={16} />
                      الفاتورة / PDF
                    </Link>
                  </div>
                </div>
              </details>
            );
          })}
        </div>
      )}
      <APager page={page} pages={pages} href={(n) => href({ page: String(n) })} />
    </div>
  );
}
