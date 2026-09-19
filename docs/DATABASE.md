# Database

## Provider

Supabase PostgreSQL. All schema changes are migration files under
`supabase/migrations/`, applied in filename order. Nothing is created
by hand through the dashboard.

## Phase 1 migrations

| File                                     | Purpose                                                                                                                                                                |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `001_create_subscription_plans.sql`      | Plan catalog (`free`, `premium`)                                                                                                                                       |
| `002_create_profiles.sql`                | `profiles` table + `handle_new_user()` trigger                                                                                                                         |
| `003_create_subscriptions.sql`           | `subscriptions` table; extends the signup trigger to default every new user onto the Free plan                                                                         |
| `004_enable_rls.sql`                     | Enables RLS on all three tables                                                                                                                                        |
| `005_create_rls_policies.sql`            | Per-table RLS policies (see below)                                                                                                                                     |
| `006_seed_subscription_plans.sql`        | Idempotent upsert of the Free/Premium rows                                                                                                                             |
| `007_create_user_entitlements_view.sql`  | `user_entitlements` view joining subscriptions → plans for convenient server-side reads                                                                                |
| `008_create_youtube_videos.sql`          | `youtube_videos` metadata cache table (title, channel, thumbnail, duration — never video files)                                                                        |
| `009_youtube_videos_rls.sql`             | RLS for `youtube_videos` — shared, non-user-owned cache, readable/writable by any authenticated user                                                                   |
| `010_create_queue_items.sql`             | `queue_items` table                                                                                                                                                    |
| `011_create_queue_indexes.sql`           | Indexes on `user_id`, `(user_id, position)`, `(user_id, status)`                                                                                                       |
| `012_queue_items_rls.sql`                | RLS for `queue_items` — select-only for the owner; **no** insert/update/delete policy                                                                                  |
| `013_create_queue_functions.sql`         | `add_queue_item`, `remove_queue_item`, `reorder_queue`, `clear_queue` — the only way to mutate a queue                                                                 |
| `014_create_player_functions.sql`        | `play_next_queue_item` — advances playback: finishes the current item (completed/skipped), promotes the next `queued` item to `playing`                                |
| `015_fix_queue_functions_for_status.sql` | Fixes `remove_queue_item`/`reorder_queue` to scope position math to `status = 'queued'` only, now that `playing`/`completed`/`skipped` rows persist as history         |
| `016_create_playlists.sql`               | `playlists` table                                                                                                                                                      |
| `017_create_playlist_items.sql`          | `playlist_items` table, unique on `(playlist_id, youtube_video_id)`                                                                                                    |
| `018_create_playlist_indexes.sql`        | Indexes on `playlist_id`, `(playlist_id, position)`                                                                                                                    |
| `019_playlists_rls.sql`                  | RLS for both tables — select-only; `playlist_items` ownership checked via an `EXISTS` join to `playlists`                                                              |
| `020_create_playlist_functions.sql`      | `create_playlist` (enforces the Free-plan playlist limit), `rename_playlist`, `delete_playlist`, `add_playlist_item`, `remove_playlist_item`, `reorder_playlist_items` |
| `021_create_load_playlist_function.sql`  | `load_playlist_into_queue` — loads a playlist's songs into the queue (`replace` or `append`), respecting the queue limit, returns `(added_count, skipped_count)`       |
| `022_create_playlist_summaries_view.sql` | `playlist_summaries` view — playlists joined with their song count                                                                                                     |
| `023_create_webhook_events.sql`          | `webhook_events` — processed Stripe event ids, for idempotent webhook handling (service-role only; RLS enabled with no policies, so no client role can touch it)       |

Tables for `playlists` and `playlist_items` are intentionally **not**
created yet — they arrive in Phase 6, with their own RLS policies.

## Queue limit enforcement (Phase 4)

`queue_items` has a `select`-only RLS policy for its owner and **no**
insert/update/delete policy at all. Every mutation goes through a
`security definer` Postgres function instead:

- **`add_queue_item(p_youtube_video_id)`** — takes a `pg_advisory_xact_lock`
  keyed on the caller's user id (so two concurrent requests, e.g. from two
  devices, can't both pass the limit check before either insert commits),
  looks up the caller's plan limit via `subscriptions` → `subscription_plans`,
  counts their current `queued` items, and only inserts if they're under
  the limit. Raises `QUEUE_LIMIT_REACHED` otherwise.
- **`remove_queue_item(p_queue_item_id)`** — deletes (scoped to the caller
  via `auth.uid()`, ignoring the id if it belongs to someone else) and
  recomputes contiguous `position` values for the remaining items.
- **`reorder_queue(p_ordered_ids)`** — rejects the call unless the id array
  is exactly the caller's current queue (same set, same length), then sets
  `position` to each id's index in the array.
- **`clear_queue()`** — deletes all of the caller's queue items.

Because there's no client-writable policy on the table, a client cannot
bypass these checks by calling `supabase.from('queue_items').insert(...)`
directly — that call would simply be rejected by RLS.

## Row Level Security

RLS is enabled on every table from the migration that creates it — never
disabled, including in local development.

- **`profiles`** — a user can `select`/`update`/`delete` only their own row
  (`auth.uid() = id`). Inserts happen only via the `handle_new_user()`
  trigger (`security definer`), not directly from clients.
- **`subscriptions`** — a user can `select` only their own row. There is no
  client-facing `insert`/`update`/`delete` policy: subscription state is
  written by the signup trigger and, from Phase 7 onward, by
  service-role-authenticated Stripe webhook handlers.
- **`subscription_plans`** — public read-only reference data
  (`is_active = true`), readable by both `authenticated` and `anon` so
  pricing can render before login.

## Entitlements

`packages/shared/src/subscription.ts` is the single source of truth for
plan limits on the client (`PLAN_LIMITS`, `canAddQueueItem`,
`canCreatePlaylist`). It mirrors migration `006`'s seed values exactly:

| Plan    | Queue | Playlists |
| ------- | ----- | --------- |
| Free    | 15    | 2         |
| Premium | 60    | unlimited |

The client-side copy is a UX convenience only — the database (via RLS +
the queue/playlist insert functions added in later phases) is the
authoritative enforcement point.

## Local development

```bash
supabase start                 # spin up local Postgres + Auth + Studio
supabase db reset              # (re)apply all migrations + seed.sql
pnpm supabase gen types typescript --local \
  > packages/database/src/types.gen.ts
```

Until a live/local Supabase instance is generated against, this repo ships
a hand-written `packages/database/src/types.gen.ts` kept in sync with the
migrations above — see the comment at the top of that file.

## Playback and queue status (Phase 5)

`queue_items.status` transitions: `queued` → `playing` → `completed` |
`skipped`. Completed/skipped rows are **not** deleted — they stay as
playback history — but are excluded from `getUserQueue()` (the app's
"active queue" query filters to `queued`/`playing` only).

Only one row per user can be `playing` at a time. `play_next_queue_item`
is the only function that sets that status, so this invariant is enforced
transactionally rather than by an application-level check.

**Simplification:** the DB never stores a `paused` status. A "paused"
song is still `status = 'playing'` in the database — pause/resume is
purely client-side player state (see `PlayerState.status` in
`packages/shared/src/queue.ts`), not persisted. This keeps single-tab
playback simple; multi-device playback-state sync is out of scope until
Phase 9 (Realtime).
