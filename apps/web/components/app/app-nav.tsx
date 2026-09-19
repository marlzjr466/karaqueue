import Link from "next/link";
import { Mic2 } from "lucide-react";
import { signOutAction } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";

export function AppNav({
  active
}: {
  active?: "dashboard" | "search" | "queue" | "playlists" | "profile";
}) {
  const links = [
    { href: "/dashboard", label: "Dashboard", key: "dashboard" as const },
    { href: "/search", label: "Search", key: "search" as const },
    { href: "/queue", label: "Queue", key: "queue" as const },
    { href: "/playlists", label: "Playlists", key: "playlists" as const },
    { href: "/profile", label: "Profile", key: "profile" as const }
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-stage-950/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <Link href="/dashboard" className="flex items-center gap-2 font-bold text-white">
          <Mic2 className="h-5 w-5 text-neon-magenta" />
          KaraQueue
        </Link>

        <nav className="hidden items-center gap-6 text-sm sm:flex">
          {links.map((link) => (
            <Link
              key={link.key}
              href={link.href}
              className={
                active === link.key
                  ? "font-semibold text-white"
                  : "text-white/50 transition hover:text-white"
              }
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <form action={signOutAction}>
          <Button type="submit" variant="ghost" size="sm">
            Sign out
          </Button>
        </form>
      </div>
    </header>
  );
}
