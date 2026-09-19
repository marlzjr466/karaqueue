-- 022_create_playlist_summaries_view.sql

create or replace view public.playlist_summaries
with (security_invoker = true)
as
select
  p.id,
  p.user_id,
  p.name,
  p.description,
  p.cover_url,
  p.created_at,
  p.updated_at,
  count(pi.id) as song_count
from public.playlists p
left join public.playlist_items pi on pi.playlist_id = p.id
group by p.id;

comment on view public.playlist_summaries is
  'Playlists joined with their song count, for the playlist list UI.';
