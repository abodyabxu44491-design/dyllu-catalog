// Copyright (c) 2026 Abdullah Al-Sakni. All rights reserved. DYLLU Catalog.
import Link from "next/link";
import { db } from "@/lib/db";
import { pageParam } from "@/lib/format";
import { telHref, waHref } from "@/lib/phone";
import Linkify from "@/components/Linkify";
import { orderWhere, type OrderFilters } from "@/lib/admin/orders";
import StatusSelect from "@/components/admin/StatusSelect";
import { ArchiveDone, DeleteOrder, OrderActions, OrderBulk } from "@/components/admin/OrderActions";
import { AEmpty, APager, Badge, PageHead } from "@/components/admin/ui";
import Icon from "@/components/Icon";
import { STATUS_AR, STATUS_CLS, fmtDate, money } from "@/lib/admin/labels";
export const dynamic = "force-dynamic";
const PER = 25;
export default async function Orders(props: { searchParams: Promise<OrderFilters & { page?: string }> }) {
  const searchParams = await props.searchParams;
  const { status, q, t, from, to, store } = searchParams,
    archived = searchParams.archived === "1" ? "1" : undefined,
    page = pageParam(searchParams.page),
    f = { status, q, t, from, to, store, archived };
  const where = orderWhere(f);
  const [archivedCount, doneCount] = await Promise.all([
    db.order.count({ where: { archivedAt: { not: null } } }),
    db.order.count({ where: { archivedAt: null, status: { in: ["COMPLETED", "CANCELLED"] } } }),
  ]);
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
        {!archived && <ArchiveDone count={doneCount} />}
        <a href={`/api/admin/orders/export?${qs({ page: undefined })}`} className="btn btn-md btn-ghost">
          <Icon n="download" s={18} />
          تصدير Excel
        </a>
      </PageHead>
      <div className="inline-flex rounded-2xl bg-white border border-line p-1 mb-3">
        <Link
          href={href({ archived: undefined, status: undefined, page: undefined })}
          className={`px-4 h-9 rounded-xl grid place-items-center text-sm font-bold ${!archived ? "bg-ink text-white" : "text-steel"}`}
        >
          الطلبات الحالية
        </Link>
        <Link
          href={href({ archived: "1", status: undefined, page: undefined })}
          className={`px-4 h-9 rounded-xl flex items-center gap-1.5 text-sm font-bold ${archived ? "bg-ink text-white" : "text-steel"}`}
        >
          <Icon n="download" s={15} />
          الأرشيف
          <small className={`rounded-md px-1.5 text-[11px] ${archived ? "bg-white/20" : "bg-soft"}`}>{archivedCount}</small>
        </Link>
      </div>
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
      <form className="card p-3 grid grid-cols-2 lg:grid-cols-[minmax(0,1fr)_10rem_10rem_auto_auto] gap-2 mb-4">
        {status && <input type="hidden" name="status" value={status} />}
        {archived && <input type="hidden" name="archived" value="1" />}
        <div className="relative col-span-2 lg:col-span-1">
          <Icon n="search" s={18} className="absolute start-3.5 top-1/2 -translate-y-1/2 text-steel" />
          <input name="q" defaultValue={q} placeholder="رقم الطلب، الاسم، الجوال، الشركة" className="field ps-10 h-11" />
        </div>
        <select name="t" aria-label="نوع العميل" defaultValue={t ?? ""} className="field h-11 text-sm">
          <option value="">جملة وعادي</option>
          <option value="ws">جملة فقط</option>
          <option value="retail">عادي فقط</option>
        </select>
        <select name="store" defaultValue={store ?? ""} aria-label="المحل" className="field h-11 text-sm">
          <option value="">كل المحلات</option>
          <option value="none">بدون محل</option>
          {stores.map((x) => (
            <option key={x.id} value={x.id}>
              {x.name}
            </option>
          ))}
        </select>
        <fieldset className="col-span-2 lg:col-span-1 grid grid-cols-2 gap-2 min-w-0">
          <legend className="sr-only">الفترة</legend>
          {(
            [
              ["from", "من", from],
              ["to", "إلى", to],
            ] as const
          ).map(([n, l, v]) => (
            <label
              key={n}
              className="dy-date flex items-center gap-2 h-11 min-w-0 rounded-xl border border-line bg-white ps-3 pe-2 focus-within:border-steel focus-within:ring-4 focus-within:ring-lime/40"
            >
              <span className="text-xs font-extrabold text-steel shrink-0">{l}</span>
              <input
                type="date"
                name={n}
                defaultValue={v}
                aria-label={n === "from" ? "من تاريخ" : "إلى تاريخ"}
                className="flex-1 min-w-0 w-full h-full bg-transparent text-sm outline-none lg:w-32"
              />
            </label>
          ))}
        </fieldset>
        <div className="col-span-2 lg:col-span-1 flex gap-2">
          <button className="btn btn-md btn-dark flex-1 h-11">
            <Icon n="search" s={16} />
            بحث
          </button>
          {filtered && (
            <Link
              href={href({ q: undefined, t: undefined, from: undefined, to: undefined, store: undefined, page: undefined })}
              className="btn btn-md btn-ghost h-11"
            >
              مسح
            </Link>
          )}
        </div>
      </form>
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-steel mb-3 px-1">
        {os.length > 0 && <OrderBulk archived={!!archived} count={os.length} />}
        <span>
          <b className="text-ink">{total}</b> طلب
        </span>
        <span>
          الإجمالي (بدون الملغي): <b className="text-ink">{money(sum._sum.total)}</b> ريال
        </span>
      </div>

      {os.length === 0 ? (
        <div className="card">
          <AEmpty
            icon="orders"
            title={
              archived
                ? filtered || status
                  ? "لا توجد طلبات مؤرشفة مطابقة"
                  : "الأرشيف فارغ"
                : filtered || status
                  ? "لا توجد طلبات مطابقة"
                  : "لا توجد طلبات بعد"
            }
          />
        </div>
      ) : (
        <div className="space-y-2">
          {os.map((o) => {
            const pcs = o.items.reduce((n, i) => n + i.quantity, 0);
            return (
              <div key={o.id} className="card overflow-hidden flex items-start has-[[data-order-sel]:checked]:ring-2 has-[[data-order-sel]:checked]:ring-lime">
                <label className="shrink-0 ps-3 md:ps-4 pt-[22px] md:pt-[26px] cursor-pointer">
                  <input
                    type="checkbox"
                    data-order-sel
                    value={o.id}
                    aria-label={`تحديد الطلب ${o.number}`}
                    className="w-5 h-5 accent-ink block"
                  />
                </label>
                <details className="group flex-1 min-w-0" open={os.length === 1}>
                  <summary className="list-none cursor-pointer p-3 md:p-4 grid grid-cols-[1fr_auto_auto] sm:grid-cols-[auto_1fr_auto_auto] items-center gap-2.5 md:gap-3 hover:bg-soft/60 [&::-webkit-details-marker]:hidden">
                    <span
                      className={`hidden sm:grid w-10 h-10 rounded-xl place-items-center shrink-0 ${o.status === "NEW" ? "bg-accent text-white" : "bg-soft text-steel"}`}
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
                    <DeleteOrder id={o.id} number={o.number} compact />
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
                                <td className="text-end font-bold">
                                  {x.unitPrice == null ? "—" : money(Number(x.unitPrice) * x.quantity)}
                                </td>
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
                      <span className="ms-auto flex flex-wrap gap-2">
                        <OrderActions id={o.id} number={o.number} archived={!!o.archivedAt} />
                      </span>
                    </div>
                  </div>
                </details>
              </div>
            );
          })}
        </div>
      )}
      <APager page={page} pages={pages} href={(n) => href({ page: String(n) })} />
    </div>
  );
}
