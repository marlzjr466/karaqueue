-- 017_create_playlist_items.sql

create table if not exists public.playlist_items (
  id uuid primary key default gen_random_uuid(),
  playlist_id uuid not null references public.playlists (id) on delete cascade,
  youtube_video_id uuid not null references public.youtube_videos (id),
  position integer not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (playlist_id, youtube_video_id)
);

comment on table public.playlist_items is
  'Songs within a playlist. Mutations go through add_playlist_item /
   remove_playlist_item / reorder_playlist_items (see 020).';

create trigger set_playlist_items_updated_at
  before update on public.playlist_items
  for each row
  execute function public.set_updated_at();
