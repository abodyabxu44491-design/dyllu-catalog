# دليل التطوير — كتالوج DYLLU

> تطوير وبرمجة: **عبدالله السكني** (Abdullah Al-Sakni) — © 2026 جميع الحقوق محفوظة.

هذا الملف للمبرمج اللي بيشتغل على الكود: تشغيله على جهازك، وهيكل المشروع، وطريقة إضافة ميزة وفحصها ونشرها.
شرح التشغيل للعميل ونشره على الاستضافة موجود في `README.md`.

## 1) التقنيات

| الجزء | التقنية |
| --- | --- |
| الواجهة والسيرفر | Next.js 14 (App Router) + React 18 + TypeScript |
| التصميم | Tailwind CSS 3، اتجاه RTL، خطوط Cairo و IBM Plex Sans Arabic |
| قاعدة البيانات | PostgreSQL عبر Prisma 5 |
| التحقق من المدخلات | zod |
| الصور | تُصغَّر في المتصفح ثم تُحفظ في قاعدة البيانات (أو S3/R2 اختياريًا) |
| الترجمة | تلقائية من العربي للإنجليزي (`src/lib/translateCore.mjs`)، و Claude اختياريًا |
| الاستضافة | Vercel + Neon |

## 2) التشغيل على جهازك (مرة واحدة)

المتطلبات: Node.js 20 (موجود في `.nvmrc`) وقاعدة PostgreSQL.

```bash
# 1. تثبيت الحزم
npm ci

# 2. قاعدة بيانات محلية (أسهل طريقة: Docker)
docker compose up -d          # PostgreSQL 16 على المنفذ 5432

# 3. ملف الإعدادات
cp .env.example .env
# عدّل .env:
# DATABASE_URL=postgresql://dyllu:dyllu@localhost:5432/dyllu
# ADMIN_SESSION_SECRET=<32 حرف عشوائي>
# ADMIN_EMAIL=admin@example.com
# ADMIN_PASSWORD=<8 أحرف أو أكثر>

# 4. الجداول + حساب الأدمن + المنتجات الجاهزة
node scripts/prestart.mjs

# 5. التشغيل للتطوير
npm run dev                   # http://localhost:3000
```

