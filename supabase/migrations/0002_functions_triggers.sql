-- =========================================================================
-- SUBALAP -- Functions & Triggers
-- =========================================================================

-- ---------------------------------------------------------------------------
-- helper: is the current user an admin?
-- ---------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- ---------------------------------------------------------------------------
-- auto-create a profile row whenever a new auth user signs up
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  base_username text;
  final_username text;
  suffix int := 0;
begin
  base_username := lower(regexp_replace(coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)), '[^a-z0-9_]', '', 'g'));
  if base_username is null or base_username = '' then
    base_username := 'warga';
  end if;

  final_username := base_username;
  while exists (select 1 from public.profiles where username = final_username) loop
    suffix := suffix + 1;
    final_username := base_username || suffix::text;
  end loop;

  insert into public.profiles (id, username, full_name, avatar_url, role)
  values (
    new.id,
    final_username,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url',
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'citizen')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ---------------------------------------------------------------------------
-- generic updated_at bumper
-- ---------------------------------------------------------------------------
create or replace function public.bump_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists reports_updated_at on public.reports;
create trigger reports_updated_at
  before update on public.reports
  for each row execute procedure public.bump_updated_at();

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.bump_updated_at();

-- ---------------------------------------------------------------------------
-- keep reports.upvotes_count in sync + notify report owner
-- ---------------------------------------------------------------------------
create or replace function public.handle_upvote_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  owner_id uuid;
  actor_name text;
begin
  update public.reports set upvotes_count = upvotes_count + 1 where id = new.report_id
  returning user_id into owner_id;

  if owner_id is not null and owner_id <> new.user_id then
    select username into actor_name from public.profiles where id = new.user_id;
    insert into public.notifications (receiver_id, actor_id, type, report_id, message)
    values (owner_id, new.user_id, 'upvote', new.report_id, coalesce(actor_name, 'Someone') || ' upvoted your report');
  end if;
  return new;
end;
$$;

drop trigger if exists on_upvote_insert on public.upvotes;
create trigger on_upvote_insert
  after insert on public.upvotes
  for each row execute procedure public.handle_upvote_insert();

create or replace function public.handle_upvote_delete()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.reports set upvotes_count = greatest(upvotes_count - 1, 0) where id = old.report_id;
  return old;
end;
$$;

drop trigger if exists on_upvote_delete on public.upvotes;
create trigger on_upvote_delete
  after delete on public.upvotes
  for each row execute procedure public.handle_upvote_delete();

-- ---------------------------------------------------------------------------
-- keep reports.comments_count in sync + notify report owner
-- ---------------------------------------------------------------------------
create or replace function public.handle_comment_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  owner_id uuid;
  actor_name text;
  notif_type notification_type;
begin
  update public.reports set comments_count = comments_count + 1 where id = new.report_id
  returning user_id into owner_id;

  select username into actor_name from public.profiles where id = new.user_id;
  notif_type := case when new.is_government_reply then 'government_reply' else 'comment' end;

  if owner_id is not null and owner_id <> new.user_id then
    insert into public.notifications (receiver_id, actor_id, type, report_id, comment_id, message)
    values (owner_id, new.user_id, notif_type, new.report_id, new.id, coalesce(actor_name, 'Someone') || ' commented on your report');
  end if;

  -- notify the parent comment's author on a reply
  if new.parent_comment_id is not null then
    perform 1;
    insert into public.notifications (receiver_id, actor_id, type, report_id, comment_id, message)
    select c.user_id, new.user_id, 'comment', new.report_id, new.id, coalesce(actor_name, 'Someone') || ' replied to your comment'
    from public.comments c
    where c.id = new.parent_comment_id and c.user_id <> new.user_id and c.user_id <> coalesce(owner_id, '00000000-0000-0000-0000-000000000000'::uuid);
  end if;

  return new;
end;
$$;

drop trigger if exists on_comment_insert on public.comments;
create trigger on_comment_insert
  after insert on public.comments
  for each row execute procedure public.handle_comment_insert();

