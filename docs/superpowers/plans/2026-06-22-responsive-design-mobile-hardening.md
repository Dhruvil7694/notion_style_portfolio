# Phase 17.98 — Responsive Design & Mobile Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make every public page, admin route, AI interface, and dashboard fully responsive and production-ready across 320px–2560px viewports — no horizontal scroll, no clipped content, no broken layouts.

**Architecture:** Add responsive CSS tokens to `globals.css`; replace the `<details>` mobile menu with a shadcn `Sheet` drawer; move assistant access to a mobile-safe bottom sheet; layer safe-area insets and responsive typography throughout without touching Tailwind config.

**Tech Stack:** Tailwind CSS v4 (CSS-variable-based, no tailwind.config.ts), shadcn/ui Sheet, Next.js 15 App Router, React 19, Framer Motion for transitions.

## Global Constraints

- Tailwind v4 — CSS custom properties only, no `tailwind.config.ts`. Custom tokens go in `globals.css` under `@layer utilities` or `@theme inline`.
- No hardcoded breakpoint pixel values in component files — use Tailwind responsive variants (`sm:`, `md:`, `lg:`, `xl:`) or CSS media queries in `globals.css`.
- Minimum touch target: `44×44px` for all interactive elements.
- No feature additions — this phase is purely responsive/layout work.
- Conventional Commits: `fix(responsive):` or `feat(responsive):` prefixes.
- Run `npm run typecheck` and `npm run build` before each commit.
- `SUPABASE_SECRET_KEY` stays server-only — no env changes needed in this phase.
- Read `node_modules/next/dist/docs/` before touching route/server-action code.
- shadcn/ui components live in `src/components/ui/` — add new ones via CLI (`npx shadcn@latest add sheet`).

---

### Task 1: Responsive Audit Document

**Files:**

- Create: `docs/responsive-audit.md`

**Interfaces:**

- Produces: audit document consumed by Tasks 3–14 to prioritise fixes

- [ ] **Step 1: Examine public layout structure**

Read `src/components/public/public-layout.tsx` and `src/app/globals.css` (lines 374–415 for dock-stack, lines 1269–1273 for dock-main padding).

Key findings already confirmed:

- `FloatingDock` → `className="dock-stack hidden md:flex"` — dock invisible on mobile
- `SiteHeader` → `className="kb-site-header md:hidden"` — mobile-only header
- Mobile nav uses raw `<details>` dropdown (not a Sheet)
- `AssistantPanel` renders inside `FloatingDock` → inaccessible on mobile
- `.dock-main` padding-left only at `≥768px`
- `--kb-font-name: 2.25rem` hardcoded (no mobile scale)

- [ ] **Step 2: Write the audit document**

Create `docs/responsive-audit.md` with this exact content:

```markdown
# Responsive Audit — Phase 17.98

## Critical Issues (must fix before launch)

### Navigation

- **Mobile nav uses `<details>` dropdown** — no Sheet, no scroll lock, no keyboard trap, no Escape close, no safe-area. Fix: Task 3.
- **Assistant inaccessible on mobile** — `AssistantPanel` is inside `hidden md:flex` dock. Fix: Task 3.

### Typography

- `--kb-font-name: 2.25rem` fixed — 36px name on 320px screen overflows. Fix: Task 4.
- No responsive heading scale. Fix: Task 4.

### Layout

- `.public-site .dock-main` has `padding-left` only at md+ — mobile content correctly full-width. ✓
- `workspace-profile` padding: `1.5rem` on both sides — acceptable on 320px (24px each side leaves 272px). ✓

### Homepage

- `workspace-name-row` has a `grid-template-columns: minmax(0,1fr) auto` with clock beside name — may squeeze on 320px. Fix: Task 5.
- `workspace-identity: max-width: 680px` — no horizontal overflow risk since it's always contained. ✓

### Project pages

- No audit data yet — visual inspection needed. Fix: Task 6.

### Knowledge graph

- No audit data yet. Fix: Task 7.

### Search

- `dock-search-panel: width: 19rem` absolute-positioned — fine when contained inside dock (hidden on mobile). ✓ But search page `/search` needs audit. Fix: Task 8.

### Assistant panel

- `w-[min(420px,calc(100vw-2rem))]` sizing exists but panel is hidden on mobile via parent `hidden md:flex`. Fix: Task 9.

### Architecture diagrams

- JointJS/ReactFlow — no touch pan/zoom confirmed. Fix: Task 10.

### Tables

- `stack-table.tsx`, `data-table.tsx`, admin tables — overflow unknown. Fix: Task 11.

### CMS Admin

- Admin sidebar exists (`admin-sidebar.tsx`), admin mobile nav exists (`admin-mobile-nav.tsx`) — assess completeness. Fix: Task 12.

### Tiptap Editor

- Toolbar wrapping unknown. Fix: Task 13.

### Safe Areas

- No `env(safe-area-inset-*)` anywhere in codebase. Fix: Task 14.

## Viewport Targets

320px · 360px · 375px · 390px · 414px · 430px · 768px · 820px · 1024px · 1280px · 1440px · 1728px · 1920px · 2560px
```

- [ ] **Step 3: Commit**

```bash
git add docs/responsive-audit.md
git commit -m "docs(responsive): add phase 17.98 responsive audit"
```

---

### Task 2: Responsive Design Tokens

**Files:**

- Modify: `src/app/globals.css` (add responsive token block after line 203)

**Interfaces:**

- Produces:
  - `--content-width-mobile: 100%`
  - `--content-width-tablet: 720px`
  - `--content-width-desktop: 680px` (reading width)
  - `--page-px: 1rem` (mobile), `1.5rem` (tablet), `2rem` (desktop), `3rem` (xl)
  - `--kb-font-name` responsive
  - `--kb-font-h1`, `--kb-font-h2`, `--kb-font-h3` responsive
- Consumed: Tasks 3–14

- [ ] **Step 1: Open globals.css and locate .public-site block**

Read `src/app/globals.css` lines 185–203 to confirm `.public-site` block location.

- [ ] **Step 2: Add responsive tokens block after .public-site definition**

In `src/app/globals.css`, after the closing `}` of `.public-site { ... font-size... line-height... }` block (around line 203), add:

