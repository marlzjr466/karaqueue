import "server-only";
import type { YouTubeVideo } from "@karaoke-queue/shared";
import type { createClient as createServerClientType } from "@/lib/supabase/server";

/**
 * Upserts search results into the `youtube_videos` cache table so later
 * phases (queue, playlists) can reference a stable internal id instead of
 * re-fetching from YouTube every time. Best-effort — a caching failure
 * should never block returning search results to the user.
 */
export async function cacheYouTubeVideos(
  supabase: Awaited<ReturnType<typeof createServerClientType>>,
  videos: YouTubeVideo[]
): Promise<void> {
  if (videos.length === 0) return;

  const rows = videos.map((v) => ({
    youtube_id: v.youtubeId,
    title: v.title,
    channel_title: v.channelTitle,
    thumbnail_url: v.thumbnailUrl,
    duration_seconds: v.durationSeconds,
    published_at: v.publishedAt
  }));

  const { error } = await supabase
    .from("youtube_videos")
    .upsert(rows, { onConflict: "youtube_id" });

  if (error) {
    console.error("Failed to cache YouTube videos:", error.message);
  }
}

/**
 * Upserts a single video and returns its internal `youtube_videos.id`
 * (a uuid), inserting it if it isn't cached yet. Used when adding a video
 * to the queue or a playlist, since those tables reference the internal
 * id rather than the raw YouTube video id.
 */
export async function getOrCreateVideoRowId(
  supabase: Awaited<ReturnType<typeof createServerClientType>>,
  video: YouTubeVideo
): Promise<string> {
  const { data, error } = await supabase
    .from("youtube_videos")
    .upsert(
      {
        youtube_id: video.youtubeId,
        title: video.title,
        channel_title: video.channelTitle,
        thumbnail_url: video.thumbnailUrl,
        duration_seconds: video.durationSeconds,
        published_at: video.publishedAt
      },
      { onConflict: "youtube_id" }
    )
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Could not save video metadata.");
  }

  return data.id;
}
