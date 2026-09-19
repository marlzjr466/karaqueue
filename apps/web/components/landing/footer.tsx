import Link from "next/link";
import { Mic2 } from "lucide-react";
import { Reveal } from "./reveal";

export function SiteFooter() {
  return (
    <footer className="border-t border-white/5 px-6 py-10">
      <Reveal className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 text-sm text-white/40 sm:flex-row">
        <Link href="/" className="flex items-center gap-2 font-semibold text-white/70">
          <Mic2 className="h-4 w-4 text-neon-magenta" />
          KaraQueue
        </Link>
        <p>Your songs. Your queue. Your stage.</p>
        <p>&copy; {new Date().getFullYear()} KaraQueue</p>
      </Reveal>
    </footer>
  );
}
