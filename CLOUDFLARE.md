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
أو من GitHub ← Actions ← **Cloudflare** ← Run workflow (`migrate` / `files` / `deploy` / `verify`). سير العمل يرفض الاستيراد إذا كانت D1 فيها منتجات مسبقًا. مهمة `files` تكمل نقل الصور الناقصة فقط (تتخطى المنقول المطابق) ثم تتحقق من كل شيء.

## الأسرار (لا تُكتب في المستودع)
في GitHub ← Settings ← Secrets ← Actions:
- `CLOUDFLARE_API_TOKEN`، `CLOUDFLARE_ACCOUNT_ID`
- `ADMIN_SESSION_SECRET` (اختياري): إذا لم يُضف، يُنشأ مفتاح عشوائي داخل Cloudflare عند أول نشر ويبقى ثابتًا بعدها. تغييره يتطلب إعادة إرسال روابط تطبيق المحلات وتسجيل الدخول من جديد
- `NEON_DATABASE_URL`: للنقل فقط
- اختياري: `ANTHROPIC_API_KEY` (الترجمة)، `CF_ANALYTICS_TOKEN` (تنبيه الاستهلاك)

## فروقات D1 عن PostgreSQL وكيف عولجت
- لا توجد معاملات تفاعلية: حفظ المنتج يضيف الجديد ثم يحذف القديم (لا فقد عند التوقف)، والطلب يُحفظ بخطوات آمنة، والاستيراد من Excel يسجل القيم السابقة في `ImportChange` قبل أي تعديل ويتراجع تلقائيًا عند الفشل، ويعمل على دفعات صغيرة.
- لا يوجد بحث `mode: insensitive`: بحث SQLite (`LIKE`) لا يفرّق بين الحروف الكبيرة والصغيرة، ومطابقة كود المنتج تتم بعد توحيده.
- حد 100 قيمة في الاستعلام الواحد: إذا رفضت D1 قراءة (قائمة أرقام طويلة مع ترتيب، أو عناصر مرتبطة لأكثر من 98 سجل مثل الطلبات وعناصرها، أو `count()`) يعيدها `src/lib/db.ts` تلقائيًا على دفعات بنفس النتيجة ونفس الترتيب. التضمين على مستويين لقوائم كبيرة (قسم ← منتجات ← صور) يُكتب كاستعلامين كما في `src/app/catalog/page.tsx`.
- قوائم الأرقام (عروض المنتجات) محفوظة JSON، والتقارير تُحسب في الكود بدل SQL خاص بـ PostgreSQL.

## الإشعارات (Web Push)
- لوحة التحكم ← **الإشعارات**: اكتب العنوان والنص واختر الصفحة التي تفتح، ثم «إرسال لكل العملاء». يصل الإشعار لكل جهاز فعّل الإشعارات حتى لو كان التطبيق مغلقًا.
- العملاء يفعّلونها من نافذة صغيرة تظهر في المتجر (في التطبيق المثبّت بعد ثوانٍ، وفي المتصفح بعد 20 ثانية). على الآيفون تعمل فقط من التطبيق المضاف للشاشة الرئيسية (iOS 16.4 أو أحدث).
- الإرسال على دفعات صغيرة (8 أجهزة لكل طلب) ليبقى ضمن حدود الخطة المجانية؛ إذا أُغلقت الصفحة أثناء الإرسال يظهر زر «أكمل الإرسال» في السجل.
- المفاتيح `VAPID_PUBLIC_KEY` و`VAPID_PRIVATE_KEY` تُنشأ تلقائيًا داخل Cloudflare في أول نشر ولا تُغيَّر بعدها (تغييرها يفصل كل الأجهزة المشتركة).
- الملفات: `public/sw.js`، `src/lib/webpush.ts` (التشفير والتوقيع)، `src/lib/push.ts`، `src/app/api/push`، `src/app/api/admin/push`، `src/components/admin/NotificationsManager.tsx`.
