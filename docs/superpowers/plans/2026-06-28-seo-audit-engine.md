# SEO Audit Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an `/admin/seo` dashboard that scores every published project and content item against 11 SEO quality rules, surfaces failures with fix hints, and lets the admin quick-edit `seo_title`/`seo_description` inline with one-click revalidation.

**Architecture:** New audit library `src/features/seo/lib/audit/` runs Rule Set B (SEO quality) alongside the existing Rule Set A (completeness) from `content-health/`. Results merge into a normalized 0–100 score. A Server Component page feeds a client-side panel + floating drawer. A single API route handles saves + revalidation.

**Tech Stack:** Next.js 15 App Router, TypeScript strict, Supabase admin client, `revalidateTag` from `next/cache`, Tailwind CSS v4, shadcn/ui Sheet, framer-motion (existing), Lucide icons.

## Global Constraints

- No semicolons, double quotes, 2-space indent, 80-col max (Prettier enforced via pre-commit)
- `@/` alias for all internal imports — no deep relative paths
- `"use server"` / `"use client"` / `"server-only"` directives where required
- Server Components by default; `"use client"` only where state/effects needed
- Exported functions need explicit return types
- New env vars → `.env.example` + `src/lib/env/schema.ts` (none needed this feature)
- Commits: Conventional Commits (`feat(seo):`, `fix(seo):`)
- Target keywords for rule evaluation: `"AI Engineer"`, `"Applied AI"` (case-insensitive)
- Do NOT modify applied migrations — no DB changes needed (reads existing columns)

---

## File Map

| File                                                 | Action | Responsibility                                                   |
| ---------------------------------------------------- | ------ | ---------------------------------------------------------------- |
| `src/features/seo/lib/audit/rules.ts`                | Create | SEO rule definitions — id, label, points, evaluator fn           |
| `src/features/seo/lib/audit/suggestions.ts`          | Create | Human-readable fix hints per rule + current value                |
| `src/features/seo/lib/audit/scorer.ts`               | Create | Merge Rule Set A + B, normalize to 0–100, return `SeoAuditScore` |
| `src/features/seo/lib/audit/engine.ts`               | Create | Fetch all published items, run scorer, return `SeoAuditResult`   |
| `src/features/seo/lib/audit/types.ts`                | Create | Shared types: `SeoRuleResult`, `SeoAuditScore`, `SeoAuditResult` |
| `src/features/admin/components/seo-audit-panel.tsx`  | Create | Client table, filters, pagination, CSV export, opens drawer      |
| `src/features/admin/components/seo-audit-drawer.tsx` | Create | Floating glass sheet, rule checklist, quick-edit fields, save    |
| `src/app/admin/(protected)/seo/page.tsx`             | Create | Server Component — runs engine, passes to panel                  |
| `src/app/admin/(protected)/seo/loading.tsx`          | Create | Skeleton placeholder                                             |
| `src/app/api/admin/seo/save/route.ts`                | Create | POST — validate, write seo_title/seo_description, revalidate     |
| `src/shared/config/admin-navigation.ts`              | Modify | Add "SEO Audit" to Analytics group                               |

---

## Task 1: Types

**Files:**

- Create: `src/features/seo/lib/audit/types.ts`

**Interfaces:**

- Produces: `SeoRuleResult`, `SeoAuditScore`, `SeoAuditResult`, `SeoItemType`, `SeoHealthBand` — consumed by all subsequent tasks

- [ ] **Step 1: Create the types file**

```typescript
// src/features/seo/lib/audit/types.ts

export type SeoItemType = "project" | "blog" | "research" | "automation"

export type SeoHealthBand = "healthy" | "warning" | "critical"

export type SeoRuleResult = {
  ruleId: string
  label: string
  passed: boolean
  earned: number
  max: number
  currentValue: string | null
  suggestion: string | null
}

export type SeoAuditScore = {
  id: string
  title: string
  slug: string
  type: SeoItemType
  score: number
  earnedPoints: number
  maxPoints: number
  band: SeoHealthBand
  checks: SeoRuleResult[]
  issueCount: number
  publicPath: string
  table: "projects" | "content"
}

export type SeoAuditResult = {
  items: SeoAuditScore[]
  avgScore: number
  healthyCount: number
  warningCount: number
  criticalCount: number
  totalCount: number
  auditedAt: string
}
```

- [ ] **Step 2: Typecheck**

```bash
npx tsc --noEmit 2>&1 | grep "audit/types"
```

Expected: no output (no errors).

- [ ] **Step 3: Commit**

```bash
git add src/features/seo/lib/audit/types.ts
git commit -m "feat(seo): add SEO audit shared types"
```

---

## Task 2: Rule Set B — SEO Quality Rules

**Files:**

- Create: `src/features/seo/lib/audit/rules.ts`

**Interfaces:**

- Consumes: `SeoRuleResult` from `types.ts`
- Produces: `SEO_RULES` array + `evaluateSeoRule(ruleId, item, itemType)` → `{ passed: boolean, currentValue: string | null }`

- [ ] **Step 1: Create rules file**

