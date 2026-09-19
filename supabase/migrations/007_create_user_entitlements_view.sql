-- 007_create_user_entitlements_view.sql
-- Convenience view joining a user's subscription to their plan limits.
-- Used by the SubscriptionService (server-side) in later phases to avoid
-- repeating this join everywhere. RLS on the underlying tables still
-- applies to who can query which rows.

create or replace view public.user_entitlements
with (security_invoker = true)
as
select
  s.user_id,
  p.slug as plan_slug,
  p.name as plan_name,
  p.max_queue_items,
  p.max_playlists,
  s.status,
  s.current_period_end,
  s.cancel_at_period_end
from public.subscriptions s
join public.subscription_plans p on p.id = s.plan_id;

comment on view public.user_entitlements is
  'Joins subscriptions to subscription_plans for convenient entitlement lookups.';
