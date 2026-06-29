export type HealthRule = {
  id: string
  label: string
  points: number
  required: boolean
}

export type ContentHealthRules = {
  projects: HealthRule[]
  content: HealthRule[]
}

export const HEALTH_RULES: ContentHealthRules = {
  projects: [
    { id: "title", label: "Has title", points: 5, required: true },
    { id: "slug", label: "Has slug", points: 5, required: true },
    { id: "summary", label: "Has summary", points: 10, required: true },
    { id: "overview", label: "Has overview", points: 8, required: false },
    {
      id: "problem_statement",
      label: "Has problem statement",
      points: 8,
      required: false,
    },
    {
      id: "tech_stack",
      label: "Has tech stack",
      points: 5,
      required: false,
    },
    {
      id: "cover_image",
      label: "Has cover image",
      points: 8,
      required: false,
    },
    {
      id: "screenshots",
      label: "Has screenshots",
      points: 8,
      required: false,
    },
    {
      id: "ai_summary",
      label: "Has AI summary",
      points: 6,
      required: false,
    },
    { id: "faq", label: "Has FAQ items", points: 5, required: false },
    { id: "og_title", label: "Has OG title", points: 5, required: false },
    {
      id: "og_description",
      label: "Has OG description",
      points: 5,
      required: false,
    },
    {
      id: "results_metrics",
      label: "Has results/metrics",
      points: 8,
      required: false,
    },
    { id: "learnings", label: "Has learnings", points: 5, required: false },
    {
      id: "expertise_slugs",
      label: "Linked to expertise",
      points: 5,
      required: false,
    },
  ],
  content: [
    { id: "title", label: "Has title", points: 5, required: true },
    { id: "slug", label: "Has slug", points: 5, required: true },
    { id: "summary", label: "Has summary", points: 10, required: true },
    {
      id: "cover_image",
      label: "Has cover image",
      points: 10,
      required: false,
    },
    {
      id: "ai_summary",
      label: "Has AI summary",
      points: 8,
      required: false,
    },
    { id: "faq", label: "Has FAQ", points: 8, required: false },
    { id: "og_title", label: "Has OG title", points: 5, required: false },
    {
      id: "og_description",
      label: "Has OG description",
      points: 5,
      required: false,
    },
  ],
}
