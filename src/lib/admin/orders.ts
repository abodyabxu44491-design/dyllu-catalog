import type { OrderStatus, Prisma } from "@prisma/client";
import { STATUS_AR } from "./labels";
export type OrderFilters = { status?: string; q?: string; t?: string; from?: string; to?: string };
// فلاتر الطلبات المشتركة بين صفحة الطلبات وتصدير CSV (حتى يطابق الملف ما يظهر في الصفحة)
export function orderWhere({ status, q, t, from, to }: OrderFilters, withStatus = true): Prisma.OrderWhereInput {
  const d = (v?: string, end = false) => { if (!v || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return undefined; const x = new Date(`${v}T00:00:00`); if (end) x.setDate(x.getDate() + 1); return x; };
  const gte = d(from), lt = d(to, true);
  return { ...(withStatus && status && status in STATUS_AR && { status: status as OrderStatus }), ...(t === "ws" && { isWholesale: true }), ...(t === "retail" && { isWholesale: false }),
    ...((gte || lt) && { createdAt: { ...(gte && { gte }), ...(lt && { lt }) } }),
    ...(q && { OR: [{ number: { contains: q, mode: "insensitive" } }, { customer: { name: { contains: q, mode: "insensitive" } } }, { customer: { phone: { contains: q } } }, { customer: { company: { contains: q, mode: "insensitive" } } }, { source: { contains: q, mode: "insensitive" } }] }) };
}
