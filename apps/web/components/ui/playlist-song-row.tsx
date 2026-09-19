"use client";

import Image from "next/image";
import { GripVertical, X } from "lucide-react";
import { formatDuration } from "@/lib/format-duration";
import type { PlaylistItemWithVideo } from "@/lib/playlists/get-playlists";

export function PlaylistSongRow({
  item,
  index,
  onRemove,
  dragHandleProps,
  isDragging
}: {
  item: PlaylistItemWithVideo;
  index: number;
  onRemove?: (id: string) => void;
  dragHandleProps?: React.HTMLAttributes<HTMLButtonElement>;
  isDragging?: boolean;
}) {
  const duration = formatDuration(item.video.durationSeconds);

  return (
    <div
      className={`flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3 transition ${
        isDragging ? "opacity-50" : ""
      }`}
    >
      <button
        type="button"
        aria-label="Drag to reorder"
        className="cursor-grab touch-none text-white/30 hover:text-white/60 active:cursor-grabbing"
        {...dragHandleProps}
      >
        <GripVertical className="h-5 w-5" />
      </button>

      <span className="w-5 flex-shrink-0 text-center text-sm text-white/30">
        {index + 1}
      </span>

      <div className="relative h-12 w-20 flex-shrink-0 overflow-hidden rounded-md bg-stage-800">
        {item.video.thumbnailUrl ? (
          <Image
            src={item.video.thumbnailUrl}
            alt={item.video.title}
            fill
            sizes="80px"
            className="object-cover"
          />
        ) : null}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-white">{item.video.title}</p>
        <p className="truncate text-xs text-white/40">
          {item.video.channelTitle}
          {duration ? ` · ${duration}` : ""}
        </p>
      </div>

      {onRemove && (
        <button
          type="button"
          aria-label={`Remove ${item.video.title} from playlist`}
          onClick={() => onRemove(item.id)}
          className="flex-shrink-0 rounded-full p-1.5 text-white/30 transition hover:bg-white/10 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
