import Link from "next/link";
import { Mic2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-stage-950/70 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2 font-bold text-white">
          <Mic2 className="h-5 w-5 text-neon-magenta" />
          KaraQueue
        </Link>

        <nav className="hidden items-center gap-8 text-sm text-white/60 sm:flex">
          <a href="#how-it-works" className="transition hover:text-white">
            How it works
          </a>
          <a href="#features" className="transition hover:text-white">
            Features
          </a>
          <a href="#pricing" className="transition hover:text-white">
            Pricing
          </a>
        </nav>

        <div className="flex items-center gap-3">
          <Link href="/login">
            <Button variant="ghost" size="sm">
              Sign In
            </Button>
          </Link>
          <Link href="/register">
            <Button variant="primary" size="sm">
              Start Singing
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
