-- 011_create_queue_indexes.sql

create index if not exists queue_items_user_id_idx
  on public.queue_items (user_id);

create index if not exists queue_items_user_id_position_idx
  on public.queue_items (user_id, position);

create index if not exists queue_items_user_id_status_idx
  on public.queue_items (user_id, status);
