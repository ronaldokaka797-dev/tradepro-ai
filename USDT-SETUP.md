# تفعيل دفع USDT TRC20

## 1) نفّذ تحديث قاعدة البيانات

افتح Supabase → SQL Editor، والصق كل محتوى:

`supabase/migrations/202608150002_usdt_payments.sql`

ثم اضغط Run.

## 2) أضف عنوان محفظتك العام

من SQL Editor نفّذ الأمر التالي بعد استبدال العنوان:

```sql
update public.payment_settings
set value = 'T_YOUR_TRC20_ADDRESS', updated_at = now()
where key = 'usdt_trc20_address';
```

مثال الشكل الصحيح للعنوان: يبدأ بحرف T وطوله 34 حرفاً.

هذا عنوان استلام عام، وليس Seed Phrase أو Private Key. لا تضع العبارة السرية أو المفتاح الخاص في الموقع أو Cloudflare أو GitHub.

لتغيير العنوان مستقبلاً، نفّذ نفس أمر `update` بالعنوان الجديد.

## 3) ارفع ملفات التحديث

ارفع الملفات والمجلدات الموجودة في ZIP إلى جذر GitHub مع الحفاظ على المسارات، ثم Commit. Cloudflare ينشر التحديث تلقائياً.

## 4) آلية التأكيد

- يختار المستخدم باقته.
- يظهر له المبلغ وعنوان TRC20.
- يحوّل USDT ويلصق TXID.
- الخادم يطلب فقط التحويلات المؤكدة من TronGrid.
- يتحقق من عقد USDT الأصلي، عنوان المستلم، المبلغ، وقت الطلب، وعدم استخدام TXID سابقاً.
- إذا نجح التحقق، يفعّل الاشتراك تلقائياً.

## 5) TronGrid API Key (اختياري لكن مستحسن عند زيادة الاستخدام)

أضف في Cloudflare Production → Variables and Secrets:

- الاسم: `TRONGRID_API_KEY`
- القيمة: API Key من TronGrid
- النوع: Secret / Encrypted

بدون المفتاح يعمل الفحص العام، لكن قد تكون حدود الطلبات أقل.
