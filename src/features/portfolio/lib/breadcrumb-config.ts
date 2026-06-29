export const BREADCRUMB_SEGMENT_LABELS: Record<string, string> = {
  about: "About",
  automations: "Automations",
  blog: "Writing",
  contact: "Contact",
  experience: "Experience",
  projects: "Projects",
  stack: "Stack",
  research: "Research",
  resume: "Resume",
  expertise: "Expertise",
  technology: "Technologies",
  concept: "Concepts",
  explore: "Explore",
  search: "Search",
}

export function formatBreadcrumbSegment(segment: string): string {
  return segment
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}
