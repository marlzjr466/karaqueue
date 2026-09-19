"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import type { YouTubeSearchResult, YouTubeVideo, ApiResult } from "@karaoke-queue/shared";
import { SearchBar } from "@/components/search/search-bar";
import { SongCardCompact } from "@/components/ui/song-card-compact";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { UpgradeDialog } from "@/components/app/upgrade-dialog";
import { AddToPlaylistDialog } from "@/components/playlists/add-to-playlist-dialog";

async function fetchSearch(
  query: string,
  pageToken?: string
): Promise<YouTubeSearchResult> {
  const params = new URLSearchParams({ query });
  if (pageToken) params.set("pageToken", pageToken);

  const res = await fetch(`/api/youtube/search?${params.toString()}`);
  const json: ApiResult<YouTubeSearchResult> = await res.json();

  if (!json.success) throw new Error(json.error.message);
  return json.data;
}

export function SearchPanel({
  queueCount,
  queueLimit,
  onAddToQueue,
  bare = false
}: {
  queueCount: number;
  queueLimit: number;
  onAddToQueue: (
    video: YouTubeVideo
  ) => Promise<{ success: boolean; limitReached?: boolean }>;
  /** Omits the "Search karaoke songs" header — used when a parent
   * (e.g. FullscreenSearchPanel) already renders its own header chrome. */
  bare?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [playlistVideo, setPlaylistVideo] = useState<YouTubeVideo | null>(null);

  const { data, isFetching, isError, error } = useQuery({
    queryKey: ["youtube-search", query],
    queryFn: () => fetchSearch(query),
    enabled: query.length > 0
  });

  useEffect(() => {
    if (data) {
      setVideos(data.videos);
      setNextPageToken(data.nextPageToken);
    }
    if (query.length === 0) {
      setVideos([]);
      setNextPageToken(null);
    }
  }, [data, query]);

  async function loadMore() {
    if (!nextPageToken) return;
    setLoadingMore(true);
    try {
      const more = await fetchSearch(query, nextPageToken);
      setVideos((prev) => [...prev, ...more.videos]);
      setNextPageToken(more.nextPageToken);
    } catch {
      toast.error("Couldn't load more results. Try again.");
    } finally {
      setLoadingMore(false);
    }
  }

  const queueFull = queueCount >= queueLimit;

  async function handleAdd(video: YouTubeVideo) {
    setAddingId(video.youtubeId);
    const result = await onAddToQueue(video);
    setAddingId(null);

    if (!result.success) {
      if (result.limitReached) setUpgradeOpen(true);
      return;
    }
    toast.success(`Added "${video.title}" to your queue.`);
  }

  return (
    <div className="flex h-full flex-col">
      <div
        className={
          bare ? "flex-shrink-0 p-3" : "flex-shrink-0 border-b border-white/10 p-4"
        }
      >
        {!bare && (
          <h2 className="text-sm font-semibold uppercase tracking-widest text-white/50">
            Search karaoke songs
          </h2>
        )}
        <div className={bare ? "" : "mt-3"}>
          <SearchBar onSearch={setQuery} />
        </div>
        {queueFull && (
          <p className="mt-2 text-xs text-neon-magenta">
            Your queue is full — remove a song or upgrade to add more.
          </p>
        )}
      </div>

      <div className={bare ? "flex-1 overflow-y-auto p-3" : "flex-1 overflow-y-auto p-4"}>
        {query.length === 0 && (
          <EmptyState
            title="Search for your next song."
            description="Try an artist or a song title."
          />
        )}

        {isFetching && videos.length === 0 && query.length > 0 && (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        )}

        {isError && query.length > 0 && (
          <EmptyState
            title="YouTube search failed."
            description={error instanceof Error ? error.message : "Please try again."}
          />
        )}

        {!isFetching && !isError && query.length > 0 && videos.length === 0 && (
          <EmptyState
            title="No results found."
            description={`Nothing matched "${query}". Try a different search.`}
          />
        )}

        {videos.length > 0 && (
          <div className="space-y-3">
            {videos.map((video) => (
              <SongCardCompact
                key={video.youtubeId}
                video={video}
                addingToQueue={addingId === video.youtubeId}
                queueFull={queueFull}
                onAddToQueue={handleAdd}
                onAddToPlaylist={() => setPlaylistVideo(video)}
              />
            ))}

            {nextPageToken && (
              <div className="pt-2 text-center">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={loadMore}
                  disabled={loadingMore}
                >
                  {loadingMore ? "Loading…" : "Load more"}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      <UpgradeDialog
        open={upgradeOpen}
        onOpenChange={setUpgradeOpen}
        title="Your queue is full"
        description="Free accounts can queue up to 15 songs. Upgrade to Premium for up to 60."
      />

      <AddToPlaylistDialog
        video={playlistVideo}
        open={playlistVideo !== null}
        onOpenChange={(open) => !open && setPlaylistVideo(null)}
      />
    </div>
  );
}
