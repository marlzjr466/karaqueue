import type { PlanSlug } from "@karaoke-queue/shared";
import { Badge } from "./badge";

export function SubscriptionBadge({ plan }: { plan: PlanSlug }) {
  if (plan === "free") return null;
  return <Badge variant="premium">Premium</Badge>;
}
