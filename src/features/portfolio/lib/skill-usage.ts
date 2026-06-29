import {
  normalizeSkillKey,
  type SkillsShowcaseCategory,
} from "@/features/portfolio/lib/skills-showcase"
import type {
  Experience,
  Project,
  Skill,
} from "@/shared/types/database.helpers"

export type SkillUsageProject = {
  id: string
  slug: string
  title: string
  summary?: string | null
  tagline?: string | null
  impact?: string | null
  icon_name?: string | null
}

export type SkillUsageExperience = {
  id: string
  role: string
  company: string
}

export type SkillDetailRow = {
  id: string
  name: string
  label: string
  icon: string
  category: SkillsShowcaseCategory
  dbCategory: Skill["category"] | null
  proficiency: Skill["proficiency"]
  projects: SkillUsageProject[]
  experience: SkillUsageExperience[]
}

export function skillMatchesTech(skillName: string, tech: string): boolean {
  return normalizeSkillKey(skillName) === normalizeSkillKey(tech)
}

function dedupeProjects(items: SkillUsageProject[]): SkillUsageProject[] {
  const seen = new Set<string>()
  return items.filter((item) => {
    if (seen.has(item.id)) return false
    seen.add(item.id)
    return true
  })
}

function dedupeExperience(
  items: SkillUsageExperience[]
): SkillUsageExperience[] {
  const seen = new Set<string>()
  return items.filter((item) => {
    if (seen.has(item.id)) return false
    seen.add(item.id)
    return true
  })
}

export function findProjectsForTechName(
  name: string,
  projects: Array<
    Pick<Project, "id" | "slug" | "title" | "tech_stack"> &
      Partial<Pick<Project, "summary" | "tagline" | "impact" | "icon_name">>
  >
): SkillUsageProject[] {
  return dedupeProjects(
    projects
      .filter((project) =>
        (project.tech_stack ?? []).some((tech) => skillMatchesTech(name, tech))
      )
      .map((project) => ({
        id: project.id,
        slug: project.slug,
        title: project.title,
        summary: project.summary,
        tagline: project.tagline,
        impact: project.impact,
        icon_name: project.icon_name,
      }))
  )
}

export function findExperienceForTechName(
  name: string,
  experience: Pick<Experience, "id" | "role" | "company" | "tech_stack">[]
): SkillUsageExperience[] {
  return dedupeExperience(
    experience
      .filter((entry) =>
        (entry.tech_stack ?? []).some((tech) => skillMatchesTech(name, tech))
      )
      .map((entry) => ({
        id: entry.id,
        company: entry.company,
        role: entry.role,
      }))
  )
}

export function formatSkillProficiency(
  proficiency: Skill["proficiency"]
): string | null {
  if (!proficiency) return null

  return proficiency.charAt(0).toUpperCase() + proficiency.slice(1)
}

export const SKILL_DB_CATEGORY_LABELS: Record<Skill["category"], string> = {
  ai_ml: "AI / ML",
  language: "Language",
  framework: "Framework",
  tool: "Tool",
  cloud: "Cloud",
  soft: "Soft Skill",
  other: "Other",
}
