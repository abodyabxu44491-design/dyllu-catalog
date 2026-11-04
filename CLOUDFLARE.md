# DYLLU على Cloudflare (Workers + D1 + R2)

الموقع يعمل على **Cloudflare Workers** عبر OpenNext، والبيانات في **D1** (SQLite)، والصور والملفات في **R2**.

## البنية
| الجزء | المكان |
|---|---|
| تشغيل الموقع | `worker.ts` (الموقع + فحص الاستهلاك كل ساعة) و `wrangler.jsonc` |
| قاعدة البيانات | D1 باسم `dyllu`، والمخطط في `migrations/` (يُطبَّق بـ `wrangler d1 migrations apply`) |
| الصور والملفات | R2 `dyllu-files`، وتُعرض من `/uploads/<name>` (أو من `STORAGE_PUBLIC_URL` إن ضُبط) |
| ذاكرة الصفحات المؤقتة | R2 `dyllu-cache` + جدول `revalidations` في D1، وأي حفظ من لوحة التحكم يحدّثها فورًا |
| تنبيه الاستهلاك بالبريد | `src/lib/usageAlert.ts`، كل ساعة، عند 70% من حدود الخطة المجانية، مرة يوميًا لكل مقياس |

## الأوامر
```bash
npm run cf:build              # بناء نسخة Workers
npm run preview               # تشغيلها محليًا على محرك Workers مع D1/R2 محلية
npm run db:migrate:local      # تطبيق مخطط D1 محليًا
npm run deploy                # نشر (يحتاج CLOUDFLARE_API_TOKEN)
```

## نقل البيانات من PostgreSQL (Neon)
```bash
node scripts/migrate-to-d1.mjs export "<postgres-url>" out   # قراءة فقط من المصدر
npx wrangler d1 execute dyllu --remote --file out/data.sql
node scripts/migrate-to-d1.mjs files out --remote             # رفع الملفات ثم تنزيلها ومقارنة البصمة
node scripts/migrate-to-d1.mjs verify out --remote            # مقارنة عدد السجلات وبصمة كل جدول
```
أو من GitHub ← Actions ← **Cloudflare** ← Run workflow (`migrate` / `deploy` / `verify`). سير العمل يرفض الاستيراد إذا كانت D1 فيها منتجات مسبقًا.

## الأسرار (لا تُكتب في المستودع)
في GitHub ← Settings ← Secrets ← Actions:
- `CLOUDFLARE_API_TOKEN`، `CLOUDFLARE_ACCOUNT_ID`
- `ADMIN_SESSION_SECRET`: **نفس القيمة المستخدمة سابقًا في Vercel**، حتى تبقى روابط المحلات وجلسات الدخول صالحة
- `NEON_DATABASE_URL`: للنقل فقط
- اختياري: `ANTHROPIC_API_KEY` (الترجمة)، `CF_ANALYTICS_TOKEN` (تنبيه الاستهلاك)

## فروقات D1 عن PostgreSQL وكيف عولجت
- لا توجد معاملات تفاعلية: حفظ المنتج يضيف الجديد ثم يحذف القديم (لا فقد عند التوقف)، والطلب يُحفظ بخطوات آمنة، والاستيراد من Excel يسجل القيم السابقة في `ImportChange` قبل أي تعديل ويتراجع تلقائيًا عند الفشل، ويعمل على دفعات صغيرة.
- لا يوجد بحث `mode: insensitive`: بحث SQLite (`LIKE`) لا يفرّق بين الحروف الكبيرة والصغيرة، ومطابقة كود المنتج تتم بعد توحيده.
- حد 100 قيمة في الاستعلام الواحد: القراءات الطويلة يقسمها Prisma، و`count()` له بديل تلقائي في `src/lib/db.ts`.
- قوائم الأرقام (عروض المنتجات) محفوظة JSON، والتقارير تُحسب في الكود بدل SQL خاص بـ PostgreSQL.
