import { NextResponse } from "next/server";
import { denyUnlessAdmin } from "@/lib/adminAuth";
import { z } from "zod";
import { db } from "@/lib/db";
import { isPhone, normalizePhone } from "@/lib/phone";
const R = z.object({ id: z.number().optional(), name: z.string().min(2), location: z.string().min(1), phone: z.string().refine(isPhone, "رقم الجوال غير صحيح").transform(normalizePhone), photo: z.string().nullish(), sortOrder: z.number().int().default(0), isActive: z.boolean() });
export async function POST(req: Request) {
  const deny = await denyUnlessAdmin(); if (deny) return deny;
  try { const { id, ...d } = R.parse(await req.json()); return NextResponse.json(id ? await db.rep.update({ where: { id }, data: d }) : await db.rep.create({ data: d })); }
  catch (e) { return NextResponse.json({ error: (e as Error).message }, { status: 400 }); }
}
export async function DELETE(req: Request) {
  const deny = await denyUnlessAdmin(); if (deny) return deny;
  try { await db.rep.delete({ where: { id: Number(new URL(req.url).searchParams.get("id")) } }); return NextResponse.json({ ok: true }); }
  catch { return NextResponse.json({ error: "المندوب مرتبط بطلبات، أوقفه بدل الحذف" }, { status: 400 }); }
}
