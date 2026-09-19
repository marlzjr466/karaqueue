-- 003_create_subscriptions.sql

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  plan_id uuid not null references public.subscription_plans (id),
  provider text not null default 'none', -- 'none' | 'stripe' | future providers
  provider_customer_id text,
  provider_subscription_id text,
  status text not null default 'active'
    check (status in ('active', 'trialing', 'past_due', 'canceled', 'expired')),
  current_period_start timestamptz not null default now(),
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- One active-ish subscription record per user. Historical/canceled rows
  -- would need a different model (kept simple for Phase 1/7).
  unique (user_id)
);

comment on table public.subscriptions is
  'Each user has exactly one subscription row, defaulted to the Free plan on signup.';

create trigger set_subscriptions_updated_at
  before update on public.subscriptions
  for each row
  execute function public.set_updated_at();

-- Extend handle_new_user (from 002) to also create a default Free
-- subscription. Redefined here now that subscription_plans/subscriptions
-- exist, since migrations run in order.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  free_plan_id uuid;
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;

  select id into free_plan_id
  from public.subscription_plans
  where slug = 'free'
  limit 1;

  if free_plan_id is not null then
    insert into public.subscriptions (user_id, plan_id, status)
    values (new.id, free_plan_id, 'active')
    on conflict (user_id) do nothing;
  end if;

  return new;
end;
$$;
