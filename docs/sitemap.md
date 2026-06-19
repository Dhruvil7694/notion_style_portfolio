# Site Map

This document defines all public and admin routes for the AI Engineer Portfolio. Each route includes its purpose, displayed content, and scalability considerations.

---

## Route Conventions

| Pattern | Meaning |
|---------|---------|
| `/` | Public marketing and discovery surface |
| `/admin/*` | Authenticated CMS and management surface |
| `[slug]` | Human-readable, SEO-friendly identifier (unique per content type) |
| Draft content | Never exposed on public routes; preview uses signed tokens or admin-only views |

---

## Public Routes

### `/` — Landing

**Purpose:** Primary entry point. Communicates identity, expertise, and navigation to all major content areas. Inspired by Notion's clarity and Linear's minimal hierarchy.

**Content displayed:**
- Hero: name, title (AI Engineer), value proposition, primary CTA (View Projects, Contact)
- Featured projects (2–4 curated items)
- Latest blog posts (3–5)
- Skills snapshot (top categories or tags)
- Experience highlight (current role or tenure summary)
- Social links and resume download CTA
- Optional: newsletter signup placeholder (Phase 8+)

**Future scalability:**
- Homepage sections become configurable via `Settings` (featured IDs, section order, visibility toggles)
- A/B test hooks via analytics events without route changes
- i18n: same route, locale prefix optional (`/en`, `/ja`) added in Phase 9+ without restructuring

---

### `/projects` — Project Index

**Purpose:** Browseable portfolio of engineering work, case studies, and AI/automation builds.

**Content displayed:**
- Filterable grid/list of published projects
- Filters: category, tech stack tags, year, featured flag
- Sort: featured first, then by `published_at` desc
- Each card: title, excerpt, cover image, tags, read time estimate

**Future scalability:**
- Pagination or infinite scroll (cursor-based for performance)
- Open Source Showcase (Phase 7): sub-filter or `/projects?type=open-source` without new route
- AI Demos (Phase 8): embed or link from project detail; demo metadata stored on project record

---

### `/projects/[slug]` — Project Detail

**Purpose:** Deep dive into a single project — problem, approach, results, and artifacts.

**Content displayed:**
- Title, cover media, published date
- Rich content (Tiptap JSON → rendered HTML)
- Tech stack tags, role, timeline
- Links: live demo, GitHub, related blog posts
- Optional: embedded demo iframe or video
- Related projects (same tags or manual relations)

**Future scalability:**
- Version history visible in admin only; public always shows latest published version
- Structured data (JSON-LD) for SEO generated from content model
- Comments or reactions deferred; architecture reserves `engagement` extension point

---

### `/research` — Research Index

**Purpose:** Showcase research interests, papers, experiments, and technical explorations.

**Content displayed:**
- List of research entries with type badges (note, experiment, publication, reading)
- Filters: topic, status (in-progress, published), date
- Summary cards with abstract/excerpt

**Future scalability:**
- Research Publications (Phase 9): new `publication` subtype or linked `Research` records with DOI/arXiv fields
- Public Notes (Phase 7): shared rendering pipeline; notes may surface here or at `/notes` later via settings redirect
- RSS/Atom feed for research updates

---

### `/automation` — Automation Index

**Purpose:** Highlight automation workflows, scripts, integrations, and agentic systems built or maintained.

**Content displayed:**
- Automation catalog with category (CI/CD, data, AI agents, tooling)
- Each item: title, description, stack, outcome metrics if available
- Links to related projects or blog write-ups

**Future scalability:**
- AI Demos may cross-link here when demo type is `automation`
- Future `/automation/[slug]` detail pages if index grows; slug route reserved in routing config now
- Webhook or status indicators for live automations (Phase 10+) via read-only API

---

### `/blogs` — Blog Index

**Purpose:** Long-form technical writing, tutorials, and thought leadership.

**Content displayed:**
- Chronological or featured-first list of published posts
- Tags, reading time, cover image
- Search input (client-side initially; server search Phase 6+)

**Future scalability:**
- Newsletter archive integration (Phase 8): `/blogs?series=newsletter` or dedicated tag
- Series/collections without new top-level routes
- Full-text search via Supabase Postgres or dedicated search service

---

### `/blogs/[slug]` — Blog Post Detail

**Purpose:** Read a single blog article with excellent typography (Vercel Docs / Stripe Docs inspiration).

**Content displayed:**
- Title, author, date, updated date, reading time
- Table of contents (auto-generated from headings)
- Rich body (Tiptap), code blocks with syntax highlighting
- Tags, related posts
- Optional: canonical URL, OG metadata

**Future scalability:**
- Draft preview via signed URL (`?preview=token`) for admin workflow
- Comments (Giscus/Utterances) optional plugin via Settings
- Multi-author support reserved in content model (`author_id` nullable → future)

---

### `/experience` — Experience & Career Timeline

**Purpose:** Structured career history complementing the resume PDF.

**Content displayed:**
- Reverse-chronological timeline of roles
- Each entry: company, title, dates, location, description, skills used, links
- Education summary section (or link to expanded education if list grows)
- Download resume CTA

