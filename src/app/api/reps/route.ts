import { NextResponse } from "next/server";
import { db } from "@/lib/db";
export const dynamic = "force-dynamic"; // بدونها يُجمَّد الرد وقت البناء ولا تظهر تعديلات المناديب
// قائمة المناديب للعميل: بدون رقم الجوال (الرقم يُستخدم في السيرفر فقط عند بناء رابط واتساب)
export async function GET() {
  const rows = await db.rep.findMany({ where: { isActive: true }, orderBy: [{ sortOrder: "asc" }, { id: "asc" }], select: { id: true, name: true, location: true, photo: true } });
  return NextResponse.json(rows);
}
