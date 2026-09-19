-- 004_enable_rls.sql

alter table public.profiles enable row level security;
alter table public.subscriptions enable row level security;
alter table public.subscription_plans enable row level security;

-- Never disable RLS on these tables, even in development.
