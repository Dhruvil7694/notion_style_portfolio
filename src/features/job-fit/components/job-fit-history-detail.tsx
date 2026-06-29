"use client"

import type { JobFitHistoryEntry } from "@/features/job-fit/lib/job-fit-history"
import type { JobFitSkillRow } from "@/features/job-fit/lib/parse-job-fit-result"
import { parseJobFitAnalysisDetailed } from "@/features/job-fit/lib/parse-job-fit-result"
import { parseSeniorityFit } from "@/features/portfolio/lib/job-seniority"
import { useSiteTheme } from "@/features/site-shell/components/site-theme-provider"
import { cn } from "@/shared/lib/utils"

import { JobFitSeniorityVerdict } from "./job-fit-seniority-hint"
import { JobFitSkillChartFromMarkdown } from "./job-fit-skill-chart"

type JobFitHistoryDetailProps = {
  entry: JobFitHistoryEntry
}

function SkillList({
  items,
  tone,
}: {
  items: JobFitSkillRow[]
  tone: "strong" | "partial" | "gap"
}) {
  if (items.length === 0) return null

  const toneClass =
    tone === "strong"
      ? "text-foreground/80"
      : tone === "partial"
        ? "text-foreground/70"
        : "text-muted-foreground/75"

  return (
    <ul className="space-y-1.5">
      {items.map((item) => (
        <li key={item.requirement} className="text-[10px] leading-relaxed">
          <span className={cn("font-medium", toneClass)}>
            {item.requirement}
          </span>
          {item.detail ? (
            <span className="text-muted-foreground/60"> — {item.detail}</span>
          ) : null}
        </li>
      ))}
    </ul>
  )
}

export function JobFitHistoryDetail({ entry }: JobFitHistoryDetailProps) {
  const { theme } = useSiteTheme()
  const isDarkTheme = theme === "dark"
  const detail = parseJobFitAnalysisDetailed(entry.analysisMarkdown)
  const seniorityFit = parseSeniorityFit(entry.analysisMarkdown)

  if (!detail) {
    return (
      <p className="text-[10px] text-muted-foreground/55">
        Could not load skill breakdown for this role.
      </p>
    )
  }

  return (
    <div className="space-y-2.5 border-t border-border/30 bg-muted/5 px-2.5 py-2.5">
      {seniorityFit ? (
        <JobFitSeniorityVerdict compact seniority={seniorityFit} />
      ) : null}

      <JobFitSkillChartFromMarkdown
        className="!space-y-2"
        layout="summary"
        markdown={entry.analysisMarkdown}
        variant="compact"
      />

      <div className="flex flex-wrap gap-2 text-[10px] text-muted-foreground/60">
        <span>
          <span className={isDarkTheme ? "text-green-400" : "text-foreground"}>
            {detail.strongMatches.length}
          </span>{" "}
          strong
        </span>
        <span>·</span>
        <span>{detail.partialMatches.length} partial</span>
        <span>·</span>
        <span>{detail.growthAreas.length} gaps</span>
      </div>

      {detail.summary ? (
        <p className="text-[10px] leading-relaxed text-muted-foreground/70">
          {detail.summary}
        </p>
      ) : null}

      {detail.strongMatches.length > 0 ? (
        <div>
          <p className="mb-1 text-[10px] font-medium text-foreground/75">
            Strong matches
          </p>
          <SkillList items={detail.strongMatches} tone="strong" />
        </div>
      ) : null}

      {detail.partialMatches.length > 0 ? (
        <div>
          <p className="mb-1 text-[10px] font-medium text-foreground/75">
            Partial matches
          </p>
          <SkillList items={detail.partialMatches} tone="partial" />
        </div>
      ) : null}

      {detail.growthAreas.length > 0 ? (
        <div>
          <p className="mb-1 text-[10px] font-medium text-foreground/75">
            Growth areas
          </p>
          <SkillList items={detail.growthAreas} tone="gap" />
        </div>
      ) : null}
    </div>
  )
}

type JobFitHistoryCompareNoteProps = {
  entries: JobFitHistoryEntry[]
}

export function JobFitHistoryCompareNote({
  entries,
}: JobFitHistoryCompareNoteProps) {
  if (entries.length < 2) return null

  const scores = entries.map((entry) => entry.fitScore)
  const allSameScore = scores.every((score) => score === scores[0])

  if (!allSameScore) {
    return (
      <p className="mb-2 text-[10px] leading-relaxed text-muted-foreground/55">
        Expand a role to see which skills drove its score — the same % can hide
        different gaps.
      </p>
    )
  }

  const details = entries
    .map((entry) => parseJobFitAnalysisDetailed(entry.analysisMarkdown))
    .filter((item): item is NonNullable<typeof item> => item !== null)

  const gapCounts = details.map((item) => item.growthAreas.length)
  const allSameGaps =
    gapCounts.length > 0 && gapCounts.every((count) => count === gapCounts[0])

  return (
    <p className="mb-2 text-[10px] leading-relaxed text-muted-foreground/55">
      {allSameGaps
        ? `All roles scored ${entries[0]?.fitScoreLabel} because Dhruvil's core AI/ML skills match strongly — differences are in role-specific gaps below.`
        : `Same ${entries[0]?.fitScoreLabel} overall, but gap counts differ — expand each role to compare skills.`}
    </p>
  )
}
