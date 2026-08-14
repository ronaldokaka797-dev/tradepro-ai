import type { Env } from './types';

export async function stripePost(env: Env, path: string, params: Record<string, string>) {
  if (!env.STRIPE_SECRET_KEY) throw new Error('بوابة Stripe غير مهيأة بعد.');
  const response = await fetch(`https://api.stripe.com/v1/${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams(params),
  });
  const data: any = await response.json();
  if (!response.ok) throw new Error(data?.error?.message || 'تعذّر الاتصال ببوابة الدفع.');
  return data;
}

function toHex(bytes: ArrayBuffer) {
  return [...new Uint8Array(bytes)].map(value => value.toString(16).padStart(2, '0')).join('');
}
function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
export async function verifyStripeSignature(env: Env, payload: string, header: string | null) {
  if (!env.STRIPE_WEBHOOK_SECRET || !header) return false;
  const parts = header.split(',').map(part => part.split('='));
  const timestamp = parts.find(([key]) => key === 't')?.[1];
  const signatures = parts.filter(([key]) => key === 'v1').map(([, value]) => value);
  if (!timestamp || !signatures.length || Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) return false;
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(env.STRIPE_WEBHOOK_SECRET),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'],
  );
  const digest = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${timestamp}.${payload}`));
  const expected = toHex(digest);
  return signatures.some(signature => safeEqual(signature, expected));
}
