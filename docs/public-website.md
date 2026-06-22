# Public Website

Phase 10 introduces the public-facing portfolio website. It consumes existing CMS data through Supabase RLS without changing the database schema, authentication, or content storage format.

## Route Structure

```
src/app/(public)/
├── layout.tsx              # PublicLayout wrapper
├── page.tsx                # Homepage
├── projects/
│   ├── page.tsx            # Project listing
│   └── [slug]/page.tsx     # Project detail
├── blog/
│   ├── page.tsx
│   └── [slug]/page.tsx
├── research/
│   ├── page.tsx
│   └── [slug]/page.tsx
├── automations/
│   ├── page.tsx
│   └── [slug]/page.tsx
├── experience/page.tsx
├── resume/page.tsx
├── contact/page.tsx
└── not-found.tsx
```

Admin routes remain under `src/app/admin/` and are unaffected.

## Component Hierarchy

```
PublicLayout
├── SmoothScrollProvider (Lenis)
├── ScrollProgress
├── SiteHeader
│   └── Navigation (+ mobile drawer)
├── main
│   └── page-specific content
└── SiteFooter

Content pages
├── PageShell / ContentArticle
└── PublicContent
    └── RichContentRenderer (Phase 9)
        └── BlockRenderer + HoverCard + inline spans
```

## Design System

Dark mode only. No theme switcher.

| Token | Value |
|-------|-------|
| Background | `#0a0a0a` |
| Surface | `#111111` |
| Surface Secondary | `#161616` |
| Border | `#262626` |
| Text Primary | `#fafafa` |
| Text Secondary | `#a3a3a3` |
| Accent | `#60a5fa` |

Applied via `.public-site` CSS scope in `globals.css`. Article reading width is capped at `780px` (`.max-w-content`).

Typography follows Notion / Linear / GitHub Docs patterns: large headings, comfortable line height, minimal decoration.

## Content Rendering Flow

```
Supabase (RLS: published only)
  → src/lib/public/queries.ts
  → Server Component page
  → PublicContent (server)
      → deserializeContent()
      → getProjectPreviewsForDocument() (server-side project refs)
      → RichContentRenderer (client)
          → BlockRenderer
              → Phase 9 blocks (callout, glossary, mention, etc.)
```

Project references resolve published projects on the server and pass previews as props — no client-side waterfall on initial render.

## Data Layer

`src/lib/public/queries.ts` provides read-only queries:

- `getPublicSettings()` — site_settings, social_links, contact_info
- `getPublishedProjects()` — published projects only
- `getPublishedContent({ type })` — blog, research, automation
- `getExperienceList()`, `getSkillsList()`, `getEducationList()`
- `getActiveResume()` — active resume metadata (download link only; upload system is Phase 11)
- `getProjectPreviewsForRawContent()` — for rich content project references

Settings JSON is validated with Zod in `src/lib/public/settings.ts`.

## Micro Interactions

| Interaction | Implementation |
|-------------|----------------|
| Scroll progress | `ScrollProgress` — thin top bar |
| Smooth scroll | Lenis via `SmoothScrollProvider` |
| Section reveal | Framer Motion `SectionReveal` — fade + 12px translateY, 300ms |
| Hover lift | `.hover-lift` utility — `translateY(-2px)` |
| Expandable sections | Framer Motion height animation in `ExpandableBlock` |
| Hover cards | Phase 9 `HoverCard` — 200ms delay |

All motion respects `prefers-reduced-motion`.

## Empty States

List pages and homepage sections use `PublicEmptyState` when CMS data is missing. No broken layouts.

## Future Compatibility

- **Phase 11 (Assets / Resume upload):** Resume page already reads `resumes.file_path`; wire to storage URL when upload is built.
- **Phase 12 (Search):** Content is server-fetched; add search index or API without changing page structure.
- **Phase 13 (AI authoring):** ContentDocument format unchanged; public renderer already supports all block types.

## Libraries Added

- `framer-motion` — section reveals, expandable animation
- `lenis` — smooth scroll

`lucide-react` was already installed (admin); public site uses minimal iconography per design rules.
