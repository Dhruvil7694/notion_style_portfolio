"use client"

import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  RefreshCw,
  Sparkles,
  TrendingUp,
  X,
  Zap,
} from "lucide-react"
import {
  AnimatePresence,
  motion,
  MotionConfig,
  type Transition,
} from "motion/react"
import Link from "next/link"
import { useCallback, useEffect, useState } from "react"

import { AnimatedList } from "@/shared/ui/animated-list"
import { TextShimmer } from "@/shared/ui/text-shimmer"

// ── Types ──────────────────────────────────────────────────────────────────

export type DerivedInsight = {
  type: "critical" | "warning" | "quickwin" | "pattern" | "positive"
  mode: "seo" | "aeo" | "geo" | "content" | "projects" | "all"
  title: string
  detail: string
  href?: string
  pts?: number
}

type AiRecommendation = {
  title: string
  why: string
  how: string
  impact: "high" | "medium"
  mode: string
  href: string
}

type AiAnalysis = {
  headline: string | null
  summary: string
  recommendations: AiRecommendation[]
  generatedAt: number
}

export type AuditSummaryPayload = {
  seo: {
    avgScore: number
    criticalCount: number
    warningCount: number
    totalCount: number
    topFailingRules: string[]
  }
  aeo: {
    avgScore: number
    missingCount: number
    partialCount: number
    totalCount: number
    topFailingRules: string[]
  }
  geo: {
    avgScore: number
    absentCount: number
    emergingCount: number
    totalCount: number
    topFailingRules: string[]
  }
}

const CACHE_KEY = "dashboard_ai_analysis_v3"
const CACHE_TTL = 1000 * 60 * 60 * 6 // 6h

const ALLOWED_HREFS = new Set(["/admin/seo", "/admin/aeo", "/admin/geo"])
const MODE_HREF: Record<string, string> = {
  seo: "/admin/seo",
  aeo: "/admin/aeo",
  geo: "/admin/geo",
  all: "/admin/seo",
}

function safeHref(href: unknown, mode: unknown): string {
  if (typeof href === "string" && ALLOWED_HREFS.has(href)) return href
  if (typeof mode === "string" && mode in MODE_HREF) return MODE_HREF[mode]!
  return "/admin/seo"
}

function isValidRec(r: unknown): r is AiRecommendation {
  if (!r || typeof r !== "object") return false
  const rec = r as Record<string, unknown>
  return (
    typeof rec["title"] === "string" &&
    rec["title"].length > 0 &&
    typeof rec["why"] === "string" &&
    typeof rec["how"] === "string"
  )
}

function isValidAnalysis(raw: unknown): raw is AiAnalysis {
  if (!raw || typeof raw !== "object") return false
  const a = raw as Record<string, unknown>
  return (
    typeof a["summary"] === "string" &&
    a["summary"].length > 0 &&
    Array.isArray(a["recommendations"]) &&
    typeof a["generatedAt"] === "number"
  )
}

function sanitizeAnalysis(raw: AiAnalysis): AiAnalysis {
  return {
    headline: typeof raw.headline === "string" ? raw.headline : null,
    summary: raw.summary,
    generatedAt: raw.generatedAt,
    recommendations: raw.recommendations
      .filter(isValidRec)
      .slice(0, 3)
      .map((r) => ({
        ...r,
        href: safeHref(r.href, r.mode),
        impact:
          r.impact === "high" || r.impact === "medium" ? r.impact : "medium",
      })),
  }
}

// ── Insight card ───────────────────────────────────────────────────────────

const cardSpring: Transition = { type: "spring", stiffness: 400, damping: 40 }

