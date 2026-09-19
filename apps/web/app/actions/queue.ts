"use server";

import { revalidatePath } from "next/cache";
import {
  addQueueItemSchema,
  removeQueueItemSchema,
  reorderQueueSchema
} from "@karaoke-queue/validation";
import { API_ERROR_CODES } from "@karaoke-queue/shared";
import { createClient } from "@/lib/supabase/server";
import { getOrCreateVideoRowId } from "@/lib/youtube/cache";

export interface QueueActionResult {
  success: boolean;
  code?: string;
  message?: string;
}

export async function addToQueueAction(input: unknown): Promise<QueueActionResult> {
  const parsed = addQueueItemSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: "That video couldn't be added." };
  }

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) {
    return {
      success: false,
      code: API_ERROR_CODES.UNAUTHORIZED,
      message: "Sign in required."
    };
  }

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

    const { error } = await supabase.rpc("add_queue_item", {
      p_youtube_video_id: videoRowId
    });

    if (error) {
      if (error.message.includes("QUEUE_LIMIT_REACHED")) {
        return {
          success: false,
          code: "QUEUE_LIMIT_REACHED",
          message: "Your queue is full."
        };
      }
      return { success: false, message: "Unable to add this song. Try again." };
    }

    revalidatePath("/queue");
    revalidatePath("/dashboard");
    return { success: true };
  } catch {
    return { success: false, message: "Unable to add this song. Try again." };
  }
}

export async function removeFromQueueAction(
  queueItemId: string
): Promise<QueueActionResult> {
  const parsed = removeQueueItemSchema.safeParse({ queueItemId });
  if (!parsed.success) {
    return { success: false, message: "Invalid queue item." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("remove_queue_item", {
    p_queue_item_id: parsed.data.queueItemId
  });

  if (error) {
    return { success: false, message: "Could not remove this song. Try again." };
  }

  revalidatePath("/queue");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function reorderQueueAction(
  orderedQueueItemIds: string[]
): Promise<QueueActionResult> {
  const parsed = reorderQueueSchema.safeParse({ orderedQueueItemIds });
  if (!parsed.success) {
    return { success: false, message: "Invalid queue order." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("reorder_queue", {
    p_ordered_ids: parsed.data.orderedQueueItemIds
  });

  if (error) {
    return { success: false, message: "Could not save the new order. Try again." };
  }

  revalidatePath("/queue");
  return { success: true };
}

export async function clearQueueAction(): Promise<QueueActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("clear_queue");

  if (error) {
    return { success: false, message: "Could not clear your queue. Try again." };
  }

  revalidatePath("/queue");
  revalidatePath("/dashboard");
  return { success: true };
}

export interface PlayNextResult extends QueueActionResult {
  nextQueueItemId: string | null;
}

/**
 * Advances playback: optionally marks `finishQueueItemId` as
 * completed/skipped, then promotes the next queued item to "playing".
 * Called on video-end (status "completed"), on manual Skip/Next (status
 * "skipped"), and with no `finishQueueItemId` to start playback from
 * idle. Returns the new current item's id, or null if the queue is now
 * empty.
 */
export async function playNextAction(
  finishQueueItemId: string | null,
  finishStatus: "completed" | "skipped" = "completed"
): Promise<PlayNextResult> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("play_next_queue_item", {
    p_finish_queue_item_id: finishQueueItemId,
    p_finish_status: finishStatus
  });

  if (error) {
    return {
      success: false,
      nextQueueItemId: null,
      message: "Could not advance the queue. Try again."
    };
  }

  revalidatePath("/queue");
  revalidatePath("/dashboard");
  return { success: true, nextQueueItemId: data };
}
