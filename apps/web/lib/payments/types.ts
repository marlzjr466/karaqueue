/**
 * Abstraction over a payment provider (Stripe today; see
 * `docs/SUBSCRIPTIONS.md` for why nothing else in the app imports Stripe
 * directly). Every method is server-only.
 */
export interface CheckoutSessionParams {
  userId: string;
  userEmail: string;
  /** Existing provider customer id, if we already have one for this user. */
  customerId: string | null;
  successUrl: string;
  cancelUrl: string;
}

export interface CheckoutSession {
  url: string;
}

export interface BillingPortalParams {
  customerId: string;
  returnUrl: string;
}

export interface BillingPortalSession {
  url: string;
}

export interface ProviderSubscription {
  id: string;
  customerId: string;
  status: "active" | "trialing" | "past_due" | "canceled" | "expired";
  currentPeriodStart: string;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
}

export interface WebhookEvent {
  id: string;
  type: string;
}

export interface PaymentProvider {
  createCheckoutSession(params: CheckoutSessionParams): Promise<CheckoutSession>;
  createBillingPortalSession(params: BillingPortalParams): Promise<BillingPortalSession>;
  cancelSubscription(subscriptionId: string): Promise<void>;
  getSubscription(subscriptionId: string): Promise<ProviderSubscription | null>;
  /**
   * Verifies the webhook signature and returns the parsed event, or
   * throws if the signature is invalid. Callers are responsible for
   * acting on the event's `type` (see the webhook route handler).
   */
  handleWebhook(payload: string, signature: string): Promise<WebhookEvent>;
  /** Confirms a Checkout Session actually completed payment. */
  verifyPayment(sessionId: string): Promise<boolean>;
}
