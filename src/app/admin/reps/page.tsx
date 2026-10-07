import { db } from "@/lib/db";
import RepsManager from "@/components/admin/RepsManager";
export const dynamic = "force-dynamic";
export default async function Reps() {
  const rs = await db.rep.findMany({ orderBy: [{ sortOrder: "asc" }, { id: "asc" }], include: { _count: { select: { orders: true } }, account: { select: { isActive: true, lastLoginAt: true } } } });
  return <RepsManager initial={rs.map(({ _count, account, ...r }) => ({ ...r, orders: _count.orders, account: account && { isActive: account.isActive, lastLoginAt: account.lastLoginAt?.toISOString() ?? null } }))} />;
}
