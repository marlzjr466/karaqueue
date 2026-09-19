import { z } from "zod";

export const addQueueItemSchema = z.object({
  youtubeId: z.string().min(1, "A video is required."),
  title: z.string().min(1),
  channelTitle: z.string().min(1),
  thumbnailUrl: z.string().min(1),
  durationSeconds: z.number().int().nonnegative().nullable(),
  publishedAt: z.string().nullable()
});
export type AddQueueItemInput = z.infer<typeof addQueueItemSchema>;

export const removeQueueItemSchema = z.object({
  queueItemId: z.string().uuid()
});
export type RemoveQueueItemInput = z.infer<typeof removeQueueItemSchema>;

export const reorderQueueSchema = z.object({
  orderedQueueItemIds: z.array(z.string().uuid()).min(1)
});
export type ReorderQueueInput = z.infer<typeof reorderQueueSchema>;

export const skipQueueItemSchema = z.object({
  queueItemId: z.string().uuid()
});
export type SkipQueueItemInput = z.infer<typeof skipQueueItemSchema>;
