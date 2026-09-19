import Link from "next/link";
import { Check } from "lucide-react";
import { PLAN_LIMITS, formatPlanPrice } from "@karaoke-queue/shared";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Reveal, RevealGroup, RevealItem } from "./reveal";

const planCopy = {
  free: {
    period: "forever",
    features: [
      `${PLAN_LIMITS.free.maxQueueItems} queue songs`,
      `${PLAN_LIMITS.free.maxPlaylists} playlists`,
      "YouTube karaoke search",
      "Automatic playback",
      "Basic queue controls"
    ],
    cta: "Start Singing",
    href: "/register"
  },
  premium: {
    period: "/ month",
    features: [
      `${PLAN_LIMITS.premium.maxQueueItems} queue songs`,
      "Unlimited playlists",
      "Everything in Free",
      "Advanced queue management"
    ],
    cta: "Upgrade to Premium",
    href: "/register"
  }
} as const;

export function Pricing() {
  return (
    <section id="pricing" className="px-6 py-24">
      <div className="mx-auto max-w-4xl">
        <Reveal className="mb-12 text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-neon-blue">Pricing</p>
          <h2 className="mt-2 text-3xl font-bold text-white sm:text-4xl">
            Free to start. Premium to headline.
          </h2>
        </Reveal>

        <RevealGroup className="grid gap-6 sm:grid-cols-2">
          {(["free", "premium"] as const).map((slug) => {
            const plan = PLAN_LIMITS[slug];
            const copy = planCopy[slug];
            const isPremium = slug === "premium";

            return (
              <RevealItem key={slug}>
                <Card
                  glow={isPremium}
                  className={isPremium ? "h-full border-neon-magenta/40" : "h-full"}
                >
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <p className="text-lg font-semibold text-white">{plan.name}</p>
                      {isPremium && <Badge variant="premium">Popular</Badge>}
                    </div>

                    <p className="mt-4">
                      <span className="text-3xl font-bold text-white">
                        {formatPlanPrice(plan)}
                      </span>
                      <span className="ml-1 text-sm text-white/40">{copy.period}</span>
                    </p>

                    <ul className="mt-6 space-y-3">
                      {copy.features.map((feature) => (
                        <li
                          key={feature}
                          className="flex items-center gap-2 text-sm text-white/70"
                        >
                          <Check className="h-4 w-4 flex-shrink-0 text-neon-blue" />
                          {feature}
                        </li>
                      ))}
                    </ul>

                    <Link href={copy.href} className="mt-8 block">
                      <Button
                        variant={isPremium ? "primary" : "secondary"}
                        className="w-full"
                      >
                        {copy.cta}
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </RevealItem>
            );
          })}
        </RevealGroup>
      </div>
    </section>
  );
}
