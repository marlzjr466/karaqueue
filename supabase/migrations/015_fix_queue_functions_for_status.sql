-- 015_fix_queue_functions_for_status.sql
--
-- Phase 5 introduces 'playing'/'completed'/'skipped' rows that stay in
-- queue_items permanently (as playback history) instead of every row
-- being 'queued'. remove_queue_item and reorder_queue from Phase 4 need
-- to scope their position math to status = 'queued' only, or historical
-- rows would corrupt position ordering and break reorder's exact-match
-- validation the first time any song finished playing.

create or replace function public.remove_queue_item(p_queue_item_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'Not authenticated' using errcode = '28000';
  end if;

  perform pg_advisory_xact_lock(hashtext(v_user_id::text));

  delete from public.queue_items
  where id = p_queue_item_id and user_id = v_user_id and status = 'queued';

  with ranked as (
    select id, row_number() over (order by position) as rn
    from public.queue_items
    where user_id = v_user_id and status = 'queued'
  )
  update public.queue_items q
  set position = ranked.rn
  from ranked
  where q.id = ranked.id;
end;
$$;

create or replace function public.reorder_queue(p_ordered_ids uuid[])
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
  if v_user_id is null then
    raise exception 'Not authenticated' using errcode = '28000';
  end if;

  perform pg_advisory_xact_lock(hashtext(v_user_id::text));

  select count(*) into v_total_count
  from public.queue_items
  where user_id = v_user_id and status = 'queued';

  select count(*) into v_matching_count
  from public.queue_items
  where user_id = v_user_id and status = 'queued' and id = any(p_ordered_ids);

  if v_matching_count <> v_total_count or v_matching_count <> coalesce(array_length(p_ordered_ids, 1), 0) then
    raise exception 'Reorder list must contain exactly the caller''s current queued items' using errcode = 'P0001';
  end if;

  update public.queue_items q
  set position = t.rn
  from (
    select unnest(p_ordered_ids) as id, generate_subscripts(p_ordered_ids, 1) as rn
  ) t
  where q.id = t.id and q.user_id = v_user_id and q.status = 'queued';
end;
$$;
