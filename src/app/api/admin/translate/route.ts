import { NextResponse } from "next/server";
import { z } from "zod";
import { denyUnlessAdmin } from "@/lib/adminAuth";
import { canTranslate, translate } from "@/lib/translate";
import { ipOf, limited } from "@/lib/ratelimit";
// زر «ترجمة تلقائية» في لوحة التحكم: POST {toEn: {key: نص عربي}, toAr: {key: English}} ← نفس المفاتيح مترجمة
const T = z.record(z.string().max(4000)).refine((o) => Object.keys(o).length <= 80, "نصوص كثيرة");
export async function POST(req: Request) {
  const deny = await denyUnlessAdmin(); if (deny) return deny;
  if (!canTranslate()) return NextResponse.json({ error: "الترجمة التلقائية غير مفعّلة: أضف ANTHROPIC_API_KEY في ملف .env" }, { status: 501 });
  if (limited(`tr:${ipOf(req)}`, 30, 60_000)) return NextResponse.json({ error: "محاولات كثيرة، انتظر دقيقة" }, { status: 429 });
  try {
    const { toEn = {}, toAr = {} } = z.object({ toEn: T.optional(), toAr: T.optional() }).parse(await req.json());
    const [en, ar] = await Promise.all([translate(toEn, "en"), translate(toAr, "ar")]);
    const asked = Object.keys(toEn).length + Object.keys(toAr).length, got = Object.keys(en).length + Object.keys(ar).length;
    if (asked && !got) return NextResponse.json({ error: "تعذرت الترجمة الآن، حاول مرة أخرى" }, { status: 502 });
    return NextResponse.json({ ...en, ...ar });
  } catch { return NextResponse.json({ error: "طلب غير صالح" }, { status: 400 }); }
}
