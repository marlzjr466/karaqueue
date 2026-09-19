import type { createClient as createServerClientType } from "@/lib/supabase/server";

export interface PlaylistSummary {
  id: string;
  name: string;
  description: string | null;
  songCount: number;
  updatedAt: string;
}

export interface PlaylistItemWithVideo {
  id: string;
  position: number;
  video: {
    youtubeId: string;
    title: string;
    channelTitle: string;
    thumbnailUrl: string;
    durationSeconds: number | null;
  };
}

export interface PlaylistDetail {
  id: string;
  name: string;
  description: string | null;
  items: PlaylistItemWithVideo[];
}

export async function getUserPlaylists(
  supabase: Awaited<ReturnType<typeof createServerClientType>>,
  userId: string
): Promise<PlaylistSummary[]> {
  const { data, error } = await supabase
    .from("playlist_summaries")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (error || !data) return [];

  return data.map((row) => ({
    id: row.id,
    name: row.name,
    description: row.description,
    songCount: row.song_count,
    updatedAt: row.updated_at
  }));
}

export async function getPlaylistDetail(
  supabase: Awaited<ReturnType<typeof createServerClientType>>,
  userId: string,
  playlistId: string
): Promise<PlaylistDetail | null> {
  const { data: playlist, error: playlistError } = await supabase
    .from("playlists")
    .select("id, name, description")
    .eq("id", playlistId)
    .eq("user_id", userId)
    .single();

  if (playlistError || !playlist) return null;

  const { data: items, error: itemsError } = await supabase
    .from("playlist_items")
    .select(
      "id, position, youtube_videos(youtube_id, title, channel_title, thumbnail_url, duration_seconds)"
    )
    .eq("playlist_id", playlistId)
    .order("position", { ascending: true });

  if (itemsError || !items) {
    return {
      id: playlist.id,
      name: playlist.name,
      description: playlist.description,
      items: []
    };
  }

  return {
    id: playlist.id,
    name: playlist.name,
    description: playlist.description,
    items: items
      .filter((row) => row.youtube_videos)
      .map((row) => {
        const video = Array.isArray(row.youtube_videos)
          ? row.youtube_videos[0]
          : row.youtube_videos;
        return {
          id: row.id,
          position: row.position,
          video: {
            youtubeId: video.youtube_id,
            title: video.title,
            channelTitle: video.channel_title,
            thumbnailUrl: video.thumbnail_url,
            durationSeconds: video.duration_seconds
          }
        };
      })
  };
}
