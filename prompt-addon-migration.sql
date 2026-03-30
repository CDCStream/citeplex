-- Prompt Addon Subscriptions: stackable monthly prompt packs (50, 100, 250)
create table if not exists public.prompt_addon_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  tier text not null,
  prompt_count int not null,
  status text not null default 'active',
  polar_subscription_id text,
  polar_customer_id text,
  created_at timestamptz not null default now(),
  canceled_at timestamptz
);

create index if not exists idx_prompt_addon_user on public.prompt_addon_subscriptions(user_id);
create index if not exists idx_prompt_addon_status on public.prompt_addon_subscriptions(user_id, status);

comment on table public.prompt_addon_subscriptions is 'Stackable monthly prompt add-on subscriptions (50/100/250 extra prompts)';
comment on column public.prompt_addon_subscriptions.tier is 'addon_50, addon_100, addon_250';
comment on column public.prompt_addon_subscriptions.status is 'active, canceled, expired';
