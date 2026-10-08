// Copyright (c) 2026 Abdullah Al-Sakni. All rights reserved. DYLLU Catalog.
import Link from "next/link";
import { db } from "@/lib/db";
import { STATUS_AR, STATUS_CLS, fmtDate, money } from "@/lib/admin/labels";
import { Badge, Card, Stat } from "@/components/admin/ui";
import Icon, { type IconName } from "@/components/Icon";
export const dynamic = "force-dynamic";
const DAYS = 14;
export default async function Dash() {
  const now = new Date(),
    day = new Date(now.getFullYear(), now.getMonth(), now.getDate()),
    month = new Date(now.getFullYear(), now.getMonth(), 1),
    d30 = new Date(Date.now() - 30 * 864e5),
    from = new Date(day.getTime() - (DAYS - 1) * 864e5);
  const live = { status: { not: "CANCELLED" as const } };
  const [pAll, pOn, cats, oDay, oMonth, oNew, wsMonth, sales, codes, reps, noWs, outStock, byStatus, bySrc, top, latest, recent] =
    await Promise.all([
      db.product.count(),
      db.product.count({ where: { isActive: true } }),
      db.category.count(),
      db.order.count({ where: { createdAt: { gte: day } } }),
      db.order.count({ where: { createdAt: { gte: month } } }),
      db.order.count({ where: { status: "NEW" } }),
      db.order.count({ where: { createdAt: { gte: month }, isWholesale: true } }),
      db.order.aggregate({ _sum: { total: true }, where: { createdAt: { gte: month }, ...live } }),
      db.wholesaleCode.count({ where: { isActive: true } }),
      db.rep.count({ where: { isActive: true } }),
      db.product.count({ where: { isActive: true, wholesalePrice: null } }),
      db.product.count({ where: { isActive: true, inStock: false } }),
      db.order.groupBy({ by: ["status"], _count: true }),
      db.order.groupBy({
        by: ["storeId"],
        _count: true,
        where: { storeId: { not: null } },
        orderBy: { _count: { storeId: "desc" } },
        take: 6,
      }),
      db.orderItem.groupBy({
        by: ["productId"],
        _sum: { quantity: true },
        where: { order: { createdAt: { gte: d30 }, ...live } },
        orderBy: { _sum: { quantity: "desc" } },
        take: 5,
      }),
      db.order.findMany({ include: { customer: true, rep: true }, orderBy: { id: "desc" }, take: 6 }),
      db.order.findMany({ where: { createdAt: { gte: from } }, select: { createdAt: true } }),
    ]);
  const names = new Map(
    (await db.product.findMany({ where: { id: { in: top.map((t) => t.productId) } }, select: { id: true, nameAr: true } })).map((p) => [
      p.id,
      p.nameAr,
    ]),
  );
  const storeNames = new Map(
    (await db.store.findMany({ where: { id: { in: bySrc.map((x) => x.storeId!) } }, select: { id: true, name: true } })).map((x) => [
      x.id,
      x.name,
    ]),
  );
  const maxTop = Math.max(1, ...top.map((t) => t._sum.quantity ?? 0)),
    stat = (s: string) => byStatus.find((x) => x.status === s)?._count ?? 0;
  const series = Array.from({ length: DAYS }, (_, i) => {
    const d = new Date(from.getTime() + i * 864e5);
    return { d, n: recent.filter((o) => o.createdAt >= d && o.createdAt < new Date(d.getTime() + 864e5)).length };
  });
  const maxDay = Math.max(1, ...series.map((x) => x.n)),
    sum14 = series.reduce((a, b) => a + b.n, 0),
    ticks = [maxDay, Math.round(maxDay / 2), 0].filter((v, i, a) => a.indexOf(v) === i);
  const hour = now.getHours(),
    hello = hour < 12 ? "صباح الخير" : "مساء الخير";
  const quick: [string, string, IconName, string][] = [
    ["/admin/products/new", "منتج جديد", "box", "btn-lime"],
    ["/admin/banners", "إعلان", "megaphone", "btn-ghost"],
    ["/admin/codes", "كود جملة", "key", "btn-ghost"],
    ["/admin/qr", "رمز QR", "qr", "btn-ghost"],
    ["/catalog", "قائمة الأسعار PDF", "doc", "btn-ghost"],
  ];
  const alerts: [boolean, string, string][] = [
    [oNew > 0, `${oNew} طلب جديد بانتظار المتابعة`, "/admin/orders?status=NEW"],
    [outStock > 0, `${outStock} منتج ظاهر لكنه غير متوفر`, "/admin/products?st=out"],
    [noWs > 0 && codes > 0, `${noWs} منتج بلا سعر جملة (عملاء الجملة يرون السعر العادي)`, "/admin/products?st=nows"],
    [pAll === 0, "لم تضف أي منتج بعد", "/admin/products/new"],
  ];
  return (
    <div className="space-y-5 md:space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-steel">
            {now.toLocaleDateString("ar-SA", { timeZone: "Asia/Riyadh", weekday: "long", day: "numeric", month: "long" })}
          </p>
          <h1 className="text-2xl md:text-3xl mt-1">{hello}</h1>
        </div>
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 w-full sm:w-auto">
          {quick.map(([h, l, i, c]) => (
            <Link key={h} href={h} className={`btn btn-md ${c}`}>
              <Icon n={i} s={18} />
              {l}
            </Link>
          ))}
        </div>
      </div>

      {alerts.some(([on]) => on) && (
        <div className="grid gap-2">
          {alerts
            .filter(([on]) => on)
            .map(([, t, h]) => (
              <Link
                key={h}
                href={h}
                className="flex items-center gap-3 rounded-2xl bg-accent/10 border border-accent/20 px-4 py-3 text-sm font-bold text-ink hover:bg-accent/15"
              >
                <Icon n="alert" s={18} className="text-accent" />
                <span className="flex-1">{t}</span>
                <Icon n="chev" s={16} className="rtl:rotate-180 text-steel" />
              </Link>
            ))}
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat label="طلبات جديدة" value={oNew} sub="تحتاج متابعة" icon="bolt" tone="accent" href="/admin/orders?status=NEW" />
        <Stat label="طلبات اليوم" value={oDay} icon="orders" href="/admin/orders" />
        <Stat label="طلبات الشهر" value={oMonth} sub={`منها جملة: ${wsMonth}`} icon="chart" tone="ink" href="/admin/orders" />
        <Stat label="مبيعات الشهر" value={money(sales._sum.total)} sub="ريال · بدون الملغي" icon="tag" tone="soft" />
      </div>

      <div className="grid lg:grid-cols-3 gap-4 md:gap-5">
        <Card title="الطلبات اليومية" desc={`آخر ${DAYS} يومًا · المجموع ${sum14} طلب`} className="lg:col-span-2">
          <div
            className="flex gap-2 h-48"
            role="img"
            aria-label={`الطلبات اليومية: ${series.map((x) => `${x.d.getDate()}/${x.d.getMonth() + 1}: ${x.n}`).join("، ")}`}
          >
            <div className="flex flex-col justify-between text-[10px] text-steel pb-5 w-5 text-end">
              {ticks.map((v) => (
                <span key={v}>{v}</span>
              ))}
            </div>
            <div className="relative flex-1">
              <div className="absolute inset-x-0 top-0 bottom-5 flex flex-col justify-between pointer-events-none">
                {ticks.map((v) => (
                  <i key={v} className="block border-t border-dashed border-line" />
                ))}
              </div>
              <div className="absolute inset-0 flex items-end gap-[2px] sm:gap-1">
                {series.map((x, i) => {
                  const today = i === DAYS - 1;
                  return (
                    <div key={i} className="group relative flex-1 h-full flex flex-col justify-end items-center">
                      <div className="w-full flex-1 flex items-end pb-5">
                        <div
                          className={`w-full max-w-7 mx-auto rounded-t ${today ? "bg-accent" : "bg-steel group-hover:bg-ink"} transition-colors`}
                          style={{ height: x.n ? `${Math.max(4, (x.n / maxDay) * 100)}%` : "2px", opacity: x.n ? 1 : 0.35 }}
                        />
                      </div>
                      <span
                        className={`absolute bottom-0 text-[10px] ${today ? "text-ink font-bold" : "text-steel"} ${i % 2 && !today ? "hidden sm:block" : ""}`}
                      >
                        {x.d.getDate()}
                      </span>
                      <span
                        className={`pointer-events-none absolute bottom-full mb-1 hidden group-hover:block ${i < 3 ? "start-0" : i > DAYS - 4 ? "end-0" : "left-1/2 -translate-x-1/2"} bg-ink text-white text-xs font-bold rounded-lg px-2 py-1 whitespace-nowrap z-10`}
                      >
                        {x.d.toLocaleDateString("ar-SA", { timeZone: "Asia/Riyadh", day: "numeric", month: "short" })} · {x.n} طلب
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </Card>
        <Card title="حالة الطلبات">
          <div className="grid grid-cols-2 gap-2">
            {Object.keys(STATUS_AR).map((s) => (
              <Link
                key={s}
                href={`/admin/orders?status=${s}`}
                className="flex items-center justify-between gap-2 rounded-xl border border-line px-3 py-2.5 hover:bg-soft"
              >
                <Badge cls={STATUS_CLS[s]}>{STATUS_AR[s]}</Badge>
                <b className="font-display">{stat(s)}</b>
              </Link>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-4 md:gap-5">
        <Card title="الأكثر طلبًا" desc="آخر 30 يومًا · بالكمية">
          {top.length === 0 ? (
            <p className="text-steel text-sm py-6 text-center">لا توجد بيانات بعد.</p>
          ) : (
            <div className="space-y-3">
              {top.map((t) => (
                <div key={t.productId} className="group" title={`${names.get(t.productId)}: ${t._sum.quantity}`}>
                  <div className="flex justify-between gap-2 text-sm mb-1">
                    <span className="truncate">{names.get(t.productId)}</span>
                    <b>{t._sum.quantity}</b>
                  </div>
                  <div className="h-2 bg-soft rounded-full">
                    <div
                      className="h-2 bg-steel group-hover:bg-ink rounded-full transition-colors"
                      style={{ width: `${((t._sum.quantity ?? 0) / maxTop) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
        <Card
          title="الطلبات حسب المحل"
          desc="من رموز QR"
          action={
            <a href="/admin/qr" className="text-sm font-bold text-steel hover:text-ink">
              المحلات
            </a>
          }
        >
          {bySrc.length === 0 ? (
            <p className="text-steel text-sm py-6 text-center">أضف محلاتك من صفحة رموز QR لتعرف من أين يأتي كل عميل.</p>
          ) : (
            <div className="divide-y divide-line text-sm">
              {bySrc.map((x) => (
                <a key={x.storeId} href={`/admin/orders?store=${x.storeId}`} className="flex justify-between py-2 hover:text-accent">
                  <span>{storeNames.get(x.storeId!) ?? "—"}</span>
                  <b>{x._count}</b>
                </a>
              ))}
            </div>
          )}
        </Card>
        <Card title="نظرة على الكتالوج">
          <div className="grid grid-cols-2 gap-2 text-sm">
            {(
              [
                ["المنتجات", pAll, `${pOn} ظاهر`, "/admin/products"],
                ["التصنيفات", cats, "", "/admin/categories"],
                ["أكواد الجملة", codes, "فعّال", "/admin/codes"],
                ["المناديب", reps, "فعّال", "/admin/reps"],
              ] as const
            ).map(([l, n, sub, h]) => (
              <Link key={l} href={h} className="rounded-xl bg-soft p-3 hover:bg-line">
                <small className="block text-xs text-steel font-bold">{l}</small>
                <b className="font-display text-xl">{n}</b>
                {sub && <small className="text-xs text-steel ms-1">{sub}</small>}
              </Link>
            ))}
          </div>
        </Card>
      </div>

      <Card
        title="آخر الطلبات"
        action={
          <Link href="/admin/orders" className="text-sm font-bold text-steel hover:text-ink inline-flex items-center gap-1">
            عرض الكل
            <Icon n="chev" s={16} className="rtl:rotate-180" />
          </Link>
        }
        pad={false}
      >
        {latest.length === 0 ? (
          <p className="text-steel text-sm p-8 text-center">لا توجد طلبات بعد.</p>
        ) : (
          <div className="divide-y divide-line">
            {latest.map((o) => (
              <Link key={o.id} href={`/admin/orders?q=${o.number}`} className="flex items-center gap-3 px-4 md:px-5 py-3 hover:bg-soft">
                <span className="w-10 h-10 rounded-xl bg-soft grid place-items-center shrink-0">
                  <Icon n="orders" s={18} className="text-steel" />
                </span>
                <span className="flex-1 min-w-0">
                  <b className="block text-sm">
                    {o.number} <span className="font-normal text-steel">· {o.customer.name}</span>
                  </b>
                  <small className="text-xs text-steel">
                    {fmtDate(o.createdAt)}
                    {o.rep ? ` · ${o.rep.name}` : ""}
                  </small>
                </span>
                <span className="text-end shrink-0">
                  <b className="block text-sm">
                    {money(o.total)}
                    {o.hasUnpriced ? "+" : ""} <small className="font-normal text-steel">ر.س</small>
                  </b>
                  <span className="inline-flex gap-1">
                    {o.isWholesale && <Badge cls="bg-ink text-lime">جملة</Badge>}
                    <Badge cls={STATUS_CLS[o.status]}>{STATUS_AR[o.status]}</Badge>
                  </span>
                </span>
              </Link>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
