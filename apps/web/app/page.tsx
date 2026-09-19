import { SiteHeader } from "@/components/landing/site-header";
import { Hero } from "@/components/landing/hero";
import { HowItWorks } from "@/components/landing/how-it-works";
import { Features } from "@/components/landing/features";
import { Pricing } from "@/components/landing/pricing";
import { SiteFooter } from "@/components/landing/footer";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-stage-gradient">
      <SiteHeader />
      <Hero />
      <HowItWorks />
      <Features />
      <Pricing />
      <SiteFooter />
    </main>
  );
}
