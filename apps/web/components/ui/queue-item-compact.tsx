"use client";

import Image from "next/image";
import { X } from "lucide-react";
import { formatDuration } from "@/lib/format-duration";
import type { QueueItemWithVideo } from "@/lib/queue/get-queue";

export function QueueItemCompact({
  item,
  index,
  onRemove,
  isDragging
}: {
  item: QueueItemWithVideo;
  index: number;
  onRemove?: (id: string) => void;
  isDragging?: boolean;
}) {
  const duration = formatDuration(item.video.durationSeconds);

  return (
    <div
      className={`group relative w-36 flex-shrink-0 touch-none rounded-xl border border-white/10 bg-white/5 p-2 transition ${
        isDragging ? "opacity-50" : ""
      }`}
    >
      {onRemove && (
        <button
          type="button"
          aria-label={`Remove ${item.video.title} from queue`}
          onClick={(e) => {
            e.stopPropagation();
            onRemove(item.id);
          }}
          className="absolute right-1 top-1 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-black/70 text-white/70 opacity-0 transition hover:text-white group-hover:opacity-100"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}

      <div className="relative aspect-video overflow-hidden rounded-lg bg-stage-800">
        {item.video.thumbnailUrl ? (
          <Image
            src={item.video.thumbnailUrl}
            alt={item.video.title}
            fill
            sizes="144px"
            className="object-cover"
          />
        ) : null}
        <span className="absolute bottom-1 left-1 rounded bg-black/80 px-1 text-[10px] text-white/80">
          {index + 1}
        </span>
        {duration && (
          <span className="absolute bottom-1 right-1 rounded bg-black/80 px-1 text-[10px] text-white">
            {duration}
          </span>
        )}
      </div>

      <p className="mt-2 line-clamp-2 text-xs font-medium leading-snug text-white">
        {item.video.title}
      </p>
      <p className="mt-0.5 truncate text-[11px] text-white/40">
        {item.video.channelTitle}
      </p>
    </div>
  );
}
