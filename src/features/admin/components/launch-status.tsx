import {
  AlertTriangle,
  CheckCircle2,
  Info,
  type LucideIcon,
  Rocket,
  ShieldAlert,
  XCircle,
} from "lucide-react"

import { cn } from "@/shared/lib/utils"

export type LaunchStatusLevel = "healthy" | "warning" | "critical"

export type LaunchFindingLevel = "ok" | "warn" | "error" | "info"

const STATUS_ICON: Record<LaunchStatusLevel, LucideIcon> = {
  healthy: CheckCircle2,
  warning: AlertTriangle,
  critical: XCircle,
}

const STATUS_COLOR: Record<LaunchStatusLevel, string> = {
  healthy: "text-green-600 dark:text-green-400",
  warning: "text-amber-600 dark:text-amber-400",
  critical: "text-red-600 dark:text-red-400",
}

const STATUS_BADGE: Record<
  LaunchStatusLevel,
  { label: string; className: string }
> = {
  healthy: {
    label: "Healthy",
    className:
      "border-green-500/25 bg-green-500/10 text-green-700 dark:text-green-400",
  },
  warning: {
    label: "Warning",
    className:
      "border-amber-500/25 bg-amber-500/10 text-amber-800 dark:text-amber-300",
  },
  critical: {
    label: "Critical",
    className: "border-red-500/25 bg-red-500/10 text-red-700 dark:text-red-400",
  },
}

const FINDING_ICON: Record<LaunchFindingLevel, LucideIcon> = {
  ok: CheckCircle2,
  warn: AlertTriangle,
  error: XCircle,
  info: Info,
}

const FINDING_COLOR: Record<LaunchFindingLevel, string> = {
  ok: "text-green-600 dark:text-green-400",
  warn: "text-amber-600 dark:text-amber-400",
  error: "text-red-600 dark:text-red-400",
  info: "text-muted-foreground",
}

export function LaunchStatusIcon({
  status,
  className,
  size = "sm",
}: {
  status: LaunchStatusLevel
  className?: string
  size?: "sm" | "md" | "lg"
}) {
  const Icon = STATUS_ICON[status]
  const sizeClass =
    size === "lg" ? "size-8" : size === "md" ? "size-5" : "size-4"

  return (
    <Icon
      aria-hidden
      className={cn("shrink-0", sizeClass, STATUS_COLOR[status], className)}
    />
  )
}

export function LaunchFindingIcon({
  level,
  className,
}: {
  level: LaunchFindingLevel
  className?: string
}) {
  const Icon = FINDING_ICON[level]
  return (
    <Icon
      aria-hidden
      className={cn("size-3.5 shrink-0", FINDING_COLOR[level], className)}
    />
  )
}

export function LaunchStatusBadge({ status }: { status: LaunchStatusLevel }) {
  const badge = STATUS_BADGE[status]
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        badge.className
      )}
    >
      <LaunchStatusIcon size="sm" status={status} />
      {badge.label}
    </span>
  )
}

type LaunchReadinessBannerProps = {
  status: LaunchStatusLevel
  score?: number
  title: string
  subtitle?: string
}

export function LaunchReadinessBanner({
  status,
  score,
  title,
  subtitle,
}: LaunchReadinessBannerProps) {
  const BannerIcon =
    status === "healthy"
      ? Rocket
      : status === "warning"
        ? AlertTriangle
        : ShieldAlert

  return (
    <div
      className={cn(
        "border-border bg-muted/45 flex flex-col gap-4 rounded-xl border p-5 shadow-md sm:flex-row sm:items-center sm:justify-between",
        status === "healthy" && "ring-green-500/20 ring-1",
        status === "warning" && "ring-amber-500/20 ring-1",
        status === "critical" && "ring-red-500/20 ring-1"
      )}
    >
      <div className="flex min-w-0 items-start gap-4">
        <div
          className={cn(
            "flex size-11 shrink-0 items-center justify-center rounded-xl border",
            status === "healthy" && "border-green-500/25 bg-green-500/10",
            status === "warning" && "border-amber-500/25 bg-amber-500/10",
            status === "critical" && "border-red-500/25 bg-red-500/10"
          )}
        >
          <BannerIcon
            aria-hidden
            className={cn("size-5", STATUS_COLOR[status])}
          />
        </div>
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-semibold tracking-tight">{title}</h2>
            <LaunchStatusBadge status={status} />
          </div>
          {subtitle ? (
            <p className="text-muted-foreground text-sm">{subtitle}</p>
          ) : null}
        </div>
      </div>

      {score !== undefined ? (
        <div className="border-border bg-background/60 shrink-0 rounded-lg border px-4 py-3 text-center shadow-sm">
          <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
            Score
          </p>
          <p
            className={cn(
              "mt-0.5 text-2xl font-semibold tabular-nums",
              score >= 80
                ? STATUS_COLOR.healthy
                : score >= 60
                  ? STATUS_COLOR.warning
                  : STATUS_COLOR.critical
            )}
          >
            {score}
            <span className="text-muted-foreground text-sm font-normal">
              /100
            </span>
          </p>
        </div>
      ) : null}
    </div>
  )
}

export function LaunchScoreBar({
  score,
  className,
}: {
  score: number
  className?: string
}) {
  const clamped = Math.min(100, Math.max(0, score))
  const barColor =
    clamped >= 80
      ? "bg-green-500"
      : clamped >= 60
        ? "bg-amber-500"
        : "bg-red-500"

  return (
    <div className={cn("space-y-1.5", className)}>
      <div
        aria-hidden
        className="bg-muted h-1.5 w-full overflow-hidden rounded-full"
      >
        <div
          className={cn("h-full rounded-full transition-all", barColor)}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  )
}

export function LaunchFindingRow({
  level,
  message,
}: {
  level: LaunchFindingLevel
  message: string
}) {
  return (
    <li className="flex items-start gap-2 text-sm">
      <LaunchFindingIcon className="mt-0.5" level={level} />
      <span
        className={cn(
          level === "error" && "text-red-700 dark:text-red-300",
          level === "warn" && "text-amber-800 dark:text-amber-300",
          level === "ok" && "text-muted-foreground",
          level === "info" && "text-muted-foreground"
        )}
      >
        {message}
      </span>
    </li>
  )
}

export function launchScoreColor(score: number): string {
  if (score >= 80) return STATUS_COLOR.healthy
  if (score >= 60) return STATUS_COLOR.warning
  return STATUS_COLOR.critical
}

export function recommendationStatus(
  recommendation: "ready" | "caution" | "blocked"
): LaunchStatusLevel {
  if (recommendation === "ready") return "healthy"
  if (recommendation === "caution") return "warning"
  return "critical"
}

export function RecommendationBanner({
  recommendation,
  launchScore,
}: {
  recommendation: "ready" | "caution" | "blocked"
  launchScore: number
}) {
  const status = recommendationStatus(recommendation)
  const copy = {
    ready: {
      title: "Ready for production",
      subtitle: "All critical gates passed. Minor improvements optional.",
    },
    caution: {
      title: "Ready with minor warnings",
      subtitle:
        "Deploy possible — review warnings before or shortly after launch.",
    },
    blocked: {
      title: "Not ready for production",
      subtitle: "Resolve critical issues and deployment gate failures first.",
    },
  }[recommendation]

  return (
    <LaunchReadinessBanner
      score={launchScore}
      status={status}
      subtitle={copy.subtitle}
      title={copy.title}
    />
  )
}