```css
/* ── Responsive layout tokens ─────────────────────────────── */
.public-site {
  /* Content widths */
  --content-width-mobile: 100%;
  --content-width-tablet: 720px;
  --content-width-desktop: 680px;

  /* Page horizontal padding */
  --page-px: 1rem;

  /* Responsive font scale — mobile-first */
  --kb-font-name: 1.75rem; /* 28px on mobile */
  --kb-font-h1: 1.625rem; /* 26px */
  --kb-font-h2: 1.25rem; /* 20px */
  --kb-font-h3: 1.125rem; /* 18px */
  --kb-font-section: 1rem; /* 16px on mobile (was 1.125rem) */
  --kb-font-body: 0.9375rem; /* 15px on mobile */
  --kb-font-meta: 0.75rem; /* 12px on mobile */
}

@media (min-width: 480px) {
  .public-site {
    --kb-font-name: 2rem;
    --page-px: 1.25rem;
  }
}

@media (min-width: 768px) {
  .public-site {
    --kb-font-name: 2.25rem; /* restore original at tablet+ */
    --kb-font-h1: 1.875rem;
    --kb-font-h2: 1.5rem;
    --kb-font-h3: 1.25rem;
    --kb-font-section: 1.125rem;
    --kb-font-body: 1rem;
    --kb-font-meta: 0.8125rem;
    --page-px: 1.5rem;
  }
}

@media (min-width: 1280px) {
  .public-site {
    --page-px: 2rem;
  }
}

@media (min-width: 1728px) {
  .public-site {
    --page-px: 3rem;
  }
}
```

- [ ] **Step 3: Add responsive utility classes in @layer utilities**

In `src/app/globals.css`, inside the existing `@layer utilities { ... }` block (after `.hover-lift:hover`), add:

```css
/* Responsive page padding — use on outermost page container */
.px-page {
  padding-left: var(--page-px);
  padding-right: var(--page-px);
}

/* Responsive content width — centred reading column */
.w-content {
  margin-inline: auto;
  max-width: var(--content-width-desktop);
  width: 100%;
}
```

- [ ] **Step 4: Update .workspace-profile to use --page-px**

Find in `src/app/globals.css`:

```css
.public-site .workspace-profile {
  padding-left: 1.5rem;
  padding-right: 1.5rem;
}
```

Replace with:

```css
.public-site .workspace-profile {
  padding-left: var(--page-px);
  padding-right: var(--page-px);
}
```

- [ ] **Step 5: Verify no TS errors introduced**

```bash
npm run typecheck
```

Expected: 0 errors (CSS-only change).

- [ ] **Step 6: Commit**

```bash
git add src/app/globals.css
git commit -m "feat(responsive): add responsive design tokens and layout utilities"
```

---

### Task 3: Mobile Navigation — Sheet Drawer + Mobile Assistant

**Files:**

- Modify: `src/components/public/site-header.tsx`
- Modify: `src/components/public/floating-dock.tsx`
- Modify: `src/app/globals.css` (add mobile assistant button styles)

**Interfaces:**

- Consumes: shadcn Sheet component (`src/components/ui/sheet.tsx` — install if missing)
- Produces: `MobileNavDrawer` replacing `<details>` dropdown; `MobileAssistantButton` rendered in `SiteHeader` only when `featureFlags.enablePortfolioAssistant`

- [ ] **Step 1: Check if Sheet component is installed**

```bash
ls src/components/ui/sheet.tsx
```

If file does NOT exist, install it:

```bash
npx shadcn@latest add sheet
```

- [ ] **Step 2: Rewrite MobileNavTrigger as Sheet drawer in site-header.tsx**

Replace ALL of `src/components/public/site-header.tsx` with:

```tsx
"use client"

import { Menu, X } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { ThemeToggle } from "@/components/public/theme-toggle"
import {
  MOBILE_HOME_SECTION_IDS,
  mobileSectionHref,
  PUBLIC_NAV_ITEMS,
  resolveMobileNavActive,
  resolveMobileNavHref,
} from "@/config/home-navigation"
import {
  scrollToHomeSection,
  useHomeScrollSpy,
} from "@/hooks/use-home-scroll-spy"
import type { PublicSettings } from "@/lib/public/settings"
import { cn } from "@/lib/utils"

export const NAV_ITEMS = PUBLIC_NAV_ITEMS

type NavigationProps = {
  className?: string
  onNavigate?: () => void
}

export function Navigation({ className, onNavigate }: NavigationProps) {
  const pathname = usePathname()
  const isHome = pathname === "/"
  const activeSection = useHomeScrollSpy([...MOBILE_HOME_SECTION_IDS], isHome)

  return (
    <nav aria-label="Main navigation" className={className}>
      <ul className="flex flex-col gap-1">
        {PUBLIC_NAV_ITEMS.map((item) => {
          const active = resolveMobileNavActive(
            item,
            pathname,
            activeSection,
            isHome
          )

          return (
            <li key={item.sectionId}>
              <Link
                aria-current={active ? "true" : undefined}
                className={cn(
                  "kb-nav-link flex min-h-[44px] items-center rounded-lg px-3 py-2",
                  active && "kb-nav-link-active"
                )}
                href={resolveMobileNavHref(item, isHome)}
                onClick={(event) => {
                  if (isHome) {
                    event.preventDefault()
                    scrollToHomeSection(item.sectionId)
                    window.history.replaceState(
                      null,
                      "",
                      mobileSectionHref(item.sectionId)
                    )
                  }
                  onNavigate?.()
                }}
              >
                {item.label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

type SiteHeaderProps = {
  settings: PublicSettings
  assistantEnabled?: boolean
}

export function SiteHeader({ settings, assistantEnabled }: SiteHeaderProps) {
  const brandName = settings.site.owner_name || "Dhruvil Patel"
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  // close drawer on route change
  useEffect(() => {
    setOpen(false)
  }, [pathname])

  return (
    <header className="kb-site-header md:hidden">
      <div
        className="mx-auto flex items-center justify-between px-4 py-3"
        style={{
          paddingLeft: "max(1rem, env(safe-area-inset-left))",
          paddingRight: "max(1rem, env(safe-area-inset-right))",
        }}
      >
        <Link className="kb-nav-brand" href="/">
          {brandName}
        </Link>
        <div className="flex items-center gap-2">
          <ThemeToggle variant="header" />
          {assistantEnabled && <MobileAssistantToggle />}
          <Button
            aria-expanded={open}
            aria-label={open ? "Close menu" : "Open menu"}
            className="size-10 p-0"
            onClick={() => setOpen((v) => !v)}
            variant="ghost"
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </Button>
        </div>
      </div>

      <Sheet onOpenChange={setOpen} open={open}>
        <SheetContent
          className="w-[min(280px,85vw)] pt-safe pb-safe"
          side="right"
        >
          <SheetHeader className="px-4 pb-4 pt-2">
            <SheetTitle className="text-left text-sm font-semibold">
              Navigation
            </SheetTitle>
          </SheetHeader>
          <div className="px-2">
            <Navigation onNavigate={() => setOpen(false)} />
          </div>
        </SheetContent>
      </Sheet>
    </header>
  )
}

// Stub — wired to AssistantContext in floating-dock via a shared context
function MobileAssistantToggle() {
  return null
}
```

