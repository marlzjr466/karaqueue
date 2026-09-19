-- 009_youtube_videos_rls.sql

alter table public.youtube_videos enable row level security;

-- Video metadata is not user-owned or sensitive — it's a shared cache of
-- public YouTube data. Any authenticated user can read it (needed to
-- render search results/queue/playlist items) and upsert into it (needed
-- so search results get cached without a service-role round trip).
-- Nothing here is keyed to a user, so there is no per-row ownership check.

create policy "youtube_videos_select_authenticated"
  on public.youtube_videos
  for select
  to authenticated
  using (true);

create policy "youtube_videos_insert_authenticated"
  on public.youtube_videos
  for insert
  to authenticated
  with check (true);

create policy "youtube_videos_update_authenticated"
  on public.youtube_videos
  for update
  to authenticated
  using (true)
  with check (true);