**Future scalability:**
- Speaking Engagements (Phase 9): new section or merged timeline event type
- Export to JSON Resume schema for third-party integrations
- `/experience` remains aggregate view; detail pages not required initially

---

### `/contact` — Contact

**Purpose:** Lower friction for recruiters, collaborators, and readers to reach out.

**Content displayed:**
- Contact form (name, email, message, optional subject/type)
- Email and social links from Settings
- Optional: Calendly or booking link
- Spam protection (honeypot + rate limit; CAPTCHA if needed)

**Future scalability:**
- Form submissions stored in Supabase + email notification (Resend/SendGrid)
- CRM webhook integration via Settings
- No PII in client bundles; server actions or edge functions handle submission

---

## Admin Routes

All `/admin/*` routes require GitHub OAuth authentication. Unauthorized users redirect to `/admin/login` (or GitHub OAuth initiate). Role model: single admin initially; schema supports future `editor` role.

---

### `/admin` — Dashboard

**Purpose:** Operational hub after login. At-a-glance status of content and site health.

**Content displayed:**
- Counts: drafts vs published per content type
- Recent edits activity log
- Quick actions: New Blog, New Project, Edit Resume
- Storage usage summary
- Link to public site preview

**Future scalability:**
- Widget system: analytics summary, newsletter stats, broken link checker
- Customizable dashboard layout stored in admin preferences

---

### `/admin/projects` — Project Management

**Purpose:** CRUD for portfolio projects.

**Content displayed:**
- Data table: title, status, featured, updated_at, slug
- Actions: create, edit, duplicate, archive, delete
- Bulk: publish, unpublish, feature

**Future scalability:**
- Inline slug preview and SEO score
- Import from GitHub repo metadata (Phase 7 open source)
- Revision diff view between versions

---

### `/admin/blogs` — Blog Management

**Purpose:** CRUD for blog posts with rich editor.

**Content displayed:**
- List with status, tags, published date
- Tiptap editor with autosave
- Preview and publish workflow

**Future scalability:**
- Scheduled publish (`publish_at` field)
- Series management UI
- Newsletter "send as email" action (Phase 8)

---

### `/admin/experience` — Experience Management

**Purpose:** Manage work history entries shown on `/experience`.

**Content displayed:**
- Ordered list (drag reorder)
- Form: company, role, dates, description, skills, logo

**Future scalability:**
- Import from LinkedIn JSON export
- Merge with speaking engagements timeline

---

### `/admin/research` — Research Management

**Purpose:** CRUD for research entries.

**Content displayed:**
- List filtered by type and status
- Rich editor for findings; metadata for publications

**Future scalability:**
- BibTeX import
- Link to external DOI/arXiv

---

### `/admin/automation` — Automation Management

**Purpose:** CRUD for automation showcase entries.

**Content displayed:**
- Catalog list with categories and status
- Optional live status URL field for future health checks

**Future scalability:**
- Detail pages go live when count exceeds threshold (feature flag in Settings)

---

### `/admin/skills` — Skills Management

**Purpose:** Maintain canonical skill taxonomy used across projects, experience, and landing page.

**Content displayed:**
- Skill name, category, proficiency (optional), icon
- Usage count across content types

**Future scalability:**
- Skill merge/deduplication tools
- Endorsements or verification deferred

---

### `/admin/education` — Education Management

**Purpose:** Manage degrees, certifications, and courses.

**Content displayed:**
- Institution, degree, field, dates, description, credential URL

**Future scalability:**
- Cert expiration reminders on dashboard
- Display on `/experience` via configurable section

---

### `/admin/resume` — Resume Management

**Purpose:** Single source of truth for resume data and PDF generation.

**Content displayed:**
- Structured form mirroring resume sections (synced from Experience, Education, Skills)
- PDF preview and download
- Version history (admin only)
- Override fields for resume-specific wording

**Future scalability:**
- Multiple resume variants (e.g., "ML-focused", "Full-stack") via `variant` field
- JSON Resume export
- ATS-friendly plain text export

---

### `/admin/settings` — Site Settings

**Purpose:** Global configuration without code deploys.

**Content displayed:**
- Site metadata (title, description, OG image)
- Social links, contact email
- Feature flags (sections visibility, future modules)
- Analytics IDs
- SEO defaults

**Future scalability:**
- Webhook URLs, API keys (encrypted in Supabase Vault)
- Theme tokens (accent color, font) if needed beyond Tailwind config

---

## Reserved Future Routes (Not Phase 1–2)

These fit the architecture without breaking changes:

| Route | Phase | Notes |
|-------|-------|-------|
| `/notes` | 7 | Public Notes; may alias `/research?type=note` initially |
| `/newsletter` | 8 | Archive and subscribe |
| `/demos/[id]` | 8 | Standalone AI demo runner |
| `/talks` | 9 | Speaking engagements |
| `/open-source` | 7 | Optional dedicated index; else filter on `/projects` |

---

## Navigation Structure

```
Public Nav (primary)
├── Projects
├── Research
├── Automation
├── Blog
├── Experience
└── Contact

Admin Nav (sidebar)
├── Dashboard
├── Projects
├── Blogs
├── Experience
├── Research
├── Automation
├── Skills
├── Education
├── Resume
└── Settings
```

Footer repeats social links, resume download, and sitemap links for SEO.
