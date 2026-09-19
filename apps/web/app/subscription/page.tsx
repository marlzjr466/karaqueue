import { requireUser } from "@/lib/auth/require-user";
import { getUserQueue } from "@/lib/queue/get-queue";
import { getUserPlaylists } from "@/lib/playlists/get-playlists";
import { reconcileCheckoutSession } from "@/lib/payments/reconcile-checkout";
import { AppNav } from "@/components/app/app-nav";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  UpgradeButton,
  ManageBillingButton
} from "@/components/subscription/subscription-buttons";
import { CheckoutResultToast } from "@/components/subscription/checkout-result-toast";
import { PLAN_LIMITS } from "@karaoke-queue/shared";

export default async function SubscriptionPage({
  searchParams
}: {
  searchParams: Promise<{ checkout?: string; session_id?: string }>;
}) {
  const { user, supabase } = await requireUser();
  const { checkout, session_id: sessionId } = await searchParams;

  // Actively reconcile with Stripe BEFORE reading entitlements below, so
  // this render reflects a just-completed upgrade immediately instead of
  // depending on webhook delivery timing — see
  // lib/payments/reconcile-checkout.ts and docs/SUBSCRIPTIONS.md.
  if (checkout === "success" && sessionId) {
    await reconcileCheckoutSession(sessionId, user.id);
  }

  const [{ data: entitlements }, { data: subscription }, queue, playlists] =
    await Promise.all([
      supabase.from("user_entitlements").select("*").eq("user_id", user.id).single(),
      supabase
        .from("subscriptions")
        .select("provider_customer_id, cancel_at_period_end, current_period_end")
        .eq("user_id", user.id)
        .single(),
      getUserQueue(supabase, user.id),
      getUserPlaylists(supabase, user.id)
    ]);

  const isPremium = entitlements?.plan_slug === "premium";
  const queueLimit = entitlements?.max_queue_items ?? PLAN_LIMITS.free.maxQueueItems;
  // `max_playlists` is legitimately `null` for Premium (unlimited) — that
  // is meaningful data, not "missing". Only fall back to the Free
  // default when `entitlements` itself failed to load (no row at all);
  // `?? PLAN_LIMITS.free.maxPlaylists` on `entitlements?.max_playlists`
  // directly would incorrectly treat Premium's `null` as "use the Free
  // default" too, showing "1 / 2" instead of "Unlimited" for Premium
  // users.
  const playlistLimit = entitlements
    ? entitlements.max_playlists
    : PLAN_LIMITS.free.maxPlaylists;
  const hasBillingAccount = Boolean(subscription?.provider_customer_id);

  return (
    <main className="min-h-screen bg-stage-gradient text-white">
      <AppNav active="profile" />
      <CheckoutResultToast />

      <div className="mx-auto max-w-2xl px-6 py-12">
        <h1 className="text-2xl font-bold">Subscription</h1>

        <Card className="mt-6">
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-widest text-white/40">
                  Current plan
                </p>
                <p className="mt-2 text-2xl font-semibold">
                  {entitlements?.plan_name ?? "Free"}
                </p>
              </div>
              {isPremium && <Badge variant="premium">Premium</Badge>}
            </div>

            <div className="mt-6 space-y-2 text-sm text-white/60">
              <p>
                Queue: {queue.length} / {queueLimit}
              </p>
              <p>
                Playlists: {playlists.length} / {playlistLimit ?? "Unlimited"}
              </p>
            </div>

            {isPremium && subscription?.cancel_at_period_end && (
              <p className="mt-4 rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-200">
                Your subscription is set to cancel
                {subscription.current_period_end
                  ? ` on ${new Date(subscription.current_period_end).toLocaleDateString()}`
                  : ""}
                . You&apos;ll keep Premium access until then.
              </p>
            )}

            <div className="mt-6 flex flex-wrap gap-3">
              {!isPremium && <UpgradeButton />}
              {hasBillingAccount && <ManageBillingButton />}
            </div>
          </CardContent>
        </Card>

        {!isPremium && (
          <Card className="mt-4 border-neon-magenta/30">
            <CardContent>
              <p className="font-semibold text-white">Why upgrade?</p>
              <ul className="mt-3 space-y-2 text-sm text-white/60">
                <li>
                  • {PLAN_LIMITS.premium.maxQueueItems} songs in your queue (vs{" "}
                  {PLAN_LIMITS.free.maxQueueItems})
                </li>
                <li>• Unlimited playlists</li>
                <li>• Advanced queue management</li>
              </ul>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}
