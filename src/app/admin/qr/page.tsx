// Copyright (c) 2026 Abdullah Al-Sakni. All rights reserved. DYLLU Catalog.
import { db } from "@/lib/db";
import StoresManager from "@/components/admin/StoresManager";
import { siteUrl } from "@/lib/siteUrl";
export const dynamic = "force-dynamic";
export default async function QR() {
  const base = siteUrl();
  const [stores, unassigned] = await Promise.all([
    db.store.findMany({ orderBy: [{ isActive: "desc" }, { createdAt: "desc" }], include: { _count: { select: { orders: true } } } }),
    db.order.count({ where: { storeId: null } }),
  ]);
  return (
    <StoresManager
      base={base}
      unassigned={unassigned}
      stores={stores.map(({ _count, createdAt: _c, ...s }) => ({ ...s, orders: _count.orders }))}
    />
  );
}
