# Locally — Starter Pack

A complete blueprint for building **Locally** (a hyperlocal clothing-store directory) using Claude Code, Next.js, and Supabase. All free.

---

## What's in this pack

| File | What it is |
|---|---|
| `CLAUDE.md` | **The skill file.** Claude Code reads this automatically on every prompt. Don't delete it. |
| `DESIGN_SYSTEM.md` | All design tokens (colors, typography, components) ported from the Stitch design. |
| `SCHEMA.sql` | The complete Supabase database schema. Run this once in the Supabase SQL editor. |
| `BUILD_ORDER.md` | The sequence to build in. Don't skip phases. |
| `PROMPTS.md` | Copy-paste prompts for Claude Code, one per build step. |

---

## How to use this pack — step by step

### 1. Set up the empty project folder

```bash
mkdir locally && cd locally
```

Copy all 5 files from this pack into the `locally/` folder. Also copy your Stitch reference HTML folder into `locally/stitch-reference/` so Claude Code can read it.

### 2. Set up Supabase (10 minutes)

1. Go to https://supabase.com → create a free project.
2. Open the SQL editor → paste the entire contents of `SCHEMA.sql` → run.
3. Copy your Project URL and `anon` key from Project Settings → API. You'll need them later.

### 3. Open Claude Code in the folder

```bash
cd locally
claude
```

Claude Code will auto-detect `CLAUDE.md` and use it as the project context.

### 4. Run prompts in order

Open `PROMPTS.md`. Paste prompt #1. Wait. Verify it works. Commit. Paste prompt #2. Repeat.

**Do NOT batch-paste prompts. One at a time, with verification in between.** This is the only way to keep AI-generated code under control.

### 5. After each milestone — commit

```bash
git add . && git commit -m "step N: <thing>"
```

---

## Why these choices (for the curious)

**Why Supabase, not Firebase?** Real Postgres (not NoSQL), free tier is more generous in practice, PostGIS gives us geo queries for free, RLS is cleaner than Firestore rules.

**Why Next.js, not plain React?** Server components + Server Actions = no separate backend. One-command Vercel deploy. Claude Code generates Next.js code very well.

**Why no Google login / OTP?** Both cost money or add complexity. Email + password is free, familiar, and ships fast. Add OAuth/OTP only when you have users asking for it.

**Why a `CLAUDE.md` instead of a custom agent?** You're building one app once. An agent adds autonomy you don't need. A skill file (CLAUDE.md) gives Claude Code persistent rules without taking over the wheel. You stay in control.

**Why screen-by-screen instead of "build the whole app"?** AI-generated codebases collapse under their own weight when generated all at once. Going one screen at a time keeps you in the loop and the code small enough to review.

---

## When something breaks

- **"Claude Code is ignoring my rules"** → Remind it: `"Re-read CLAUDE.md and DESIGN_SYSTEM.md, then redo this."`
- **"It installed a package I didn't approve"** → Roll back, then add to `CLAUDE.md` hard rules: "do not install X."
- **"Types are broken after a schema change"** → Re-run `pnpm dlx supabase gen types ...` to regenerate `types/database.ts`.
- **"Auth redirects loop"** → 99% of the time it's the middleware. Add console.logs to `middleware.ts` and check what role/path it's seeing.

---

## What's NOT in v1 (deferred on purpose)

These were considered and intentionally cut. Add them later when you have users.

- Google / phone OAuth
- SMS OTP
- Push notifications
- In-app chat between shoppers and shoppees
- Multi-store per shopper
- Native mobile app (Expo/React Native)
- Product search beyond store name
- Promoted listings / monetization

Keep v1 small. Ship. Then expand.
