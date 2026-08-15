import type { Env } from '../_shared/types';

export const onRequestGet = async ({ env }: { env: Env }) => {
  return new Response(JSON.stringify({
    ok: true,
    supabaseUrl: Boolean(env.SUPABASE_URL),
    publishableKey: Boolean(env.SUPABASE_PUBLISHABLE_KEY),
    serviceRoleKey: Boolean(env.SUPABASE_SERVICE_ROLE_KEY),
    appUrl: Boolean(env.APP_URL),
    stripeKey: Boolean(env.STRIPE_SECRET_KEY)
  }), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store'
    }
  });
};
Add safe configuration check
