# Design Refinement Pass 2

Visual refinement to strengthen identity, density, and hierarchy. No functionality, routes, CMS, or content architecture changes.

---

## Identity Decisions

**Brand:** Full name **Dhruvil Patel** (not "Portfolio", not "DP").

Rationale: A knowledge base is personal. Full name reads intentional and human; initials feel like a template or app shell.

Applied in:
- Site header brand link
- Profile name (homepage anchor)
- Footer copyright

---

## Profile Header

Homepage opens with a **profile block**, not a hero:

```
Dhruvil Patel
Applied AI Engineer
[site description from CMS]
Pune, India
Resume · GitHub · LinkedIn · Email
```

- Left-aligned, compact, no cards or CTAs
- Location on its own muted line
- Action links as inline text links (accent on hover only)
- Links shown only when configured in CMS settings

---

## Typography Refinements

| Element | Pass 1 | Pass 2 |
|---------|--------|--------|
| Section / page titles | `font-weight: 500` | **`600`** |
| Body line-height | `1.625` | **`1.75`** |
| Metadata | 13px | 13px (unchanged) |
| Entry titles | 500 | 500 (not bold — list items, not headings) |
| Nav brand | 13px meta size | **16px body size**, weight 600 |

Article content headings inside `.article-content` updated to weight 600.

Avoid heavy bold in body text; hierarchy through size and weight on headings only.

---

## Density Adjustments

| Token | Pass 1 | Pass 2 |
|-------|--------|--------|
| `--kb-space-section` | 64px | **40px** |
| `--kb-space-heading` | 24px | **16px** |
| `--kb-space-block` | 24px | **16px** |
| `--kb-space-inline` | 16px | **12px** |
| Page top padding | 64px | **32px** |

Section borders use 40–60% opacity for lighter separation.

Goal: Notion-like density — more content above the fold without feeling cramped.

---

## Navigation Improvements

- Header border reduced to **40% opacity**
- Inactive links: muted at 90% opacity, weight 400
- Active route: accent color only, weight 500
- Brand hover stays foreground (no accent on brand — accent reserved for active nav + links)
- Header vertical padding reduced (`py-4` → `py-3`)
- Mobile menu border softened

Navigation should disappear visually until needed.

---

## Section Descriptions

Every homepage section now has title + muted description:

| Section | Description |
|---------|-------------|
| Projects | Selected systems, products, and experiments. |
| Research | Investigations, papers, and technical explorations. |
| Automations | Workflows and operational systems built for efficiency. |
| Experience | Roles, responsibilities, and impact. |
| Writing | Thoughts, technical notes, and learnings. |
| Contact | Ways to reach me. |

Implemented via `KbSection` `description` prop and `.kb-section-description` (13px, muted).

---

## Section Metadata

List entries show structured metadata lines:

**Projects:** `2025 · AI · Production` (year · domain · status)

**Research:** `Paper · [first tag]` (e.g. Paper · RAG)

**Writing:** `3 min read · Jun 19, 2026` (reading time · date)

**Automations:** `2025 · Jun 19` (year · date)

No badges, pills, or heavy visual treatment — plain muted text.

Reading time estimated from excerpt at 200 WPM (`src/lib/utils/reading.ts`).

---

## Footer Simplification

**Before:** Name · year + social link row

**After:** `© 2026 Dhruvil Patel` — single muted line, 70% opacity, minimal padding

Social links moved to profile header where they belong contextually.

---

## Empty State Improvements

**Before:** CMS-placeholder tone — "No projects yet" + long CMS instructions

**After:** Single thoughtful line:

- "Projects will appear here as they are published."
- "Research notes and papers will appear here as they are published."
- etc.

`PublicEmptyState` simplified to single `message` prop.

---

## Files Modified

```
src/app/globals.css
src/components/public/home-page-content.tsx
src/components/public/kb-section.tsx
src/components/public/site-header.tsx
src/components/public/site-footer.tsx
src/components/public/empty-state.tsx
src/components/public/content-shell.tsx
src/components/public/experience-timeline.tsx
src/lib/utils/reading.ts (new)
src/app/(public)/projects/page.tsx
src/app/(public)/blog/page.tsx
src/app/(public)/research/page.tsx
src/app/(public)/automations/page.tsx
src/app/(public)/resume/page.tsx
docs/design-refinement-pass-2.md (this file)
```

---

## Future Pass 3 Candidates

- Inline skills under profile (metadata, not a grid section)
- Subtle active-section indicator in nav on homepage scroll
- Reading time on list pages (not just homepage)
- Social URLs in seed once provided
