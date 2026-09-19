-- 005_create_rls_policies.sql

-- ── profiles ─────────────────────────────────────────────────────────────
-- Users may read and update only their own profile. Inserts happen via the
-- handle_new_user() trigger (security definer), not directly by clients.

create policy "profiles_select_own"
  on public.profiles
  for select
  to authenticated
  using (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles
  for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "profiles_delete_own"
  on public.profiles
  for delete
  to authenticated
  using (auth.uid() = id);

-- ── subscriptions ────────────────────────────────────────────────────────
-- Users may read only their own subscription. Writes happen via trusted
-- server-side paths (signup trigger, webhook handlers using the
-- service-role key), never directly from the client.

create policy "subscriptions_select_own"
  on public.subscriptions
  for select
  to authenticated
  using (auth.uid() = user_id);

-- ── subscription_plans ───────────────────────────────────────────────────
-- Plan catalog is public read-only reference data (needed to render
-- pricing before a user is authenticated).

create policy "subscription_plans_select_all"
  on public.subscription_plans
  for select
  to authenticated, anon
  using (is_active = true);
