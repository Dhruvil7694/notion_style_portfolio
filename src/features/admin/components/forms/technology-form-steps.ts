import type { EntityFormStep } from "@/features/admin/components/forms/entity-form-wizard"
import type { TechnologyFormValues } from "@/features/admin/lib/schemas"

export const TECHNOLOGY_FORM_STEPS: EntityFormStep<
  keyof TechnologyFormValues
>[] = [
  {
    id: "identity",
    title: "Identity",
    description: "Title, slug, category, and summary.",
    fields: ["title", "slug", "category", "summary"],
  },
  {
    id: "content",
    title: "Content",
    description: "Full description and external documentation links.",
    fields: ["description", "website_url", "documentation_url"],
  },
  {
    id: "publish",
    title: "Publish",
    description: "Featured flag, display order, and publishing status.",
    fields: ["featured", "display_order", "status"],
  },
]
