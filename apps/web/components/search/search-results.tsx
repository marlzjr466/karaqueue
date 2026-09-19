"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import type { YouTubeSearchResult, YouTubeVideo, ApiResult } from "@karaoke-queue/shared";
import { SongCard } from "@/components/ui/song-card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { UpgradeDialog } from "@/components/app/upgrade-dialog";
import { AddToPlaylistDialog } from "@/components/playlists/add-to-playlist-dialog";
import { addToQueueAction } from "@/app/actions/queue";

async function fetchSearch(
  query: string,
  pageToken?: string
): Promise<YouTubeSearchResult> {
  const params = new URLSearchParams({ query });
  if (pageToken) params.set("pageToken", pageToken);

  const res = await fetch(`/api/youtube/search?${params.toString()}`);
  const json: ApiResult<YouTubeSearchResult> = await res.json();

  if (!json.success) {
    throw new Error(json.error.message);
  }
  return json.data;
}

export function SearchResults({ query }: { query: string }) {
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [playlistVideo, setPlaylistVideo] = useState<YouTubeVideo | null>(null);
  const router = useRouter();

  const { data, isFetching, isError, error } = useQuery({
    queryKey: ["youtube-search", query],
    queryFn: () => fetchSearch(query),
    enabled: query.length > 0
  });

  // Reset the accumulated list whenever a fresh first-page result arrives
  // (new query, or the same query re-fetched).
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

  async function handleAddToQueue(video: YouTubeVideo) {
    setAddingId(video.youtubeId);
    const result = await addToQueueAction({
      youtubeId: video.youtubeId,
      title: video.title,
      channelTitle: video.channelTitle,
      thumbnailUrl: video.thumbnailUrl,
      durationSeconds: video.durationSeconds,
      publishedAt: video.publishedAt
    });
    setAddingId(null);

    if (!result.success) {
      if (result.code === "QUEUE_LIMIT_REACHED") {
        setUpgradeOpen(true);
      } else {
        toast.error(result.message ?? "Unable to add this song.");
      }
      return;
    }

    toast.success(`Added "${video.title}" to your queue.`);
    router.refresh();
  }

  if (query.length === 0) {
    return (
      <EmptyState
        title="Search for your next song."
        description="Try an artist, a song title, or both."
      />
    );
  }

  if (isFetching && videos.length === 0) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="space-y-3">
            <Skeleton className="aspect-video w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <EmptyState
        title="YouTube search failed."
        description={error instanceof Error ? error.message : "Please try again."}
      />
    );
  }

  if (videos.length === 0) {
    return (
      <EmptyState
        title="No results found."
        description={`Nothing matched "${query}". Try a different search.`}
      />
    );
  }

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {videos.map((video) => (
          <SongCard
            key={video.youtubeId}
            video={video}
            addingToQueue={addingId === video.youtubeId}
            onAddToQueue={handleAddToQueue}
            onAddToPlaylist={() => setPlaylistVideo(video)}
          />
        ))}
      </div>

      {nextPageToken && (
        <div className="mt-8 flex justify-center">
          <Button variant="secondary" onClick={loadMore} disabled={loadingMore}>
            {loadingMore ? "Loading…" : "Load more"}
          </Button>
        </div>
      )}

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
