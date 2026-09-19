# Subscriptions

## Provider abstraction

Payment logic is isolated behind a `PaymentProvider` interface
(`apps/web/lib/payments/types.ts`) so the rest of the app never imports
Stripe directly:

```
PaymentProvider
├── createCheckoutSession()
├── createBillingPortalSession()
├── cancelSubscription()
├── getSubscription()
├── handleWebhook()
└── verifyPayment()
```

`StripeProvider` (`apps/web/lib/payments/stripe-provider.ts`) is the only
file in the app that imports the `stripe` package. Everything else calls
`getPaymentProvider()` from `apps/web/lib/payments/index.ts`. Swapping
providers later means writing a new class implementing `PaymentProvider`
and changing one line in that factory.

## Setup

1. Create a Stripe account and a recurring monthly Price for the Premium
   plan (currently ₱49.00/mo — see `packages/shared/src/subscription.ts`,
   the single source of truth this app's UI reads price/currency from).
2. Set the following server environment variables (see `.env.example`):
   ```
   STRIPE_SECRET_KEY=sk_...
   STRIPE_WEBHOOK_SECRET=whsec_...       # from the Stripe CLI or Dashboard webhook config
   STRIPE_PREMIUM_PRICE_ID=price_...
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_...
   ```
3. Point a webhook endpoint at `<your-domain>/api/webhooks/stripe`,
   subscribed to at least:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. For local development, use the Stripe CLI:
   ```
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```
   which prints a `whsec_...` value to use as `STRIPE_WEBHOOK_SECRET`.

## Upgrade flow

1. `/subscription` renders an **Upgrade to Premium** button for Free
   users (`UpgradeButton`, `components/subscription/subscription-buttons.tsx`).
2. It calls the `createCheckoutSessionAction` Server Action, which asks
   `StripeProvider` for a Checkout Session (`mode: "subscription"`) and
   redirects to Stripe's hosted checkout page. The user id is attached as
   `client_reference_id` **and** `subscription_data.metadata.user_id`, so
   Stripe automatically carries `metadata.user_id` onto the resulting
   Subscription object.
3. **The action itself never writes to `subscriptions`** — the payment
   isn't confirmed at that point. The actual upgrade happens when the
   `customer.subscription.created` webhook fires.
4. Stripe redirects back to `/subscription?checkout=success` (or
   `?checkout=canceled`); `CheckoutResultToast` shows a toast and cleans
   the query param off the URL.

## Webhook handling

`app/api/webhooks/stripe/route.ts`:

1. Reads the **raw** request body (`request.text()`) — required for
   Stripe's signature verification; the body must never be parsed as
   JSON first.
2. Verifies the `stripe-signature` header via `StripeProvider.constructEvent`.
   An invalid signature returns `400` without touching the database.
3. **Idempotency**: inserts `event.id` into `webhook_events` (a
   service-role-only table, see `docs/DATABASE.md`) before processing.
   Stripe retries webhook deliveries on any non-2xx response, so a
   duplicate delivery hits the table's primary key and is treated as
   "already handled" without redoing work.
4. Dispatches by event type:
   - `customer.subscription.created` / `.updated` →
     `syncSubscriptionFromStripe` upserts the `subscriptions` row: reads
     `metadata.user_id`, maps Stripe's status to ours, and sets
     `plan_id` to Premium if the status is `active`/`trialing` — Free
     otherwise (covers `past_due`, `unpaid`, etc. automatically reverting
     access).
   - `customer.subscription.deleted` → `downgradeToFree` sets `plan_id`
     back to Free and clears `provider_subscription_id`.
   - Anything else is acknowledged (200) but ignored, so Stripe doesn't
     keep retrying events we intentionally don't act on.

All of this runs through the **service-role** Supabase client
(`lib/supabase/service-role.ts`) since a webhook call isn't tied to a
logged-in user's session — this is one of the few places in the app
where that's the correct choice (see `docs/AUTH.md`).

## Cancellation

There's no custom cancel UI — **Manage billing** (`ManageBillingButton`)
opens Stripe's own hosted Billing Portal
(`createBillingPortalSessionAction`), where the user can cancel, update
their payment method, or view invoices using Stripe's UI. Canceling there
sets `cancel_at_period_end: true` on the Stripe subscription, which fires
a `customer.subscription.updated` webhook (still `status: "active"`, so
the user keeps Premium access) — `/subscription` shows a "cancels on
{date}" notice in that case. When the period actually ends, Stripe sends
`customer.subscription.deleted` and the account reverts to Free.

The `PaymentProvider.cancelSubscription()` method also exists for a
direct, non-portal cancel path (`cancel_at_period_end: true` via the
API) if a custom in-app cancel button is wanted later — not currently
wired to any UI.

## Local development — use the Stripe CLI, not the Dashboard

The Stripe **Dashboard**'s webhook endpoint setup (Developers → Webhooks
→ Add endpoint) requires an HTTPS URL — it will not accept
`http://localhost:3000/...`. That's expected and not a bug. For local
development, use the **Stripe CLI** instead, which doesn't need a public
HTTPS URL at all:

