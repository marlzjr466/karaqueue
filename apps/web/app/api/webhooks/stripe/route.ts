import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { StripeProvider } from "@/lib/payments/stripe-provider";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import {
  syncSubscriptionFromStripe,
  downgradeToFree
} from "@/lib/payments/sync-subscription";

// Stripe needs the raw request body to verify the signature — never
// parse it as JSON before this.
export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    console.error("[stripe webhook] request missing stripe-signature header");
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 }
    );
  }

  const payload = await request.text();
  const stripe = new StripeProvider();

  let event: Stripe.Event;
  try {
    // Route directly to StripeProvider (rather than the generic
    // getPaymentProvider() factory) because we need the full parsed
    // Stripe.Event object here, not just the { id, type } the
    // PaymentProvider interface's handleWebhook() returns.
    event = await stripe.constructEvent(payload, signature);
  } catch (error) {
    // The #1 cause locally: STRIPE_WEBHOOK_SECRET doesn't match the
    // currently-running `stripe listen` session (it prints a NEW
    // whsec_... every time it starts) — or the dev server was never
    // restarted after updating .env.local (Next doesn't hot-reload env
    // vars). Also verify no other code path reads the request body
    // before this handler — the raw bytes must reach constructEvent
    // unmodified for the signature to match.
    console.error("[stripe webhook] signature verification FAILED:", error);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  console.log(`[stripe webhook] received event ${event.id} (${event.type})`);

  const supabase = createServiceRoleClient();

  // Idempotency: Stripe retries webhook deliveries on any non-2xx
  // response, so the same event can arrive more than once. The
  // `webhook_events.id` primary key rejects a duplicate insert — that
  // specific failure (Postgres code 23505, unique_violation) means
  // "already processed", so we skip re-processing.
  //
  // Any OTHER insert error (e.g. the `webhook_events` table doesn't
  // exist yet because migration 023 hasn't been applied to this Supabase
  // project) must NOT be treated as "already processed" — silently
  // swallowing it here would look like a successful webhook delivery
  // while never actually syncing the subscription, which is exactly the
  // "payment succeeded but the app still shows Free" symptom this fixes.
  const { error: dedupeError } = await supabase
    .from("webhook_events")
    .insert({ id: event.id, provider: "stripe", type: event.type });

  if (dedupeError) {
    if (dedupeError.code === "23505") {
      console.log(`[stripe webhook] event ${event.id} already processed — skipping`);
      return NextResponse.json({ received: true, deduped: true });
    }

    console.error(
      `[stripe webhook] could not record webhook_events row for ${event.id} — NOT treating as duplicate. ` +
        `Is migration 023_create_webhook_events.sql applied to this Supabase project?`,
      dedupeError.message
    );
    return NextResponse.json(
      { error: "Could not record webhook event" },
      { status: 500 }
    );
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        // Belt-and-suspenders alongside the active reconciliation done
        // in /subscription on return from Checkout (see
        // lib/payments/reconcile-checkout.ts) — this covers the case
        // where the user closes the tab before that page loads.
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode === "subscription" && session.subscription) {
          const subscriptionId =
            typeof session.subscription === "string"
              ? session.subscription
              : session.subscription.id;
          const sub = await stripe.getSubscriptionRaw(subscriptionId);
          if (sub) {
            await syncSubscriptionFromStripe(
              supabase,
              sub,
              session.client_reference_id ?? undefined
            );
          } else {
            console.error(
              `[stripe webhook] checkout.session.completed: could not retrieve subscription ${subscriptionId}`
            );
          }
        }
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
        await syncSubscriptionFromStripe(
          supabase,
          event.data.object as Stripe.Subscription
        );
        break;
      case "invoice.paid": {
        // Fires on the initial payment and every renewal — re-syncing
        // here keeps current_period_end accurate even if, for whatever
        // reason, the corresponding customer.subscription.updated event
        // was missed.
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionRef = (
          invoice as unknown as { subscription?: string | Stripe.Subscription }
        ).subscription;
        if (subscriptionRef) {
          const subscriptionId =
            typeof subscriptionRef === "string" ? subscriptionRef : subscriptionRef.id;
          const sub = await stripe.getSubscriptionRaw(subscriptionId);
          if (sub) await syncSubscriptionFromStripe(supabase, sub);
        }
        break;
      }
      case "customer.subscription.deleted":
        await downgradeToFree(supabase, event.data.object as Stripe.Subscription);
        break;
      default:
        // Other event types aren't acted on — acknowledging them with
        // 200 is still correct so Stripe doesn't keep retrying events we
        // intentionally ignore.
        console.log(`[stripe webhook] ignoring unhandled event type ${event.type}`);
        break;
    }
  } catch (error) {
    console.error(
      `[stripe webhook] handler threw while processing ${event.type}:`,
      error
    );
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
