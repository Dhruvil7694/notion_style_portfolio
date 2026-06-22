import type { DiscoveryDocumentType } from "@/lib/discovery/types"

import { readVisitorProfile } from "./storage"
import type { StoredVisitorProfile, VisitorInterest } from "./types"
import { incrementCount, slugToLabel, tokenizeInterestText, topWeightedKeys } from "./utils"

function buildIntentTokens(profile: StoredVisitorProfile): string[] {
  const tokens = new Set<string>()

  for (const signal of profile.searchQueries) {
    for (const token of tokenizeInterestText(signal.query)) {
      tokens.add(token)
    }
  }

  for (const signal of profile.assistantQuestions) {
    for (const token of tokenizeInterestText(signal.query)) {
      tokens.add(token)
    }
  }

  for (const document of profile.recentlyViewed) {
    for (const keyword of document.keywords) {
      for (const token of tokenizeInterestText(keyword)) {
        tokens.add(token)
      }
    }
  }

  return [...tokens]
}

export function buildVisitorInterest(
  profile: StoredVisitorProfile
): VisitorInterest | null {
  if (
    profile.recentlyViewed.length === 0 &&
    profile.searchQueries.length === 0 &&
    profile.assistantQuestions.length === 0
  ) {
    return null
  }

  const expertise: Record<string, number> = {}
  const technologies: Record<string, number> = {}
  const concepts: Record<string, number> = {}
  const contentTypes = {} as Record<DiscoveryDocumentType, number>
  const recentTitles: string[] = []
  const recentKeywords = new Set<string>()

  profile.recentlyViewed.forEach((document, index) => {
    const weight = Math.max(profile.recentlyViewed.length - index, 1)
    recentTitles.push(document.title)

    incrementCount(contentTypes, document.type, weight)

    for (const value of document.expertise) {
      incrementCount(expertise, value, weight)
    }

    for (const value of document.technologies) {
      incrementCount(technologies, value, weight)
    }

    for (const value of document.concepts) {
      incrementCount(concepts, value, weight)
    }

    for (const keyword of document.keywords) {
      recentKeywords.add(keyword)
    }
  })

  const lastSearchQuery = profile.searchQueries[0]?.query
  const lastAssistantQuestion = profile.assistantQuestions[0]?.query

  return {
    expertise,
    technologies,
    concepts,
    contentTypes,
    recentTitles,
    recentKeywords: [...recentKeywords],
    topExpertise: topWeightedKeys(expertise, 4).map(slugToLabel),
    topTechnologies: topWeightedKeys(technologies, 4).map(slugToLabel),
    topConcepts: topWeightedKeys(concepts, 4).map(slugToLabel),
    intentTokens: buildIntentTokens(profile),
    lastSearchQuery,
    lastAssistantQuestion,
    recentlyViewed: profile.recentlyViewed,
    signalCount:
      profile.recentlyViewed.length +
      profile.searchQueries.length +
      profile.assistantQuestions.length,
  }
}

export function readVisitorInterest(): VisitorInterest | null {
  if (typeof window === "undefined") {
    return null
  }

  return buildVisitorInterest(readVisitorProfile())
}
