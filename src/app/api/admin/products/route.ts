// Copyright (c) 2026 Abdullah Al-Sakni. All rights reserved. DYLLU Catalog.
import { NextResponse } from "next/server";
import { errMsg } from "@/lib/apiError";
import { denyUnlessAdmin } from "@/lib/adminAuth";
import { db } from "@/lib/db";
import { searchWhere } from "@/lib/catalog";
import { barcodeOwner, duplicateProduct, saveProduct, skuOwner } from "@/lib/admin/products";
export const maxDuration = 30;
export async function POST(req: Request) {
  const deny = await denyUnlessAdmin();
  if (deny) return deny;
  try {
    const b = await req.json();
    if (b.action === "duplicate") return NextResponse.json(await duplicateProduct(Number(b.id)));
    return NextResponse.json(await saveProduct(b.id ?? null, b));
  } catch (e) {
    return NextResponse.json({ error: errMsg(e, "رقم الموديل (SKU) أو الباركود أو الرابط مستخدم لمنتج آخر") }, { status: 400 });
  }
}
export async function GET(req: Request) {
  const deny = await denyUnlessAdmin();
  if (deny) return deny;
  const sp = new URL(req.url).searchParams,
    id = Number(sp.get("id")),
    q = sp.get("q")?.trim().slice(0, 60);
  if (sp.has("sku")) return NextResponse.json({ owner: await skuOwner(sp.get("sku"), Number(sp.get("except")) || null) });
  if (sp.has("barcode")) return NextResponse.json({ owner: await barcodeOwner(sp.get("barcode"), Number(sp.get("except")) || null) });
  if (id) {
    const p = await db.product.findUnique({
      where: { id },
      select: {
        specs: { orderBy: { sortOrder: "asc" }, select: { nameAr: true, nameEn: true, value: true } },
        features: { orderBy: { sortOrder: "asc" }, select: { textAr: true, textEn: true } },
      },
    });
    return NextResponse.json(p ?? { specs: [], features: [] });
  }
  const rows = await db.product.findMany({
    where: { isActive: true, ...searchWhere(q) },
    include: { images: { orderBy: { sortOrder: "asc" } }, category: { select: { nameAr: true, nameEn: true } } },
    orderBy: q ? [{ isFeatured: "desc" }, { sortOrder: "asc" }] : [{ isFeatured: "desc" }, { id: "desc" }],
    take: 12,
  });
  return NextResponse.json(
    rows.map((p) => ({
      id: p.id,
      slug: p.slug,
      sku: p.sku,
      nameAr: p.nameAr,
      nameEn: p.nameEn,
      price: p.price == null ? null : Number(p.price),
      showPrice: p.showPrice,
      inStock: p.inStock,
      images: p.images.map((i) => i.url),
      category: p.category.nameAr,
    })),
  );
}
const FLAGS = ["isActive", "inStock", "isFeatured", "showPrice", "allowCart"];
export async function PATCH(req: Request) {
  const deny = await denyUnlessAdmin();
  if (deny) return deny;
  const { id, ...b } = await req.json(),
    data = Object.fromEntries(Object.entries(b).filter(([k, v]) => FLAGS.includes(k) && typeof v === "boolean"));
  if ("inStock" in data) {
    const cur = await db.product.findUnique({ where: { id: Number(id) }, select: { stock: true } });
    if (cur?.stock != null) return NextResponse.json({ error: "التوفر يتحدد من الكمية في المخزون" }, { status: 400 });
  }
  return NextResponse.json(await db.product.update({ where: { id: Number(id) }, data }));
}
export async function DELETE(req: Request) {
  const deny = await denyUnlessAdmin();
  if (deny) return deny;
  // Past order lines keep their name, code and price snapshot; only the link to the product is cleared
  const id = Number(new URL(req.url).searchParams.get("id"));
  const r = Number.isInteger(id) && id > 0 ? await db.product.deleteMany({ where: { id } }) : { count: 0 };
  if (!r.count) return NextResponse.json({ error: "المنتج غير موجود" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
