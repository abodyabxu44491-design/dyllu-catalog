import { NextResponse } from "next/server";
import { denyUnlessAdmin } from "@/lib/adminAuth";
import { db } from "@/lib/db";
import { saveProduct } from "@/lib/admin/products";
// POST {id?, ...حقول المنتج} إنشاء/تعديل | PATCH {id, isActive|inStock|isFeatured|showPrice|allowCart} تبديل سريع | DELETE ?id=
export async function POST(req: Request) {
  const deny = await denyUnlessAdmin(); if (deny) return deny;
  try { const b = await req.json(); return NextResponse.json(await saveProduct(b.id ?? null, b)); }
  catch (e) { return NextResponse.json({ error: (e as { code?: string }).code === "P2002" ? "رمز SKU أو الرابط مستخدم لمنتج آخر" : (e as Error).message }, { status: 400 }); }
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
