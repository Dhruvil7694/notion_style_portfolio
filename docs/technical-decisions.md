# Technical Decisions

This document records technology choices, rationale, tradeoffs, and alternatives considered. Decisions are oriented toward a production-grade, maintainable solo-developer portfolio that can grow without re-architecture.

---

## Decision Summary

| Area | Choice | Status |
|------|--------|--------|
| Framework | Next.js 15 (App Router) | Approved |
| Language | TypeScript | Approved |
| Styling | Tailwind CSS + shadcn/ui | Approved |
| Backend / DB | Supabase (PostgreSQL) | Approved |
| Auth | Email/password via Supabase Auth (single admin) | Approved |
| Storage | Supabase Storage | Approved |
| Editor | Tiptap | Approved |
| Hosting | Vercel | Approved |
| PDF Generation | `@react-pdf/renderer` or Puppeteer (TBD Phase 4) | Pending spike |

---

## Frontend

### Next.js 15

**Why selected:**
- App Router provides Server Components, Server Actions, and streaming — ideal for SEO-heavy public pages and form mutations without a separate API layer.
- First-class Vercel deployment aligns with target hosting.
- Built-in ISR/on-demand revalidation matches CMS publish workflow.
- Large ecosystem and documentation (Vercel Docs inspiration is meta-aligned).

**Tradeoffs:**
- App Router learning curve and caching semantics require discipline.
- Heavy admin editor bundles need code-splitting (`dynamic()` for Tiptap).
- Vendor coupling to Vercel for optimal DX (acceptable for this project).

**Alternatives considered:**

| Alternative | Rejected because |
|-------------|------------------|
| Remix | Strong choice; less alignment with Vercel ISR docs patterns and user's stated stack |
| Astro + React islands | Excellent for content sites; admin CMS would still need a heavy React app — split complexity |
| Vite + SPA | Poor default SEO; would require separate SSR setup |
| Nuxt/Vue | User stack specifies React ecosystem |

---

### TypeScript

**Why selected:**
- Catches schema mismatches between content model and UI early.
- Superior IDE support for large admin forms and Tiptap typing.
- Industry standard for production Next.js apps.

**Tradeoffs:**
- Slightly slower initial development vs JavaScript.
- Tiptap/ProseMirror types can be verbose.

**Alternatives considered:** JavaScript (rejected for long-term maintainability at this scope).

---

### Tailwind CSS

**Why selected:**
- Rapid iteration for Notion/Linear-inspired minimal UI.
- Design tokens via `tailwind.config` support consistent spacing and typography.
- Pairs naturally with shadcn/ui copy-paste components.

**Tradeoffs:**
- Class-heavy JSX; mitigated by `cn()` helper and component extraction.
- Not ideal for long prose unless `prose` plugin configured (required for blog).

**Alternatives considered:**

| Alternative | Rejected because |
|-------------|------------------|
| CSS Modules | More boilerplate for design-system-scale UI |
| Styled Components | Runtime cost; less aligned with Server Components defaults |
| Chakra/MUI | Heavier opinion; harder to match Notion/Linear aesthetic |

---

### shadcn/ui

**Why selected:**
- Accessible Radix-based primitives (dialogs, dropdowns, forms for admin).
- Components live in repo — full customization without package lock-in.
- Matches Stripe Docs-style polished admin patterns.

**Tradeoffs:**
- Manual updates when upstream shadcn changes.
- Initial setup time for theme tokens.

**Alternatives considered:** Radix raw (more work), Ant Design (wrong aesthetic), DaisyUI (less control).

---

## Backend & Data

### Supabase (PostgreSQL)

**Why selected:**
- Single platform for Postgres, Auth, Storage, and optional Edge Functions.
- Row Level Security enforces public vs admin access at database level — defense in depth.
- Generous free tier for portfolio scale; clear upgrade path.
- Realtime available if admin collaboration needed later.

**Tradeoffs:**
- RLS policies must be carefully tested; mistakes can leak data.
- Complex queries may need RPC functions or views.
- Vendor lock-in to Supabase API patterns (mitigated: standard Postgres underneath).

**Alternatives considered:**

| Alternative | Rejected because |
|-------------|------------------|
| Firebase | Weaker relational model for complex content relations |
| PlanetScale + Clerk + S3 | Three vendors; more integration overhead for solo project |
| Self-hosted Postgres + custom auth | Ops burden disproportionate to scope |
| Sanity/Contentful | External CMS less flexible for resume PDF, custom admin flows |
| Prisma + raw Postgres | Valid; Supabase includes auth/storage and hosted Postgres |

---

### Backend Pattern: Server Actions over REST API

**Why selected:**
- Colocate mutations with Next.js routes; fewer endpoints to maintain.
- Type-safe end-to-end with TypeScript.
- Sufficient for single-admin CMS and contact form.

**Tradeoffs:**
- Not ideal if mobile app or third-party API consumers needed later (can add Route Handlers then).
- Testing requires Next.js test utilities.

**Alternatives considered:** tRPC (added complexity), separate Express API (unnecessary deployment unit).

---

## Authentication

### Email/password admin auth via Supabase Auth

**Why selected:**
- Single administrator; no need for OAuth or multi-user auth.
- Supabase Auth handles sessions, refresh, and JWT.
- `ADMIN_EMAIL` restricts app-level admin access.

