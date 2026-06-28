# SEO Audit Engine — Design Spec

**Date:** 2026-06-28  
**Phase:** SEO/AEO/GEO — Part A (Audit Engine)  
**Status:** Approved

---

## Goal

Score every published project and content item against real SEO quality criteria. Surface actionable failures in an admin dashboard. Allow inline quick-fix of `seo_title` / `seo_description` with one-click revalidation. Target keyword: "AI Engineer" / "Applied AI Engineer".

---

## Scope

- New `/admin/seo` page under Analytics nav group
- New audit library `src/features/seo/lib/audit/`
- Per-item detail drawer with rule breakdown + inline quick-edit
- No new DB table — reads `projects` + `content`, writes to existing `seo_title`/`seo_description` columns
- No external API calls in this phase (keyword research is Phase B)

---

## Scoring System

### Combined Score

`final_score = round((earned_points / max_points) * 100)`

Two rule sets run against each item. Results merged into one score.

---

### Rule Set A — Completeness (existing, carried over)

These already exist in `src/features/admin/lib/content-health/`. We re-use their output as input to the combined score rather than duplicating logic.

**Projects max: 100 pts** (15 rules — see content-health/rules.ts)  
**Content max: 56 pts** (8 rules — see content-health/rules.ts)

---

### Rule Set B — SEO Quality (new)

Applied to both projects and content unless noted.

| Rule ID               | Label                         | Points | Pass condition                                                                |
| --------------------- | ----------------------------- | ------ | ----------------------------------------------------------------------------- |
| `seo_title_length`    | SEO title length              | 8      | `seo_title` exists AND 30–60 chars                                            |
| `seo_desc_length`     | SEO description length        | 8      | `seo_description` exists AND 120–160 chars                                    |
| `seo_title_keyword`   | Target keyword in title       | 10     | `seo_title` contains "AI Engineer" or "Applied AI" (case-insensitive)         |
| `seo_desc_keyword`    | Target keyword in description | 8      | `seo_description` contains "AI Engineer" or "Applied AI" (case-insensitive)   |
| `summary_length`      | Summary/excerpt length        | 6      | summary or excerpt ≥ 80 chars                                                 |
| `faq_min_count`       | FAQ minimum items             | 6      | `faq` array has ≥ 3 entries                                                   |
| `faq_answer_quality`  | FAQ answer depth              | 5      | every FAQ answer ≥ 40 chars (or no FAQ — rule skipped if faq empty)           |
| `ai_summary_depth`    | AI summary length             | 5      | `ai_summary` ≥ 100 chars                                                      |
| `slug_quality`        | Slug hygiene                  | 5      | slug is lowercase, hyphenated, no stop words ("the","a","an"), no underscores |
| `tags_or_stack`       | Tags / tech stack             | 5      | `tags` or `tech_stack` has ≥ 2 items                                          |
| `key_takeaways_count` | Key takeaways                 | 5      | `key_takeaways` has ≥ 2 items                                                 |

**Max Rule Set B: 71 pts**

### Combined Totals

| Item type | Set A max | Set B max | Combined max |
| --------- | --------- | --------- | ------------ |
| project   | 100       | 71        | 171          |
| content   | 56        | 71        | 127          |

Score normalized to 100 for display.

### Health Bands

| Band     | Score | Badge |
| -------- | ----- | ----- |
| Healthy  | ≥ 80  | green |
| Warning  | 50–79 | amber |
| Critical | < 50  | red   |

---

## Admin Dashboard — `/admin/seo`

### Page layout

```
PageHeader: "SEO Audit"  [Run audit ↻]  [Export CSV]
Description: "SEO quality scores across all published content."

StatCards (4):  Avg Score | Healthy | Warning | Critical

Filter row:  [All types ▾]  [All bands ▾]  [Search by title]

AdminDataTable:
  Title | Type | Score bar | Band badge | Issues count | Fix →
  (sorted by score asc — worst first)

Pagination: 20 per page
```

### Fix → drawer (right sheet)

Same floating glass style as daily-breakdown and query-log sheets:

- `!inset-y-3 !right-3 rounded-2xl bg-background/60 backdrop-blur-xl`
- Header: `SEO Audit | [type icon] [title]  ‹ › ×`
- Prev/next navigate through sorted list
- Body sections:
  1. **Score summary** — donut/number + band badge
  2. **Rule checklist** — each rule: ✓/✗ icon, label, points earned/max, current value shown inline, specific fix hint
  3. **Quick-edit fields** — `seo_title` (char counter 0/60), `seo_description` (char counter 0/160) — Save button triggers DB write + path revalidation
  4. **FAQ count** — shows count, link to full editor

