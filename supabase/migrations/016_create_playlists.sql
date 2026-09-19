-- 016_create_playlists.sql

create table if not exists public.playlists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  description text,
  cover_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.playlists is
  'User-created karaoke playlists. Mutations go through create_playlist /
   rename_playlist / delete_playlist (see 020) so the Free-plan playlist
   limit can never be bypassed by direct client writes.';

create trigger set_playlists_updated_at
  before update on public.playlists
  for each row
  execute function public.set_updated_at();

create index if not exists playlists_user_id_idx
  on public.playlists (user_id);
