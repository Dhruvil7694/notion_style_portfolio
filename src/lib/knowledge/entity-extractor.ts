import { DEFAULT_CONCEPTS, normalizeTechnologySlug, TECHNOLOGY_ALIASES } from "@/lib/knowledge/taxonomy"

const TECHNOLOGY_PATTERNS = Object.entries(TECHNOLOGY_ALIASES).map(([slug, label]) => ({
  slug,
  label,
  pattern: new RegExp(`\\b${escapeRegExp(label)}\\b`, "i"),
}))

const CONCEPT_PATTERNS = DEFAULT_CONCEPTS.map((concept) => ({
  concept,
  pattern: new RegExp(`\\b${escapeRegExp(concept)}\\b`, "i"),
}))

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

export type ExtractedEntities = {
  technologies: string[]
  concepts: string[]
}

function uniqueSorted(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: "base" })
  )
}

export function extractEntitiesFromText(...chunks: Array<string | null | undefined>): ExtractedEntities {
  const haystack = chunks.filter(Boolean).join("\n")

  const technologies = TECHNOLOGY_PATTERNS.filter(({ pattern }) => pattern.test(haystack)).map(
    ({ slug }) => slug
  )

  const concepts = CONCEPT_PATTERNS.filter(({ pattern }) => pattern.test(haystack)).map(
    ({ concept }) => concept
  )

  return {
    technologies: uniqueSorted(technologies),
    concepts: uniqueSorted(concepts),
  }
}

export function extractEntitiesFromProject(input: {
  title: string
  summary?: string | null
  tagline?: string | null
  impact?: string | null
  ai_summary?: string | null
  tech_stack?: string[] | null
  technologies?: string[] | null
  concepts?: string[] | null
}): ExtractedEntities {
  const fromText = extractEntitiesFromText(
    input.title,
    input.summary,
    input.tagline,
    input.impact,
    input.ai_summary
  )

  const fromStack = (input.tech_stack ?? []).map((tech) => normalizeTechnologySlug(tech))
  const explicitTech = (input.technologies ?? []).map((tech) => normalizeTechnologySlug(tech))

  return {
    technologies: uniqueSorted([...fromText.technologies, ...fromStack, ...explicitTech]),
    concepts: uniqueSorted([...fromText.concepts, ...(input.concepts ?? [])]),
  }
}

export function extractEntitiesFromContent(input: {
  title: string
  excerpt?: string | null
  ai_summary?: string | null
  tags?: string[] | null
  concepts?: string[] | null
}): ExtractedEntities {
  const fromText = extractEntitiesFromText(
    input.title,
    input.excerpt,
    input.ai_summary,
    input.tags?.join(" ")
  )

  return {
    technologies: fromText.technologies,
    concepts: uniqueSorted([...fromText.concepts, ...(input.concepts ?? []), ...(input.tags ?? [])]),
  }
}

export function mergeExtractedEntities(
  ...groups: ExtractedEntities[]
): ExtractedEntities {
  return {
    technologies: uniqueSorted(groups.flatMap((group) => group.technologies)),
    concepts: uniqueSorted(groups.flatMap((group) => group.concepts)),
  }
}
