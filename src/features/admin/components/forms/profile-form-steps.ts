import type { EntityFormStep } from "@/features/admin/components/forms/entity-form-wizard"

export const PROFILE_FORM_STEPS: EntityFormStep[] = [
  {
    id: "identity",
    title: "Identity",
    description: "Homepage photo, name, title, and short bio.",
    fields: [
      "owner_avatar",
      "owner_name",
      "owner_title",
      "site_name",
      "site_description",
    ],
  },
  {
    id: "presence",
    title: "Presence",
    description:
      "Status bubble, current focus, and workspace activity signals.",
    fields: [
      "custom_status",
      "status_enabled",
      "current_project",
      "currently_building",
      "currently_reading",
      "next_project",
    ],
  },
  {
    id: "highlights",
    title: "Highlights",
    description:
      "Focus areas, proof metrics, and experience summary for the homepage.",
    fields: ["focus_areas", "selected_metrics", "experience_summary"],
  },
]
