-- 024_update_premium_price.sql
-- Mirrors packages/shared/src/subscription.ts's PLAN_LIMITS.premium.
-- This column is informational (for display/reporting) — the actual
-- charge amount is whatever Price object STRIPE_PREMIUM_PRICE_ID points
-- to in Stripe, which must be updated separately in the Stripe Dashboard
-- (see docs/SUBSCRIPTIONS.md).

update public.subscription_plans
set price_monthly = 49.00,
    currency = 'php',
    updated_at = now()
where slug = 'premium';
