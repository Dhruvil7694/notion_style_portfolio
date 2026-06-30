import type { FaqItem } from "@/features/knowledge-base/lib/schemas"
import { parseFaqItems } from "@/features/knowledge-base/lib/schemas"
import {
  parseProjectChallenges,
  parseProjectMetrics,
  parseProjectTimeline,
  parseProjectTradeoffs,
  parseStringArray,
} from "@/features/portfolio/lib/project-case-study"
import type { Content, Project } from "@/shared/types/database.helpers"

export type ContentFaqType = "research" | "blog" | "automation"

const CONTENT_TYPE_LABELS: Record<ContentFaqType, string> = {
  research: "research article",
  blog: "writing piece",
  automation: "automation workflow",
}

function firstText(
  ...values: Array<string | null | undefined>
): string | undefined {
  for (const value of values) {
    const trimmed = value?.trim()
    if (trimmed) {
      return trimmed
    }
  }

  return undefined
}

function joinList(
  values: string[] | null | undefined,
  fallback: string
): string {
  const items = (values ?? []).map((item) => item.trim()).filter(Boolean)
  return items.length > 0 ? items.join(", ") : fallback
}

function truncate(text: string, max = 320): string {
  if (text.length <= max) {
    return text
  }

  return `${text.slice(0, max - 1).trimEnd()}…`
}

function mergeFaqItems(primary: FaqItem[], secondary: FaqItem[]): FaqItem[] {
  const seen = new Set<string>()
  const merged: FaqItem[] = []

  for (const item of [...primary, ...secondary]) {
    const key = item.question.trim().toLowerCase()
    if (seen.has(key)) {
      continue
    }

    seen.add(key)
    merged.push(item)
  }

  return merged
}

/** CMS FAQs win; template items fill in additional project-specific questions. */
export function resolveFaqItems(
  stored: unknown,
  template: FaqItem[]
): FaqItem[] {
  const custom = parseFaqItems(stored)
  if (custom.length === 0) {
    return template.filter(
      (item) => item.question.trim().length > 0 && item.answer.trim().length > 0
    )
  }

  return mergeFaqItems(
    custom,
    template.filter(
      (item) => item.question.trim().length > 0 && item.answer.trim().length > 0
    )
  )
}

export type ProjectFaqTemplateInput = {
  title?: string | null
  summary?: string | null
  tagline?: string | null
  overview?: string | null
  ai_summary?: string | null
  problem?: string | null
  challenge?: string | null
  solution?: string | null
  impact?: string | null
  why_built?: string | null
  approach?: string[] | null
  tech_stack?: string[] | null
  technologies?: string[] | null
  results?: string[] | null
  learnings?: string[] | null
  key_takeaways?: string[] | null
  my_contribution?: string[] | null
  expertise_slugs?: string[] | null
  concepts?: string[] | null
  role?: string | null
  category?: string | null
  status?: string | null
  year?: string | null
  live_url?: string | null
  github_url?: string | null
  demo_video_url?: string | null
  tradeoff_decision?: string | null
  tradeoff_reason?: string | null
  challenge_detail?: string | null
  challenge_solution?: string | null
  metrics_summary?: string | null
  timeline_summary?: string | null
}

