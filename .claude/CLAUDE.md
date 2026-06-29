@AGENTS.md

# Notion-Style Portfolio — Project Guide

Production-grade AI Engineer portfolio + CMS + knowledge base. Inspired by Notion / Linear / Vercel Docs / Stripe Docs. Single-admin (no public accounts).

## Stack

- **Framework:** Next.js 15 (App Router, Turbopack), React 19, TypeScript strict
- **Styling:** Tailwind CSS v4, shadcn/ui, framer-motion, lenis
- **Backend:** Supabase (PostgreSQL + Auth + Storage), RLS-first
- **Editor:** Tiptap 3 (JSONB in Postgres) — admin only, lazy load via `dynamic()`
- **AI:** Vercel AI SDK (`@ai-sdk/anthropic|openai|google|react`), LangChain/LangGraph; provider-agnostic with CMS-configurable routing + failover
- **Graphs:** `@joint/react`, `@xyflow/react`, `mermaid` (architecture diagrams + knowledge graph)
- **Validation:** Zod (env + content schemas)
- **Hosting:** Vercel (planned)

## Critical Rules

1. **Read Next.js 15 docs before writing route/server-action/cache code.** Breaking changes from training data. Source: `node_modules/next/dist/docs/`.
2. **Postgres is content source of truth** — not Git files.
3. **Admin is part of Next.js** — not a separate CMS product.
4. **Public reads go through RLS-safe paths** — published content only.
5. **Rich text = Tiptap JSON in JSONB** — never raw HTML in DB.
6. **Single admin via `ADMIN_EMAIL`** — no public user accounts.
7. **`SUPABASE_SECRET_KEY` is server-only** — never to client.
8. **AI keys in env only** — model selection lives in CMS (`/admin/ai-settings`).
9. **Citations as stream `data-*` parts** — not HTTP headers (Unicode safety).
10. **Server Actions over REST.** Add Route Handlers only when external consumers needed.

## Layout

```
src/
  app/             # Next.js App Router — thin routes only
  features/        # Domain modules (admin, job-fit, site-shell, portfolio, …)
  shared/          # ui, hooks, types, config, lib (supabase, auth, env, utils)
  middleware.ts    # Admin route auth gate
archive/           # Deprecated demos and example routes
supabase/migrations/
scripts/
docs/
```

## Commands

```
npm run dev          # next dev --turbopack
npm run dev:webpack  # fallback if turbopack breaks
npm run build
npm run typecheck    # tsc --noEmit
npm run lint / lint:fix
npm run format / format:check
npm run db:seed
npm run db:seed-case-study
npm run security:audit
```

Pre-commit: Husky → lint-staged → ESLint + Prettier on `*.{ts,tsx}`, Prettier on `*.{json,md,css,mjs}`.

## Style

- Prettier: **no semis, double quotes, 2-space indent, 80 col**
- Imports: auto-sorted (external → `@/` → relative) via `eslint-plugin-simple-import-sort`
- Use `@/` alias for internal imports — no deep relative paths
- TS strict + `noUncheckedIndexedAccess`; explicit return types on exported fns
- Server Components by default. Add `"use client"` only when needed
- New env vars → add to `.env.example` + validate in `src/lib/env/schema.ts`
- Commits: Conventional Commits (`feat(scope): ...`, `fix`, `docs`, `chore`, `refactor`, `test`, `style`)

## Roadmap Status

Phases 1–5 complete. Phase 6 (CMS CRUD) next per README; AI infrastructure work in Phase 17.5 active (`docs/ai-infrastructure.md`, `docs/portfolio-intelligence-layer.md`).

## Key Docs

- `docs/architecture.md` — layer boundaries, data flow, deployment
- `docs/technical-decisions.md` — stack rationale + alternatives rejected
- `docs/database-design.md` + `docs/database-workflow.md` — schema + migration commands
- `docs/admin-authorization.md` + `docs/authentication.md` — single-admin auth model
- `docs/cms-crud.md`, `docs/editor-architecture.md`, `docs/content-system.md` — admin/editor
- `docs/ai-infrastructure.md`, `docs/portfolio-intelligence-layer.md` — AI layer
- `docs/knowledge-graph-architecture.md`, `docs/interactive-architecture-system.md` — graph systems
- `docs/seo-architecture.md`, `docs/discovery-layer.md` — public discoverability
- `docs/roadmap.md` — phase plan
- `docs/folder-structure.md` — directory purposes

## Branch / Git

- Default branch: `master`. PR target: `main`.
- Feature branches: `feature/*`, `fix/*`, `docs/*` off `main`.

## Don't

- Edit applied migrations — create new one.
- Hand-edit `src/components/ui/*` (shadcn) unless variant change.
- Run seeds in production.
- Bypass RLS without explicit reason + audit trail.
- Add features from future phases in current-phase PRs.
