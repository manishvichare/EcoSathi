-- ============================================================
-- EcoSathi — Supabase PostgreSQL Schema
-- Run this in the Supabase SQL Editor to set up the database.
-- ============================================================

-- Enable uuid generation
create extension if not exists "pgcrypto";

-- Drop existing tables to ensure clean schema (in reverse dependency order)
drop table if exists leaderboard_entries cascade;
drop table if exists notices cascade;
drop table if exists complaints cascade;
drop table if exists environment_data cascade;
drop table if exists tasks cascade;
drop table if exists cities cascade;
drop table if exists users cascade;

-- ── 1. users ─────────────────────────────────────────────────
create table users (
  id            uuid primary key default gen_random_uuid(),
  name          text        not null,
  email         text        not null unique,
  password_hash text        not null,
  city          text        default null,
  role          text        not null default 'citizen'
                            check (role in ('citizen', 'admin')),
  points        integer     not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ── 2. cities ────────────────────────────────────────────────
create table cities (
  id          uuid primary key default gen_random_uuid(),
  name        text        not null unique,
  state       text,
  country     text        not null default 'India',
  population  bigint      default 0,
  area_sq_km  numeric     default 0,
  boundary    jsonb,
  center_lat  numeric,
  center_lng  numeric,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ── 3. tasks ─────────────────────────────────────────────────
create table tasks (
  id           uuid primary key default gen_random_uuid(),
  title        text        not null,
  description  text        default '',
  points       integer     not null default 10,
  category     text        default 'general',
  ai_generated boolean     not null default false,
  active       boolean     not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ── 4. environment_data ──────────────────────────────────────
create table environment_data (
  id                          uuid primary key default gen_random_uuid(),
  city_id                     uuid        not null references cities(id) on delete cascade,
  date                        timestamptz not null,
  aqi                         numeric,
  weather                     jsonb,
  green_cover_percent         numeric     default 0,
  estimated_tree_count        bigint      default 0,
  co2_absorbed_per_year       numeric     default 0,
  o2_released_per_year        numeric     default 0,
  o2_required_for_population  numeric     default 0,
  o2_deficit                  boolean     default false,
  health_score                numeric     default 0
                              check (health_score >= 0 and health_score <= 100),
  green_cover_source          text        default 'estimated via OSM land-use data',
  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now(),
  unique (city_id, date)
);

-- ── 5. complaints ────────────────────────────────────────────
create table complaints (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid        not null references users(id) on delete cascade,
  city_id     uuid        not null references cities(id) on delete cascade,
  description text        not null,
  photo_url   text        not null,
  lat         numeric,
  lng         numeric,
  address     text,
  severity    text        default null
              check (severity in ('low', 'medium', 'high', 'critical') or severity is null),
  category    text        default null,
  ai_summary  text        default null,
  status      text        not null default 'pending'
              check (status in ('pending', 'analyzed', 'notice_sent', 'resolved')),
  notice_id   uuid        default null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ── 6. notices ───────────────────────────────────────────────
create table notices (
  id            uuid primary key default gen_random_uuid(),
  complaint_id  uuid        references complaints(id) on delete set null,
  city_id       uuid        not null references cities(id) on delete cascade,
  notice_text   text        not null,
  ai_generated  boolean     not null default true,
  sent_to       text        default null,
  sent_at       timestamptz default null,
  status        text        not null default 'draft'
                            check (status in ('draft', 'sent', 'acknowledged')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Add foreign key from complaints.notice_id to notices.id
alter table complaints
  add constraint fk_complaints_notice_id
  foreign key (notice_id) references notices(id) on delete set null;

-- ── 7. leaderboard_entries ───────────────────────────────────
create table leaderboard_entries (
  id                      uuid primary key default gen_random_uuid(),
  user_id                 uuid        not null unique references users(id) on delete cascade,
  city_id                 uuid        default null references cities(id) on delete set null,
  total_points            integer     not null default 0,
  tasks_completed         integer     not null default 0,
  last_task_completed_at  timestamptz default null,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

-- ── Indexes ──────────────────────────────────────────────────
create index idx_environment_data_city_date on environment_data(city_id, date desc);
create index idx_complaints_city_id         on complaints(city_id);
create index idx_complaints_user_id         on complaints(user_id);
create index idx_notices_city_id            on notices(city_id);
create index idx_leaderboard_points         on leaderboard_entries(total_points desc);

-- ── Seed eco tasks ───────────────────────────────────────────
insert into tasks (title, description, points, category, active)
values
  ('Plant a Tree',           'Plant a native sapling in your neighbourhood.',  50, 'planting',   true),
  ('Cycle to Work',          'Replace a vehicle commute with cycling today.',   30, 'transport',  true),
  ('Report Pollution',       'Submit a photo complaint via EcoSathi.',          20, 'reporting',  true),
  ('Reduce Plastic Use',     'Go plastic-free for one full day.',               15, 'recycling',  true),
  ('Rainwater Harvesting',   'Set up or maintain a rainwater harvesting unit.', 40, 'water',      true),
  ('Switch to Solar',        'Install or advocate for rooftop solar panels.',   60, 'energy',     true);