export function buildProjectFaqTemplate(
  input: ProjectFaqTemplateInput
): FaqItem[] {
  const title = firstText(input.title) ?? "this project"
  const summary = firstText(input.summary, input.tagline, input.overview)
  const problem = firstText(input.problem, input.challenge)
  const solution = firstText(input.solution, input.approach?.[0])
  const impact = firstText(input.impact, input.results?.[0])
  const stack = joinList(
    [...(input.tech_stack ?? []), ...(input.technologies ?? [])],
    "production AI and backend tooling"
  )
  const learnings = joinList(
    input.learnings,
    "iterative delivery and production hardening"
  )
  const contribution = joinList(
    input.my_contribution,
    "architecture, implementation, and production rollout"
  )
  const role = firstText(input.role) ?? "Applied AI Engineer"
  const whyBuilt = firstText(input.why_built)
  const category = firstText(input.category) ?? "applied AI engineering"
  const status = firstText(input.status) ?? "production"
  const demoAnswer = input.live_url?.trim()
    ? `${title} has a live demo at ${input.live_url.trim()}.`
    : `${title} is documented in this case study with architecture notes, outcomes, and implementation detail.`
  const repoAnswer = input.github_url?.trim()
    ? `Source and implementation references are available at ${input.github_url.trim()}.`
    : `Implementation details are covered in the case study sections on approach, architecture, and engineering tradeoffs.`
  const approachSteps = joinList(
    input.approach,
    "scoping, architecture design, iterative implementation, and production hardening"
  )
  const resultsList = joinList(
    input.results,
    "faster workflows, higher reliability, and clearer operational visibility"
  )
  const takeaways = joinList(
    input.key_takeaways,
    "shipping production AI with clear tradeoffs, observability, and maintainable design"
  )
  const expertise = joinList(
    [...(input.expertise_slugs ?? []), ...(input.concepts ?? [])],
    "applied AI engineering, LLM systems, and automation"
  )
  const overview = firstText(input.overview, input.ai_summary)
  const aiSummary = firstText(input.ai_summary, input.overview)
  const year = firstText(input.year)
  const demoVideoAnswer = input.demo_video_url?.trim()
    ? `A walkthrough demo is available in the case study and at ${input.demo_video_url.trim()}.`
    : `Screenshots and walkthrough material are included in the case study where available.`

  return [
    {
      question: `What is ${title}?`,
      answer: summary
        ? truncate(summary)
        : `${title} is a production engineering project built by Dhruvil Patel.`,
    },
    {
      question: `What problem does ${title} solve?`,
      answer: problem
        ? truncate(problem)
        : `${title} addresses a real workflow or systems challenge in applied AI engineering.`,
    },
    {
      question: `How was ${title} built?`,
      answer: solution
        ? truncate(solution)
        : `${title} was designed with a production-first approach: clear architecture, measurable outcomes, and maintainable implementation.`,
    },
    {
      question: `What technologies power ${title}?`,
      answer: `${title} uses ${stack}. Stack choices prioritize reliability, observability, and speed to production.`,
    },
    {
      question: `What was the outcome of ${title}?`,
      answer: impact
        ? truncate(impact)
        : `${title} delivered measurable improvements in workflow speed, reliability, or decision quality.`,
    },
    {
      question: `What did ${role} learn from ${title}?`,
      answer: `Key learnings include ${learnings}.`,
    },
    {
      question: `Why was ${title} built?`,
      answer: whyBuilt
        ? truncate(whyBuilt)
        : `${title} was built to solve a real workflow problem with production-grade AI engineering rather than a one-off demo.`,
    },
    {
      question: `What was ${role}'s contribution to ${title}?`,
      answer: `Dhruvil Patel contributed across ${contribution}, with ownership from design through deployment.`,
    },
    {
      question: `What type of project is ${title}?`,
      answer: `${title} is a ${status} ${category} project focused on reliable applied AI systems and measurable outcomes.`,
    },
    {
      question: `How does ${title} handle reliability and scale?`,
      answer: `${title} was designed with observability, failure handling, and maintainable service boundaries so it can run in real production conditions.`,
    },
    {
      question: `What engineering challenges came up in ${title}?`,
      answer: problem
        ? `Core challenges included ${truncate(problem, 220)}. The case study breaks down how each was addressed.`
        : `The main challenges involved balancing speed, reliability, and AI system complexity in production.`,
    },
    {
      question: `Can I see a live demo of ${title}?`,
      answer: demoAnswer,
    },
    {
      question: `Where can I review the implementation for ${title}?`,
      answer: repoAnswer,
    },
    {
      question: `How does ${title} relate to Dhruvil Patel's portfolio?`,
      answer: `${title} demonstrates hands-on work in ${stack}, with a focus on production AI systems, automation, and measurable business impact.`,
    },
    {
      question: `What is the approach behind ${title}?`,
      answer: `The build followed ${approachSteps}. Each step is documented in the case study approach and walkthrough sections.`,
    },
    {
      question: `What does the system architecture of ${title} look like?`,
      answer: overview
        ? truncate(overview)
        : `${title} uses a modular architecture with clear boundaries between ingestion, AI orchestration, business logic, and user-facing surfaces.`,
    },
    {
      question: `What AI capabilities are included in ${title}?`,
      answer: aiSummary
        ? truncate(aiSummary)
        : `${title} combines LLM workflows, structured retrieval, and production guardrails designed for real users rather than demo-only flows.`,
    },
    {
      question: `What were the engineering tradeoffs in ${title}?`,
      answer:
        input.tradeoff_decision && input.tradeoff_reason
          ? `${input.tradeoff_decision} — ${truncate(input.tradeoff_reason, 260)}`
          : `${title} balanced delivery speed, reliability, and cost through deliberate stack and architecture choices documented in the tradeoffs section.`,
    },
    {
      question: `What challenges came up while building ${title}?`,
      answer:
        input.challenge_detail && input.challenge_solution
          ? `Challenge: ${truncate(input.challenge_detail, 180)} Solution: ${truncate(input.challenge_solution, 180)}`
          : problem
            ? `Key challenges included ${truncate(problem, 220)}. The case study explains how each was resolved.`
            : `The team navigated data quality, latency, and production edge cases while keeping the system maintainable.`,
    },
    {
      question: `What results did ${title} deliver?`,
      answer: `Documented results include ${resultsList}.`,
    },
    {
      question: `What metrics were tracked for ${title}?`,
      answer: input.metrics_summary
        ? input.metrics_summary
        : `The project tracked operational and product metrics such as throughput, reliability, response quality, and time saved for end users.`,
    },
    {
      question: `What are the key takeaways from ${title}?`,
      answer: `Engineers should remember ${takeaways}.`,
    },
    {
      question: `What expertise areas does ${title} demonstrate?`,
      answer: `${title} maps to ${expertise}, reflecting end-to-end ownership from design through deployment.`,
    },
    {
      question: `What was the timeline for ${title}?`,
      answer: input.timeline_summary
        ? input.timeline_summary
        : year
          ? `${title} was delivered in ${year} through phased milestones from discovery to production rollout.`
          : `${title} moved through discovery, build, validation, and production rollout in structured phases.`,
    },
    {
      question: `How was ${title} validated before launch?`,
      answer: `${title} was validated with realistic test scenarios, failure-path checks, and iteration on prompts, data flows, and service boundaries before production use.`,
    },
    {
      question: `How does ${title} handle failures and edge cases?`,
      answer: `The system uses guardrails, fallbacks, and observable failure paths so degraded behavior is predictable instead of silently wrong.`,
    },
    {
      question: `Is there a demo or walkthrough for ${title}?`,
      answer: demoVideoAnswer,
    },
    {
      question: `Who should review ${title}?`,
      answer: `Hiring managers, engineering leaders, and builders evaluating production AI work in ${category} should start with the case study overview, architecture, and results sections.`,
    },
    {
      question: `When was ${title} built?`,
      answer: year
        ? `${title} was built in ${year} and is currently marked as ${status}.`
        : `${title} is a ${status} project in Dhruvil Patel's portfolio.`,
    },
  ]
}

