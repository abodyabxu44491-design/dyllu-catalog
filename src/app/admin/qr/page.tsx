import { db } from "@/lib/db";
import StoresManager from "@/components/admin/StoresManager";
export const dynamic = "force-dynamic";
// رموز QR: الرمز العام + رمز محفوظ لكل محل (?src=code) مع عدد المسح والطلبات
export default async function QR() {
  const base = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
  const [stores, unassigned] = await Promise.all([db.store.findMany({ orderBy: [{ isActive: "desc" }, { createdAt: "desc" }], include: { _count: { select: { orders: true } } } }), db.order.count({ where: { storeId: null } })]);
  return <StoresManager base={base} unassigned={unassigned} stores={stores.map(({ _count, createdAt: _c, ...s }) => ({ ...s, orders: _count.orders }))} />;
}
