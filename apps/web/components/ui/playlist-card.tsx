import Link from "next/link";
import { ListMusic } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { PlaylistSummary } from "@/lib/playlists/get-playlists";

export function PlaylistCard({ playlist }: { playlist: PlaylistSummary }) {
  return (
    <Link href={`/playlists/${playlist.id}`}>
      <Card className="h-full transition hover:border-white/20">
        <CardContent>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-neon-magenta/30 to-neon-purple/30">
            <ListMusic className="h-6 w-6 text-white" />
          </div>
          <p className="mt-4 truncate font-semibold text-white">{playlist.name}</p>
          <p className="mt-1 text-sm text-white/40">
            {playlist.songCount} {playlist.songCount === 1 ? "song" : "songs"}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}
