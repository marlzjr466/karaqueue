import "server-only";
import Stripe from "stripe";
import type {
  PaymentProvider,
  CheckoutSessionParams,
  CheckoutSession,
  BillingPortalParams,
  BillingPortalSession,
  ProviderSubscription,
  WebhookEvent
} from "./types";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not set. Add it to your server environment.`);
  }
  return value;
}

function toProviderStatus(
  status: Stripe.Subscription.Status
): ProviderSubscription["status"] {
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

export class StripeProvider implements PaymentProvider {
  private client: Stripe;

  constructor() {
    this.client = new Stripe(requireEnv("STRIPE_SECRET_KEY"));
  }

  async createCheckoutSession(params: CheckoutSessionParams): Promise<CheckoutSession> {
    const priceId = requireEnv("STRIPE_PREMIUM_PRICE_ID");

    console.log("[stripe] creating checkout session for user", params.userId);

    const session = await this.client.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      // {CHECKOUT_SESSION_ID} is a literal template Stripe substitutes
      // itself before redirecting — this lets /subscription reconcile
      // the exact session synchronously on return, instead of relying
      // solely on the async webhook (see reconcileCheckoutSession).
      success_url: `${params.successUrl}${params.successUrl.includes("?") ? "&" : "?"}session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: params.cancelUrl,
      client_reference_id: params.userId,
      ...(params.customerId
        ? { customer: params.customerId }
        : { customer_email: params.userEmail }),
      subscription_data: {
        metadata: { user_id: params.userId }
      },
      metadata: { user_id: params.userId }
    });

    if (!session.url) {
      throw new Error("Stripe did not return a Checkout Session URL.");
    }

    console.log("[stripe] checkout session created:", session.id);
    return { url: session.url };
  }

  async createBillingPortalSession(
    params: BillingPortalParams
  ): Promise<BillingPortalSession> {
    const session = await this.client.billingPortal.sessions.create({
      customer: params.customerId,
      return_url: params.returnUrl
    });

    return { url: session.url };
  }

  async cancelSubscription(subscriptionId: string): Promise<void> {
    // Cancel at period end rather than immediately, so the user keeps
    // Premium access through what they already paid for.
    await this.client.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true
    });
  }

  async getSubscription(subscriptionId: string): Promise<ProviderSubscription | null> {
    try {
      const sub = await this.client.subscriptions.retrieve(subscriptionId);
      return this.mapSubscription(sub);
    } catch {
      return null;
    }
  }

  /**
   * Like `getSubscription`, but returns the raw `Stripe.Subscription`
   * (with `metadata`, full status enum, etc.) instead of the mapped-down
   * `ProviderSubscription`. Used by the webhook route and
   * `reconcileCheckoutSession`, which need the full object to pass to
   * `syncSubscriptionFromStripe`.
   */
  async getSubscriptionRaw(subscriptionId: string): Promise<Stripe.Subscription | null> {
    try {
      return await this.client.subscriptions.retrieve(subscriptionId);
    } catch (error) {
      console.error(`[stripe] failed to retrieve subscription ${subscriptionId}:`, error);
      return null;
    }
  }

  async handleWebhook(payload: string, signature: string): Promise<WebhookEvent> {
    const webhookSecret = requireEnv("STRIPE_WEBHOOK_SECRET");
    const event = await this.client.webhooks.constructEventAsync(
      payload,
      signature,
      webhookSecret
    );
    return { id: event.id, type: event.type };
  }

  async verifyPayment(sessionId: string): Promise<boolean> {
    const session = await this.client.checkout.sessions.retrieve(sessionId);
    return session.payment_status === "paid" || session.status === "complete";
  }

  /**
   * Retrieves a Checkout Session with its Subscription expanded inline
   * (one API call instead of two). Used by `reconcileCheckoutSession` to
   * actively sync the DB the moment the user returns from Stripe,
   * instead of only waiting for the async webhook.
   */
  async retrieveCheckoutSessionSubscription(
    sessionId: string
  ): Promise<Stripe.Subscription | null> {
    const session = await this.client.checkout.sessions.retrieve(sessionId, {
      expand: ["subscription"]
    });

    if (!session.subscription || typeof session.subscription === "string") {
      return null;
    }
    return session.subscription;
  }

  /** Exposed for the webhook route handler, which needs the full parsed
   * event object (not just id/type) to read subscription/customer data. */
  async constructEvent(payload: string, signature: string): Promise<Stripe.Event> {
    const webhookSecret = requireEnv("STRIPE_WEBHOOK_SECRET");
    const event = await this.client.webhooks.constructEventAsync(
      payload,
      signature,
      webhookSecret
    );
    console.log(
      `[stripe webhook] signature verified — event ${event.id} (${event.type})`
    );
    return event;
  }

  private mapSubscription(sub: Stripe.Subscription): ProviderSubscription {
    return {
      id: sub.id,
      customerId: typeof sub.customer === "string" ? sub.customer : sub.customer.id,
      status: toProviderStatus(sub.status),
      currentPeriodStart: new Date(sub.current_period_start * 1000).toISOString(),
      currentPeriodEnd: sub.current_period_end
        ? new Date(sub.current_period_end * 1000).toISOString()
        : null,
      cancelAtPeriodEnd: sub.cancel_at_period_end
    };
  }
}