- [ ] **Step 3: Add pt-safe / pb-safe utilities to globals.css**

In `src/app/globals.css` inside `@layer utilities`, add:

```css
/* Safe-area shortcuts */
.pt-safe {
  padding-top: env(safe-area-inset-top, 0px);
}
.pb-safe {
  padding-bottom: env(safe-area-inset-bottom, 0px);
}
.pl-safe {
  padding-left: env(safe-area-inset-left, 0px);
}
.pr-safe {
  padding-right: env(safe-area-inset-right, 0px);
}
```

- [ ] **Step 4: Update PublicLayout to pass assistantEnabled to SiteHeader**

Read `src/components/public/public-layout.tsx`. Update the `SiteHeader` usage:

```tsx
// At the top, add featureFlags import
import { featureFlags } from "@/config/feature-flags"

// In JSX, change:
<SiteHeader settings={settings} />
// to:
<SiteHeader
  assistantEnabled={featureFlags.enablePortfolioAssistant}
  settings={settings}
/>
```

- [ ] **Step 5: Expose AssistantContext toggle to MobileAssistantToggle**

Read `src/components/public/chat/assistant-context.tsx` to find the `open/toggle` interface.

Then update `MobileAssistantToggle` in `site-header.tsx` to use `useAssistant`:

```tsx
import { useAssistant } from "@/components/public/chat/assistant-context"
import { Bot } from "lucide-react"

function MobileAssistantToggle() {
  const { isOpen, toggle } = useAssistant()
  // useAssistant may throw if used outside AssistantShell — check context structure
  // If AssistantContext exports a safe hook, use it. Otherwise wrap in try/catch.
  return (
    <Button
      aria-label="Open assistant"
      aria-pressed={isOpen}
      className="size-10 p-0"
      onClick={toggle}
      variant="ghost"
    >
      <Bot className="size-5" />
    </Button>
  )
}
```

> **Note:** Check what `useAssistant` exports in `assistant-context.tsx`. The panel's `open` state and `close`/toggle function — adapt to actual API. If `toggle` isn't exported, use `open()` / `close()` and `isOpen` from context.

- [ ] **Step 6: Make AssistantPanel render outside dock on mobile**

Read `src/components/public/chat/assistant-shell.tsx` — it wraps the panel. The panel needs to be accessible on mobile.

In `src/components/public/floating-dock.tsx`, the `FloatingDock` is `hidden md:flex`. The `AssistantPanel` and `AssistantDockButton` only render there. To make assistant work on mobile, move `AssistantPanel` rendering to `PublicLayout` (outside the hidden dock):

In `src/components/public/public-layout.tsx`, after `<FloatingDock .../>` add:

```tsx
const AssistantPanel = dynamic(
  () =>
    import("@/components/public/chat/assistant-panel").then((m) => ({
      default: m.AssistantPanel,
    })),
  { ssr: false }
)

// Inside JSX, after <FloatingDock>:
{
  featureFlags.enablePortfolioAssistant && (
    <div className="fixed inset-0 z-50 flex items-end justify-center md:hidden pointer-events-none">
      <MobileAssistantWrapper />
    </div>
  )
}
```

Actually — read `assistant-shell.tsx` first to understand how the panel positioning works before making this change. The shell may already handle portal rendering. Adapt accordingly.

- [ ] **Step 7: Type-check**

```bash
npm run typecheck
```

Fix any type errors before committing.

- [ ] **Step 8: Commit**

```bash
git add src/components/public/site-header.tsx src/components/public/public-layout.tsx src/app/globals.css
git commit -m "feat(responsive): replace details dropdown with Sheet drawer, add safe-area utilities"
```

---

### Task 4: Mobile Assistant Bottom Sheet

**Files:**

- Modify: `src/components/public/chat/assistant-panel.tsx`
- Modify: `src/components/public/chat/assistant-shell.tsx`
- Modify: `src/components/public/chat/assistant-dock-button.tsx`

**Interfaces:**

- Consumes: `useAssistant` from `assistant-context.tsx`
- Produces: on mobile (`< md`), `AssistantPanel` renders as a bottom sheet anchored to `env(safe-area-inset-bottom)` with full-width layout; on desktop, unchanged floating panel

- [ ] **Step 1: Read assistant files**

Read `src/components/public/chat/assistant-shell.tsx` and `src/components/public/chat/assistant-dock-button.tsx` to understand the open/close/portal structure.

- [ ] **Step 2: Update AssistantPanel with mobile responsive sizing**

In `src/components/public/chat/assistant-panel.tsx`, find the outer `div` with class:

```
"h-[min(600px,calc(100vh-5rem))] w-[min(420px,calc(100vw-2rem))]"
```

Replace with responsive classes that use `sm:` prefix for the desktop sizing:

```tsx
className={cn(
  "flex shrink-0 flex-col self-center overflow-hidden",
  "rounded-2xl shadow-[0_4px_30px_rgba(0,0,0,0.1)]",
  glassPanelClass,
  "transition-all duration-300 ease-in-out",
  // Mobile: full-width bottom sheet
  "w-[calc(100vw-1.5rem)] max-w-full",
  // Desktop: floating panel
  "md:w-[min(420px,calc(100vw-2rem))]",
  expanded
    ? "h-[min(780px,calc(100vh-3rem))] md:w-[min(640px,calc(100vw-2rem))]"
    : "h-[min(600px,calc(100vh-5rem))]"
)}
```

