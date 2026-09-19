import "server-only";
import type Stripe from "stripe";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

type ServiceClient = ReturnType<typeof createServiceRoleClient>;

async function getPlanIdBySlug(
  supabase: ServiceClient,
  slug: "free" | "premium"
): Promise<string | null> {
  const { data, error } = await supabase
    .from("subscription_plans")
    .select("id")
    .eq("slug", slug)
    .single();

  if (error) {
    console.error(
      `[stripe sync] could not look up subscription_plans row for "${slug}":`,
      error.message
    );
  }
  return data?.id ?? null;
}

function mapStatus(
  status: Stripe.Subscription.Status
): "active" | "trialing" | "past_due" | "canceled" | "expired" {
  switch (status) {
    case "active":
      return "active";
    case "trialing":
      return "trialing";
    case "past_due":
    case "unpaid":
      return "past_due";
    case "canceled":
      return "canceled";
    default:
      return "expired";
  }
}

/**
 * Upserts a Stripe subscription into our `subscriptions` table. Called
 * from two places:
 *
 * 1. The webhook (`customer.subscription.created`/`.updated`) — the
 *    ongoing, asynchronous source of truth for the subscription's
 *    lifecycle (renewals, status changes, etc).
 * 2. `reconcileCheckoutSession` — a synchronous, active pull right when
 *    the user lands back on `/subscription` from Stripe Checkout, so the
 *    upgrade is reflected immediately instead of depending on webhook
 *    delivery timing (see docs/SUBSCRIPTIONS.md).
 *
 * Reads the user id from the subscription's `metadata.user_id` (set via
 * `subscription_data.metadata` when the Checkout Session was created —
 * Stripe copies it onto the resulting Subscription automatically),
 * falling back to `fallbackUserId` when the caller already knows who
 * this is from an authenticated request (path 2 above never needs to
 * guess).
 */
export async function syncSubscriptionFromStripe(
  supabase: ServiceClient,
  sub: Stripe.Subscription,
  fallbackUserId?: string
): Promise<{ success: boolean; userId?: string; planSlug?: "free" | "premium" }> {
  const userId = sub.metadata?.user_id || fallbackUserId;
  if (!userId) {
    console.error(
      `[stripe sync] subscription ${sub.id} has no metadata.user_id and no fallback was provided — cannot sync. ` +
        `This means the Checkout Session was created without subscription_data.metadata.user_id, or Stripe's ` +
        `metadata propagation didn't happen. Check StripeProvider.createCheckoutSession.`
    );
    return { success: false };
  }

  const isActiveish = sub.status === "active" || sub.status === "trialing";
  const planSlug: "free" | "premium" = isActiveish ? "premium" : "free";
  const planId = await getPlanIdBySlug(supabase, planSlug);
  if (!planId) {
    console.error(
      `[stripe sync] could not resolve subscription_plans.id for slug "${planSlug}" — ` +
        `is supabase/migrations/006_seed_subscription_plans.sql applied?`
    );
    return { success: false };
  }

  const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;

  console.log(
    `[stripe sync] upserting subscriptions row: user=${userId} status=${sub.status} → plan=${planSlug} customer=${customerId} subscription=${sub.id}`
  );

  const { error } = await supabase.from("subscriptions").upsert(
    {
      user_id: userId,
      plan_id: planId,
      provider: "stripe",
      provider_customer_id: customerId,
      provider_subscription_id: sub.id,
      status: mapStatus(sub.status),
      current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
      current_period_end: sub.current_period_end
        ? new Date(sub.current_period_end * 1000).toISOString()
        : null,
      cancel_at_period_end: sub.cancel_at_period_end
    },
    { onConflict: "user_id" }
  );

  if (error) {
    console.error(
      `[stripe sync] FAILED to upsert subscriptions row for user ${userId}:`,
      error.message,
      error.details ?? ""
    );
    return { success: false, userId, planSlug };
  }

  console.log(
    `[stripe sync] OK — user ${userId} is now on plan "${planSlug}" (status: ${sub.status})`
  );
  return { success: true, userId, planSlug };
}

/**
 * Reverts a user to the Free plan, called from
 * `customer.subscription.deleted` (the subscription has fully ended —
 * not just marked to cancel at period end, which is still `active`
 * until then).
 */
export async function downgradeToFree(
  supabase: ServiceClient,
  sub: Stripe.Subscription
): Promise<void> {
  const freeId = await getPlanIdBySlug(supabase, "free");
  if (!freeId) {
    console.error("[stripe sync] could not resolve the free subscription_plans row.");
    return;
  }

  const userId = sub.metadata?.user_id;
  const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;

  const update = {
    plan_id: freeId,
    status: "canceled" as const,
    provider_subscription_id: null,
    cancel_at_period_end: false
  };

  const { error } = userId
    ? await supabase.from("subscriptions").update(update).eq("user_id", userId)
    : await supabase
        .from("subscriptions")
        .update(update)
        .eq("provider_customer_id", customerId);

  if (error) {
    console.error(
      "[stripe sync] failed to downgrade subscription to free:",
      error.message
    );
  } else {
    console.log(
      `[stripe sync] downgraded ${userId ?? customerId} to free (subscription ${sub.id} deleted)`
    );
  }
}
