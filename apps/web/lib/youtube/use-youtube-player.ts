"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type { YTPlayer } from "@/lib/youtube/iframe-types";

const IFRAME_API_SRC = "https://www.youtube.com/iframe_api";

let apiLoadPromise: Promise<void> | null = null;

function loadYouTubeIframeApi(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.YT?.Player) return Promise.resolve();
  if (apiLoadPromise) return apiLoadPromise;

  apiLoadPromise = new Promise((resolve) => {
    const previousCallback = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previousCallback?.();
      resolve();
    };

    if (!document.querySelector(`script[src="${IFRAME_API_SRC}"]`)) {
      const script = document.createElement("script");
      script.src = IFRAME_API_SRC;
      script.async = true;
      document.head.appendChild(script);
    }
  });

  return apiLoadPromise;
}

export type PlaybackStatus = "idle" | "playing" | "paused" | "stopped";

/**
 * `new YT.Player(...)` returns an object synchronously, but its real API
 * methods (loadVideoById, playVideo, ...) aren't attached until the
 * internal iframe finishes loading and fires `onReady`. Calling a method
 * before that throws "X is not a function". This guard makes every call
 * safe regardless of timing, queuing a requested video if it arrives
 * before the player is ready.
 */
function callWhenReady(
  player: YTPlayer | null,
  method: keyof YTPlayer,
  ...args: unknown[]
): boolean {
  if (player && typeof player[method] === "function") {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (player[method] as any)(...args);
    return true;
  }
  return false;
}

/**
 * @param initialVideoId The currently-"playing" song's video id, if the
 * page is loading (or a route change is remounting this component) with
 * an already-in-progress session — e.g. the user navigated away and back,
 * or a playlist was loaded in "replace" mode while a song was already
 * playing. Without this, a freshly created player has no video cued at
 * all, and pressing Play on it produces YouTube's generic
 * "An error occurred" overlay instead of actually playing anything.
 * Passed straight into the `YT.Player` constructor's `videoId` option,
 * which cues (but does not autoplay) the video — respecting browser
 * autoplay policy the same way the rest of this hook already does.
 */
export function useYouTubePlayer(
  elementId: string,
  onEnded: () => void,
  initialVideoId?: string | null
) {
  const playerRef = useRef<YTPlayer | null>(null);
  const onEndedRef = useRef(onEnded);
  onEndedRef.current = onEnded;

  const pendingVideoIdRef = useRef<string | null>(null);
  const lastRequestedIdRef = useRef<string | null>(null);
  const errorRetriedRef = useRef(false);

  const [status, setStatus] = useState<PlaybackStatus>("idle");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    loadYouTubeIframeApi().then(() => {
      if (cancelled || !window.YT) return;

      playerRef.current = new window.YT.Player(elementId, {
        videoId: initialVideoId ?? undefined,
        playerVars: { rel: 0, modestbranding: 1 },
        events: {
          onReady: () => {
            setReady(true);
            if (pendingVideoIdRef.current) {
              callWhenReady(
                playerRef.current,
                "loadVideoById",
                pendingVideoIdRef.current
              );
              pendingVideoIdRef.current = null;
            }
          },
          onStateChange: (event) => {
            if (!window.YT) return;
            if (event.data === window.YT.PlayerState.ENDED) {
              onEndedRef.current();
            } else if (event.data === window.YT.PlayerState.PLAYING) {
              setStatus("playing");
              errorRetriedRef.current = false;
            } else if (event.data === window.YT.PlayerState.PAUSED) {
              setStatus("paused");
            }
          },
          onError: () => {
            // YouTube's "An error occurred" overlay is sometimes a
            // transient hiccup right after a video is (re)loaded. Retry
            // the same video exactly once before giving up, rather than
            // leaving the player stuck on the error screen.
            const retryId = lastRequestedIdRef.current;
            if (retryId && !errorRetriedRef.current) {
              errorRetriedRef.current = true;
              callWhenReady(playerRef.current, "loadVideoById", retryId);
            }
          }
        }
      });
    });

    return () => {
      cancelled = true;
      playerRef.current?.destroy();
      playerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [elementId]);

  const playVideoId = useCallback((videoId: string) => {
    lastRequestedIdRef.current = videoId;
    errorRetriedRef.current = false;
    const called = callWhenReady(playerRef.current, "loadVideoById", videoId);
    if (!called) {
      // Player script/iframe hasn't finished initializing yet — load it
      // as soon as onReady fires instead of dropping the request.
      pendingVideoIdRef.current = videoId;
    }
    setStatus("playing");
  }, []);

  const play = useCallback(() => {
    if (callWhenReady(playerRef.current, "playVideo")) setStatus("playing");
  }, []);

  const pause = useCallback(() => {
    if (callWhenReady(playerRef.current, "pauseVideo")) setStatus("paused");
  }, []);

  const stop = useCallback(() => {
    const paused = callWhenReady(playerRef.current, "pauseVideo");
    callWhenReady(playerRef.current, "seekTo", 0, true);
    if (paused) setStatus("stopped");
  }, []);

  return { ready, status, playVideoId, play, pause, stop };
}
