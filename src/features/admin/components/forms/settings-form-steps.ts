import type { EntityFormStep } from "@/features/admin/components/forms/entity-form-wizard"

export const SETTINGS_FORM_STEPS: EntityFormStep[] = [
  {
    id: "social-primary",
    title: "Social links",
    description: "Primary professional and publishing profiles.",
    fields: [
      "social.github",
      "social.linkedin",
      "social.twitter",
      "social.substack",
      "social.medium",
      "social.devto",
    ],
  },
  {
    id: "social-other",
    title: "More platforms",
    description: "Community and additional social profiles.",
    fields: [
      "social.discord",
      "social.youtube",
      "social.bluesky",
      "social.threads",
      "social.instagram",
    ],
  },
  {
    id: "contact",
    title: "Contact & site",
    description: "Email, location, Calendly, and canonical site URL.",
    fields: [
      "contact.email",
      "contact.location",
      "contact.calendly_url",
      "site_url",
    ],
  },
]
