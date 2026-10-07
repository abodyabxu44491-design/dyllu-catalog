// يعمل تلقائيًا قبل تشغيل الموقع (npm start) على Render أو أي سيرفر:
// 1) يحدّث جداول قاعدة البيانات حسب prisma/schema.prisma (آمن: يرفض أي تغيير يحذف بيانات)
// 2) ينشئ حساب الأدمن من ADMIN_EMAIL و ADMIN_PASSWORD إن وُجدا، أو يحدّث كلمة مروره إن تغيّرت
// أي فشل هنا يُطبع بوضوح في سجل Render ولا يمنع تشغيل الموقع.
// --db-only: تحديث الجداول فقط (يُستدعى قبل البناء npm run build حتى تجد الصفحات جداولها في أول نشر)
import { execSync } from "node:child_process";
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

import { readFileSync } from "node:fs";

const log = (m) => console.log(`[DYLLU] ${m}`);
// محليًا: قراءة .env (على Render المتغيرات تأتي من البيئة ولها الأولوية)
try { for (const l of readFileSync(".env", "utf8").split(/\r?\n/)) { const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/); if (m && !l.trim().startsWith("#") && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^(["'])(.*)\1$/, "$2"); } } catch { /* لا يوجد .env */ }
if (!process.env.DATABASE_URL) { log("✗ DATABASE_URL غير مضبوط: أضفه في Environment على Render"); process.exit(0); }
if (!process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_SESSION_SECRET.length < 32) log("✗ ADMIN_SESSION_SECRET فارغ أو قصير (32 حرفًا على الأقل): تسجيل دخول الأدمن لن يعمل بدونه");

try {
  execSync("npx prisma db push --skip-generate", { stdio: "inherit" });
  log("✓ قاعدة البيانات محدّثة");
} catch { log("✗ تعذر تحديث قاعدة البيانات تلقائيًا (راجع السطر أعلاه). الموقع سيعمل بالجداول الحالية"); }
if (process.argv.includes("--db-only")) process.exit(0);

const email = process.env.ADMIN_EMAIL?.trim().toLowerCase(), pw = process.env.ADMIN_PASSWORD?.trim();
if (!email || !pw) { log("ℹ ADMIN_EMAIL / ADMIN_PASSWORD غير مضبوطين: لن يُنشأ حساب أدمن (الحسابات الموجودة تبقى كما هي)"); process.exit(0); }
if (!/^\S+@\S+\.\S+$/.test(email) || pw.length < 8) { log("✗ ADMIN_EMAIL يجب أن يكون بريدًا صحيحًا و ADMIN_PASSWORD 8 أحرف على الأقل"); process.exit(0); }

// نفس صيغة src/lib/password.ts
const hash = (p) => { const s = randomBytes(16).toString("hex"); return `${s}:${scryptSync(p, s, 64).toString("hex")}`; };
const same = (p, stored) => { const [s, h] = stored.split(":"); const a = Buffer.from(h ?? "", "hex"), b = scryptSync(p, s ?? "", 64); return a.length === b.length && timingSafeEqual(a, b); };

const { PrismaClient } = await import("@prisma/client");
const db = new PrismaClient();
try {
  const u = await db.adminUser.findUnique({ where: { email } });
  if (!u) { await db.adminUser.create({ data: { email, name: "Admin", passwordHash: hash(pw) } }); log(`✓ أُنشئ حساب الأدمن: ${email}`); }
  else if (!same(pw, u.passwordHash)) { await db.adminUser.update({ where: { email }, data: { passwordHash: hash(pw), sessionVersion: { increment: 1 } } }); log(`✓ حُدّثت كلمة مرور الأدمن: ${email}`); }
  else log(`✓ حساب الأدمن جاهز: ${email}`);
} catch (e) { log(`✗ تعذر تجهيز حساب الأدمن: ${e.message}`); }
finally { await db.$disconnect(); }