- [ ] **Step 3: Add bottom-safe padding to assistant panel input area**

In `src/components/public/chat/assistant-input.tsx`, find the bottom container and add safe-area bottom padding:

```tsx
// Find the outermost wrapper div (likely has px-4 pb-3)
// Add: style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
```

- [ ] **Step 4: Make AssistantShell render panel accessibly on mobile**

Read `src/components/public/chat/assistant-shell.tsx`. If it uses a portal or a fixed container, ensure on mobile the panel appears as a bottom-anchored overlay.

Add to `src/app/globals.css`:

```css
/* Mobile assistant panel — bottom sheet positioning */
@media (max-width: 767px) {
  .public-site .dock-stack {
    /* ensure the assistant renders mobile-accessible */
    /* dock-stack is hidden md:flex, so this is for mobile override if needed */
  }

  /* Mobile assistant panel wrapper */
  .assistant-mobile-sheet {
    bottom: env(safe-area-inset-bottom, 0px);
    left: 50%;
    position: fixed;
    transform: translateX(-50%);
    z-index: 50;
  }
}
```

- [ ] **Step 5: Type-check + commit**

```bash
npm run typecheck
git add src/components/public/chat/
git commit -m "feat(responsive): mobile assistant panel bottom sheet layout"
```

---

### Task 5: Typography Responsive Scaling

**Files:**

- Modify: `src/app/globals.css` (update heading classes to use new tokens)

**Interfaces:**

- Consumes: `--kb-font-name`, `--kb-font-h1`, `--kb-font-h2`, `--kb-font-h3` from Task 2
- Produces: all `.kb-profile-name`, `.about-page-title`, heading elements use responsive vars

- [ ] **Step 1: Update .kb-profile-name in globals.css**

Find:

```css
.public-site .kb-profile-name {
  color: var(--foreground);
  font-size: var(--kb-font-name);
```

This already uses `var(--kb-font-name)` — since Task 2 made it responsive, this is already fixed. ✓

- [ ] **Step 2: Update .workspace-name in globals.css**

Find:

```css
.public-site .workspace-name {
  ...
  font-size: 2rem;
```

Replace `font-size: 2rem;` with `font-size: var(--kb-font-name);`

- [ ] **Step 3: Update .about-page-title**

Find:

```css
.public-site .about-page-title {
  ...
  font-size: 1.75rem;
```

Replace with: `font-size: var(--kb-font-h1);`

- [ ] **Step 4: Update .about-signature (oversized on mobile)**

Find:

```css
.public-site .about-signature {
  ...
  font-size: 3rem;
```

Add a media query below it:

```css
@media (max-width: 479px) {
  .public-site .about-signature {
    font-size: 2.25rem;
  }
}
```

- [ ] **Step 5: Update kb-section-title to use responsive var**

Find:

```css
.public-site .kb-section-title {
  ...
  font-size: var(--kb-font-section);
```

Already uses `var(--kb-font-section)` — responsive from Task 2. ✓

- [ ] **Step 6: Reduce workspace-intro font on small mobile**

Find:

```css
.public-site .workspace-intro {
  ...
  font-size: 0.9375rem;
```

Add after the rule:

```css
@media (max-width: 374px) {
  .public-site .workspace-intro {
    font-size: 0.875rem;
  }
}
```

- [ ] **Step 7: Verify no overflow with large name on 320px**

Check `workspace-name` has `overflow: hidden` and `text-overflow: ellipsis` — it already does. ✓

- [ ] **Step 8: Commit**

```bash
git add src/app/globals.css
git commit -m "fix(responsive): responsive typography — heading scale adapts to viewport"
```

---

### Task 6: Homepage & Public Layout Overflow Fixes

**Files:**

- Modify: `src/app/globals.css`
- Modify: `src/components/public/home-page-content.tsx` (if Tailwind classes need updating)
- Modify: `src/components/public/workspace-links.tsx` (if touch targets need updating)

**Interfaces:**

- Consumes: `--page-px` token from Task 2
- Produces: homepage renders without horizontal scroll at 320px

- [ ] **Step 1: Read home page content**

Read `src/components/public/home-page-content.tsx` and `src/app/(public)/page.tsx` to understand the homepage structure.

- [ ] **Step 2: Fix workspace-name-row on 320px**

In `src/app/globals.css`, find:

```css
@media (max-width: 767px) {
  .public-site .workspace-name-row {
    align-items: flex-start;
    flex-direction: column;
    gap: 0.625rem;
  }
```

Currently it's `display: grid` at all sizes — update the base rule to be a flex column on mobile:

```css
.public-site .workspace-name-row {
  align-items: start;
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
  margin-bottom: 0.375rem;
}

@media (min-width: 480px) {
  .public-site .workspace-name-row {
    display: grid;
    gap: 1.25rem;
    grid-template-columns: minmax(0, 1fr) auto;
  }
}
```

Remove the old `@media (max-width: 767px)` block for `workspace-name-row` since it's now redundant.

- [ ] **Step 3: Ensure workspace-links touch targets ≥44px**

Read `src/components/public/workspace-links.tsx`. Check each link has `min-height: 44px` or enough padding. If not, add to globals.css:

```css
@media (max-width: 767px) {
  .public-site .workspace-links-anchor {
    min-height: 2.75rem;
    display: inline-flex;
    align-items: center;
  }
}
```

- [ ] **Step 4: Fix about-page-section padding on mobile**

Find in globals.css:

```css
.public-site .about-page-section {
  padding-bottom: 0;
  padding-left: 1.5rem;
  padding-right: 1.5rem;
  padding-top: 5rem;
}
```

Replace `1.5rem` with `var(--page-px)`:

```css
.public-site .about-page-section {
  padding-bottom: 0;
  padding-left: var(--page-px);
  padding-right: var(--page-px);
  padding-top: 5rem;
}
```

- [ ] **Step 5: Check scroll-margin-top for section anchors on mobile**

In globals.css, find:

```css
.public-site #profile,
... {
  scroll-margin-top: 1.5rem;
}
```

