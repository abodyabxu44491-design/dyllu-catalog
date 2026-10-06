import { db } from "@/lib/db";
import RepsManager from "@/components/admin/RepsManager";
export const dynamic = "force-dynamic";
export default async function Reps() {
  const rs = await db.rep.findMany({ orderBy: [{ sortOrder: "asc" }, { id: "asc" }], include: { _count: { select: { orders: true } } } });
  return <RepsManager initial={rs.map(({ _count, ...r }) => ({ ...r, orders: _count.orders }))} />;
}
