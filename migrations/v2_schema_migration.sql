-- ============================================================
-- Locally — v2 Schema Migration (Phase 1)
-- ============================================================
-- Wipes legacy products + variant/inventory + product enums.
-- Renames wishlists -> store_wishlists.
-- Adds richer apparel taxonomy (genders > categories > types).
-- Adds product variants, product wishlist, store enrichment columns,
-- store-completeness scoring, product views, contact events,
-- and RLS on every new table.
--
-- IDEMPOTENT-ish: uses IF EXISTS / IF NOT EXISTS where possible.
-- Run in Supabase SQL Editor (or via Management API).
-- ============================================================

begin;

-- ============================================================
-- 0. Drop legacy artefacts
-- ============================================================

-- products references store_id and the legacy enums. Drop dependents first.
drop table if exists products cascade;

-- legacy enums
drop type if exists product_category cascade;
drop type if exists size_label cascade;

-- ============================================================
-- 1. Rename wishlists -> store_wishlists (keep data)
-- ============================================================

do $$
begin
  if exists (select 1 from pg_tables where schemaname='public' and tablename='wishlists') then
    alter table wishlists rename to store_wishlists;
  end if;
end $$;

-- rename the index if it exists from the legacy schema
do $$
begin
  if exists (select 1 from pg_indexes where schemaname='public' and indexname='wishlists_shoppee_idx') then
    alter index wishlists_shoppee_idx rename to store_wishlists_shoppee_idx;
  end if;
end $$;

-- drop & recreate the RLS policy under the new table name (Postgres keeps the
-- policy attached to the renamed table, but the policy name still references
-- "wishlists" semantically — recreate cleanly).
drop policy if exists "wishlists: own" on store_wishlists;
create policy "store_wishlists: own"
  on store_wishlists for all
  using (auth.uid() = shoppee_id)
  with check (auth.uid() = shoppee_id);

-- ============================================================
-- 2. Taxonomy lookup tables
-- ============================================================

create table if not exists genders (
  id    int primary key generated always as identity,
  name  text not null unique
);

create table if not exists product_categories (
  id         int primary key generated always as identity,
  gender_id  int not null references genders(id) on delete cascade,
  name       text not null,
  unique (gender_id, name)
);

create table if not exists product_types (
  id           int primary key generated always as identity,
  category_id  int not null references product_categories(id) on delete cascade,
  name         text not null,
  unique (category_id, name)
);

create index if not exists product_categories_gender_idx on product_categories(gender_id);
create index if not exists product_types_category_idx    on product_types(category_id);

-- ============================================================
-- 3. Seed taxonomy
-- ============================================================

insert into genders (name) values ('Men'), ('Women'), ('Kids')
  on conflict (name) do nothing;

-- Helper inline seeds — uses subqueries against genders/product_categories
-- so it's safe to re-run.

-- MEN
insert into product_categories (gender_id, name)
select g.id, c.name
from genders g
cross join (values ('Topwear'), ('Bottomwear'), ('Outerwear')) as c(name)
where g.name = 'Men'
on conflict (gender_id, name) do nothing;

insert into product_types (category_id, name)
select pc.id, t.name from product_categories pc
join genders g on g.id = pc.gender_id and g.name = 'Men'
join (values
  ('Topwear','T-Shirt'),('Topwear','Shirt'),('Topwear','Polo'),
  ('Bottomwear','Jeans'),('Bottomwear','Trousers'),('Bottomwear','Shorts'),
  ('Outerwear','Jacket'),('Outerwear','Hoodie'),('Outerwear','Blazer')
) as t(cat, name) on t.cat = pc.name
on conflict (category_id, name) do nothing;

-- WOMEN
insert into product_categories (gender_id, name)
select g.id, c.name
from genders g
cross join (values ('Topwear'), ('Bottomwear'), ('Ethnic Wear'), ('Outerwear')) as c(name)
where g.name = 'Women'
on conflict (gender_id, name) do nothing;

insert into product_types (category_id, name)
select pc.id, t.name from product_categories pc
join genders g on g.id = pc.gender_id and g.name = 'Women'
join (values
  ('Topwear','Kurti'),('Topwear','Blouse'),('Topwear','T-Shirt'),('Topwear','Crop Top'),
  ('Bottomwear','Jeans'),('Bottomwear','Leggings'),('Bottomwear','Palazzo'),('Bottomwear','Salwar'),
  ('Ethnic Wear','Saree'),('Ethnic Wear','Lehenga'),('Ethnic Wear','Anarkali'),('Ethnic Wear','Suit'),
  ('Outerwear','Jacket'),('Outerwear','Cardigan'),('Outerwear','Shrug')
) as t(cat, name) on t.cat = pc.name
on conflict (category_id, name) do nothing;

-- KIDS
insert into product_categories (gender_id, name)
select g.id, c.name
from genders g
cross join (values ('Topwear'), ('Bottomwear')) as c(name)
where g.name = 'Kids'
on conflict (gender_id, name) do nothing;

insert into product_types (category_id, name)
select pc.id, t.name from product_categories pc
join genders g on g.id = pc.gender_id and g.name = 'Kids'
join (values
  ('Topwear','T-Shirt'),('Topwear','Shirt'),('Topwear','Frock'),
  ('Bottomwear','Jeans'),('Bottomwear','Shorts'),('Bottomwear','Leggings')
) as t(cat, name) on t.cat = pc.name
on conflict (category_id, name) do nothing;

-- ============================================================
-- 4. New products table
-- ============================================================