export type ContentFaqTemplateInput = {
  type: ContentFaqType
  title?: string | null
  excerpt?: string | null
  ai_summary?: string | null
  key_takeaways?: string[] | null
  tags?: string[] | null
  expertise_slugs?: string[] | null
}

export function buildContentFaqTemplate(
  input: ContentFaqTemplateInput
): FaqItem[] {
  const title = firstText(input.title) ?? "this piece"
  const label = CONTENT_TYPE_LABELS[input.type]
  const summary = firstText(input.ai_summary, input.excerpt)
  const takeaways = joinList(
    input.key_takeaways,
    "practical patterns for building production AI systems"
  )
  const topics = joinList(
    [...(input.tags ?? []), ...(input.expertise_slugs ?? [])],
    "applied AI, RAG, and agent workflows"
  )

  return [
    {
      question: `What is this ${label} about?`,
      answer: summary
        ? truncate(summary)
        : `${title} explores applied AI engineering topics with a focus on production-ready implementation.`,
    },
    {
      question: `Who should read ${title}?`,
      answer: `Engineers, hiring managers, and technical leaders interested in ${topics}.`,
    },
    {
      question: `What are the key takeaways from ${title}?`,
      answer: `Readers will learn about ${takeaways}.`,
    },
    {
      question: `How does ${title} relate to Dhruvil Patel's work?`,
      answer: `${title} reflects hands-on work in RAG systems, multi-agent workflows, and production AI infrastructure.`,
    },
  ]
}

