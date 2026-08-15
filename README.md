# TradePro AI — Cloudflare + Supabase

نسخة جاهزة للنشر المجاني على Cloudflare Pages مع Supabase للحسابات وقاعدة البيانات والتخزين.

## البنية

- **Cloudflare Pages:** الواجهة والرابط العام.
- **Cloudflare Pages Functions:** الدفع، Webhook، وإصدار رابط التنزيل المحمي.
- **Supabase Auth:** التسجيل والدخول بالإيميل.
- **Supabase PostgreSQL:** الاشتراكات وسجل التنزيلات.
- **Supabase Storage:** ملف EXE داخل bucket خاص.
- **Stripe Checkout:** الدفع والاشتراكات المتجددة.

## 1. قاعدة البيانات

تم تجهيز الملف:

`supabase/migrations/202608150001_tradepro_schema.sql`

يُنفذ مرة واحدة من Supabase SQL Editor. ينشئ الجداول وسياسات RLS وbucket خاص باسم `downloads`.

## 2. رفع المشروع إلى GitHub

أنشئ Repository باسم `tradepro-ai`، ثم ارفع كل ملفات هذا المجلد. لا ترفع `node_modules` أو `dist`.

## 3. ربط Cloudflare Pages

1. من Cloudflare Dashboard اختر **Workers & Pages**.
2. اختر **Create application → Pages → Connect to Git**.
3. اختر repository: `tradepro-ai`.
4. إعدادات البناء:
   - Framework preset: `Vite`
   - Build command: `npm run build`
   - Build output directory: `dist`
   - Root directory: اتركها فارغة
5. اضغط **Save and Deploy**.

سيظهر رابط مجاني مثل:

`https://tradepro-ai.pages.dev`

## 4. متغيرات Cloudflare المطلوبة

من مشروع Pages افتح **Settings → Variables and Secrets** وأضف:

| الاسم | القيمة | النوع |
|---|---|---|
| `SUPABASE_URL` | `https://gmgryasxwqmolcckeloi.supabase.co` | Text |
| `SUPABASE_PUBLISHABLE_KEY` | الـPublishable Key | Text |
| `SUPABASE_SERVICE_ROLE_KEY` | Secret/Service-role key من Supabase | **Secret** |
| `PRODUCT_VERSION` | `1.0.0` | Text |
| `PRODUCT_RELEASE_DATE` | `2026-08-14` | Text |
| `APP_URL` | رابط `pages.dev` النهائي | Text |
| `STRIPE_SECRET_KEY` | مفتاح Stripe السري | **Secret** |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret | **Secret** |

لا تضع `SUPABASE_SERVICE_ROLE_KEY` أو مفاتيح Stripe داخل GitHub، ولا ترسلها لأي شخص. أضفها فقط كـSecret داخل Cloudflare.

بعد إضافة المتغيرات نفّذ **Retry deployment** أو **Create deployment**.

## 5. إعداد رابط تأكيد الإيميل

بعد الحصول على رابط Cloudflare:

1. Supabase Dashboard → Authentication → URL Configuration.
2. ضع رابط الموقع في **Site URL**.
3. أضف في **Redirect URLs**:
   - `https://tradepro-ai.pages.dev/**`
   - غيّر الاسم إذا أعطاك Cloudflare رابطاً مختلفاً.

## 6. رفع ملف EXE

1. Supabase Dashboard → Storage.
2. افتح bucket باسم `downloads`.
3. ارفع الملف بالاسم الدقيق:

`TradePro-AI-Setup.exe`

لا تجعل الـbucket عاماً. الموقع يصدر رابطاً مؤقتاً لمدة 60 ثانية فقط بعد التحقق من الاشتراك.

## 7. دفع USDT TRC20

نفّذ migration:

`supabase/migrations/202608150002_usdt_payments.sql`

ثم حدّد عنوان الاستلام العام من Supabase SQL Editor:

```sql
update public.payment_settings
set value = 'T_YOUR_TRC20_ADDRESS', updated_at = now()
where key = 'usdt_trc20_address';
```

الزبون يحوّل المبلغ، يلصق TXID، والموقع يتحقق تلقائياً عبر TronGrid من أن التحويل:

- مؤكد على شبكة TRON.
- لعملة USDT الأصلية على TRC20.
- وصل إلى عنوانك.
- يساوي مبلغ الباقة أو أكثر.
- لم يُستخدم لتفعيل طلب سابق.

يمكن إضافة `TRONGRID_API_KEY` كـSecret اختياري في Cloudflare لرفع حدود API. لا تضع Seed Phrase أو Private Key في الموقع أبداً.

## 8. إعداد Stripe (اختياري/قديم)

1. أضف `STRIPE_SECRET_KEY` إلى Cloudflare.
2. من Stripe Developers → Webhooks أضف endpoint:

`https://YOUR-PAGES-DOMAIN.pages.dev/api/stripe-webhook`

3. فعّل الأحداث:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.paid`
4. انسخ Signing secret إلى `STRIPE_WEBHOOK_SECRET` في Cloudflare.
5. فعّل Customer Portal من إعدادات Stripe Billing.

## تشغيل محلي

يتطلب Node.js 22:

```bash
npm install
npm run dev
```

اختبار build:

```bash
npm run build
```

## أمان

- مفتاح Supabase الظاهر في `src/config.js` هو Publishable Key مخصص للمتصفح.
- Service-role وStripe secrets لا توجد داخل الكود.
- RLS يمنع المستخدم من قراءة اشتراكات غيره.
- التنزيل يتطلب مستخدماً مسجلاً واشتراكاً فعالاً.
- bucket التنزيل خاص، والرابط الموقع مؤقت. 
