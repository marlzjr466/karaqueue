export interface YouTubeVideo {
  id: string;
  youtubeId: string;
  title: string;
  channelTitle: string;
  thumbnailUrl: string;
  durationSeconds: number | null;
  publishedAt: string | null;
}

export interface YouTubeSearchResult {
  videos: YouTubeVideo[];
  nextPageToken: string | null;
}
