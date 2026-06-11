-- ============================================================
-- BirGe — initial schema
-- Run via: supabase db push  (or paste into Supabase SQL editor)
-- ============================================================

-- Enable UUID generation
create extension if not exists "pgcrypto";

-- ─── Users ────────────────────────────────────────────────────────────────────
-- Mirrors auth.users; stores app-level profile fields.

create table if not exists public.users (
  id          uuid primary key references auth.users(id) on delete cascade,
  phone       text not null unique,
  name        text not null default 'Вы',
  city        text not null default 'Алматы',
  created_at  timestamptz not null default now()
);

-- ─── Teams ────────────────────────────────────────────────────────────────────

create table if not exists public.teams (
  id          uuid primary key default gen_random_uuid(),
  code        text not null unique,             -- e.g. BUY-1085, 6–10 chars
  name        text not null default 'Моя команда',
  created_by  uuid not null references public.users(id) on delete cascade,
  created_at  timestamptz not null default now(),
  expires_at  timestamptz not null default (now() + interval '48 hours')
);

create index if not exists teams_code_idx on public.teams (code);

-- ─── Team members ─────────────────────────────────────────────────────────────

create table if not exists public.team_members (
  id              uuid primary key default gen_random_uuid(),
  team_id         uuid not null references public.teams(id) on delete cascade,
  user_id         uuid not null references public.users(id) on delete cascade,
  name            text not null,
  is_current_user boolean not null default false,
  joined_at       timestamptz not null default now(),
  unique (team_id, user_id)
);

create index if not exists team_members_team_idx on public.team_members (team_id);

-- ─── Coupons ──────────────────────────────────────────────────────────────────

create type if not exists coupon_type as enum (
  'newcomer',
  'team_player',
  'first_purchase',
  'daily_login',
  'invite'
);

create table if not exists public.coupons (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.users(id) on delete cascade,
  type         coupon_type not null,
  discount_pct integer not null check (discount_pct > 0 and discount_pct <= 30),
  earned_at    timestamptz not null default now(),
  used_at      timestamptz,
  order_id     uuid                                 -- filled when applied
);

create index if not exists coupons_user_idx on public.coupons (user_id);

-- ─── Orders ───────────────────────────────────────────────────────────────────

create type if not exists order_status as enum (
  'pending_participants',
  'confirmed',
  'shipped',
  'delivered',
  'cancelled'
);

create table if not exists public.orders (
  id               uuid primary key default gen_random_uuid(),
  team_id          uuid references public.teams(id) on delete set null,
  user_id          uuid not null references public.users(id) on delete cascade,
  kind             text not null check (kind in ('individual', 'team')),
  status           order_status not null default 'confirmed',
  total            integer not null,               -- in tenge, no decimals
  city             text not null,
  address          text not null,
  delivery_method  text not null,
  payment_method   text not null,
  item_count       integer not null,
  created_at       timestamptz not null default now()
);

create index if not exists orders_user_idx on public.orders (user_id);
create index if not exists orders_team_idx on public.orders (team_id);

-- ─── Order items ──────────────────────────────────────────────────────────────

create table if not exists public.order_items (
  id          uuid primary key default gen_random_uuid(),
  order_id    uuid not null references public.orders(id) on delete cascade,
  product_id  text not null,                       -- matches data/products.ts id
  quantity    integer not null check (quantity > 0),
  unit_price  integer not null
);

create index if not exists order_items_order_idx on public.order_items (order_id);

-- ─── RLS (Row Level Security) ─────────────────────────────────────────────────
-- Enable and add policies once auth is wired up.

alter table public.users        enable row level security;
alter table public.teams        enable row level security;
alter table public.team_members enable row level security;
alter table public.coupons      enable row level security;
alter table public.orders       enable row level security;
alter table public.order_items  enable row level security;

-- TODO: add RLS policies, e.g.:
-- create policy "Users can read own profile"
--   on public.users for select using (auth.uid() = id);
-- create policy "Team members can read their team"
--   on public.teams for select using (
--     exists (select 1 from team_members where team_id = teams.id and user_id = auth.uid())
--   );

-- ─── Realtime ─────────────────────────────────────────────────────────────────
-- Enable realtime on tables that need live updates in the app.

-- alter publication supabase_realtime add table public.team_members;
-- alter publication supabase_realtime add table public.orders;