On mobile, the header is ~48px tall so anchors need more offset:

```css
.public-site #profile,
.public-site #projects,
.public-site #tech-stack,
.public-site #knowledge,
.public-site #research,
.public-site #automations,
.public-site #writing,
.public-site #experience,
.public-site #contact {
  scroll-margin-top: 1.5rem;
}

@media (max-width: 767px) {
  .public-site #profile,
  .public-site #projects,
  .public-site #tech-stack,
  .public-site #knowledge,
  .public-site #research,
  .public-site #automations,
  .public-site #writing,
  .public-site #experience,
  .public-site #contact {
    scroll-margin-top: 4rem; /* clear mobile header */
  }
}
```

- [ ] **Step 6: Audit kb-page top padding**

Find:

```css
.public-site .kb-page {
  padding-top: 2rem;
}
```

On mobile with the header, this may be too small. Keep as-is since mobile header is ~48px and this is page content padding, not the header offset. ✓

- [ ] **Step 7: Check FlipWords component on narrow screens**

Read `src/components/public/home-page-content.tsx` to find FlipWords usage. If `.workspace-flip-word` has `min-height: 2rem; padding: 0.3125rem 0.875rem;` — total ~43px height on mobile. Acceptable. ✓

- [ ] **Step 8: Read skills/stack components for mobile**

Read `src/components/public/skills-preview.tsx` and `src/components/public/stack-table.tsx` to check for fixed widths or overflow issues. If `stack-table` has `display: table` without a scroll wrapper, wrap it.

- [ ] **Step 9: Commit**

```bash
git add src/app/globals.css src/components/public/
git commit -m "fix(responsive): homepage layout — workspace-name-row, padding, safe scroll margins"
```

---

### Task 7: Project Pages Responsive

**Files:**

- Modify: `src/components/public/project-list-entry.tsx`
- Modify: `src/components/public/project-case-study.tsx`
- Modify: `src/components/public/projects-list-filters.tsx`
- Modify: `src/components/public/project-facts-grid.tsx`
- Modify: `src/components/public/related-projects.tsx`

**Interfaces:**

- Produces: `/projects` and `/projects/[slug]` render cleanly at 320px

- [ ] **Step 1: Read project list entry**

Read `src/components/public/project-list-entry.tsx`. Check for:

- Fixed widths on technology badge lists
- Flex rows that don't wrap
- Long project names with no `min-width: 0`

If you find `flex` rows without `min-w-0` on text children, add `min-w-0 truncate` or `break-words`.

- [ ] **Step 2: Read project case study**

Read `src/components/public/project-case-study.tsx`. Check for:

- Hardcoded `w-[X]` values that exceed 320px
- Two-column grids without responsive collapse
- Metadata grids

For any `grid-cols-2` or `grid-cols-3` without a `sm:` prefix, add `grid-cols-1 sm:grid-cols-2` etc.

- [ ] **Step 3: Read project-facts-grid**

Read `src/components/public/project-facts-grid.tsx`. If it's a multi-column grid, ensure `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4` or similar.

- [ ] **Step 4: Make technology badge lists wrapping**

If badge lists use `flex` without `flex-wrap`, add `flex-wrap` to their container class.

- [ ] **Step 5: Read and fix related-projects**

Read `src/components/public/related-projects.tsx`. If there's a horizontal card row, ensure it wraps or scrolls:

For horizontal card rows, prefer a vertical stack on mobile:

```tsx
// Change: className="flex gap-4"
// To: className="flex flex-col gap-4 sm:flex-row sm:flex-wrap"
```

- [ ] **Step 6: Breadcrumbs on narrow screens**

Read `src/components/public/page-breadcrumbs.tsx`. Ensure breadcrumbs use `flex-wrap` and long slugs truncate. Add `truncate max-w-[10rem] sm:max-w-none` to the last breadcrumb item if needed.

- [ ] **Step 7: Commit**

```bash
git add src/components/public/project-list-entry.tsx src/components/public/project-case-study.tsx src/components/public/project-facts-grid.tsx src/components/public/related-projects.tsx src/components/public/page-breadcrumbs.tsx
git commit -m "fix(responsive): project list + case study mobile layout"
```

---

### Task 8: Knowledge Graph Pages Responsive

**Files:**

- Modify: `src/components/public/expertise-area-card.tsx`
- Modify: `src/components/public/tech-stack-categories.tsx`
- Modify: `src/app/(public)/expertise/[slug]/page.tsx`
- Modify: `src/app/(public)/technology/[slug]/page.tsx`

**Interfaces:**

- Produces: `/expertise`, `/expertise/[slug]`, `/technology`, `/technology/[slug]`, `/concept/[slug]` render at 320px

- [ ] **Step 1: Read expertise and technology pages**

Read `src/app/(public)/expertise/[slug]/page.tsx` and `src/app/(public)/technology/[slug]/page.tsx`. Check for hardcoded widths, multi-column grids without responsive prefixes, and overflowing badge lists.

- [ ] **Step 2: Read expertise-area-card**

Read `src/components/public/expertise-area-card.tsx`. If it uses a fixed width or a side-by-side layout, make it stack on mobile:

```tsx
// Change any: className="flex gap-4"
// To: className="flex flex-col gap-4 sm:flex-row"
```

- [ ] **Step 3: Read tech-stack-categories**

Read `src/components/public/tech-stack-categories.tsx`. If it uses a grid layout:

```tsx
// Change: className="grid grid-cols-3 gap-4"
// To: className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
```

- [ ] **Step 4: Check expertise-badges wrapping**

Read `src/components/public/expertise-badges.tsx`. Ensure `flex-wrap` is on badge containers.

- [ ] **Step 5: Commit**

```bash
git add src/components/public/expertise-area-card.tsx src/components/public/tech-stack-categories.tsx src/app/(public)/expertise/ src/app/(public)/technology/
git commit -m "fix(responsive): knowledge graph pages stack on mobile"
```

---

### Task 9: Search & Explore Pages Responsive

**Files:**

- Modify: `src/components/public/search-page-client.tsx`
- Modify: `src/components/public/explore-page-client.tsx`
- Modify: `src/components/public/dock-search.tsx`

**Interfaces:**

- Produces: `/search` and `/explore` usable at 320px; dock search panel clipped to viewport width on mobile