create or replace function public.handle_comment_delete()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.reports set comments_count = greatest(comments_count - 1, 0) where id = old.report_id;
  return old;
end;
$$;

drop trigger if exists on_comment_delete on public.comments;
create trigger on_comment_delete
  after delete on public.comments
  for each row execute procedure public.handle_comment_delete();

-- ---------------------------------------------------------------------------
-- notify report owner when status changes (admin action) + rating reminder
-- ---------------------------------------------------------------------------
create or replace function public.handle_report_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status is distinct from old.status then
    if new.status = 'solved' then
      new.resolved_at = now();
      insert into public.notifications (receiver_id, type, report_id, message)
      values (new.user_id, 'resolved', new.id, 'Your report has been marked as solved. Please rate the resolution.');
      insert into public.notifications (receiver_id, type, report_id, message)
      values (new.user_id, 'rating_reminder', new.id, 'How did we do? Rate your resolved report.');
    else
      insert into public.notifications (receiver_id, type, report_id, message)
      values (new.user_id, 'status_update', new.id, 'Your report status changed to ' || replace(new.status::text, '_', ' '));
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists on_report_status_change on public.reports;
create trigger on_report_status_change
  before update on public.reports
  for each row execute procedure public.handle_report_status_change();

-- ---------------------------------------------------------------------------
-- keep hashtags table populated + usage_count in sync when a report is created
-- ---------------------------------------------------------------------------
create or replace function public.sync_hashtags()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  tag text;
begin
  foreach tag in array new.hashtags loop
    insert into public.hashtags (name, parent_category, usage_count)
    values (tag, new.category, 1)
    on conflict (name) do update set usage_count = public.hashtags.usage_count + 1;
  end loop;
  return new;
end;
$$;

drop trigger if exists on_report_insert_hashtags on public.reports;
create trigger on_report_insert_hashtags
  after insert on public.reports
  for each row execute procedure public.sync_hashtags();

-- ---------------------------------------------------------------------------
-- RPC: toggle upvote (atomic, avoids race between check + insert on client)
-- ---------------------------------------------------------------------------
create or replace function public.toggle_upvote(p_report_id uuid)
returns boolean
language plpgsql
security invoker
set search_path = public
as $$
declare
  existing uuid;
  upvoted boolean;
begin
  select id into existing from public.upvotes where report_id = p_report_id and user_id = auth.uid();
  if existing is not null then
    delete from public.upvotes where id = existing;
    upvoted := false;
  else
    insert into public.upvotes (report_id, user_id) values (p_report_id, auth.uid());
    upvoted := true;
  end if;
  return upvoted;
end;
$$;

-- ---------------------------------------------------------------------------
-- RPC: admin dashboard summary stats (single round trip)
-- ---------------------------------------------------------------------------
create or replace function public.admin_dashboard_stats()
returns json
language sql
security definer
set search_path = public
stable
as $$
  select json_build_object(
    'total_reports', (select count(*) from public.reports),
    'today_reports', (select count(*) from public.reports where created_at >= current_date),
    'active_users', (select count(*) from public.profiles where role = 'citizen' and not is_banned),
    'new_count', (select count(*) from public.reports where status = 'new'),
    'in_progress_count', (select count(*) from public.reports where status = 'in_progress'),
    'solved_count', (select count(*) from public.reports where status = 'solved'),
    'avg_resolution_hours', (
      select coalesce(round(avg(extract(epoch from (resolved_at - created_at)) / 3600)::numeric, 1), 0)
      from public.reports where resolved_at is not null
    ),
    'avg_satisfaction', (select coalesce(round(avg(rating)::numeric, 2), 0) from public.ratings)
  );
$$;

grant execute on function public.admin_dashboard_stats() to authenticated;
grant execute on function public.toggle_upvote(uuid) to authenticated;
grant execute on function public.is_admin() to authenticated, anon;
