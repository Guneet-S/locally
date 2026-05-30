-- ============================================================
-- Locally — Supabase Database Schema (v2)
-- ============================================================
-- Complete schema after the v2 migration (see migrations/v2_schema_migration.sql).
--
-- Run this entire file in the Supabase SQL Editor on a fresh project.
-- For an existing v1 project, run migrations/v2_schema_migration.sql instead.
-- ============================================================

-- 1. Extensions ----------------------------------------------
create extension if not exists "postgis";

-- 2. Enums ---------------------------------------------------
create type user_role as enum ('shoppee', 'shopper');

-- (v2 removes the product_category and size_label enums — taxonomy now
-- lives in the genders / product_categories / product_types tables below.)

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
  id                  uuid primary key default gen_random_uuid(),
  owner_id            uuid not null references profiles(id) on delete cascade,
  name                text not null,
  banner_url          text,
  address             text not null,
  city                text not null default 'Patiala',
  location            geography(point, 4326) not null,
  opening_time        time,
  closing_time        time,
  contact_phone       text not null,
  categories          text[] not null default '{}',
  is_active           boolean not null default true,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  -- v2 additions
  logo_url            text,
  cover_image_url     text,
  description         text,
  business_hours      jsonb default '[]',
  whatsapp_number     text,
  completeness_score  int not null default 0 check (completeness_score between 0 and 100)
);

create index stores_owner_idx        on stores(owner_id);
create index stores_location_idx     on stores using gist(location);
create unique index stores_one_per_owner_idx on stores(owner_id);

-- 5. Taxonomy lookups ----------------------------------------
create table genders (
  id    int primary key generated always as identity,
  name  text not null unique
);

create table product_categories (
  id         int primary key generated always as identity,
  gender_id  int not null references genders(id) on delete cascade,
  name       text not null,
  unique (gender_id, name)
);

create table product_types (
  id           int primary key generated always as identity,
  category_id  int not null references product_categories(id) on delete cascade,
  name         text not null,
  unique (category_id, name)
);

create index product_categories_gender_idx on product_categories(gender_id);
create index product_types_category_idx    on product_types(category_id);

-- Taxonomy seed lives in migrations/v2_schema_migration.sql.

