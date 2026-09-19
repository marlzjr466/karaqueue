/**
 * Subscription plan rules.
 *
 * This is the SINGLE SOURCE OF TRUTH for plan limits. Never hardcode
 * "15", "60", or "2" anywhere else in the app — import from here.
 *
 * These constants mirror the `subscription_plans` table seed data
 * (see supabase/migrations). The database remains authoritative for
 * server-side enforcement; this module lets client code render limits
 * and do optimistic checks without duplicating the numbers.
 */

export const PLAN_SLUGS = ["free", "premium"] as const;
export type PlanSlug = (typeof PLAN_SLUGS)[number];

export interface PlanLimits {
  slug: PlanSlug;
  name: string;
  /** Max items allowed in the active queue. */
  maxQueueItems: number;
  /** Max playlists a user may own. `null` means unlimited. */
  maxPlaylists: number | null;
  /** Monthly price in the plan's currency's minor-unit-free display form
   * (e.g. 49 for ₱49.00). 0 for Free. */
  priceMonthly: number;
  /** ISO 4217 currency code, e.g. "php". */
  currency: string;
}

export const PLAN_LIMITS: Record<PlanSlug, PlanLimits> = {
  free: {
    slug: "free",
    name: "Free",
    maxQueueItems: 15,
    maxPlaylists: 2,
    priceMonthly: 0,
    currency: "php"
  },
  premium: {
    slug: "premium",
    name: "Premium",
    maxQueueItems: 60,
    maxPlaylists: null,
    priceMonthly: 49,
    currency: "php"
  }
};

const CURRENCY_SYMBOLS: Record<string, string> = {
  php: "₱",
  usd: "$"
};

/** Formats a plan's price for display, e.g. "₱49.00" or "$0". */
export function formatPlanPrice(plan: PlanLimits): string {
  if (plan.priceMonthly === 0) return `${CURRENCY_SYMBOLS[plan.currency] ?? ""}0`;
  return `${CURRENCY_SYMBOLS[plan.currency] ?? ""}${plan.priceMonthly.toFixed(2)}`;
}

export function getPlanLimits(slug: PlanSlug): PlanLimits {
  return PLAN_LIMITS[slug];
}

export function isUnlimitedPlaylists(limits: PlanLimits): boolean {
  return limits.maxPlaylists === null;
}

export function canAddQueueItem(currentCount: number, limits: PlanLimits): boolean {
  return currentCount < limits.maxQueueItems;
}

export function canCreatePlaylist(currentCount: number, limits: PlanLimits): boolean {
  if (isUnlimitedPlaylists(limits)) return true;
  return currentCount < (limits.maxPlaylists as number);
}

export const SUBSCRIPTION_STATUSES = [
  "active",
  "trialing",
  "past_due",
  "canceled",
  "expired"
] as const;
export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUSES)[number];

export function isEntitledStatus(status: SubscriptionStatus): boolean {
  return status === "active" || status === "trialing";
}
