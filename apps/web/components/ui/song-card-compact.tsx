"use client";

import Image from "next/image";
import { ListPlus, ListMusic } from "lucide-react";
import type { YouTubeVideo } from "@karaoke-queue/shared";
import { Button } from "@/components/ui/button";
import { formatDuration } from "@/lib/format-duration";

export function SongCardCompact({
  video,
  onAddToQueue,
  onAddToPlaylist,
  addingToQueue,
  queueFull
}: {
  video: YouTubeVideo;
  onAddToQueue?: (video: YouTubeVideo) => void;
  onAddToPlaylist?: (video: YouTubeVideo) => void;
  addingToQueue?: boolean;
  queueFull?: boolean;
}) {
  const duration = formatDuration(video.durationSeconds);

  return (
    <div className="flex gap-3 rounded-xl border border-white/10 bg-white/5 p-2">
      <div className="relative h-16 w-24 flex-shrink-0 overflow-hidden rounded-lg bg-stage-800">
        {video.thumbnailUrl ? (
          <Image
            src={video.thumbnailUrl}
            alt={video.title}
            fill
            sizes="96px"
            className="object-cover"
          />
        ) : null}
        {duration && (
          <span className="absolute bottom-1 right-1 rounded bg-black/80 px-1 text-[10px] text-white">
            {duration}
          </span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 text-sm font-medium leading-snug text-white">
          {video.title}
        </p>
        <p className="mt-0.5 truncate text-xs text-white/40">{video.channelTitle}</p>

        <div className="mt-2 flex gap-2">
          <Button
            size="sm"
            variant="primary"
            className="px-3 py-1 text-xs"
            disabled={addingToQueue || queueFull}
            title={queueFull ? "Your queue is full" : undefined}
            onClick={() => onAddToQueue?.(video)}
          >
            <ListPlus className="h-3.5 w-3.5" />
            {addingToQueue ? "Adding…" : queueFull ? "Queue full" : "Queue"}
          </Button>
          <Button
            size="sm"
            variant="secondary"
            className="px-3 py-1 text-xs"
            onClick={() => onAddToPlaylist?.(video)}
          >
            <ListMusic className="h-3.5 w-3.5" />
            Playlist
          </Button>
        </div>
      </div>
    </div>
  );
}
