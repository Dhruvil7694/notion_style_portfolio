import type { DiscoveryDocument, DiscoverySearchContext } from "./types"

/** Search ranking weights — keyword match is highest signal */
export const SEARCH_RANKING_WEIGHTS = {
  keyword: 10,
  concept: 5,
  technology: 3,
  expertise: 2,
  relationship: 4,
  recency: 1,
  popularity: 0.5,
} as const

const MS_PER_DAY = 86_400_000
const RECENCY_WINDOW_DAYS = 180

export function normalizeSearchTerm(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

export function tokenizeQuery(query: string): string[] {
  return normalizeSearchTerm(query)
    .split(" ")
    .filter((token) => token.length >= 2)
}

function countTermMatches(values: string[], terms: string[]): number {
  const normalizedValues = values.map(normalizeSearchTerm).filter(Boolean)
  let matches = 0

  for (const term of terms) {
    for (const value of normalizedValues) {
      if (value.includes(term)) {
        matches += 1
        break
      }
    }
  }

  return matches
}

function scoreKeywordMatch(
  document: DiscoveryDocument,
  terms: string[]
): number {
  if (terms.length === 0) {
    return 0
  }

  const haystack = [
    document.title,
    document.description,
    document.slug.replace(/-/g, " "),
    ...document.keywords,
  ]

  return countTermMatches(haystack, terms) * SEARCH_RANKING_WEIGHTS.keyword
}

function scoreFieldMatch(
  values: string[],
  terms: string[],
  weight: number
): number {
  return countTermMatches(values, terms) * weight
}

function scoreRecencyBonus(updatedAt: string): number {
  const timestamp = Date.parse(updatedAt)
  if (Number.isNaN(timestamp)) {
    return 0
  }

  const ageDays = (Date.now() - timestamp) / MS_PER_DAY
  if (ageDays < 0 || ageDays > RECENCY_WINDOW_DAYS) {
    return 0
  }

  const freshness = 1 - ageDays / RECENCY_WINDOW_DAYS
  return freshness * SEARCH_RANKING_WEIGHTS.recency
}

function scoreRelationshipBonus(
  document: DiscoveryDocument,
  context?: DiscoverySearchContext
): number {
  if (!context) {
    return 0
  }

  let score = 0

  if (context.relatedIds?.includes(document.id)) {
    score += SEARCH_RANKING_WEIGHTS.relationship
  }

  score += scoreFieldMatch(
    document.expertise,
    context.expertise ?? [],
    SEARCH_RANKING_WEIGHTS.expertise
  )
  score += scoreFieldMatch(
    document.technologies,
    context.technologies ?? [],
    SEARCH_RANKING_WEIGHTS.technology
  )
  score += scoreFieldMatch(
    document.concepts,
    context.concepts ?? [],
    SEARCH_RANKING_WEIGHTS.concept
  )

  return score
}

export function scoreDiscoveryDocument(
  document: DiscoveryDocument,
  query: string,
  context?: DiscoverySearchContext
): number {
  const terms = tokenizeQuery(query)
  if (terms.length === 0) {
    return document.popularity * SEARCH_RANKING_WEIGHTS.popularity
  }

  return (
    scoreKeywordMatch(document, terms) +
    scoreFieldMatch(document.concepts, terms, SEARCH_RANKING_WEIGHTS.concept) +
    scoreFieldMatch(
      document.technologies,
      terms,
      SEARCH_RANKING_WEIGHTS.technology
    ) +
    scoreFieldMatch(
      document.expertise,
      terms,
      SEARCH_RANKING_WEIGHTS.expertise
    ) +
    scoreRelationshipBonus(document, context) +
    scoreRecencyBonus(document.updatedAt) +
    document.popularity * SEARCH_RANKING_WEIGHTS.popularity
  )
}

export function rankDiscoveryDocuments(
  documents: DiscoveryDocument[],
  query: string,
  context?: DiscoverySearchContext
): Array<DiscoveryDocument & { score: number }> {
  const trimmed = query.trim()

  if (!trimmed) {
    return [...documents]
      .sort((a, b) => {
        const popularityDiff = b.popularity - a.popularity
        if (popularityDiff !== 0) {
          return popularityDiff
        }

        return Date.parse(b.updatedAt) - Date.parse(a.updatedAt)
      })
      .map((document) => ({ ...document, score: document.popularity }))
  }

  return documents
    .map((document) => ({
      ...document,
      score: scoreDiscoveryDocument(document, trimmed, context),
    }))
    .filter((item) => item.score > 0)
    .sort((a, b) => {
      const scoreDiff = b.score - a.score
      if (scoreDiff !== 0) {
        return scoreDiff
      }

      return b.popularity - a.popularity
    })
}
