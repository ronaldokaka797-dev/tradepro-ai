import { authenticate, activeSubscription } from '../_shared/auth';
import { json } from '../_shared/http';
import { getPlan } from '../_shared/plans';
import type { Env } from '../_shared/types';

const USDT_TRC20_CONTRACT = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t';

export const onRequestPost = async ({ request, env }: { request: Request; env: Env }) => {
  try {
    const { user, admin, error } = await authenticate(request, env);
    if (!user) return json({ error }, 401);
    const body: any = await request.json().catch(() => ({}));
    const orderId = String(body.orderId || '');
    const txid = String(body.txid || '').trim().toLowerCase();
    if (!/^[a-f0-9]{64}$/.test(txid)) return json({ error: 'أدخل TXID صحيحاً مكوّناً من 64 حرفاً.' }, 400);

    const { data: order, error: orderError } = await admin.from('crypto_payments')
      .select('*').eq('id', orderId).eq('user_id', user.id).maybeSingle();
    if (orderError) throw orderError;
    if (!order) return json({ error: 'طلب الدفع غير موجود.' }, 404);
    if (order.status === 'verified') return json({ verified: true, message: 'هذا التحويل مؤكد مسبقاً.' });
    if (order.status !== 'pending') return json({ error: 'طلب الدفع غير قابل للتأكيد.' }, 409);
    if (new Date(order.expires_at).getTime() < Date.now()) return json({ error: 'انتهت مدة الطلب. أنشئ طلباً جديداً.' }, 410);
    if (await activeSubscription(admin, user.id)) return json({ error: 'اشتراكك فعّال مسبقاً.' }, 409);
    if (!getPlan(order.plan_id)) return json({ error: 'الباقة غير صحيحة.' }, 400);

    const { data: used } = await admin.from('crypto_payments').select('id').eq('txid', txid).neq('id', order.id).maybeSingle();
    if (used) return json({ error: 'رقم التحويل هذا مستخدم مسبقاً.' }, 409);

    const minTimestamp = Math.max(0, new Date(order.created_at).getTime() - 120000);
    const endpoint = new URL(`https://api.trongrid.io/v1/accounts/${encodeURIComponent(order.wallet_address)}/transactions/trc20`);
    endpoint.searchParams.set('only_confirmed', 'true');
    endpoint.searchParams.set('only_to', 'true');
    endpoint.searchParams.set('limit', '200');
    endpoint.searchParams.set('order_by', 'block_timestamp,desc');
    endpoint.searchParams.set('min_timestamp', String(minTimestamp));
    endpoint.searchParams.set('contract_address', USDT_TRC20_CONTRACT);
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (env.TRONGRID_API_KEY) headers['TRON-PRO-API-KEY'] = env.TRONGRID_API_KEY;
    const tronResponse = await fetch(endpoint, { headers });
    if (!tronResponse.ok) return json({ error: 'تعذّر الاتصال بشبكة TRON. انتظر دقيقة وحاول مجدداً.' }, 502);
    const tronData: any = await tronResponse.json();
    const transaction = (tronData.data || []).find((item: any) => String(item.transaction_id || '').toLowerCase() === txid);
    if (!transaction) {
      return json({ verified: false, pending: true, error: 'التحويل غير ظاهر أو غير مؤكد بعد. انتظر 30–60 ثانية ثم أعد التحقق.' }, 202);
    }

    const contract = String(transaction.token_info?.address || '');
    const recipient = String(transaction.to || '');
    const decimals = Number(transaction.token_info?.decimals ?? 6);
    const rawValue = String(transaction.value || '0');
    const expectedUnits = BigInt(Math.round(Number(order.amount_usdt) * 10 ** decimals));
    let receivedUnits = 0n;
    try { receivedUnits = BigInt(rawValue); } catch { return json({ error: 'تعذّر قراءة مبلغ التحويل.' }, 422); }
    if (contract !== USDT_TRC20_CONTRACT) return json({ error: 'التحويل ليس USDT TRC20 الأصلي.' }, 422);
    if (recipient !== order.wallet_address) return json({ error: 'التحويل مرسل إلى عنوان مختلف.' }, 422);
    if (receivedUnits < expectedUnits) {
      const received = Number(receivedUnits) / 10 ** decimals;
      return json({ error: `المبلغ المستلم ${received} USDT وهو أقل من المطلوب ${order.amount_usdt} USDT.` }, 422);
    }
    if (Number(transaction.block_timestamp || 0) < minTimestamp) return json({ error: 'هذا التحويل أقدم من طلب الدفع.' }, 422);

    const { error: finalizeError } = await admin.rpc('finalize_usdt_payment', {
      p_order_id: order.id,
      p_txid: txid,
      p_sender: String(transaction.from || ''),
      p_raw: transaction,
    });
    if (finalizeError) {
      if (String(finalizeError.message).includes('used')) return json({ error: 'رقم التحويل مستخدم مسبقاً.' }, 409);
      throw finalizeError;
    }
    return json({ verified: true, message: 'تم تأكيد التحويل وتفعيل اشتراكك بنجاح.' });
  } catch (error) {
    console.error(error);
    return json({ error: 'تعذّر تأكيد التحويل حالياً. حاول مرة ثانية.' }, 500);
  }
};
