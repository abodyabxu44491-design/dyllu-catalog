import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { db } from "@/lib/db";
const ALPHA = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // بدون حروف متشابهة (O/0 و I/1)
const gen = () => "DY-" + Array.from(randomBytes(6), (b) => ALPHA[b % ALPHA.length]).join("");
export async function POST(req: Request) {
  const { name } = await req.json();
  if (!String(name ?? "").trim()) return NextResponse.json({ error: "اكتب اسم العميل" }, { status: 400 });
  return NextResponse.json(await db.wholesaleCode.create({ data: { name: String(name).trim(), code: gen() } }));
}
export async function PUT(req: Request) {
  const { id, isActive } = await req.json();
  return NextResponse.json(await db.wholesaleCode.update({ where: { id: Number(id) }, data: { isActive: !!isActive } }));
}
export async function DELETE(req: Request) {
  try { await db.wholesaleCode.delete({ where: { id: Number(new URL(req.url).searchParams.get("id")) } }); return NextResponse.json({ ok: true }); }
  catch { return NextResponse.json({ error: "الكود مرتبط بطلبات، أوقفه بدل الحذف" }, { status: 400 }); }
}
