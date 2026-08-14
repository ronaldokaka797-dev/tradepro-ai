import { authenticate } from '../_shared/auth';
import { json } from '../_shared/http';
import { stripePost } from '../_shared/stripe';
import type { Env } from '../_shared/types';

export const onRequestPost = async ({ request, env }: { request: Request; env: Env }) => {
  try {
    const { user, admin, error } = await authenticate(request, env);
    if (!user) return json({ error }, 401);
    const { data, error: dbError } = await admin.from('subscriptions')
      .select('stripe_customer_id').eq('user_id', user.id)
      .not('stripe_customer_id', 'is', null).order('created_at', { ascending: false })
      .limit(1).maybeSingle();
    if (dbError) throw dbError;
    if (!data?.stripe_customer_id) return json({ error: 'لا يوجد اشتراك Stripe مرتبط بهذا الحساب.' }, 404);
    const appUrl = (env.APP_URL || new URL(request.url).origin).replace(/\/$/, '');
    const portal = await stripePost(env, 'billing_portal/sessions', {
      customer: data.stripe_customer_id,
      return_url: `${appUrl}/#dashboard`,
    });
    return json({ url: portal.url });
  } catch (error) {
    console.error(error);
    return json({ error: error instanceof Error ? error.message : 'تعذّر فتح إدارة الاشتراك.' }, 500);
  }
};
