import { db } from "@/lib/db";
import CodesManager from "@/components/admin/CodesManager";
export const dynamic = "force-dynamic";
export default async function Codes() {
  const cs = await db.wholesaleCode.findMany({ orderBy: { id: "desc" }, include: { _count: { select: { orders: true } } } });
  return <CodesManager initial={cs.map((c) => ({ id: c.id, code: c.code, name: c.name, isActive: c.isActive, orders: c._count.orders }))} />;
}
