import type { YouTubeVideo } from "./youtube";

export const QUEUE_STATUSES = [
  "queued",
  "playing",
  "paused",
  "completed",
  "skipped"
] as const;
export type QueueStatus = (typeof QUEUE_STATUSES)[number];

export interface QueueItem {
  id: string;
  userId: string;
  video: YouTubeVideo;
  position: number;
  status: QueueStatus;
  addedAt: string;
  startedAt: string | null;
  completedAt: string | null;
}

export interface PlayerState {
  currentVideoId: string | null;
  currentQueueItemId: string | null;
  status: "idle" | "playing" | "paused" | "stopped";
  queuePosition: number;
}

export function getNextQueuedItem(items: QueueItem[]): QueueItem | undefined {
  return [...items]
    .filter((item) => item.status === "queued")
    .sort((a, b) => a.position - b.position)[0];
}
