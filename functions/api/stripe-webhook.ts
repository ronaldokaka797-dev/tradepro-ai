import { createClient } from '@supabase/supabase-js';
import { json } from '../_shared/http';
import { afterDays, getPlan } from '../_shared/plans';
import { verifyStripeSignature } from '../_shared/stripe';
import type { Env } from '../_shared/types';

export const onRequestPost = async ({ request, env }: { request: Request; env: Env }) => {
  const payload = await request.text();
  if (!await verifyStripeSignature(env, payload, request.headers.get('stripe-signature'))) {
    return new Response('Invalid signature', { status: 400 });
  }
  try {
    const event = JSON.parse(payload);
    const object = event.data.object;
    const admin = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    if (event.type === 'checkout.session.completed' && object.payment_status !== 'unpaid') {
      const userId = object.metadata?.userId;
      const plan = getPlan(object.metadata?.planId);
      if (userId && plan) {
        const { error } = await admin.from('subscriptions').upsert({
          user_id: userId,
          plan_id: plan.id,
          status: 'active',
          stripe_customer_id: typeof object.customer === 'string' ? object.customer : object.customer?.id,
          stripe_subscription_id: typeof object.subscription === 'string' ? object.subscription : object.subscription?.id,
          stripe_checkout_id: object.id,
          starts_at: new Date().toISOString(),
          ends_at: afterDays(plan.durationDays),
        }, { onConflict: 'stripe_checkout_id' });
        if (error) throw error;
      }
    }

    if (event.type === 'customer.subscription.updated' || event.type === 'customer.subscription.deleted') {
      const activeStatuses = new Set(['active', 'trialing']);
      const status = event.type === 'customer.subscription.deleted' ? 'cancelled'
        : (activeStatuses.has(object.status) ? 'active' : object.status);
      const itemEnds = object.items?.data?.map((item: any) => item.current_period_end).filter(Boolean) || [];
      const periodEnd = itemEnds[0] || object.current_period_end;
      const update: Record<string, unknown> = { status };
      if (periodEnd) update.ends_at = new Date(Number(periodEnd) * 1000).toISOString();
      const { error } = await admin.from('subscriptions').update(update).eq('stripe_subscription_id', object.id);
      if (error) throw error;
    }

    if (event.type === 'invoice.paid') {
      const linked = object.parent?.type === 'subscription_details'
        ? object.parent.subscription_details?.subscription : object.subscription;
      const subscriptionId = typeof linked === 'object' ? linked?.id : linked;
      if (subscriptionId) {
        const periodEnd = object.lines?.data?.[0]?.period?.end;
        const update: Record<string, unknown> = { status: 'active' };
        if (periodEnd) update.ends_at = new Date(periodEnd * 1000).toISOString();
        const { error } = await admin.from('subscriptions').update(update).eq('stripe_subscription_id', subscriptionId);
        if (error) throw error;
      }
    }
    return json({ received: true });
  } catch (error) {
    console.error(error);
    return new Response('Webhook processing failed', { status: 500 });
  }
};
