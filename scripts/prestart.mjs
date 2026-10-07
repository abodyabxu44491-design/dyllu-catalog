// يعمل تلقائيًا قبل تشغيل الموقع (npm start) على Render أو أي سيرفر:
// 1) يحدّث جداول قاعدة البيانات حسب prisma/schema.prisma (آمن: يرفض أي تغيير يحذف بيانات)
// 2) ينشئ حساب الأدمن من ADMIN_EMAIL و ADMIN_PASSWORD إن وُجدا، أو يحدّث كلمة مروره إن تغيّرت
// 3) يضيف المنتجات الجاهزة الجديدة من prisma/catalog (مرة واحدة، بدون تعديل الموجود)
// 4) يترجم النصوص العربية التي ليس لها نسخة إنجليزية بعد
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

// prisma db push يرفض أحيانًا تغييرًا آمنًا بتحذير «فقد بيانات» (مثل قيد unique على عمود جديد فارغ).
// عندها نحسب أوامر SQL المطلوبة بالضبط وننفذها فقط إن كانت إضافات (أعمدة/جداول/فهارس) بدون أي حذف لبيانات.
const DESTRUCTIVE = /\bDROP\s+(TABLE|COLUMN|SCHEMA|TYPE|VALUE)\b|\bTRUNCATE\b|\bDELETE\s+FROM\b|\bALTER\s+COLUMN\s+"[^"]+"\s+(SET\s+DATA\s+)?TYPE\b|\bRENAME\b/i;
function syncDb() {
  try { execSync("npx prisma db push --skip-generate", { stdio: "pipe" }); return log("✓ قاعدة البيانات محدّثة"); }
  catch (e) { const out = `${e.stdout ?? ""}${e.stderr ?? ""}`; if (!/accept-data-loss/.test(out)) { console.log(out); return log("✗ تعذر تحديث قاعدة البيانات تلقائيًا (راجع السطر أعلاه). الموقع سيعمل بالجداول الحالية"); } }
  let sql = "";
  try { sql = execSync('npx prisma migrate diff --from-url "$DATABASE_URL" --to-schema-datamodel prisma/schema.prisma --script', { stdio: ["ignore", "pipe", "pipe"] }).toString(); }
  catch (e) { console.log(`${e.stderr ?? ""}`); return log("✗ تعذر حساب تحديث قاعدة البيانات"); }
  const body = sql.split("\n").filter((l) => !l.trim().startsWith("--")).join("\n");
  if (DESTRUCTIVE.test(body)) { console.log(sql); return log("✗ التحديث المطلوب يحذف بيانات، لم يُنفَّذ تلقائيًا. راجع الأوامر أعلاه وطبّقها يدويًا بعد أخذ نسخة احتياطية"); }
  try { execSync("npx prisma db execute --stdin --schema prisma/schema.prisma", { input: sql, stdio: ["pipe", "pipe", "pipe"] }); log("✓ قاعدة البيانات محدّثة (أعمدة وجداول جديدة فقط، بدون حذف أي بيانات)"); }
  catch (e) { console.log(`${e.stdout ?? ""}${e.stderr ?? ""}`); log("✗ تعذر تطبيق تحديث قاعدة البيانات (راجع السطر أعلاه)"); }
}
syncDb();
if (process.argv.includes("--db-only")) process.exit(0);

// نفس صيغة src/lib/password.ts
const hash = (p) => { const s = randomBytes(16).toString("hex"); return `${s}:${scryptSync(p, s, 64).toString("hex")}`; };
const same = (p, stored) => { const [s, h] = stored.split(":"); const a = Buffer.from(h ?? "", "hex"), b = scryptSync(p, s ?? "", 64); return a.length === b.length && timingSafeEqual(a, b); };

async function admin(db) {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase(), pw = process.env.ADMIN_PASSWORD?.trim();
  if (!email || !pw) return log("ℹ ADMIN_EMAIL / ADMIN_PASSWORD غير مضبوطين: لن يُنشأ حساب أدمن (الحسابات الموجودة تبقى كما هي)");
  if (!/^\S+@\S+\.\S+$/.test(email) || pw.length < 8) return log("✗ ADMIN_EMAIL يجب أن يكون بريدًا صحيحًا و ADMIN_PASSWORD 8 أحرف على الأقل");
  const u = await db.adminUser.findUnique({ where: { email } });
  if (!u) { await db.adminUser.create({ data: { email, name: "Admin", passwordHash: hash(pw) } }); log(`✓ أُنشئ حساب الأدمن: ${email}`); }
  else if (!same(pw, u.passwordHash)) { await db.adminUser.update({ where: { email }, data: { passwordHash: hash(pw), sessionVersion: { increment: 1 } } }); log(`✓ حُدّثت كلمة مرور الأدمن: ${email}`); }
  else log(`✓ حساب الأدمن جاهز: ${email}`);
}

const { PrismaClient } = await import("@prisma/client");
const { importCatalog } = await import("./import-catalog.mjs");
const { backfillEnglish } = await import("./backfill-english.mjs");
const db = new PrismaClient();
try { await admin(db); } catch (e) { log(`✗ تعذر تجهيز حساب الأدمن: ${e.message}`); }
// 3) منتجات جاهزة جديدة (prisma/catalog): تُضاف مرة واحدة فقط
try { await importCatalog(db, log); } catch (e) { log(`✗ تعذر استيراد المنتجات الجاهزة: ${e.message}`); }
// 4) النسخة الإنجليزية الناقصة تُترجم تلقائيًا من العربي
try { await backfillEnglish(db, log); } catch (e) { log(`✗ تعذرت ترجمة النصوص الناقصة: ${e.message}`); }
await db.$disconnect();
