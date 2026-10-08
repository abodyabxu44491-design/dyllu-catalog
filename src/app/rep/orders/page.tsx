// Copyright (c) 2026 Abdullah Al-Sakni. All rights reserved. DYLLU Catalog.
import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { currentRep } from "@/lib/repAuth";
import { pageParam } from "@/lib/format";
import { prettyPhone, telHref, waHref } from "@/lib/phone";
import { STATUS_AR, fmtDate, money } from "@/lib/admin/labels";
import StatusSelect from "@/components/admin/StatusSelect";
import { AEmpty, APager, Badge, PageHead } from "@/components/admin/ui";
import Linkify from "@/components/Linkify";
import Icon from "@/components/Icon";
export const dynamic = "force-dynamic";
const PER = 20;
export default async function RepOrders({ searchParams }: { searchParams: { st?: string; q?: string; page?: string } }) {
  const rep = (await currentRep())!,
    page = pageParam(searchParams.page),
    q = searchParams.q?.trim().slice(0, 60),
    st = searchParams.st && searchParams.st in STATUS_AR ? searchParams.st : undefined;
  const base: Prisma.OrderWhereInput = {
    repId: rep.id,
    ...(q && {
      OR: [
        { number: { contains: q, mode: "insensitive" } },
        { customer: { name: { contains: q, mode: "insensitive" } } },
        { customer: { phone: { contains: q } } },
        { customer: { company: { contains: q, mode: "insensitive" } } },
      ],
    }),
  };
  const where = { ...base, ...(st && { status: st as Prisma.EnumOrderStatusFilter["equals"] }) };
  const [total, os, counts] = await Promise.all([
    db.order.count({ where }),
    db.order.findMany({
      where,
      include: { customer: true, items: { orderBy: { id: "asc" } }, store: { select: { name: true } } },
      orderBy: { id: "desc" },
      skip: (page - 1) * PER,
      take: PER,
    }),
    db.order.groupBy({ by: ["status"], where: base, _count: true }),
  ]);
  const pages = Math.max(1, Math.ceil(total / PER)),
    all = counts.reduce((n, c) => n + c._count, 0);
  const href = (o: Record<string, string | undefined>) =>
    "/rep/orders?" + new URLSearchParams(Object.entries({ st, q, ...o }).filter(([, v]) => v) as [string, string][]).toString();
  return (
    <div>
      <PageHead title="طلباتي" desc="الطلبات التي اختارك فيها العملاء. حدّث الحالة بعد التواصل مع العميل." />
      <div className="-mx-4 px-4 sm:mx-0 sm:px-0 flex gap-2 overflow-x-auto no-scrollbar mb-3">
        <Link href={href({ st: undefined, page: undefined })} className={`chip h-9 ${!st ? "chip-on" : "chip-off"}`}>
          الكل<small className={`rounded-md px-1.5 text-[11px] ${!st ? "bg-white/20" : "bg-soft"}`}>{all}</small>
        </Link>
        {Object.entries(STATUS_AR).map(([k, l]) => (
          <Link key={k} href={href({ st: k, page: undefined })} className={`chip h-9 ${st === k ? "chip-on" : "chip-off"}`}>
            {l}
            <small
              className={`rounded-md px-1.5 text-[11px] ${st === k ? "bg-white/20" : k === "NEW" ? "bg-accent text-white" : "bg-soft"}`}
            >
              {counts.find((c) => c.status === k)?._count ?? 0}
            </small>
          </Link>
        ))}
      </div>
      <form className="card p-3 flex gap-2 mb-4">
        {st && <input type="hidden" name="st" value={st} />}
        <div className="relative flex-1">
          <Icon n="search" s={18} className="absolute start-3.5 top-1/2 -translate-y-1/2 text-steel" />
          <input name="q" defaultValue={q} aria-label="بحث" placeholder="رقم الطلب، اسم العميل، الجوال" className="field ps-10 h-11" />
        </div>
        <button className="btn btn-md btn-dark">بحث</button>
        {q && (
          <Link href={href({ q: undefined, page: undefined })} className="btn btn-md btn-ghost">
            مسح
          </Link>
        )}
      </form>
      {os.length === 0 ? (
        <div className="card">
          <AEmpty icon="orders" title={q || st ? "لا توجد طلبات مطابقة" : "لا توجد طلبات بعد"} />
        </div>
      ) : (
        <div className="space-y-3">
          {os.map((o) => {
            const pcs = o.items.reduce((n, i) => n + i.quantity, 0),
              c = o.customer;
            return (
              <article key={o.id} className="card p-4 space-y-3">
                <div className="flex flex-wrap items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <b dir="ltr" className="font-display">
                      {o.number}
                    </b>
                    {o.isWholesale && <Badge cls="bg-ink text-lime ms-2">جملة</Badge>}
                    {o.store && <Badge cls="bg-soft text-steel ms-1">من {o.store.name}</Badge>}
                    <small className="block text-xs text-steel mt-0.5">
                      {fmtDate(o.createdAt)} · {pcs} قطعة
                    </small>
                  </div>
                  <StatusSelect id={o.id} status={o.status} api="/api/rep/orders" />
                </div>
                <div className="rounded-2xl bg-soft p-3 flex flex-wrap items-center gap-3">
                  <span className="w-10 h-10 rounded-full bg-white grid place-items-center font-extrabold shrink-0">{c.name[0]}</span>
                  <span className="min-w-0 flex-1">
                    <b className="block text-sm">
                      {c.name}
                      {c.company && <span className="text-steel font-normal"> · {c.company}</span>}
                    </b>
                    <small className="text-xs text-steel">
                      <span dir="ltr">{prettyPhone(c.phone)}</span>
                      {c.city && ` · ${c.city}`}
                    </small>
                  </span>
                  <a
                    href={waHref(c.phone, `السلام عليكم ${c.name}، بخصوص طلبك ${o.number} من DYLLU`)}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`واتساب ${c.name}`}
                    className="btn-icon w-10 h-10 bg-[#1FA855] text-white"
                  >
                    <Icon n="whatsapp" s={20} />
                  </a>
                  <a href={telHref(c.phone)} aria-label={`اتصال ${c.name}`} className="btn-icon w-10 h-10 bg-white text-ink">
                    <Icon n="phone" s={18} />
                  </a>
                </div>
                <ul className="text-sm divide-y divide-line">
                  {o.items.map((i) => (
                    <li key={i.id} className="flex justify-between gap-3 py-1.5">
                      <span className="min-w-0">
                        {i.nameSnapshot}
                        {i.skuSnapshot && (
                          <small className="text-steel" dir="ltr">
                            {" "}
                            · {i.skuSnapshot}
                          </small>
                        )}
                      </span>
                      <b className="shrink-0">× {i.quantity}</b>
                    </li>
                  ))}
                </ul>
                {o.notes && (
                  <p className="text-sm leading-6 rounded-xl border border-line p-3">
                    <b>ملاحظات:</b> <Linkify text={o.notes} wa={false} />
                  </p>
                )}
                <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-line">
                  <span className="text-sm">
                    الإجمالي: <b className="font-display text-lg">{o.total == null ? "—" : `${money(o.total)} ر.س`}</b>
                    {o.hasUnpriced && <small className="text-steel"> + منتجات بسعر عند التواصل</small>}
                  </span>
                  <a href={`/order/${o.token}`} target="_blank" className="btn btn-sm btn-ghost ms-auto">
                    <Icon n="doc" s={16} />
                    الفاتورة
                  </a>
                </div>
              </article>
            );
          })}
          <APager page={page} pages={pages} href={(n) => href({ page: String(n) })} />
        </div>
      )}
    </div>
  );
}
