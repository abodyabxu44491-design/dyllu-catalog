import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { z } from "zod";
import { denyUnlessAdmin } from "@/lib/adminAuth";
import { db } from "@/lib/db";
// المحلات ورموز QR: POST {id?, name, code?, city?, notes?, isActive} إنشاء/تعديل | DELETE ?id= (أو إيقاف إن كان له طلبات)
const S = z.object({ id: z.number().int().optional(), name: z.string().trim().min(2, "اكتب اسم المحل").max(80), code: z.string().trim().max(40).optional(), city: z.string().trim().max(60).nullish(), notes: z.string().trim().max(300).nullish(), isActive: z.boolean().default(true) });
const ALPHA = "abcdefghjkmnpqrstuvwxyz23456789";
const slug = (v: string) => v.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 32);
const rand = () => Array.from(randomBytes(5), (b) => ALPHA[b % ALPHA.length]).join("");
export async function POST(req: Request) {
  const deny = await denyUnlessAdmin(); if (deny) return deny;
  const r = S.safeParse(await req.json().catch(() => ({})));
  if (!r.success) return NextResponse.json({ error: r.error.issues[0]?.message ?? "بيانات غير صالحة" }, { status: 400 });
  const { id, code, ...d } = r.data, data = { ...d, city: d.city || null, notes: d.notes || null };
  try {
    if (id) return NextResponse.json(await db.store.update({ where: { id }, data: { ...data, ...(code && slug(code) && { code: slug(code) }) } }));
    // الرمز يظهر في الرابط (?src=): من الاسم إن كان إنجليزيًا، وإلا رمز قصير عشوائي
    let c = slug(code || "") || slug(d.name) || `s-${rand()}`;
    if (await db.store.findUnique({ where: { code: c } })) c = `${c}-${rand().slice(0, 3)}`;
    return NextResponse.json(await db.store.create({ data: { ...data, code: c } }));
  } catch (e) { return NextResponse.json({ error: (e as { code?: string }).code === "P2002" ? "هذا الرمز مستخدم لمحل آخر" : "تعذر الحفظ" }, { status: 400 }); }
}
export async function DELETE(req: Request) {
  const deny = await denyUnlessAdmin(); if (deny) return deny;
  const id = Number(new URL(req.url).searchParams.get("id"));
  if (await db.order.count({ where: { storeId: id } })) { await db.store.update({ where: { id }, data: { isActive: false } }); return NextResponse.json({ ok: true, deactivated: true }); }
  await db.store.delete({ where: { id } }).catch(() => null);
  return NextResponse.json({ ok: true });
}
