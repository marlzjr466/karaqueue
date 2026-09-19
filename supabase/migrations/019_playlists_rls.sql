-- 019_playlists_rls.sql

alter table public.playlists enable row level security;
alter table public.playlist_items enable row level security;

-- ── playlists ────────────────────────────────────────────────────────────
-- Select-only for the owner. No insert/update/delete policy — all
-- mutations go through create_playlist / rename_playlist / delete_playlist
-- (020_create_playlist_functions.sql), which enforce the Free-plan
-- playlist limit transactionally.

create policy "playlists_select_own"
  on public.playlists
  for select
  to authenticated
  using (auth.uid() = user_id);

-- ── playlist_items ───────────────────────────────────────────────────────
-- playlist_items has no user_id column of its own — ownership is via the
-- parent playlist, checked with an EXISTS subquery. Select-only, same
-- reasoning as playlists: mutations go through the functions in 020.

create policy "playlist_items_select_own"
  on public.playlist_items
  for select
  to authenticated
  using (
    exists (
      select 1 from public.playlists p
      where p.id = playlist_items.playlist_id
        and p.user_id = auth.uid()
    )
  );
