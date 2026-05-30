# Changelog — Locally

All notable changes to this project are documented here.

---

## [2.2.0] — 2026-05-31

### Phase 3 — Shoppee P1 (store CTAs, shared cards, wishlist tabs, profile more section)

Six additive features building on the clean v2 base. All new components are shared
and reusable across the catalogue, wishlist, and home feed.

- **WhatsApp + Directions + Call CTA row** — The store detail page now shows a
  three-button row (WhatsApp, Directions, Call) replacing the old two-button row.
  WhatsApp only renders when the store has a `whatsapp_number` set. Directions
  links use a proper Google Maps deep link (`/maps/dir/?api=1&destination=lat,lng`)
  with coordinates parsed from the PostGIS GeoJSON response — previously the link
  used a text address query. Every button tap logs a row to `contact_events` so
  shopkeepers can see which contact method customers use most in their dashboard.
- **StoreCard shared component** — A reusable card (`components/shoppee/StoreCard`)
  replaces the inline store card markup in the home feed and explore page. Shows
  cover image (falls back to banner, then a warm-ivory placeholder with the store
  initial), up to 2 category pills, distance, open/closed badge with a colored dot,
  and product count when available.
- **ProductCard shared component** — A reusable product card (`components/shoppee/ProductCard`)
  replaces the inline product grid on the store detail page. Renders a lazy-loaded
  square image, name, GSM badge, fabric label, formatted price (or "Price on visit"
  when null), gender + type line, and a color-coded stock badge (In Stock / Low
  Stock / Out of Stock) derived from variant quantities. A small client-side
  `ProductWishlistHeart` sub-component handles the heart toggle without making the
  whole card a client component.
- **Product wishlist** — Users can now save individual products. The heart icon on
  each ProductCard inserts or removes a row from `product_wishlist`. The server action
  (`toggleProductWishlist`) lives alongside the existing store wishlist action in
  `app/(shoppee)/wishlist/actions.ts`.
- **Wishlist page — 2 tabs** — The wishlist page is rebuilt as a server component
  that fetches both saved stores and saved products, then passes them to a
  `WishlistTabs` client component backed by shadcn Tabs. Tab triggers show counts
  (e.g. "Stores (3)" / "Products (7)"). Each tab has a distinct empty state with a
  call-to-action. The active tab can be set via `?tab=stores` or `?tab=products` URL
  param, so other pages can deep-link directly to the products tab.
- **Profile page — More section** — The placeholder "About Locally" row in the More
  section is replaced by a `ProfileMoreSection` client component with 6 rows:
  Saved Products (with count badge, links to wishlist products tab), Saved Stores
  (count badge, links to wishlist stores tab), Recently Viewed Stores, Change City
  (opens a shadcn Dialog with Patiala / Chandigarh / Ludhiana / Amritsar / Auto-detect;
  sets the `shoppee_location` cookie via a server action), Notification Preferences
  (links to a new `/profile/notifications` stub page), and Share App (Web Share API
  with clipboard fallback). The Saved Items stat on the profile card now reflects
  both saved stores and saved products combined.

---

## [2.1.0] — 2026-05-30

### Phase 2 — Shopper P0 (app layer catches up to v2 schema)

The v2 database migration shipped in 2.0.0; this release rebuilds the entire
Shopper (store-owner) flow to match. All v1 column references — `is_available`,
`category` text, `sizes[]`, `colors[]`, the `product_category` enum, and the
old `wishlists` table — are gone. The Shoppee side was updated in lock-step
so the public catalogue keeps working with the new schema.

- **6-step product creation wizard** (`/shopper/inventory/new`) — Replaces
  the single-form "Add product" page. Step 1 picks the gender → category →
  product type from the new taxonomy lookup tables. Step 2 captures name,
  description, price, and draft/active status. Step 3 has fabric, GSM, fit,
  pattern, sleeve, neck, occasion, season, and wash care. Step 4 is a
  preset + custom multi-select for colors and sizes. Step 5 auto-builds the
  inventory matrix (rows = colors, cols = sizes) with per-cell qty inputs
  and per-row SKUs (auto-pattern `{STORE_ABBREV}-{TYPE_ABBREV}-{COLOR}-{SIZE}`
  when blank). Step 6 uploads up to 4 photos with up/down reorder and a
  "Primary" badge on the first. Publish writes a `products` row and N
  `product_variants` rows in one action; Save as Draft only requires
  taxonomy + name. Browser back triggers an unsaved-changes warning.
