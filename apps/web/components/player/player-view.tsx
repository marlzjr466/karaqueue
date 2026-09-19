"use client";

import { Play, Pause, Square, SkipForward, Maximize } from "lucide-react";
import type { QueueItemWithVideo } from "@/lib/queue/get-queue";
import type { PlaybackStatus } from "@/lib/youtube/use-youtube-player";
import { Button } from "@/components/ui/button";
import { formatDuration } from "@/lib/format-duration";

export const PLAYER_ELEMENT_ID = "karaoke-youtube-player";

/**
 * Purely presentational player surface. All playback orchestration
 * (advancing the queue, talking to the server) lives in the parent
 * KaraokeWorkspace — this component only renders the embed, controls,
 * and current-song info from props.
 *
 * The `<div id={PLAYER_ELEMENT_ID}>` target is ALWAYS rendered,
 * regardless of queue/empty state or `immersive` mode, so the YouTube
 * player is created exactly once and never remounted — entering/exiting
 * fullscreen only changes this component's CSS, never its DOM identity.
 */
export function PlayerView({
  nowPlaying,
  upNext,
  status,
  ready,
  advancing,
  immersive = false,
  onStart,
  onPlayPause,
  onStop,
  onNext,
  onToggleFullscreen
}: {
  nowPlaying: QueueItemWithVideo | null;
  upNext: QueueItemWithVideo[];
  status: PlaybackStatus;
  ready: boolean;
  advancing: boolean;
  immersive?: boolean;
  onStart: () => void;
  onPlayPause: () => void;
  onStop: () => void;
  onNext: () => void;
  onToggleFullscreen: () => void;
}) {
  const hasContent = Boolean(nowPlaying) || upNext.length > 0;
  const displayItem = nowPlaying ?? upNext[0] ?? null;
  const duration = formatDuration(displayItem?.video.durationSeconds ?? null);
  const hasNext = upNext.length > 0;

  return (
    <div
      className={
        immersive
          ? "fixed inset-0 z-video bg-black"
          : "flex w-full flex-col rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-6"
      }
    >
      <div
        className={
          immersive
            ? "absolute inset-0 [&>iframe]:absolute [&>iframe]:inset-0 [&>iframe]:h-full [&>iframe]:w-full"
            : "relative aspect-video w-full overflow-hidden rounded-xl bg-gradient-to-br from-stage-800 to-stage-950 [&>iframe]:absolute [&>iframe]:inset-0 [&>iframe]:h-full [&>iframe]:w-full"
        }
      >
        <div id={PLAYER_ELEMENT_ID} className="h-full w-full" />

        {!hasContent && (
          <div className="absolute inset-0 z-video-overlay flex flex-col items-center justify-center px-6 text-center">
            <p className="text-4xl">🎤</p>
            <p className="mt-4 text-lg font-semibold text-white">Your queue is empty</p>
            <p className="mt-2 max-w-xs text-sm text-white/50">
              Search for a karaoke song on the right to get started.
            </p>
          </div>
        )}

        {hasContent && !nowPlaying && (
          <button
            type="button"
            onClick={onStart}
            disabled={advancing}
            className="absolute inset-0 z-video-overlay flex items-center justify-center bg-black/40 backdrop-blur-sm transition hover:bg-black/50"
            aria-label="Start playback"
          >
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-neon-magenta">
              <Play className="ml-1 h-7 w-7 fill-white text-white" />
            </span>
          </button>
        )}
      </div>

      {!immersive && (
        <div className="mt-4 flex flex-shrink-0 items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="truncate font-semibold text-white">
              {displayItem?.video.title ?? "Nothing playing"}
            </p>
            <p className="truncate text-sm text-white/40">
              {displayItem?.video.channelTitle}
              {duration ? ` · ${duration}` : ""}
            </p>
          </div>

          <div className="flex flex-shrink-0 items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={onPlayPause}
              disabled={!nowPlaying || !ready || advancing}
              aria-label={status === "playing" ? "Pause" : "Play"}
            >
              {status === "playing" ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={onStop}
              disabled={!nowPlaying || !ready || advancing}
              aria-label="Stop"
            >
              <Square className="h-4 w-4" />
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={onNext}
              disabled={!nowPlaying || !hasNext || advancing}
              aria-label="Next"
              title={!hasNext ? "No more songs in queue" : "Next"}
            >
              <SkipForward className="h-4 w-4" />
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={onToggleFullscreen}
              disabled={!hasContent}
              aria-label="Fullscreen"
              title="Fullscreen"
            >
              <Maximize className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
