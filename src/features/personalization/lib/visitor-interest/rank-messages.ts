import type { DiscoveryDocumentType } from "@/features/discovery/lib/types"

import { DEFAULT_INTEREST_WEIGHTS } from "./constants"
import type { VisitorInterest } from "./types"
import {
  messageMatchesToken,
  normalizeMatchText,
  shortenTitle,
  slugToLabel,
  tokenizeInterestText,
} from "./utils"

const CONTENT_TYPES = new Set<DiscoveryDocumentType>([
  "project",
  "research",
  "article",
  "automation",
])

export function buildPersonalizedTemplates(
  interest: VisitorInterest
): string[] {
  const templates: string[] = []
  const seen = new Set<string>()

  function pushTemplate(text: string): void {
    const trimmed = text.trim()
    if (!trimmed || seen.has(trimmed)) {
      return
    }

    seen.add(trimmed)
    templates.push(trimmed)
  }

  for (const document of interest.recentlyViewed) {
    if (!CONTENT_TYPES.has(document.type)) {
      continue
    }

    const title = shortenTitle(document.title)
    pushTemplate(`Ask me about ${title}`)
    pushTemplate(`See how I built ${title}`)

    if (document.expertise[0]) {
      pushTemplate(
        `${title} uses ${slugToLabel(document.expertise[0])} — happy to explain`
      )
    }
  }

  if (interest.topExpertise[0]) {
    pushTemplate(`Want to go deeper on ${interest.topExpertise[0]}?`)
  }

  if (interest.topTechnologies[0]) {
    pushTemplate(`I work with ${interest.topTechnologies[0]} in production`)
  }

  if (interest.lastSearchQuery) {
    const query = shortenTitle(interest.lastSearchQuery, 42)
    pushTemplate(`Looking for ${query}? I can point you to proof`)
  }

  if (interest.lastAssistantQuestion) {
    const question = shortenTitle(interest.lastAssistantQuestion, 42)
    pushTemplate(`Still thinking about "${question}"?`)
  }

  return templates
}

export function scoreMessageForInterest(
  message: string,
  interest: VisitorInterest
): number {
  let score = 1
  const normalizedMessage = normalizeMatchText(message)

  for (const token of interest.intentTokens) {
    if (messageMatchesToken(message, token)) {
      score += DEFAULT_INTEREST_WEIGHTS.intentToken
    }
  }

  for (const [slug, weight] of Object.entries(interest.expertise)) {
    const label = slugToLabel(slug)
    if (
      normalizedMessage.includes(normalizeMatchText(label)) ||
      normalizedMessage.includes(slug.replace(/-/g, " "))
    ) {
      score += weight * DEFAULT_INTEREST_WEIGHTS.expertise
    }
  }

  for (const [slug, weight] of Object.entries(interest.technologies)) {
    const label = slugToLabel(slug)
    if (
      normalizedMessage.includes(normalizeMatchText(label)) ||
      normalizedMessage.includes(slug.replace(/-/g, " "))
    ) {
      score += weight * DEFAULT_INTEREST_WEIGHTS.technology
    }
  }

  for (const [slug, weight] of Object.entries(interest.concepts)) {
    const label = slugToLabel(slug)
    if (
      normalizedMessage.includes(normalizeMatchText(label)) ||
      normalizedMessage.includes(slug.replace(/-/g, " "))
    ) {
      score += weight * DEFAULT_INTEREST_WEIGHTS.concept
    }
  }

  for (const title of interest.recentTitles) {
    const fragment = title.slice(0, Math.min(title.length, 24)).toLowerCase()
    if (fragment.length > 4 && normalizedMessage.includes(fragment)) {
      score += DEFAULT_INTEREST_WEIGHTS.recentTitle
    }
  }

  if (interest.lastSearchQuery) {
    for (const token of tokenizeInterestText(interest.lastSearchQuery)) {
      if (messageMatchesToken(message, token)) {
        score += DEFAULT_INTEREST_WEIGHTS.lastSearch
      }
    }
  }

  if (interest.lastAssistantQuestion) {
    for (const token of tokenizeInterestText(interest.lastAssistantQuestion)) {
      if (messageMatchesToken(message, token)) {
        score += DEFAULT_INTEREST_WEIGHTS.lastAssistant
      }
    }
  }

  return score
}

export function rankAvatarHoverMessages(
  messages: string[],
  interest: VisitorInterest | null
): string[] {
  const unique = [...new Set(messages.filter(Boolean))]

  if (!interest || interest.signalCount === 0) {
    return unique
  }

  return unique
    .map((message, index) => ({
      message,
      score: scoreMessageForInterest(message, interest),
      index,
    }))
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score
      }

      return left.index - right.index
    })
    .map((entry) => entry.message)
}
