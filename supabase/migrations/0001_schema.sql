-- =========================================================================
-- SUBALAP (Surabaya Lapor) -- Core schema
-- Run this file first in the Supabase SQL Editor.
-- =========================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
do $$ begin
  create type user_role as enum ('citizen', 'admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type report_status as enum ('new', 'in_progress', 'solved', 'rejected');
exception when duplicate_object then null; end $$;

do $$ begin
  create type report_category as enum ('Transportation', 'Environment', 'Urban', 'Social');
exception when duplicate_object then null; end $$;

do $$ begin
  create type notification_type as enum (
    'comment', 'upvote', 'status_update', 'government_reply', 'resolved', 'rating_reminder', 'mention'
  );
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text unique not null,
  full_name text not null default '',
  avatar_url text,
  bio text default '',
  location text default 'Surabaya',
  theme_preference text default 'system',
  role user_role not null default 'citizen',
  is_suspended boolean not null default false,
  is_banned boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists profiles_username_idx on public.profiles using btree (username);

-- ---------------------------------------------------------------------------
-- reports (a "SUBALAPOST")
-- ---------------------------------------------------------------------------
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  description text not null,
  category report_category not null,
  subcategory text not null,
  hashtags text[] not null default '{}',
  latitude double precision not null,
  longitude double precision not null,
  location_name text not null default '',
  district text default '',
  subdistrict text default '',
  status report_status not null default 'new',
  images text[] not null default '{}',
  upvotes_count integer not null default 0,
  comments_count integer not null default 0,
  assigned_department text,
  is_pinned boolean not null default false,
  is_archived boolean not null default false,
  duplicate_of uuid references public.reports (id) on delete set null,
  search_vector tsvector generated always as (
    to_tsvector('simple', coalesce(description, '') || ' ' || coalesce(array_to_string(hashtags, ' '), '') || ' ' || coalesce(subcategory, ''))
  ) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  resolved_at timestamptz
);

create index if not exists reports_created_at_idx on public.reports (created_at desc);
create index if not exists reports_status_idx on public.reports (status);
create index if not exists reports_category_idx on public.reports (category);
create index if not exists reports_user_id_idx on public.reports (user_id);
create index if not exists reports_search_idx on public.reports using gin (search_vector);
create index if not exists reports_location_idx on public.reports using btree (latitude, longitude);

-- ---------------------------------------------------------------------------
-- comments
-- ---------------------------------------------------------------------------
create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.reports (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  parent_comment_id uuid references public.comments (id) on delete cascade,
  comment text not null,
  images text[] not null default '{}',
  is_government_reply boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists comments_report_id_idx on public.comments (report_id, created_at);

-- ---------------------------------------------------------------------------
-- upvotes
-- ---------------------------------------------------------------------------
create table if not exists public.upvotes (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.reports (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (report_id, user_id)
);

create index if not exists upvotes_report_id_idx on public.upvotes (report_id);

-- ---------------------------------------------------------------------------
-- notifications
-- ---------------------------------------------------------------------------
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  receiver_id uuid not null references public.profiles (id) on delete cascade,
  actor_id uuid references public.profiles (id) on delete set null,
  type notification_type not null,
  report_id uuid references public.reports (id) on delete cascade,
  comment_id uuid references public.comments (id) on delete cascade,
  message text not null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists notifications_receiver_idx on public.notifications (receiver_id, created_at desc);

-- ---------------------------------------------------------------------------
-- ratings
-- ---------------------------------------------------------------------------
create table if not exists public.ratings (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.reports (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  feedback text default '',
  created_at timestamptz not null default now(),
  unique (report_id, user_id)
);

-- ---------------------------------------------------------------------------
-- hashtags
-- ---------------------------------------------------------------------------
create table if not exists public.hashtags (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  parent_category report_category,
  usage_count integer not null default 0,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- audit_logs (admin actions, section 27 requirement)
-- ---------------------------------------------------------------------------
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles (id) on delete set null,
  action text not null,
  target_table text not null,
  target_id uuid,
  metadata jsonb default '{}',
  created_at timestamptz not null default now()
);
