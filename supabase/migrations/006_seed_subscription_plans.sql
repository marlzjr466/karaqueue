-- 006_seed_subscription_plans.sql
-- Idempotent: safe to re-run. Mirrors packages/shared/src/subscription.ts.

insert into public.subscription_plans
  (name, slug, max_queue_items, max_playlists, price_monthly, currency, is_active)
values
  ('Free', 'free', 15, 2, 0, 'usd', true),
  ('Premium', 'premium', 60, null, 9.99, 'usd', true)
on conflict (slug) do update
set
  name = excluded.name,
  max_queue_items = excluded.max_queue_items,
  max_playlists = excluded.max_playlists,
  price_monthly = excluded.price_monthly,
  currency = excluded.currency,
  is_active = excluded.is_active,
  updated_at = now();
