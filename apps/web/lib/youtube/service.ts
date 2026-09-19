import "server-only";
import type { YouTubeSearchResult, YouTubeVideo } from "@karaoke-queue/shared";

const YOUTUBE_API_BASE = "https://www.googleapis.com/youtube/v3";

interface YouTubeSearchApiItem {
  id: { videoId: string };
  snippet: {
    title: string;
    channelTitle: string;
    publishedAt: string;
    thumbnails: {
      high?: { url: string };
      medium?: { url: string };
      default?: { url: string };
    };
  };
}

interface YouTubeSearchApiResponse {
  items: YouTubeSearchApiItem[];
  nextPageToken?: string;
}

interface YouTubeVideosApiItem {
  id: string;
  contentDetails: { duration: string };
}

interface YouTubeVideosApiResponse {
  items: YouTubeVideosApiItem[];
}

/**
 * Parses an ISO 8601 duration (e.g. "PT3M45S") into whole seconds.
 */
function parseIsoDuration(iso: string): number | null {
  const match = /^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.exec(iso);
  if (!match) return null;
  const [, h, m, s] = match;
  const hours = h ? parseInt(h, 10) : 0;
  const minutes = m ? parseInt(m, 10) : 0;
  const seconds = s ? parseInt(s, 10) : 0;
  return hours * 3600 + minutes * 60 + seconds;
}

function requireApiKey(): string {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) {
    throw new Error(
      "YOUTUBE_API_KEY is not set. Add it to your server environment — never expose it to the client."
    );
  }
  return key;
}

/**
 * Thin, server-only wrapper around the YouTube Data API v3. Never import
 * this from a Client Component — the API key is server-only.
 */
export const YouTubeService = {
  /**
   * Searches YouTube for karaoke videos matching the query. Automatically
   * appends "karaoke" to bias results if the term isn't already present,
   * since this app is specifically for karaoke playback.
   */
  async searchVideos(query: string, pageToken?: string): Promise<YouTubeSearchResult> {
    const apiKey = requireApiKey();
    // const effectiveQuery = /karaoke/i.test(query) ? query : `${query} karaoke`;
    const effectiveQuery = query;

    const searchUrl = new URL(`${YOUTUBE_API_BASE}/search`);
    searchUrl.searchParams.set("part", "snippet");
    searchUrl.searchParams.set("type", "video");
    searchUrl.searchParams.set("maxResults", "12");
    searchUrl.searchParams.set("q", effectiveQuery);
    searchUrl.searchParams.set("key", apiKey);
    if (pageToken) searchUrl.searchParams.set("pageToken", pageToken);

    const searchRes = await fetch(searchUrl, { next: { revalidate: 3600 } });
    if (!searchRes.ok) {
      throw new Error(`YouTube search failed with status ${searchRes.status}`);
    }
    const searchData = (await searchRes.json()) as YouTubeSearchApiResponse;

    const videoIds = searchData.items.map((item) => item.id.videoId).filter(Boolean);
    const durations =
      videoIds.length > 0 ? await this.getDurations(videoIds, apiKey) : {};

    const videos: YouTubeVideo[] = searchData.items.map((item) => ({
      id: item.id.videoId,
      youtubeId: item.id.videoId,
      title: item.snippet.title,
      channelTitle: item.snippet.channelTitle,
      thumbnailUrl:
        item.snippet.thumbnails.high?.url ??
        item.snippet.thumbnails.medium?.url ??
        item.snippet.thumbnails.default?.url ??
        "",
      durationSeconds: durations[item.id.videoId] ?? null,
      publishedAt: item.snippet.publishedAt
    }));

    return {
      videos,
      nextPageToken: searchData.nextPageToken ?? null
    };
  },

  /**
   * Fetches duration (in seconds) for a batch of video ids.
   */
  async getDurations(
    videoIds: string[],
    apiKey = requireApiKey()
  ): Promise<Record<string, number>> {
    const url = new URL(`${YOUTUBE_API_BASE}/videos`);
    url.searchParams.set("part", "contentDetails");
    url.searchParams.set("id", videoIds.join(","));
    url.searchParams.set("key", apiKey);

    const res = await fetch(url, { next: { revalidate: 86400 } });
    if (!res.ok) return {};

    const data = (await res.json()) as YouTubeVideosApiResponse;
    const result: Record<string, number> = {};
    for (const item of data.items) {
      const seconds = parseIsoDuration(item.contentDetails.duration);
      if (seconds !== null) result[item.id] = seconds;
    }
    return result;
  },

  /**
   * Fetches a single video by id (used when adding a video that isn't
   * already cached, e.g. from a direct link in a future phase).
   */
  async getVideo(youtubeId: string): Promise<YouTubeVideo | null> {
    const videos = await this.getVideos([youtubeId]);
    return videos[0] ?? null;
  },

  async getVideos(youtubeIds: string[]): Promise<YouTubeVideo[]> {
    if (youtubeIds.length === 0) return [];
    const apiKey = requireApiKey();

    const url = new URL(`${YOUTUBE_API_BASE}/videos`);
    url.searchParams.set("part", "snippet,contentDetails");
    url.searchParams.set("id", youtubeIds.join(","));
    url.searchParams.set("key", apiKey);

    const res = await fetch(url, { next: { revalidate: 86400 } });
    if (!res.ok) throw new Error(`YouTube videos.list failed with status ${res.status}`);

    const data = (await res.json()) as {
      items: Array<{
        id: string;
        snippet: YouTubeSearchApiItem["snippet"];
        contentDetails: { duration: string };
      }>;
    };

    return data.items.map((item) => ({
      id: item.id,
      youtubeId: item.id,
      title: item.snippet.title,
      channelTitle: item.snippet.channelTitle,
      thumbnailUrl:
        item.snippet.thumbnails.high?.url ??
        item.snippet.thumbnails.medium?.url ??
        item.snippet.thumbnails.default?.url ??
        "",
      durationSeconds: parseIsoDuration(item.contentDetails.duration),
      publishedAt: item.snippet.publishedAt
    }));
  }
};