export function toProjectFaqTemplateInput(
  project: Pick<
    Project,
    | "title"
    | "summary"
    | "tagline"
    | "overview"
    | "ai_summary"
    | "problem"
    | "challenge"
    | "solution"
    | "impact"
    | "why_built"
    | "approach"
    | "tech_stack"
    | "technologies"
    | "results"
    | "learnings"
    | "key_takeaways"
    | "my_contribution"
    | "expertise_slugs"
    | "concepts"
    | "role"
    | "category"
    | "status"
    | "year"
    | "live_url"
    | "github_url"
    | "demo_video_url"
    | "tradeoffs"
    | "challenges"
    | "metrics"
    | "timeline"
  >
): ProjectFaqTemplateInput {
  const tradeoffs = parseProjectTradeoffs(project.tradeoffs)
  const challenges = parseProjectChallenges(project.challenges)
  const metrics = parseProjectMetrics(project.metrics)
  const timeline = parseProjectTimeline(project.timeline)
  const firstTradeoff = tradeoffs[0]
  const firstChallenge = challenges[0]

  return {
    title: project.title,
    summary: project.summary,
    tagline: project.tagline,
    overview: project.overview,
    ai_summary: project.ai_summary,
    problem: project.problem,
    challenge: project.challenge,
    solution: project.solution,
    impact: project.impact,
    why_built: project.why_built,
    approach: parseStringArray(project.approach),
    tech_stack: project.tech_stack ?? [],
    technologies: project.technologies ?? [],
    results: parseStringArray(project.results),
    learnings: parseStringArray(project.learnings),
    key_takeaways: project.key_takeaways ?? [],
    my_contribution: parseStringArray(project.my_contribution),
    expertise_slugs: project.expertise_slugs ?? [],
    concepts: project.concepts ?? [],
    role: project.role,
    category: project.category,
    status: project.status,
    year: project.year,
    live_url: project.live_url,
    github_url: project.github_url,
    demo_video_url: project.demo_video_url,
    tradeoff_decision: firstTradeoff?.decision,
    tradeoff_reason: firstTradeoff?.reason ?? firstTradeoff?.tradeoff,
    challenge_detail: firstChallenge?.challenge,
    challenge_solution: firstChallenge?.solution,
    metrics_summary:
      metrics.length > 0
        ? metrics
            .slice(0, 4)
            .map((metric) => `${metric.label}: ${metric.value}`)
            .join("; ")
        : undefined,
    timeline_summary:
      timeline.length > 0
        ? timeline
            .slice(0, 4)
            .map((entry) =>
              entry.description
                ? `${entry.title} (${entry.period}) — ${entry.description}`
                : `${entry.title} (${entry.period})`
            )
            .join(" ")
        : undefined,
  }
}

export function resolveProjectFaqFromRecord(
  project: Pick<
    Project,
    | "faq"
    | "title"
    | "summary"
    | "tagline"
    | "overview"
    | "ai_summary"
    | "problem"
    | "challenge"
    | "solution"
    | "impact"
    | "why_built"
    | "approach"
    | "tech_stack"
    | "technologies"
    | "results"
    | "learnings"
    | "key_takeaways"
    | "my_contribution"
    | "expertise_slugs"
    | "concepts"
    | "role"
    | "category"
    | "status"
    | "year"
    | "live_url"
    | "github_url"
    | "demo_video_url"
    | "tradeoffs"
    | "challenges"
    | "metrics"
    | "timeline"
  >
): FaqItem[] {
  return resolveFaqItems(
    project.faq,
    buildProjectFaqTemplate(toProjectFaqTemplateInput(project))
  )
}

export function toContentFaqTemplateInput(
  item: Pick<
    Content,
    | "type"
    | "title"
    | "excerpt"
    | "ai_summary"
    | "key_takeaways"
    | "tags"
    | "expertise_slugs"
  >
): ContentFaqTemplateInput {
  const type =
    item.type === "research" || item.type === "automation" ? item.type : "blog"

  return {
    type,
    title: item.title,
    excerpt: item.excerpt,
    ai_summary: item.ai_summary,
    key_takeaways: item.key_takeaways ?? [],
    tags: item.tags ?? [],
    expertise_slugs: item.expertise_slugs ?? [],
  }
}

export function resolveContentFaqFromRecord(
  item: Pick<
    Content,
    | "faq"
    | "type"
    | "title"
    | "excerpt"
    | "ai_summary"
    | "key_takeaways"
    | "tags"
    | "expertise_slugs"
  >
): FaqItem[] {
  return resolveFaqItems(
    item.faq,
    buildContentFaqTemplate(toContentFaqTemplateInput(item))
  )
}
