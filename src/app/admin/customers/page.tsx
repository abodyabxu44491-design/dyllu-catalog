// Copyright (c) 2026 Abdullah Al-Sakni. All rights reserved. DYLLU Catalog.
import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { pageParam } from "@/lib/format";
import { prettyPhone, telHref, waHref } from "@/lib/phone";
import { fmtDate, money } from "@/lib/admin/labels";
import { AEmpty, APager, Badge, PageHead } from "@/components/admin/ui";
import Icon from "@/components/Icon";
export const dynamic = "force-dynamic";
const PER = 30;
type AggSort = { _max?: { createdAt: "desc" }; _count?: { id: "desc" }; _sum?: { total: "desc" } };
const SORTS: [string, string, AggSort][] = [
  ["", "آخر طلب", { _max: { createdAt: "desc" } }],
  ["orders", "الأكثر طلبات", { _count: { id: "desc" } }],
  ["total", "الأعلى قيمة", { _sum: { total: "desc" } }],
];
export default async function Customers({ searchParams }: { searchParams: { q?: string; sort?: string; page?: string } }) {
  const { q } = searchParams,
    page = pageParam(searchParams.page),
    sort = SORTS.find(([k]) => k === (searchParams.sort ?? "")) ?? SORTS[0];
  const cw: Prisma.CustomerWhereInput = q
    ? {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { phone: { contains: q } },
          { company: { contains: q, mode: "insensitive" } },
          { city: { contains: q, mode: "insensitive" } },
        ],
      }
    : {};
  const [total, stats, all] = await Promise.all([
    db.customer.count({ where: { ...cw, orders: { some: { status: { not: "CANCELLED" } } } } }),
    db.order.groupBy({
      by: ["customerId"],
      where: { customer: cw, status: { not: "CANCELLED" } },
      _count: { id: true },
      _sum: { total: true },
      _max: { createdAt: true },
      orderBy: sort[2],
      skip: (page - 1) * PER,
      take: PER,
    }),
    db.order.aggregate({ where: { status: { not: "CANCELLED" } }, _count: { customerId: true } }),
  ]);
  const customers = new Map(
    (
      await db.customer.findMany({
        where: { id: { in: stats.map((x) => x.customerId) } },
        include: { orders: { orderBy: { id: "desc" }, take: 5, select: { isWholesale: true, store: { select: { name: true } } } } },
      })
    ).map((c) => [c.id, c]),
  );
  const pages = Math.max(1, Math.ceil(total / PER)),
    href = (o: Record<string, string | undefined>) =>
      "/admin/customers?" +
      new URLSearchParams(Object.entries({ q, sort: searchParams.sort, ...o }).filter(([, v]) => v) as [string, string][]).toString();
  const rows = stats.map((x) => ({ ...x, c: customers.get(x.customerId)! })).filter((r) => r.c);
  return (
    <div>
      <PageHead
        title="العملاء"
        desc={`كل رقم جوال يُحسب عميلًا واحدًا مهما اختلفت صيغته. ${total} عميل · ${all._count.customerId} طلب (بدون الملغي).`}
      />
      <form className="card p-3 flex flex-col sm:flex-row gap-2 mb-3">
        <div className="relative sm:flex-1">
          <Icon n="search" s={18} className="absolute start-3.5 top-1/2 -translate-y-1/2 text-steel" />
          <input name="q" defaultValue={q} placeholder="الاسم، الجوال، الشركة، المدينة" className="field ps-10 h-11" />
        </div>
        {searchParams.sort && <input type="hidden" name="sort" value={searchParams.sort} />}
        <button className="btn btn-md btn-dark">بحث</button>
        {q && (
          <Link href={href({ q: undefined, page: undefined })} className="btn btn-md btn-ghost">
            مسح
          </Link>
        )}
      </form>
      <div className="flex gap-2 overflow-x-auto no-scrollbar mb-4">
        {SORTS.map(([k, l]) => (
          <Link
            key={k}
            href={href({ sort: k || undefined, page: undefined })}
            className={`chip h-9 ${sort[0] === k ? "chip-on" : "chip-off"}`}
          >
            {l}
          </Link>
        ))}
      </div>
      {rows.length === 0 ? (
        <div className="card">
          <AEmpty icon="users" title={q ? "لا يوجد عملاء مطابقون" : "لا يوجد عملاء بعد. يظهر العميل هنا بعد أول طلب."} />
        </div>
      ) : (
        <div className="card overflow-hidden divide-y divide-line">
          {rows.map(({ c, _count, _sum, _max }) => (
            <div key={c.id} className="p-3 md:p-4 flex flex-wrap items-center gap-3">
              <span className="w-11 h-11 rounded-full bg-ink text-lime grid place-items-center font-extrabold shrink-0">
                {c.name !== "بدون اسم" ? c.name[0] : <Icon n="user" s={20} />}
              </span>
              <div className="flex-1 min-w-[180px]">
                <b className="flex items-center gap-2 flex-wrap text-sm">
                  {c.name}
                  {c.company && <span className="font-normal text-steel">· {c.company}</span>}
                  {c.orders.some((o) => o.isWholesale) && <Badge cls="bg-ink text-lime">جملة</Badge>}
                  {c.orders.find((o) => o.store)?.store && (
                    <Badge cls="bg-lime/30 text-ink">من {c.orders.find((o) => o.store)!.store!.name}</Badge>
                  )}
                </b>
                <small className="block text-xs text-steel mt-0.5">
                  <span dir="ltr">{prettyPhone(c.phone)}</span>
                  {c.city ? ` · ${c.city}` : ""}
                  {_max.createdAt ? ` · آخر طلب ${fmtDate(_max.createdAt)}` : ""}
                </small>
              </div>
              <div className="flex gap-4 text-center text-sm">
                <div>
                  <b className="block font-display">{_count.id}</b>
                  <small className="text-xs text-steel">طلب</small>
                </div>
                <div>
                  <b className="block font-display">{money(_sum.total)}</b>
                  <small className="text-xs text-steel">ريال</small>
                </div>
              </div>
              <div className="flex gap-1 w-full sm:w-auto justify-end">
                <a
                  href={waHref(c.phone, `السلام عليكم${c.name !== "بدون اسم" ? ` ${c.name}` : ""}، معك DYLLU`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="واتساب"
                  className="btn-icon w-10 h-10 text-[#1FA855] hover:bg-soft"
                >
                  <Icon n="whatsapp" s={20} />
                </a>
                <a href={telHref(c.phone)} aria-label="اتصال" className="btn-icon w-10 h-10 text-steel hover:bg-soft">
                  <Icon n="phone" s={19} />
                </a>
                <Link href={`/admin/orders?q=${encodeURIComponent(c.phone)}`} className="btn btn-sm btn-ghost h-10">
                  <Icon n="orders" s={16} />
                  الطلبات
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
      <APager page={page} pages={pages} href={(n) => href({ page: String(n) })} />
    </div>
  );
}
