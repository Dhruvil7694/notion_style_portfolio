import "server-only"

import { createAdminClient } from "@/shared/lib/supabase/admin"

import { runAeoScorer } from "./scorer"
import type { AeoAuditResult, AeoAuditScore } from "./types"

export async function runAeoAudit(): Promise<AeoAuditResult> {
  const supabase = createAdminClient()

  const [projectsRes, contentRes] = await Promise.all([
    supabase.from("projects").select("*").eq("status", "published"),
    supabase.from("content").select("*").eq("status", "published"),
  ])

  const rawProjects = (projectsRes.data ?? []) as Record<string, unknown>[]
  const rawContent = (contentRes.data ?? []) as Record<string, unknown>[]

  const scoredProjects: AeoAuditScore[] = rawProjects.map((p) =>
    runAeoScorer(p, "project", "projects")
  )

  const scoredContent: AeoAuditScore[] = rawContent.map((c) => {
    const rawType = String(c["type"] ?? "blog")
    const type =
      rawType === "research" || rawType === "automation" || rawType === "blog"
        ? (rawType as "research" | "automation" | "blog")
        : "blog"
    return runAeoScorer(c, type, "content")
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
    optimizedCount: items.filter((i) => i.band === "optimized").length,
    partialCount: items.filter((i) => i.band === "partial").length,
    missingCount: items.filter((i) => i.band === "missing").length,
    totalCount,
    auditedAt: new Date().toISOString(),
  }
}
