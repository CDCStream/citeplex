-- Citeplex.io: Supabase Migration
-- Converts Prisma/SQLite schema to PostgreSQL

-- Users table (linked to Supabase auth.users)
create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  auth_id uuid unique references auth.users(id) on delete cascade,
  email text unique not null,
  name text,
  image text,
  plan text not null default 'free',
  stripe_customer_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Domains
create table if not exists public.domains (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  url text not null,
  brand_name text not null,
  industry text,
  description text,
  primary_country text,
  target_countries text,
  scan_status text not null default 'idle',
  first_scan_done boolean not null default false,
  last_scan_started_at timestamptz,
  brand_voice jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_domains_user_id on public.domains(user_id);

-- Competitors
create table if not exists public.competitors (
  id uuid primary key default gen_random_uuid(),
  domain_id uuid not null references public.domains(id) on delete cascade,
  url text not null,
  brand_name text not null,
  created_at timestamptz not null default now()
);
create index if not exists idx_competitors_domain_id on public.competitors(domain_id);

-- Prompts
create table if not exists public.prompts (
  id uuid primary key default gen_random_uuid(),
  domain_id uuid not null references public.domains(id) on delete cascade,
  text text not null,
  category text,
  language text,
  country text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists idx_prompts_domain_id on public.prompts(domain_id);

-- Scan Results
create table if not exists public.scan_results (
  id uuid primary key default gen_random_uuid(),
  domain_id uuid not null references public.domains(id) on delete cascade,
  prompt_id uuid not null references public.prompts(id) on delete cascade,
  ai_engine text not null,
  run_index integer not null default 0,
  response text not null,
  brand_mentioned boolean not null,
  position integer,
  scanned_at timestamptz not null default now()
);
create index if not exists idx_scan_results_domain_scanned on public.scan_results(domain_id, scanned_at);
create index if not exists idx_scan_results_prompt on public.scan_results(prompt_id);

-- Competitor Scan Results
create table if not exists public.competitor_scan_results (
  id uuid primary key default gen_random_uuid(),
  competitor_id uuid not null references public.competitors(id) on delete cascade,
  prompt_id uuid not null references public.prompts(id) on delete cascade,
  ai_engine text not null,
  run_index integer not null default 0,
  brand_mentioned boolean not null,
  mention_count integer not null default 0,
  position integer,
  scanned_at timestamptz not null default now()
);
create index if not exists idx_comp_scan_results_comp_scanned on public.competitor_scan_results(competitor_id, scanned_at);
create index if not exists idx_comp_scan_results_prompt on public.competitor_scan_results(prompt_id);

-- Recommendations
create table if not exists public.recommendations (
  id uuid primary key default gen_random_uuid(),
  domain_id uuid not null references public.domains(id) on delete cascade,
  title text not null,
  description text not null,
  priority text not null default 'medium',
  status text not null default 'pending',
  created_at timestamptz not null default now()
);
create index if not exists idx_recommendations_domain_id on public.recommendations(domain_id);

-- Alerts
create table if not exists public.alerts (
  id uuid primary key default gen_random_uuid(),
  domain_id uuid not null references public.domains(id) on delete cascade,
  type text not null,
  message text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists idx_alerts_domain_id on public.alerts(domain_id);

-- Auto-update updated_at trigger
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_updated_at_users
  before update on public.users
  for each row execute function public.handle_updated_at();

create trigger set_updated_at_domains
  before update on public.domains
  for each row execute function public.handle_updated_at();

-- Auto-create user profile on auth signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (auth_id, email, name, image)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- User Activities (activity log)
create table if not exists public.user_activities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  action text not null,
  resource_type text,
  resource_id text,
  metadata jsonb default '{}',
  ip_address text,
  user_agent text,
  created_at timestamptz not null default now()
);
create index if not exists idx_user_activities_user on public.user_activities(user_id, created_at desc);
create index if not exists idx_user_activities_action on public.user_activities(action);

-- Billing History
create table if not exists public.billing_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  type text not null,              -- 'subscription_created', 'subscription_updated', 'subscription_canceled', 'payment_success', 'payment_failed'
  plan text not null,              -- 'starter', 'growth', 'pro', 'business', 'enterprise', 'free'
  amount integer not null default 0, -- cents
  currency text not null default 'usd',
  status text not null default 'completed', -- 'completed', 'pending', 'failed', 'refunded'
  polar_subscription_id text,
  polar_customer_id text,
  description text,
  metadata jsonb default '{}',
  created_at timestamptz not null default now()
);
create index if not exists idx_billing_history_user on public.billing_history(user_id, created_at desc);

-- Domain Verifications (email-based ownership proof)
create table if not exists public.domain_verifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  domain_url text not null,
  email text not null,
  code text not null,
  attempts integer not null default 0,
  expires_at timestamptz not null,
  verified_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists idx_domain_verifications_lookup
  on public.domain_verifications(domain_url, email, code);

alter table public.domains
  add column if not exists verified boolean not null default false;

update public.domains set verified = true where verified = false;

-- Sentiment column on scan_results
alter table public.scan_results
  add column if not exists sentiment text
  check (sentiment in ('positive', 'negative', 'neutral'));

-- Citations column on scan_results
alter table public.scan_results
  add column if not exists citations jsonb not null default '[]';

-- Scan Insights (LLM-generated analysis per scan result)
create table if not exists public.scan_insights (
  id uuid primary key default gen_random_uuid(),
  scan_result_id uuid not null references public.scan_results(id) on delete cascade,
  domain_id uuid not null references public.domains(id) on delete cascade,
  prompt_id uuid not null references public.prompts(id) on delete cascade,
  ai_engine text not null,
  insight jsonb not null default '{}',
  created_at timestamptz not null default now(),
  unique(scan_result_id)
);
create index if not exists idx_scan_insights_domain on public.scan_insights(domain_id);

-- ============================================================
-- Content Platform tables
-- ============================================================

-- Cached Ahrefs keyword data per prompt
create table if not exists public.keyword_metrics (
  id uuid primary key default gen_random_uuid(),
  prompt_id uuid not null references public.prompts(id) on delete cascade,
  keyword text not null,
  country text not null default 'us',
  volume integer,
  difficulty integer,
  cpc integer,
  traffic_potential integer,
  global_volume integer,
  parent_topic text,
  fetched_at timestamptz not null default now(),
  unique(prompt_id, keyword, country)
);
create index if not exists idx_keyword_metrics_prompt on public.keyword_metrics(prompt_id);

-- Monthly content calendar entries
create table if not exists public.content_plans (
  id uuid primary key default gen_random_uuid(),
  domain_id uuid not null references public.domains(id) on delete cascade,
  title text not null,
  keyword text,
  article_type text check (article_type in ('guide', 'how-to', 'listicle', 'comparison', 'explainer', 'round-up')),
  scheduled_date date not null,
  status text not null default 'planned' check (status in ('planned', 'writing', 'review', 'published')),
  article_id uuid,
  created_at timestamptz not null default now()
);
create index if not exists idx_content_plans_domain on public.content_plans(domain_id);
create index if not exists idx_content_plans_date on public.content_plans(domain_id, scheduled_date);

-- AI-generated articles
create table if not exists public.articles (
  id uuid primary key default gen_random_uuid(),
  domain_id uuid not null references public.domains(id) on delete cascade,
  content_plan_id uuid references public.content_plans(id) on delete set null,
  title text not null,
  slug text not null,
  meta_description text,
  cover_image text,
  content text,
  word_count integer not null default 0,
  target_keyword text,
  secondary_keywords text[] not null default '{}',
  tags text[] not null default '{}',
  outline jsonb not null default '[]',
  research_data jsonb not null default '{}',
  faq jsonb not null default '[]',
  seo_score integer,
  status text not null default 'draft' check (status in ('draft', 'review', 'approved', 'published')),
  published_at timestamptz,
  published_to jsonb not null default '[]',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_articles_domain on public.articles(domain_id);
create index if not exists idx_articles_status on public.articles(domain_id, status);

-- FK from content_plans.article_id -> articles.id (deferred to avoid circular dependency)
alter table public.content_plans
  add constraint fk_content_plans_article
  foreign key (article_id) references public.articles(id) on delete set null;

-- Publishing integrations (connected platforms per domain)
create table if not exists public.publish_integrations (
  id uuid primary key default gen_random_uuid(),
  domain_id uuid not null references public.domains(id) on delete cascade,
  platform text not null check (platform in (
    'wordpress', 'notion', 'webflow', 'shopify', 'wix',
    'ghost', 'framer', 'feather', 'webhook', 'citeplex'
  )),
  config jsonb not null default '{}',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique(domain_id, platform)
);
create index if not exists idx_publish_integrations_domain on public.publish_integrations(domain_id);

-- Backlink Exchange: site listings
create table if not exists public.backlink_listings (
  id uuid primary key default gen_random_uuid(),
  domain_id uuid not null unique references public.domains(id) on delete cascade,
  url text not null,
  brand_name text not null,
  industry text,
  dr_score integer not null default 0,
  accepts_guest_posts boolean not null default true,
  preferred_niches text[] not null default '{}',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists idx_backlink_listings_active on public.backlink_listings(is_active, dr_score desc);
create index if not exists idx_backlink_listings_industry on public.backlink_listings(industry) where is_active = true;

-- Backlink Exchange: match requests
create table if not exists public.backlink_matches (
  id uuid primary key default gen_random_uuid(),
  requester_listing_id uuid not null references public.backlink_listings(id) on delete cascade,
  target_listing_id uuid not null references public.backlink_listings(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'rejected', 'completed')),
  link_url text,
  created_at timestamptz not null default now(),
  unique(requester_listing_id, target_listing_id)
);
create index if not exists idx_backlink_matches_target on public.backlink_matches(target_listing_id, status);
create index if not exists idx_backlink_matches_requester on public.backlink_matches(requester_listing_id);

-- Keyword planning metadata on content_plans
alter table public.content_plans
  add column if not exists keyword_data jsonb default '{}',
  add column if not exists source text default 'manual',
  add column if not exists priority integer default 0;

comment on column public.content_plans.keyword_data is 'Ahrefs metrics + analysis data (volume, difficulty, cpc, traffic_potential, reasoning)';
comment on column public.content_plans.source is 'How keyword was chosen: competitor_gap, ahrefs_opportunity, backlink_potential, trending, manual';
comment on column public.content_plans.priority is 'Priority score 0-100 for scheduling order';

-- Ensure brand_voice column exists (may be missing if table was created before this column was added)
alter table public.domains
  add column if not exists brand_voice jsonb default null;

-- Track keyword planning status per domain
alter table public.domains
  add column if not exists keyword_plan_status text default null,
  add column if not exists keyword_plan_updated_at timestamptz default null;

-- Article generation preferences (CTA, FAQ, etc.)
alter table public.domains
  add column if not exists article_preferences jsonb default '{"includeCta": true, "includeFaq": true}'::jsonb;

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

-- Writing Examples (showcase articles for marketing pages)
create table if not exists public.writing_examples (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  brand_name text not null,
  brand_url text not null,
  brand_industry text not null,
  title text not null,
  keyword text not null,
  meta_description text,
  content text not null,
  cover_image_url text,
  word_count int default 0,
  created_at timestamptz default now()
);

-- Insert demo user for development
insert into public.users (email, name, plan)
values ('demo@citeplex.io', 'Demo User', 'starter')
on conflict (email) do nothing;
