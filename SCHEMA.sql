-- ============================================================
-- Locally — Supabase Database Schema
-- ============================================================
-- Run this entire file in the Supabase SQL Editor.
-- Do it once on a fresh project. Re-running is destructive.
-- ============================================================

-- 1. Extensions ----------------------------------------------
create extension if not exists "postgis";

-- 2. Enums ---------------------------------------------------
create type user_role as enum ('shoppee', 'shopper');

create type product_category as enum (
  'kurta', 'jeans', 'sherwani', 'shirt', 'tshirt',
  'saree', 'lehenga', 'suit', 'jacket', 'other'
);

create type size_label as enum (
  'XS', 'S', 'M', 'L', 'XL', 'XXL', 'Free'
);

-- 3. Profiles (one per auth user) ----------------------------
create table profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  role         user_role not null,
  full_name    text not null,
  phone        text,
  email        text not null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index profiles_role_idx on profiles(role);

-- 4. Stores (owned by a shopper) -----------------------------
create table stores (
  id              uuid primary key default gen_random_uuid(),
  owner_id        uuid not null references profiles(id) on delete cascade,
  name            text not null,
  banner_url      text,
  address         text not null,
  city            text not null default 'Patiala',
  location        geography(point, 4326) not null,  -- WGS84 lat/lng
  opening_time    time,                              -- e.g. 10:00
  closing_time    time,                              -- e.g. 20:00
  contact_phone   text not null,
  categories      text[] not null default '{}',      -- ['men','women','ethnic',...]
  is_active       boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index stores_owner_idx on stores(owner_id);
create index stores_location_idx on stores using gist(location);

-- one shopper = one store for v1 (relax later if multi-store needed)
create unique index stores_one_per_owner_idx on stores(owner_id);

-- 5. Products ------------------------------------------------
create table products (
  id           uuid primary key default gen_random_uuid(),
  store_id     uuid not null references stores(id) on delete cascade,
  name         text not null,
  price        numeric(10,2) not null check (price >= 0),
  category     product_category not null,
  sizes        size_label[] not null default '{}',
  colors       text[] not null default '{}',          -- hex codes
  photo_urls   text[] not null default '{}',          -- up to 4
  is_available boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index products_store_idx on products(store_id);
create index products_category_idx on products(category);

-- 6. Wishlists (shoppee saves a store, not a product, for v1) ---
create table wishlists (
  shoppee_id  uuid not null references profiles(id) on delete cascade,
  store_id    uuid not null references stores(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (shoppee_id, store_id)
);

create index wishlists_shoppee_idx on wishlists(shoppee_id);

-- 7. Store views (for the "Profile views" stat) --------------
create table store_views (
  id         bigserial primary key,
  store_id   uuid not null references stores(id) on delete cascade,
  viewer_id  uuid references profiles(id) on delete set null,  -- null if anon
  viewed_at  timestamptz not null default now()
);

create index store_views_store_day_idx on store_views(store_id, viewed_at);

-- 8. Reviews (lightweight for v1) ----------------------------
create table reviews (
  id          uuid primary key default gen_random_uuid(),
  store_id    uuid not null references stores(id) on delete cascade,
  shoppee_id  uuid not null references profiles(id) on delete cascade,
  rating      smallint not null check (rating between 1 and 5),
  comment     text,
  created_at  timestamptz not null default now(),
  unique (store_id, shoppee_id)
);

create index reviews_store_idx on reviews(store_id);

-- ============================================================
-- 9. Helper RPC: nearby stores
-- ============================================================
-- Usage from client:
--   supabase.rpc('nearby_stores', { lat: 30.34, lng: 76.39, radius_m: 5000 })
-- Returns stores within radius (meters), nearest first, with distance.
-- ============================================================

create or replace function nearby_stores(
  lat double precision,
  lng double precision,
  radius_m integer default 5000,
  category_filter text default null
)
returns table (
  id          uuid,
  name        text,
  banner_url  text,
  address     text,
  categories  text[],
  is_open_now boolean,
  distance_m  double precision,
  avg_rating  numeric
)
language sql
stable
as $$
  select
    s.id,
    s.name,
    s.banner_url,
    s.address,
    s.categories,
    case
      when s.opening_time is null or s.closing_time is null then false
      when (now() at time zone 'Asia/Kolkata')::time between s.opening_time and s.closing_time then true
      else false
    end as is_open_now,
    st_distance(s.location, st_makepoint(lng, lat)::geography) as distance_m,
    coalesce((select avg(r.rating)::numeric(3,2) from reviews r where r.store_id = s.id), 0) as avg_rating
  from stores s
  where s.is_active = true
    and st_dwithin(s.location, st_makepoint(lng, lat)::geography, radius_m)
    and (category_filter is null or category_filter = any(s.categories))
  order by distance_m asc;
$$;

-- ============================================================
-- 10. Row Level Security
-- ============================================================

alter table profiles      enable row level security;
alter table stores        enable row level security;
alter table products      enable row level security;
alter table wishlists     enable row level security;
alter table store_views   enable row level security;
alter table reviews       enable row level security;

-- Profiles: everyone reads own; nobody updates role after signup
create policy "profiles: read own"
  on profiles for select
  using (auth.uid() = id);

create policy "profiles: insert self at signup"
  on profiles for insert
  with check (auth.uid() = id);

create policy "profiles: update own (except role)"
  on profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Stores: anyone can read active stores; only owner can write their own
create policy "stores: public read active"
  on stores for select
  using (is_active = true);

create policy "stores: owner insert"
  on stores for insert
  with check (auth.uid() = owner_id);

create policy "stores: owner update"
  on stores for update
  using (auth.uid() = owner_id);

create policy "stores: owner delete"
  on stores for delete
  using (auth.uid() = owner_id);

-- Products: anyone reads available; only store owner writes
create policy "products: public read"
  on products for select
  using (
    is_available = true
    and exists (select 1 from stores s where s.id = store_id and s.is_active = true)
  );

create policy "products: owner write"
  on products for all
  using (exists (select 1 from stores s where s.id = store_id and s.owner_id = auth.uid()))
  with check (exists (select 1 from stores s where s.id = store_id and s.owner_id = auth.uid()));

-- Wishlists: shoppee owns their own
create policy "wishlists: own"
  on wishlists for all
  using (auth.uid() = shoppee_id)
  with check (auth.uid() = shoppee_id);

-- Store views: anyone can insert; only store owner can read aggregates
create policy "store_views: anyone insert"
  on store_views for insert
  with check (true);

create policy "store_views: owner read"
  on store_views for select
  using (exists (select 1 from stores s where s.id = store_id and s.owner_id = auth.uid()));

-- Reviews: anyone reads; shoppee writes their own
create policy "reviews: public read"
  on reviews for select
  using (true);

create policy "reviews: shoppee own write"
  on reviews for all
  using (auth.uid() = shoppee_id)
  with check (auth.uid() = shoppee_id);

-- ============================================================
-- 11. Storage buckets
-- ============================================================
-- Run these in Storage UI, OR via SQL below.

insert into storage.buckets (id, name, public)
values
  ('store-banners',   'store-banners',   true),
  ('product-photos',  'product-photos',  true)
on conflict (id) do nothing;

-- Storage policies — only shopper can upload to their own folder
-- Folder convention: <bucket>/<owner_id>/<filename>

create policy "store-banners: owner upload"
  on storage.objects for insert
  with check (
    bucket_id = 'store-banners'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "store-banners: owner update"
  on storage.objects for update
  using (
    bucket_id = 'store-banners'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "store-banners: public read"
  on storage.objects for select
  using (bucket_id = 'store-banners');

create policy "product-photos: owner upload"
  on storage.objects for insert
  with check (
    bucket_id = 'product-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "product-photos: owner update"
  on storage.objects for update
  using (
    bucket_id = 'product-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "product-photos: public read"
  on storage.objects for select
  using (bucket_id = 'product-photos');

-- ============================================================
-- 12. Triggers — updated_at maintenance
-- ============================================================

create or replace function touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

create trigger profiles_touch before update on profiles
  for each row execute function touch_updated_at();
create trigger stores_touch   before update on stores
  for each row execute function touch_updated_at();
create trigger products_touch before update on products
  for each row execute function touch_updated_at();

-- ============================================================
-- DONE. Verify by running:
--   select * from pg_extension where extname = 'postgis';
--   select count(*) from information_schema.tables where table_schema='public';
-- ============================================================
