# Design Refinement Pass 3.1 — Reference-Accurate Profile Workspace

Pass 3.1 closes the polish gap between Pass 3 structure and the reference screenshot. Scope is limited to the floating dock and homepage profile workspace.

## Layout Adjustments

**Container hierarchy:**

```
workspace-profile (section padding)
  └── workspace-profile-layout (720px max, centered, relative)
        ├── workspace-clock (absolute top-right on desktop)
        └── workspace-identity (680px max content width)
```

- Profile content capped at **680px** for balanced composition between dock and time block.
- Outer layout at **720px** gives the clock room without compressing bio text.
- Vertical rhythm tightened: avatar row → name → role → summary → bio → actions with 5–18px gaps (no hero spacing).

## Width Decisions

| Element | Max width | Rationale |
|---------|-----------|-----------|
| Identity block | 680px | Spec target; ~60–70 char line length |
| Bio paragraphs | 42ch | Comfortable reading measure |
| Layout shell | 720px | Aligns with `.max-w-home`; hosts clock offset |

Desktop main padding increased to `calc(64px + 3rem)` so content sits naturally between dock and viewport edge.

## Status Rotation Logic

**Component:** `rotating-status.tsx`

- Pool: six default AI-engineer statuses + optional CMS `status_bubble` prepended if unique.
- Interval: random **60–120 seconds** between rotations.
- Transition: 280ms opacity fade out → swap message → fade in.
- No typing, marquee, or motion beyond opacity.

## Avatar Hover Logic

**Component:** `profile-avatar.tsx`  
**Utils:** `getAvatarHoverMessage()` in `workspace-utils.ts`

Evaluated in **IST** (`Asia/Kolkata`):

| Condition | Message |
|-----------|---------|
| Saturday / Sunday | Enjoying the weekend |
| 22:00–05:59 | Probably sleeping |
| 06:00–11:59 | Probably working |
| 09:00–17:59 (weekday) | Building something |
| 18:00–21:59 | Still shipping |

Tooltip appears on hover/focus only; refreshes every 60s while hovered. Fallback avatar uses a neutral User icon (no initials).

## Name Animation Implementation

**Component:** `encrypted-name.tsx`

- Cycles every **15–25 seconds** (randomized).
- Sequence: plain → stage 1 → stage 2 → plain (800ms per step).
- For "Dhruvil Patel": `D#ruv!l P@tel` → `X7r$v!l P#t3l` → restore.
- Generic names use character-substitution maps.
- `minWidth` locked via `useLayoutEffect` to prevent layout shift.
- Subtle color shift during encrypted stages; no glitch or flash effects.

## Time Formatting Approach

**Component:** `live-clock.tsx`  
**Format:** `HH:MM:SS AM IST` (e.g. `01:04:19 AM IST`)

- Updates every **1 second** via `setInterval`.
- `formatISTClock()` uses `Intl.DateTimeFormat` with `formatToParts` for zero-padded segments.
- Hydration-safe: renders non-breaking space until client mount; `suppressHydrationWarning` on time line.
- Time line: primary weight; location line: smaller, more muted.

## Typography Refinements

| Element | Size | Weight | Notes |
|---------|------|--------|-------|
| Name | 2rem (32px) | 700 | Reduced from 2.25rem |
| Role | 1rem | 500 | More muted |
| Summary | 0.875rem | 500 | Medium emphasis |
| Bio | 0.9375rem | 400 | line-height 1.8 |
| Clock | 0.8125rem / 0.75rem | 500 / 400 | Tabular nums on time |

## Button Refinements

- **Resume:** filled (`workspace-action-btn-filled`) — light-on-dark, compact padding.
- **Copy Email:** outline (`workspace-action-btn-outline`) — clipboard copy with "Copied" feedback; falls back to `mailto:` on failure.

## Dock Improvements

- Backdrop blur, softer border, layered shadow.
- Active item: inset primary ring (`dock-item-active`).
- Hover: scale 1.05 with 200ms transitions.
- Slightly increased left offset and inner padding.

## Files Created

- `src/lib/public/workspace-utils.ts`
- `src/components/public/profile-avatar.tsx`
- `src/components/public/rotating-status.tsx`
- `src/components/public/encrypted-name.tsx`
- `src/components/public/copy-email-button.tsx`
- `docs/design-refinement-pass-3.1.md`

## Files Modified

- `src/components/public/profile-workspace.tsx`
- `src/components/public/live-clock.tsx`
- `src/components/public/floating-dock.tsx`
- `src/app/globals.css`

## Unchanged

CMS, database, admin, content pages, routes, and all homepage sections below the profile block.
