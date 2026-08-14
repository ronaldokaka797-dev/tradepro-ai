-- TradePro AI database schema
-- Run this once from Supabase Dashboard > SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_id text not null check (plan_id in ('monthly', 'quarterly', 'yearly')),
  status text not null default 'incomplete',
  stripe_customer_id text,
  stripe_subscription_id text,
  stripe_checkout_id text,
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists subscriptions_stripe_subscription_unique
  on public.subscriptions(stripe_subscription_id)
  where stripe_subscription_id is not null;
create unique index if not exists subscriptions_stripe_checkout_unique
  on public.subscriptions(stripe_checkout_id)
  where stripe_checkout_id is not null;
create index if not exists subscriptions_user_status_idx
  on public.subscriptions(user_id, status, created_at desc);

create table if not exists public.download_logs (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  ip text,
  user_agent text,
  created_at timestamptz not null default now()
);
create index if not exists download_logs_user_idx on public.download_logs(user_id, created_at desc);

alter table public.subscriptions enable row level security;
alter table public.download_logs enable row level security;

-- A signed-in user can read only their own subscription state.
drop policy if exists "Users read own subscriptions" on public.subscriptions;
create policy "Users read own subscriptions"
on public.subscriptions for select
to authenticated
using ((select auth.uid()) = user_id);

-- Download logs are written only by the service-role Edge Function.
-- Users intentionally have no direct policy for this table.

grant select on public.subscriptions to authenticated;
revoke all on public.subscriptions from anon;
revoke all on public.download_logs from anon, authenticated;

-- Private bucket for the EXE. Files are delivered only through a 60-second signed URL.
insert into storage.buckets (id, name, public, file_size_limit)
values ('downloads', 'downloads', false, 1073741824)
on conflict (id) do update set public = false;
