import type { EntityFormStep } from "@/features/admin/components/forms/entity-form-wizard"
import type { ExpertiseFormValues } from "@/features/admin/lib/schemas"

export const EXPERTISE_FORM_STEPS: EntityFormStep<keyof ExpertiseFormValues>[] =
  [
    {
      id: "identity",
      title: "Identity",
      description: "Title, slug, summary, and long-form description.",
      fields: ["title", "slug", "summary", "description"],
    },
    {
      id: "context",
      title: "Context",
      description: "Why it matters, keywords, related areas, and takeaways.",
      fields: [
        "why_it_matters",
        "keywords",
        "related_expertise_slugs",
        "key_takeaways",
      ],
    },
    {
      id: "publish",
      title: "Publish",
      description: "Featured flag, display order, and publishing status.",
      fields: ["featured", "display_order", "status"],
    },
  ]
