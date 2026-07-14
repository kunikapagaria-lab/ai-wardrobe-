-- WardrobeAI — Supabase schema
-- Run in Supabase SQL editor: https://supabase.com/dashboard/project/_/sql

create extension if not exists "pgcrypto";

-- Clothing items
create table if not exists clothing_items (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users on delete cascade,
  photo_url     text not null,
  thumbnail_url text,
  tags          jsonb not null default '{}',
  name          text,
  notes         text,
  is_favorite   boolean default false,
  last_worn_at  timestamptz,
  wear_count    int default 0,
  outfit_photo_id uuid,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

create index if not exists clothing_items_user_id_idx on clothing_items(user_id);
alter table clothing_items enable row level security;
create policy "Users manage own items" on clothing_items for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Outfit photos (full look uploads)
create table if not exists outfit_photos (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users on delete cascade,
  photo_url   text not null,
  tags        jsonb not null default '{}',
  caption     text,
  worn_at     timestamptz default now(),
  created_at  timestamptz default now()
);

alter table outfit_photos enable row level security;
create policy "Users manage own outfit photos" on outfit_photos for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Add outfit_photo_id FK after both tables exist
alter table clothing_items
  add column if not exists outfit_photo_id uuid references outfit_photos(id) on delete set null;

-- Saved outfits
create table if not exists saved_outfits (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users on delete cascade,
  item_ids    uuid[] not null,
  occasion    text not null,
  reasoning   text,
  style_notes text,
  created_at  timestamptz default now()
);

alter table saved_outfits enable row level security;
create policy "Users manage own saved outfits" on saved_outfits for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Planned outfits (calendar)
create table if not exists planned_outfits (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users on delete cascade,
  planned_date date not null,
  item_ids     uuid[] not null default '{}',
  occasion     text,
  notes        text,
  created_at   timestamptz default now(),
  unique (user_id, planned_date)
);

alter table planned_outfits enable row level security;
create policy "Users manage own planned outfits" on planned_outfits for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Wear logs
create table if not exists wear_logs (
  id       uuid primary key default gen_random_uuid(),
  user_id  uuid not null references auth.users on delete cascade,
  item_id  uuid not null references clothing_items(id) on delete cascade,
  worn_at  timestamptz default now(),
  notes    text
);

alter table wear_logs enable row level security;
create policy "Users manage own wear logs" on wear_logs for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Wishlist (saved shopping suggestions)
create table if not exists wishlist_items (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users on delete cascade,
  item_name     text not null,
  category      text not null,
  colors        text[] not null default '{}',
  style         text[] not null default '{}',
  reasoning     text,
  pairs_with_item_ids uuid[] not null default '{}',
  image         text,
  shop_url      text,
  created_at    timestamptz default now()
);

-- Add image/shop_url to wishlist_items created before these columns existed
alter table wishlist_items add column if not exists image text;
alter table wishlist_items add column if not exists shop_url text;

alter table wishlist_items enable row level security;
create policy "Users manage own wishlist items" on wishlist_items for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Storage bucket (run once in Supabase dashboard or here)
insert into storage.buckets (id, name, public) values ('clothing-photos', 'clothing-photos', true) on conflict do nothing;

create policy "Users upload own photos" on storage.objects for insert with check (bucket_id = 'clothing-photos' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "Users delete own photos" on storage.objects for delete using (bucket_id = 'clothing-photos' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "Public photo access" on storage.objects for select using (bucket_id = 'clothing-photos');
