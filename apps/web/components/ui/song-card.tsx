"use client";

import Image from "next/image";
import { ListPlus, ListMusic } from "lucide-react";
import type { YouTubeVideo } from "@karaoke-queue/shared";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDuration } from "@/lib/format-duration";

export function SongCard({
  video,
  onAddToQueue,
  onAddToPlaylist,
  addingToQueue
}: {
  video: YouTubeVideo;
  onAddToQueue?: (video: YouTubeVideo) => void;
  onAddToPlaylist?: (video: YouTubeVideo) => void;
  addingToQueue?: boolean;
}) {
  const duration = formatDuration(video.durationSeconds);

  return (
    <Card className="overflow-hidden">
      <div className="relative aspect-video bg-stage-800">
        {video.thumbnailUrl ? (
          <Image
            src={video.thumbnailUrl}
            alt={video.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover"
          />
        ) : null}
        {duration && (
          <span className="absolute bottom-2 right-2 rounded bg-black/80 px-1.5 py-0.5 text-xs text-white">
            {duration}
          </span>
        )}
      </div>

      <div className="p-4">
        <p className="line-clamp-2 font-medium text-white">{video.title}</p>
        <p className="mt-1 truncate text-sm text-white/40">{video.channelTitle}</p>

        <div className="mt-4 flex gap-2">
          <Button
            size="sm"
            variant="primary"
            className="flex-1"
            disabled={addingToQueue}
            onClick={() => onAddToQueue?.(video)}
          >
            <ListPlus className="h-4 w-4" />
            {addingToQueue ? "Adding…" : "Queue"}
          </Button>
          <Button
            size="sm"
            variant="secondary"
            className="flex-1"
            onClick={() => onAddToPlaylist?.(video)}
          >
            <ListMusic className="h-4 w-4" />
            Playlist
          </Button>
        </div>
      </div>
    </Card>
  );
}
