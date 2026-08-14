import { authenticate } from '../_shared/auth';
import { json } from '../_shared/http';
import type { Env } from '../_shared/types';

const FILE = 'TradePro-AI-Setup.exe';
export const onRequestPost = async ({ request, env }: { request: Request; env: Env }) => {
  try {
    const { user, admin, error } = await authenticate(request, env);
    if (!user) return json({ error }, 401);
    const { data, error: listError } = await admin.storage.from('downloads').list('', { search: FILE, limit: 10 });
    if (listError) throw listError;
    const file = data?.find(item => item.name === FILE);
    return json({
      version: env.PRODUCT_VERSION || '1.0.0',
      releasedAt: env.PRODUCT_RELEASE_DATE || '2026-08-14',
      available: Boolean(file),
      size: file?.metadata?.size || null,
      updatedAt: file?.updated_at || null,
    });
  } catch (error) {
    console.error(error);
    return json({ error: 'تعذّر قراءة معلومات ملف النظام.' }, 500);
  }
};
