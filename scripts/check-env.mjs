// فحص الإعدادات قبل التشغيل: npm run check
import { readFileSync, existsSync } from "node:fs";
const out = []; let bad = 0;
const ok = (m) => out.push("  ✓ " + m), no = (m) => (bad++, out.push("  ✗ " + m));
const [maj, min] = process.versions.node.split(".").map(Number);
maj > 18 || (maj === 18 && min >= 17) ? ok(`Node ${process.versions.node}`) : no(`Node ${process.versions.node} قديم: المطلوب 18.17 أو أحدث (يُفضَّل 20)`);
if (!existsSync(".env")) { no("ملف .env غير موجود: نفّذ cp .env.example .env ثم املأه"); console.log(out.join("\n")); process.exit(1); }
const env = {};
for (const l of readFileSync(".env", "utf8").split(/\r?\n/)) { const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/); if (m && !l.trim().startsWith("#")) env[m[1]] = m[2].replace(/^(["'])(.*)\1$/, "$2"); }
/^postgres(ql)?:\/\/.+@.+\/.+/.test(env.DATABASE_URL || "") ? ok("DATABASE_URL بصيغة PostgreSQL") : no("DATABASE_URL فارغ أو بصيغة غير صحيحة (postgresql://USER:PASSWORD@HOST:5432/DATABASE)");
(env.ADMIN_SESSION_SECRET || "").length >= 32 ? ok("ADMIN_SESSION_SECRET طوله كافٍ") : no("ADMIN_SESSION_SECRET فارغ أو أقصر من 32 حرفًا (راجع الأمر داخل .env.example)");
env.NEXT_PUBLIC_SITE_URL ? ok("NEXT_PUBLIC_SITE_URL موجود") : no("NEXT_PUBLIC_SITE_URL فارغ");
if (env.S3_BUCKET) ["S3_KEY", "S3_SECRET", "S3_PUBLIC_URL"].forEach((k) => (env[k] ? ok(k) : no(`${k} مطلوب لأن S3_BUCKET مضبوط`)));
else ok("التخزين: محلي (public/uploads)");
console.log(out.join("\n")); console.log(bad ? `\n${bad} مشكلة تحتاج إصلاحًا قبل التشغيل.` : "\nالإعدادات سليمة.");
process.exit(bad ? 1 : 0);
