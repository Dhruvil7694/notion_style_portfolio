import type { EntityFormStep } from "@/features/admin/components/forms/entity-form-wizard"

export const ABOUT_FORM_STEPS: EntityFormStep[] = [
  {
    id: "opening",
    title: "Photo & opening",
    description: "About page photo and opening paragraphs.",
    fields: ["owner_avatar_about", "intro", "intro_tools", "career_intro"],
  },
  {
    id: "story",
    title: "Story sections",
    description: "Long-form paragraphs that make up the About narrative.",
    fields: ["after_umbrella", "retrieval", "ownership", "outside", "mcp"],
  },
  {
    id: "tags",
    title: "Tags & keywords",
    description: "About page tags and homepage animated tool keywords.",
    fields: ["tags", "flip_keywords"],
  },
]
