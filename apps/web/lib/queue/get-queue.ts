import type { createClient as createServerClientType } from "@/lib/supabase/server";

export interface QueueItemWithVideo {
  id: string;
  position: number;
  status: string;
  addedAt: string;
  video: {
    youtubeId: string;
    title: string;
    channelTitle: string;
    thumbnailUrl: string;
    durationSeconds: number | null;
  };
}

/**
 * Fetches the signed-in user's active queue (queued + the currently
 * playing item, if any), ordered by position, joined with the cached
 * YouTube video metadata for each item. Completed/skipped items stay in
 * the table as history but are excluded here.
 */
export async function getUserQueue(
  supabase: Awaited<ReturnType<typeof createServerClientType>>,
  userId: string
): Promise<QueueItemWithVideo[]> {
  const { data, error } = await supabase
    .from("queue_items")
    .select(
      "id, position, status, added_at, youtube_videos(youtube_id, title, channel_title, thumbnail_url, duration_seconds)"
    )
    .eq("user_id", userId)
    .in("status", ["queued", "playing"])
    .order("position", { ascending: true });

  if (error || !data) return [];

  return data
    .filter((row) => row.youtube_videos)
    .map((row) => {
      const video = Array.isArray(row.youtube_videos)
        ? row.youtube_videos[0]
        : row.youtube_videos;
      return {
        id: row.id,
        position: row.position,
        status: row.status,
        addedAt: row.added_at,
        video: {
          youtubeId: video.youtube_id,
          title: video.title,
          channelTitle: video.channel_title,
          thumbnailUrl: video.thumbnail_url,
          durationSeconds: video.duration_seconds
        }
      };
    });
}
