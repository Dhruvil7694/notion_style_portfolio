# AI Engineer Portfolio

A production-grade portfolio platform combining a personal website, knowledge base, CMS, resume management, and blog — inspired by Notion, Linear, Vercel Docs, and Stripe Docs.

## Architecture Summary

| Layer | Technology |
|-------|------------|
| Framework | Next.js 15 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS v4, shadcn/ui |
| Backend | Supabase (PostgreSQL, Auth, Storage) |
| Validation | Zod |
| Hosting | Vercel (planned) |

Full architecture documentation lives in [`docs/architecture.md`](./docs/architecture.md).

## Prerequisites

- Node.js 20+
- npm 10+
- Supabase project (for Phase 3+)

## Local Setup

```bash
# Clone the repository
git clone <repository-url>
cd notion-style-portfolio

# Install dependencies
npm install

# Configure environment
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

See [`.env.example`](./.env.example) for the full list.

| Variable | Required | Phase | Description |
|----------|----------|-------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | 2 | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Yes | 2 | Supabase publishable (client) key |
| `SITE_URL` | Yes | 2 | Canonical site URL |
| `SUPABASE_SECRET_KEY` | Phase 3+ | Admin operations (server-only) |
| `ADMIN_EMAIL` | Phase 4+ | Single administrator email |
| `RESEND_API_KEY` | Phase 5+ | Email notifications |

Environment variables are validated at runtime via Zod. Invalid configuration fails fast with descriptive errors.

## Development Workflow

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run start        # Start production server
npm run lint         # ESLint
npm run lint:fix     # ESLint with auto-fix
npm run typecheck    # TypeScript check
npm run format       # Prettier write
npm run format:check # Prettier check
```

### Git Hooks

Husky runs lint-staged on pre-commit:

- ESLint + Prettier on `*.{ts,tsx}`
- Prettier on `*.{json,md,css,mjs}`

## Project Structure

See [`docs/folder-structure.md`](./docs/folder-structure.md) for directory purposes.

## Supabase

Database schema, RLS policies, and seed data are managed via the Supabase CLI in the `supabase/` directory.

| Path | Purpose |
|------|---------|
| `supabase/migrations/` | Versioned SQL migrations applied in order |
| `supabase/seeds/` | Development seed scripts for local/staging data |

See [`docs/database-design.md`](./docs/database-design.md) for schema reference, [`docs/database-workflow.md`](./docs/database-workflow.md) for migration commands, [`docs/authentication.md`](./docs/authentication.md) for admin login, and [`docs/admin-authorization.md`](./docs/admin-authorization.md) for authorization rules.

## Roadmap

Implementation phases are documented in [`docs/roadmap.md`](./docs/roadmap.md).

| Phase | Status |
|-------|--------|
| 1 — Architecture & Planning | Complete |
| 2 — Foundation & Infrastructure | Complete |
| 3 — Content Layer & Database | Complete |
| 4 — Admin Authentication | Complete |
| 5 — Admin Dashboard Shell | Complete |
| 6 — CMS CRUD & Editors | Next |

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md).
