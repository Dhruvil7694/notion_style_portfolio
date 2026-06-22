import "server-only"

import { createAdminClient } from "@/lib/supabase/admin"

import { scoreContent, scoreProject } from "./scoring"
import type { ContentHealthScore } from "./scoring"

export type ContentHealthAuditResult = {
  projects: ContentHealthScore[]
  content: ContentHealthScore[]
  overallScore: number
  totalItems: number
  healthyCount: number
  warningCount: number
  criticalCount: number
}

export async function runContentHealthAudit(): Promise<ContentHealthAuditResult> {
  const supabase = await createAdminClient()

  const [projectsResult, contentResult] = await Promise.all([
    supabase.from("projects").select("*").eq("status", "published"),
    supabase
      .from("content")
      .select("*")
      .in("type", ["research", "writing", "automation"])
      .eq("status", "published"),
  ])

  const rawProjects = (projectsResult.data ?? []) as Record<string, unknown>[]
  const rawContent = (contentResult.data ?? []) as Record<string, unknown>[]

  const scoredProjects = rawProjects.map((p) => scoreProject(p))
  const scoredContent = rawContent.map((c) => scoreContent(c))

  const allScored = [...scoredProjects, ...scoredContent]
  const totalItems = allScored.length

  const healthyCount = allScored.filter((s) => s.score >= 80).length
  const warningCount = allScored.filter(
    (s) => s.score >= 50 && s.score < 80
  ).length
  const criticalCount = allScored.filter((s) => s.score < 50).length

  const overallScore =
    totalItems > 0
      ? Math.round(
          allScored.reduce((sum, s) => sum + s.score, 0) / totalItems
        )
      : 0

  return {
    projects: scoredProjects.sort((a, b) => a.score - b.score),
    content: scoredContent.sort((a, b) => a.score - b.score),
    overallScore,
    totalItems,
    healthyCount,
    warningCount,
    criticalCount,
  }
}
