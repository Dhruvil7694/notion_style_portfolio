# Repository Folder Structure

This document describes the purpose of every directory in `src/`. Folders are created in Phase 2; feature implementations begin in Phase 3+.

```
src/
├── app/                    # Next.js App Router — routes, layouts, API handlers
├── components/
│   ├── ui/                 # shadcn/ui primitives (auto-generated via CLI)
│   ├── layout/             # Site chrome: header, footer, nav, admin shell
│   └── shared/             # Reusable presentational components
├── features/               # Domain modules (projects, blogs, admin, etc.)
├── lib/
│   ├── supabase/           # Supabase client factories (browser, server, admin)
│   ├── env/                # Typed environment validation (Zod)
│   ├── utils/              # Generic helpers (cn, dates, slugs, metadata)
│   └── constants/          # App-wide constants and enums
├── hooks/                  # Shared React hooks
├── types/                  # Shared TypeScript types
├── styles/                 # Supplemental global styles
└── config/                 # Feature extension points (analytics, search, etc.)
```

---

## `src/app/`

Next.js App Router entry point. Contains root layout, global styles import, and route segments.

| Planned segment | Phase | Purpose |
|-----------------|-------|---------|
| `(public)/` | 5 | Public portfolio routes |
| `admin/` | 4 | CMS admin dashboard |
| `api/` | 5+ | Route handlers (contact, webhooks, OG) |

Phase 2 includes only `layout.tsx`, `page.tsx`, and `globals.css`.

---

## `src/components/ui/`

shadcn/ui components installed via `npx shadcn add <component>`. Do not hand-edit unless customizing variants. The `button` component exists from Phase 2 initialization.

---

## `src/components/layout/`

Structural layout components shared across public and admin surfaces:

- Public header, footer, navigation
- Admin sidebar and top bar
- Route group wrappers

Empty in Phase 2.

---

## `src/components/shared/`

Cross-cutting UI that is not a shadcn primitive:

- Content cards, tag badges, empty states
- Tiptap renderer (Phase 4)
- SEO components

Empty in Phase 2.

---

## `src/features/`

Domain-driven modules. Each feature folder owns its components, hooks, actions, and types for one bounded context.

Planned features:

| Folder | Phase | Purpose |
|--------|-------|---------|
| `projects/` | 5 | Public project pages |
| `blogs/` | 5 | Blog listing and detail |
| `admin/` | 4 | CMS CRUD modules |
| `contact/` | 5 | Contact form |
| `resume/` | 5 | Resume display and PDF |

Empty in Phase 2.

---

## `src/lib/supabase/`

Supabase client factories only. See [README](../src/lib/supabase/README.md).

---

## `src/lib/env/`

Zod-validated environment variables split by runtime:

- `client.ts` — `NEXT_PUBLIC_*` vars (validated at import)
- `server.ts` — server-only vars via `getServerEnv()`

---

## `src/lib/utils/`

Generic, domain-agnostic utilities:

| Module | Purpose |
|--------|---------|
| `cn.ts` | Tailwind class merging |
| `date.ts` | date-fns formatting helpers |
| `slug.ts` | Slug generation and validation |
| `metadata.ts` | Next.js Metadata helpers |

---

## `src/lib/constants/`

Application constants: content statuses, pagination defaults, cache tags.

---

## `src/hooks/`

Shared React hooks (e.g., `useMediaQuery`, `useDebounce`). Empty in Phase 2.

---

## `src/types/`

Shared TypeScript types used across features. Domain entity types expand in Phase 3 when schema is defined.

---

## `src/styles/`

Supplemental CSS beyond `app/globals.css`. Primary theme tokens live in globals via Tailwind v4 + shadcn.

---

## `src/config/`

Documented extension points for cross-cutting concerns. Each file is a placeholder with JSDoc describing future implementation:

| Module | Phase | Purpose |
|--------|-------|---------|
| `analytics.ts` | 5 | Page views and custom events |
| `search.ts` | 6 | Full-text search |
| `storage.ts` | 4 | Supabase Storage helpers |
| `email.ts` | 5 | Resend integration |
| `feature-flags.ts` | 4+ | Toggle future modules |

---

## Root-level directories

| Path | Purpose |
|------|---------|
| `docs/` | Architecture and planning documentation (Phase 1) |
| `public/` | Static assets |
| `.husky/` | Git hooks |
| `supabase/` | Supabase CLI project root (Phase 3+) |

---

## `supabase/`

Supabase database and local development configuration. Empty placeholders in Phase 2; populated in Phase 3.

```
supabase/
├── migrations/    # Versioned SQL schema + RLS migrations
└── seeds/         # Development seed data scripts
```

### `supabase/migrations/`

Versioned SQL files applied in chronological order. Each migration is immutable once deployed.

**Phase 3 contents (planned):**
- Core content tables (projects, blogs, experience, etc.)
- Junction tables for skills and relations
- Row Level Security policies
- Full-text search indexes (Phase 6)

**Workflow:**
1. Create a new file: `supabase migration new <description>`
2. Write SQL for schema changes and RLS
3. Apply locally: `supabase db reset` or `supabase migration up`
4. Deploy: `supabase db push` or CI apply to remote project

Never edit a migration that has already been applied to production — create a new migration instead.

### `supabase/seeds/`

Optional SQL or script files for repeatable local development data. Used after migrations during `supabase db reset`.

**Rules:**
- Seeds are for local and staging environments only
- Never run seed scripts in production
- Keep seeds idempotent where possible

### Environment

Admin and migration tooling uses `SUPABASE_SECRET_KEY` (server-only). Public app reads use `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` with RLS.

See [`database-design.md`](./database-design.md) and [`database-workflow.md`](./database-workflow.md) for full schema and migration documentation.
