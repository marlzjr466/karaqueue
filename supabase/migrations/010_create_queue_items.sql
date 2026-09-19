-- 010_create_queue_items.sql

create table if not exists public.queue_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  youtube_video_id uuid not null references public.youtube_videos (id),
  position integer not null,
  status text not null default 'queued'
    check (status in ('queued', 'playing', 'paused', 'completed', 'skipped')),
  added_at timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.queue_items is
  'A user''s karaoke queue. Mutations go through add_queue_item / remove_queue_item /
   reorder_queue / clear_queue (see 013_create_queue_functions.sql) so the queue
   limit and position ordering can never be bypassed by direct client writes.';

create trigger set_queue_items_updated_at
  before update on public.queue_items
  for each row
  execute function public.set_updated_at();
