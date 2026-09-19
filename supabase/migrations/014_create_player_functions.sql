-- 014_create_player_functions.sql
--
-- Advances a user's queue: optionally marks the current item as
-- completed/skipped, then promotes the next queued item (lowest
-- position) to 'playing'. Returns the new current item's id, or null if
-- the queue is now empty. Like the Phase 4 queue functions, this is
-- `security definer` and reads `auth.uid()` itself.

create or replace function public.play_next_queue_item(
  p_finish_queue_item_id uuid default null,
  p_finish_status text default 'completed'
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_next_id uuid;
begin
  if v_user_id is null then
    raise exception 'Not authenticated' using errcode = '28000';
  end if;

  if p_finish_status not in ('completed', 'skipped') then
    raise exception 'p_finish_status must be completed or skipped' using errcode = 'P0001';
  end if;

  perform pg_advisory_xact_lock(hashtext(v_user_id::text));

  if p_finish_queue_item_id is not null then
    update public.queue_items
    set status = p_finish_status, completed_at = now()
    where id = p_finish_queue_item_id
      and user_id = v_user_id
      and status in ('queued', 'playing');
  end if;

  select id into v_next_id
  from public.queue_items
  where user_id = v_user_id and status = 'queued'
  order by position asc
  limit 1;

  if v_next_id is not null then
    update public.queue_items
    set status = 'playing', started_at = now()
    where id = v_next_id;
  end if;

  return v_next_id;
end;
$$;
