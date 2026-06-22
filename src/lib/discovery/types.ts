export type DiscoveryDocumentType =
  | "project"
  | "research"
  | "article"
  | "automation"
  | "expertise"
  | "technology"
  | "concept"

export type DiscoveryDocument = {
  id: string
  type: DiscoveryDocumentType
  title: string
  description: string
  slug: string
  url: string
  keywords: string[]
  expertise: string[]
  technologies: string[]
  concepts: string[]
  popularity: number
  updatedAt: string
  /** Reserved for Phase 17 vector search */
  embedding?: number[]
  /** Reserved for Phase 17 hybrid ranking */
  semanticScore?: number
}

export type DiscoverySearchContext = {
  expertise?: string[]
  technologies?: string[]
  concepts?: string[]
  relatedIds?: string[]
}

export type DiscoverySearchResult = DiscoveryDocument & {
  score: number
}

export type GroupedDiscoveryResults = {
  type: DiscoveryDocumentType
  label: string
  items: DiscoverySearchResult[]
}

export type TopicCluster = {
  id: string
  title: string
  anchorType: "expertise" | "concept" | "technology"
  anchorSlug: string
  projects: DiscoveryDocument[]
  research: DiscoveryDocument[]
  articles: DiscoveryDocument[]
  automations: DiscoveryDocument[]
  concepts: DiscoveryDocument[]
  technologies: DiscoveryDocument[]
  expertise: DiscoveryDocument[]
}

export type EntityNavigationBundle = {
  relatedExpertise: DiscoveryDocument[]
  relatedTechnologies: DiscoveryDocument[]
  relatedConcepts: DiscoveryDocument[]
  relatedContent: DiscoveryDocument[]
}

export type DiscoveryIndexPayload = {
  documents: DiscoveryDocument[]
  generatedAt: string
}

export const DISCOVERY_TYPE_LABELS: Record<DiscoveryDocumentType, string> = {
  project: "Projects",
  research: "Research",
  article: "Writing",
  automation: "Automations",
  expertise: "Expertise",
  technology: "Technologies",
  concept: "Concepts",
}

export const DISCOVERY_TYPE_ORDER: DiscoveryDocumentType[] = [
  "project",
  "research",
  "article",
  "automation",
  "expertise",
  "technology",
  "concept",
]
