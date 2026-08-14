import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import type { Env } from './types';

export async function authenticate(req: Request, env: Env): Promise<{
  user: User | null;
  admin: SupabaseClient;
  error?: string;
}> {
  const admin = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const authorization = req.headers.get('Authorization');
  if (!authorization?.startsWith('Bearer ')) return { user: null, admin, error: 'يرجى تسجيل الدخول أولاً.' };
  const client = createClient(env.SUPABASE_URL, env.SUPABASE_PUBLISHABLE_KEY, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await client.auth.getUser();
  if (error || !data.user) return { user: null, admin, error: 'انتهت جلسة الدخول. سجّل دخولك مرة ثانية.' };
  return { user: data.user, admin };
}

export async function activeSubscription(admin: SupabaseClient, userId: string) {
  const { data, error } = await admin
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(20);
  if (error) throw error;
  const now = Date.now();
  return data?.find(row => !row.ends_at || new Date(row.ends_at).getTime() > now) || null;
}
