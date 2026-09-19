-- 013_create_queue_functions.sql
--
-- All queue mutations happen through these functions instead of direct
-- table writes (see 012's RLS comment). Each function is `security
-- definer` and reads `auth.uid()` itself, so a client can only ever act on
-- their own queue no matter what arguments they pass.

-- ── add_queue_item ──────────────────────────────────────────────────────
-- Inserts a queued item at the end of the caller's queue, enforcing their
-- plan's max_queue_items limit. Uses a per-user advisory lock to
-- serialize concurrent calls (e.g. the same account adding songs from two
-- devices at once), so the limit can't be bypassed by a race condition.
create or replace function public.add_queue_item(p_youtube_video_id uuid)
returns public.queue_items
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_limit integer;
  v_current_count integer;
  v_next_position integer;
  v_row public.queue_items;
begin
  if v_user_id is null then
    raise exception 'Not authenticated' using errcode = '28000';
  end if;

  perform pg_advisory_xact_lock(hashtext(v_user_id::text));

  select p.max_queue_items into v_limit
  from public.subscriptions s
  join public.subscription_plans p on p.id = s.plan_id
  where s.user_id = v_user_id;

  if v_limit is null then
    raise exception 'No active subscription found' using errcode = 'P0001';
  end if;

  select count(*) into v_current_count
  from public.queue_items
  where user_id = v_user_id and status = 'queued';

  if v_current_count >= v_limit then
    raise exception 'QUEUE_LIMIT_REACHED' using errcode = 'P0001';
  end if;

  select coalesce(max(position), 0) + 1 into v_next_position
  from public.queue_items
  where user_id = v_user_id;

  insert into public.queue_items (user_id, youtube_video_id, position, status)
  values (v_user_id, p_youtube_video_id, v_next_position, 'queued')
  returning * into v_row;

  return v_row;
end;
$$;

-- ── remove_queue_item ───────────────────────────────────────────────────
-- Deletes a queue item (scoped to the caller) and closes the position gap
-- left behind so remaining items stay contiguously ordered.
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
  where id = p_queue_item_id and user_id = v_user_id;

  with ranked as (
    select id, row_number() over (order by position) as rn
    from public.queue_items
    where user_id = v_user_id
  )
  update public.queue_items q
  set position = ranked.rn
  from ranked
  where q.id = ranked.id;
end;
$$;

-- ── reorder_queue ───────────────────────────────────────────────────────
-- Sets position = array index for each id in p_ordered_ids. Rejects the
-- call entirely if any id doesn't belong to the caller or the set of ids
-- doesn't exactly match their current queue.
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
  where user_id = v_user_id;

  select count(*) into v_matching_count
  from public.queue_items
  where user_id = v_user_id and id = any(p_ordered_ids);

  if v_matching_count <> v_total_count or v_matching_count <> coalesce(array_length(p_ordered_ids, 1), 0) then
    raise exception 'Reorder list must contain exactly the caller''s current queue items' using errcode = 'P0001';
  end if;

  update public.queue_items q
  set position = t.rn
  from (
    select unnest(p_ordered_ids) as id, generate_subscripts(p_ordered_ids, 1) as rn
  ) t
  where q.id = t.id and q.user_id = v_user_id;
end;
$$;

-- ── clear_queue ─────────────────────────────────────────────────────────
create or replace function public.clear_queue()
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

  delete from public.queue_items where user_id = v_user_id;
end;
$$;
