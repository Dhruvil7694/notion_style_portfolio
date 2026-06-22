# Project Case Study System

Structured engineering case studies for project detail pages — separate from marketing copy and blog-style content.

## Schema

Case study fields live on the `projects` table alongside existing showcase and preview columns.

| Field | Type | Purpose |
|-------|------|---------|
| `overview` | `text` | Executive summary (max 500 chars in CMS) |
| `problem` | `text` | Pain, impact, why it mattered |
| `why_built` | `text` | Motivation and reasoning |
| `approach` | `text[]` | Ordered solution steps |
| `ai_design` | `jsonb` | AI system node flow — `[{ "label": "..." }]` |
| `architecture` | `jsonb` | Architecture node flow — `[{ "label": "..." }]` |
| `challenges` | `jsonb` | `[{ "challenge": "...", "solution": "..." }]` |
| `results` | `text[]` | Outcomes |
| `learnings` | `text[]` | Engineering insights |
| `metrics` | `jsonb` | Impact metrics — `[{ "label", "value" }]` |
| `tradeoffs` | `jsonb` | Engineering decisions — `[{ "decision", "tradeoff" }]` |
| `my_contribution` | `text[]` | Personal ownership bullets |
| `tech_stack_groups` | `jsonb` | Categorized stack — `[{ "category", "items[]" }]` |
| `timeline` | `jsonb` | Optional milestones — `[{ "period", "title", "description?" }]` |
| `demo_images` | `jsonb` | Optional screenshots — `[{ "url", "caption?", "alt?" }]` |
| `content` | `jsonb` | Rich Tiptap `ContentDocument` (supporting detail) |

### Migrations

1. `20250620120000_project_case_study_fields.sql` — initial text-based columns
2. `20250620140000_project_case_study_type_migration.sql` — converts to typed arrays/JSON with data backfill from legacy text and Mermaid sources
3. `20250620150000_project_detail_v2_fields.sql` — metrics, tradeoffs, contribution, categorized stack, timeline, demo images

## CMS Architecture

The admin project form (`src/features/admin/forms/project-form.tsx`) is split into dedicated sections:

- **Basic information** — title, slug, tagline, summary, status
- **Case study** — overview, problem, why built
- **Metrics** — `MetricsField`
- **Approach** — `StepBuilderField` (add / remove / reorder)
- **My contribution** — `BulletListField`
- **AI design flow** — `NodeFlowField`
- **Architecture flow** — `NodeFlowField`
- **Tech stack categories** — `TechStackGroupsField` (flattens to `tech_stack` on save)
- **Challenges** — `ChallengesField`
- **Tradeoffs** — `TradeoffsField`
- **Results** — `BulletListField`
- **Learnings** — `BulletListField`
- **Timeline** — `TimelineField` (optional)
- **Demo images** — `DemoImagesField` with upload (optional)
- **Rich content** — Tiptap editor for supplementary detail

Form validation is handled by `projectFormSchema` in `src/lib/admin/schemas/project.ts`. Server actions in `src/lib/admin/actions/projects.ts` persist arrays and JSON directly — empty arrays are stored as `null`.

### Field components

| Component | Path | Storage |
|-----------|------|---------|
| `StepBuilderField` | `src/features/admin/forms/step-builder-field.tsx` | `approach: string[]` |
| `NodeFlowField` | `src/features/admin/forms/node-flow-field.tsx` | `ai_design`, `architecture` |
| `BulletListField` | `src/features/admin/forms/bullet-list-field.tsx` | `results`, `learnings` |
| `ChallengesField` | `src/features/admin/forms/challenges-field.tsx` | `challenges` |
| `MetricsField` | `src/features/admin/forms/metrics-field.tsx` | `metrics` |
| `TradeoffsField` | `src/features/admin/forms/tradeoffs-field.tsx` | `tradeoffs` |
| `TechStackGroupsField` | `src/features/admin/forms/tech-stack-groups-field.tsx` | `tech_stack_groups` |
| `TimelineField` | `src/features/admin/forms/timeline-field.tsx` | `timeline` |
| `DemoImagesField` | `src/features/admin/forms/demo-images-field.tsx` | `demo_images` |

No raw JSON editing is exposed in the CMS.

## Rendering System

Public project pages render via `ProjectCaseStudy` (`src/components/public/project-case-study.tsx`):

1. Breadcrumbs, metadata, title, tagline, overview
2. **Metrics band** — `MetricsGrid` (when present)
3. Problem
4. Why I Built This
5. Approach — vertical numbered flow
6. My Contribution — bullet list
7. AI Design Flow — `EngineeringFlow`
8. Architecture Flow — `EngineeringFlow`
9. Tech Stack — `TechStackCategories` (grouped; falls back to flat `tech_stack`)
10. Challenges — side-by-side challenge → solution cards
11. Engineering Tradeoffs — decision + rationale blocks
12. Results — bullet list
13. Key Learnings — bullet list
14. Timeline — optional vertical timeline
15. Screenshots — optional `DemoGallery`
16. Rich content — `RichContentRenderer` when blocks exist
17. Related projects

Parsing helpers live in `src/lib/public/project-case-study.ts`:

- `parseStringArray()` — `text[]` columns
- `parseFlowNodes()` — JSON node arrays with Zod validation
- `parseProjectChallenges()` — challenge objects

### Engineering Flow System

`EngineeringFlow` (`src/components/public/engineering-flow.tsx`) renders a vertical rail with indexed nodes — used for both AI Design Flow and Architecture Flow sections.

```
[ Research Agent ]
        ↓
[ Validation Agent ]
        ↓
[ Writer Agent ]
```

Styling uses thin borders, muted backgrounds, and no color-coded diagram libraries. The same component powers admin previews in `NodeFlowField`.

### Design tokens

- Max width: `760px`
- Section spacing: `4rem` (64px)
- Section headings: `24px`, weight `600`
- Body text: `16px`, line-height `1.8`
- Title: `clamp(2.25rem, 5vw, 3.5rem)`

Sections are always visible (no accordions). Scroll progress and smooth scrolling from the public layout are preserved.

## Future Diagram Extensions

The current node model is intentionally minimal:

```json
[{ "label": "Research Agent" }, { "label": "Writer Agent" }]
```

Possible extensions without breaking existing data:

| Extension | Approach |
|-----------|----------|
| Branching flows | Add optional `edges: [{ from, to }]` alongside nodes |
| Node metadata | Extend nodes with `{ label, type?, description? }` |
| Rich content diagrams | Keep using `architecture_diagram` blocks inside `content` for complex SVG layouts |
| Interactive diagrams | Client component with expand/collapse per node — opt-in per project |

Migration path: add nullable JSON columns or version the node schema; `parseFlowNodes()` already validates with Zod and ignores unknown fields safely when schema is extended.

## Related Files

- Migration: `supabase/migrations/20250620140000_project_case_study_type_migration.sql`
- Types: `src/types/database.ts`
- Zod schema: `src/lib/admin/schemas/project.ts`
- Seed script: `scripts/seed-project-case-study-fields.mjs`
- Page route: `src/app/(public)/projects/[slug]/page.tsx`
