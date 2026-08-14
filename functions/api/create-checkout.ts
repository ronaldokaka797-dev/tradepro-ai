import { authenticate, activeSubscription } from '../_shared/auth';
import { json } from '../_shared/http';
import { getPlan } from '../_shared/plans';
import { stripePost } from '../_shared/stripe';
import type { Env } from '../_shared/types';

export const onRequestPost = async ({ request, env }: { request: Request; env: Env }) => {
  try {
    const { user, admin, error } = await authenticate(request, env);
    if (!user) return json({ error }, 401);
    const body: any = await request.json().catch(() => ({}));
    const plan = getPlan(body.planId);
    if (!plan) return json({ error: 'الباقة المطلوبة غير موجودة.' }, 400);
    if (await activeSubscription(admin, user.id)) {
      return json({ error: 'عندك اشتراك فعّال حالياً. استخدم لوحة الحساب لإدارة الفوترة.' }, 409);
    }
    const origin = new URL(request.url).origin;
    const appUrl = (env.APP_URL || origin).replace(/\/$/, '');
    const session = await stripePost(env, 'checkout/sessions', {
      mode: 'subscription',
      customer_email: user.email || '',
      client_reference_id: user.id,
      'metadata[userId]': user.id,
      'metadata[planId]': plan.id,
      'subscription_data[metadata][userId]': user.id,
      'subscription_data[metadata][planId]': plan.id,
      'line_items[0][quantity]': '1',
      'line_items[0][price_data][currency]': 'usd',
      'line_items[0][price_data][unit_amount]': String(plan.price * 100),
      'line_items[0][price_data][recurring][interval]': plan.interval,
      'line_items[0][price_data][recurring][interval_count]': String(plan.intervalCount),
      'line_items[0][price_data][product_data][name]': `TradePro AI — ${plan.name}`,
      'line_items[0][price_data][product_data][description]': 'اشتراك نظام التداول مع التحديثات والدعم والتنزيل المحمي',
      allow_promotion_codes: 'true',
      locale: 'auto',
      success_url: `${appUrl}/?payment=success#dashboard`,
      cancel_url: `${appUrl}/?payment=cancelled#pricing`,
    });
    return json({ url: session.url });
  } catch (error) {
    console.error(error);
    return json({ error: error instanceof Error ? error.message : 'تعذّر فتح صفحة الدفع.' }, 500);
  }
};
