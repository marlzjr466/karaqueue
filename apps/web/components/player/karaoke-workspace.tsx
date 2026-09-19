"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { YouTubeVideo } from "@karaoke-queue/shared";
import type { QueueItemWithVideo } from "@/lib/queue/get-queue";
import { useYouTubePlayer } from "@/lib/youtube/use-youtube-player";
import {
  playNextAction,
  removeFromQueueAction,
  reorderQueueAction,
  addToQueueAction
} from "@/app/actions/queue";
import { PlayerView } from "@/components/player/player-view";
import { FullscreenTopControls } from "@/components/player/fullscreen-top-controls";
import { FullscreenSearchPanel } from "@/components/player/fullscreen-search-panel";
import { FullscreenQueueBar } from "@/components/player/fullscreen-queue-bar";
import { QueueStrip } from "@/components/queue/queue-strip";
import { ClearQueueButton } from "@/components/queue/clear-queue-button";
import { SearchPanel } from "@/components/search/search-panel";

export function KaraokeWorkspace({
  initialNowPlaying,
  initialUpNext,
  queueLimit,
  isFullscreen,
  onToggleFullscreen,
  onExitFullscreen
}: {
  initialNowPlaying: QueueItemWithVideo | null;
  initialUpNext: QueueItemWithVideo[];
  queueLimit: number;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  onExitFullscreen: () => void;
}) {
  const [nowPlaying, setNowPlaying] = useState(initialNowPlaying);
  const [upNext, setUpNext] = useState(initialUpNext);
  const [advancing, setAdvancing] = useState(false);
  const [activeSidebarTab, setActiveSidebarTab] = useState<"queue" | "search">("queue");
  const router = useRouter();

  // Resync whenever the server-rendered data changes (e.g. after our own
  // router.refresh() calls below settle with authoritative data).
  useEffect(() => {
    setNowPlaying(initialNowPlaying);
    setUpNext(initialUpNext);
  }, [initialNowPlaying, initialUpNext]);

  const handleEnded = useCallback(() => {
    void advance("completed");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nowPlaying, upNext]);

  const { ready, status, playVideoId, play, pause, stop } = useYouTubePlayer(
    "karaoke-youtube-player",
    handleEnded,
    initialNowPlaying?.video.youtubeId ?? null
  );

  async function advance(finishStatus: "completed" | "skipped") {
    setAdvancing(true);
    const result = await playNextAction(nowPlaying?.id ?? null, finishStatus);
    setAdvancing(false);

    if (!result.success) {
      toast.error(result.message ?? "Could not advance the queue.");
      return;
    }

    if (!result.nextQueueItemId) {
      setNowPlaying(null);
      setUpNext([]);
      router.refresh();
      return;
    }

    const next = upNext.find((i) => i.id === result.nextQueueItemId) ?? upNext[0] ?? null;
    setNowPlaying(next);
    setUpNext((prev) => prev.filter((i) => i.id !== next?.id));
    if (next) playVideoId(next.video.youtubeId);
    router.refresh();
  }

  async function handleStart() {
    setAdvancing(true);
    const result = await playNextAction(null);
    setAdvancing(false);

    if (!result.success || !result.nextQueueItemId) {
      toast.error(result.message ?? "Nothing to play.");
      return;
    }

    const started = upNext.find((i) => i.id === result.nextQueueItemId) ?? upNext[0];
    if (started) {
      setNowPlaying(started);
      setUpNext((prev) => prev.filter((i) => i.id !== started.id));
      playVideoId(started.video.youtubeId);
    }
    router.refresh();
  }

  function handlePlayPause() {
    if (status === "playing") pause();
    else play();
  }

  async function handleRemove(id: string) {
    const previous = upNext;
    setUpNext((prev) => prev.filter((i) => i.id !== id));

    const result = await removeFromQueueAction(id);
    if (!result.success) {
      toast.error(result.message ?? "Could not remove this song.");
      setUpNext(previous);
    } else {
      router.refresh();
    }
  }

  async function handleReorder(reordered: QueueItemWithVideo[]) {
    const previous = upNext;
    setUpNext(reordered);
    const result = await reorderQueueAction(reordered.map((i) => i.id));
    if (!result.success) {
      toast.error(result.message ?? "Could not save the new order.");
      setUpNext(previous);
    }
  }

  async function handleAddToQueue(
    video: YouTubeVideo
  ): Promise<{ success: boolean; limitReached?: boolean }> {
    const result = await addToQueueAction({
      youtubeId: video.youtubeId,
      title: video.title,
      channelTitle: video.channelTitle,
      thumbnailUrl: video.thumbnailUrl,
      durationSeconds: video.durationSeconds,
      publishedAt: video.publishedAt
    });

    if (!result.success) {
      if (result.code !== "QUEUE_LIMIT_REACHED") {
        toast.error(result.message ?? "Unable to add this song.");
      }
      return { success: false, limitReached: result.code === "QUEUE_LIMIT_REACHED" };
    }

    router.refresh();
    return { success: true };
  }

  return (
    <div className={isFullscreen ? "" : "lg:grid lg:grid-cols-[1fr_400px]"}>
      {/* Left column. When fullscreen, PlayerView escapes this layout
          entirely via `fixed inset-0` (see PlayerView's `immersive`
          prop) — this wrapper's own classes stop mattering, but it must
          keep rendering PlayerView in the exact same tree position so
          the YouTube player is never unmounted/recreated. */}
      <div
        className={
          isFullscreen
            ? ""
            : "flex flex-col border-white/10 p-4 lg:overflow-y-auto lg:border-r lg:p-6"
        }
      >
        <PlayerView
          nowPlaying={nowPlaying}
          upNext={upNext}
          status={status}
          ready={ready}
          advancing={advancing}
          immersive={isFullscreen}
          onStart={handleStart}
          onPlayPause={handlePlayPause}
          onStop={stop}
          onNext={() => advance("skipped")}
          onToggleFullscreen={onToggleFullscreen}
        />
      </div>

      {!isFullscreen && (
        <aside className="flex min-h-[420px] flex-col border-t border-white/10 bg-black/10 lg:border-l lg:border-t-0">
          <div className="flex border-b border-white/10 bg-white/[0.02]">
            {(["queue", "search"] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveSidebarTab(tab)}
                className={[
                  "flex-1 px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] transition",
                  activeSidebarTab === tab
                    ? "border-b-2 border-neon-magenta bg-white/[0.03] text-white"
                    : "text-white/45 hover:text-white/80"
                ].join(" ")}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-hidden">
            {activeSidebarTab === "queue" ? (
              <div className="flex h-full flex-col p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold uppercase tracking-widest text-white/40">
                    Up next
                  </p>
                  <div className="flex items-center gap-3">
                    <p className="text-xs text-white/40">
                      Queue: {upNext.length} / {queueLimit}
                    </p>
                    <ClearQueueButton disabled={upNext.length === 0} />
                  </div>
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto">
                  <QueueStrip
                    items={upNext}
                    onRemove={handleRemove}
                    onReorder={handleReorder}
                  />
                </div>
              </div>
            ) : (
              <div className="h-full">
                <SearchPanel
                  queueCount={upNext.length}
                  queueLimit={queueLimit}
                  onAddToQueue={handleAddToQueue}
                />
              </div>
            )}
          </div>
        </aside>
      )}

      {isFullscreen && (
        <>
          <FullscreenTopControls
            hasNowPlaying={Boolean(nowPlaying)}
            hasNext={upNext.length > 0}
            advancing={advancing}
            onStop={stop}
            onNext={() => advance("skipped")}
            onExit={onExitFullscreen}
          />
          <FullscreenSearchPanel
            queueCount={upNext.length}
            queueLimit={queueLimit}
            onAddToQueue={handleAddToQueue}
          />
          <FullscreenQueueBar
            nowPlaying={nowPlaying}
            upNext={upNext}
            queueLimit={queueLimit}
          />
        </>
      )}
    </div>
  );
}
