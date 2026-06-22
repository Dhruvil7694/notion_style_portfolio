# SEO Architecture

Infrastructure-only SEO layer for discoverability, social sharing, structured data, and future search indexing.

## Metadata Strategy

Public routes use server-side `generateMetadata()` via helpers in `src/lib/seo/metadata.ts`.

Global defaults live in `src/lib/seo/constants.ts`:

- Site title: `Dhruvil Patel`
- Default description for applied AI engineering work
- Shared keyword set for AI/RAG/automation topics

Route-specific builders:

| Route | Builder |
| --- | --- |
| `/` | `buildHomeMetadata` |
| `/projects` | `buildProjectsIndexMetadata` |
| `/projects/[slug]` | `buildProjectMetadata` |
| `/research` | `buildResearchIndexMetadata` |
| `/research/[slug]` | `buildResearchMetadata` |
| `/blog` | `buildBlogIndexMetadata` |
| `/blog/[slug]` | `buildBlogMetadata` |
| `/automations` | `buildAutomationsIndexMetadata` |
| `/automations/[slug]` | `buildAutomationMetadata` |
| `/experience` | `buildExperienceIndexMetadata` |
| `/contact` | `buildContactMetadata` |

Each builder emits:

- Title and description
- Canonical URL
- Keywords
- OpenGraph metadata
- Twitter `summary_large_image` cards

Project and content builders also use `seo_title` / `seo_description` from Supabase when present.

## Canonical Strategy

`src/lib/seo/canonical.ts` resolves the site URL from:

1. Supabase `site_settings.site_url`
2. Fallback `SITE_URL` environment variable

`generateCanonicalUrl()` builds absolute canonical URLs for every indexed route.

`(public)/layout.tsx` sets `metadataBase` so relative OG image paths resolve correctly.

## OpenGraph Generation

Typography-focused OG images are generated with `next/og` via `src/lib/seo/og-image.tsx`.

Routes:

- `/opengraph-image`
- `/projects/[slug]/opengraph-image`
- `/blog/[slug]/opengraph-image`
- `/research/[slug]/opengraph-image`
- `/automations/[slug]/opengraph-image`

Layout:

- Dark minimal background
- Eyebrow label (category / section)
- Content title
- Footer brand line

No screenshots are used in generated OG images.

## JSON-LD Architecture

Generators live in `src/lib/seo/jsonld.ts`.

Rendered through `src/components/seo/json-ld.tsx` as a single `@graph` payload per page.

Schemas:

- **Person** + **WebSite** on homepage
- **CreativeWork** on project detail pages
- **Article** on research, writing, and automation detail pages
- **BreadcrumbList** on all detail pages

## Sitemap Generation

`src/app/sitemap.ts` delegates to `src/lib/seo/sitemap.ts`.

Includes:

- Static public routes
- Published projects
- Published research, writing, and automations

Excludes:

- Draft content
- Admin and auth routes

## Robots.txt

`src/app/robots.ts` delegates to `src/lib/seo/robots.ts`.

Rules:

- Allow public portfolio routes
- Disallow `/admin` and `/admin/*`
- Reference `/sitemap.xml`

## Search Preparation

`src/lib/search/search-document.ts` normalizes published projects and content into `SearchDocument` records for future:

- Local search
- Vector search
- Semantic retrieval

No search UI is implemented in this phase.

## LLM Discoverability

`public/llms.txt` documents:

- Identity and expertise
- Primary site sections
- Content types
- Crawling notes
- Sitemap and robots locations

## Future Analytics Integration

Event definitions only: `src/lib/analytics/events.ts`

Prepared events:

- `project_view`
- `research_view`
- `article_view`
- `automation_view`
- `resume_download`
- `contact_click`

Providers are not integrated yet. Pages can emit these events later without schema changes.

## Validation Checklist

- Homepage metadata and Person/WebSite JSON-LD
- Project metadata, breadcrumbs, and OG image route
- Research/blog/automation metadata and Article JSON-LD
- Canonical URLs on all listed public routes
- `/sitemap.xml` generation
- `/robots.txt` generation
- `public/llms.txt` present
- Server-side metadata only (no client-side SEO logic)
