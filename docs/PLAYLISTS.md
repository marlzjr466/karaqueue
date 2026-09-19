# Playlists

## Architecture

Same pattern as the queue (Phase 4): `playlists`/`playlist_items` have RLS
that only allows `select` for the owner — every mutation goes through a
`security definer` Postgres function instead, so the Free-plan playlist
limit and correct song ordering can never be bypassed by a direct client
write.

```
supabase/migrations/016-022_*.sql        Tables, RLS, functions, summary view
apps/web/lib/playlists/get-playlists.ts   getUserPlaylists, getPlaylistDetail
apps/web/app/actions/playlists.ts         Server Actions wrapping the RPC functions
apps/web/app/playlists/page.tsx            List page
apps/web/app/playlists/[id]/page.tsx        Detail page
apps/web/components/playlists/            Dialogs + the drag-reorderable song list
```

## Functions

| Function                                           | What it does                                                                                                                                                                                                                                                                             |
| -------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `create_playlist(name, description?)`              | Advisory-locked count check against the caller's `max_playlists` (from `subscription_plans`; `NULL` = unlimited), then inserts. Raises `PLAYLIST_LIMIT_REACHED` otherwise.                                                                                                               |
| `rename_playlist` / `delete_playlist`              | Scoped to `auth.uid()` — a call for a playlist you don't own silently affects zero rows.                                                                                                                                                                                                 |
| `add_playlist_item(playlist_id, youtube_video_id)` | Raises `SONG_ALREADY_IN_PLAYLIST` if the `(playlist_id, youtube_video_id)` unique constraint would be violated, so the UI can show a friendly message instead of a raw DB error.                                                                                                         |
| `remove_playlist_item`                             | Deletes and recompacts `position` for the remaining items.                                                                                                                                                                                                                               |
| `reorder_playlist_items`                           | Rejects unless the id array is exactly the playlist's current items (same defensive check as `reorder_queue`).                                                                                                                                                                           |
| `load_playlist_into_queue(playlist_id, mode)`      | `mode = 'replace'` clears the caller's `queued` items first; `mode = 'append'` doesn't. Either way, only inserts up to the caller's remaining queue capacity and reports how many songs were skipped, so a playlist bigger than the queue limit degrades gracefully instead of erroring. |

## UI flows

- **Create** — `CreatePlaylistDialog` (used on `/playlists`) or inline from
  `AddToPlaylistDialog`'s "create new" mini-form when adding a song from
  search. Both show the free-plan upgrade dialog on `PLAYLIST_LIMIT_REACHED`.
- **Add a song to a playlist** — the "Playlist" button on every search
  result (both the standalone `/search` grid and the `/queue` sidebar/
  fullscreen search panel) opens `AddToPlaylistDialog`, which lists the
  user's playlists via a `listPlaylistsAction` server action (avoids
  prop-drilling the playlist list through every page that can add a song).
- **Reorder / remove songs** — `/playlists/[id]` uses the same
  optimistic-update + revert-on-error `dnd-kit` pattern as the Phase 4
  queue strip, just vertical instead of horizontal.
- **Load into queue** — `LoadPlaylistDialog` presents the Replace/Add
  choice from the product spec, then routes to `/queue` and reports
  `"Added N songs — M didn't fit"` when the playlist didn't fully fit.
- **Delete** — confirmation dialog (`DeletePlaylistDialog`), consistent
  with `ClearQueueButton`'s destructive-action pattern from Phase 4.
