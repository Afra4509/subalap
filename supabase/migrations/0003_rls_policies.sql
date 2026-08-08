-- =========================================================================
-- SUBALAP -- Row Level Security
-- =========================================================================

alter table public.profiles enable row level security;
alter table public.reports enable row level security;
alter table public.comments enable row level security;
alter table public.upvotes enable row level security;
alter table public.notifications enable row level security;
alter table public.ratings enable row level security;
alter table public.hashtags enable row level security;
alter table public.audit_logs enable row level security;

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
drop policy if exists "profiles_select_all" on public.profiles;
create policy "profiles_select_all" on public.profiles
  for select using (true);

-- inserts happen only via the handle_new_user() trigger (security definer / table owner),
-- so no direct insert policy is granted to client roles.

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "profiles_update_admin" on public.profiles;
create policy "profiles_update_admin" on public.profiles
  for update using (public.is_admin()) with check (true);

-- Prevent citizens from self-promoting to admin / un-banning themselves by
-- reverting privileged columns unless the actor is already an admin.
create or replace function public.guard_profile_privilege_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    new.role := old.role;
    new.is_suspended := old.is_suspended;
    new.is_banned := old.is_banned;
  end if;
  return new;
end;
$$;

drop trigger if exists guard_profile_privilege_columns on public.profiles;
create trigger guard_profile_privilege_columns
  before update on public.profiles
  for each row execute procedure public.guard_profile_privilege_columns();

-- ---------------------------------------------------------------------------
-- reports
-- ---------------------------------------------------------------------------
drop policy if exists "reports_select_visible" on public.reports;
create policy "reports_select_visible" on public.reports
  for select using (
    not is_archived or public.is_admin() or auth.uid() = user_id
  );

drop policy if exists "reports_insert_own" on public.reports;
create policy "reports_insert_own" on public.reports
  for insert with check (auth.uid() = user_id);

drop policy if exists "reports_update_own_new" on public.reports;
create policy "reports_update_own_new" on public.reports
  for update using (auth.uid() = user_id and status = 'new')
  with check (auth.uid() = user_id);

drop policy if exists "reports_update_admin" on public.reports;
create policy "reports_update_admin" on public.reports
  for update using (public.is_admin()) with check (true);

drop policy if exists "reports_delete_own_new" on public.reports;
create policy "reports_delete_own_new" on public.reports
  for delete using (auth.uid() = user_id and status = 'new');

drop policy if exists "reports_delete_admin" on public.reports;
create policy "reports_delete_admin" on public.reports
  for delete using (public.is_admin());

-- ---------------------------------------------------------------------------
-- comments
-- ---------------------------------------------------------------------------
drop policy if exists "comments_select_all" on public.comments;
create policy "comments_select_all" on public.comments
  for select using (true);

drop policy if exists "comments_insert_own" on public.comments;
create policy "comments_insert_own" on public.comments
  for insert with check (
    auth.uid() = user_id and (not is_government_reply or public.is_admin())
  );

drop policy if exists "comments_delete_own_or_admin" on public.comments;
create policy "comments_delete_own_or_admin" on public.comments
  for delete using (auth.uid() = user_id or public.is_admin());

-- ---------------------------------------------------------------------------
-- upvotes
-- ---------------------------------------------------------------------------
drop policy if exists "upvotes_select_all" on public.upvotes;
create policy "upvotes_select_all" on public.upvotes
  for select using (true);

drop policy if exists "upvotes_insert_own" on public.upvotes;
create policy "upvotes_insert_own" on public.upvotes
  for insert with check (auth.uid() = user_id);

drop policy if exists "upvotes_delete_own" on public.upvotes;
create policy "upvotes_delete_own" on public.upvotes
  for delete using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- notifications  (no client-side insert policy: created only by triggers)
-- ---------------------------------------------------------------------------
drop policy if exists "notifications_select_own" on public.notifications;
create policy "notifications_select_own" on public.notifications
  for select using (auth.uid() = receiver_id);

drop policy if exists "notifications_update_own" on public.notifications;
create policy "notifications_update_own" on public.notifications
  for update using (auth.uid() = receiver_id) with check (auth.uid() = receiver_id);

drop policy if exists "notifications_delete_own" on public.notifications;
create policy "notifications_delete_own" on public.notifications
  for delete using (auth.uid() = receiver_id);

-- ---------------------------------------------------------------------------
-- ratings
-- ---------------------------------------------------------------------------
drop policy if exists "ratings_select_all" on public.ratings;
create policy "ratings_select_all" on public.ratings
  for select using (true);

drop policy if exists "ratings_insert_own_solved_report" on public.ratings;
create policy "ratings_insert_own_solved_report" on public.ratings
  for insert with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.reports r
      where r.id = report_id and r.user_id = auth.uid() and r.status = 'solved'
    )
  );

drop policy if exists "ratings_update_own" on public.ratings;
create policy "ratings_update_own" on public.ratings
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- hashtags
-- ---------------------------------------------------------------------------
drop policy if exists "hashtags_select_all" on public.hashtags;
create policy "hashtags_select_all" on public.hashtags
  for select using (true);

drop policy if exists "hashtags_admin_write" on public.hashtags;
create policy "hashtags_admin_write" on public.hashtags
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- audit_logs -- admin only
-- ---------------------------------------------------------------------------
drop policy if exists "audit_logs_admin_select" on public.audit_logs;
create policy "audit_logs_admin_select" on public.audit_logs
  for select using (public.is_admin());

drop policy if exists "audit_logs_admin_insert" on public.audit_logs;
create policy "audit_logs_admin_insert" on public.audit_logs
  for insert with check (public.is_admin());
