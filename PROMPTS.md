# Locally — Claude Code Prompts

**How to use:** Open Claude Code in your project root (where `CLAUDE.md` lives). Paste prompts in the order below. Wait for each one to finish, verify it works, commit, then move on.

The Stitch HTML reference files for each screen live in `/stitch-reference/` — copy that folder from the original zip into your project root so Claude Code can read them.

---

## Prompt 1 — Scaffolding

```
Initialize this project:

1. Create a Next.js 14 app in the current directory using App Router, TypeScript strict mode, Tailwind CSS, ESLint, src directory NO, app router YES, import alias "@/*".
   Use this exact command:
   pnpm create next-app@latest . --typescript --tailwind --eslint --app --no-src-dir --import-alias "@/*"

2. Install runtime deps:
   pnpm add @supabase/supabase-js @supabase/ssr react-hook-form zod @hookform/resolvers lucide-react leaflet react-leaflet browser-image-compression date-fns

3. Install dev deps:
   pnpm add -D @types/leaflet

4. Initialize shadcn/ui with these choices: TypeScript yes, style "default", base color "slate", CSS variables YES.
   Use: pnpm dlx shadcn@latest init

5. Install initial shadcn components:
   pnpm dlx shadcn@latest add button input label form toast dialog dropdown-menu tabs

6. Create the folder structure exactly as described in CLAUDE.md section 3 (empty files/folders are fine for now).

7. Create .env.local.example with these keys empty:
   NEXT_PUBLIC_SUPABASE_URL=
   NEXT_PUBLIC_SUPABASE_ANON_KEY=
   SUPABASE_SERVICE_ROLE_KEY=

8. Replace app/page.tsx with a simple redirect to /role.

Verify pnpm dev runs cleanly. End by listing every file you created.
```

---

## Prompt 2 — Tailwind tokens + base layout

```
Read DESIGN_SYSTEM.md.

1. Update tailwind.config.ts to include the color tokens (shopper.*, shoppee.*, surface.*, border.*, text.*) and fontSize tokens exactly as specified in DESIGN_SYSTEM.md section 1 and 2.

2. Update app/globals.css to load Inter via next/font/google in app/layout.tsx (not via CSS import). Set Inter as the default font on body.

3. Update app/layout.tsx to wrap children in <main className="mx-auto max-w-[480px] min-h-screen bg-surface"> (mobile-first 480px container).

4. Add a lib/utils.ts cn() helper if shadcn didn't create one already.

5. Create a quick test page at app/test-tokens/page.tsx that renders one button and one badge in each role's color, plus all the typography tokens. I'll delete this after verifying.

Run pnpm dev and confirm the test page renders correctly.
```

---

## Prompt 3 — Supabase setup

```
Set up Supabase end-to-end:

1. Create lib/supabase/client.ts (browser client using @supabase/ssr's createBrowserClient).
2. Create lib/supabase/server.ts (server client using createServerClient with cookies from next/headers).
3. Create lib/supabase/middleware.ts (auth refresh logic for the Next.js middleware).
4. Create middleware.ts at the project root that calls the supabase middleware function. Protect these route groups: (shoppee), (shopper). Redirect unauthenticated users to /role.

5. Generate database types: run
   pnpm dlx supabase gen types typescript --project-id <PLACEHOLDER> --schema public > types/database.ts
   Leave a comment in types/database.ts telling me to replace <PLACEHOLDER> with my actual project ref and re-run the command.

6. Update CLAUDE.md is NOT needed — just confirm the imports work.

7. Delete app/test-tokens/page.tsx now.

End by showing me the contents of middleware.ts.
```

---

## Prompt 4 — Role selection screen

```
Build the role selection screen at app/(auth)/role/page.tsx.

Reference: stitch-reference/threadly_who_are_you_1/ and threadly_who_are_you_2/

Spec:
- Heading "Who are you?" centered, text-h1
- Two cards side-by-side (stacked on very small widths):
  - Shopper card: Store icon (lucide), title "Shopper", subtitle "I own or manage a clothing store"
  - Shoppee card: ShoppingBag icon, title "Shoppee", subtitle "I want to find clothes near me"
- Cards are selectable. Selected card gets a border in its role color and a slight background tint.
- Bottom CTA button: full-width, role-colored once a card is picked. Label is dynamic: "Continue as Shopper" or "Continue as Shoppee".
- Clicking CTA navigates to /onboarding/shoppee or /onboarding/shopper accordingly.

Must be a client component (state for selection). Use the design tokens from DESIGN_SYSTEM.md — no raw hex codes.
```

---

## Prompt 5 — Onboarding carousels

