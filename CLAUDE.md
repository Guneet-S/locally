# Locally — Claude Code Project Rules

This file is read automatically by Claude Code on every prompt. It is the single source of truth for the stack, conventions, and constraints of this project. **Do not deviate without explicit instruction.**

---

## 1. What we are building

**Locally** — a hyperlocal web app that connects local clothing stores to nearby customers. Think "Zomato for clothing stores," but with no delivery. Customers browse catalogues online and visit stores in person.

Two roles:
- **Shopper** = merchant / store owner. Lists their shop and manages inventory.
- **Shoppee** = customer. Discovers nearby shops, browses catalogues, walks in to buy.

Mobile-first responsive web app. Max content width 480px on desktop (it should feel like a phone app even on a laptop).

---

## 2. Stack — locked, do not change

| Layer | Choice |
|---|---|
| Framework | **Next.js 14+ App Router**, **TypeScript strict mode** |
| Styling | **Tailwind CSS** with custom tokens from `DESIGN_SYSTEM.md` |
| UI primitives | **shadcn/ui** (install components as needed via `npx shadcn@latest add <component>`) |
| Forms | **react-hook-form** + **zod** |
| Auth | **Supabase Auth** — email + password only (no OAuth, no OTP, no magic-link for v1) |
| Database | **Supabase Postgres** with **PostGIS** extension for geo queries |
| Storage | **Supabase Storage** for store banners and product photos |
| Maps | **Leaflet** + **OpenStreetMap** tiles (no Google Maps, no API key) |
| Icons | **lucide-react** |
| State | React Server Components by default; `useState`/`useReducer` for local UI state. **No Redux, no Zustand for v1.** |
| Deployment | **Vercel** free tier |

**Why these:** all free, all production-grade, all stay free until real scale. Read `DESIGN_SYSTEM.md` and `SCHEMA.sql` before generating any code.

---

## 3. Folder structure — follow exactly

```
locally/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Public auth pages
│   │   ├── login/page.tsx
│   │   ├── signup/page.tsx
│   │   └── role/page.tsx         # Role selection
│   ├── (shoppee)/                # Customer-side routes (teal theme)
│   │   ├── home/page.tsx
│   │   ├── explore/page.tsx
│   │   ├── wishlist/page.tsx
│   │   ├── profile/page.tsx
│   │   ├── store/[id]/page.tsx
│   │   ├── product/[id]/page.tsx
│   │   └── layout.tsx            # Shoppee bottom nav
│   ├── (shopper)/                # Merchant-side routes (purple theme)
│   │   ├── dashboard/page.tsx
│   │   ├── inventory/page.tsx
│   │   ├── inventory/new/page.tsx
│   │   ├── reviews/page.tsx
│   │   ├── settings/page.tsx
│   │   ├── setup/page.tsx        # First-time "List your shop"
│   │   └── layout.tsx            # Shopper bottom nav
│   ├── onboarding/
│   │   ├── shoppee/page.tsx
│   │   └── shopper/page.tsx
│   ├── api/                      # Route handlers (server-side mutations only)
│   ├── globals.css
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Landing / redirect logic
│
├── components/
│   ├── ui/                       # shadcn primitives — auto-generated, don't hand-edit
│   ├── shared/                   # Cross-role components (Button, Card, BottomNav shell)
│   ├── shoppee/                  # Customer-only components (StoreCard, CategoryPill)
│   └── shopper/                  # Merchant-only components (StatCard, InventoryRow)
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts             # Browser client
│   │   ├── server.ts             # Server client (uses cookies)
│   │   └── middleware.ts         # Auth middleware
│   ├── validations/              # Zod schemas, one file per entity
│   └── utils.ts                  # cn() helper etc.
│
├── types/
│   └── database.ts               # Generated from Supabase: `npx supabase gen types ...`
│
├── public/
├── middleware.ts                 # Next.js middleware — protects routes
├── tailwind.config.ts
├── .env.local.example
├── DESIGN_SYSTEM.md              # READ BEFORE STYLING
├── SCHEMA.sql                    # Full database schema — run in Supabase SQL editor
├── BUILD_ORDER.md                # Build sequence — follow strictly
├── PROMPTS.md                    # Copy-paste prompts per screen
└── CLAUDE.md                     # This file
```

---

## 4. Core conventions

