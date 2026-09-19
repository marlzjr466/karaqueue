"use server";

import { revalidatePath } from "next/cache";
import {
  createPlaylistSchema,
  renamePlaylistSchema,
  deletePlaylistSchema,
  addPlaylistItemSchema,
  removePlaylistItemSchema,
  reorderPlaylistItemsSchema,
  loadPlaylistIntoQueueSchema
} from "@karaoke-queue/validation";
import { createClient } from "@/lib/supabase/server";
import { getOrCreateVideoRowId } from "@/lib/youtube/cache";
import { getUserPlaylists, type PlaylistSummary } from "@/lib/playlists/get-playlists";

export interface PlaylistActionResult {
  success: boolean;
  code?: string;
  message?: string;
  playlistId?: string;
}

/**
 * Used by AddToPlaylistDialog to list the signed-in user's playlists
 * without prop-drilling them through every page that can add a song to a
 * playlist (search results, queue, etc).
 */
export async function listPlaylistsAction(): Promise<PlaylistSummary[]> {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return [];
  return getUserPlaylists(supabase, user.id);
}

export async function createPlaylistAction(
  input: unknown
): Promise<PlaylistActionResult> {
  const parsed = createPlaylistSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.errors[0]?.message ?? "Invalid playlist name."
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_playlist", {
    p_name: parsed.data.name,
    p_description: parsed.data.description ?? null
  });

  if (error) {
    if (error.message.includes("PLAYLIST_LIMIT_REACHED")) {
      return {
        success: false,
        code: "PLAYLIST_LIMIT_REACHED",
        message: "You've reached your playlist limit."
      };
    }
    return { success: false, message: "Could not create playlist. Try again." };
  }

  revalidatePath("/playlists");
  return { success: true, playlistId: data?.id };
}

export async function renamePlaylistAction(
  playlistId: string,
  name: string
): Promise<PlaylistActionResult> {
  const parsed = renamePlaylistSchema.safeParse({ playlistId, name });
  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.errors[0]?.message ?? "Invalid name."
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("rename_playlist", {
    p_playlist_id: parsed.data.playlistId,
    p_name: parsed.data.name
  });

  if (error) {
    return { success: false, message: "Could not rename playlist. Try again." };
  }

  revalidatePath("/playlists");
  revalidatePath(`/playlists/${playlistId}`);
  return { success: true };
}

export async function deletePlaylistAction(
  playlistId: string
): Promise<PlaylistActionResult> {
  const parsed = deletePlaylistSchema.safeParse({ playlistId });
  if (!parsed.success) {
    return { success: false, message: "Invalid playlist." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("delete_playlist", {
    p_playlist_id: parsed.data.playlistId
  });

  if (error) {
    return { success: false, message: "Could not delete playlist. Try again." };
  }

  revalidatePath("/playlists");
  return { success: true };
}

export async function addToPlaylistAction(input: unknown): Promise<PlaylistActionResult> {
  const parsed = addPlaylistItemSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: "That video couldn't be added." };
  }

  const supabase = await createClient();

  try {
    const videoRowId = await getOrCreateVideoRowId(supabase, {
      id: parsed.data.youtubeId,
      youtubeId: parsed.data.youtubeId,
      title: parsed.data.title,
      channelTitle: parsed.data.channelTitle,
      thumbnailUrl: parsed.data.thumbnailUrl,
      durationSeconds: parsed.data.durationSeconds,
      publishedAt: parsed.data.publishedAt
    });

    const { error } = await supabase.rpc("add_playlist_item", {
      p_playlist_id: parsed.data.playlistId,
      p_youtube_video_id: videoRowId
    });

    if (error) {
      if (error.message.includes("SONG_ALREADY_IN_PLAYLIST")) {
        return {
          success: false,
          code: "SONG_ALREADY_IN_PLAYLIST",
          message: "Already in this playlist."
        };
      }
      return { success: false, message: "Unable to add this song. Try again." };
    }

    revalidatePath(`/playlists/${parsed.data.playlistId}`);
    revalidatePath("/playlists");
    return { success: true };
  } catch {
    return { success: false, message: "Unable to add this song. Try again." };
  }
}

export async function removeFromPlaylistAction(
  playlistItemId: string,
  playlistId: string
): Promise<PlaylistActionResult> {
  const parsed = removePlaylistItemSchema.safeParse({ playlistItemId });
  if (!parsed.success) {
    return { success: false, message: "Invalid item." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("remove_playlist_item", {
    p_playlist_item_id: parsed.data.playlistItemId
  });

  if (error) {
    return { success: false, message: "Could not remove this song. Try again." };
  }

  revalidatePath(`/playlists/${playlistId}`);
  revalidatePath("/playlists");
  return { success: true };
}

export async function reorderPlaylistItemsAction(
  playlistId: string,
  orderedItemIds: string[]
): Promise<PlaylistActionResult> {
  const parsed = reorderPlaylistItemsSchema.safeParse({ playlistId, orderedItemIds });
  if (!parsed.success) {
    return { success: false, message: "Invalid order." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("reorder_playlist_items", {
    p_playlist_id: parsed.data.playlistId,
    p_ordered_ids: parsed.data.orderedItemIds
  });

  if (error) {
    return { success: false, message: "Could not save the new order. Try again." };
  }

  revalidatePath(`/playlists/${playlistId}`);
  return { success: true };
}

export interface LoadPlaylistResult extends PlaylistActionResult {
  addedCount: number;
  skippedCount: number;
}

export async function loadPlaylistIntoQueueAction(
  playlistId: string,
  mode: "replace" | "append"
): Promise<LoadPlaylistResult> {
  const parsed = loadPlaylistIntoQueueSchema.safeParse({ playlistId, mode });
  if (!parsed.success) {
    return {
      success: false,
      message: "Invalid request.",
      addedCount: 0,
      skippedCount: 0
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("load_playlist_into_queue", {
    p_playlist_id: parsed.data.playlistId,
    p_mode: parsed.data.mode
  });

  if (error || !data || data.length === 0) {
    return {
      success: false,
      message: "Your playlist could not be loaded.",
      addedCount: 0,
      skippedCount: 0
    };
  }

  const result = data[0];
  if (!result) {
    return {
      success: false,
      message: "Your playlist could not be loaded.",
      addedCount: 0,
      skippedCount: 0
    };
  }

  revalidatePath("/queue");
  revalidatePath("/dashboard");
  return {
    success: true,
    addedCount: result.added_count,
    skippedCount: result.skipped_count
  };
}