- **Store profile expansion** (`/shopper/setup` and `/shopper/settings`) —
  The setup form now captures logo, cover image, description (500 char
  counter), per-day business hours (open/close times with a Closed toggle),
  and WhatsApp number. A new `SettingsForm` lets the shopkeeper edit any
  of those fields after creation, with a live completeness score progress
  bar at the top (re-queried after each save — the score is trigger-computed
  in the database). Both forms compress images client-side to under 2MB
  with `browser-image-compression` (JPG/PNG only) and upload to the new
  `store-logos` and `store-covers` Supabase Storage buckets with
  owner-scoped RLS policies.
- **Inventory list rewrite** (`/shopper/inventory`) — Server-side paginated
  (20/page) with search (`?q=`), gender/category/stock filters as URL
  params, and Newest/Low-stock-first sort. Each row shows the product type
  label (joined from `product_types`), a stock badge in the v2 spec colors
  (In stock #16A34A, Low stock #F59E0B, Out of stock #DC2626) with the
  total qty computed from the joined `product_variants` rows, and edit /
  delete actions.
- **Shopkeeper dashboard rewrite** (`/shopper/dashboard`) — Three 3-up
  card rows: Today's store views / product views / wishlist saves; last 30
  days direction opens / WhatsApp clicks / calls (read from
  `contact_events`); inventory summary of active / low stock / out of
  stock products. All queries run in parallel via `Promise.all`. The
  Quick Actions row has Add product, Share store (Web Share API with
  clipboard fallback), and View store.
- **Shoppee catalogue catches up** — `/store/[id]` filters by `status =
  'active'` instead of `is_available = true` and reads the product type
  label via a join. `/product/[id]` derives the displayed sizes and colors
  from in-stock `product_variants` rows (qty > 0) and shows the
  description. Wishlist actions, profile counts, home-feed wishlist join,
  and store-detail wishlist all use `store_wishlists`.
- **Storage buckets added** — `store-logos` and `store-covers` with the
  same owner-scoped insert/update + public read policies as the existing
  `store-banners` / `product-photos` buckets. Created via the Management
  API; included in `SCHEMA.sql` snapshots going forward.

`npx tsc --noEmit` is clean and `next build` succeeds across all 23
routes. No new runtime dependencies were added (the wizard relies on the
already-installed `browser-image-compression`).

---

## [2.0.0] — 2026-05-30

### Breaking — schema overhaul (Phase 1)

Locally's catalogue model is being rebuilt to support real apparel attributes, variants, and richer store profiles. This release applies the database migration only. UI changes ship in a later phase.

- **Products redesigned around real apparel attributes** — The old flat product row (single category, sizes/colors arrays, `is_available` flag) is gone. The new `products` table has separate gender/category/type references plus apparel-specific columns (fabric, GSM, fit, pattern, sleeve type, neck type, occasion, season, wash care) and a `status` field replacing `is_available`.
- **Stock now lives on variants** — A new `product_variants` table holds the `(color, size, qty, sku)` rows per product, with a unique constraint on `(product_id, color, size)`.
- **Taxonomy is data, not enums** — Replaced the `product_category` and `size_label` enums with three lookup tables: `genders`, `product_categories`, `product_types`. Seeded with 3 genders, 11 categories, and 30 product types covering Men, Women, and Kids apparel.
- **Wishlist split** — The old store-level `wishlists` table was renamed to `store_wishlists`. A new `product_wishlist` table lets shoppees save individual products.
- **Store profile enrichment** — Added six new columns to `stores`: `logo_url`, `cover_image_url`, `description`, `business_hours` (jsonb), `whatsapp_number`, `completeness_score` (0-100, auto-computed by trigger).
- **Store completeness scoring** — New `compute_store_completeness` function + trigger rates store profiles on 10 dimensions (name 10, description 10, logo 15, cover 15, whatsapp 10, contact_phone 10, business_hours 10, location 10, is_active 5, categories 5).
- **Analytics tables** — Added `product_views` (per-product view tracking) and `contact_events` (whatsapp/call/directions/share events, store-level).
- **RLS on every new table** — Public read on active products/variants/taxonomy; owner-only writes on products/variants/stores; user-owned rows on `product_wishlist`; open insert + owner read on analytics tables; taxonomy is read-only from the app.
- **PostgREST schema cache reload** — `NOTIFY pgrst, 'reload schema'` is the last statement in the migration so the API sees the new tables immediately.

Migration file: `migrations/v2_schema_migration.sql`. Full schema snapshot: `SCHEMA.sql`. TypeScript types in `types/database.ts` were regenerated against the live database.

No app code changed in this release. The UI still references the v1 product shape and will be updated in Phase 2.

---

## [1.0.9] — 2026-05-18

### Visual Refresh

- **Login page is now role-aware** — Customers (Shoppee) see the warm ivory and terracotta login screen as before. Store owners (Shopper) now see a clean white and purple login screen with a "Manage your store, grow your business" tagline and a shopkeeper-specific subtitle.
- **Shopper login now shows invite prompt** — Instead of a "Sign up" link, the Shopper login footer now shows "Request invite" — tapping it displays a message explaining that store accounts are by invitation only, with a contact email.
- **Signup page redesigned for customers** — The Shoppee signup screen now uses the full warm ivory and terracotta design: Locally wordmark, Playfair Display headings, warm input fields, and a terracotta "Create account" button.

---

## [1.0.8] — 2026-05-18

### Enhancements

- **Profile now shows your activity stats** — A new stats row on your Profile page displays how many stores you have saved to your Wishlist and how many unique stores you have discovered so far.
- **Profile shows recently visited stores** — A new "My Activity" section lists the last 3 stores you viewed, with their banner image and category, so you can quickly revisit recent finds.
- **Profile "More" section** — An "About Locally" entry has been added at the bottom of the Profile page for future app information and support links.
- **Login page redesigned for Shoppee** — The customer login screen now matches the warm ivory and terracotta palette: a "Locally" wordmark at the top, Playfair Display headings, and warm-styled input fields and button.

---

## [1.0.7] — 2026-05-18

### Visual Refresh

- **Wishlist page redesigned** — The Wishlist screen now matches the warm terracotta and ivory design throughout: white store cards with subtle shadows, Playfair Display store names, warm category tags, and a terracotta "Explore shops" call-to-action on the empty state.
- **Profile page redesigned** — The Profile screen now shows an avatar circle with your initial in terracotta, your name in Playfair Display, and warm muted text for email and membership date. The Log out button is now an outlined terracotta style to match the rest of the Shoppee design.
- **Shoppee warm palette complete** — All six customer-facing screens (Home, Explore, Store, Product, Wishlist, Profile) now use the warm ivory and terracotta design system.

---

## [1.0.6] — 2026-05-18

### Visual Refresh

- **Store pages redesigned** — Store detail pages now use the warm ivory background with a Playfair Display store name, warm category pills, updated icon colours, and white product cards with subtle shadows. Call and directions buttons use the new rounded style.
- **Product pages redesigned** — Product detail pages now use the warm palette throughout: Playfair Display product name, terracotta price and category badge, warm size chip borders, and a white "Sold by" store card with a terracotta Visit Store button.

---

## [1.0.5] — 2026-05-18

### Visual Refresh

- **Home feed redesigned** — The nearby stores screen now uses the warm ivory background with white store cards, a Playfair Display heading ("Shops near you"), and terracotta accents throughout. Category filter chips use a muted warm style when inactive and solid terracotta when selected. Open/closed badges, ratings, and distance labels all use the new warm palette.
- **Explore page redesigned** — The Explore screen now matches the warm visual language of the rest of the app: ivory background, white store cards with subtle shadows, Playfair Display headings, and terracotta category tags on each result card.

---

## [1.0.4] — 2026-05-18

### Visual Refresh

- **New look for the Shoppee experience** — The customer-facing app now uses a warm terracotta and ivory colour palette, replacing the previous teal theme. The bottom navigation bar has been updated to match, with a white background, warm border, and terracotta highlight for the active tab.
- **New fonts** — The Shoppee app now uses DM Sans for body text and Playfair Display for headings, giving it a warmer, more editorial feel.

---

## [1.0.3] — 2026-05-18

### Bug Fixes

- **Logout button is now fully visible** — The Log out button on the Profile page was clipped behind the bottom navigation bar. Increased the bottom padding so the button is always reachable.
- **Profile shows "Member since" date** — The Profile card now displays the month and year your account was created (e.g. "Member since May 2026") so you can see how long you've been with Locally.

---

## [1.0.2] — 2026-05-18

### Changes

- **Shopkeeper signup is now invite-only** — The Shopkeeper tile on the role selection screen is no longer clickable. It displays an "Accounts are by invitation only. Contact admin." message. Store owner accounts are created by Locally admins only.
- **Shopper self-signup blocked at all layers** — Attempting to reach `/signup?role=shopper` now redirects to the role screen. The signup server action also rejects any shopper signup attempt as a backend safeguard.
- **Customer (Shoppee) signup unchanged** — Customers can still self-register as before.

---

## [1.0.1] — 2026-05-18

### Bug Fixes

- **Location button no longer freezes** — The "Use my current location" button on the store setup page now times out after 10 seconds if GPS cannot acquire a fix, showing a retry-able error instead of spinning forever.
- **Signup and login now work on production** — Fixed a critical RLS (Row Level Security) issue where all database queries returned 403 after login. Root cause: the `authenticated` role had no SELECT/INSERT/UPDATE/DELETE privileges on any table — only structural privileges (REFERENCES, TRIGGER, TRUNCATE) were granted. Applied correct GRANTs to all 6 tables.
- **Profile creation no longer fails on signup** — Moved profile row creation from the Server Action to a Postgres trigger (`handle_new_user`, SECURITY DEFINER). Fixes a Supabase SSR pattern where `auth.uid()` is null server-side immediately after `signUp()` in the same request cycle, causing the INSERT RLS policy to reject the write.

---

## [1.0.0] — 2026-05-17

### Initial Release

**Locally** is a hyperlocal clothing store directory — discover clothing stores near you, browse their catalogues, and visit in person.

#### Store Owner (Shopper) Features

- **Store setup** — List your shop with name, address, opening/closing hours, contact phone, category tags, and GPS-pinned location. Optional banner photo with client-side compression.
- **Dashboard** — View today's profile views, total inventory count, average rating, and wishlist saves at a glance.
- **Inventory management** — Add, edit, and remove products with name, price, category, sizes, colors, and up to 4 photos per item.
- **Reviews** — Read all customer reviews for your store in one place.
- **Settings** — Update store details after setup.

#### Customer (Shoppee) Features

- **Nearby stores feed** — See clothing stores within 5km of your location, sorted by distance. Shows open/closed status, average rating, and distance.
- **Category filters** — Filter nearby stores by Men, Women, Kids, Ethnic, Casual, Formal, or Western.
- **Store pages** — Browse a store's full catalogue, hours, contact details, and all reviews.
- **Product pages** — See product photos, price, available sizes, and colors.
- **Wishlist** — Save stores you love and revisit them from the Wishlist tab.
- **Explore / Search** — Search stores by name or find stores that carry specific products.
- **Profile** — View and manage your account.

#### Platform

- **Location detection** — Automatic GPS detection with manual city fallback (Patiala, Chandigarh, Ludhiana, Amritsar).
- **Role selection** — Choose Shopper (store owner) or Shoppee (customer) at signup with separate onboarding flows.
- **PWA-ready** — Installable as a home screen app on mobile devices.
- **Mobile-first design** — Optimized for 480px mobile viewport with teal (Shoppee) and purple (Shopper) design systems.
