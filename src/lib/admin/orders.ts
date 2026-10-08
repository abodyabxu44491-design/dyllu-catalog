// Copyright (c) 2026 Abdullah Al-Sakni. All rights reserved. DYLLU Catalog.
import type { OrderStatus, Prisma } from "@prisma/client";
import { STATUS_AR } from "./labels";
export type OrderFilters = { status?: string; q?: string; t?: string; from?: string; to?: string; store?: string };
export function orderWhere({ status, q, t, from, to, store }: OrderFilters, withStatus = true): Prisma.OrderWhereInput {
  const d = (v?: string, end = false) => {
    if (!v || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return undefined;
    const x = new Date(`${v}T00:00:00`);
    if (end) x.setDate(x.getDate() + 1);
    return x;
  };
  const gte = d(from),
    lt = d(to, true);
  return {
    ...(withStatus && status && status in STATUS_AR && { status: status as OrderStatus }),
    ...(t === "ws" && { isWholesale: true }),
    ...(t === "retail" && { isWholesale: false }),
    ...(store && /^\d+$/.test(store) && { storeId: Number(store) }),
    ...(store === "none" && { storeId: null }),
    ...((gte || lt) && { createdAt: { ...(gte && { gte }), ...(lt && { lt }) } }),
    ...(q && {
      OR: [
        { number: { contains: q, mode: "insensitive" } },
        { customer: { name: { contains: q, mode: "insensitive" } } },
        { customer: { phone: { contains: q } } },
        { customer: { company: { contains: q, mode: "insensitive" } } },
        { source: { contains: q, mode: "insensitive" } },
        { store: { name: { contains: q, mode: "insensitive" } } },
      ],
    }),
  };
}
