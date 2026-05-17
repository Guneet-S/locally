# Locally — Build Order

**Follow this order strictly.** Each phase depends on the previous one. Don't skip ahead. Each step ends with you verifying it works before moving on.

---

## Phase 0 — Manual setup (you do this once, not Claude Code)

These steps are NOT for Claude Code. Do them yourself before opening the editor.

1. **Create a Supabase project** at https://supabase.com (free tier)
2. **Run `SCHEMA.sql`** in the Supabase SQL Editor. Verify no errors.
3. **Copy your Supabase URL + anon key** from Project Settings → API.
4. **Install Node.js 20+** if you don't have it.
5. **Install pnpm**: `npm install -g pnpm` (faster than npm)
6. **Create a Vercel account** at https://vercel.com (sign in with GitHub).
7. **Create a GitHub repo** named `locally` (private).

---

## Phase 1 — Project scaffolding (Claude Code prompts 1–3)

| # | Prompt | What you verify before moving on |
|---|---|---|
| 1 | Initialize Next.js + Tailwind + shadcn + Supabase client | `pnpm dev` runs, blank home page loads |
| 2 | Set up the Tailwind config from `DESIGN_SYSTEM.md` and the global layout (font, 480px container) | Tailwind tokens work (`bg-shopper-primary` shows purple) |
| 3 | Set up Supabase clients, middleware, and types generation | You can log auth state in a test page |

---

## Phase 2 — Shared screens (prompts 4–5)

| # | Prompt | Verify |
|---|---|---|
| 4 | Role selection screen (`/role`) | Picking a role routes to onboarding with `?role=` param |
| 5 | Onboarding carousels — both roles, 3 slides each | Swipe + dot indicator works; "Get started" routes to login |

---

## Phase 3 — Auth (prompts 6–8)

| # | Prompt | Verify |
|---|---|---|
| 6 | Login + Signup pages (themed by `?role` param) | Sign up creates a user in Supabase Auth AND a row in `profiles` with correct role |
| 7 | Auth middleware + protected route groups | Visiting `/dashboard` while logged out redirects to login |
| 8 | Logout + profile basic | Logout clears session; profile shows current user |

---

## Phase 4 — Shopper flow (prompts 9–12)

| # | Prompt | Verify |
|---|---|---|
| 9 | "List your shop" first-time setup form | New shopper sees this after login if no store exists; saves to `stores` table with PostGIS location |
| 10 | Shopper dashboard (stats + inventory list) | Stats compute correctly; empty state if no products |
| 11 | Add inventory form | Photos upload to Supabase Storage; product saves; appears in dashboard list |
| 12 | Shopper bottom nav + Reviews + Settings stubs | All 4 tabs render; Reviews shows real review rows |

---

## Phase 5 — Shoppee flow (prompts 13–17)

| # | Prompt | Verify |
|---|---|---|
| 13 | Location permission screen + manual city entry fallback | Gets browser geolocation OR accepts manual city |
| 14 | Home feed — nearby stores via `nearby_stores` RPC | Distance shows correctly; open/closed badge works |
| 15 | Store catalogue page (`/store/[id]`) | Products grid; click logs a `store_views` row |
| 16 | Product detail page (`/product/[id]`) | Sizes/colors render; "Visit store" CTA → store info |
| 17 | Wishlist (add/remove + list view) | Heart icon toggles; wishlist tab shows saved stores |

---

## Phase 6 — Polish (prompts 18–20)

| # | Prompt | Verify |
|---|---|---|
| 18 | Loading + error states across all pages | No screen ever shows a blank flash |
| 19 | Empty states (no stores nearby, no inventory, etc.) | Friendly messages with next-step CTAs |
| 20 | Mobile PWA manifest + favicon + open graph | Add to home screen works on mobile |

---

## Phase 7 — Deploy

1. Push to GitHub.
2. Import project on Vercel.
3. Add env vars on Vercel: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (server-only).
4. Deploy. Test the live URL end-to-end.

---

## Rules for working with Claude Code

- **One prompt = one phase step.** Don't paste two prompts at once.
- **Review every file diff before accepting.** Catch hallucinated imports early.
- **If a step breaks, debug before moving on.** Compounding errors are how 80% of solo projects die.
- **Re-read `CLAUDE.md` and `DESIGN_SYSTEM.md` if Claude Code seems to drift** — sometimes you need to remind it: "follow the rules in CLAUDE.md".
- **Commit after every working step.** `git commit -m "step N: <thing>"`.

---

## Realistic timeline

If you work 3–4 hours a day and review each step carefully:
- Phase 1–3: 2 days (setup, role select, auth)
- Phase 4: 2–3 days (shopper)
- Phase 5: 3–4 days (shoppee, with maps)
- Phase 6–7: 1–2 days

**Total: ~10 days to a working v1**, assuming no major detours. If you've never used Next.js or Supabase before, double it.
