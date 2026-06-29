"use client"

import {
  formatSeniorityHint,
  type JdSeniorityMeta,
  type ParsedSeniorityFit,
} from "@/features/portfolio/lib/job-seniority"
import { useSiteTheme } from "@/features/site-shell/components/site-theme-provider"
import { cn } from "@/shared/lib/utils"

type JobFitSeniorityBadgeProps = {
  meta: JdSeniorityMeta
  className?: string
  inline?: boolean
}

export function hasSeniorityMeta(meta: JdSeniorityMeta): boolean {
  return (
    meta.seniority !== "unknown" ||
    meta.yearsExperienceMin != null ||
    meta.yearsExperienceMax != null
  )
}

export function JobFitSeniorityBadge({
  meta,
  className,
  inline = false,
}: JobFitSeniorityBadgeProps) {
  const { theme } = useSiteTheme()
  const isDarkTheme = theme === "dark"
  const hint = formatSeniorityHint(meta)

  if (!hasSeniorityMeta(meta)) {
    return null
  }

  return (
    <span
      className={cn(
        inline ? "inline" : "block text-[10px]",
        !inline && (isDarkTheme ? "text-green-400/75" : "text-foreground/70"),
        className
      )}
    >
      Seniority: <span className="font-medium">{hint}</span>
    </span>
  )
}

type JobFitRoleSeniorityLineProps = {
  roleTitle: string | null
  meta: JdSeniorityMeta
  className?: string
}

export function JobFitRoleSeniorityLine({
  roleTitle,
  meta,
  className,
}: JobFitRoleSeniorityLineProps) {
  const showSeniority = hasSeniorityMeta(meta)
  const hint = formatSeniorityHint(meta)

  if (!roleTitle && !showSeniority) return null

  return (
    <div className={cn("space-y-0.5", className)}>
      {roleTitle ? (
        <p>
          Detected role: <span className="font-medium">{roleTitle}</span>
        </p>
      ) : null}
      {showSeniority ? (
        <p>
          Seniority: <span className="font-medium">{hint}</span>
        </p>
      ) : null}
    </div>
  )
}

type JobFitSeniorityVerdictProps = {
  seniority: ParsedSeniorityFit
  compact?: boolean
  className?: string
}

export function JobFitSeniorityVerdict({
  seniority,
  compact = false,
  className,
}: JobFitSeniorityVerdictProps) {
  if (!seniority.verdict && !seniority.roleLevel) return null

  return (
    <div
      className={cn(
        "rounded-lg border border-border/40 bg-muted/10",
        compact ? "px-2.5 py-2" : "px-3 py-2.5",
        className
      )}
    >
      <p className="text-[10px] font-medium text-muted-foreground/60">
        Seniority fit
      </p>
      {seniority.roleLevel ? (
        <p className="mt-1 text-[11px] text-foreground/85">
          <span className="text-muted-foreground/60">Role:</span>{" "}
          {seniority.roleLevel}
        </p>
      ) : null}
      {!compact && seniority.profileLevel ? (
        <p className="mt-0.5 text-[10px] text-muted-foreground/65">
          {seniority.profileLevel}
        </p>
      ) : null}
      {seniority.verdict ? (
        <p className="mt-1 text-[11px] leading-relaxed text-foreground/80">
          {seniority.verdict}
        </p>
      ) : null}
    </div>
  )
}
