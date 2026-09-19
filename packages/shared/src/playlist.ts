import type { YouTubeVideo } from "./youtube";

export interface Playlist {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  coverUrl: string | null;
  songCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface PlaylistItem {
  id: string;
  playlistId: string;
  video: YouTubeVideo;
  position: number;
  addedAt: string;
}

export type LoadPlaylistMode = "replace" | "append";
