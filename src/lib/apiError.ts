import { ZodError } from "zod";
// رسالة خطأ واضحة بالعربية بدل نص zod/Prisma التقني
const FIELD: Record<string, string> = { name: "الاسم", nameAr: "الاسم بالعربي", nameEn: "الاسم بالإنجليزي", location: "الموقع", phone: "رقم الجوال", slug: "الرابط", sku: "رقم الموديل", price: "السعر", wholesalePrice: "سعر الجملة", categoryId: "التصنيف", image: "الصورة", code: "الكود", title: "العنوان" };
export function errMsg(e: unknown, dup = "القيمة مستخدمة من قبل") {
  if (e instanceof ZodError) {
    const i = e.issues[0]; if (!i) return "تحقق من البيانات";
    if (/[؀-ۿ]/.test(i.message)) return i.message;
    const f = FIELD[String(i.path[i.path.length - 1] ?? "")];
    return f ? `تحقق من حقل «${f}»` : "تحقق من البيانات المدخلة";
  }
  if ((e as { code?: string })?.code === "P2002") return dup;
  const m = (e as Error)?.message ?? "";
  return /[؀-ۿ]/.test(m) && m.length < 200 ? m : "تعذر الحفظ، حاول مرة أخرى";
}