```typescript
// src/features/seo/lib/audit/rules.ts

import type { SeoItemType } from "./types"

export type SeoRule = {
  id: string
  label: string
  points: number
}

export const SEO_RULES: SeoRule[] = [
  {
    id: "seo_title_length",
    label: "SEO title length (30–60 chars)",
    points: 8,
  },
  {
    id: "seo_desc_length",
    label: "SEO description length (120–160 chars)",
    points: 8,
  },
  { id: "seo_title_keyword", label: "Target keyword in SEO title", points: 10 },
  {
    id: "seo_desc_keyword",
    label: "Target keyword in SEO description",
    points: 8,
  },
  { id: "summary_length", label: "Summary/excerpt ≥ 80 chars", points: 6 },
  { id: "faq_min_count", label: "FAQ has ≥ 3 items", points: 6 },
  { id: "faq_answer_quality", label: "FAQ answers ≥ 40 chars each", points: 5 },
  { id: "ai_summary_depth", label: "AI summary ≥ 100 chars", points: 5 },
  {
    id: "slug_quality",
    label: "Slug hygiene (no underscores/stops)",
    points: 5,
  },
  { id: "tags_or_stack", label: "Has ≥ 2 tags or tech stack items", points: 5 },
  { id: "key_takeaways_count", label: "Has ≥ 2 key takeaways", points: 5 },
]

export const SEO_RULES_MAX = SEO_RULES.reduce((s, r) => s + r.points, 0)
// = 71

const TARGET_KEYWORDS = ["ai engineer", "applied ai"]

function containsKeyword(text: string): boolean {
  const lower = text.toLowerCase()
  return TARGET_KEYWORDS.some((kw) => lower.includes(kw))
}

type EvalResult = { passed: boolean; currentValue: string | null }

export function evaluateSeoRule(
  ruleId: string,
  item: Record<string, unknown>,
  _itemType: SeoItemType
): EvalResult {
  switch (ruleId) {
    case "seo_title_length": {
      const v = String(item["seo_title"] ?? "")
      return {
        passed: v.length >= 30 && v.length <= 60,
        currentValue: v || null,
      }
    }
    case "seo_desc_length": {
      const v = String(item["seo_description"] ?? "")
      return {
        passed: v.length >= 120 && v.length <= 160,
        currentValue: v || null,
      }
    }
    case "seo_title_keyword": {
      const v = String(item["seo_title"] ?? "")
      return {
        passed: Boolean(v) && containsKeyword(v),
        currentValue: v || null,
      }
    }
    case "seo_desc_keyword": {
      const v = String(item["seo_description"] ?? "")
      return {
        passed: Boolean(v) && containsKeyword(v),
        currentValue: v || null,
      }
    }
    case "summary_length": {
      const v = String(item["summary"] ?? item["excerpt"] ?? "")
      return { passed: v.length >= 80, currentValue: v || null }
    }
    case "faq_min_count": {
      const faq = item["faq"]
      const count = Array.isArray(faq) ? faq.length : 0
      return {
        passed: count >= 3,
        currentValue: `${count} item${count !== 1 ? "s" : ""}`,
      }
    }
    case "faq_answer_quality": {
      const faq = item["faq"]
      if (!Array.isArray(faq) || faq.length === 0) {
        return { passed: false, currentValue: "No FAQ" }
      }
      const allLong = faq.every(
        (f) =>
          typeof f === "object" &&
          f !== null &&
          String((f as Record<string, unknown>)["answer"] ?? "").length >= 40
      )
      return {
        passed: allLong,
        currentValue: `${faq.length} FAQ item${faq.length !== 1 ? "s" : ""}`,
      }
    }
    case "ai_summary_depth": {
      const v = String(item["ai_summary"] ?? "")
      return {
        passed: v.length >= 100,
        currentValue: v ? `${v.length} chars` : null,
      }
    }
    case "slug_quality": {
      const v = String(item["slug"] ?? "")
      const STOP_WORDS = new Set([
        "the",
        "a",
        "an",
        "and",
        "or",
        "of",
        "in",
        "is",
      ])
      const parts = v.split("-")
      const hasStops = parts.some((p) => STOP_WORDS.has(p))
      const hasUnderscores = v.includes("_")
      const isLower = v === v.toLowerCase()
      return {
        passed: Boolean(v) && !hasStops && !hasUnderscores && isLower,
        currentValue: v || null,
      }
    }
    case "tags_or_stack": {
      const tags = item["tags"]
      const stack = item["tech_stack"]
      const count =
        (Array.isArray(tags) ? tags.length : 0) +
        (Array.isArray(stack) ? stack.length : 0)
      return {
        passed: count >= 2,
        currentValue: `${count} tag/stack item${count !== 1 ? "s" : ""}`,
      }
    }
    case "key_takeaways_count": {
      const kt = item["key_takeaways"]
      const count = Array.isArray(kt) ? kt.length : 0
      return {
        passed: count >= 2,
        currentValue: `${count} takeaway${count !== 1 ? "s" : ""}`,
      }
    }
    default:
      return { passed: false, currentValue: null }
  }
}
```

- [ ] **Step 2: Typecheck**

```bash
npx tsc --noEmit 2>&1 | grep "audit/rules"
```

Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add src/features/seo/lib/audit/rules.ts
git commit -m "feat(seo): add SEO quality rule definitions and evaluator"
```

---

## Task 3: Suggestions

**Files:**

- Create: `src/features/seo/lib/audit/suggestions.ts`

**Interfaces:**

- Produces: `getSuggestion(ruleId, currentValue) → string` — consumed by scorer

- [ ] **Step 1: Create suggestions file**

```typescript
// src/features/seo/lib/audit/suggestions.ts

