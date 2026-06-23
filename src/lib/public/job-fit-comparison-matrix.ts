import type { JobFitHistoryEntry } from "@/lib/public/job-fit-history"
import type { DetailedJobFitAnalysis } from "@/lib/public/parse-job-fit-result"
import { parseJobFitAnalysisDetailed } from "@/lib/public/parse-job-fit-result"

export type SkillMatchStatus = "strong" | "partial" | "gap"

export type SkillComparisonCell = {
  status: SkillMatchStatus
  detail: string
}

export type SkillComparisonRow = {
  skill: string
  cells: Record<string, SkillComparisonCell | null>
}

export type JobFitComparisonMatrix = {
  roles: {
    id: string
    title: string
    fitScoreLabel: string
  }[]
  rows: SkillComparisonRow[]
}

const STATUS_RANK: Record<SkillMatchStatus, number> = {
  strong: 3,
  partial: 2,
  gap: 1,
}

function normalizeSkillKey(skill: string): string {
  return skill.trim().toLowerCase().replace(/\s+/g, " ")
}

function upsertSkillRow(
  map: Map<string, SkillComparisonRow>,
  skill: string,
  entryId: string,
  status: SkillMatchStatus,
  detail: string
): void {
  const key = normalizeSkillKey(skill)
  const existing = map.get(key)
  const cell: SkillComparisonCell = { status, detail }

  if (!existing) {
    map.set(key, { skill, cells: { [entryId]: cell } })
    return
  }

  const current = existing.cells[entryId]
  if (!current || STATUS_RANK[status] > STATUS_RANK[current.status]) {
    existing.cells[entryId] = cell
  }
}

export function buildJobFitComparisonMatrix(
  entries: JobFitHistoryEntry[]
): JobFitComparisonMatrix | null {
  if (entries.length === 0) return null

  const roles = entries.map((entry) => ({
    id: entry.id,
    title: entry.roleTitle,
    fitScoreLabel: entry.fitScoreLabel,
  }))

  const skillMap = new Map<string, SkillComparisonRow>()

  for (const entry of entries) {
    const detail = parseJobFitAnalysisDetailed(entry.analysisMarkdown)
    if (!detail) continue

    applySkills(skillMap, entry.id, detail, "strong", detail.strongMatches)
    applySkills(skillMap, entry.id, detail, "partial", detail.partialMatches)
    applySkills(skillMap, entry.id, detail, "gap", detail.growthAreas)
  }

  const rows = [...skillMap.values()].sort((a, b) =>
    a.skill.localeCompare(b.skill)
  )

  return { roles, rows }
}

function applySkills(
  map: Map<string, SkillComparisonRow>,
  entryId: string,
  _detail: DetailedJobFitAnalysis,
  status: SkillMatchStatus,
  items: { requirement: string; detail: string }[]
): void {
  for (const item of items) {
    upsertSkillRow(map, item.requirement, entryId, status, item.detail)
  }
}

export function formatJobFitComparisonMarkdown(
  matrix: JobFitComparisonMatrix
): string {
  const header = [
    "Skill",
    ...matrix.roles.map((role) => `${role.title} (${role.fitScoreLabel})`),
  ]
  const lines = [
    `| ${header.join(" | ")} |`,
    `| ${header.map(() => "---").join(" | ")} |`,
  ]

  for (const row of matrix.rows) {
    const cells = matrix.roles.map((role) => {
      const cell = row.cells[role.id]
      if (!cell) return "—"
      const label =
        cell.status === "strong"
          ? "Strong"
          : cell.status === "partial"
            ? "Partial"
            : "Gap"
      return cell.detail ? `${label}: ${cell.detail}` : label
    })
    lines.push(`| ${row.skill} | ${cells.join(" | ")} |`)
  }

  return lines.join("\n")
}
