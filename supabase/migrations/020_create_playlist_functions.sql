-- 020_create_playlist_functions.sql
--
-- Same pattern as the queue functions (013): security definer, reads
-- auth.uid() itself, and is the ONLY way to mutate playlists/playlist_items
-- since there's no client-writable RLS policy on either table.

-- ── create_playlist ──────────────────────────────────────────────────────
-- Enforces the caller's plan's max_playlists limit (NULL = unlimited).
create or replace function public.create_playlist(p_name text, p_description text default null)
returns public.playlists
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_limit integer;
  v_current_count integer;
  v_row public.playlists;
begin
  if v_user_id is null then
    raise exception 'Not authenticated' using errcode = '28000';
  end if;

  perform pg_advisory_xact_lock(hashtext('playlists:' || v_user_id::text));

  select p.max_playlists into v_limit
  from public.subscriptions s
  join public.subscription_plans p on p.id = s.plan_id
  where s.user_id = v_user_id;

  if v_limit is not null then
    select count(*) into v_current_count
    from public.playlists
    where user_id = v_user_id;

    if v_current_count >= v_limit then
      raise exception 'PLAYLIST_LIMIT_REACHED' using errcode = 'P0001';
    end if;
  end if;

  insert into public.playlists (user_id, name, description)
  values (v_user_id, p_name, p_description)
  returning * into v_row;

  return v_row;
end;
$$;

-- ── rename_playlist ──────────────────────────────────────────────────────
create or replace function public.rename_playlist(p_playlist_id uuid, p_name text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.playlists
  set name = p_name
  where id = p_playlist_id and user_id = auth.uid();
end;
$$;

-- ── delete_playlist ──────────────────────────────────────────────────────
create or replace function public.delete_playlist(p_playlist_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.playlists
  where id = p_playlist_id and user_id = auth.uid();
end;
$$;

-- ── add_playlist_item ────────────────────────────────────────────────────
create or replace function public.add_playlist_item(p_playlist_id uuid, p_youtube_video_id uuid)
returns public.playlist_items
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_next_position integer;
  v_row public.playlist_items;
begin
  if not exists (
    select 1 from public.playlists where id = p_playlist_id and user_id = v_user_id
  ) then
    raise exception 'Playlist not found' using errcode = 'P0001';
  end if;

  if exists (
    select 1 from public.playlist_items
    where playlist_id = p_playlist_id and youtube_video_id = p_youtube_video_id
  ) then
    raise exception 'SONG_ALREADY_IN_PLAYLIST' using errcode = 'P0001';
  end if;

  select coalesce(max(position), 0) + 1 into v_next_position
  from public.playlist_items
  where playlist_id = p_playlist_id;

  insert into public.playlist_items (playlist_id, youtube_video_id, position)
  values (p_playlist_id, p_youtube_video_id, v_next_position)
  returning * into v_row;

  return v_row;
end;
$$;

-- ── remove_playlist_item ─────────────────────────────────────────────────
create or replace function public.remove_playlist_item(p_playlist_item_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_playlist_id uuid;
begin
  select playlist_id into v_playlist_id
  from public.playlist_items pi
  join public.playlists p on p.id = pi.playlist_id
  where pi.id = p_playlist_item_id and p.user_id = v_user_id;

  if v_playlist_id is null then
    return;
  end if;

  delete from public.playlist_items where id = p_playlist_item_id;

  with ranked as (
    select id, row_number() over (order by position) as rn
    from public.playlist_items
    where playlist_id = v_playlist_id
  )
  update public.playlist_items pi
  set position = ranked.rn
  from ranked
  where pi.id = ranked.id;
end;
$$;

-- ── reorder_playlist_items ───────────────────────────────────────────────
create or replace function public.reorder_playlist_items(p_playlist_id uuid, p_ordered_ids uuid[])
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_matching_count integer;
  v_total_count integer;
begin
  if not exists (
    select 1 from public.playlists where id = p_playlist_id and user_id = v_user_id
  ) then
    raise exception 'Playlist not found' using errcode = 'P0001';
  end if;

  select count(*) into v_total_count
  from public.playlist_items
  where playlist_id = p_playlist_id;

  select count(*) into v_matching_count
  from public.playlist_items
  where playlist_id = p_playlist_id and id = any(p_ordered_ids);

  if v_matching_count <> v_total_count or v_matching_count <> coalesce(array_length(p_ordered_ids, 1), 0) then
    raise exception 'Reorder list must contain exactly the playlist''s current items' using errcode = 'P0001';
  end if;

  update public.playlist_items pi
  set position = t.rn
  from (
    select unnest(p_ordered_ids) as id, generate_subscripts(p_ordered_ids, 1) as rn
  ) t
  where pi.id = t.id and pi.playlist_id = p_playlist_id;
end;
$$;
