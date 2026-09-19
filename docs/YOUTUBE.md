# YouTube Integration

## Compliance

- We never download YouTube videos or store video files.
- `youtube_videos` (see `docs/DATABASE.md`) stores metadata only:
  title, channel, thumbnail URL, duration, published date.
- Playback (from Phase 5 onward) uses the official YouTube embedded
  player — no circumventing playback restrictions, no unauthorized
  mirroring.

## Setup

1. Create a project in Google Cloud Console and enable the
   **YouTube Data API v3**.
2. Create an API key, restrict it to the YouTube Data API v3, and set it
   server-side only:
   ```
   YOUTUBE_API_KEY=your-key-here
   ```
3. Never expose this key to the client — it's read only inside
   `apps/web/lib/youtube/service.ts`, which is guarded with the
   `server-only` package.

## Architecture

```
apps/web/lib/youtube/service.ts   YouTubeService — server-only YouTube Data API v3 wrapper
apps/web/lib/youtube/cache.ts     Upserts search results into youtube_videos (best-effort)
apps/web/app/api/youtube/search   GET /api/youtube/search — auth + Zod validation + service call
apps/web/components/search/       SearchBar (debounced), SearchResults (loading/empty/error/pagination)
apps/web/components/ui/song-card.tsx   Result card: thumbnail, title, channel, duration, actions
```

### `YouTubeService`

- `searchVideos(query, pageToken?)` — calls `search.list`, then batches a
  `videos.list` call for `contentDetails.duration` so results show real
  song lengths. Automatically appends "karaoke" to the query if the term
  isn't already present, since this app is karaoke-specific.
- `getVideo(youtubeId)` / `getVideos(youtubeIds)` — fetch full metadata
  for known video ids (used when a queue/playlist item references a video
  not already in the local `youtube_videos` cache).

### Caching

Search results are upserted into `youtube_videos` (keyed by `youtube_id`)
so the queue and playlist features (Phases 4 and 6) can reference a stable
internal row instead of re-fetching from YouTube. Caching is best-effort —
a caching failure is logged but never blocks returning search results to
the user.

### Rate limiting / quota

The YouTube Data API v3 has a daily quota (10,000 units by default; a
`search.list` call costs 100 units). `searchVideos` results are fetched
with Next.js's `fetch` cache (`revalidate: 3600` for search,
`revalidate: 86400` for duration lookups) to reduce redundant calls.
Add stricter per-user rate limiting in front of `/api/youtube/search` if
usage grows — not implemented yet, since this is out of scope for Phase 3.

## Not yet implemented

- **Add to Queue / Add to Playlist** buttons are present on the UI but
  currently show a toast pointing to the phase that implements them
  (queue → Phase 4, playlists → Phase 6). Wiring them up is a matter of
  calling the queue/playlist insert endpoints once those tables and RLS
  policies exist — the video metadata and `youtube_videos` cache row are
  already available by then.
