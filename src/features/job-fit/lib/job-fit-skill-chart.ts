import type { SkillMatchStatus } from "@/features/job-fit/lib/job-fit-comparison-matrix"
import type { JobFitHistoryEntry } from "@/features/job-fit/lib/job-fit-history"
import type { DetailedJobFitAnalysis } from "@/features/job-fit/lib/parse-job-fit-result"
import { parseJobFitAnalysisDetailed } from "@/features/job-fit/lib/parse-job-fit-result"

export const SKILL_MATCH_SCORE: Record<SkillMatchStatus, number> = {
  strong: 100,
  partial: 65,
  gap: 25,
}

export type SummaryBarPoint = {
  category: string
  count: number
  status: SkillMatchStatus
}

export type SkillRadarPoint = {
  skill: string
  score: number
  status: SkillMatchStatus
}

export type RoleStackBarPoint = {
  role: string
  strong: number
  partial: number
  gap: number
}

export type MultiRoleRadarPoint = Record<string, string | number> & {
  skill: string
}

function truncateSkillLabel(skill: string, maxLength = 22): string {
  const trimmed = skill.trim()
  if (trimmed.length <= maxLength) return trimmed
  return `${trimmed.slice(0, maxLength - 1)}…`
}

export function buildSummaryBarData(
  detail: DetailedJobFitAnalysis
): SummaryBarPoint[] {
  return [
    {
      category: "Strong",
      count: detail.strongMatches.length,
      status: "strong",
    },
    {
      category: "Partial",
      count: detail.partialMatches.length,
      status: "partial",
    },
    {
      category: "Gaps",
      count: detail.growthAreas.length,
      status: "gap",
    },
  ]
}

export function buildSkillRadarData(
  detail: DetailedJobFitAnalysis,
  maxSkills = 10
): SkillRadarPoint[] {
  const points: SkillRadarPoint[] = [
    ...detail.strongMatches.map((item) => ({
      skill: truncateSkillLabel(item.requirement),
      score: SKILL_MATCH_SCORE.strong,
      status: "strong" as const,
    })),
    ...detail.partialMatches.map((item) => ({
      skill: truncateSkillLabel(item.requirement),
      score: SKILL_MATCH_SCORE.partial,
      status: "partial" as const,
    })),
    ...detail.growthAreas.map((item) => ({
      skill: truncateSkillLabel(item.requirement),
      score: SKILL_MATCH_SCORE.gap,
      status: "gap" as const,
    })),
  ]

  return points.slice(0, maxSkills)
}

export function buildRoleStackBarData(
  entries: JobFitHistoryEntry[]
): RoleStackBarPoint[] {
  return entries
    .map((entry) => {
      const detail = parseJobFitAnalysisDetailed(entry.analysisMarkdown)
      if (!detail) return null

      return {
        role: truncateSkillLabel(entry.roleTitle, 18),
        strong: detail.strongMatches.length,
        partial: detail.partialMatches.length,
        gap: detail.growthAreas.length,
      }
    })
    .filter((item): item is RoleStackBarPoint => item !== null)
}

export function buildMultiRoleRadarData(
  entries: JobFitHistoryEntry[],
  maxSkills = 8
): { data: MultiRoleRadarPoint[]; roleKeys: string[] } {
  const roleKeys = entries.map((entry) => entry.id)
  const skillMap = new Map<
    string,
    { label: string; cells: Record<string, number> }
  >()

  for (const entry of entries) {
    const detail = parseJobFitAnalysisDetailed(entry.analysisMarkdown)
    if (!detail) continue

    const addSkills = (
      items: { requirement: string }[],
      status: SkillMatchStatus
    ) => {
      for (const item of items) {
        const key = item.requirement.trim().toLowerCase()
        const score = SKILL_MATCH_SCORE[status]
        const existing = skillMap.get(key)

        if (!existing) {
          skillMap.set(key, {
            label: truncateSkillLabel(item.requirement),
            cells: { [entry.id]: score },
          })
          continue
        }

        const current = existing.cells[entry.id]
        if (current === undefined || score > current) {
          existing.cells[entry.id] = score
        }
      }
    }

    addSkills(detail.strongMatches, "strong")
    addSkills(detail.partialMatches, "partial")
    addSkills(detail.growthAreas, "gap")
  }

  const data = [...skillMap.values()]
    .sort((a, b) => a.label.localeCompare(b.label))
    .slice(0, maxSkills)
    .map((row) => {
      const point: MultiRoleRadarPoint = { skill: row.label }
      for (const roleId of roleKeys) {
        point[roleId] = row.cells[roleId] ?? 0
      }
      return point
    })

  return { data, roleKeys }
}

export function hasSkillChartData(detail: DetailedJobFitAnalysis): boolean {
  return (
    detail.strongMatches.length +
      detail.partialMatches.length +
      detail.growthAreas.length >
    0
  )
}
