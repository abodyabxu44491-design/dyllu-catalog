// Copyright (c) 2026 Abdullah Al-Sakni. All rights reserved. DYLLU Catalog.
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { barcodeVariants, normalizeBarcode } from "@/lib/barcode";
import { normalizeSku } from "@/lib/admin/products";
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
  const variants = barcodeVariants(code),
    sku = normalizeSku(raw);
  // A barcode match wins; otherwise the exact product code (LIKE narrows, the exact comparison happens here)
  const rows = await db.product.findMany({
    take: 20,
    where: {
      isActive: true,
      OR: [{ barcode: { in: variants } }, ...(sku ? [{ sku: { startsWith: sku } }] : [])],
    },
    include: {
      images: { orderBy: { sortOrder: "asc" }, select: { url: true } },
      specs: { orderBy: { sortOrder: "asc" }, select: { nameAr: true, value: true } },
      features: { orderBy: { sortOrder: "asc" }, select: { textAr: true } },
      category: { select: { nameAr: true } },
    },
  });
  const p = rows.find((r) => r.barcode && variants.includes(r.barcode)) ?? rows.find((r) => normalizeSku(r.sku) === sku) ?? null;
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
