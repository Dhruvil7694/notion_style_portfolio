# Project Showcase Model

CMS-managed project presentation data for portfolio showcase layouts, hover cards, and featured project experiences.

## Overview

Projects are no longer limited to title, summary, and body content. The admin panel now controls visual identity, listing metadata, hover preview content, links, ordering, and display flags.

The public website is not redesigned in this phase. New fields are stored and editable in the CMS, with helpers ready for future public consumption.

## Schema

### Existing fields (unchanged)

| Field | Type | Notes |
|-------|------|-------|
| `id` | uuid | Primary key |
| `slug` | text | URL slug |
| `title` | text | Project name |
| `summary` | text | Search/SEO summary (not subtitle) |
| `content` | jsonb | Tiptap document |
| `tech_stack` | text[] | Comma-separated in admin form |
| `github_url` | text | GitHub repository URL |
| `live_url` | text | Legacy live URL (mirrored from `project_url` on save) |
| `featured` | boolean | Featured flag |
| `status` | content_status | draft / published / archived |
| `published_at` | timestamptz | Set on publish |

### New showcase fields

| Field | Type | Max / rules | Purpose |
|-------|------|-------------|---------|
| `icon_name` | text | Iconify identifier | Dynamic icon via `@iconify/react` |
| `tagline` | text | 120 chars | Subtitle below title |
| `year` | text | 20 chars | Listing year, e.g. `2026` |
| `category` | text | 80 chars | e.g. `AI Research` |
| `role` | text | 80 chars | e.g. `Lead Engineer` |
| `project_url` | text | Valid URL | Primary demo/live URL |
| `cover_image` | text | Valid URL | Single cover image — upload or paste URL |
| `challenge` | text | 300 chars | Hover preview problem statement |
| `solution` | text | 300 chars | Hover preview approach |
| `impact` | text | 300 chars | Hover preview outcome |
| `hover_preview_enabled` | boolean | default `true` | Toggle hover card |
| `display_order` | integer | `>= 0` | Manual homepage ordering |

### Icon storage

Store only the Iconify identifier string:

```text
lucide:brain
lucide:bot
tabler:robot
ph:cpu
```

Never store SVG markup or React components in the database.

## Iconify integration

### Package

```bash
npm install @iconify/react
```

### Helper

`src/lib/icons/iconify.tsx`

- `resolveProjectIconName(icon_name)` — returns stored id or fallback `lucide:file-text`
- `ProjectIcon` — React component wrapper
- `renderProjectIcon(icon_name)` — render helper for server/client components
- `isValidIconifyId(icon_name)` — validation helper
- `formatIconLabel(icon_name)` — human-readable label for admin UI

### Search

`src/lib/icons/search.ts` uses the public Iconify search API:

```text
GET https://api.iconify.design/search?query={query}&limit=48
```

Default suggestions are shown when the search box is empty.

## Hover preview architecture

Hover preview content is CMS-managed and separate from `summary` and `content`.

| Field | Role |
|-------|------|
| `challenge` | Problem being solved |
| `solution` | Approach taken |
| `impact` | Outcome / benefit |
| `hover_preview_enabled` | Whether preview is shown |

Public rendering (existing, unchanged in this phase) uses `src/lib/public/project-preview-sections.ts` to build labeled sections from stored fields.

Future public layouts should read these fields directly and respect `hover_preview_enabled`.

## Homepage sorting

Published projects sort by:

1. `featured DESC`
2. `display_order ASC`
3. `created_at DESC`

Implemented in `src/lib/public/queries.ts`.

## Admin form structure

`src/features/admin/forms/project-form.tsx`

1. **Basic information** — title, slug, tagline, summary, status
2. **Visual identity** — icon picker, cover image
3. **Metadata** — year, category, role, tech stack
4. **Links** — project URL, GitHub URL
5. **Hover preview** — challenge, solution, impact (with character counters)
6. **Display settings** — featured, display order, hover preview enabled
7. **Content** — existing Tiptap editor (unchanged)

### Live preview panel

`src/features/admin/forms/project-live-preview-panel.tsx`

Right-side sticky panel updates instantly from form state. No save required.

Shows: icon, title, tagline, metadata line, challenge, solution, impact.

### Cover image field

`src/components/admin/forms/cover-image-field.tsx`

- Aspect-ratio preview
- Upload to Supabase `public-assets` bucket
- Paste external image URL
- Open link + remove actions

Upload action: `src/lib/admin/actions/uploads.ts` → `uploadProjectCoverImage()`


`src/components/admin/forms/icon-picker.tsx`

- Searchable grid
- Keyboard-accessible option buttons
- Selected state highlight
- Instant icon preview

## Migration

`supabase/migrations/20250620100000_project_showcase_fields.sql`

- Adds all new nullable/defaulted columns
- Tightens challenge/solution/impact max length to 300
- Backfills `project_url` from `live_url`
- Backfills `display_order` from `created_at`
- Adds `idx_projects_display_order`

## Future extensibility

The CMS is now the source of truth for:

- Project card icons and taglines
- Listing metadata (year, category, role)
- Hover cards and GitHub-style previews
- Featured/ordered homepage sections
- Cover images for case study headers
- External links

Public showcase redesign can consume these fields without code changes to project content.

## Files

| Area | Path |
|------|------|
| Migration | `supabase/migrations/20250620100000_project_showcase_fields.sql` |
| Types | `src/types/database.ts` |
| Zod schema | `src/lib/admin/schemas/project.ts` |
| Actions | `src/lib/admin/actions/projects.ts` |
| Public queries | `src/lib/public/queries.ts` |
| Admin queries | `src/lib/admin/queries.ts` |
| Icon helper | `src/lib/icons/iconify.tsx` |
| Icon search | `src/lib/icons/search.ts` |
| Icon picker | `src/components/admin/forms/icon-picker.tsx` |
| Live preview | `src/features/admin/forms/project-live-preview-panel.tsx` |
| Project form | `src/features/admin/forms/project-form.tsx` |