const TYPE_CONFIG = {
  critical: {
    icon: AlertTriangle,
    iconBg: "bg-red-500/10",
    iconColor: "text-red-500 dark:text-red-400",
  },
  warning: {
    icon: AlertTriangle,
    iconBg: "bg-amber-500/10",
    iconColor: "text-amber-600 dark:text-amber-400",
  },
  quickwin: {
    icon: Zap,
    iconBg: "bg-yellow-500/10",
    iconColor: "text-yellow-600 dark:text-yellow-400",
  },
  pattern: {
    icon: TrendingUp,
    iconBg: "bg-blue-500/10",
    iconColor: "text-blue-600 dark:text-blue-400",
  },
  positive: {
    icon: CheckCircle2,
    iconBg: "bg-emerald-500/10",
    iconColor: "text-emerald-600 dark:text-emerald-400",
  },
}

const MODE_STYLE: Record<string, string> = {
  seo: "bg-green-500/15 text-green-600 dark:text-green-400",
  aeo: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  geo: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
  content: "bg-purple-500/15 text-purple-600 dark:text-purple-400",
  projects: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  all: "bg-muted text-muted-foreground",
}

function InsightCard({
  insight,
  index,
}: {
  insight: DerivedInsight
  index: number
}) {
  const cfg = TYPE_CONFIG[insight.type]
  const Icon = cfg.icon

  const card = (
    <motion.div
      layoutId={`insight-card-${index}`}
      transition={cardSpring}
      initial="rest"
      whileHover="hover"
      whileTap="tap"
      animate="rest"
      variants={{
        rest: { scale: 1 },
        hover: { scale: 1.025 },
        tap: { scale: 1.01 },
      }}
      className="group relative flex cursor-pointer items-center gap-3 rounded-xl border border-border/50 bg-muted/40 p-3 transition-colors hover:bg-muted/70"
    >
      {/* Icon box */}
      <motion.div
        layout
        variants={{ rest: { scale: 1 }, hover: { scale: 0.978 } }}
        className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${cfg.iconBg}`}
      >
        <Icon className={`size-4 ${cfg.iconColor}`} aria-hidden />
      </motion.div>

      {/* Text */}
      <motion.div
        layout
        variants={{ rest: { scale: 1 }, hover: { scale: 0.978 } }}
        className="min-w-0 flex-1"
      >
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-sm font-semibold leading-snug text-foreground">
            {insight.title}
          </span>
          <span
            className={`rounded-full px-1.5 py-px text-[10px] font-semibold uppercase tracking-wide ${MODE_STYLE[insight.mode] ?? "bg-muted text-muted-foreground"}`}
          >
            {insight.mode}
          </span>
          {insight.pts ? (
            <span className="text-[10px] font-medium tabular-nums text-yellow-600 dark:text-yellow-400/70">
              +{insight.pts}pts
            </span>
          ) : null}
        </div>
        <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
          {insight.detail}
        </p>
      </motion.div>

      {/* Arrow — only when linkable */}
      {insight.href ? (
        <motion.div
          layout
          className="shrink-0"
          variants={{
            rest: { x: 0, opacity: 0.3 },
            hover: { x: 5, opacity: 0.85 },
          }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        >
          <ArrowRight className="size-3.5 text-muted-foreground" aria-hidden />
        </motion.div>
      ) : null}
    </motion.div>
  )

  return insight.href ? (
    <Link href={insight.href} className="block">
      {card}
    </Link>
  ) : (
    card
  )
}

// ── Derived insights panel ─────────────────────────────────────────────────

export function DerivedInsightsPanel({
  insights,
}: {
  insights: DerivedInsight[]
}) {
  if (insights.length === 0) return null

  const critical = insights.filter((i) => i.type === "critical")
  const rest = insights.filter((i) => i.type !== "critical")
  const ordered = [...critical, ...rest]

  return (
    <MotionConfig transition={cardSpring}>
      <div className="flex h-full flex-col rounded-xl border border-border/60 bg-card/40 backdrop-blur-sm">
        {/* Fixed header */}
        <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border/60 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">Insights</span>
            <span className="text-xs text-muted-foreground tabular-nums">
              {ordered.length} signal{ordered.length !== 1 ? "s" : ""}
            </span>
          </div>
          {critical.length > 0 && (
            <span className="flex items-center gap-1 rounded-full bg-red-500/15 px-2 py-0.5 text-xs font-semibold text-red-500">
              <span className="size-1.5 animate-pulse rounded-full bg-red-500" />
              {critical.length} critical
            </span>
          )}
        </div>

        {/* Scrollable cards */}
        <div className="min-h-0 flex-1 overflow-y-auto p-3">
          <AnimatedList className="gap-2" delay={70} mode="instant">
            {ordered.map((insight, i) => (
              <InsightCard
                key={`${insight.type}-${insight.mode}-${insight.title.slice(0, 20)}`}
                insight={insight}
                index={i}
              />
            ))}
          </AnimatedList>
        </div>
      </div>
    </MotionConfig>
  )
}

// ── AI analysis panel ──────────────────────────────────────────────────────

export function AiPortfolioAnalysis({
  auditSummary,
}: {
  auditSummary: AuditSummaryPayload
}) {
  const [analysis, setAnalysis] = useState<AiAnalysis | null>(null)
  const [phase, setPhase] = useState<"idle" | "generating" | "done" | "error">(
    "idle"
  )
  const [error, setError] = useState<string | null>(null)

  // Load from cache on mount — validate before trusting
  useEffect(() => {
    try {
      const raw = localStorage.getItem(CACHE_KEY)
      if (!raw) return
      const parsed: unknown = JSON.parse(raw)
      if (!isValidAnalysis(parsed)) {
        localStorage.removeItem(CACHE_KEY)
        return
      }
      if (Date.now() - parsed.generatedAt >= CACHE_TTL) return
      setAnalysis(sanitizeAnalysis(parsed))
      setPhase("done")
    } catch {
      localStorage.removeItem(CACHE_KEY)
    }
  }, [])

  const generate = useCallback(async () => {
    setPhase("generating")
    setError(null)
    try {
      const res = await fetch("/api/admin/insights/portfolio-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(auditSummary),
      })
      const data = (await res.json()) as {
        ok?: boolean
        error?: string
        headline?: string | null
        summary?: string
        recommendations?: AiRecommendation[]
      }
      if (!res.ok || !data.ok) {
        setError(data.error ?? "Analysis failed")
        setPhase("error")
        return
      }
      if (!data.summary || !Array.isArray(data.recommendations)) {
        setError("Incomplete response from AI")
        setPhase("error")
        return
      }
      const result = sanitizeAnalysis({
        headline: data.headline ?? null,
        summary: data.summary,
        recommendations: data.recommendations as AiRecommendation[],
        generatedAt: Date.now(),
      })
      localStorage.setItem(CACHE_KEY, JSON.stringify(result))
      setAnalysis(result)
      setPhase("done")
    } catch {
      setError("Network error")
      setPhase("error")
    }
  }, [auditSummary])

  const modeBadge: Record<string, string> = {
    seo: "bg-green-500/15 text-green-600 dark:text-green-400",
    aeo: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
    geo: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
    all: "bg-muted text-muted-foreground",
  }

  const impactDot: Record<string, string> = {
    high: "bg-red-400",
    medium: "bg-amber-400",
  }

  // Don't render panel at all when idle and no cached result
  if (phase === "idle") {
    return (
      <div className="flex flex-col rounded-xl border border-border/60 bg-card/40 px-4 py-4 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-purple-500/10">
            <Sparkles className="size-3.5 text-purple-400" aria-hidden />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">
              AI Portfolio Analysis
            </p>
            <p className="text-xs text-muted-foreground">
              Get Claude&apos;s take on visibility gaps and quick wins
            </p>
          </div>
          <button
            className="group flex items-center gap-1.5 rounded-lg border border-purple-500/20 bg-purple-500/8 px-3 py-1.5 text-xs font-medium text-purple-400 transition-all hover:border-purple-500/40 hover:bg-purple-500/15"
            onClick={() => void generate()}
            type="button"
          >
            Generate
            <ArrowRight
              className="size-3 transition-transform group-hover:translate-x-0.5"
              aria-hidden
            />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col rounded-xl border border-border/60 bg-card/40 backdrop-blur-sm">
      {/* Fixed header */}
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border/60 px-4 py-3">
        <div className="flex items-center gap-2">
          <Sparkles className="size-3.5 text-purple-400" aria-hidden />
          <span className="text-sm font-semibold">AI Portfolio Analysis</span>
        </div>
        <div className="flex items-center gap-1">
          {phase === "done" && (
            <>
              <button
                className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                onClick={() => {
                  localStorage.removeItem(CACHE_KEY)
                  setAnalysis(null)
                  void generate()
                }}
                title="Regenerate"
                type="button"
              >
                <RefreshCw className="size-3" aria-hidden />
                Refresh
              </button>
              <button
                className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-red-500/10 hover:text-red-400"
                onClick={() => {
                  localStorage.removeItem(CACHE_KEY)
                  setAnalysis(null)
                  setPhase("idle")
                }}
                title="Clear analysis"
                type="button"
              >
                <X className="size-3" aria-hidden />
                Clear
              </button>
            </>
          )}
        </div>
      </div>

      {/* Scrollable content */}
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        {phase === "generating" && (
          <div className="space-y-3 py-1">
            <TextShimmer className="text-sm" duration={1.8}>
              Reading SEO, AEO, and GEO audit data…
            </TextShimmer>
            <TextShimmer className="text-sm" duration={2.2} spread={12}>
              Identifying visibility gaps and quick wins…
            </TextShimmer>
            <TextShimmer className="text-sm" duration={2.6} spread={10}>
              Writing portfolio recommendations…
            </TextShimmer>
          </div>
        )}

        {phase === "error" && (
          <div className="space-y-3">
            <p className="text-sm text-red-400">{error}</p>
            <button
              className="text-xs text-muted-foreground underline-offset-2 hover:underline"
              onClick={() => void generate()}
              type="button"
            >
              Retry
            </button>
          </div>
        )}

        {phase === "done" && analysis && (
          <div className="space-y-5">
            {/* Headline */}
            {analysis.headline && (
              <p className="text-base font-semibold leading-snug text-foreground">
                {analysis.headline}
              </p>
            )}

            {/* Summary */}
            <p className="text-sm leading-relaxed text-muted-foreground">
              {analysis.summary}
            </p>

            {/* Recommendation cards */}
            {analysis.recommendations.length > 0 && (
              <div className="space-y-3">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/40">
                  What to fix next
                </p>
                <AnimatedList delay={120} mode="instant">
                  {analysis.recommendations.map((rec, i) => (
                    <Link
                      key={i}
                      href={safeHref(rec.href, rec.mode)}
                      className="group mb-2 flex flex-col gap-2 rounded-lg border border-border/50 bg-muted/40 px-4 py-3.5 transition-all hover:bg-muted/70"
                    >
                      {/* Title row */}
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`size-2 shrink-0 rounded-full ${impactDot[rec.impact] ?? "bg-muted-foreground/40"}`}
                        />
                        <span className="flex-1 text-sm font-semibold leading-snug text-foreground">
                          {rec.title}
                        </span>
                        <span
                          className={`shrink-0 rounded-full px-1.5 py-px text-[10px] font-semibold uppercase tracking-wide ${modeBadge[rec.mode] ?? "bg-muted text-muted-foreground"}`}
                        >
                          {rec.mode}
                        </span>
                        <ArrowRight className="size-3.5 shrink-0 text-muted-foreground/30 transition-transform group-hover:translate-x-0.5 group-hover:text-muted-foreground/70" />
                      </div>

                      {/* Why */}
                      <p className="pl-[18px] text-sm leading-relaxed text-muted-foreground">
                        {rec.why}
                      </p>

                      {/* How */}
                      <p className="pl-[18px] text-xs leading-relaxed text-muted-foreground/55">
                        {rec.how}
                      </p>
                    </Link>
                  ))}
                </AnimatedList>
              </div>
            )}

            <p className="text-[10px] text-muted-foreground/25">
              Generated {new Date(analysis.generatedAt).toLocaleTimeString()} ·
              cached 6h
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
