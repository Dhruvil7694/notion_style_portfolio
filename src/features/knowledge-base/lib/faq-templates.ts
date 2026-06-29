import type { FaqItem } from "@/features/knowledge-base/lib/schemas"
import { parseFaqItems } from "@/features/knowledge-base/lib/schemas"
import { parseStringArray } from "@/features/portfolio/lib/project-case-study"
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

/** CMS FAQs win; otherwise use generated template items. */
export function resolveFaqItems(
  stored: unknown,
  template: FaqItem[]
): FaqItem[] {
  const custom = parseFaqItems(stored)
  if (custom.length > 0) {
    return custom
  }

  return template.filter(
    (item) => item.question.trim().length > 0 && item.answer.trim().length > 0
  )
}

export type ProjectFaqTemplateInput = {
  title?: string | null
  summary?: string | null
  tagline?: string | null
  overview?: string | null
  problem?: string | null
  challenge?: string | null
  solution?: string | null
  impact?: string | null
  approach?: string[] | null
  tech_stack?: string[] | null
  technologies?: string[] | null
  results?: string[] | null
  learnings?: string[] | null
  role?: string | null
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
  const role = firstText(input.role) ?? "Applied AI Engineer"

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
    | "problem"
    | "challenge"
    | "solution"
    | "impact"
    | "approach"
    | "tech_stack"
    | "technologies"
    | "results"
    | "learnings"
    | "role"
  >
): ProjectFaqTemplateInput {
  return {
    title: project.title,
    summary: project.summary,
    tagline: project.tagline,
    overview: project.overview,
    problem: project.problem,
    challenge: project.challenge,
    solution: project.solution,
    impact: project.impact,
    approach: parseStringArray(project.approach),
    tech_stack: project.tech_stack ?? [],
    technologies: project.technologies ?? [],
    results: parseStringArray(project.results),
    learnings: parseStringArray(project.learnings),
    role: project.role,
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
    | "problem"
    | "challenge"
    | "solution"
    | "impact"
    | "approach"
    | "tech_stack"
    | "technologies"
    | "results"
    | "learnings"
    | "role"
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
