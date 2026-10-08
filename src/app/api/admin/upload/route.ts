import { NextResponse } from "next/server";
import { denyUnlessAdmin } from "@/lib/adminAuth";
import { saveUpload } from "@/lib/storage";
// الحفظ يشمل الترجمة التلقائية (ورفع الصور يشمل الضغط): مهلة أطول على الاستضافات السحابية
export const maxDuration = 30;
export async function POST(req: Request) {
  const deny = await denyUnlessAdmin(); if (deny) return deny;
  try { const f = (await req.formData()).get("file"); return NextResponse.json({ url: await saveUpload(f as File) }); }
  catch (e) { return NextResponse.json({ error: /[\u0600-\u06FF]/.test((e as Error).message) ? (e as Error).message : "تعذر رفع الملف، حاول مرة أخرى" }, { status: 400 }); }
}
