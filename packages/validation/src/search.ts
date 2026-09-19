import { z } from "zod";

export const youtubeSearchSchema = z.object({
  query: z
    .string()
    .trim()
    .min(1, "Enter a search term.")
    .max(150, "Search term is too long."),
  pageToken: z.string().optional()
});
export type YouTubeSearchInput = z.infer<typeof youtubeSearchSchema>;
