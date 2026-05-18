# Changelog — Locally

All notable changes to this project are documented here.

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
