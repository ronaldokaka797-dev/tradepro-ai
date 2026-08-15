-- USDT TRC20 automatic payment verification

create table if not exists public.payment_settings (
  key text primary key,
  value text not null default '',
  updated_at timestamptz not null default now()
);

insert into public.payment_settings (key, value)
values ('usdt_trc20_address', '')
on conflict (key) do nothing;

create table if not exists public.crypto_payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_id text not null check (plan_id in ('monthly', 'quarterly', 'yearly')),
  amount_usdt numeric(12,6) not null check (amount_usdt > 0),
  wallet_address text not null,
  txid text,
  sender_address text,
  status text not null default 'pending' check (status in ('pending', 'verified', 'expired', 'rejected')),
  raw_payload jsonb,
  expires_at timestamptz not null,
  verified_at timestamptz,
  created_at timestamptz not null default now()
);

create unique index if not exists crypto_payments_txid_unique
  on public.crypto_payments(txid) where txid is not null;
create index if not exists crypto_payments_user_idx
  on public.crypto_payments(user_id, created_at desc);

alter table public.payment_settings enable row level security;
alter table public.crypto_payments enable row level security;

revoke all on public.payment_settings from anon, authenticated;
revoke all on public.crypto_payments from anon;
grant select on public.crypto_payments to authenticated;

drop policy if exists "Users read own crypto payments" on public.crypto_payments;
create policy "Users read own crypto payments"
on public.crypto_payments for select
to authenticated
using ((select auth.uid()) = user_id);

create or replace function public.finalize_usdt_payment(
  p_order_id uuid,
  p_txid text,
  p_sender text,
  p_raw jsonb
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  payment public.crypto_payments%rowtype;
  duration_interval interval;
begin
  select * into payment from public.crypto_payments where id = p_order_id for update;
  if not found then raise exception 'payment not found'; end if;
  if payment.status <> 'pending' then raise exception 'payment not pending'; end if;
  if exists (select 1 from public.crypto_payments where txid = p_txid and id <> p_order_id) then
    raise exception 'txid already used';
  end if;

  duration_interval := case payment.plan_id
    when 'monthly' then interval '30 days'
    when 'quarterly' then interval '90 days'
    when 'yearly' then interval '365 days'
    else interval '0 days'
  end;
  if duration_interval = interval '0 days' then raise exception 'invalid plan'; end if;

  update public.crypto_payments
  set txid = p_txid, sender_address = p_sender, raw_payload = p_raw,
      status = 'verified', verified_at = now()
  where id = p_order_id;

  insert into public.subscriptions (user_id, plan_id, status, starts_at, ends_at)
  values (payment.user_id, payment.plan_id, 'active', now(), now() + duration_interval);
end;
$$;

revoke all on function public.finalize_usdt_payment(uuid, text, text, jsonb) from public, anon, authenticated;
grant execute on function public.finalize_usdt_payment(uuid, text, text, jsonb) to service_role;

-- بعد إضافة عنوانك العام، نفّذ هذا الأمر مع استبدال العنوان:
-- update public.payment_settings set value = 'T_YOUR_TRC20_ADDRESS' where key = 'usdt_trc20_address';