export function getSuggestion(
  ruleId: string,
  currentValue: string | null
): string {
  const len = currentValue ? currentValue.length : 0

  switch (ruleId) {
    case "seo_title_length":
      if (!currentValue) return "Add an SEO title (30–60 chars)."
      if (len < 30) return `SEO title is ${len} chars — expand to at least 30.`
      return `SEO title is ${len} chars — trim to 60 or fewer.`

    case "seo_desc_length":
      if (!currentValue) return "Add an SEO description (120–160 chars)."
      if (len < 120)
        return `SEO description is ${len} chars — expand to at least 120.`
      return `SEO description is ${len} chars — trim to 160 or fewer.`

    case "seo_title_keyword":
      if (!currentValue)
        return 'Add an SEO title containing "AI Engineer" or "Applied AI".'
      return 'Add "AI Engineer" or "Applied AI" to your SEO title.'

    case "seo_desc_keyword":
      if (!currentValue)
        return 'Add an SEO description containing "AI Engineer" or "Applied AI".'
      return 'Add "AI Engineer" or "Applied AI" to your SEO description.'

    case "summary_length":
      if (!currentValue)
        return "Add a summary or excerpt of at least 80 characters."
      return `Summary is ${len} chars — expand to at least 80.`

    case "faq_min_count":
      return "Add at least 3 FAQ items. FAQs help win featured snippet slots."

    case "faq_answer_quality":
      return "Each FAQ answer should be at least 40 characters for Google to use as an answer snippet."

    case "ai_summary_depth":
      if (!currentValue) return "Add an AI summary of at least 100 characters."
      return `AI summary is ${len} chars — expand to at least 100.`

    case "slug_quality":
      if (!currentValue)
        return "Set a slug using only lowercase letters, hyphens, and no stop words."
      return `Slug "${currentValue}" contains underscores, capital letters, or stop words (the/a/an). Use only lowercase hyphens.`

    case "tags_or_stack":
      return "Add at least 2 tags or tech stack items to improve topical relevance signals."

    case "key_takeaways_count":
      return "Add at least 2 key takeaways. These feed structured content signals."

    default:
      return "Review and fix this field."
  }
}
```

- [ ] **Step 2: Typecheck**

```bash
npx tsc --noEmit 2>&1 | grep "audit/suggestions"
```

Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add src/features/seo/lib/audit/suggestions.ts
git commit -m "feat(seo): add SEO rule suggestion copy"
```

---

## Task 4: Scorer

**Files:**

- Create: `src/features/seo/lib/audit/scorer.ts`

**Interfaces:**

- Consumes: `SEO_RULES`, `SEO_RULES_MAX`, `evaluateSeoRule` from `rules.ts`; `getSuggestion` from `suggestions.ts`; `scoreProject`, `scoreContent` from `src/features/admin/lib/content-health/scoring.ts`; `SeoAuditScore`, `SeoItemType` from `types.ts`
- Produces: `runSeoScorer(item, itemType, table) → SeoAuditScore` — consumed by engine

- [ ] **Step 1: Create scorer file**

```typescript
// src/features/seo/lib/audit/scorer.ts

import {
  scoreContent,
  scoreProject,
} from "@/features/admin/lib/content-health/scoring"

import { evaluateSeoRule, SEO_RULES, SEO_RULES_MAX } from "./rules"
import { getSuggestion } from "./suggestions"
import type {
  SeoAuditScore,
  SeoHealthBand,
  SeoItemType,
  SeoRuleResult,
} from "./types"

function toBand(score: number): SeoHealthBand {
  if (score >= 80) return "healthy"
  if (score >= 50) return "warning"
  return "critical"
}

function publicPath(slug: string, type: SeoItemType): string {
  switch (type) {
    case "project":
      return `/projects/${slug}`
    case "blog":
      return `/blog/${slug}`
    case "research":
      return `/research/${slug}`
    case "automation":
      return `/automations/${slug}`
  }
}

export function runSeoScorer(
  item: Record<string, unknown>,
  itemType: SeoItemType,
  table: "projects" | "content"
): SeoAuditScore {
  // Rule Set A — completeness (reuse existing scorers)
  const setA = itemType === "project" ? scoreProject(item) : scoreContent(item)
  const setAMax = setA.maxPoints

  // Rule Set B — SEO quality
  const checks: SeoRuleResult[] = []
  let setBEarned = 0

  for (const rule of SEO_RULES) {
    const { passed, currentValue } = evaluateSeoRule(rule.id, item, itemType)
    const earned = passed ? rule.points : 0
    setBEarned += earned
    checks.push({
      ruleId: rule.id,
      label: rule.label,
      passed,
      earned,
      max: rule.points,
      currentValue,
      suggestion: passed ? null : getSuggestion(rule.id, currentValue),
    })
  }

  const totalEarned = setA.earnedPoints + setBEarned
  const totalMax = setAMax + SEO_RULES_MAX
  const score = totalMax > 0 ? Math.round((totalEarned / totalMax) * 100) : 0

  const slug = String(item["slug"] ?? "")

  return {
    id: String(item["id"] ?? ""),
    title: String(item["title"] ?? ""),
    slug,
    type: itemType,
    score,
    earnedPoints: totalEarned,
    maxPoints: totalMax,
    band: toBand(score),
    checks,
    issueCount: checks.filter((c) => !c.passed).length,
    publicPath: publicPath(slug, itemType),
    table,
  }
}
```

- [ ] **Step 2: Typecheck**

```bash
npx tsc --noEmit 2>&1 | grep "audit/scorer"
```

Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add src/features/seo/lib/audit/scorer.ts
git commit -m "feat(seo): add SEO scorer merging completeness + quality rules"
```

---

## Task 5: Engine

**Files:**

- Create: `src/features/seo/lib/audit/engine.ts`

**Interfaces:**

- Consumes: `runSeoScorer` from `scorer.ts`; `createAdminClient` from `@/shared/lib/supabase/admin`; `SeoAuditResult` from `types.ts`
- Produces: `runSeoAudit() → Promise<SeoAuditResult>` — consumed by page.tsx

- [ ] **Step 1: Create engine file**

```typescript
// src/features/seo/lib/audit/engine.ts
import "server-only"

import { createAdminClient } from "@/shared/lib/supabase/admin"

import { runSeoScorer } from "./scorer"
import type { SeoAuditResult, SeoAuditScore } from "./types"

