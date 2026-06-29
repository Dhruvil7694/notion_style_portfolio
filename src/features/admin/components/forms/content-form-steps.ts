import type { EntityFormStep } from "@/features/admin/components/forms/entity-form-wizard"
import type { ContentFormValues } from "@/features/admin/lib/schemas"

export const CONTENT_FORM_STEPS: EntityFormStep<keyof ContentFormValues>[] = [
  {
    id: "basics",
    title: "Basics",
    description: "Type, title, slug, excerpt, tags, and publishing status.",
    fields: ["type", "title", "slug", "excerpt", "tags", "status"],
  },
  {
    id: "body",
    title: "Body",
    description: "Rich text content for the public page.",
    fields: ["content"],
  },
  {
    id: "knowledge",
    title: "Knowledge graph",
    description: "AI summary, takeaways, expertise links, concepts, and FAQ.",
    fields: [
      "ai_summary",
      "key_takeaways",
      "expertise_slugs",
      "concepts",
      "faq",
    ],
  },
]
