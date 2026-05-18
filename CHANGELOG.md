# Changelog — Locally

All notable changes to this project are documented here.

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