-- 6. Products (v2 — rich apparel attributes) -----------------
create table products (
  id            uuid primary key default gen_random_uuid(),
  store_id      uuid not null references stores(id) on delete cascade,
  name          text not null,
  description   text,
  price         numeric(10,2) not null check (price >= 0),
  gender_id     int  not null references genders(id),
  category_id   int  not null references product_categories(id),
  type_id       int  not null references product_types(id),
  fabric        text check (fabric in ('Cotton','Cotton Blend','Polyester','Rayon','Linen','Denim','Silk')),
  gsm           int,
  fit           text check (fit in ('Slim','Regular','Relaxed','Oversized')),
  pattern       text,
  sleeve_type   text,
  neck_type     text,
  occasion      text,
  season        text,
  wash_care     text,
  photo_urls    text[] not null default '{}',
  status        text not null default 'active' check (status in ('active','draft','inactive')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index products_store_idx    on products(store_id);
create index products_gender_idx   on products(gender_id);
create index products_category_idx on products(category_id);
create index products_type_idx     on products(type_id);
create index products_status_idx   on products(status);

-- 7. Product variants ----------------------------------------
create table product_variants (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid not null references products(id) on delete cascade,
  color       text not null,
  size        text not null,
  qty         int not null default 0 check (qty >= 0),
  sku         text,
  unique (product_id, color, size)
);

create index product_variants_product_idx on product_variants(product_id);

-- 8. Store wishlist (renamed from `wishlists` in v2) ---------
create table store_wishlists (
  shoppee_id  uuid not null references profiles(id) on delete cascade,
  store_id    uuid not null references stores(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (shoppee_id, store_id)
);

create index store_wishlists_shoppee_idx on store_wishlists(shoppee_id);

-- 9. Product wishlist (new in v2) ----------------------------
create table product_wishlist (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references profiles(id) on delete cascade,
  product_id  uuid not null references products(id) on delete cascade,
  created_at  timestamptz not null default now(),
  unique (user_id, product_id)
);

create index product_wishlist_user_idx    on product_wishlist(user_id);
create index product_wishlist_product_idx on product_wishlist(product_id);

-- 10. Store views (legacy — unchanged) -----------------------
create table store_views (
  id         bigserial primary key,
  store_id   uuid not null references stores(id) on delete cascade,
  viewer_id  uuid references profiles(id) on delete set null,
  viewed_at  timestamptz not null default now()
);

create index store_views_store_day_idx on store_views(store_id, viewed_at);

-- 11. Product views (new in v2) ------------------------------
create table product_views (
  id          bigserial primary key,
  product_id  uuid not null references products(id) on delete cascade,
  viewer_id   uuid references profiles(id) on delete set null,
  viewed_at   timestamptz not null default now()
);

create index product_views_product_day_idx on product_views(product_id, viewed_at);

-- 12. Contact events (new in v2) -----------------------------
create table contact_events (
  id          bigserial primary key,
  store_id    uuid not null references stores(id) on delete cascade,
  event_type  text not null check (event_type in ('whatsapp','call','directions','share')),
  user_id     uuid references profiles(id) on delete set null,
  created_at  timestamptz not null default now()
);

create index contact_events_store_day_idx on contact_events(store_id, created_at);
create index contact_events_type_idx      on contact_events(event_type);

-- 13. Reviews (legacy — unchanged) ---------------------------
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
-- 14. RPC: nearby_stores (legacy — unchanged)
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
language sql stable as $$
  select
    s.id, s.name, s.banner_url, s.address, s.categories,
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
-- 15. Store completeness scoring (v2)
-- ============================================================
-- Weights (total 100):
--   name=10, description=10, logo_url=15, cover_image_url=15,
--   whatsapp_number=10, contact_phone=10, business_hours non-empty=10,
--   location set=10, is_active=5, categories non-empty=5

create or replace function compute_store_completeness(s stores)
returns int language plpgsql immutable as $$
declare score int := 0;
begin
  if coalesce(length(trim(s.name)), 0) > 0                        then score := score + 10; end if;
  if coalesce(length(trim(s.description)), 0) > 0                 then score := score + 10; end if;
  if coalesce(length(trim(s.logo_url)), 0) > 0                    then score := score + 15; end if;
  if coalesce(length(trim(s.cover_image_url)), 0) > 0             then score := score + 15; end if;
  if coalesce(length(trim(s.whatsapp_number)), 0) > 0             then score := score + 10; end if;
  if coalesce(length(trim(s.contact_phone)), 0) > 0               then score := score + 10; end if;
  if s.business_hours is not null
     and jsonb_typeof(s.business_hours) = 'array'
     and jsonb_array_length(s.business_hours) > 0                 then score := score + 10; end if;
  if s.location is not null                                       then score := score + 10; end if;
  if s.is_active                                                  then score := score + 5;  end if;
  if s.categories is not null and array_length(s.categories,1) > 0 then score := score + 5; end if;
  return score;
end $$;

create or replace function stores_set_completeness()
returns trigger language plpgsql as $$
begin
  new.completeness_score := compute_store_completeness(new);
  return new;
end $$;

create trigger stores_completeness_trg
  before insert or update on stores
  for each row execute function stores_set_completeness();

-- ============================================================
-- 16. Row Level Security
-- ============================================================

alter table profiles            enable row level security;
alter table stores              enable row level security;
alter table genders             enable row level security;
alter table product_categories  enable row level security;
alter table product_types       enable row level security;
alter table products            enable row level security;
alter table product_variants    enable row level security;
alter table store_wishlists     enable row level security;
alter table product_wishlist    enable row level security;
alter table store_views         enable row level security;
alter table product_views       enable row level security;
alter table contact_events      enable row level security;
alter table reviews             enable row level security;

-- Profiles
create policy "profiles: read own"               on profiles for select using (auth.uid() = id);
create policy "profiles: insert self at signup"  on profiles for insert with check (auth.uid() = id);
create policy "profiles: update own (except role)" on profiles for update using (auth.uid() = id) with check (auth.uid() = id);

-- Stores
create policy "stores: public read active" on stores for select using (is_active = true);
create policy "stores: owner insert"       on stores for insert with check (auth.uid() = owner_id);
create policy "stores: owner update"       on stores for update using (auth.uid() = owner_id);
create policy "stores: owner delete"       on stores for delete using (auth.uid() = owner_id);

-- Taxonomy — public read-only
create policy "genders: public read"            on genders            for select using (true);
create policy "product_categories: public read" on product_categories for select using (true);
create policy "product_types: public read"      on product_types      for select using (true);

-- Products
create policy "products: public read active"
  on products for select
  using (
    status = 'active'
    and exists (select 1 from stores s where s.id = store_id and s.is_active = true)
  );
create policy "products: owner all"
  on products for all
  using (exists (select 1 from stores s where s.id = store_id and s.owner_id = auth.uid()))
  with check (exists (select 1 from stores s where s.id = store_id and s.owner_id = auth.uid()));

-- Product variants
create policy "product_variants: public read"
  on product_variants for select
  using (
    exists (
      select 1 from products p
      join stores s on s.id = p.store_id
      where p.id = product_id and p.status = 'active' and s.is_active = true
    )
  );
create policy "product_variants: owner all"
  on product_variants for all
  using (
    exists (
      select 1 from products p
      join stores s on s.id = p.store_id
      where p.id = product_id and s.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from products p
      join stores s on s.id = p.store_id
      where p.id = product_id and s.owner_id = auth.uid()
    )
  );

-- Store wishlist
create policy "store_wishlists: own"
  on store_wishlists for all
  using (auth.uid() = shoppee_id) with check (auth.uid() = shoppee_id);

-- Product wishlist
create policy "product_wishlist: own"
  on product_wishlist for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Store views
create policy "store_views: anyone insert" on store_views for insert with check (true);
create policy "store_views: owner read"
  on store_views for select
  using (exists (select 1 from stores s where s.id = store_id and s.owner_id = auth.uid()));

-- Product views
create policy "product_views: anyone insert" on product_views for insert with check (true);
create policy "product_views: store owner read"
  on product_views for select
  using (
    exists (
      select 1 from products p
      join stores s on s.id = p.store_id
      where p.id = product_id and s.owner_id = auth.uid()
    )
  );

-- Contact events
create policy "contact_events: anyone insert" on contact_events for insert with check (true);
create policy "contact_events: store owner read"
  on contact_events for select
  using (exists (select 1 from stores s where s.id = store_id and s.owner_id = auth.uid()));

-- Reviews
create policy "reviews: public read" on reviews for select using (true);
create policy "reviews: shoppee own write"
  on reviews for all
  using (auth.uid() = shoppee_id) with check (auth.uid() = shoppee_id);

-- ============================================================
-- 17. Grants
-- ============================================================

grant usage on schema public to anon, authenticated;

grant select on genders, product_categories, product_types to anon, authenticated;

grant select, insert, update, delete on products            to authenticated;
grant select, insert, update, delete on product_variants    to authenticated;
grant select, insert, update, delete on product_wishlist    to authenticated;
grant select, insert                  on product_views      to anon, authenticated;
grant select, insert                  on contact_events     to anon, authenticated;

grant select on products            to anon;
grant select on product_variants    to anon;
grant select on product_wishlist    to anon;

grant usage, select on sequence product_views_id_seq  to anon, authenticated;
grant usage, select on sequence contact_events_id_seq to anon, authenticated;

-- ============================================================
-- 18. Storage buckets (legacy — unchanged)
-- ============================================================

insert into storage.buckets (id, name, public)
values
  ('store-banners',   'store-banners',   true),
  ('product-photos',  'product-photos',  true)
on conflict (id) do nothing;

create policy "store-banners: owner upload"
  on storage.objects for insert
  with check (bucket_id = 'store-banners' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "store-banners: owner update"
  on storage.objects for update
  using (bucket_id = 'store-banners' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "store-banners: public read"
  on storage.objects for select using (bucket_id = 'store-banners');

create policy "product-photos: owner upload"
  on storage.objects for insert
  with check (bucket_id = 'product-photos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "product-photos: owner update"
  on storage.objects for update
  using (bucket_id = 'product-photos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "product-photos: public read"
  on storage.objects for select using (bucket_id = 'product-photos');

-- ============================================================
-- 19. updated_at maintenance
-- ============================================================

create or replace function touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

create trigger profiles_touch before update on profiles
  for each row execute function touch_updated_at();
create trigger stores_touch before update on stores
  for each row execute function touch_updated_at();
create trigger products_touch before update on products
  for each row execute function touch_updated_at();

-- ============================================================
-- 20. Reload PostgREST schema cache
-- ============================================================
notify pgrst, 'reload schema';