**Tradeoffs:**
- Admin user must be created manually in Supabase Dashboard.
- Password rotation is manual.

**Alternatives considered:**

| Alternative | Rejected because |
|-------------|------------------|
| GitHub OAuth | Removed — unnecessary complexity for one admin |
| Email magic link | Less control for single fixed admin account |
| NextAuth standalone | Redundant when Supabase Auth included |
| Static admin password in env | Insecure; bypasses Supabase session model |

---

## Storage

### Supabase Storage

**Why selected:**
- Integrated with same project as Auth and DB.
- Signed upload URLs for secure editor uploads.
- Public bucket URLs for CDN-served assets.

**Tradeoffs:**
- Image transformation not as rich as Cloudinary (Next.js Image component compensates).
- Egress costs at very high traffic (unlikely for portfolio).

**Alternatives considered:** AWS S3 + CloudFront (ops overhead), Vercel Blob (another vendor), Uploadthing (good but adds dependency).

---

## Editor

### Tiptap

**Why selected:**
- Headless ProseMirror wrapper — full UI control for Notion-like editing.
- JSON document storage maps cleanly to JSONB in Postgres.
- Extensions for code blocks, images, tables, task lists (research notes).
- Active ecosystem and React bindings.

**Tradeoffs:**
- Must define and enforce document schema to prevent XSS.
- Bundle size; lazy-load editor in admin only.
- Markdown import/export requires additional extensions.

**Alternatives considered:**

| Alternative | Rejected because |
|-------------|------------------|
| MDX files in repo | No admin UI for non-technical editing; harder CMS workflow |
| Lexical | Viable; smaller ecosystem for portfolio-specific examples |
| Plate | Built on Tiptap but extra abstraction layer |
| Sanity Portable Text | Tied to Sanity CMS |
| Editor.js | Block model less suited to long-form docs style |

---

## Search

### Postgres Full-Text Search (Primary)

**Why selected:**
- No additional infrastructure for initial scale.
- Content already in Postgres; `tsvector` + GIN indexes sufficient for hundreds/thousands of docs.

**Tradeoffs:**
- Typo tolerance and faceting weaker than dedicated engines.
- Ranking tuning requires Postgres expertise.

**Alternatives considered:** Meilisearch/Algolia (defer to Phase 6+ if needed), client-only Fuse.js (insufficient for large bodies).

---

## Analytics

### Vercel Analytics or Plausible (TBD)

**Why selected:**
- Privacy-friendly, lightweight, no cookie banner in many jurisdictions.
- Vercel Analytics zero-config if hosted on Vercel.

**Tradeoffs:**
- Less feature-rich than Google Analytics.
- Custom events may need additional setup.

**Alternatives considered:** GA4 (privacy/heavy), PostHog (overkill initially).

---

## Email (Phase 5)

### Resend (Recommended)

**Why selected:**
- Simple API for contact notification and future newsletter.
- Good DX for Next.js Route Handlers.

**Tradeoffs:**
- Another vendor and API key to manage.

**Alternatives considered:** SendGrid, AWS SES, Supabase Edge + SMTP.

---

## PDF Resume Generation (Phase 4 — Spike Required)

**Options:**

| Option | Pros | Cons |
|--------|------|------|
| `@react-pdf/renderer` | React components, no headless browser | Layout limitations |
| Puppeteer/Playwright | Pixel-perfect HTML→PDF | Heavier, serverless timeout risks |
| LaTeX | Professional typography | Non-developer-friendly edits |

**Recommendation:** Start with `@react-pdf/renderer` for serverless compatibility; fall back to Puppeteer on dedicated route if layout insufficient.

---

## Testing Strategy (Phase 2+)

| Layer | Tool |
|-------|------|
| Unit | Vitest |
| Component | React Testing Library |
| E2E | Playwright (admin publish flow) |
| RLS | Supabase local + policy tests |

---

## CI/CD

- **Git push → Vercel preview** for every PR
- **Main branch → production**
- **Supabase migrations** applied via CLI in CI or manual initially
- **Lint:** ESLint + Prettier
- **Typecheck:** `tsc --noEmit` in CI

---

## Environment Variables

| Variable | Exposure | Purpose |
|----------|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Public | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Public | Client-side Supabase access (RLS protected) |
| `SUPABASE_SECRET_KEY` | Server only | Admin mutations bypassing RLS where needed |
| `ADMIN_EMAIL` | Server only | Single administrator email |
| `RESEND_API_KEY` | Server only | Email Phase 5 |

---

## Key Architectural Invariants

These decisions should not change without explicit replan:

1. **Postgres is the content source of truth** — not Git files for primary content.
2. **Admin is part of Next.js** — not a separate CMS product.
3. **Public reads go through RLS-safe paths** — published content only.
4. **Rich text is Tiptap JSON** — not raw HTML in database.
5. **Admin auth only** — no public user accounts; single `ADMIN_EMAIL`.

---

## Open Questions (Resolve in Phase 2)

1. Supabase preview branches vs single dev project?
2. Final PDF library after Phase 4 spike?
3. Plausible self-hosted vs Vercel Analytics only?
4. Image optimization: Supabase transforms vs Next.js remote patterns only?