```
Build two onboarding flows:
- app/onboarding/shoppee/page.tsx (teal theme)
- app/onboarding/shopper/page.tsx (purple theme)

Each has 3 slides per the spec in CLAUDE.md / the design summary. Slide content for Shoppee:
1. Discover local stores — find boutiques and clothing shops near you (icon: Store)
2. Browse full catalogues — explore items with sizes, colours, and prices (icon: Shirt)
3. Walk in & shop — get address, hours, directions — buy in person (icon: MapPin)

Shopper slides:
1. Grow your store — list your shop and get discovered by nearby customers (icon: BarChart3)
2. Manage your catalogue — add products with photos, sizes, and colours (icon: Shirt)
3. Be found locally — customers near you will see your store on the map (icon: MapPin)

Layout:
- Skip button top-right on every slide → routes to /login?role=<role>
- Large icon centered, themed color
- Title (text-h1) + description (text-body, text-text-secondary)
- Dot pagination indicator at bottom, themed color for the active dot
- Bottom CTA: "Next" on slides 1–2, "Get started" on slide 3 → /signup?role=<role>

Build a shared OnboardingCarousel component in components/shared/ that takes a slides array and theme prop. Both onboarding pages should be thin wrappers around it.

Use swipe gestures if easy (touch events), but arrow buttons are NOT required — keep it simple.
```

---

## Prompt 6 — Login + Signup

```
Build auth pages. Both pages read the ?role=shoppee|shopper query param and theme accordingly. If no role, redirect to /role.

Pages to build:
- app/(auth)/login/page.tsx
- app/(auth)/signup/page.tsx

Reference: design summary sections "Login screen" and "Sign up screen".

LOGIN spec:
- Title "Welcome back" + subtitle "Sign in to continue"
- Fields: email, password
- "Forgot password?" link (themed) — for v1, route to a stub /forgot page
- CTA "Sign in" (themed, full-width)
- Footer: "No account? Sign up" → /signup?role=<role>

SIGNUP spec:
- Title "Create your account"
- Fields:
  - Shoppee: Full name, Email, Phone (optional for v1), Password, Confirm password
  - Shopper: same
- CTA "Create account"
- Footer: "Already have an account? Sign in"
- Tiny footer line: "By signing up you agree to our Terms & Privacy" (link to stubs)

Implementation:
- Forms: react-hook-form + zod. Schemas in lib/validations/auth.ts.
- Submit handler is a Server Action that:
  - calls supabase.auth.signUp / signInWithPassword
  - on signup, inserts a row into profiles with id = the new auth user id, role from the URL param, full_name, email, phone
  - shows shadcn Toast on error
  - on success, routes to:
    - shoppee → /location  (we'll build that page in prompt 13)
    - shopper → /setup     (we'll build that page in prompt 9)
- Email validation: standard. Password: min 8 chars, at least one digit.
- DO NOT add OAuth. DO NOT add OTP. Email + password only.

End with a summary of files created and any TODOs.
```

---

## Prompt 7 — Auth middleware + route protection

```
Wire up route protection:

1. In middleware.ts, after refreshing the Supabase session:
   - Read the user's profile (role) — cache it in a cookie to avoid a DB call on every request, OR accept one DB call per request for v1 (simpler, do this).
   - If accessing /(shopper)/* and role != 'shopper' → redirect to /role
   - If accessing /(shoppee)/* and role != 'shoppee' → redirect to /role
   - If unauthenticated and accessing any protected route → redirect to /login

2. Update app/page.tsx (root) to:
   - If logged in shopper → redirect to /dashboard
   - If logged in shoppee → redirect to /home
   - If logged out → redirect to /role

3. Create a small server util getCurrentProfile() in lib/supabase/server.ts that returns the profile row for the current user, or null.

Test: try visiting /dashboard while logged out → should bounce to /login. While logged in as shoppee → should bounce to /role (wrong role).
```

---

## Prompt 8 — Logout + profile stub

```
1. Build app/(shoppee)/profile/page.tsx and app/(shopper)/settings/page.tsx with:
   - User name + email displayed
   - Logout button (calls supabase.auth.signOut, redirects to /role)
2. Both pages use their respective theme.
3. Keep them minimal — we'll flesh out settings later.
```

---

## Prompt 9 — Shopper: "List your shop" setup

```
Build app/(shopper)/setup/page.tsx — the first-time setup form for a new shopper after signup.

Logic:
- Server-side check: if the current shopper already has a store row, redirect to /dashboard.
- Otherwise, show the form.

Form fields (react-hook-form + zod schema in lib/validations/store.ts):
- Store banner photo upload (single image, optional for v1)
- Store name (required)
- Full address (required, textarea)
- Opening time + closing time (HH:MM, simple time inputs)
- Contact phone (required)
- Categories: multi-select chips — Men, Women, Kids, Ethnic, Casual, Formal, Western

Geolocation:
- Add a "Use my current location" button that calls navigator.geolocation. Show the captured lat/lng.
- For v1, no map picker — just store the lat/lng from geolocation. If denied, show an inline error and disable submit.

Submit (Server Action in app/(shopper)/setup/actions.ts):
1. Upload banner (if any) to Supabase Storage bucket 'store-banners' under path '<owner_id>/<uuid>.jpg'. Compress to <2MB using browser-image-compression on the client BEFORE submit.
2. Insert into stores table with location = ST_MakePoint(lng, lat)::geography. Use a raw RPC if needed, or store via supabase.from('stores').insert with the geography as 'POINT(lng lat)'.
3. Redirect to /dashboard.

Theme: shopper-primary (purple).
```

