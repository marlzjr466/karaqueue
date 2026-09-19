import { z } from "zod";

export const createPlaylistSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Playlist name is required.")
    .max(80, "Playlist name is too long."),
  description: z
    .string()
    .trim()
    .max(300, "Description is too long.")
    .optional()
    .nullable()
});
export type CreatePlaylistInput = z.infer<typeof createPlaylistSchema>;

export const renamePlaylistSchema = z.object({
  playlistId: z.string().uuid(),
  name: z
    .string()
    .trim()
    .min(1, "Playlist name is required.")
    .max(80, "Playlist name is too long.")
});
export type RenamePlaylistInput = z.infer<typeof renamePlaylistSchema>;

export const deletePlaylistSchema = z.object({
  playlistId: z.string().uuid()
});
export type DeletePlaylistInput = z.infer<typeof deletePlaylistSchema>;

export const removePlaylistItemSchema = z.object({
  playlistItemId: z.string().uuid()
});
export type RemovePlaylistItemInput = z.infer<typeof removePlaylistItemSchema>;

export const addPlaylistItemSchema = z.object({
  playlistId: z.string().uuid(),
  youtubeId: z.string().min(1),
  title: z.string().min(1),
  channelTitle: z.string().min(1),
  thumbnailUrl: z.string().min(1),
  durationSeconds: z.number().int().nonnegative().nullable(),
  publishedAt: z.string().nullable()
});
export type AddPlaylistItemInput = z.infer<typeof addPlaylistItemSchema>;

export const reorderPlaylistItemsSchema = z.object({
  playlistId: z.string().uuid(),
  orderedItemIds: z.array(z.string().uuid()).min(1)
});
export type ReorderPlaylistItemsInput = z.infer<typeof reorderPlaylistItemsSchema>;

export const loadPlaylistIntoQueueSchema = z.object({
  playlistId: z.string().uuid(),
  mode: z.enum(["replace", "append"])
});
export type LoadPlaylistIntoQueueInput = z.infer<typeof loadPlaylistIntoQueueSchema>;
