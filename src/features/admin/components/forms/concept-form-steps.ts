import type { EntityFormStep } from "@/features/admin/components/forms/entity-form-wizard"
import type { ConceptFormValues } from "@/features/admin/lib/schemas"

export const CONCEPT_FORM_STEPS: EntityFormStep<keyof ConceptFormValues>[] = [
  {
    id: "identity",
    title: "Identity",
    description: "Title, slug, summary, and description.",
    fields: ["title", "slug", "summary", "description"],
  },
  {
    id: "relationships",
    title: "Relationships",
    description: "Why it matters and links to related concepts and expertise.",
    fields: [
      "why_it_matters",
      "related_concept_slugs",
      "related_expertise_slugs",
    ],
  },
  {
    id: "publish",
    title: "Publish",
    description: "Featured flag, display order, and publishing status.",
    fields: ["featured", "display_order", "status"],
  },
]