create table products (
  id            uuid primary key default gen_random_uuid(),
  store_id      uuid not null references stores(id) on delete cascade,
  name          text not null,
  description   text,
  price         numeric(10,2) not null check (price >= 0),
  gender_id     int  not null references genders(id),
  category_id   int  not null references product_categories(id),
  type_id       int  not null references product_types(id),
  -- apparel attributes
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

create index products_store_idx       on products(store_id);
create index products_gender_idx      on products(gender_id);
create index products_category_idx    on products(category_id);
create index products_type_idx        on products(type_id);
create index products_status_idx      on products(status);

-- ============================================================
-- 5. product_variants
-- ============================================================

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

-- ============================================================
-- 6. product_wishlist (user saves a single product)
-- ============================================================

create table product_wishlist (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references profiles(id) on delete cascade,
  product_id  uuid not null references products(id) on delete cascade,
  created_at  timestamptz not null default now(),
  unique (user_id, product_id)
);

create index product_wishlist_user_idx    on product_wishlist(user_id);
create index product_wishlist_product_idx on product_wishlist(product_id);

-- ============================================================
-- 7. Stores — additive columns
-- ============================================================

alter table stores add column if not exists logo_url            text;
alter table stores add column if not exists cover_image_url     text;
alter table stores add column if not exists description         text;
alter table stores add column if not exists business_hours      jsonb default '[]';
alter table stores add column if not exists whatsapp_number     text;
alter table stores add column if not exists completeness_score  int not null default 0
  check (completeness_score between 0 and 100);

-- ============================================================
-- 8. Store completeness scoring (function + trigger)
-- ============================================================
-- Weights (total 100):
--   name=10, description=10, logo_url=15, cover_image_url=15,
--   whatsapp_number=10, contact_phone=10, business_hours non-empty=10,
--   location set=10, is_active=5, categories non-empty=5

create or replace function compute_store_completeness(s stores)
returns int language plpgsql immutable as $$
declare
  score int := 0;
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

drop trigger if exists stores_completeness_trg on stores;
create trigger stores_completeness_trg
  before insert or update on stores
  for each row execute function stores_set_completeness();

-- Backfill existing rows
update stores set name = name;  -- trips the trigger to recompute

-- ============================================================
-- 9. Analytics — product_views & contact_events
-- ============================================================

create table product_views (
  id          bigserial primary key,
  product_id  uuid not null references products(id) on delete cascade,
  viewer_id   uuid references profiles(id) on delete set null,
  viewed_at   timestamptz not null default now()
);

create index product_views_product_day_idx on product_views(product_id, viewed_at);

create table contact_events (
  id          bigserial primary key,
  store_id    uuid not null references stores(id) on delete cascade,
  event_type  text not null check (event_type in ('whatsapp','call','directions','share')),
  user_id     uuid references profiles(id) on delete set null,
  created_at  timestamptz not null default now()
);

create index contact_events_store_day_idx on contact_events(store_id, created_at);
create index contact_events_type_idx      on contact_events(event_type);

-- ============================================================
-- 10. updated_at touch on new products
-- ============================================================

create trigger products_touch before update on products
  for each row execute function touch_updated_at();

-- ============================================================
-- 11. Row Level Security
-- ============================================================

alter table genders            enable row level security;
alter table product_categories enable row level security;
alter table product_types      enable row level security;
alter table products           enable row level security;
alter table product_variants   enable row level security;
alter table product_wishlist   enable row level security;
alter table product_views      enable row level security;
alter table contact_events     enable row level security;

-- Taxonomy: public read-only (no write from app)
create policy "genders: public read"            on genders            for select using (true);
create policy "product_categories: public read" on product_categories for select using (true);
create policy "product_types: public read"      on product_types      for select using (true);

-- Products: public read active; owner full write
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

-- Product variants: public read via parent product (active); owner write
create policy "product_variants: public read"
  on product_variants for select
  using (
    exists (
      select 1 from products p
      join stores s on s.id = p.store_id
      where p.id = product_id
        and p.status = 'active'
        and s.is_active = true
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

-- Product wishlist: user owns their own rows
create policy "product_wishlist: own"
  on product_wishlist for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- product_views: open insert; product's store owner reads
create policy "product_views: anyone insert"
  on product_views for insert
  with check (true);

create policy "product_views: store owner read"
  on product_views for select
  using (
    exists (
      select 1 from products p
      join stores s on s.id = p.store_id
      where p.id = product_id and s.owner_id = auth.uid()
    )
  );

-- contact_events: open insert; store owner reads
create policy "contact_events: anyone insert"
  on contact_events for insert
  with check (true);

create policy "contact_events: store owner read"
  on contact_events for select
  using (exists (select 1 from stores s where s.id = store_id and s.owner_id = auth.uid()));

-- ============================================================
-- 12. Grants (mirror existing v1 pattern — authenticated needs CRUD)
-- ============================================================

grant usage on schema public to anon, authenticated;

grant select on genders, product_categories, product_types to anon, authenticated;

grant select, insert, update, delete on products            to authenticated;
grant select, insert, update, delete on product_variants    to authenticated;
grant select, insert, update, delete on product_wishlist    to authenticated;
grant select, insert                  on product_views      to anon, authenticated;
grant select                          on product_views      to authenticated;
grant select, insert                  on contact_events     to anon, authenticated;
grant select                          on contact_events     to authenticated;

-- anon needs SELECT grant so RLS can silently filter (otherwise PostgREST errors at grant layer).
grant select on products            to anon;
grant select on product_variants    to anon;
grant select on product_wishlist    to anon;

grant usage, select on sequence product_views_id_seq    to anon, authenticated;
grant usage, select on sequence contact_events_id_seq   to anon, authenticated;

commit;

-- ============================================================
-- 13. Reload PostgREST schema cache
-- ============================================================
notify pgrst, 'reload schema';