---

## Prompt 10 — Shopper dashboard

```
Build app/(shopper)/dashboard/page.tsx + app/(shopper)/layout.tsx.

Layout:
- Shared shopper layout adds a bottom nav: Dashboard | Inventory | Reviews | Settings
- Active tab uses shopper-primary color. Use Next.js usePathname() to determine active.
- All shopper pages have pb-20 to clear the nav.

Dashboard content:
- Greeting at top: "Hi, <store name>" + city subtitle
- 2×2 stat grid (use stat card pattern from DESIGN_SYSTEM.md):
  - Profile views (count from store_views table where viewed_at >= today, in IST)
  - Items in catalogue (count of products for this store)
  - Avg rating (avg of reviews; show "—" if no reviews yet)
  - Wishlistings (count from wishlists where store_id = this store)
- "Recent inventory" section header with "Add +" link → /inventory/new
- List of latest 5 products: thumbnail (use photo_urls[0]), name, sizes summary, colors as small swatches, price.

Fetch all stats server-side in one query if possible (use multiple supabase.from().select with .count for the counts; combine results). Show skeleton on initial load.

Reference: stitch-reference/threadly_dashboard_merchant_1/ and _2/.
```

---

## Prompt 11 — Add inventory

```
Build app/(shopper)/inventory/new/page.tsx.

Form fields:
- Up to 4 product photos (image picker; show 4 upload slots; compress + upload to bucket 'product-photos' under '<owner_id>/<uuid>-<index>.jpg')
- Product name
- Price (₹)
- Category (select: Kurta, Jeans, Sherwani, Shirt, T-shirt, Saree, Lehenga, Suit, Jacket, Other) — matches the product_category enum
- Sizes — toggle chips: XS, S, M, L, XL, XXL, Free
- Colors in stock — color swatch picker. Start with 6 preset hex colors; add a "+" button that opens an <input type="color"> in a dialog to add a custom one. Selected colors render as small filled circles.

Submit (Server Action):
1. Compress & upload all photos. Collect URLs.
2. Insert into products with the store_id of the current shopper's store.
3. Toast success. Redirect to /inventory.

Also build app/(shopper)/inventory/page.tsx — full list of all products for this store, with delete and edit buttons. Edit can route to /inventory/[id]/edit for now (build that page only if you have time; otherwise stub it with a "coming soon" toast).

Reference: design summary section "Add Inventory".
```

---

## Prompt 12 — Reviews + Settings stubs

```
Build app/(shopper)/reviews/page.tsx:
- Server-fetch all reviews for the current shopper's store, joined with reviewer's full_name from profiles
- Show: reviewer name, star rating (1–5), comment, date (date-fns formatDistanceToNow)
- Empty state if no reviews yet

Build app/(shopper)/settings/page.tsx (extend the stub from prompt 8):
- Show store info (name, address, hours, phone, categories)
- "Edit store" button → routes to /setup?edit=1 (we may not implement edit yet — for now, just disable the button with a "coming soon" tooltip)
- Logout button (already in place from prompt 8)

Both use shopper purple theme.
```

---

## Prompt 13 — Shoppee: location permission

```
Build app/(shoppee)/location/page.tsx (note: not under route group because user just signed up and we haven't set their location yet — actually keep it under /location at top level, NOT in (shoppee), then redirect to /home after).

Actually: create app/location/page.tsx and update prompt 6's signup redirect to point here for shoppees.

Spec:
- Large MapPin icon, teal
- Heading: "Find stores near you"
- Body: "We only use your location to show nearby stores. We never share it."
- Primary CTA: "Allow location" — calls navigator.geolocation.getCurrentPosition.
- Secondary link: "Enter manually" → shows an input for city name (default suggestions: Patiala, Chandigarh, Ludhiana, Amritsar).
- On success, store lat/lng (and optionally city) in localStorage AND in a 'shoppee_location' cookie for SSR pages. Then redirect to /home.

Theme: shoppee-primary (teal).
```

---

## Prompt 14 — Shoppee home feed

