import { authenticate, activeSubscription } from '../_shared/auth';
import { json } from '../_shared/http';
import { getPlan } from '../_shared/plans';
import type { Env } from '../_shared/types';

export const onRequestPost = async ({ request, env }: { request: Request; env: Env }) => {
  try {
    const { user, admin, error } = await authenticate(request, env);
    if (!user) return json({ error }, 401);
    const body: any = await request.json().catch(() => ({}));
    const plan = getPlan(body.planId);
    if (!plan) return json({ error: 'الباقة المطلوبة غير موجودة.' }, 400);
    if (await activeSubscription(admin, user.id)) {
      return json({ error: 'عندك اشتراك فعّال حالياً، ما تحتاج تدفع مرة ثانية.' }, 409);
    }

    const { data: setting, error: settingError } = await admin
      .from('payment_settings').select('value').eq('key', 'usdt_trc20_address').maybeSingle();
    if (settingError) throw settingError;
    const wallet = String(setting?.value || '').trim();
    if (!/^T[1-9A-HJ-NP-Za-km-z]{33}$/.test(wallet)) {
      return json({ error: 'عنوان استلام USDT غير مضاف بعد. تواصل مع الدعم.' }, 503);
    }

    const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
    const { data: order, error: insertError } = await admin.from('crypto_payments').insert({
      user_id: user.id,
      plan_id: plan.id,
      amount_usdt: plan.price,
      wallet_address: wallet,
      status: 'pending',
      expires_at: expiresAt,
    }).select('id, plan_id, amount_usdt, wallet_address, status, expires_at, created_at').single();
    if (insertError) throw insertError;

    return json({
      orderId: order.id,
      planId: order.plan_id,
      planName: plan.name,
      amount: Number(order.amount_usdt),
      currency: 'USDT',
      network: 'TRC20',
      walletAddress: order.wallet_address,
      expiresAt: order.expires_at,
    });
  } catch (error) {
    console.error(error);
    return json({ error: 'تعذّر إنشاء طلب الدفع. تأكد من تنفيذ تحديث قاعدة البيانات.' }, 500);
  }
};
