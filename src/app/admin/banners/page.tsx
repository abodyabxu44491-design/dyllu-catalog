import { db } from "@/lib/db";
import BannersManager from "@/components/admin/BannersManager";
export const dynamic = "force-dynamic";
export default async function Banners() {
  const [bs, cats] = await Promise.all([db.banner.findMany({ orderBy: [{ sortOrder: "asc" }, { id: "asc" }] }), db.category.findMany({ orderBy: { sortOrder: "asc" }, select: { slug: true, nameAr: true } })]);
  return <BannersManager cats={cats} initial={bs.map((b) => ({ ...b, startsAt: b.startsAt?.toISOString() ?? null, endsAt: b.endsAt?.toISOString() ?? null, createdAt: undefined }))} />;
}