```
Build app/(shoppee)/home/page.tsx + app/(shoppee)/layout.tsx.

Layout:
- Shoppee bottom nav: Home | Explore | Wishlist | Profile (teal active)
- pb-20 on all shoppee pages.

Home content:
- Greeting + city subtitle (read from cookie set in prompt 13)
- Search bar: "Search stores, styles…" — for v1, just route to /explore?q=<query> on submit
- Category filter pills: All / Ethnic / Casual / Formal / Kids (selecting one refetches)
- "Nearby stores" section. Server-side call to nearby_stores RPC with lat/lng from cookie, radius 5000m, optional category filter.
- Each store card:
  - Banner image (banner_url or placeholder)
  - Store name (text-h3)
  - Distance: "{(distance_m/1000).toFixed(1)} km" using date-fns-style display
  - Avg rating with a Star icon
  - Open/Closed badge based on is_open_now
- Card click → /store/<id>

If geolocation cookie is missing, redirect to /location.

Reference: stitch-reference/threadly_home_customer_1/ and _2/.
```

---

## Prompt 15 — Store catalogue page

```
Build app/(shoppee)/store/[id]/page.tsx.

Spec:
- Banner image at the top (full bleed within 480px container)
- Below: store name (h1), address with MapPin icon, hours, contact phone (clickable tel:)
- "Call store" + "Get directions" (opens OSM/Google Maps via geo: URI on mobile or maps URL on desktop)
- Section "Catalogue" with products grid (2 columns, gap-3)
- Each product card: photo, name, price. Click → /product/<id>

Side effect: on page load (server-side), insert a row into store_views (store_id = params.id, viewer_id = current user id or null). Use 'use server' wrapper or call from a Server Component fetch — just don't block render on it.

Empty state if no products: "This store hasn't added any items yet."
```

---

## Prompt 16 — Product detail page

```
Build app/(shoppee)/product/[id]/page.tsx.

Spec:
- Photo carousel at top (simple horizontal scroll-snap with dot indicator)
- Product name (h1), price (h2)
- Category badge
- "Available sizes" — render size chips as static (non-interactive — these are for display, not selection)
- "Colours" — render color swatch row
- Card with store info at bottom (name, address, distance if available)
- Primary CTA "Visit store" → /store/<store_id>

Server-fetch the product + its store in one query.
```

---

## Prompt 17 — Wishlist

```
1. Add a heart button on each store card (home feed AND store detail page).
   - Filled teal heart if wishlisted, outline if not.
   - On click (client component), call a Server Action that toggles a row in wishlists.
   - Optimistic update.

2. Build app/(shoppee)/wishlist/page.tsx:
   - List of wishlisted stores (same card style as home feed)
   - Empty state with CTA "Discover stores" → /home

3. Build app/(shoppee)/explore/page.tsx as a search results page (for v1, keep simple):
   - Reuses the home feed search bar at top
   - Filters stores by name OR by product name (use ilike queries)
   - Same store card UI
```

---

## Prompt 18 — Loading + error states

```
For every page in /(shoppee) and /(shopper):
1. Add a loading.tsx that shows skeleton cards matching the page layout.
2. Add an error.tsx that catches render errors and shows a "Something went wrong" message + a retry button.

Create shared skeleton components in components/shared/skeletons/ (StoreCardSkeleton, ProductCardSkeleton, StatCardSkeleton).
```

---

## Prompt 19 — Empty states

```
Audit every list-rendering page. Where the list is empty, replace the empty render with a friendly state:
- Icon (lucide, themed)
- Headline ("No stores yet" / "Your wishlist is empty" / "No reviews yet")
- One-sentence body
- A CTA button where it makes sense

Affected pages: home feed (no stores within radius), wishlist, explore (no results), shopper dashboard inventory section (no products), reviews.
```

---

## Prompt 20 — PWA + meta

```
1. Add app/manifest.ts that exports a Next.js Manifest object with:
   - name: "Locally"
   - short_name: "Locally"
   - theme_color: "#0F6E56" (teal — most users are shoppees)
   - background_color: "#FFFFFF"
   - display: "standalone"
   - icons (use placeholder 192/512 png — I'll replace with real ones later)

2. Add favicon.ico to /app/ (placeholder is fine).

3. Add app/opengraph-image.tsx — a generated OG image with "Locally — clothing stores near you".

4. Set the <html lang="en"> and proper metadata in app/layout.tsx (title template, description).

5. Add a viewport export with width=device-width, initial-scale=1, viewport-fit=cover.
```

---

## After all prompts: deployment checklist

```
Before deploying to Vercel, do this manually:

1. Run pnpm build locally. Fix any type errors.
2. Test signup flow end-to-end for both roles on a fresh Supabase project.
3. Push to GitHub.
4. On Vercel: import the repo, add env vars (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY).
5. Deploy. Test the live URL on your phone.
6. Add the production URL to Supabase Auth → URL Configuration → Site URL.
```
