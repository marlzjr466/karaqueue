-- 008_create_youtube_videos.sql
-- Metadata cache for YouTube search results. We never store video files —
-- only the metadata needed to render cards and embed the official player.

create table if not exists public.youtube_videos (
  id uuid primary key default gen_random_uuid(),
  youtube_id text not null unique,
  title text not null,
  channel_title text not null,
  thumbnail_url text not null,
  duration_seconds integer,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.youtube_videos is
  'Cache of YouTube video metadata returned by search. Never stores video files.';

create trigger set_youtube_videos_updated_at
  before update on public.youtube_videos
  for each row
  execute function public.set_updated_at();

create index if not exists youtube_videos_youtube_id_idx
  on public.youtube_videos (youtube_id);
