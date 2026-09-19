"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { QueueItemWithVideo } from "@/lib/queue/get-queue";
import { Equalizer } from "@/components/landing/equalizer";

export function FullscreenQueueBar({
  nowPlaying,
  upNext,
  queueLimit
}: {
  nowPlaying: QueueItemWithVideo | null;
  upNext: QueueItemWithVideo[];
  queueLimit: number;
}) {
  const [expanded, setExpanded] = useState(true);
  const activeRef = useRef<HTMLDivElement>(null);
  const totalCount = (nowPlaying ? 1 : 0) + upNext.length;

  useEffect(() => {
    activeRef.current?.scrollIntoView({
      behavior: "smooth",
      inline: "center",
      block: "nearest"
    });
  }, [nowPlaying?.id]);

  if (totalCount === 0) return null;

  if (!expanded) {
    return (
      <button
        type="button"
        onClick={() => setExpanded(true)}
        className="fixed bottom-4 left-1/2 z-queue flex -translate-x-1/2 items-center gap-2 rounded-full border border-white/10 bg-[rgba(10,10,20,0.65)] px-4 py-2 text-xs font-semibold text-white backdrop-blur-md"
      >
        <ChevronUp className="h-3.5 w-3.5" />
        QUEUE {totalCount} / {queueLimit}
      </button>
    );
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-queue">
      <div className="mx-auto flex max-w-5xl items-center gap-2 px-4 pb-4">
        <div className="flex flex-1 gap-2 overflow-x-auto rounded-2xl border border-white/10 bg-[rgba(10,10,20,0.65)] p-2 backdrop-blur-md">
          {nowPlaying && (
            <div
              ref={activeRef}
              className="flex flex-shrink-0 items-center gap-2 rounded-full border border-neon-magenta/50 bg-neon-magenta/15 px-4 py-2"
            >
              <Equalizer className="h-3.5" />
              <span className="max-w-[220px] truncate text-sm font-semibold text-white">
                {nowPlaying.video.title}
              </span>
            </div>
          )}

          {upNext.map((item) => (
            <div
              key={item.id}
              className="flex flex-shrink-0 items-center rounded-full border border-white/10 bg-white/5 px-4 py-2"
            >
              <span className="max-w-[180px] truncate text-sm text-white/70">
                {item.video.title}
              </span>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setExpanded(false)}
          aria-label="Collapse queue"
          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-white/10 bg-[rgba(10,10,20,0.65)] text-white/60 backdrop-blur-md hover:text-white"
        >
          <ChevronDown className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