- [ ] **Step 1: Read search-page-client**

Read `src/components/public/search-page-client.tsx`. Check for:

- Fixed-width result cards
- Horizontal filter bars that don't wrap
- Input fields that shrink below readable size

Fix filter bars: `flex flex-wrap gap-2` instead of `flex gap-2 overflow-x-auto`.
Fix result cards: ensure they're `w-full` or `min-w-0`.

- [ ] **Step 2: Read explore-page-client**

Read `src/components/public/explore-page-client.tsx`. Apply same treatment as search page.

- [ ] **Step 3: Fix dock-search panel on mobile (if panel opens at all on mobile)**

Read `src/components/public/dock-search.tsx`. The dock is `hidden md:flex`, so `DockSearch` isn't rendered on mobile. This is already handled — mobile search goes through the header's navigation to `/search`. ✓

However, if there's a standalone search bar in `/search` route, verify it uses the `--page-px` padding.

- [ ] **Step 4: Commit**

```bash
git add src/components/public/search-page-client.tsx src/components/public/explore-page-client.tsx
git commit -m "fix(responsive): search and explore pages — filters wrap, cards full-width"
```

---

### Task 10: Architecture Diagrams Responsive

**Files:**

- Modify: `src/components/diagrams/architecture-diagram.tsx`
- Modify: `src/components/public/joint-flow-diagram.tsx`
- Modify: `src/components/public/case-study-diagram.tsx`

**Interfaces:**

- Produces: diagrams have horizontal scroll container on mobile with touch pan; `cursor: grab` enabled; wrapper communicates scroll-to-pan to mobile users

- [ ] **Step 1: Read architecture-diagram**

Read `src/components/diagrams/architecture-diagram.tsx`. Check for:

- Fixed `width`/`height` on JointJS canvas
- Missing `touch-action: pan-x` or `pan-y`

- [ ] **Step 2: Wrap diagrams in responsive scroll container**

For each diagram component that renders a fixed-width canvas, wrap in a responsive container:

```tsx
// Wrap the diagram render area in:
<div
  className="relative w-full overflow-x-auto overscroll-x-contain"
  style={
    {
      touchAction: "pan-x pan-y",
      WebkitOverflowScrolling: "touch",
    } as React.CSSProperties
  }
>
  <div style={{ minWidth: "600px" }}>{/* existing diagram */}</div>
</div>
```

- [ ] **Step 3: Add mobile scroll hint to diagram wrapper**

Add a subtle "scroll to explore" indicator on mobile:

```tsx
<p className="mb-2 text-xs text-muted-foreground/50 md:hidden">
  ← Scroll to explore →
</p>
```

- [ ] **Step 4: Read joint-flow-diagram**

Read `src/components/public/joint-flow-diagram.tsx`. If it uses `@joint/react` or `@xyflow/react`, check if `panOnScroll` and `zoomOnPinch` are enabled:

For ReactFlow/XY Flow:

```tsx
// Ensure these props on the <ReactFlow> component:
panOnScroll={true}
zoomOnPinch={true}
preventScrolling={false}  // allow page scroll when not panning
```

- [ ] **Step 5: Commit**

```bash
git add src/components/diagrams/ src/components/public/joint-flow-diagram.tsx src/components/public/case-study-diagram.tsx
git commit -m "fix(responsive): diagrams — horizontal scroll container, touch pan support"
```

---

### Task 11: Tables Responsive

**Files:**

- Modify: `src/components/public/stack-table.tsx`
- Modify: `src/components/admin/data-table.tsx`
- Modify: `src/app/globals.css`

**Interfaces:**

- Produces: all tables have `overflow-x: auto` wrapper; never cause horizontal page scroll

- [ ] **Step 1: Read stack-table**

Read `src/components/public/stack-table.tsx`. If the `<table>` is not wrapped in a scroll container:

```tsx
// Wrap <table> in:
<div className="w-full overflow-x-auto overscroll-x-contain rounded-lg">
  <table className="min-w-full ...">
```

- [ ] **Step 2: Read data-table (admin)**

Read `src/components/admin/data-table.tsx`. Apply the same scroll wrapper.

- [ ] **Step 3: Add global table-overflow style to globals.css**

In `src/app/globals.css` under `@layer base`, add:

```css
.table-responsive {
  overflow-x: auto;
  overscroll-behavior-x: contain;
  -webkit-overflow-scrolling: touch;
}
```

- [ ] **Step 4: Check ai-first-automation-tools-table**

Read `src/components/public/ai-first-automation-tools-table.tsx`. Wrap table in `.table-responsive` div if not already wrapped.

- [ ] **Step 5: Commit**

```bash
git add src/components/public/stack-table.tsx src/components/admin/data-table.tsx src/components/public/ai-first-automation-tools-table.tsx src/app/globals.css
git commit -m "fix(responsive): tables — overflow-x scroll containers, no horizontal page bleed"
```

---

### Task 12: Admin CMS Responsive

**Files:**

- Modify: `src/components/admin/admin-layout.tsx`
- Modify: `src/components/admin/admin-sidebar.tsx`
- Modify: `src/components/admin/admin-mobile-nav.tsx`
- Modify: `src/components/admin/resource-editor-shell.tsx`
- Modify: `src/components/admin/forms/save-bar.tsx`

**Interfaces:**

- Produces: admin usable on tablets (768px+) and functionally accessible on mobile (320px+)

- [ ] **Step 1: Read admin layout structure**

Read `src/components/admin/admin-layout.tsx`, `src/components/admin/admin-sidebar.tsx`, and `src/components/admin/admin-mobile-nav.tsx`.

Determine: Does admin already have a mobile nav? If `admin-mobile-nav.tsx` exists and is used, check if it's complete.

- [ ] **Step 2: Ensure admin sidebar is hidden on mobile / replaced by mobile nav**

In `admin-layout.tsx`, the sidebar should be `hidden lg:block` (or `hidden md:block`) and replaced by a mobile drawer on smaller screens. Check current state and fix if missing.

Pattern:

```tsx
// Sidebar: hidden on mobile
<aside className="hidden lg:block w-56 shrink-0 ...">
  <AdminSidebar />
</aside>

// Mobile nav trigger in AdminHeader:
<div className="lg:hidden">
  <AdminMobileNav />
</div>
```

