# Design Refinement Pass 1

Visual refinement to shift the public website from a portfolio presentation to a personal engineering knowledge base. No routes, CMS integration, or functionality were changed.

---

## Layout Decisions

| Area | Before | After |
|------|--------|-------|
| Article width | 780px | **680px** (`.max-w-content`) |
| Homepage width | Mixed (780px / 1152px) | **720px** uniform (`.max-w-home`) |
| Homepage structure | Hero + cards + embedded rich content | Profile + list-first sections |
| Section presentation | Bordered cards, tables, grids | Divided entry lists (Notion/Linear style) |
| Alignment | Mixed | Left-aligned throughout |

All public pages share the same narrow reading column. Ultra-wide layouts removed.

---

## Typography Decisions

Font: **Geist** (existing root layout).

| Role | Size | Class |
|------|------|-------|
| Name / page title | 36px (`2.25rem`) | `.kb-profile-name`, `.kb-page-title` |
| Section titles | 18px (`1.125rem`) | `.kb-section-title` |
| Body | 16px (`1rem`) | `.kb-entry-description`, article body |
| Metadata | 13px (`0.8125rem`) | `.kb-entry-meta`, nav links |

Hierarchy is restrained. No oversized hero headings. Article block headings inside `.article-content` are scaled down to match documentation style.

---

## Navigation Decision

**Chosen: Ultra-minimal top navigation**

**Not chosen: Left rail sidebar**

### Reasoning

1. **Content width priority** — Target reading width is 680–720px. A fixed left rail consumes horizontal space and pushes content off-center on smaller laptops.
2. **Flat information architecture** — Seven top-level links do not require persistent sidebar hierarchy (unlike Notion workspaces with nested pages).
3. **Reference alignment** — Linear changelogs, Vercel Docs, and Stripe Docs use minimal top chrome with list-first content below.
4. **Mobile parity** — Top nav collapses to a simple menu drawer; left rail would require a separate mobile pattern.
5. **Reading focus** — Top nav disappears visually during scroll; sidebar remains visually persistent and adds chrome.

Navigation changes:
- Removed sticky backdrop blur and heavy header chrome
- Metadata-sized links (13px)
- Accent color (`#60a5fa`) for active item only
- "Blog" label renamed to **Writing** (route remains `/blog`)

---

## Spacing Scale

Defined as CSS custom properties on `.public-site`:

| Token | Value | Usage |
|-------|-------|-------|
| `--kb-space-section` | 4rem (64px) | Between major sections, page padding |
| `--kb-space-heading` | 1.5rem (24px) | Below section titles |
| `--kb-space-block` | 1.5rem (24px) | Entry list item padding |
| `--kb-space-inline` | 1rem (16px) | Paragraph gaps, inline groups |
| `--kb-space-tight` | 0.5rem (8px) | Metadata spacing |

Utility classes: `.pb-kb-section`, `.mb-kb-heading`, `.mt-kb-heading`, `.pt-kb-heading`

Every homepage section uses `KbSection` with identical vertical rhythm and border separators.

---

## Visual Hierarchy Principles

1. **Content first** — Lists and text dominate; containers are border dividers only.
2. **One accent** — `#60a5fa` reserved for links, active nav, and hover title states.
3. **No cards** — Removed table/card wrappers from projects; entries are title + metadata + description.
4. **No hero** — Profile is name, role, description, location, resume, contact in plain text.
5. **List-first** — Projects, research, automations, and writing use `KbEntryList`.
6. **Reduced noise** — Empty states are text-only; no dashed border boxes.

---

## Motion Adjustments

### Kept

- Scroll progress indicator (thin top line)
- Lenis smooth scrolling
- Hover lift utility (available, used sparingly)
- Expandable section height animation (Framer Motion in `ExpandableBlock`)

### Removed

- **SectionReveal** — Framer Motion fade + translateY on homepage sections (removed from all homepage sections)
- **Staggered section delays** — `delay={0.05}` props eliminated
- **Card hover backgrounds** — Project table row highlights removed with table component
- **Header backdrop blur** — Static border-only header

`SectionReveal` component file remains but is no longer imported. Can be deleted in a future cleanup pass.

---

## Homepage Section Order

1. Profile
2. Projects
3. Research
4. Automations
5. Experience
6. Writing
7. Contact

Removed from homepage display: About (merged into Profile), Skills, Education (still available via CMS; not part of knowledge-base index view).

---

## Components Added / Removed

**Added:** `kb-section.tsx` — `KbSection`, `KbEntryList`

**Removed:** `project-table.tsx` (replaced by `KbEntryList`)

**Refined:** `home-page-content.tsx`, `site-header.tsx`, `site-footer.tsx`, `content-shell.tsx`, `experience-timeline.tsx`, `empty-state.tsx`, `related-projects.tsx`

---

## Future Pass 2 Candidates

- Left-rail navigation for nested content trees (if IA grows)
- Inline skills as metadata under Profile (not a separate grid)
- Typography fine-tuning for rich content blocks (callouts, diagrams)
- Focus-visible ring audit across all interactive elements