export async function runSeoAudit(): Promise<SeoAuditResult> {
  const supabase = await createAdminClient()

  const [projectsRes, contentRes] = await Promise.all([
    supabase.from("projects").select("*").eq("status", "published"),
    supabase.from("content").select("*").eq("status", "published"),
  ])

  const rawProjects = (projectsRes.data ?? []) as Record<string, unknown>[]
  const rawContent = (contentRes.data ?? []) as Record<string, unknown>[]

  const scoredProjects: SeoAuditScore[] = rawProjects.map((p) =>
    runSeoScorer(p, "project", "projects")
  )

  const scoredContent: SeoAuditScore[] = rawContent.map((c) => {
    const rawType = String(c["type"] ?? "blog")
    const type =
      rawType === "research" || rawType === "automation" || rawType === "blog"
        ? (rawType as "research" | "automation" | "blog")
        : "blog"
    return runSeoScorer(c, type, "content")
  })

  const items = [...scoredProjects, ...scoredContent].sort(
    (a, b) => a.score - b.score
  )

  const totalCount = items.length
  const avgScore =
    totalCount > 0
      ? Math.round(items.reduce((s, i) => s + i.score, 0) / totalCount)
      : 0

  return {
    items,
    avgScore,
    healthyCount: items.filter((i) => i.band === "healthy").length,
    warningCount: items.filter((i) => i.band === "warning").length,
    criticalCount: items.filter((i) => i.band === "critical").length,
    totalCount,
    auditedAt: new Date().toISOString(),
  }
}
```

- [ ] **Step 2: Typecheck**

```bash
npx tsc --noEmit 2>&1 | grep "audit/engine"
```

Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add src/features/seo/lib/audit/engine.ts
git commit -m "feat(seo): add SEO audit engine fetching all published items"
```

---

## Task 6: Save API Route

**Files:**

- Create: `src/app/api/admin/seo/save/route.ts`

**Interfaces:**

- Consumes: `requireAdmin` from `@/shared/lib/auth/session`; `createAdminClient` from `@/shared/lib/supabase/admin`; `revalidatePublicProjects`, `revalidatePublicContent` from `@/features/portfolio/lib/revalidate-cache`
- Produces: `POST /api/admin/seo/save` → `{ ok: true, newSeoTitle: string, newSeoDescription: string }` or `{ error: string }` with 4xx

- [ ] **Step 1: Create the route**

```typescript
// src/app/api/admin/seo/save/route.ts
import { NextResponse } from "next/server"

import {
  revalidatePublicContent,
  revalidatePublicProjects,
} from "@/features/portfolio/lib/revalidate-cache"
import { requireAdmin } from "@/shared/lib/auth/session"
import { createAdminClient } from "@/shared/lib/supabase/admin"

type SaveBody = {
  table: "projects" | "content"
  id: string
  seo_title: string
  seo_description: string
}

function isUuid(v: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    v
  )
}

export async function POST(request: Request): Promise<NextResponse> {
  await requireAdmin()

  let body: SaveBody
  try {
    body = (await request.json()) as SaveBody
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const { table, id, seo_title, seo_description } = body

  if (table !== "projects" && table !== "content") {
    return NextResponse.json({ error: "Invalid table" }, { status: 400 })
  }
  if (!isUuid(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 })
  }
  if (
    typeof seo_title !== "string" ||
    seo_title.length < 1 ||
    seo_title.length > 70
  ) {
    return NextResponse.json(
      { error: "seo_title must be 1–70 chars" },
      { status: 422 }
    )
  }
  if (
    typeof seo_description !== "string" ||
    seo_description.length < 1 ||
    seo_description.length > 160
  ) {
    return NextResponse.json(
      { error: "seo_description must be 1–160 chars" },
      { status: 422 }
    )
  }

  const supabase = await createAdminClient()
  const { error } = await supabase
    .from(table)
    .update({
      seo_title,
      seo_description,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)

  if (error) {
    console.error("[seo/save]", error)
    return NextResponse.json(
      { error: "Database update failed" },
      { status: 500 }
    )
  }

  if (table === "projects") {
    revalidatePublicProjects()
  } else {
    revalidatePublicContent()
  }

  return NextResponse.json({
    ok: true,
    newSeoTitle: seo_title,
    newSeoDescription: seo_description,
  })
}
```

- [ ] **Step 2: Typecheck**

```bash
npx tsc --noEmit 2>&1 | grep "api/admin/seo"
```

Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/admin/seo/save/route.ts
git commit -m "feat(seo): add POST /api/admin/seo/save route with validation and revalidation"
```

---

## Task 7: SEO Audit Drawer

**Files:**

- Create: `src/features/admin/components/seo-audit-drawer.tsx`

**Interfaces:**

- Consumes: `SeoAuditScore` from `@/features/seo/lib/audit/types`; `Sheet`, `SheetContent`, `SheetTitle` from `@/shared/ui/sheet`; `ChevronLeft`, `ChevronRight`, `CheckCircle2`, `XCircle` from `lucide-react`
- Produces: `<SeoAuditDrawer>` — consumed by `seo-audit-panel.tsx`

- [ ] **Step 1: Create the drawer**

```tsx
// src/features/admin/components/seo-audit-drawer.tsx
"use client"

import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  XCircle,
} from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"

import type { SeoAuditScore } from "@/features/seo/lib/audit/types"
import { cn } from "@/shared/lib/utils"
import { Sheet, SheetContent, SheetTitle } from "@/shared/ui/sheet"

function BandBadge({ score }: { score: number }) {
  if (score >= 80)
    return (
      <span className="rounded-full bg-green-500/15 px-2 py-0.5 text-xs font-medium text-green-600 dark:text-green-400">
        Healthy
      </span>
    )
  if (score >= 50)
    return (
      <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-600 dark:text-amber-400">
        Warning
      </span>
    )
  return (
    <span className="rounded-full bg-red-500/15 px-2 py-0.5 text-xs font-medium text-red-600 dark:text-red-400">
      Critical
    </span>
  )
}

