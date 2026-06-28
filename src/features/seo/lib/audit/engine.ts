import "server-only"

import { createAdminClient } from "@/shared/lib/supabase/admin"

import { runSeoScorer } from "./scorer"
import type { SeoAuditResult, SeoAuditScore } from "./types"

export async function runSeoAudit(): Promise<SeoAuditResult> {
  const supabase = createAdminClient()

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
