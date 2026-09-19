-- 001_create_subscription_plans.sql
-- Plan catalog. Source of truth for limits lives here (mirrored in
-- packages/shared/src/subscription.ts for client-side rendering/optimistic
-- checks — the database remains authoritative).

create table if not exists public.subscription_plans (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  max_queue_items integer not null,
  max_playlists integer, -- null = unlimited
  price_monthly numeric(10, 2) not null default 0,
  currency text not null default 'usd',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.subscription_plans is
  'Catalog of subscription plans (free, premium, ...). Read-only to clients.';
comment on column public.subscription_plans.max_playlists is
  'Maximum playlists a user on this plan may own. NULL means unlimited.';
