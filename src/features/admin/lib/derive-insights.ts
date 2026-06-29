import type { AeoAuditResult } from "@/features/aeo/lib/audit/types"
import type { GeoAuditResult } from "@/features/geo/lib/audit/types"
import type { SeoAuditResult } from "@/features/seo/lib/audit/types"

import type { DerivedInsight } from "../components/dashboard-insights"

type PortfolioStats = {
  projects: {
    total: number
    published: number
    draft: number
    archived: number
  }
  content: {
    total: number
    byStatus: { published: number; draft: number; archived: number }
  }
  skills: number
  contentPublishedRate: number
}

export function deriveInsights(
  seo: SeoAuditResult,
  aeo: AeoAuditResult,
  geo: GeoAuditResult,
  portfolio?: PortfolioStats
): DerivedInsight[] {
  const insights: DerivedInsight[] = []

  // ── Critical counts ────────────────────────────────────────────────────────

  if (seo.criticalCount > 0) {
    insights.push({
      type: "critical",
      mode: "seo",
      title: `${seo.criticalCount} item${seo.criticalCount !== 1 ? "s" : ""} critical on SEO`,
      detail: `Score below 50 — Google may not rank these pages. Fix SEO title, description, or FAQ.`,
      href: "/admin/seo",
    })
  }

  if (aeo.missingCount > 0) {
    insights.push({
      type: "critical",
      mode: "aeo",
      title: `${aeo.missingCount} item${aeo.missingCount !== 1 ? "s" : ""} missing AEO signals`,
      detail: `Score below 40 — AI assistants won't cite these. Add FAQ, ai_summary, and key takeaways.`,
      href: "/admin/aeo",
    })
  }

  if (geo.absentCount > 0) {
    insights.push({
      type: "critical",
      mode: "geo",
      title: `${geo.absentCount} item${geo.absentCount !== 1 ? "s" : ""} absent from GEO`,
      detail: `Score below 35 — LLMs can't find or cite these. Link expertise areas and add concept tags.`,
      href: "/admin/geo",
    })
  }

  // ── Quick wins — single item with most fixable points ─────────────────────

  const seoQuickWin = [...seo.items]
    .filter((i) => i.band !== "healthy")
    .sort((a, b) => {
      const aAutoFixPts = a.checks
        .filter((c) => !c.passed && c.ruleId !== "slug_quality")
        .reduce((s, c) => s + c.max, 0)
      const bAutoFixPts = b.checks
        .filter((c) => !c.passed && c.ruleId !== "slug_quality")
        .reduce((s, c) => s + c.max, 0)
      return bAutoFixPts - aAutoFixPts
    })[0]

  if (seoQuickWin) {
    const fixablePts = seoQuickWin.checks
      .filter((c) => !c.passed && c.ruleId !== "slug_quality")
      .reduce((s, c) => s + c.max, 0)
    if (fixablePts > 0) {
      insights.push({
        type: "quickwin",
        mode: "seo",
        title: `Quick win: "${seoQuickWin.title}"`,
        detail: `${seoQuickWin.checks.filter((c) => !c.passed).length} SEO rules failing — fixable with AI in one click.`,
        href: "/admin/seo",
        pts: fixablePts,
      })
    }
  }

  const aeoQuickWin = [...aeo.items]
    .filter((i) => i.band !== "optimized")
    .sort((a, b) => {
      const aFixPts = a.checks
        .filter((c) => !c.passed)
        .reduce((s, c) => s + c.max, 0)
      const bFixPts = b.checks
        .filter((c) => !c.passed)
        .reduce((s, c) => s + c.max, 0)
      return bFixPts - aFixPts
    })[0]

  if (aeoQuickWin && aeoQuickWin.id !== seoQuickWin?.id) {
    const fixablePts = aeoQuickWin.checks
      .filter((c) => !c.passed)
      .reduce((s, c) => s + c.max, 0)
    if (fixablePts > 0) {
      insights.push({
        type: "quickwin",
        mode: "aeo",
        title: `Quick win: "${aeoQuickWin.title}"`,
        detail: `${aeoQuickWin.checks.filter((c) => !c.passed).length} AEO rules failing.`,
        href: "/admin/aeo",
        pts: fixablePts,
      })
    }
  }

  // ── Pattern detection ──────────────────────────────────────────────────────

  // FAQ coverage pattern
  const faqMissingAeo = aeo.items.filter((i) =>
    i.checks.some((c) => c.ruleId === "faq_exists" && !c.passed)
  ).length
  if (faqMissingAeo > 0 && aeo.totalCount > 0) {
    const pct = Math.round((faqMissingAeo / aeo.totalCount) * 100)
    if (pct >= 30) {
      insights.push({
        type: "pattern",
        mode: "aeo",
        title: `FAQ missing on ${pct}% of content`,
        detail: `${faqMissingAeo} of ${aeo.totalCount} items have no FAQ — biggest single AEO signal missing.`,
        href: "/admin/aeo",
      })
    }
  }

  // Expertise linking pattern
  const noExpertiseSeo = seo.items.filter((i) =>
    i.checks.some((c) => c.ruleId === "tags_or_stack" && !c.passed)
  ).length
  const noExpertiseGeo = geo.items.filter((i) =>
    i.checks.some((c) => c.ruleId === "expertise_breadth" && !c.passed)
  ).length
  if (noExpertiseGeo > 2) {
    insights.push({
      type: "pattern",
      mode: "geo",
      title: `${noExpertiseGeo} items lack expertise links`,
      detail: `Expertise breadth is the highest-weight GEO signal (10pts). Link expertise areas to improve LLM citation.`,
      href: "/admin/geo",
    })
  } else if (noExpertiseSeo > 2) {
    insights.push({
      type: "pattern",
      mode: "seo",
      title: `${noExpertiseSeo} items missing tags or tech stack`,
      detail: `Tags help search engines understand content topics. Add at least 2 per item.`,
      href: "/admin/seo",
    })
  }

  // ai_summary pattern
  const noAiSummary = aeo.items.filter((i) =>
    i.checks.some((c) => c.ruleId === "ai_summary_exists" && !c.passed)
  ).length
  if (noAiSummary > 1) {
    insights.push({
      type: "pattern",
      mode: "aeo",
      title: `${noAiSummary} items have no AI summary`,
      detail: `AI summary is the paragraph AI assistants quote verbatim. Missing = not citable.`,
      href: "/admin/aeo",
    })
  }

  // ── Portfolio / content health ─────────────────────────────────────────────

  if (portfolio) {
    const { projects, content, contentPublishedRate } = portfolio

    // High draft count
    const totalDrafts = projects.draft + content.byStatus.draft
    if (totalDrafts >= 5) {
      insights.push({
        type: "warning",
        mode: "content",
        title: `${totalDrafts} drafts unpublished`,
        detail: `${projects.draft} project${projects.draft !== 1 ? "s" : ""} and ${content.byStatus.draft} content items sitting as drafts. Publish to improve visibility scores.`,
        href: "/admin/content?status=draft",
      })
    }

    // Low publish rate
    if (content.total >= 3 && contentPublishedRate < 50) {
      insights.push({
        type: "warning",
        mode: "content",
        title: `Only ${contentPublishedRate}% of content published`,
        detail: `${content.byStatus.published} of ${content.total} content items are live. Drafts don't get indexed or cited.`,
        href: "/admin/content",
      })
    }

    // Good publish rate
    if (contentPublishedRate >= 80 && content.total >= 5) {
      insights.push({
        type: "positive",
        mode: "content",
        title: `${contentPublishedRate}% content published`,
        detail: `${content.byStatus.published} of ${content.total} items live. Strong publication rate.`,
      })
    }

    // Project publish rate low
    if (projects.total >= 3) {
      const projectPubRate = Math.round(
        (projects.published / projects.total) * 100
      )
      if (projectPubRate < 50) {
        insights.push({
          type: "warning",
          mode: "projects",
          title: `${projects.draft} project${projects.draft !== 1 ? "s" : ""} still in draft`,
          detail: `Only ${projects.published} of ${projects.total} projects published. Unpublished projects can't be cited or indexed.`,
          href: "/admin/projects",
        })
      }
    }
  }

  // ── Positive signal (if doing well) ───────────────────────────────────────

  if (seo.avgScore >= 70 && aeo.avgScore >= 60 && geo.avgScore >= 55) {
    insights.push({
      type: "positive",
      mode: "all",
      title: "Strong visibility across all three engines",
      detail: `SEO ${seo.avgScore}/100 · AEO ${aeo.avgScore}/100 · GEO ${geo.avgScore}/100. Keep publishing and improving.`,
    })
  } else if (seo.avgScore >= 80) {
    insights.push({
      type: "positive",
      mode: "seo",
      title: `SEO avg ${seo.avgScore}/100 — healthy`,
      detail: `${seo.healthyCount} of ${seo.totalCount} items in healthy band. Focus next on AEO and GEO.`,
    })
  }

  // Cap at 6 insights — most important first (critical → quickwin → pattern → positive)
  return insights.slice(0, 6)
}

export function computeTopFailingRules(
  items: Array<{ checks: Array<{ ruleId: string; passed: boolean }> }>
): string[] {
  const counts: Record<string, number> = {}
  for (const item of items) {
    for (const check of item.checks) {
      if (!check.passed) {
        counts[check.ruleId] = (counts[check.ruleId] ?? 0) + 1
      }
    }
  }
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([ruleId]) => ruleId)
}
