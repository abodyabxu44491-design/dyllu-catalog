import { NextResponse } from "next/server";
import { errMsg } from "@/lib/apiError";
import { denyUnlessAdmin } from "@/lib/adminAuth";
import { db } from "@/lib/db";
import { searchWhere } from "@/lib/catalog";
import { duplicateProduct, saveProduct } from "@/lib/admin/products";
// POST {id?, ...حقول المنتج} إنشاء/تعديل | POST {action:"duplicate", id} نسخ منتج (مخفي) | PATCH {id, isActive|inStock|isFeatured|showPrice|allowCart} تبديل سريع | DELETE ?id=
export async function POST(req: Request) {
  const deny = await denyUnlessAdmin(); if (deny) return deny;
  try { const b = await req.json(); if (b.action === "duplicate") return NextResponse.json(await duplicateProduct(Number(b.id))); return NextResponse.json(await saveProduct(b.id ?? null, b)); }
  catch (e) { return NextResponse.json({ error: errMsg(e, "رقم الموديل (SKU) أو الرابط مستخدم لمنتج آخر") }, { status: 400 }); }
}
// GET ?q= بحث سريع للوحة التحكم (منتقي المنتج في الإعلانات): كل الصور والسعر والتصنيف
export async function GET(req: Request) {
  const deny = await denyUnlessAdmin(); if (deny) return deny;
  const sp = new URL(req.url).searchParams, id = Number(sp.get("id")), q = sp.get("q")?.trim().slice(0, 60);
  // ?id= مواصفات ومميزات منتج (لنسخها إلى منتج آخر)
  if (id) { const p = await db.product.findUnique({ where: { id }, select: { specs: { orderBy: { sortOrder: "asc" }, select: { nameAr: true, nameEn: true, value: true } }, features: { orderBy: { sortOrder: "asc" }, select: { textAr: true, textEn: true } } } }); return NextResponse.json(p ?? { specs: [], features: [] }); }
  const rows = await db.product.findMany({ where: { isActive: true, ...searchWhere(q) }, include: { images: { orderBy: { sortOrder: "asc" } }, category: { select: { nameAr: true, nameEn: true } } }, orderBy: q ? [{ isFeatured: "desc" }, { sortOrder: "asc" }] : [{ isFeatured: "desc" }, { id: "desc" }], take: 12 });
  return NextResponse.json(rows.map((p) => ({ id: p.id, slug: p.slug, sku: p.sku, nameAr: p.nameAr, nameEn: p.nameEn, price: p.price == null ? null : Number(p.price), showPrice: p.showPrice, images: p.images.map((i) => i.url), category: p.category.nameAr })));
}
const FLAGS = ["isActive", "inStock", "isFeatured", "showPrice", "allowCart"];
export async function PATCH(req: Request) {
  const deny = await denyUnlessAdmin(); if (deny) return deny;
  const { id, ...b } = await req.json(), data = Object.fromEntries(Object.entries(b).filter(([k, v]) => FLAGS.includes(k) && typeof v === "boolean"));
  return NextResponse.json(await db.product.update({ where: { id: Number(id) }, data }));
}
export async function DELETE(req: Request) {
  const deny = await denyUnlessAdmin(); if (deny) return deny;
  try { await db.product.delete({ where: { id: Number(new URL(req.url).searchParams.get("id")) } }); return NextResponse.json({ ok: true }); }
  catch { return NextResponse.json({ error: "المنتج مرتبط بطلبات، أخفِه بدل الحذف" }, { status: 400 }); }
}