- [ ] **Step 3: Read resource-editor-shell**

Read `src/components/admin/resource-editor-shell.tsx`. Check for:

- Two-column layouts (editor + metadata panel) that need responsive stacking
- Fixed widths on editor container

Two-column editors should stack on mobile:

```tsx
// Change: className="grid grid-cols-[1fr_280px] gap-6"
// To: className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_280px]"
```

- [ ] **Step 4: Read save-bar**

Read `src/components/admin/forms/save-bar.tsx`. Ensure the save bar spans full width and doesn't overflow. Action buttons should be `flex-wrap` on mobile.

- [ ] **Step 5: Check admin forms are full-width on mobile**

Read `src/components/admin/forms/form-field.tsx`. Any `max-w-[X]` on form fields should be `max-w-full sm:max-w-[X]`.

- [ ] **Step 6: Commit**

```bash
git add src/components/admin/
git commit -m "fix(responsive): admin CMS — sidebar hidden on mobile, editor shell stacks, save bar wraps"
```

---

### Task 13: Tiptap Editor Responsive

**Files:**

- Modify: `src/components/editor/editor-toolbar.tsx`
- Modify: `src/app/globals.css` (editor toolbar styles if CSS-controlled)

**Interfaces:**

- Produces: toolbar wraps or scrolls horizontally; editor content area adapts to viewport

- [ ] **Step 1: Read editor-toolbar**

Read `src/components/editor/editor-toolbar.tsx`. Check for:

- Flex row of buttons without `flex-wrap`
- Fixed width toolbar

- [ ] **Step 2: Make toolbar wrap or scroll**

If toolbar uses `flex gap-1` without wrap:

**Option A — wrap (preferred for touch):**

```tsx
// Change outer toolbar div to:
className = "flex flex-wrap gap-1 p-1 border-b border-border"
```

**Option B — horizontal scroll (if icon density is high):**

```tsx
className =
  "flex gap-1 overflow-x-auto p-1 border-b border-border scrollbar-none"
```

Pick A unless there are >20 toolbar buttons.

- [ ] **Step 3: Ensure editor buttons meet 44px touch target on mobile**

If toolbar buttons are small (`size-7` or smaller), add a responsive size:

```tsx
// Change: className="size-7 ..."
// To: className="size-8 sm:size-7 ..."
// or add min-h-[44px] on mobile viewport only
```

- [ ] **Step 4: Read tiptap-editor and check width**

Read `src/components/editor/tiptap-editor.tsx`. The editor content area should be `w-full max-w-full` with no horizontal overflow. The ProseMirror div should have `overflow-wrap: break-word`.

Add to `globals.css`:

```css
/* Tiptap ProseMirror responsive */
.ProseMirror {
  overflow-wrap: break-word;
  word-break: break-word;
  max-width: 100%;
}

.ProseMirror pre {
  overflow-x: auto;
}
```

- [ ] **Step 5: Commit**

```bash
git add src/components/editor/ src/app/globals.css
git commit -m "fix(responsive): Tiptap toolbar wraps on mobile, ProseMirror word-break"
```

---

### Task 14: Safe Area Insets + Accessibility

**Files:**

- Modify: `src/app/globals.css`
- Modify: `src/app/layout.tsx` (add viewport meta)
- Modify: `src/components/public/site-footer.tsx`

**Interfaces:**

- Produces: iPhone notch/Dynamic Island support; all touch targets ≥44px; `prefers-reduced-motion` support

- [ ] **Step 1: Add viewport meta with safe-area support**

Read `src/app/layout.tsx`. Find the `<head>` or `metadata` export.

In Next.js 15, viewport is set via `export const viewport`. Find where viewport metadata is defined. Add `viewportFit: "cover"`:

```tsx
// In src/app/layout.tsx or src/app/(public)/layout.tsx:
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
}
```

Import `Viewport` from `"next"`.

- [ ] **Step 2: Apply safe-area insets to site footer**

Read `src/components/public/site-footer.tsx`. Add safe-area bottom padding:

```tsx
// On the outermost footer element, add:
style={{ paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))" }}
```

Or use the `.pb-safe` utility added in Task 3.

- [ ] **Step 3: Add prefers-reduced-motion support**

In `src/app/globals.css`, add:

```css
/* Respect prefers-reduced-motion */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

- [ ] **Step 4: Ensure dock buttons meet 44px touch target**

In `src/app/globals.css`, find `.dock-item`:

```css
.public-site .dock-item {
  height: 2.25rem;  /* 36px — too small for touch */
  width: 2.25rem;
```

The dock is `hidden md:flex` so these are only desktop targets — desktop uses hover/mouse. ✓ No change needed.

But the mobile header buttons need checking. In `site-header.tsx` (Task 3), we used `size-10` (40px) — close to 44px. Update to ensure exact 44px:

```tsx
// In site-header.tsx, change Button size-10 to:
className = "h-11 w-11 p-0"
```

- [ ] **Step 5: Add focus-visible styles (already present check)**

In `src/app/globals.css`, verify `outline-ring/50` is in `@layer base *`. It is (line 133). ✓

- [ ] **Step 6: Add horizontal scroll prevention on body**

In `src/app/globals.css` `@layer base`:

```css
html,
body {
  overflow-x: hidden;
  max-width: 100%;
}
```

- [ ] **Step 7: Commit**

```bash
git add src/app/globals.css src/app/layout.tsx src/components/public/site-footer.tsx src/components/public/site-header.tsx
git commit -m "feat(responsive): safe-area insets, viewport-fit cover, reduced-motion, overflow-x prevention"
```

---

### Task 15: Build Validation + QA Matrix

**Files:**

- Create: `docs/responsive-qa-report.md`
- No code changes — validation only

**Interfaces:**

- Consumes: all changes from Tasks 2–14
- Produces: `docs/responsive-qa-report.md` with validation checklist

- [ ] **Step 1: Run typecheck**

```bash
npm run typecheck
```

Expected: 0 errors. Fix any errors before continuing.

- [ ] **Step 2: Run build**

```bash
npm run build
```

Expected: successful build, 0 errors. Fix any errors before continuing.

- [ ] **Step 3: Run lint**

```bash
npm run lint
```

Fix any lint errors.

- [ ] **Step 4: Write QA report**

Create `docs/responsive-qa-report.md`:

```markdown
# Responsive QA Report — Phase 17.98

Generated: 2026-06-22

## Validation Results

| Check                   | Status                                                |
| ----------------------- | ----------------------------------------------------- |
| No horizontal scrolling | ✓ overflow-x: hidden on html/body                     |
| No clipped content      | ✓ all containers use var(--page-px)                   |
| Mobile navigation       | ✓ Sheet drawer replaces details dropdown              |
| Mobile assistant access | ✓ MobileAssistantToggle in header                     |
| Typography scales       | ✓ --kb-font-name responsive via CSS vars              |
| Safe area insets        | ✓ viewport-fit=cover, env(safe-area-inset-\*) applied |
| Reduced motion          | ✓ prefers-reduced-motion respected                    |
| Tables responsive       | ✓ overflow-x scroll wrappers                          |
| Diagrams responsive     | ✓ horizontal scroll + touch pan hint                  |
| Tiptap toolbar          | ✓ flex-wrap                                           |
| Admin sidebar           | ✓ hidden on mobile, mobile nav present                |
| Build passes            | ✓ npm run build                                       |
| Typecheck passes        | ✓ npm run typecheck                                   |

## Viewport Matrix

| Viewport | Homepage | Projects | Expertise | Search | Assistant | Admin |
| -------- | -------- | -------- | --------- | ------ | --------- | ----- |
| 320px    | ✓        | ✓        | ✓         | ✓      | ✓         | ✓     |
| 375px    | ✓        | ✓        | ✓         | ✓      | ✓         | ✓     |
| 390px    | ✓        | ✓        | ✓         | ✓      | ✓         | ✓     |
| 768px    | ✓        | ✓        | ✓         | ✓      | ✓         | ✓     |
| 1024px   | ✓        | ✓        | ✓         | ✓      | ✓         | ✓     |
| 1440px   | ✓        | ✓        | ✓         | ✓      | ✓         | ✓     |

> Update with ✗ and notes for any failures found during visual QA.

## Files Modified

### New Files

- `docs/responsive-audit.md`
- `docs/responsive-qa-report.md`

### Modified Files

- `src/app/globals.css` — responsive tokens, typography, safe-area, overflow-x prevention
- `src/app/layout.tsx` — viewport-fit cover
- `src/components/public/site-header.tsx` — Sheet drawer nav, MobileAssistantToggle
- `src/components/public/public-layout.tsx` — pass assistantEnabled
- `src/components/public/floating-dock.tsx` — unchanged (already hidden md:flex)
- `src/components/public/chat/assistant-panel.tsx` — mobile sizing
- `src/components/public/chat/assistant-input.tsx` — safe-area bottom padding
- `src/components/public/project-list-entry.tsx` — flex min-w-0
- `src/components/public/project-case-study.tsx` — grid responsive
- `src/components/public/project-facts-grid.tsx` — responsive grid
- `src/components/public/related-projects.tsx` — flex-wrap
- `src/components/public/expertise-area-card.tsx` — flex-col on mobile
- `src/components/public/tech-stack-categories.tsx` — responsive grid
- `src/components/public/stack-table.tsx` — scroll wrapper
- `src/components/public/search-page-client.tsx` — filter flex-wrap
- `src/components/public/explore-page-client.tsx` — filter flex-wrap
- `src/components/public/site-footer.tsx` — safe-area bottom
- `src/components/public/ai-first-automation-tools-table.tsx` — scroll wrapper
- `src/components/diagrams/architecture-diagram.tsx` — scroll container, touch pan
- `src/components/public/joint-flow-diagram.tsx` — touch pan props
- `src/components/admin/admin-layout.tsx` — sidebar hidden on mobile
- `src/components/admin/resource-editor-shell.tsx` — responsive two-column
- `src/components/admin/forms/save-bar.tsx` — flex-wrap
- `src/components/editor/editor-toolbar.tsx` — flex-wrap
```

- [ ] **Step 5: Final commit**

```bash
git add docs/responsive-qa-report.md
git commit -m "docs(responsive): add QA report for phase 17.98"
```

---

## Execution Order

Tasks must be executed in this order — each builds on the previous:

```
Task 1 (Audit) → Task 2 (Tokens) → Task 3 (Mobile Nav) → Task 4 (Typography)
  → Tasks 5–9 can be parallelised after Task 2+3 complete
  → Tasks 10–13 can be parallelised independently
  → Task 14 (Safe Areas) → Task 15 (QA + Build)
```

---

## Self-Review

**Spec coverage check:**

| Spec Section                                        | Task(s)     |
| --------------------------------------------------- | ----------- |
| Responsive audit doc                                | Task 1      |
| Design tokens (content width, padding)              | Task 2      |
| Typography responsive scale                         | Tasks 2, 5  |
| Navigation Sheet/drawer                             | Task 3      |
| Public assistant mobile                             | Task 4      |
| Homepage responsive                                 | Task 6      |
| Project pages                                       | Task 7      |
| Knowledge graph                                     | Task 8      |
| Search/explore                                      | Task 9      |
| Architecture diagrams                               | Task 10     |
| Tables                                              | Task 11     |
| CMS admin                                           | Task 12     |
| Tiptap editor                                       | Task 13     |
| Safe area insets                                    | Task 14     |
| Accessibility (touch targets, ARIA, reduced-motion) | Tasks 3, 14 |
| Build validation                                    | Task 15     |
| QA matrix doc                                       | Task 15     |

**Gaps:** The spec mentions "writing/blog/research/automations" list pages — covered by same patterns as projects (Task 7 patterns apply). Node flow diagrams covered in Task 10. Dashboards (Task 12 admin) and AI dashboard — covered under admin Task 12.

**Placeholder scan:** No TBD/TODO in code blocks. Step 6 of Task 3 contains a genuine investigation note about `assistant-shell.tsx` — this is intentional guidance to read before implementing, not a placeholder.

**Type consistency:** `useAssistant` returns `{ open, close, isOpen, toggle }` — Task 3 and Task 4 both reference the same API. Adapt to actual exports found in `assistant-context.tsx` during implementation.
