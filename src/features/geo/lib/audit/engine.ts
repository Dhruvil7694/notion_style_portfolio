import "server-only"

import { createAdminClient } from "@/shared/lib/supabase/admin"

import { runGeoScorer } from "./scorer"
import type { GeoAuditResult, GeoAuditScore } from "./types"

export async function runGeoAudit(): Promise<GeoAuditResult> {
  const supabase = createAdminClient()

  const [projectsRes, contentRes] = await Promise.all([
    supabase.from("projects").select("*").eq("status", "published"),
    supabase.from("content").select("*").eq("status", "published"),
  ])

  const rawProjects = (projectsRes.data ?? []) as Record<string, unknown>[]
  const rawContent = (contentRes.data ?? []) as Record<string, unknown>[]

  const scoredProjects: GeoAuditScore[] = rawProjects.map((p) =>
    runGeoScorer(p, "project", "projects")
  )

  const scoredContent: GeoAuditScore[] = rawContent.map((c) => {
    const rawType = String(c["type"] ?? "blog")
    const type =
      rawType === "research" || rawType === "automation" || rawType === "blog"
        ? (rawType as "research" | "automation" | "blog")
        : "blog"
    return runGeoScorer(c, type, "content")
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
    prominentCount: items.filter((i) => i.band === "prominent").length,
    emergingCount: items.filter((i) => i.band === "emerging").length,
    absentCount: items.filter((i) => i.band === "absent").length,
    totalCount,
    auditedAt: new Date().toISOString(),
  }
}
