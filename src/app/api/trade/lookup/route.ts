// Copyright (c) 2026 Abdullah Al-Sakni. All rights reserved. DYLLU Catalog.
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { barcodeVariants, normalizeBarcode } from "@/lib/barcode";
import { limited } from "@/lib/ratelimit";
import { currentTrade } from "@/lib/tradeAuth";
export const dynamic = "force-dynamic";
const H = { "Cache-Control": "no-store, private" };
// Wholesale prices leave the server only through here, and only for an active, approved shop
export async function GET(req: Request) {
  const shop = await currentTrade();
  if (!shop) return NextResponse.json({ error: "unauthorized" }, { status: 401, headers: H });
  if (limited(`trade-lookup:${shop.id}`, 150, 10 * 60_000))
    return NextResponse.json({ error: "طلبات كثيرة، انتظر قليلًا" }, { status: 429, headers: H });
  const raw = new URL(req.url).searchParams.get("b") ?? "",
    code = normalizeBarcode(raw);
  if (!code) return NextResponse.json({ error: "اكتب رقم الباركود" }, { status: 400, headers: H });
  const p = await db.product.findFirst({
    where: {
      isActive: true,
      OR: [{ barcode: { in: barcodeVariants(code) } }, { sku: { equals: raw.trim(), mode: "insensitive" } }],
    },
    include: {
      images: { orderBy: { sortOrder: "asc" }, select: { url: true } },
      specs: { orderBy: { sortOrder: "asc" }, select: { nameAr: true, value: true } },
      features: { orderBy: { sortOrder: "asc" }, select: { textAr: true } },
      category: { select: { nameAr: true } },
    },
  });
  await db.$transaction([
    db.tradeScan.create({ data: { codeId: shop.id, barcode: code, productId: p?.id ?? null, found: !!p } }),
    db.wholesaleCode.update({ where: { id: shop.id }, data: { lastUsedAt: new Date() } }),
  ]);
  if (!p) return NextResponse.json({ found: false, barcode: code }, { headers: H });
  return NextResponse.json(
    {
      found: true,
      product: {
        id: p.id,
        name: p.nameAr,
        nameEn: p.nameEn,
        sku: p.sku,
        barcode: p.barcode,
        category: p.category.nameAr,
        description: p.descriptionAr,
        images: p.images.map((i) => i.url),
        wholesalePrice: p.wholesalePrice == null ? null : Number(p.wholesalePrice),
        price: p.price == null ? null : Number(p.price),
        inStock: p.inStock,
        specs: p.specs,
        features: p.features.map((f) => f.textAr),
      },
    },
    { headers: H },
  );
}
