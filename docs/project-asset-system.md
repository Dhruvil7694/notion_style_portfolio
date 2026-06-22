# Project Asset System (Phase 11)

Visual storytelling for project case studies — assets embedded in the narrative, not on a separate gallery page.

## Asset fields

| Field | Type | Narrative placement |
|-------|------|---------------------|
| `cover_image` | URL | Below overview in the page header |
| `thumbnail` | URL | Project cards/lists (falls back to `cover_image`) |
| `architecture_image` | URL | Above the interactive System Architecture diagram |
| `demo_video_url` | URL | Results section (YouTube, Vimeo, MP4/WebM) |
| `gallery` | JSONB array | Typed images placed by convention |

Legacy `demo_images` is still read as a fallback (`type: screenshot`) and synced on save for backward compatibility.

## Gallery item schema

```json
{
  "url": "https://...",
  "type": "screenshot",
  "caption": "Optional caption",
  "alt": "Optional alt text"
}
```

### Gallery types

| Type | Public placement |
|------|------------------|
| `screenshot` | First item → Problem section (after prose) |
| `diagram` | Available for walkthrough carousel |
| `workflow` | System Walkthrough carousel |
| `dashboard` | System Walkthrough carousel |
| `research` | System Walkthrough carousel |
| `demo` | Results section + walkthrough carousel |
| `layout` | System Walkthrough carousel |

## Narrative layout

```
Header
├─ Overview prose
└─ Cover image

Problem
├─ Prose
└─ First screenshot gallery item

System Architecture
├─ Static architecture_image (optional)
└─ React Flow diagram

System Walkthrough
└─ Carousel (workflow, dashboard, demo, screenshot, layout, research)

Results
├─ Demo video embed (optional)
├─ First demo-type gallery item (optional)
└─ Results bullet list
```

## CMS

**Project assets** section:
- Cover image (upload + crop)
- Thumbnail URL
- Architecture image URL
- Demo video URL

**Project gallery** section (`ProjectGalleryField`):
- Upload image
- Drag reorder (up/down)
- Caption + alt text
- Image type selector

## Migration

`supabase/migrations/20250621120000_project_asset_management_fields.sql`

```sql
thumbnail text
demo_video_url text
architecture_image text
gallery jsonb
```

## Key files

- `src/lib/public/project-gallery.ts` — schema, parsers, narrative helpers
- `src/features/admin/forms/project-gallery-field.tsx` — CMS editor
- `src/components/public/case-study-figure.tsx` — inline figure
- `src/components/public/case-study-carousel.tsx` — walkthrough carousel
- `src/components/public/case-study-video.tsx` — video embed
- `src/components/public/project-case-study.tsx` — narrative layout

## Future extensions

- Thumbnail upload (currently URL-only; cover upload covers most cases)
- Architecture image upload shortcut in CMS
- Before/after paired gallery items
- GIF-specific handling and video upload to storage
- Per-section explicit placement overrides in CMS
