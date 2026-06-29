export type KnowledgeEntityType =
  | "project"
  | "research"
  | "writing"
  | "automation"
  | "expertise"
  | "technology"
  | "concept"

export type KnowledgeRelationType =
  | "uses_expertise"
  | "uses_technology"
  | "mentions_concept"
  | "related_to"
  | "related_expertise"
  | "authored_by"

export type KnowledgeEntity = {
  id: string
  type: KnowledgeEntityType
  slug: string
  title: string
  description?: string | null
  url: string
  publishedAt?: string | null
  updatedAt?: string | null
  metadata?: Record<string, string | string[] | null>
}

export type KnowledgeRelation = {
  id: string
  sourceId: string
  targetId: string
  type: KnowledgeRelationType
  weight?: number
}

export type ExpertiseAreaRecord = {
  id: string
  title: string
  slug: string
  description: string | null
  summary: string | null
  why_it_matters: string | null
  key_takeaways: string[]
  keywords: string[]
  related_expertise_slugs: string[]
  icon_name: string | null
  featured: boolean
  display_order: number
}

export type TechnologyRegistryRecord = {
  id: string
  title: string
  slug: string
  description: string | null
  summary: string | null
  category: string | null
  website_url: string | null
  documentation_url: string | null
  featured: boolean
  display_order: number
}

export type ConceptRegistryRecord = {
  id: string
  title: string
  slug: string
  description: string | null
  summary: string | null
  why_it_matters: string | null
  related_concept_slugs: string[]
  related_expertise_slugs: string[]
  featured: boolean
  display_order: number
}

export type TechnologyRecord = {
  slug: string
  name: string
  category?: string | null
  registered?: boolean
}

export type ConceptRecord = {
  slug: string
  title: string
  registered?: boolean
}

export type KnowledgeGraphPayload = {
  entities: KnowledgeEntity[]
  relationships: KnowledgeRelation[]
  expertise: ExpertiseAreaRecord[]
  technologies: TechnologyRecord[]
  concepts: ConceptRecord[]
}

export type RelatedKnowledgeBundle = {
  expertise: KnowledgeEntity[]
  technologies: KnowledgeEntity[]
  concepts: KnowledgeEntity[]
  projects: KnowledgeEntity[]
  research: KnowledgeEntity[]
  writing: KnowledgeEntity[]
  automations: KnowledgeEntity[]
}
