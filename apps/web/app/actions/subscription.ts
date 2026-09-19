"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getPaymentProvider } from "@/lib/payments";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export interface SubscriptionActionResult {
  success: boolean;
  message?: string;
}

/**
 * In development, surface the real error message so a misconfigured env
 * var (missing STRIPE_SECRET_KEY / STRIPE_PREMIUM_PRICE_ID, wrong test
 * vs. live price id, etc.) is immediately visible in the UI instead of
 * only in the server terminal. In production, never leak internal error
 * detail to the client — return the generic fallback instead.
 */
function toUserMessage(error: unknown, fallback: string): string {
  if (process.env.NODE_ENV !== "production" && error instanceof Error) {
    return `${fallback} (dev detail: ${error.message})`;
  }
  return fallback;
}

/**
 * Creates a Stripe Checkout Session for the Premium plan and redirects
 * the user to Stripe's hosted checkout page. The actual upgrade only
 * takes effect once the `customer.subscription.created` webhook fires
 * (see `app/api/webhooks/stripe/route.ts`) — this action never writes to
 * `subscriptions` directly, since the payment isn't confirmed yet.
 */
export async function createCheckoutSessionAction(): Promise<SubscriptionActionResult> {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, message: "You must be signed in." };
  }

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("provider_customer_id")
    .eq("user_id", user.id)
    .single();

  let checkoutUrl: string;
  try {
    const session = await getPaymentProvider().createCheckoutSession({
      userId: user.id,
      userEmail: user.email ?? "",
      customerId: subscription?.provider_customer_id ?? null,
      successUrl: `${SITE_URL}/subscription?checkout=success`,
      cancelUrl: `${SITE_URL}/subscription?checkout=canceled`
    });
    checkoutUrl = session.url;
  } catch (error) {
    console.error("Failed to create Stripe Checkout Session:", error);
    return {
      success: false,
      message: toUserMessage(error, "Could not start checkout. Try again.")
    };
  }

  redirect(checkoutUrl);
}

/**
 * Creates a Stripe Billing Portal session — Stripe's own hosted UI for
 * updating payment methods, viewing invoices, and canceling. Requires an
 * existing `provider_customer_id`, so it's only available once the user
 * has been through checkout at least once.
 */
export async function createBillingPortalSessionAction(): Promise<SubscriptionActionResult> {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, message: "You must be signed in." };
  }

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("provider_customer_id")
    .eq("user_id", user.id)
    .single();

  if (!subscription?.provider_customer_id) {
    return { success: false, message: "No billing account found yet." };
  }

  let portalUrl: string;
  try {
    const session = await getPaymentProvider().createBillingPortalSession({
      customerId: subscription.provider_customer_id,
      returnUrl: `${SITE_URL}/subscription`
    });
    portalUrl = session.url;
  } catch (error) {
    console.error("Failed to create Stripe Billing Portal session:", error);
    return {
      success: false,
      message: toUserMessage(error, "Could not open billing portal. Try again.")
    };
  }

  redirect(portalUrl);
}
