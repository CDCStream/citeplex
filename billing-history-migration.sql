-- Run this in Supabase Dashboard > SQL Editor

create table if not exists public.billing_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  type text not null,
  plan text not null,
  amount integer not null default 0,
  currency text not null default 'usd',
  status text not null default 'completed',
  polar_subscription_id text,
  polar_customer_id text,
  description text,
  metadata jsonb default '{}',
  created_at timestamptz not null default now()
);

create index if not exists idx_billing_history_user on public.billing_history(user_id, created_at desc);
