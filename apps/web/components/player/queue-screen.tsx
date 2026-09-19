"use client";

import { useFullscreen } from "@/lib/use-fullscreen";
import { AppNav } from "@/components/app/app-nav";
import { KaraokeWorkspace } from "@/components/player/karaoke-workspace";
import type { QueueItemWithVideo } from "@/lib/queue/get-queue";

export function QueueScreen({
  initialNowPlaying,
  initialUpNext,
  queueLimit
}: {
  initialNowPlaying: QueueItemWithVideo | null;
  initialUpNext: QueueItemWithVideo[];
  queueLimit: number;
}) {
  const { isFullscreen, toggle, exit } = useFullscreen();

  return (
    <>
      {!isFullscreen && <AppNav active="queue" />}
      <KaraokeWorkspace
        initialNowPlaying={initialNowPlaying}
        initialUpNext={initialUpNext}
        queueLimit={queueLimit}
        isFullscreen={isFullscreen}
        onToggleFullscreen={toggle}
        onExitFullscreen={exit}
      />
    </>
  );
}