- لوحة التحكم: `http://localhost:3000/admin-login` بالبريد وكلمة المرور اللي في `.env`.
- بدون Docker: أنشئ قاعدة مجانية على [Neon](https://neon.tech) وحط رابطها في `DATABASE_URL`.

## 3) الأوامر

| الأمر | وش يسوي |
| --- | --- |
| `npm run dev` | تشغيل للتطوير مع تحديث فوري |
| `npm run build` | تحديث الجداول + بناء نسخة الإنتاج |
| `npm start` | تشغيل نسخة الإنتاج |
| `npm run typecheck` | فحص TypeScript |
| `npm run format` | تنسيق الكود (Prettier) |
| `npm run format:check` | التأكد إن الكود منسّق |
| `npm run check:site` | فحص شامل للموقع على جوالات وتابلت وكمبيوتر (القسم 7) |
| `npm run db:push` | تطبيق تغييرات `prisma/schema.prisma` على القاعدة |
| `npm run studio` | فتح Prisma Studio لتصفح البيانات |
| `npm run catalog:import` | إضافة المنتجات الجاهزة من `prisma/catalog` |
| `npm run english:backfill` | ترجمة أي نص عربي ما له نسخة إنجليزية |

## 4) هيكل المشروع

```
src/
├── app/
│   ├── (store)/            المتجر: الرئيسية، التصنيفات، المنتجات، السلة
│   ├── admin/              صفحات لوحة التحكم
│   ├── admin-login/        دخول الإدارة
│   ├── rep/ , rep-login/   بوابة المندوب ودخوله
│   ├── trade/              تطبيق أصحاب المحلات DYLLU Trade (مسح الباركود وسعر الجملة)
│   ├── api/                واجهات API (admin/* محمية بجلسة الأدمن، rep/* بجلسة المندوب)
│   ├── order/[token]/      صفحة/فاتورة الطلب للعميل
│   └── catalog/            قائمة الأسعار للطباعة PDF
├── components/             مكونات المتجر المشتركة
│   ├── admin/              مكونات لوحة التحكم (نماذج، مدراء الأقسام)
│   ├── ads/AdCanvas.tsx    تصميم الإعلانات (نفسه في المعاينة والمتجر)
│   ├── rep/                مكونات بوابة المندوب
│   └── trade/              مكونات تطبيق المحلات
├── lib/                    المنطق: الأسعار، العروض، الطلبات، الجلسات، الترجمة، الهاتف
│   └── admin/              منطق لوحة التحكم (الاستيراد، الطلبات، المنتجات)
├── store/                  حالة المتصفح (السلة، آخر ما شاهده العميل، الإشعارات)
├── config/brand.ts         ألوان الهوية والإعدادات الافتراضية
└── middleware.ts           حماية /admin و /rep + تحويل الروابط القديمة للدومين الرسمي
prisma/schema.prisma        جداول قاعدة البيانات
scripts/                    أوامر التشغيل والفحص (prestart، الاستيراد، الترجمة، الفحص الشامل)
```

## 5) مفاهيم مهمة قبل ما تعدّل

- **الأسعار:** أي سعر يظهر للعميل يمر على `priceOf()` في `src/lib/format.ts`. هي اللي تختار سعر الجملة أو العادي وتطبّق العرض. لا تعرض `product.price` مباشرة.
- **العروض:** `src/lib/offers.ts`. أعلى خصم فعّال يُطبَّق، وأسعار الجملة ما يشملها العرض إلا إذا فُعّل «يشمل الجملة». الطلب يُحسب بنفس السعر في `src/lib/orders.ts`.
- **الجملة:** كود الجملة يحفظ كوكي موقّع لمدة 30 يوم (`src/app/api/ws`)، والعميل يفتح خانة الكود بثلاث ضغطات على الشعار (`LogoTap.tsx`).
- **الجلسات:** كوكي موقّع HMAC في `src/lib/session.ts`. الخروج أو تغيير كلمة المرور يرفع `sessionVersion` فتنتهي كل الجلسات.
- **الترجمة:** الإدارة تكتب بالعربي فقط. عند الحفظ `englishFor()` في `src/lib/translate.ts` يولّد الإنجليزي، ويحتفظ بالترجمة القديمة إذا ما تغيّر العربي.
- **تطبيق المحلات (DYLLU Trade):** صفحة `/trade` ومكوّناتها في `src/components/trade/`. الدخول عبر `/api/trade/login` (كود جملة عليه `tradeAccess` + رقم الجوال)، والجلسة كوكي موقّع تتحقق منه `currentTrade()` في `src/lib/tradeAuth.ts` مقابل قاعدة البيانات في كل طلب. سعر الجملة يخرج فقط من `/api/trade/lookup`. تطبيع الباركود ومطابقة UPC/EAN في `src/lib/barcode.ts`، والماسح المشترك (التطبيق والأدمن) `BarcodeScanner.tsx`.
- **باركود المحلات:** رابط المحل `?src=CODE` يُحفظ في المتصفح (`SourceCapture.tsx`)، وكل طلب بعده ينحسب للمحل.
- **النصوص:** نصوص المتجر الثابتة في `src/lib/i18n.ts`، والنصوص اللي تتعدّل من الإعدادات في `config/brand.ts` (`defaultSettings`).
- **الروابط المطلقة:** `siteUrl()` يأخذ الدومين من الطلب نفسه، فروابط QR والفواتير تطابق الدومين اللي فُتح عليه الموقع.

## 6) قواعد الكتابة

- عربي أولًا واتجاه RTL: استخدم `ms-*`/`me-*`/`start`/`end` بدل `ml`/`mr`/`left`/`right`.
- الألوان من الهوية فقط: `lime` و `ink` و `accent` و `steel` و `soft` و `line` (في `tailwind.config.ts`).
- أي مدخلات API تتحقق بـ zod، وكل مسار تحت `api/admin` يستخدم `denyUnlessAdmin()`.
- تعديل الجداول: إضافات فقط (أعمدة أو جداول جديدة بقيم افتراضية). `prestart` يرفض أي تغيير يحذف بيانات.
- كل ملف جديد يبدأ بسطر الحقوق:
  `// Copyright (c) 2026 Abdullah Al-Sakni. All rights reserved. DYLLU Catalog.`
- قبل أي رفع: `npm run format && npm run typecheck && npm run build`.

## 7) الفحص الشامل

`scripts/check-site.mjs` يفتح كل صفحات المتجر بالعربي والإنجليزي، وصفحات لوحة التحكم وبوابة المندوب، على 15 جهاز: جوالات صغيرة وكبيرة (آيفون وأندرويد)، وتابلت، وشاشات كمبيوتر حتى 2560 بكسل.
ويتأكد في كل صفحة من:
- رمز الاستجابة صحيح
- ما فيه أخطاء JavaScript
- ما فيه تمرير أفقي (عناصر طالعة عن الشاشة)
- ما فيه صور مكسورة
- فيه زر سلة واحد بس ظاهر

```bash
npx playwright install chromium      # مرة واحدة
npm run build && npm start           # في نافذة
CHECK_URL=http://localhost:3000 \
CHECK_ADMIN_EMAIL=admin@example.com CHECK_ADMIN_PASSWORD=... \
CHECK_REP_PHONE=05XXXXXXXX CHECK_REP_PASSWORD=... \
npm run check:site                   # CHECK_QUICK=1 لفحص سريع على 4 أجهزة
```

- النتيجة ملخص بعدد الصفحات الناجحة والفاشلة، مع سبب كل فشل.
- `CHECK_DEVICES="iPhone SE,iPad"` يفحص أجهزة معيّنة بس.
- `CHECK_REPORT=report.json` يحفظ التقرير كامل.

## 8) دعم المتصفحات

- الأهداف معرّفة في `browserslist` داخل `package.json`: iOS/Safari 14+، Chrome و Edge 90+، Firefox 90+، Samsung Internet 14+.
- Next.js و autoprefixer يحوّلون الكود والـ CSS لهذه الأهداف تلقائيًا.
- **قيد معروف:** تصميم الإعلانات يستخدم وحدات الحاويات (`cqw`/`cqh`)، ويحتاج iOS 16+ أو Chrome 105+ أو Firefox 110+. في الأجهزة الأقدم يظهر الإعلان، بس مقاسات النص فيه أقل دقة.

## 9) النشر

- كل رفع على فرع `main` في GitHub ينشره Vercel تلقائيًا.
- `npm run build` يشغّل `scripts/prestart.mjs` أول: يحدّث الجداول، وينشئ أو يحدّث حساب الأدمن، ويكمل الترجمة.
- متغيرات Vercel المطلوبة: `DATABASE_URL`، `ADMIN_SESSION_SECRET`، `ADMIN_EMAIL`، `ADMIN_PASSWORD`. وفيه اختياري: `MAIN_DOMAIN` و `ANTHROPIC_API_KEY` و `S3_*`.

## 10) إضافة ميزة جديدة (خطوات مختصرة)

1. إذا تحتاج بيانات جديدة: عدّل `prisma/schema.prisma` (إضافة فقط)، ثم `npm run db:push`.
2. المنطق في `src/lib/`، وواجهة API في `src/app/api/...` مع zod و `denyUnlessAdmin()`.
3. الصفحة في `src/app/...`، والمكونات في `src/components/...` بنفس أسلوب الموجود.
4. نصوص المتجر بالعربي والإنجليزي (`i18n.ts`)، ونصوص الإدارة بالعربي فقط.
5. `npm run format && npm run typecheck && npm run build`، بعدها `npm run check:site`.
