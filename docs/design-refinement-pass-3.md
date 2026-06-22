# Design Refinement Pass 3 — Floating Dock & Profile Workspace

Pass 3 transforms the homepage top from a website header into a personal workspace. Everything below the profile block is unchanged.

## Dock Architecture

**Component:** `src/components/public/floating-dock.tsx`

The floating dock replaces desktop top navigation. It is rendered from `PublicLayout` so it appears on all public routes, not only the homepage.

| Property | Value |
|----------|-------|
| Position | `fixed`, left 1rem, vertically centered |
| Width | 64px |
| Visibility | `hidden md:flex` — desktop only |
| Surface | Dark background, 14px radius, subtle border and shadow |

**Structure:**

1. Primary nav: Home, Projects, Research, Automations, Experience, Writing
2. Divider
3. Utilities: GitHub (if configured), Resume (if active resume exists)

Icons use Lucide. Active route detection uses `usePathname()` with prefix matching for nested routes.

**Tooltips:** CSS-only labels appear to the right on hover/focus — no animation libraries, no floating motion.

**Resume availability:** `PublicLayout` calls `getActiveResume()` and passes `resumeAvailable` to the dock so the Resume icon only appears when a file exists.

## Profile Layout Decisions

**Component:** `src/components/public/profile-workspace.tsx`

Replaces the old `KbSection` profile block in `home-page-content.tsx` only.

```
[Avatar] [Status pill]
Name (36px / 700)
Role (18px / 500)
Experience summary (muted meta line)
Bio (max ~38ch line length)
Actions (max 2)

                    [Live time]  ← top-right
                    [Location]
```

- **Left-aligned**, not centered — reads as a workspace identity card, not a hero.
- **Compact spacing** — consistent with Pass 1/2 knowledge-base density.
- **No decorative typography** — Geist only, no pixel fonts or gradients.
- **Fade-in only** — `workspace-fade-in` 0.4s opacity; no parallax or floating effects.

## Navigation Reasoning

| Surface | Behavior |
|---------|----------|
| Desktop | Floating dock — Arc/Linear-style persistent nav |
| Mobile | Unchanged drawer menu via `SiteHeader` (`md:hidden`) |

Desktop top-bar nav was removed from `SiteHeader`. Mobile keeps brand + Menu drawer with full `NAV_ITEMS` including Contact and Resume.

Main content receives `dock-main` padding on `md+` so text never sits under the dock.

## Time/Location Implementation

**Component:** `src/components/public/live-clock.tsx`

- Client component updates every 30 seconds via `Intl.DateTimeFormat`.
- Default timezone: `Asia/Kolkata` (IST).
- Location from `contact_info.location` in CMS; fallback `Pune, India`.
- Positioned absolute top-right inside `.workspace-profile`.

## Identity Improvements

### Settings extensions (`src/lib/public/settings.ts`)

New optional `site_settings` fields (no DB migration — JSONB):

| Field | Purpose |
|-------|---------|
| `owner_avatar` | Avatar URL |
| `status_bubble` | Status pill text |
| `experience_summary` | One-line experience meta |
| `bio_secondary` | Second bio paragraph |

### Avatar

- Circular, 96px (`workspace-avatar`).
- CMS URL via Next.js `Image` when set.
- Fallback: initials on muted circle — no gradients or glow.

### Status bubble

- Muted pill beside avatar.
- CMS `status_bubble`; fallback: "Building production AI systems".

### Bio

- Primary: `site_description`
- Secondary: `bio_secondary`
- `max-width: 38ch` for comfortable reading length.

### Actions

Maximum two buttons: Resume + Email (Email preferred over GitHub when both exist). Small bordered pills — not marketing CTAs.

## Files Created

- `src/components/public/floating-dock.tsx`
- `src/components/public/profile-workspace.tsx`
- `src/components/public/live-clock.tsx`
- `docs/design-refinement-pass-3.md`

## Files Modified

- `src/lib/public/settings.ts`
- `src/components/public/public-layout.tsx`
- `src/components/public/site-header.tsx`
- `src/components/public/home-page-content.tsx`
- `src/app/globals.css`
- `supabase/seeds/seed.sql`
- `scripts/seed-remote.mjs`

## Unchanged (by design)

- Projects, Research, Automations, Experience, Writing, Contact sections
- CMS / database schema / content renderer / routes
- Mobile drawer navigation
