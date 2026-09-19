-- 012_queue_items_rls.sql

alter table public.queue_items enable row level security;

-- Users can read only their own queue.
create policy "queue_items_select_own"
  on public.queue_items
  for select
  to authenticated
  using (auth.uid() = user_id);

-- No insert/update/delete policies for clients on purpose. All mutations
-- go through the security-definer functions in
-- 013_create_queue_functions.sql, which enforce the subscription's queue
-- limit and correct position ordering transactionally — a client cannot
-- bypass those checks by writing to the table directly, because there is
-- no policy that would allow it to.
