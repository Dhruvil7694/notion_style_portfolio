import type { DiscoveryDocument } from "@/features/discovery/lib/types"

import {
  LEGACY_RECENTLY_VIEWED_KEY,
  MAX_ASSISTANT_QUESTIONS,
  MAX_RECENTLY_VIEWED,
  MAX_SEARCH_QUERIES,
  VISITOR_INTEREST_EVENT,
  VISITOR_PROFILE_KEY,
} from "./constants"
import type {
  StoredVisitorProfile,
  VisitorAssistantSignal,
  VisitorSearchSignal,
} from "./types"

function emptyProfile(): StoredVisitorProfile {
  return {
    version: 1,
    recentlyViewed: [],
    searchQueries: [],
    assistantQuestions: [],
    updatedAt: new Date().toISOString(),
  }
}

function readLegacyRecentlyViewed(): DiscoveryDocument[] {
  if (typeof window === "undefined") {
    return []
  }

  try {
    const raw = window.localStorage.getItem(LEGACY_RECENTLY_VIEWED_KEY)
    if (!raw) {
      return []
    }

    const parsed = JSON.parse(raw) as DiscoveryDocument[]
    return Array.isArray(parsed) ? parsed.slice(0, MAX_RECENTLY_VIEWED) : []
  } catch {
    return []
  }
}

export function readVisitorProfile(): StoredVisitorProfile {
  if (typeof window === "undefined") {
    return emptyProfile()
  }

  try {
    const raw = window.localStorage.getItem(VISITOR_PROFILE_KEY)
    if (!raw) {
      const legacy = readLegacyRecentlyViewed()
      if (legacy.length === 0) {
        return emptyProfile()
      }

      return {
        ...emptyProfile(),
        recentlyViewed: legacy,
        updatedAt: new Date().toISOString(),
      }
    }

    const parsed = JSON.parse(raw) as StoredVisitorProfile
    if (parsed.version !== 1 || !Array.isArray(parsed.recentlyViewed)) {
      return emptyProfile()
    }

    return {
      version: 1,
      recentlyViewed: parsed.recentlyViewed.slice(0, MAX_RECENTLY_VIEWED),
      searchQueries: Array.isArray(parsed.searchQueries)
        ? parsed.searchQueries.slice(0, MAX_SEARCH_QUERIES)
        : [],
      assistantQuestions: Array.isArray(parsed.assistantQuestions)
        ? parsed.assistantQuestions.slice(0, MAX_ASSISTANT_QUESTIONS)
        : [],
      updatedAt: parsed.updatedAt ?? new Date().toISOString(),
    }
  } catch {
    return emptyProfile()
  }
}

function writeVisitorProfile(profile: StoredVisitorProfile): void {
  if (typeof window === "undefined") {
    return
  }

  const next: StoredVisitorProfile = {
    ...profile,
    updatedAt: new Date().toISOString(),
  }

  window.localStorage.setItem(VISITOR_PROFILE_KEY, JSON.stringify(next))
  window.localStorage.setItem(
    LEGACY_RECENTLY_VIEWED_KEY,
    JSON.stringify(next.recentlyViewed)
  )
  window.dispatchEvent(new CustomEvent(VISITOR_INTEREST_EVENT))
}

export function writeRecentlyViewed(document: DiscoveryDocument): void {
  const profile = readVisitorProfile()
  const recentlyViewed = [
    document,
    ...profile.recentlyViewed.filter((item) => item.id !== document.id),
  ].slice(0, MAX_RECENTLY_VIEWED)

  writeVisitorProfile({
    ...profile,
    recentlyViewed,
  })
}

export function appendSearchQuery(query: string, resultCount?: number): void {
  const trimmed = query.trim()
  if (!trimmed) {
    return
  }

  const profile = readVisitorProfile()
  const timestamp = new Date().toISOString()
  const nextSignal: VisitorSearchSignal = {
    query: trimmed,
    resultCount,
    timestamp,
  }

  const searchQueries = [
    nextSignal,
    ...profile.searchQueries.filter((item) => item.query !== trimmed),
  ].slice(0, MAX_SEARCH_QUERIES)

  writeVisitorProfile({
    ...profile,
    searchQueries,
  })
}

export function appendAssistantQuestion(query: string): void {
  const trimmed = query.trim()
  if (!trimmed) {
    return
  }

  const profile = readVisitorProfile()
  const timestamp = new Date().toISOString()
  const nextSignal: VisitorAssistantSignal = {
    query: trimmed,
    timestamp,
  }

  const assistantQuestions = [
    nextSignal,
    ...profile.assistantQuestions.filter((item) => item.query !== trimmed),
  ].slice(0, MAX_ASSISTANT_QUESTIONS)

  writeVisitorProfile({
    ...profile,
    assistantQuestions,
  })
}

export function subscribeVisitorInterest(onChange: () => void): () => void {
  if (typeof window === "undefined") {
    return () => {}
  }

  const handler = () => onChange()
  window.addEventListener(VISITOR_INTEREST_EVENT, handler)
  window.addEventListener("storage", handler)

  return () => {
    window.removeEventListener(VISITOR_INTEREST_EVENT, handler)
    window.removeEventListener("storage", handler)
  }
}