### TypeScript
- Strict mode on. No `any` unless commented why.
- Database types come from `types/database.ts` (Supabase-generated). Never hand-write table types.
- Use `import type` for type-only imports.

### Server vs Client components
- **Default to Server Components.** Only add `"use client"` when you need state, effects, or browser APIs.
- Data fetching: do it in Server Components or Server Actions, not in `useEffect`.
- Mutations: prefer Server Actions over API routes for forms.

### Styling rules
- Use Tailwind utility classes. No inline `style={}` except for dynamic values (e.g., a color from the DB).
- Use design tokens from `DESIGN_SYSTEM.md`, not raw hex values. e.g., `bg-shoppee-primary`, not `bg-[#0F6E56]`.
- Mobile-first. Always wrap the page in `<main className="mx-auto max-w-[480px] min-h-screen">`.
- Buttons: full-width by default on mobile, 10px radius (`rounded-[10px]`), 12px font, weight 500.
- Inputs: 9px radius (`rounded-[9px]`), 0.5px border.

### Role theming
- The app has two themes (purple = Shopper, teal = Shoppee). **Never mix them on the same screen.**
- Use the route group (`(shoppee)` / `(shopper)`) to scope theming via layout files. Don't pass theme as a prop everywhere.

### Auth & access control
- Use Supabase middleware (`middleware.ts`) to protect role-specific routes.
- A user has ONE role, stored in `profiles.role`. Set it during signup, never let it change.
- Never trust client-side role checks for security — always verify server-side.

### Forms
- Every form uses `react-hook-form` + a zod schema from `lib/validations/`.
- Submit handler is a Server Action (`"use server"` function) where possible.
- Show field errors inline. Show submit errors via shadcn `<Toast>`.

### Database access
- **Never call Supabase from a Client Component with secrets.** Use the server client.
- Row Level Security (RLS) is enabled on every table (see `SCHEMA.sql`). Don't disable it.
- Geo queries (nearby stores) use PostGIS. There's a helper function `nearby_stores(lat, lng, radius_m)` defined in `SCHEMA.sql`.

### Images
- All image uploads go to Supabase Storage buckets defined in `SCHEMA.sql`.
- Always validate: max 2MB, only `image/jpeg` and `image/png`.
- Compress client-side before upload using `browser-image-compression`.

---

## 5. Hard rules — never violate

1. **No Firebase.** Anywhere. The user explicitly chose Supabase.
2. **No Expo, no React Native.** This is a web app.
3. **No Google Maps API.** Leaflet + OSM only.
4. **No paid SMS, no OTP for v1.** Email/password only.
5. **No `any` types without an explanatory comment.**
6. **No raw SQL strings in app code** — use Supabase client query builder or RPC functions from `SCHEMA.sql`.
7. **Never commit `.env.local`.** Always update `.env.local.example` when adding a new env var.
8. **Don't install new dependencies without asking.** If you think we need one, propose it first.
9. **Don't refactor unrelated code** when working on a feature. Stay focused on the prompt.
10. **Don't write tests in v1** unless explicitly asked. Ship first, test later.

---

## 6. When asked to build a screen

1. **Read `DESIGN_SYSTEM.md` first** for the relevant colors/components.
2. **Check `BUILD_ORDER.md`** to confirm prerequisites are done.
3. **Look at the Stitch HTML reference** at the path the user provides — port the markup faithfully but use shadcn/ui primitives and Tailwind tokens instead of raw HTML.
4. **Build the page in this order:**
   - Server-side data fetch (if needed)
   - Layout + static structure
   - Interactive client components (only where needed)
   - Form validation + submission
   - Loading & error states
5. **End with a checklist** of what was built and what's still needed.

---

## 7. Design reference — Stitch MCP

A Stitch MCP server is configured in `.mcp.json` at the project root. Use it to pull design specs directly from the Locally Stitch project.

**Project ID:** `18385702851303483276`

When building any screen:
1. Use the Stitch MCP to read the design for that screen from the project above
2. Port the layout faithfully using shadcn/ui primitives and Tailwind tokens from `DESIGN_SYSTEM.md`
3. Never use raw hex codes — always use the design tokens

---

## 8. When in doubt

Ask. Don't guess on:
- Schema changes
- New dependencies
- Auth flow changes
- Anything that crosses role boundaries (Shopper ↔ Shoppee)

For everything else: follow the patterns already in the codebase. If there's no pattern yet, propose one in a short comment and proceed.
