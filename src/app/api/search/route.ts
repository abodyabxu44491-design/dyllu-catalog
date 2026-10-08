// Copyright (c) 2026 Abdullah Al-Sakni. All rights reserved. DYLLU Catalog.
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { priceOf } from "@/lib/format";
import { searchWhere } from "@/lib/catalog";
import { getWholesale } from "@/lib/wholesale";
import { ipOf, limited } from "@/lib/ratelimit";
import { withOffers } from "@/lib/offers";
export async function GET(req: Request) {
  if (limited(`search:${ipOf(req)}`, 90, 60_000)) return NextResponse.json([], { status: 429 });
  const q = (new URL(req.url).searchParams.get("q") ?? "").slice(0, 60);
  if (q.trim().length < 2) return NextResponse.json([]);
  const ws = !!(await getWholesale());
  const rows = await withOffers(
    await db.product.findMany({
      where: { isActive: true, ...searchWhere(q) },
      include: { images: { orderBy: { sortOrder: "asc" }, take: 1 } },
      orderBy: [{ isFeatured: "desc" }, { sortOrder: "asc" }],
      take: 6,
    }),
  );
  return NextResponse.json(
    rows.map((r) => ({
      slug: r.slug,
      nameAr: r.nameAr,
      nameEn: r.nameEn,
      sku: r.sku,
      image: r.images[0]?.url ?? null,
      price: priceOf(r, ws),
    })),
  );
}
