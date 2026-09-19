import "server-only";
import { StripeProvider } from "./stripe-provider";
import type { PaymentProvider } from "./types";

let provider: PaymentProvider | null = null;

/**
 * Returns the active payment provider. The rest of the app should only
 * ever import this factory and the `PaymentProvider` type from
 * `./types` — never `StripeProvider` or the `stripe` package directly.
 * Swapping providers later means writing a new class implementing
 * `PaymentProvider` and changing the single line below.
 */
export function getPaymentProvider(): PaymentProvider {
  if (!provider) {
    provider = new StripeProvider();
  }
  return provider;
}

export type {
  PaymentProvider,
  CheckoutSessionParams,
  CheckoutSession,
  BillingPortalParams,
  BillingPortalSession,
  ProviderSubscription,
  WebhookEvent
} from "./types";
