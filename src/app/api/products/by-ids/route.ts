import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { priceOf } from "@/lib/format";
import { getWholesale } from "@/lib/wholesale";
// تُستخدم من السلة: ?ids=1,2,3 — السعر هنا يتبع حالة الجملة من الكوكي
export async function GET(req: Request) {
  const ids = (new URL(req.url).searchParams.get("ids") ?? "").split(",").map(Number).filter(Boolean), ws = !!(await getWholesale());
  const rows = await db.product.findMany({ where: { id: { in: ids }, isActive: true }, include: { images: { orderBy: { sortOrder: "asc" }, take: 1 } } });
  return NextResponse.json(rows.map((r) => ({ id: r.id, nameAr: r.nameAr, nameEn: r.nameEn, allowCart: r.allowCart, image: r.images[0]?.url ?? null, price: priceOf(r, ws) })));
}
