-- 021_create_load_playlist_function.sql

create or replace function public.load_playlist_into_queue(p_playlist_id uuid, p_mode text)
returns table(added_count integer, skipped_count integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_limit integer;
  v_current_count integer;
  v_capacity integer;
  v_next_position integer;
  v_added integer := 0;
  v_skipped integer := 0;
  v_item record;
begin
  if v_user_id is null then
    raise exception 'Not authenticated' using errcode = '28000';
  end if;

  if p_mode not in ('replace', 'append') then
    raise exception 'p_mode must be replace or append' using errcode = 'P0001';
  end if;

  if not exists (
    select 1 from public.playlists where id = p_playlist_id and user_id = v_user_id
  ) then
    raise exception 'Playlist not found' using errcode = 'P0001';
  end if;

  perform pg_advisory_xact_lock(hashtext(v_user_id::text));

  select p.max_queue_items into v_limit
  from public.subscriptions s
  join public.subscription_plans p on p.id = s.plan_id
  where s.user_id = v_user_id;

  if v_limit is null then
    raise exception 'No active subscription found' using errcode = 'P0001';
  end if;

  if p_mode = 'replace' then
    delete from public.queue_items where user_id = v_user_id and status = 'queued';
  end if;

  select count(*) into v_current_count
  from public.queue_items
  where user_id = v_user_id and status = 'queued';

  v_capacity := greatest(v_limit - v_current_count, 0);

  select coalesce(max(position), 0) into v_next_position
  from public.queue_items
  where user_id = v_user_id and status = 'queued';

  for v_item in
    select youtube_video_id
    from public.playlist_items
    where playlist_id = p_playlist_id
    order by position asc
  loop
    if v_added < v_capacity then
      v_next_position := v_next_position + 1;
      insert into public.queue_items (user_id, youtube_video_id, position, status)
      values (v_user_id, v_item.youtube_video_id, v_next_position, 'queued');
      v_added := v_added + 1;
    else
      v_skipped := v_skipped + 1;
    end if;
  end loop;

  return query select v_added, v_skipped;
end;
$$;
