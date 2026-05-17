# Locally — Design System

Source of truth for colors, typography, spacing, and component patterns. Ported from the Stitch design docs.

---

## 1. Color tokens

Add these to `tailwind.config.ts` under `theme.extend.colors`:

```ts
colors: {
  // Shopper (merchant) theme — purple
  shopper: {
    primary: "#534AB7",
    light:   "#EEEDFE",
    dark:    "#3C3489",
  },
  // Shoppee (customer) theme — teal
  shoppee: {
    primary: "#0F6E56",
    light:   "#E1F5EE",
    dark:    "#085041",
  },
  // Neutrals
  surface: {
    DEFAULT:  "#FFFFFF",
    muted:    "#F6F2FC",
    dim:      "#DCD8E2",
  },
  border: {
    subtle:   "#E2E8F0",
  },
  text: {
    primary:   "#1C1B22",
    secondary: "#474553",
    tertiary:  "#64748B",
  },
  // Semantic
  success: "#0F6E56",    // reuse teal for "Open" badge
  danger:  "#BA1A1A",    // "Closed", errors
  warning: "#8A4900",
}
```

### Usage rules
- **Shopper screens** → use `shopper-*` tokens only.
- **Shoppee screens** → use `shoppee-*` tokens only.
- **Auth screens (login/signup)** → use the theme matching the chosen role (passed via URL param `?role=shoppee|shopper`).
- **Role selection screen** → neutral (no themed CTA until a card is picked, then CTA flips to that role's color).

---

## 2. Typography

**Font:** Inter (load via `next/font/google`).

| Token | Size | Weight | Line height | Use case |
|---|---|---|---|---|
| `text-h1` | 22px | 500 | 28px | Page titles |
| `text-h1-mobile` | 20px | 500 | 26px | Page titles on small screens |
| `text-h2` | 18px | 500 | 24px | Section titles |
| `text-h3` | 16px | 500 | 20px | Card titles |
| `text-body` | 16px | 400 | 1.7 | Paragraph text |
| `text-button` | 12px | 500 | 16px | Button labels |
| `text-meta` | 11px | 400 | 14px | Labels, metadata, helper text |

Add to Tailwind config:

```ts
fontSize: {
  "h1":        ["22px", { lineHeight: "28px", fontWeight: "500" }],
  "h1-mobile": ["20px", { lineHeight: "26px", fontWeight: "500" }],
  "h2":        ["18px", { lineHeight: "24px", fontWeight: "500" }],
  "h3":        ["16px", { lineHeight: "20px", fontWeight: "500" }],
  "body":      ["16px", { lineHeight: "1.7",  fontWeight: "400" }],
  "button":    ["12px", { lineHeight: "16px", fontWeight: "500" }],
  "meta":      ["11px", { lineHeight: "14px", fontWeight: "400", letterSpacing: "0.02em" }],
}
```

---

## 3. Spacing & layout

- **Side margin:** 16px (`px-4`)
- **Section spacing:** 24px (`space-y-6` / `gap-6`)
- **Group spacing:** 16px (`space-y-4`)
- **Inner spacing:** 8px (`gap-2`)
- **Max content width:** 480px (`max-w-[480px] mx-auto`) — every page uses this
- **Bottom nav reserves 64px** at the bottom — pages need `pb-20` to avoid overlap

---

## 4. Border radius

| Token | Value | Use case |
|---|---|---|
| `rounded-sm` | 4px | small inline pills |
| `rounded` | 8px | small cards |
| `rounded-[9px]` | 9px | input fields |
| `rounded-[10px]` | 10px | buttons, primary cards |
| `rounded-xl` | 16px | image containers, large cards |
| `rounded-full` | 9999px | badges, avatars, category chips |

---

## 5. Component recipes

These are the patterns. Use them via shadcn/ui primitives whenever possible.

### Primary Button
```tsx
<button className="w-full rounded-[10px] bg-shoppee-primary py-3 text-button text-white">
  Sign in
</button>
```
Swap `shoppee-primary` for `shopper-primary` on merchant screens.

### Input field
```tsx
<input
  className="w-full rounded-[9px] border-[0.5px] border-border-subtle bg-surface-muted px-3 py-2.5 text-meta placeholder:text-text-tertiary"
  placeholder="Email"
/>
```

### Standard card
```tsx
<div className="rounded-[10px] border-[0.5px] border-border-subtle bg-surface p-4">
  ...
</div>
```

### Stat card (dashboard)
```tsx
<div className="rounded-[10px] bg-shopper-light p-4">
  <p className="text-meta text-text-tertiary">Profile views</p>
  <p className="mt-1 text-h1 text-shopper-dark">128</p>
</div>
```
No border. Background is the role's light tone.

### Badge — Open / Closed
```tsx
<span className="rounded-full bg-shoppee-light px-2 py-0.5 text-meta text-shoppee-dark">Open</span>
<span className="rounded-full bg-red-50 px-2 py-0.5 text-meta text-danger">Closed</span>
```

### Category pill (selectable)
```tsx
<button
  data-selected={selected}
  className="rounded-full border-[0.5px] border-border-subtle px-3 py-1 text-meta data-[selected=true]:bg-shoppee-primary data-[selected=true]:text-white data-[selected=true]:border-shoppee-primary"
>
  Ethnic
</button>
```

### Bottom navigation
4 items, fixed to bottom, full-width within the 480px container.
- Inactive icon: `text-text-tertiary`
- Active icon + label: role-primary color
- Use `lucide-react` icons (thin stroke matches the design language)

```tsx
<nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] border-t border-border-subtle bg-surface">
  {/* 4 NavLinks here */}
</nav>
```

### Toggle chip (sizes)
Same as category pill but used in forms — `XS / S / M / L / XL / XXL / Free size`.

---

## 6. Icons

Use `lucide-react`. Common mappings from the Stitch design:

| Stitch icon | lucide-react |
|---|---|
| `ti-building-store` | `Store` |
| `ti-shirt` | `Shirt` |
| `ti-map-pin` | `MapPin` |
| `ti-chart-bar` | `BarChart3` |
| `ti-heart` | `Heart` |
| `ti-search` | `Search` |
| `ti-user` | `User` |
| `ti-settings` | `Settings` |

Default size: 20px. Stroke width: 1.5 (thin to match the design).

```tsx
<MapPin size={20} strokeWidth={1.5} />
```

---

## 7. Don'ts

- ❌ No drop shadows. Use borders and tonal layers instead.
- ❌ No gradients except where explicitly designed.
- ❌ No emoji in production UI.
- ❌ No raw hex codes in components — always use the token.
- ❌ Never mix shopper-purple and shoppee-teal on the same screen.
