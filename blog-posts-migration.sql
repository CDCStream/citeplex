-- Citeplex blog: run in Supabase SQL Editor or via migration pipeline
-- Public read for published posts; writes via service role (webhook / admin API)

create table if not exists public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text,
  content text,
  author text,
  image text,
  tags text[] not null default array[]::text[],
  status text not null default 'draft' check (status in ('draft', 'published')),
  published_at timestamptz,
  updated_at timestamptz not null default now()
);

create index if not exists blog_posts_published_at_idx
  on public.blog_posts (published_at desc nulls last)
  where status = 'published';

create index if not exists blog_posts_status_idx on public.blog_posts (status);

alter table public.blog_posts enable row level security;

-- Anonymous + authenticated users: only published posts
create policy "blog_posts_select_published"
  on public.blog_posts
  for select
  to anon, authenticated
  using (status = 'published');

-- No insert/update/delete for anon/authenticated (service role bypasses RLS)

comment on table public.blog_posts is 'Marketing blog posts; Outrank webhook uses service role.';
