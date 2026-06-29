import { NextResponse } from "next/server"

import { generateWithFailover } from "@/features/ai/lib/generate"
import { requireAdmin } from "@/shared/lib/auth"

type AuditSummaryPayload = {
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

const SYSTEM = `You are a visibility coach for an AI Engineer's portfolio site. Your job is to give clear, human-readable, actionable feedback — like a smart colleague reviewing their portfolio, not a data report.

The portfolio uses three scoring systems:
- SEO (Search Engine Optimization): how well Google/Bing can find and rank pages. Healthy ≥ 80, Warning 50–79, Critical < 50.
- AEO (Answer Engine Optimization): how well AI assistants (ChatGPT, Perplexity, Gemini) can cite and answer from the content. Optimized ≥ 75, Partial 40–74, Missing < 40.
- GEO (Generative Engine Optimization): how often LLMs mention this person in responses about AI Engineering. Prominent ≥ 70, Emerging 35–69, Absent < 35.

Write in plain English, as if talking to the portfolio owner directly. No jargon. No technical rule IDs. No field names like "seo_title_length" — translate them into plain language ("your page titles are too short").

Output schema — return ONLY valid JSON, no markdown:
{
  "headline": "One punchy sentence (max 12 words) summarizing the biggest issue or win right now.",
  "summary": "2–3 sentences. What's the current state of their portfolio's visibility? What's working, what's not? Be direct and specific about numbers.",
  "recommendations": [
    {
      "title": "Short action title (5–8 words, imperative verb)",
      "why": "One sentence explaining why this matters to them personally — what they're missing out on.",
      "how": "One concrete sentence on what to do. Specific, not generic.",
      "impact": "high" | "medium",
      "mode": "seo" | "aeo" | "geo" | "all",
      "href": "/admin/seo" | "/admin/aeo" | "/admin/geo"
    }
  ]
}

Rules:
- Maximum 3 recommendations, ordered by impact
- "title" must use imperative verbs: Fix, Add, Write, Link, Improve — not "Consider" or "You should"
- Translate rule names to plain English: seo_title_length → "page titles", faq_exists → "FAQ section", ai_summary_exists → "AI summary paragraph", expertise_linked → "expertise links", structured_facts → "key facts list", content_depth_overview → "content depth"
- Reference real numbers from the data
- href must be exactly one of: /admin/seo, /admin/aeo, /admin/geo
- Never say "portfolio" as a standalone word when you can say "your work" or "your pages"
- Be encouraging but honest`

export async function POST(request: Request): Promise<NextResponse> {
  await requireAdmin()

  let body: AuditSummaryPayload
  try {
    body = (await request.json()) as AuditSummaryPayload
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const { seo, aeo, geo } = body

  // Basic shape guard — all numeric fields must be safe numbers
  const nums = [
    seo.avgScore,
    seo.criticalCount,
    seo.warningCount,
    seo.totalCount,
    aeo.avgScore,
    aeo.missingCount,
    aeo.partialCount,
    aeo.totalCount,
    geo.avgScore,
    geo.absentCount,
    geo.emergingCount,
    geo.totalCount,
  ]
  if (nums.some((n) => typeof n !== "number" || !isFinite(n))) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
  }
  if (
    !Array.isArray(seo.topFailingRules) ||
    !Array.isArray(aeo.topFailingRules) ||
    !Array.isArray(geo.topFailingRules)
  ) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
  }

  const translateRules = (rules: string[]) =>
    rules
      .filter((r): r is string => typeof r === "string")
      .slice(0, 5)
      .map((r) => {
        const map: Record<string, string> = {
          seo_title_length: "page titles too short or long",
          seo_title_keyword: "page titles missing keywords",
          seo_desc_length: "meta descriptions too short",
          seo_desc_keyword: "meta descriptions missing keywords",
          faq_min_count: "not enough FAQ questions",
          faq_answer_quality: "FAQ answers too short",
          faq_exists: "no FAQ section",
          ai_summary_exists: "no AI summary paragraph",
          ai_summary_depth: "AI summary too brief",
          key_takeaways_count: "missing key takeaways",
          expertise_linked: "no expertise areas linked",
          expertise_breadth: "too few expertise areas linked",
          structured_facts: "no structured facts list",
          content_depth_overview: "content depth too thin",
          tags_or_stack: "missing tags or tech stack",
          slug_quality: "URL slugs not optimized",
          concept_tags: "no concept tags",
          citation_signals: "weak citation signals",
        }
        return map[r] ?? r
      })
      .join(", ")

  const prompt = `Here's the current visibility snapshot for my portfolio:

SEO — ${seo.avgScore}/100 average score
- ${seo.criticalCount} of ${seo.totalCount} pages are critical (below 50) — Google likely won't rank these
- ${seo.warningCount} pages are in warning range (50–79)
- Most common issues: ${translateRules(seo.topFailingRules) || "none found"}

AEO — ${aeo.avgScore}/100 average score
- ${aeo.missingCount} of ${aeo.totalCount} pages have almost no AI-citation signals (below 40)
- ${aeo.partialCount} pages are partial (40–74)
- Most common issues: ${translateRules(aeo.topFailingRules) || "none found"}

GEO — ${geo.avgScore}/100 average score
- ${geo.absentCount} of ${geo.totalCount} pages are essentially invisible to LLMs (below 35)
- ${geo.emergingCount} pages are emerging (35–69)
- Most common issues: ${translateRules(geo.topFailingRules) || "none found"}

Give me honest, direct feedback and tell me exactly what to fix first.`

  try {
    const raw = await generateWithFailover(prompt, SYSTEM, "visibility")
    const cleaned = raw
      .replace(/^```(?:json)?\n?/, "")
      .replace(/\n?```$/, "")
      .trim()
    const parsed = JSON.parse(cleaned) as {
      headline: string
      summary: string
      recommendations: Array<{
        title: string
        why: string
        how: string
        impact: "high" | "medium"
        mode: string
        href: string
      }>
    }

    if (!parsed.summary || !Array.isArray(parsed.recommendations)) {
      return NextResponse.json(
        { error: "Invalid AI response" },
        { status: 500 }
      )
    }

    // Sanitize hrefs to only allowed admin paths
    const ALLOWED_HREFS = new Set(["/admin/seo", "/admin/aeo", "/admin/geo"])
    const modeHref: Record<string, string> = {
      seo: "/admin/seo",
      aeo: "/admin/aeo",
      geo: "/admin/geo",
      all: "/admin/seo",
    }
    const recs = parsed.recommendations.slice(0, 3).map((r) => ({
      ...r,
      href: ALLOWED_HREFS.has(r.href)
        ? r.href
        : (modeHref[r.mode] ?? "/admin/seo"),
    }))

    return NextResponse.json({
      ok: true,
      headline: parsed.headline ?? null,
      summary: parsed.summary,
      recommendations: recs,
    })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Analysis failed" },
      { status: 500 }
    )
  }
}
