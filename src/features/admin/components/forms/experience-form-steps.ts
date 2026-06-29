import type { EntityFormStep } from "@/features/admin/components/forms/entity-form-wizard"
import type { ExperienceFormValues } from "@/features/admin/lib/schemas"

export const EXPERIENCE_FORM_STEPS: EntityFormStep<
  keyof ExperienceFormValues
>[] = [
  {
    id: "role",
    title: "Role",
    description: "Company, role, location, and employment dates.",
    fields: ["company", "role", "location", "start_date", "end_date"],
  },
  {
    id: "details",
    title: "Details",
    description: "Role description, achievements, and technologies used.",
    fields: ["description", "achievements", "tech_stack"],
  },
]
