# Repository Folder Structure

Feature-based architecture for the Notion-style portfolio. Routes stay in `src/app/` (Next.js App Router requirement); domain code lives in `src/features/`; cross-cutting infrastructure in `src/shared/`.

```
src/
├── app/                          # Next.js routes only — thin pages that import from features
│   ├── (public)/                 # Public portfolio pages
│   ├── admin/                    # CMS admin
│   ├── api/                      # Route handlers (chat, copilot, job-fit, etc.)
│   ├── layout.tsx, globals.css
│   ├── sitemap.ts, robots.ts
│   └── agents.json, llms.txt, agent-instructions.md
│
├── features/                     # Domain modules (components + lib + hooks per feature)
│   ├── admin/                    # CMS shell, CRUD forms, server actions, schemas
│   ├── ai/                       # LLM providers, prompts, retrieval, usage tracking
│   ├── ai-assistant/             # Public portfolio chat UI
│   ├── ai-first/                 # AI-first landing page components
│   ├── about/                    # About page + snake game
│   ├── automations/              # Automation showcase
│   ├── contact/                  # Contact section components
│   ├── content/                  # TipTap editor, rich content blocks, serializer
│   ├── copilot/                  # Admin LangGraph copilot
│   ├── deployment/               # Launch readiness checks
│   ├── diagrams/                 # Architecture diagram (React Flow / Joint)
│   ├── discovery/                # Site search, explore, indexer
│   ├── experience/               # Work history pages
│   ├── home/                     # Homepage sections and previews
│   ├── job-fit/                  # JD matching UI, PDF export, analytics
│   ├── knowledge-base/           # Stack, concepts, expertise, technology hubs
│   ├── personalization/          # Visitor interest signals and personalization
│   ├── portfolio/                # Shared public data layer (queries, settings, meta)
│   ├── projects/                 # Project listing, case studies, diagrams
│   ├── research/                 # Research articles
│   ├── resume/                   # Resume preview
│   ├── seo/                      # Metadata, JSON-LD, sitemap, agent discovery
│   ├── site-shell/               # Header, footer, dock, theme, layout chrome
│   └── writing/                  # Blog / writing list components
│
├── shared/                       # Cross-feature infrastructure
│   ├── ui/                       # shadcn/ui primitives
│   ├── components/               # Generic shared UI (error-alert)
│   ├── hooks/                    # Shared React hooks
│   ├── types/                    # Database types, shared TS types
│   ├── config/                   # Feature flags, analytics, email, navigation
│   ├── assets/                   # Static images (logo, profile)
│   ├── styles/                   # Supplemental CSS
│   └── lib/                      # supabase, auth, env, security, utils, analytics
│
├── middleware.ts
├── instrumentation.ts
└── instrumentation-client.ts
```

## Feature folder convention

Each feature follows a consistent internal layout where needed:

```
features/{feature-name}/
├── components/       # React components for this feature
├── hooks/              # Feature-specific hooks (optional)
├── lib/                # Server logic, queries, utilities (optional)
├── types/              # Feature types (optional)
└── constants/          # Feature constants (optional)
```

Not every subfolder is required — small features may only have `components/`.

## `src/app/`

Thin routing layer. Pages import from `@/features/*` and `@/shared/*`. No business logic in route files when avoidable.

## `src/shared/`

Code used by two or more features: UI primitives, Supabase clients, auth, env validation, generic utils.

## Root-level directories

| Path        | Purpose                                                 |
| ----------- | ------------------------------------------------------- |
| `docs/`     | Architecture and planning documentation                 |
| `archive/`  | Deprecated demos, examples, old checklists              |
| `scripts/`  | DB seed, audits, migration utilities                    |
| `public/`   | Static assets served by Next.js                         |
| `supabase/` | Migrations, seeds, CLI config                           |
| `config/`   | _(optional future)_ — lint-staged, etc. if consolidated |

## Import aliases

Use `@/` prefix (maps to `src/`):

- `@/features/{name}/components/...`
- `@/features/{name}/lib/...`
- `@/shared/ui/...`
- `@/shared/lib/...`
- `@/shared/hooks/...`
- `@/shared/types/...`
- `@/shared/config/...`
