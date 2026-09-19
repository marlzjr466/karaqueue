import "server-only";
import { StripeProvider } from "./stripe-provider";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { syncSubscriptionFromStripe } from "./sync-subscription";

export interface ReconcileResult {
  synced: boolean;
  planSlug?: "free" | "premium";
  reason?: string;
}

/**
 * Called from `/subscription` when the user returns from Stripe Checkout
 * with `?session_id=...`. Fetches the Checkout Session (with its
 * Subscription expanded) directly from Stripe and upserts it into our DB
 * right here, synchronously — the same upsert the webhook does, just
 * triggered actively instead of waiting for async webhook delivery.
 *
 * This exists because Stripe redirects the browser back to `success_url`
 * the instant checkout completes, which can happen *before* our webhook
 * has been delivered and processed (this is especially noticeable with
 * `stripe listen` forwarding locally). Without this, the very first
 * render after returning can legitimately still show "Free", and if the
 * webhook is delayed, misconfigured, or never arrives, it would stay
 * that way indefinitely. The webhook remains the authoritative,
 * long-running source of truth for everything that happens after this
 * point (renewals, cancellations, payment failures) — this only closes
 * the gap for the immediate return-from-checkout moment. Data still
 * comes directly from Stripe's API either way.
 */
export async function reconcileCheckoutSession(
  sessionId: string,
  expectedUserId: string
): Promise<ReconcileResult> {
  console.log(
    `[stripe reconcile] checking session ${sessionId} for user ${expectedUserId}`
  );

  let subscription;
  try {
    subscription = await new StripeProvider().retrieveCheckoutSessionSubscription(
      sessionId
    );
  } catch (error) {
    console.error(
      "[stripe reconcile] failed to retrieve checkout session from Stripe:",
      error
    );
    return { synced: false, reason: "stripe_fetch_failed" };
  }

  if (!subscription) {
    console.warn(
      `[stripe reconcile] session ${sessionId} has no subscription attached yet ` +
        "(payment may still be processing) — the webhook will sync it once it arrives."
    );
    return { synced: false, reason: "no_subscription_yet" };
  }

  const supabase = createServiceRoleClient();
  const result = await syncSubscriptionFromStripe(supabase, subscription, expectedUserId);

  if (!result.success) {
    return { synced: false, reason: "sync_failed" };
  }

  return { synced: true, planSlug: result.planSlug };
}
