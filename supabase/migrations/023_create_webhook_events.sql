-- 023_create_webhook_events.sql
--
-- Records processed Stripe webhook event ids so a retried delivery
-- (Stripe retries on any non-2xx response) never applies the same event
-- twice. Written only by the service-role client from the webhook route
-- handler — never exposed to authenticated users.

create table if not exists public.webhook_events (
  id text primary key, -- the Stripe event id (evt_...)
  provider text not null default 'stripe',
  type text not null,
  created_at timestamptz not null default now()
);

comment on table public.webhook_events is
  'Processed payment-provider webhook event ids, for idempotency. Service-role only.';

alter table public.webhook_events enable row level security;

-- No policies at all: this table is never read or written by the
-- anon/authenticated roles, only by the service-role client (which
-- bypasses RLS entirely), so it's intentionally inaccessible to clients.