---

## File Structure

```
src/features/seo/lib/audit/
  rules.ts          — SeoAuditRule[] definitions (id, label, points, evaluator)
  scorer.ts         — runSeoScorer(item, type) → SeoAuditScore
  engine.ts         — runSeoAudit() → SeoAuditResult (fetches all published, runs scorer)
  suggestions.ts    — getSuggestion(ruleId, currentValue) → string (human-readable fix hint)

src/app/admin/(protected)/seo/
  page.tsx          — Server Component, awaits runSeoAudit(), passes to SeoAuditPanel
  loading.tsx       — Skeleton

src/features/admin/components/
  seo-audit-panel.tsx   — "use client" — table, filters, pagination, opens drawer
  seo-audit-drawer.tsx  — "use client" — floating sheet, rule checklist, quick-edit, save

src/app/api/admin/seo/save/route.ts
  — POST { table, id, seo_title, seo_description }
  — Validates lengths, writes to DB via admin client
  — Calls revalidatePath for the affected public route
  — Returns updated score so drawer refreshes without full page reload
```

---

## Data Flow

```
page.tsx (Server)
  └── runSeoAudit()
        ├── fetchPublishedProjects()   → supabase admin client
        ├── fetchPublishedContent()    → supabase admin client
        ├── scoreProject(row)          → runSeoScorer(row, "project")
        └── scoreContent(row)          → runSeoScorer(row, "content")
              └── evaluates Rule Set A + Rule Set B rules
              └── returns SeoAuditScore { id, title, slug, type, score, checks[], missing[], suggestions[] }

SeoAuditPanel (Client)
  └── filters + pagination in-memory (dataset small — max ~50 items)
  └── opens SeoAuditDrawer with selected item + full list for prev/next

SeoAuditDrawer (Client)
  └── local state: editTitle, editDesc
  └── Save → POST /api/admin/seo/save
        └── returns { newScore } → optimistic update in drawer
```

---

## Admin Navigation

Add to "Analytics" group in `src/shared/config/admin-navigation.ts`:

```typescript
{
  title: "SEO Audit",
  href: "/admin/seo",
  icon: SearchCheck,
  description: "SEO quality scores and fix suggestions"
}
```

---

## Types

```typescript
type SeoRuleResult = {
  ruleId: string
  label: string
  passed: boolean
  earned: number
  max: number
  currentValue: string | null // shown in drawer for context
  suggestion: string | null // null if passed
}

type SeoAuditScore = {
  id: string
  title: string
  slug: string
  type: "project" | "blog" | "research" | "automation"
  score: number // 0–100 normalized
  earnedPoints: number
  maxPoints: number
  band: "healthy" | "warning" | "critical"
  checks: SeoRuleResult[]
  issueCount: number
  publicPath: string // e.g. "/projects/my-ai-project"
}

type SeoAuditResult = {
  items: SeoAuditScore[]
  avgScore: number
  healthyCount: number
  warningCount: number
  criticalCount: number
  totalCount: number
  auditedAt: string
}
```

---

## API Route — POST `/api/admin/seo/save`

**Request body:**

```typescript
{ table: "projects" | "content", id: string, seo_title: string, seo_description: string }
```

**Validation:**

- `seo_title`: 1–70 chars
- `seo_description`: 1–160 chars
- `id`: valid UUID

**Response:**

```typescript
{ ok: true, newScore: number }
```

**Revalidation:** calls `revalidatePath(publicPath)` for the affected item's route.

**Auth:** server action checks admin session via `getUser()` before any DB write.

---

## Constraints

- No external keyword APIs in this phase
- `runSeoAudit()` is `server-only` — never called from client
- Quick-edit saves only `seo_title` / `seo_description` — full content editing stays in existing CMS editors
- Export CSV is a client-side download from in-memory data (no server endpoint needed)
- Rule Set A re-uses existing completeness scoring output — do not duplicate DB queries

---

## Success Criteria

1. `/admin/seo` loads and shows all published items with scores
2. Worst items appear first (ascending score sort)
3. Drawer opens per item, shows each rule ✓/✗ with current value + fix hint
4. Quick-edit saves `seo_title`/`seo_description`, drawer shows updated score without page reload
5. Revalidation fires so public page picks up new metadata on next request
6. Export CSV downloads a file with: title, type, score, band, issue count, seo_title, seo_description
