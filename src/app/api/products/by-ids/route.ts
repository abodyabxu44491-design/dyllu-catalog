// Copyright (c) 2026 Abdullah Al-Sakni. All rights reserved. DYLLU Catalog.
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { oldPriceOf, priceOf } from "@/lib/format";
import { getWholesale } from "@/lib/wholesale";
import { withOffers } from "@/lib/offers";
export async function GET(req: Request) {
  const ids = (new URL(req.url).searchParams.get("ids") ?? "").split(",").map(Number).filter(Boolean),
    ws = !!(await getWholesale());
  const rows = await withOffers(
    await db.product.findMany({
      where: { id: { in: ids }, isActive: true },
      include: { images: { orderBy: { sortOrder: "asc" }, take: 1 } },
    }),
  );
  return NextResponse.json(
    rows.map((r) => ({
      id: r.id,
      slug: r.slug,
      sku: r.sku,
      inStock: r.inStock,
      nameAr: r.nameAr,
      nameEn: r.nameEn,
      allowCart: r.allowCart,
      image: r.images[0]?.url ?? null,
      price: priceOf(r, ws),
      oldPrice: oldPriceOf(r, ws),
    })),
  );
}