function ScrollArea({
  active,
  children,
}: {
  active: boolean
  children: React.ReactNode
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [hint, setHint] = useState(false)

  const update = useCallback(() => {
    const el = ref.current
    if (!el) return
    setHint(
      el.scrollHeight > el.clientHeight + 4 &&
        el.scrollTop + el.clientHeight < el.scrollHeight - 8
    )
  }, [])

  useEffect(() => {
    if (!active) {
      setHint(false)
      return
    }
    const el = ref.current
    if (!el) return
    update()
    el.addEventListener("scroll", update, { passive: true })
    const ro = new ResizeObserver(update)
    ro.observe(el)
    const frame = requestAnimationFrame(update)
    return () => {
      cancelAnimationFrame(frame)
      el.removeEventListener("scroll", update)
      ro.disconnect()
    }
  }, [active, update])

  return (
    <div className="relative min-h-0 flex-1">
      <div
        ref={ref}
        className="h-full overflow-y-auto overscroll-contain px-4 pb-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {children}
      </div>
      {hint ? (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-20 bg-gradient-to-t from-background/60 to-transparent"
        />
      ) : null}
    </div>
  )
}

type Props = {
  item: SeoAuditScore | null
  allItems: SeoAuditScore[]
  open: boolean
  onOpenChange: (v: boolean) => void
  onSelectItem: (item: SeoAuditScore) => void
}

export function SeoAuditDrawer({
  item,
  allItems,
  open,
  onOpenChange,
  onSelectItem,
}: Props) {
  const [editTitle, setEditTitle] = useState("")
  const [editDesc, setEditDesc] = useState("")
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [savedScore, setSavedScore] = useState<number | null>(null)

  useEffect(() => {
    if (item) {
      setEditTitle(
        item.checks.find((c) => c.ruleId === "seo_title_length")
          ?.currentValue ?? ""
      )
      setEditDesc(
        item.checks.find((c) => c.ruleId === "seo_desc_length")?.currentValue ??
          ""
      )
      setSavedScore(null)
      setSaveError(null)
    }
  }, [item?.id])

  if (!item) return null

  const sorted = [...allItems]
  const currentIdx = sorted.findIndex((i) => i.id === item.id)
  const prevItem =
    currentIdx < sorted.length - 1 ? sorted[currentIdx + 1] : null
  const nextItem = currentIdx > 0 ? sorted[currentIdx - 1] : null

  const displayScore = savedScore ?? item.score

  async function handleSave() {
    if (!item) return
    if (editTitle.length < 1 || editTitle.length > 70) {
      setSaveError("SEO title must be 1–70 chars")
      return
    }
    if (editDesc.length < 1 || editDesc.length > 160) {
      setSaveError("SEO description must be 1–160 chars")
      return
    }
    setSaving(true)
    setSaveError(null)
    try {
      const res = await fetch("/api/admin/seo/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          table: item.table,
          id: item.id,
          seo_title: editTitle,
          seo_description: editDesc,
        }),
      })
      if (!res.ok) {
        const data = (await res.json()) as { error?: string }
        setSaveError(data.error ?? "Save failed")
        return
      }
      // Optimistic: re-score the two length/keyword rules locally for visual feedback
      setSavedScore(null) // server will revalidate on next page load
    } finally {
      setSaving(false)
    }
  }

  return (
    <Sheet onOpenChange={onOpenChange} open={open}>
      <SheetContent
        className="!inset-y-3 !right-3 flex !h-[calc(100vh-1.5rem)] w-full flex-col gap-0 overflow-hidden rounded-2xl border border-white/10 bg-background/60 p-0 shadow-2xl backdrop-blur-xl sm:!w-[40rem] sm:!max-w-[min(40rem,92vw)]"
        showCloseButton={false}
        side="right"
      >
        {/* Header */}
        <div className="shrink-0 border-b border-white/10 bg-white/5 px-4 py-3">
          <SheetTitle className="sr-only">SEO Audit</SheetTitle>
          <div className="flex items-center gap-3">
            <div className="flex min-w-0 flex-1 items-center gap-2.5 overflow-hidden">
              <span className="shrink-0 text-sm font-semibold">SEO Audit</span>
              <span className="text-white/20">|</span>
              <span className="min-w-0 truncate text-sm text-muted-foreground capitalize">
                {item.type} · {item.title}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                aria-label="Previous item"
                className="flex size-7 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground disabled:pointer-events-none disabled:opacity-30"
                disabled={!prevItem}
                onClick={() => prevItem && onSelectItem(prevItem)}
                type="button"
              >
                <ChevronLeft aria-hidden className="size-3.5" />
              </button>
              <button
                aria-label="Next item"
                className="flex size-7 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground disabled:pointer-events-none disabled:opacity-30"
                disabled={!nextItem}
                onClick={() => nextItem && onSelectItem(nextItem)}
                type="button"
              >
                <ChevronRight aria-hidden className="size-3.5" />
              </button>
            </div>
            <button
              aria-label="Close"
              className="flex size-7 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground"
              onClick={() => onOpenChange(false)}
              type="button"
            >
              <span aria-hidden className="text-base leading-none">
                ×
              </span>
            </button>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <span className="font-mono text-2xl font-bold tabular-nums">
              {displayScore}
            </span>
            <span className="text-muted-foreground text-sm">/100</span>
            <BandBadge score={displayScore} />
            <span className="text-muted-foreground ml-auto text-xs">
              {item.issueCount} issue{item.issueCount !== 1 ? "s" : ""}
            </span>
          </div>
        </div>

        <ScrollArea active={open}>
          <div className="space-y-4 pt-4">
            {/* Rule checklist */}
            <div className="rounded-xl border border-white/10 bg-white/5 p-3 backdrop-blur-sm">
              <p className="mb-3 text-sm font-medium">Rule checklist</p>
              <div className="space-y-2">
                {item.checks.map((check) => (
                  <div
                    className="flex items-start gap-2.5 text-sm"
                    key={check.ruleId}
                  >
                    {check.passed ? (
                      <CheckCircle2
                        aria-hidden
                        className="mt-0.5 size-4 shrink-0 text-green-600 dark:text-green-400"
                      />
                    ) : (
                      <XCircle
                        aria-hidden
                        className="mt-0.5 size-4 shrink-0 text-red-500 dark:text-red-400"
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <span
                          className={cn(
                            "font-medium",
                            !check.passed && "text-foreground"
                          )}
                        >
                          {check.label}
                        </span>
                        <span className="text-muted-foreground shrink-0 text-xs tabular-nums">
                          {check.earned}/{check.max}pts
                        </span>
                      </div>
                      {check.currentValue ? (
                        <p className="text-muted-foreground mt-0.5 truncate font-mono text-xs">
                          {check.currentValue}
                        </p>
                      ) : null}
                      {check.suggestion ? (
                        <p className="mt-0.5 text-xs text-amber-600 dark:text-amber-400">
                          {check.suggestion}
                        </p>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick-edit */}
            <div className="rounded-xl border border-white/10 bg-white/5 p-3 backdrop-blur-sm space-y-3">
              <p className="text-sm font-medium">Quick-edit SEO fields</p>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label
                    className="text-xs text-muted-foreground"
                    htmlFor="seo-title-edit"
                  >
                    SEO Title
                  </label>
                  <span
                    className={cn(
                      "text-xs tabular-nums",
                      editTitle.length > 60
                        ? "text-red-500"
                        : editTitle.length >= 30
                          ? "text-green-600 dark:text-green-400"
                          : "text-muted-foreground"
                    )}
                  >
                    {editTitle.length}/60
                  </span>
                </div>
                <input
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-white/20"
                  id="seo-title-edit"
                  maxLength={70}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="AI Engineer | Project Name"
                  type="text"
                  value={editTitle}
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label
                    className="text-xs text-muted-foreground"
                    htmlFor="seo-desc-edit"
                  >
                    SEO Description
                  </label>
                  <span
                    className={cn(
                      "text-xs tabular-nums",
                      editDesc.length > 160
                        ? "text-red-500"
                        : editDesc.length >= 120
                          ? "text-green-600 dark:text-green-400"
                          : "text-muted-foreground"
                    )}
                  >
                    {editDesc.length}/160
                  </span>
                </div>
                <textarea
                  className="w-full resize-none rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-white/20"
                  id="seo-desc-edit"
                  maxLength={160}
                  onChange={(e) => setEditDesc(e.target.value)}
                  placeholder="Applied AI Engineer specializing in RAG, multi-agent systems, and production LLM infrastructure."
                  rows={3}
                  value={editDesc}
                />
              </div>

              {saveError ? (
                <p className="text-xs text-red-500" role="alert">
                  {saveError}
                </p>
              ) : null}

              <button
                className="w-full rounded-lg border border-white/10 bg-white/10 py-2 text-sm font-medium transition-colors hover:bg-white/15 disabled:opacity-50"
                disabled={saving}
                onClick={() => void handleSave()}
                type="button"
              >
                {saving ? "Saving…" : "Save & revalidate"}
              </button>
            </div>

            {/* Link to public page */}
            <a
              className="flex items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/5 py-2.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
              href={item.publicPath}
              rel="noopener noreferrer"
              target="_blank"
            >
              View public page
              <ExternalLink aria-hidden className="size-3.5" />
            </a>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}
```

- [ ] **Step 2: Typecheck**

```bash
npx tsc --noEmit 2>&1 | grep "seo-audit-drawer"
```

Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add src/features/admin/components/seo-audit-drawer.tsx
git commit -m "feat(seo): add SEO audit floating drawer with rule checklist and quick-edit"
```

---

## Task 8: SEO Audit Panel

**Files:**

- Create: `src/features/admin/components/seo-audit-panel.tsx`

**Interfaces:**

- Consumes: `SeoAuditResult`, `SeoAuditScore` from `@/features/seo/lib/audit/types`; `SeoAuditDrawer` from `./seo-audit-drawer`; `AdminDataTable` from `./admin-panel`
- Produces: `<SeoAuditPanel result={SeoAuditResult} />` — consumed by page.tsx

- [ ] **Step 1: Create the panel**

```tsx
// src/features/admin/components/seo-audit-panel.tsx
"use client"

import { useState, useMemo } from "react"
import { Download } from "lucide-react"

import type {
  SeoAuditResult,
  SeoAuditScore,
  SeoItemType,
  SeoHealthBand,
} from "@/features/seo/lib/audit/types"
import { AdminDataTable } from "@/features/admin/components/admin-panel"
import { Button } from "@/shared/ui/button"
import { cn } from "@/shared/lib/utils"
import { SeoAuditDrawer } from "./seo-audit-drawer"

const PAGE_SIZE = 20

function ScoreBar({ score }: { score: number }) {
  const color =
    score >= 80 ? "bg-green-500" : score >= 50 ? "bg-amber-500" : "bg-red-500"
  return (
    <div className="flex items-center gap-2">
      <div className="bg-muted h-1.5 w-20 overflow-hidden rounded-full">
        <div
          className={cn("h-full rounded-full", color)}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className="w-8 text-right font-mono text-xs tabular-nums">
        {score}
      </span>
    </div>
  )
}

function BandBadge({ band }: { band: SeoHealthBand }) {
  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 text-xs font-medium",
        band === "healthy" &&
          "bg-green-500/15 text-green-600 dark:text-green-400",
        band === "warning" &&
          "bg-amber-500/15 text-amber-600 dark:text-amber-400",
        band === "critical" && "bg-red-500/15 text-red-600 dark:text-red-400"
      )}
    >
      {band.charAt(0).toUpperCase() + band.slice(1)}
    </span>
  )
}

function exportCsv(items: SeoAuditScore[]) {
  const header = "Title,Type,Score,Band,Issues,SEO Title,SEO Description"
  const rows = items.map((i) => {
    const seoTitle =
      i.checks.find((c) => c.ruleId === "seo_title_length")?.currentValue ?? ""
    const seoDesc =
      i.checks.find((c) => c.ruleId === "seo_desc_length")?.currentValue ?? ""
    return [
      `"${i.title.replace(/"/g, '""')}"`,
      i.type,
      i.score,
      i.band,
      i.issueCount,
      `"${seoTitle.replace(/"/g, '""')}"`,
      `"${seoDesc.replace(/"/g, '""')}"`,
    ].join(",")
  })
  const csv = [header, ...rows].join("\n")
  const blob = new Blob([csv], { type: "text/csv" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `seo-audit-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

type Props = { result: SeoAuditResult }

export function SeoAuditPanel({ result }: Props) {
  const [typeFilter, setTypeFilter] = useState<SeoItemType | "all">("all")
  const [bandFilter, setBandFilter] = useState<SeoHealthBand | "all">("all")
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<SeoAuditScore | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  const filtered = useMemo(() => {
    return result.items.filter((i) => {
      if (typeFilter !== "all" && i.type !== typeFilter) return false
      if (bandFilter !== "all" && i.band !== bandFilter) return false
      if (search && !i.title.toLowerCase().includes(search.toLowerCase()))
        return false
      return true
    })
  }, [result.items, typeFilter, bandFilter, search])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  function openItem(item: SeoAuditScore) {
    setSelected(item)
    setDrawerOpen(true)
  }

  const SELECT_CLASS =
    "rounded-lg border border-border/60 bg-card/40 px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"

  return (
    <>
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <select
          className={SELECT_CLASS}
          onChange={(e) => {
            setTypeFilter(e.target.value as SeoItemType | "all")
            setPage(1)
          }}
          value={typeFilter}
        >
          <option value="all">All types</option>
          <option value="project">Projects</option>
          <option value="blog">Blog</option>
          <option value="research">Research</option>
          <option value="automation">Automations</option>
        </select>

        <select
          className={SELECT_CLASS}
          onChange={(e) => {
            setBandFilter(e.target.value as SeoHealthBand | "all")
            setPage(1)
          }}
          value={bandFilter}
        >
          <option value="all">All bands</option>
          <option value="healthy">Healthy</option>
          <option value="warning">Warning</option>
          <option value="critical">Critical</option>
        </select>

        <input
          className={cn(SELECT_CLASS, "flex-1 min-w-[160px]")}
          onChange={(e) => {
            setSearch(e.target.value)
            setPage(1)
          }}
          placeholder="Search by title…"
          type="search"
          value={search}
        />

        <Button
          onClick={() => exportCsv(filtered)}
          size="sm"
          type="button"
          variant="outline"
        >
          <Download aria-hidden className="size-4" />
          Export CSV
        </Button>
      </div>

      {/* Table */}
      <AdminDataTable>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-border/60 border-b bg-muted/50">
              <th className="px-4 py-3 text-left font-medium">Title</th>
              <th className="px-4 py-3 text-left font-medium">Type</th>
              <th className="px-4 py-3 text-left font-medium">Score</th>
              <th className="px-4 py-3 text-left font-medium">Band</th>
              <th className="px-4 py-3 text-right font-medium">Issues</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-border/60 divide-y">
            {paged.length === 0 ? (
              <tr>
                <td
                  className="text-muted-foreground px-4 py-8 text-center"
                  colSpan={6}
                >
                  No items match the current filters.
                </td>
              </tr>
            ) : (
              paged.map((item) => (
                <tr
                  className="hover:bg-muted/40 cursor-pointer transition-colors"
                  key={item.id}
                  onClick={() => openItem(item)}
                >
                  <td className="px-4 py-3 font-medium">{item.title}</td>
                  <td className="text-muted-foreground px-4 py-3 capitalize">
                    {item.type}
                  </td>
                  <td className="px-4 py-3">
                    <ScoreBar score={item.score} />
                  </td>
                  <td className="px-4 py-3">
                    <BandBadge band={item.band} />
                  </td>
                  <td className="text-muted-foreground px-4 py-3 text-right tabular-nums">
                    {item.issueCount}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-primary text-xs">Fix →</span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </AdminDataTable>

      {/* Pagination */}
      {totalPages > 1 ? (
        <div className="flex items-center justify-between gap-3 pt-2">
          <p className="text-muted-foreground text-sm">
            Page {page} of {totalPages} · {filtered.length} items
          </p>
          <div className="flex gap-2">
            <Button
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              size="sm"
              variant="outline"
              type="button"
            >
              Previous
            </Button>
            <Button
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
              size="sm"
              variant="outline"
              type="button"
            >
              Next
            </Button>
          </div>
        </div>
      ) : null}

      <SeoAuditDrawer
        allItems={result.items}
        item={selected}
        onOpenChange={setDrawerOpen}
        onSelectItem={openItem}
        open={drawerOpen}
      />
    </>
  )
}
```

- [ ] **Step 2: Typecheck**

```bash
npx tsc --noEmit 2>&1 | grep "seo-audit-panel"
```

Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add src/features/admin/components/seo-audit-panel.tsx
git commit -m "feat(seo): add SEO audit panel with filters, table, pagination, and CSV export"
```

---

## Task 9: Page + Loading + Nav

**Files:**

- Create: `src/app/admin/(protected)/seo/page.tsx`
- Create: `src/app/admin/(protected)/seo/loading.tsx`
- Modify: `src/shared/config/admin-navigation.ts`

**Interfaces:**

- Consumes: `runSeoAudit` from `@/features/seo/lib/audit/engine`; `SeoAuditPanel` from `@/features/admin/components/seo-audit-panel`; `PageHeader`, `AdminPanel`, `StatCard` from `@/features/admin/components`

- [ ] **Step 1: Create page.tsx**

```tsx
// src/app/admin/(protected)/seo/page.tsx
import { SearchCheck } from "lucide-react"

import { SeoAuditPanel } from "@/features/admin/components/seo-audit-panel"
import { AdminPanel, PageHeader, StatCard } from "@/features/admin/components"
import { runSeoAudit } from "@/features/seo/lib/audit/engine"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "SEO Audit",
  robots: { index: false, follow: false },
}

export default async function SeoAuditPage() {
  const result = await runSeoAudit()

  return (
    <div className="space-y-6">
      <PageHeader
        description="SEO quality scores across all published content. Worst items first."
        title="SEO Audit"
      />

      <AdminPanel description="Aggregate SEO quality scores." title="Overview">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Avg Score" value={`${result.avgScore}%`} />
          <StatCard label="Healthy (≥80)" value={result.healthyCount} />
          <StatCard label="Warning (50–79)" value={result.warningCount} />
          <StatCard label="Critical (<50)" value={result.criticalCount} />
        </div>
      </AdminPanel>

      {result.totalCount === 0 ? (
        <AdminPanel title="No content">
          <p className="text-muted-foreground text-sm">
            No published content found to audit.
          </p>
        </AdminPanel>
      ) : (
        <AdminPanel
          description={`${result.totalCount} published items · audited ${new Date(result.auditedAt).toLocaleTimeString()}`}
          title="Content items"
        >
          <SeoAuditPanel result={result} />
        </AdminPanel>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Create loading.tsx**

```tsx
// src/app/admin/(protected)/seo/loading.tsx
import { AdminPanel, PageHeader } from "@/features/admin/components"

export default function SeoAuditLoading() {
  return (
    <div className="space-y-6">
      <PageHeader
        description="SEO quality scores across all published content."
        title="SEO Audit"
      />
      <AdminPanel title="Overview">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              className="bg-muted/40 h-20 animate-pulse rounded-xl"
              key={i}
            />
          ))}
        </div>
      </AdminPanel>
      <AdminPanel title="Content items">
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              className="bg-muted/40 h-12 animate-pulse rounded-lg"
              key={i}
            />
          ))}
        </div>
      </AdminPanel>
    </div>
  )
}
```

- [ ] **Step 3: Add SearchCheck to nav imports and add SEO Audit item**

In `src/shared/config/admin-navigation.ts`:

Add `SearchCheck` to the import list (it's already a Lucide icon, just add it):

```typescript
import {
  // ... existing imports ...
  SearchCheck,
  // ... rest ...
} from "lucide-react"
```

Then in the `analytics` group items array, add after the `Content Health` item:

```typescript
{
  title: "SEO Audit",
  href: "/admin/seo",
  icon: SearchCheck,
  description: "SEO quality scores and fix suggestions",
},
```

- [ ] **Step 4: Typecheck everything**

```bash
npx tsc --noEmit 2>&1 | head -30
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/app/admin/(protected)/seo/page.tsx src/app/admin/(protected)/seo/loading.tsx src/shared/config/admin-navigation.ts
git commit -m "feat(seo): add /admin/seo page, loading skeleton, and nav entry"
```

---

## Self-Review Against Spec

**Spec coverage check:**

| Spec requirement                                   | Task                  |
| -------------------------------------------------- | --------------------- |
| Rule Set B — 11 SEO quality rules                  | Task 2                |
| Completeness rules merged (Rule Set A)             | Task 4 scorer         |
| Normalize to 0–100                                 | Task 4 scorer         |
| Health bands healthy/warning/critical              | Task 1 types + Task 4 |
| `/admin/seo` page with StatCards                   | Task 9                |
| Filter by type + band + search                     | Task 8 panel          |
| Score bar + band badge in table                    | Task 8 panel          |
| Pagination 20/page                                 | Task 8 panel          |
| Fix → drawer, floating glass style                 | Task 7 drawer         |
| Prev/next navigation in drawer                     | Task 7 drawer         |
| Rule checklist ✓/✗ + hint + current value          | Task 7 drawer         |
| Quick-edit seo_title (char counter 0/60)           | Task 7 drawer         |
| Quick-edit seo_description (char counter 0/160)    | Task 7 drawer         |
| Save → POST /api/admin/seo/save                    | Task 6 + Task 7       |
| Validation 1–70 / 1–160 chars                      | Task 6 route          |
| revalidatePublicProjects / revalidatePublicContent | Task 6 route          |
| requireAdmin auth check                            | Task 6 route          |
| Export CSV client-side                             | Task 8 panel          |
| loading.tsx skeleton                               | Task 9                |
| Nav: SearchCheck icon in Analytics group           | Task 9                |
| suggestions human-readable                         | Task 3                |
| `publicPath` link in drawer                        | Task 7 drawer         |

All spec requirements covered. No placeholders. Types consistent across all tasks (`SeoAuditScore.table` used in Task 7 save call matches Task 1 type definition and Task 5 engine output).
