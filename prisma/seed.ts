// إنشاء (أو تحديث) حساب الأدمن. القيم تؤخذ من ملف .env: ADMIN_EMAIL و ADMIN_PASSWORD
import { readFileSync } from "node:fs";
import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/lib/password";

// tsx لا يقرأ .env تلقائيًا، فنقرأه هنا (بدون مكتبات إضافية). المتغيرات الموجودة في البيئة لها الأولوية.
try {
  for (const line of readFileSync(".env", "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (!m || line.trim().startsWith("#")) continue;
    const v = m[2].replace(/^(["'])(.*)\1$/, "$2");
    if (process.env[m[1]] === undefined) process.env[m[1]] = v;
  }
} catch { /* لا يوجد ملف .env: نكمل بمتغيرات البيئة */ }

const db = new PrismaClient();
async function main() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase(), pw = process.env.ADMIN_PASSWORD;
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL غير مضبوط في .env");
  if (!email || !/^\S+@\S+\.\S+$/.test(email)) throw new Error("ADMIN_EMAIL مطلوب في .env وبصيغة بريد صحيحة");
  if (!pw || pw.length < 8) throw new Error("ADMIN_PASSWORD مطلوب في .env (8 أحرف على الأقل)");
  await db.adminUser.upsert({ where: { email }, update: { passwordHash: hashPassword(pw), sessionVersion: { increment: 1 } }, create: { email, name: "Admin", passwordHash: hashPassword(pw) } });
  console.log(`✓ حساب الأدمن جاهز: ${email}`);
  console.log("  سجّل الدخول من /admin-login، ثم احذف ADMIN_PASSWORD من ملف .env.");
}
main().catch((e) => { console.error("✗ فشل إنشاء الأدمن:", e.message); process.exitCode = 1; }).finally(() => db.$disconnect());