```bash
stripe login
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

`stripe listen` prints a `whsec_...` value the moment it starts — copy
that into `STRIPE_WEBHOOK_SECRET` in `.env.local` (it's a different value
each time you restart `stripe listen`, unless you use `--use-configured-webhooks`
or fix it another way). Leave that command running in a terminal while
you test locally; it forwards real Stripe events to your local server.

Only switch to a Dashboard-configured webhook endpoint once you have a
real HTTPS URL (a deployed preview/production URL, or a tunnel like
`ngrok`/`cloudflared` pointed at your local server).

## Troubleshooting

### Payment succeeded in Stripe, but the app still shows Free

Two independent fixes for this, both shipped:

**1. Active reconciliation on return from Checkout** (the main fix). The
original design relied entirely on the async webhook to write the DB.
Stripe redirects the browser back to `success_url` the instant checkout
completes, which can happen _before_ the webhook is delivered and
processed — especially with `stripe listen` forwarding locally. The very
first render after returning could legitimately still show "Free", and
if the webhook was delayed, misconfigured, or never arrived, it stayed
that way indefinitely.

`/subscription` now calls `reconcileCheckoutSession()`
(`lib/payments/reconcile-checkout.ts`) **before** reading entitlements
whenever it's loaded with `?checkout=success&session_id=...` (Stripe
substitutes the literal `{CHECKOUT_SESSION_ID}` template in the
success URL itself — see `StripeProvider.createCheckoutSession`). That
function fetches the Checkout Session's Subscription directly from
Stripe and upserts it into `subscriptions` synchronously, right there in
the page's server render — using the same `syncSubscriptionFromStripe`
upsert the webhook uses, so there's exactly one code path for "what does
syncing a subscription mean," not two that could drift apart. The webhook
remains the authoritative, ongoing source of truth for everything after
that (renewals, cancellations, payment failures) — this only closes the
gap for the immediate return-from-checkout moment, and the data still
comes directly from Stripe's API either way.

**2. The webhook idempotency bug** (previously fixed, kept for history).
The dedupe check originally treated _any_ failure to insert into
`webhook_events` as "already processed", including failures unrelated to
duplication — most importantly, the table not existing yet because
migration `023_create_webhook_events.sql` hadn't been applied. It now
only treats a genuine unique-constraint violation (Postgres code
`23505`) as "already processed"; anything else is logged and returns
`500` so Stripe retries. **Make sure all migrations through `024` are
applied** (`supabase db reset` locally, or push migrations to your hosted
project).

**How to verify each stage** — every step now logs clearly with a
`[stripe ...]` prefix. With `stripe listen` running, upgrade a test
account and watch your Next.js server terminal for, in order:

```
[stripe] creating checkout session for user <uuid>
[stripe] checkout session created: cs_test_...
[stripe reconcile] checking session cs_test_... for user <uuid>
[stripe sync] upserting subscriptions row: user=<uuid> status=active → plan=premium ...
[stripe sync] OK — user <uuid> is now on plan "premium" (status: active)
```

and separately, from the webhook (may arrive before or after the lines
above — both paths converge on the same upsert):

```
[stripe webhook] signature verified — event evt_... (customer.subscription.created)
[stripe webhook] received event evt_... (customer.subscription.created)
[stripe sync] upserting subscriptions row: ...
```

If you see `[stripe sync] subscription ... has no metadata.user_id and no
fallback was provided` — the Checkout Session wasn't created with
`subscription_data.metadata.user_id` set (shouldn't happen with the
current code, but would if `StripeProvider.createCheckoutSession` is
modified without preserving that field).

If you see `[stripe webhook] signature verification FAILED` — your
`STRIPE_WEBHOOK_SECRET` doesn't match the currently-running `stripe
listen` session. It prints a **new** `whsec_...` value every time it
starts; update `.env.local` and **restart your dev server** (Next.js
does not hot-reload environment variables).

If you see nothing at all in the webhook route (no `[stripe webhook]`
lines whatsoever) — `stripe listen --forward-to
localhost:3000/api/webhooks/stripe` isn't running, or is forwarding to
the wrong port/path. Check its own terminal output for delivery attempts
and HTTP status codes.

### "Could not start checkout. Try again."

In development, the actual error is appended in parentheses (e.g.
`(dev detail: STRIPE_PREMIUM_PRICE_ID is not set...)`); in production
it's hidden from the client but always logged server-side. The two most
common causes:

- `STRIPE_SECRET_KEY` or `STRIPE_PREMIUM_PRICE_ID` missing/unset in
  `.env.local`.
- `STRIPE_PREMIUM_PRICE_ID` is a **live**-mode price id while
  `STRIPE_SECRET_KEY` is a **test**-mode key (or vice versa) — Stripe
  keys and price ids must be from the same mode. Test-mode secret keys
  start with `sk_test_`, test-mode price ids are created while the
  Dashboard's "Test mode" toggle is on.

Checkout session creation only needs `STRIPE_SECRET_KEY` and
`STRIPE_PREMIUM_PRICE_ID` — `STRIPE_WEBHOOK_SECRET` is unrelated to this
error and is only used by the webhook route handler.

## Changing the price

`PLAN_LIMITS.premium.priceMonthly`/`.currency` in
`packages/shared/src/subscription.ts` is what the landing page pricing
section and (soon) the in-app upgrade prompts display — it's purely
cosmetic. **Changing it does not change what Stripe actually charges.**
To change the real price:

1. Create a new Price object in the Stripe Dashboard (Stripe Prices are
   immutable once created — you can't edit an existing one's amount).
2. Update `STRIPE_PREMIUM_PRICE_ID` to the new Price's id.
3. Update `PLAN_LIMITS.premium.priceMonthly`/`.currency` to match, so the
   displayed price stays truthful.

Migration `024_update_premium_price.sql` updated the informational
`subscription_plans.price_monthly`/`currency` columns to ₱49.00 PHP to
match; that column is for display/reporting only and, like the shared
constant, has no effect on what Stripe actually charges.

## Testing without live Stripe keys

This repository was built without network access to `api.stripe.com`, so
the integration is verified for type-correctness and structural
correctness (it builds cleanly against the real `stripe` npm package's
types) but has not been exercised against a live Stripe test account.
Before going live: run through a real checkout in Stripe test mode, using
the Stripe CLI to forward webhooks locally, and confirm a `subscriptions`
row updates to `plan_id` = Premium after `customer.subscription.created`.
