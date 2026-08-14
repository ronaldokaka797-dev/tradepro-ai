import { authenticate, activeSubscription } from '../_shared/auth';
import { json } from '../_shared/http';
import type { Env } from '../_shared/types';

const FILE = 'TradePro-AI-Setup.exe';
export const onRequestPost = async ({ request, env }: { request: Request; env: Env }) => {
  try {
    const { user, admin, error } = await authenticate(request, env);
    if (!user) return json({ error }, 401);
    if (!await activeSubscription(admin, user.id)) {
      return json({ error: 'تحتاج إلى اشتراك فعّال حتى تتمكن من تنزيل النظام.' }, 403);
    }
    const { data: files, error: listError } = await admin.storage.from('downloads').list('', { search: FILE, limit: 10 });
    if (listError) throw listError;
    if (!files?.some(item => item.name === FILE)) return json({ error: 'ملف النظام سيُرفع قريباً. اشتراكك محفوظ.' }, 404);
    const { data, error: signError } = await admin.storage.from('downloads').createSignedUrl(FILE, 60, { download: FILE });
    if (signError || !data?.signedUrl) throw signError || new Error('Signing failed');
    await admin.from('download_logs').insert({
      user_id: user.id,
      ip: request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for'),
      user_agent: (request.headers.get('user-agent') || '').slice(0, 500),
    });
    return json({ url: data.signedUrl, expiresIn: 60 });
  } catch (error) {
    console.error(error);
    return json({ error: 'تعذّر تجهيز رابط التنزيل.' }, 500);
  }
};
