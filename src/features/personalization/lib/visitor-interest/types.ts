import type {
  DiscoveryDocument,
  DiscoveryDocumentType,
} from "@/features/discovery/lib/types"

export type VisitorSearchSignal = {
  query: string
  resultCount?: number
  timestamp: string
}

export type VisitorAssistantSignal = {
  query: string
  timestamp: string
}

export type StoredVisitorProfile = {
  version: 1
  recentlyViewed: DiscoveryDocument[]
  searchQueries: VisitorSearchSignal[]
  assistantQuestions: VisitorAssistantSignal[]
  updatedAt: string
}

export type VisitorInterest = {
  expertise: Record<string, number>
  technologies: Record<string, number>
  concepts: Record<string, number>
  contentTypes: Record<DiscoveryDocumentType, number>
  recentTitles: string[]
  recentKeywords: string[]
  topExpertise: string[]
  topTechnologies: string[]
  topConcepts: string[]
  intentTokens: string[]
  lastSearchQuery?: string
  lastAssistantQuestion?: string
  recentlyViewed: DiscoveryDocument[]
  signalCount: number
}

export type VisitorInterestWeights = {
  intentToken: number
  expertise: number
  technology: number
  concept: number
  recentTitle: number
  lastSearch: number
  lastAssistant: number
}
