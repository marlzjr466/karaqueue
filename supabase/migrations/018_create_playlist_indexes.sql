-- 018_create_playlist_indexes.sql

create index if not exists playlist_items_playlist_id_idx
  on public.playlist_items (playlist_id);

create index if not exists playlist_items_playlist_id_position_idx
  on public.playlist_items (playlist_id, position);
